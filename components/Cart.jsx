import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineLeft, AiOutlineShopping } from 'react-icons/ai';
import { TiDeleteOutline } from 'react-icons/ti';
import toast from 'react-hot-toast';

import { useStateContext } from '../context/StateContext';
import { urlFor } from '../lib/client';
import getStripe from '../lib/getStripe';

const Cart = () => {
  const cartRef = useRef();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { totalPrice, totalQuantities, cartItems, setShowCart, toggleCartItemQuantity, onRemove } = useStateContext();

  const handleCheckout = async () => {
    if (isCheckingOut || cartItems.length < 1) return;
    setIsCheckingOut(true);
    const loadingToast = toast.loading('Redirecting...');

    try {
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItems),
      });

      const data = await response.json().catch(() => ({}));

      // fetch Responses expose `.status` / `.ok` (the old `.statusCode`
      // check never fired, so failures fell through silently).
      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Checkout failed');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) throw error;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Please try again.');
      setIsCheckingOut(false);
    } finally {
      toast.dismiss(loadingToast);
    }
  }

  return (
    <div className="cart-wrapper" ref={cartRef}>
      <div className="cart-container">
        <button
        type="button"
        className="cart-heading"
        onClick={() => setShowCart(false)}>
          <AiOutlineLeft />
          <span className="heading">Your Cart</span>
          <span className="cart-num-items">({totalQuantities} items)</span>
        </button>

        {cartItems.length < 1 && (
          <div className="empty-cart">
            <AiOutlineShopping size={150} />
            <h3>Your shopping bag is empty</h3>
            <Link href="/">
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="btn"
              >
                Continue Shopping
              </button>
            </Link>
          </div>
        )}

        <div className="product-container">
          {cartItems.length >= 1 && cartItems.map((item) => (
            <div className="product" key={item._id}>
              {item.image?.[0] && (
                <img src={urlFor(item.image[0])} alt={item.name} className="cart-product-image" />
              )}
              <div className="item-desc">
                <div className="flex top">
                  <h5>{item.name}</h5>
                  <h4>₹{item.price}</h4>
                </div>
                <div className="flex bottom">
                  <div>
                  <p className="quantity-desc">
                    <button type="button" aria-label={`Decrease quantity of ${item.name}`} className="minus" onClick={() => toggleCartItemQuantity(item._id, 'dec')}>
                    <AiOutlineMinus />
                    </button>
                    <span className="num">{item.quantity}</span>
                    <button type="button" aria-label={`Increase quantity of ${item.name}`} className="plus" onClick={() => toggleCartItemQuantity(item._id, 'inc')}><AiOutlinePlus /></button>
                  </p>
                  </div>
                  <button
                    type="button"
                    className="remove-item"
                    aria-label={`Remove ${item.name} from cart`}
                    onClick={() => onRemove(item)}
                  >
                    <TiDeleteOutline />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cartItems.length >= 1 && (
          <div className="cart-bottom">
            <div className="total">
              <h3>Subtotal:</h3>
              <h3>₹{totalPrice}</h3>
            </div>
            <div className="btn-container">
              <button type="button" className="btn" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? 'Redirecting...' : 'Pay with Stripe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
