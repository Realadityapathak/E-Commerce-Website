/**
 * Pure mapping from Stripe Checkout objects to our Sanity `order` document.
 * No SDK calls here — fully unit-testable, and the deterministic `_id`
 * (`order.<sessionId>`) is what makes webhook redeliveries idempotent.
 */

const toMajorUnits = (minor) => {
  const parsed = Number(minor);
  return Number.isFinite(parsed) ? Math.round(parsed) / 100 : 0;
};

const sanitizeKey = (value, fallback) =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 64);

/**
 * Line items arrive from `stripe.checkout.sessions.listLineItems` with
 * `expand: ['data.price.product']`, so `price.product` may be an expanded
 * product object (whose metadata carries our Sanity productId), a product
 * id string, or missing entirely.
 */
export function normalizeLineItem(lineItem, index = 0) {
  if (!lineItem || typeof lineItem !== 'object') return null;

  const product =
    lineItem.price && typeof lineItem.price.product === 'object'
      ? lineItem.price.product
      : null;

  const productId = product?.metadata?.productId || null;
  const name =
    lineItem.description || product?.name || productId || 'Item';
  const quantity = Math.max(1, Math.floor(Number(lineItem.quantity)) || 1);

  return {
    _key: sanitizeKey(productId || name, `item-${index}`) + `-${index}`,
    productId: productId || undefined,
    name: String(name),
    unitAmount: toMajorUnits(lineItem.price?.unit_amount),
    quantity,
    amountTotal: toMajorUnits(lineItem.amount_total),
  };
}

/** Map a Stripe event to the order status we store; null = not an order event. */
export function getOrderStatusForEvent(eventType, session) {
  switch (eventType) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return session?.payment_status === 'paid' ? 'paid' : 'pending';
    case 'checkout.session.async_payment_failed':
      return 'failed';
    case 'checkout.session.expired':
      return 'expired';
    default:
      return null;
  }
}

/**
 * Build the Sanity order document. Returns null for sessions without a
 * usable id (defensive against malformed/unexpected payloads).
 */
export function buildOrderDocument(session, lineItems = [], status = 'paid') {
  if (!session || typeof session.id !== 'string' || !session.id) return null;

  const items = (Array.isArray(lineItems) ? lineItems : [])
    .map((item, i) => normalizeLineItem(item, i))
    .filter(Boolean);

  const createdAt =
    Number.isFinite(Number(session.created)) && Number(session.created) > 0
      ? new Date(Number(session.created) * 1000).toISOString()
      : new Date().toISOString();

  return {
    _id: `order.${session.id}`,
    _type: 'order',
    stripeSessionId: session.id,
    stripePaymentIntent:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || undefined,
    status,
    paymentStatus: session.payment_status || undefined,
    customerEmail:
      session.customer_details?.email || session.customer_email || undefined,
    amountTotal: toMajorUnits(session.amount_total),
    amountSubtotal: toMajorUnits(session.amount_subtotal),
    currency: session.currency ? String(session.currency) : undefined,
    items,
    orderedAt: createdAt,
  };
}

/** Soft verification states for the /success page. */
export function getPaymentVerification(session) {
  if (!session || typeof session !== 'object') return 'unknown';
  return session.payment_status === 'paid' ? 'paid' : 'unpaid';
}
