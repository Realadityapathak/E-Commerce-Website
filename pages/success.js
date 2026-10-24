import React, { useEffect } from 'react';
import Link from 'next/link';
import Stripe from 'stripe';
import { BsBagCheckFill } from 'react-icons/bs';
import { AiOutlineExclamationCircle } from 'react-icons/ai';

import { useStateContext } from '../context/StateContext';
import { runFireworks } from '../lib/utils';
import { getPaymentVerification } from '../lib/order.mjs';

/**
 * paymentStatus (from getServerSideProps):
 *  - 'paid'    Stripe confirmed the payment -> clear cart, celebrate.
 *  - 'unpaid'  Stripe definitively says unpaid -> do NOT clear the cart
 *              or claim success; let the shopper retry.
 *  - 'unknown' verification unavailable (no key / Stripe error) -> keep
 *              the previous behaviour rather than punishing the shopper
 *              for our outage. Soft enforcement by design.
 *  - 'none'    no session_id in the URL (direct visit / legacy link) ->
 *              previous behaviour.
 */
const Success = ({ paymentStatus = 'none' }) => {
  const { clearCart } = useStateContext();
  const isUnpaid = paymentStatus === 'unpaid';

  useEffect(() => {
    if (isUnpaid) return; // cart preserved so checkout can be retried
    // Only clear our cart. The previous localStorage.clear() wiped every
    // key on the origin (auth, preferences, future features).
    clearCart();
    runFireworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isUnpaid) {
    return (
      <div className="success-wrapper">
        <div className="success">
          <p className="icon">
            <AiOutlineExclamationCircle />
          </p>
          <h2>Payment not completed</h2>
          <p className="email-msg">
            We couldn&apos;t confirm your payment. Your cart is still saved —
            you can review it and try checking out again.
          </p>
          <Link href="/">
            <button type="button" className="btn">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="success-wrapper">
      <div className="success">
        <p className="icon">
          <BsBagCheckFill />
        </p>
        <h2>Thank you for your order!</h2>
        {paymentStatus === 'paid' && (
          <p className="email-msg">Payment confirmed.</p>
        )}
        <p className="email-msg">Check your email inbox for the receipt.</p>
        <p className="description">
          If you have any questions, please email
          <a className="email" href="mailto:order@example.com">
            order@example.com
          </a>
        </p>
        <Link href="/">
          <button type="button" className="btn">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  )
}

export const getServerSideProps = async ({ query }) => {
  const sessionId = typeof query.session_id === 'string' ? query.session_id : null;

  if (!sessionId) {
    return { props: { paymentStatus: 'none' } };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { props: { paymentStatus: 'unknown' } };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { props: { paymentStatus: getPaymentVerification(session) } };
  } catch (error) {
    // Soft enforcement: a Stripe/network error must not turn a paying
    // customer's success page into an error page. The webhook remains
    // the source of truth for the actual order.
    console.error('[pages/success] Session verification failed:', error.message);
    return { props: { paymentStatus: 'unknown' } };
  }
};

export default Success
