import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { toast } from 'react-hot-toast';

import {
  addToCart,
  removeFromCart,
  toggleCartItemQuantity,
  getCartTotals,
  isValidCartItem,
} from '../lib/cart.mjs';

const Context = createContext();

const CART_STORAGE_KEY = 'ecommerce-cart-v1';

export const StateContext = ({ children }) => {
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [qty, setQty] = useState(1);
  const hasHydratedCart = useRef(false);

  // Derived state: totals are computed from cartItems (single source of
  // truth) instead of being hand-synced in onAdd/onRemove/toggle.
  const { totalPrice, totalQuantities } = useMemo(
    () => getCartTotals(cartItems),
    [cartItems]
  );

  // Hydrate the persisted cart once, on the client only (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed.filter(isValidCartItem));
        }
      }
    } catch {
      // Corrupt/blocked storage (private mode, quota) must never break the shop.
    } finally {
      hasHydratedCart.current = true;
    }
  }, []);

  // Persist after hydration so the initial empty state can't wipe storage.
  useEffect(() => {
    if (!hasHydratedCart.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Non-fatal: cart simply won't persist for this session.
    }
  }, [cartItems]);

  const onAdd = (product, quantity) => {
    if (!product || !product._id) return;
    const addedQuantity = Math.max(1, Math.floor(Number(quantity)) || 1);
    setCartItems((prevItems) => addToCart(prevItems, product, addedQuantity));
    // Previously used the shared page-level `qty` here, so the toast could
    // announce a different amount than was actually added.
    toast.success(`${addedQuantity} ${product.name} added to the cart.`);
  };

  const onRemove = (product) => {
    if (!product || !product._id) return;
    setCartItems((prevItems) => removeFromCart(prevItems, product._id));
  };

  // Correctly-spelled implementation; the misspelled alias below is kept so
  // existing imports (`toggleCartItemQuanitity`) keep working unchanged.
  const toggleCartItemQuantityHandler = (id, value) => {
    setCartItems((prevItems) => toggleCartItemQuantity(prevItems, id, value));
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore — in-memory cart is already cleared
    }
  };

  const incQty = () => {
    setQty((prevQty) => prevQty + 1);
  };

  const decQty = () => {
    setQty((prevQty) => {
      if (prevQty - 1 < 1) return 1;
      return prevQty - 1;
    });
  };

  // Kept for backward compatibility with existing consumers (e.g. older
  // success-page code). Totals are derived now, so these are intentionally
  // no-ops; prefer `clearCart()` for new code.
  const setTotalPrice = () => {};
  const setTotalQuantities = () => {};

  const value = useMemo(
    () => ({
      showCart,
      setShowCart,
      cartItems,
      totalPrice,
      totalQuantities,
      qty,
      setQty,
      incQty,
      decQty,
      onAdd,
      toggleCartItemQuantity: toggleCartItemQuantityHandler,
      // Deprecated alias — do not use in new code.
      toggleCartItemQuanitity: toggleCartItemQuantityHandler,
      onRemove,
      clearCart,
      setCartItems,
      setTotalPrice,
      setTotalQuantities,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showCart, cartItems, totalPrice, totalQuantities, qty]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useStateContext = () => useContext(Context);
