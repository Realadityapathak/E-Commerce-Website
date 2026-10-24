import Stripe from 'stripe';

import { serverClient, urlFor } from '../../lib/client';
import { MAX_QUANTITY_PER_ITEM } from '../../lib/cart.mjs';

const MAX_CART_ITEMS = 50;

// Fallback keeps today's behaviour until STRIPE_SHIPPING_RATE_ID is set in
// the environment; the hardcoded rate only exists in the original account.
const DEFAULT_SHIPPING_RATE = 'shr_1SB9CaIJHIHF97eiT8bi8YzS';

const getBaseUrl = (req) => {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin;
  return (configured || 'http://localhost:3000').replace(/\/$/, '');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[api/stripe] STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Payment is not configured.' });
  }

  try {
    const body = req.body;

    // --- Validate the request shape -------------------------------------
    // The client still sends the same payload as before (full cart items);
    // we only trust `_id` + `quantity` from it. Prices/names/images are
    // re-fetched from Sanity, the system of record.
    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (body.length > MAX_CART_ITEMS) {
      return res.status(400).json({ error: 'Cart has too many items.' });
    }

    const quantityById = new Map();
    for (const item of body) {
      const id = item && typeof item._id === 'string' ? item._id : null;
      const quantity = Math.floor(Number(item?.quantity));
      if (!id || !Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'Invalid cart item.' });
      }
      quantityById.set(
        id,
        Math.min(
          (quantityById.get(id) || 0) + quantity,
          MAX_QUANTITY_PER_ITEM
        )
      );
    }

    // --- Re-price server-side -------------------------------------------
    const ids = [...quantityById.keys()];
    const products = await serverClient.fetch(
      `*[_type == "product" && _id in $ids]{ _id, name, price, image }`,
      { ids }
    );
    const productById = new Map((products || []).map((p) => [p._id, p]));

    const unknownId = ids.find((id) => !productById.has(id));
    if (unknownId) {
      return res.status(400).json({ error: 'A cart item is unavailable.' });
    }

    const line_items = ids.map((id) => {
      const product = productById.get(id);
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for product ${id}`);
      }

      const imageBuilder = product.image?.[0]
        ? urlFor(product.image[0])
        : null;
      const imageUrl = imageBuilder ? imageBuilder.url() : null;

      return {
        price_data: {
          currency: 'inr',
          product_data: {
            name: product.name,
            // Lets the webhook map Stripe line items back to Sanity
            // products when persisting the order.
            metadata: { productId: id },
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          // Integer minor units — Math.round fixes 19.99 * 100 = 1998.99…
          unit_amount: Math.round(price * 100),
        },
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
        quantity: quantityById.get(id),
      };
    });

    // --- Create the Checkout Session ------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      submit_type: 'pay',
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      shipping_options: [
        {
          shipping_rate:
            process.env.STRIPE_SHIPPING_RATE_ID || DEFAULT_SHIPPING_RATE,
        },
      ],
      line_items,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/canceled`,
    });

    return res.status(200).json(session);
  } catch (err) {
    // Log the real error server-side; never leak provider internals to clients.
    console.error('[api/stripe] Checkout session failed:', err);
    const statusCode =
      err && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    return res
      .status(statusCode)
      .json({ error: 'Unable to start checkout. Please try again.' });
  }
}
