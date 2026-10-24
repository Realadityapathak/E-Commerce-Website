import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  addToCart,
  removeFromCart,
  toggleCartItemQuantity,
  getCartTotals,
  isValidCartItem,
  MAX_QUANTITY_PER_ITEM,
} from './cart.mjs';

const A = { _id: 'a', name: 'Headphones A', price: 1000 };
const B = { _id: 'b', name: 'Headphones B', price: 500.5 };

describe('addToCart', () => {
  it('adds a new item with the requested quantity', () => {
    const cart = addToCart([], A, 2);
    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 2);
  });

  it('does not mutate the product passed in', () => {
    const product = { ...A };
    addToCart([], product, 3);
    assert.equal('quantity' in product, false);
  });

  // Regression test for the original bug: re-adding a non-first item
  // produced [undefined, {...}] and crashed Cart.jsx.
  it('re-adding an existing non-first item keeps every item (A, B, A)', () => {
    let cart = addToCart([], A, 1);
    cart = addToCart(cart, B, 1);
    cart = addToCart(cart, A, 2);

    assert.equal(cart.length, 2);
    assert.ok(cart.every((item) => item && typeof item === 'object'));
    assert.deepEqual(
      cart.map((i) => [i._id, i.quantity]),
      [
        ['a', 3],
        ['b', 1],
      ]
    );
  });

  it('caps quantity per item', () => {
    const cart = addToCart([], A, MAX_QUANTITY_PER_ITEM + 50);
    assert.equal(cart[0].quantity, MAX_QUANTITY_PER_ITEM);
  });

  it('ignores products without an _id', () => {
    assert.deepEqual(addToCart([], { name: 'nope' }, 1), []);
  });
});

describe('toggleCartItemQuantity', () => {
  const seed = () => addToCart(addToCart([], A, 1), B, 2);

  it('preserves item order on increment/decrement', () => {
    const inc = toggleCartItemQuantity(seed(), 'a', 'inc');
    assert.deepEqual(
      inc.map((i) => i._id),
      ['a', 'b']
    );
    assert.equal(inc[0].quantity, 2);
  });

  it('never decrements below 1', () => {
    const dec = toggleCartItemQuantity(seed(), 'a', 'dec');
    assert.equal(dec[0].quantity, 1);
  });

  it('is a no-op for unknown ids / actions', () => {
    assert.deepEqual(toggleCartItemQuantity(seed(), 'zzz', 'inc'), seed());
    assert.deepEqual(toggleCartItemQuantity(seed(), 'a', 'sideways'), seed());
  });
});

describe('removeFromCart + getCartTotals', () => {
  it('removes only the target and totals stay derived & rounded', () => {
    let cart = addToCart([], A, 2);
    cart = addToCart(cart, B, 3);
    cart = removeFromCart(cart, 'a');

    assert.deepEqual(
      cart.map((i) => i._id),
      ['b']
    );
    // 500.5 * 3 = 1501.5 exactly; totals are derived, never hand-synced.
    assert.deepEqual(getCartTotals(cart), {
      totalPrice: 1501.5,
      totalQuantities: 3,
    });
  });

  it('handles float-prone prices', () => {
    const cart = addToCart([], { _id: 'x', price: 19.99 }, 3);
    assert.equal(getCartTotals(cart).totalPrice, 59.97);
  });

  it('totals of an empty/invalid cart are zero', () => {
    assert.deepEqual(getCartTotals([]), { totalPrice: 0, totalQuantities: 0 });
    assert.deepEqual(getCartTotals(undefined), {
      totalPrice: 0,
      totalQuantities: 0,
    });
  });
});

describe('isValidCartItem', () => {
  it('accepts well-formed items and rejects junk from storage', () => {
    assert.equal(isValidCartItem({ _id: 'a', price: 10, quantity: 1 }), true);
    assert.equal(isValidCartItem(null), false);
    assert.equal(isValidCartItem({ price: 10, quantity: 1 }), false);
    assert.equal(isValidCartItem({ _id: 'a', price: 'x', quantity: 1 }), false);
    assert.equal(isValidCartItem({ _id: 'a', price: 10, quantity: 0 }), false);
  });
});
