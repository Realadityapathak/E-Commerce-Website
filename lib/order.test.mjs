import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOrderDocument,
  getOrderStatusForEvent,
  getPaymentVerification,
  normalizeLineItem,
} from './order.mjs';

const session = {
  id: 'cs_test_123',
  payment_intent: 'pi_123',
  payment_status: 'paid',
  customer_details: { email: 'buyer@example.com' },
  amount_total: 550050,
  amount_subtotal: 500050,
  currency: 'inr',
  created: 1700000000,
};

const lineItems = [
  {
    description: 'Headphones A',
    quantity: 2,
    amount_total: 200000,
    price: {
      unit_amount: 100000,
      product: { name: 'Headphones A', metadata: { productId: 'prod-a' } },
    },
  },
  {
    description: 'Speaker B',
    quantity: 1,
    amount_total: 350050,
    price: { unit_amount: 350050, product: 'prod_stripe_string_id' },
  },
];

describe('buildOrderDocument', () => {
  it('maps a paid session to a deterministic, idempotent order doc', () => {
    const doc = buildOrderDocument(session, lineItems, 'paid');
    assert.equal(doc._id, 'order.cs_test_123');
    assert.equal(doc._type, 'order');
    assert.equal(doc.status, 'paid');
    assert.equal(doc.customerEmail, 'buyer@example.com');
    assert.equal(doc.amountTotal, 5500.5);
    assert.equal(doc.items.length, 2);
    assert.equal(doc.orderedAt, new Date(1700000000 * 1000).toISOString());
  });

  it('converts minor units and carries our Sanity productId from metadata', () => {
    const doc = buildOrderDocument(session, lineItems, 'paid');
    assert.deepEqual(doc.items[0], {
      _key: 'prod-a-0',
      productId: 'prod-a',
      name: 'Headphones A',
      unitAmount: 1000,
      quantity: 2,
      amountTotal: 2000,
    });
    // Unexpanded product (string id) still produces a usable snapshot.
    assert.equal(doc.items[1].name, 'Speaker B');
    assert.equal(doc.items[1].productId, undefined);
    assert.equal(doc.items[1].amountTotal, 3500.5);
  });

  it('rejects sessions without a usable id', () => {
    assert.equal(buildOrderDocument(null), null);
    assert.equal(buildOrderDocument({}), null);
    assert.equal(buildOrderDocument({ id: 42 }), null);
  });

  it('is stable across webhook redeliveries (same input -> same _id)', () => {
    assert.equal(
      buildOrderDocument(session, lineItems, 'paid')._id,
      buildOrderDocument(session, lineItems, 'paid')._id
    );
  });
});

describe('normalizeLineItem', () => {
  it('rejects junk and defaults quantity to 1', () => {
    assert.equal(normalizeLineItem(null), null);
    assert.equal(normalizeLineItem('x'), null);
    assert.equal(normalizeLineItem({ description: 'X' }).quantity, 1);
  });
});

describe('getOrderStatusForEvent / getPaymentVerification', () => {
  it('maps event types to stored statuses', () => {
    assert.equal(getOrderStatusForEvent('checkout.session.completed', session), 'paid');
    assert.equal(
      getOrderStatusForEvent('checkout.session.completed', { payment_status: 'unpaid' }),
      'pending'
    );
    assert.equal(getOrderStatusForEvent('checkout.session.expired', session), 'expired');
    assert.equal(getOrderStatusForEvent('checkout.session.async_payment_failed', session), 'failed');
    assert.equal(getOrderStatusForEvent('payment_intent.created', session), null);
  });

  it('verifies payment status for the success page', () => {
    assert.equal(getPaymentVerification(session), 'paid');
    assert.equal(getPaymentVerification({ payment_status: 'unpaid' }), 'unpaid');
    assert.equal(getPaymentVerification(null), 'unknown');
  });
});
