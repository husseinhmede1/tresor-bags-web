import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'tresor-cart';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  function setQuantity(bag, qty) {
    const id = bag._id || bag.id;
    setItems(prev => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[id];
      } else {
        const maxStock = typeof bag.stock === 'number' ? bag.stock : Infinity;
        const capped = Math.min(qty, maxStock);
        if (capped <= 0) { delete next[id]; return next; }
        next[id] = { bag, quantity: capped };
      }
      return next;
    });
  }

  function clearCart() {
    setItems({});
  }

  function getQuantity(bagId) {
    return items[bagId]?.quantity ?? 0;
  }

  const totalItems = Object.values(items).reduce((sum, { quantity }) => sum + quantity, 0);

  const totalPrice = Object.values(items).reduce((sum, { bag, quantity }) => {
    const discount = bag.categoryId?.discount ?? 0;
    const unit = bag.price * (1 - discount / 100);
    return sum + unit * quantity;
  }, 0);

  const totalSavings = Object.values(items).reduce((sum, { bag, quantity }) => {
    const discount = bag.categoryId?.discount ?? 0;
    return sum + bag.price * (discount / 100) * quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, setQuantity, clearCart, getQuantity, totalItems, totalPrice, totalSavings }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
