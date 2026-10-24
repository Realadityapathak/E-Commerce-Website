import Stripe from 'stripe';

import { writeClient } from '../../lib/client';
import { buildOrderDocument, getOrderStatusForEvent } from '../../lib/order.mjs';

// Stripe signatures are computed over the exact raw bytes, so Next's
// automatic JSON body parsing must be disabled for this route.
export const config = {
  api: { bodyParser: false },
};

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
]);

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Persist an order for a checkout session, idempotently:
 * - document _id is deterministic (`order.<sessionId>`), so Stripe's
 *   at-least-once redeliveries converge on one document;
 * - a 'paid' order is never downgraded by a late/out-of-order event.
 */
async function upsertOrder(stripe, session, status) {
  let lineItems = [];
  try {
    const listed = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ['data.price.product'],
    });
    lineItems = listed.data || [];
  } catch (error) {
    // Totals on the session are still worth persisting without line items.
    console.error('[api/stripe-webhook] listLineItems failed:', error);
  }

  const doc = buildOrderDocument(session, lineItems, status);
  if (!doc) throw new Error('Could not build order document');

  const existing = await writeClient.getDocument(doc._id).catch(() => null);

  if (!existing) {
    await writeClient.create(doc);
    return;
  }

  if (existing.status === 'paid' && status !== 'paid') return; // never downgrade

  await writeClient
    .patch(doc._id)
    .set({
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      amountTotal: doc.amountTotal,
      amountSubtotal: doc.amountSubtotal,
      customerEmail: doc.customerEmail,
      stripePaymentIntent: doc.stripePaymentIntent,
      ...(doc.items.length ? { items: doc.items } : {}),
    })
    .commit();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    console.error(
      '[api/stripe-webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured'
    );
    // 500 (not 2xx) so Stripe keeps retrying until this is configured,
    // instead of orders being silently acknowledged-and-lost.
    return res.status(500).json({ error: 'Webhook is not configured.' });
  }

  if (!process.env.SANITY_API_WRITE_TOKEN && !process.env.SANITY_API_TOKEN) {
    console.error('[api/stripe-webhook] No Sanity write token configured');
    return res.status(500).json({ error: 'Order storage is not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    // Signature mismatch = forged/corrupted payload. 400 tells Stripe not
    // to retry; nothing is persisted.
    console.error('[api/stripe-webhook] Signature verification failed:', error.message);
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return res.status(200).json({ received: true, ignored: true });
  }

  const session = event.data.object;
  const status = getOrderStatusForEvent(event.type, session);
  if (!status || !session?.id) {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    await upsertOrder(stripe, session, status);
    return res.status(200).json({ received: true });
  } catch (error) {
    // 500 -> Stripe retries with backoff; upsert is idempotent, so safe.
    console.error('[api/stripe-webhook] Failed to persist order:', error);
    return res.status(500).json({ error: 'Failed to persist order.' });
  }
}
