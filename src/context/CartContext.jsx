import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { calcPrice } from '../data/products';
import { SITE_CONFIG } from '../config/siteConfig';
import { useCatalog } from './CatalogContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { products } = useCatalog();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gulfam-cart2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gulfam-cart2', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = useCallback((product, weightIndex = 0, quantity = 1) => {
    const key = `${product.id}-${weightIndex}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.k === key);
      if (existing) {
        return prev.map((item) =>
          item.k === key ? { ...item, q: item.q + quantity } : item
        );
      }
      return [...prev, { k: key, id: product.id, wi: weightIndex, q: quantity }];
    });
  }, []);

  const updateQuantity = useCallback((key, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.k === key) {
            const nextQ = item.q + delta;
            return nextQ > 0 ? { ...item, q: nextQ } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setCart((prev) => prev.filter((item) => item.k !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Summary calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = products.find((p) => String(p.id) === String(item.id));
      if (!product) return sum;
      return sum + calcPrice(product, item.wi) * item.q;
    }, 0);
  }, [cart, products]);

  const itemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.q, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= SITE_CONFIG.freeDeliveryThreshold
      ? 0
      : SITE_CONFIG.standardDeliveryFee;
  }, [subtotal]);

  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  const freeDeliveryRemaining = useMemo(() => {
    const diff = SITE_CONFIG.freeDeliveryThreshold - subtotal;
    return diff > 0 ? diff : 0;
  }, [subtotal]);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        freeDeliveryRemaining,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
