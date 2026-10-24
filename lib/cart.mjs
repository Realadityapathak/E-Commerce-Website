/**
 * Pure cart logic — no React, no side effects, fully unit-testable.
 *
 * Contract preserved for callers (context/StateContext.js):
 *  - items are product-like objects keyed by `_id`, with numeric `price`
 *    and integer `quantity`.
 *  - functions never mutate their inputs and preserve item order.
 */

export const MAX_QUANTITY_PER_ITEM = 99;

const normalizeQuantity = (quantity, fallback = 1) => {
  const parsed = Math.floor(Number(quantity));
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_QUANTITY_PER_ITEM);
};

const normalizePrice = (price) => {
  const parsed = Number(price);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/** Add `quantity` of `product`; re-adding an existing item bumps it in place. */
export function addToCart(cartItems, product, quantity = 1) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  if (!product || !product._id) return items;

  const qty = normalizeQuantity(quantity);
  const exists = items.some((item) => item && item._id === product._id);

  if (exists) {
    // NOTE: previously non-matching items mapped to `undefined`, corrupting
    // the cart (A, B, A-again crashed the drawer). Every branch must return.
    return items.map((item) => {
      if (!item || item._id !== product._id) return item;
      return {
        ...item,
        quantity: Math.min(
          normalizeQuantity(item.quantity) + qty,
          MAX_QUANTITY_PER_ITEM
        ),
      };
    });
  }

  // Never mutate the caller's product object (`product.quantity = ...`).
  return [...items, { ...product, quantity: qty }];
}

export function removeFromCart(cartItems, productId) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  if (!productId) return items;
  return items.filter((item) => item && item._id !== productId);
}

/** Adjust quantity in place (order preserved); decrement never goes below 1. */
export function toggleCartItemQuantity(cartItems, id, value) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  if (!id || (value !== 'inc' && value !== 'dec')) return items;

  return items.map((item) => {
    if (!item || item._id !== id) return item;
    const current = normalizeQuantity(item.quantity);
    const next =
      value === 'inc'
        ? Math.min(current + 1, MAX_QUANTITY_PER_ITEM)
        : Math.max(current - 1, 1);
    return { ...item, quantity: next };
  });
}

/**
 * Derived totals — the single source of truth.
 * Totals are computed from items instead of being maintained by hand in
 * three places, which eliminates an entire class of drift bugs.
 */
export function getCartTotals(cartItems) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  let totalPrice = 0;
  let totalQuantities = 0;

  for (const item of items) {
    if (!item) continue;
    const qty = normalizeQuantity(item.quantity);
    totalQuantities += qty;
    totalPrice += normalizePrice(item.price) * qty;
  }

  // Round to paise/cents precision to avoid 1998.9999998-style float drift.
  return { totalPrice: Math.round(totalPrice * 100) / 100, totalQuantities };
}

/** Shape check used when hydrating a persisted cart from localStorage. */
export function isValidCartItem(item) {
  return Boolean(
    item &&
      typeof item === 'object' &&
      typeof item._id === 'string' &&
      item._id.length > 0 &&
      Number.isFinite(Number(item.price)) &&
      Number(item.quantity) >= 1
  );
}
