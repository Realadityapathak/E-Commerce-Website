import React from 'react';
import Link from 'next/link';
import { AiOutlineShopping } from 'react-icons/ai';

// Stripe sends shoppers here when they abandon checkout
// (cancel_url in pages/api/stripe.js). Previously this route didn't
// exist, so cancelling landed on a 404. The cart is intentionally left
// untouched so the shopper can resume.
const Canceled = () => (
  <div className="success-wrapper">
    <div className="success">
      <p className="icon">
        <AiOutlineShopping />
      </p>
      <h2>Checkout canceled</h2>
      <p className="email-msg">No payment was taken. Your cart is still saved.</p>
      <Link href="/">
        <button type="button" className="btn">
          Continue Shopping
        </button>
      </Link>
    </div>
  </div>
);

export default Canceled;
