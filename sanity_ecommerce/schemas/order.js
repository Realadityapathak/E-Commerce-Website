export default {
  name: 'order',
  title: 'Order',
  type: 'document',
  // Orders are created by the Stripe webhook (pages/api/stripe-webhook.js),
  // never by hand. Fields are read-only in Studio to keep a clean audit trail.
  fields: [
    {
      name: 'stripeSessionId',
      title: 'Stripe Session ID',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'stripePaymentIntent',
      title: 'Stripe Payment Intent',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'Paid', value: 'paid' },
          { title: 'Pending', value: 'pending' },
          { title: 'Failed', value: 'failed' },
          { title: 'Expired', value: 'expired' },
        ],
      },
    },
    {
      name: 'paymentStatus',
      title: 'Stripe Payment Status',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'amountTotal',
      title: 'Amount Total (major units, e.g. ₹)',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'amountSubtotal',
      title: 'Amount Subtotal (major units)',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'productId', title: 'Product ID (Sanity)', type: 'string', readOnly: true },
            { name: 'name', title: 'Name (snapshot)', type: 'string', readOnly: true },
            { name: 'unitAmount', title: 'Unit Amount', type: 'number', readOnly: true },
            { name: 'quantity', title: 'Quantity', type: 'number', readOnly: true },
            { name: 'amountTotal', title: 'Line Total', type: 'number', readOnly: true },
          ],
          preview: {
            select: { title: 'name', subtitle: 'quantity' },
          },
        },
      ],
    },
    {
      name: 'orderedAt',
      title: 'Ordered At',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'stripeSessionId',
      subtitle: 'customerEmail',
      status: 'status',
      amount: 'amountTotal',
    },
    prepare({ title, subtitle, status, amount }) {
      return {
        title: title || 'Order',
        subtitle: [status, subtitle, amount != null ? `₹${amount}` : null]
          .filter(Boolean)
          .join(' · '),
      };
    },
  },
};
