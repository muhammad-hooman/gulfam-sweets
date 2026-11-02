import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);

function normalizeProductId(productId) {
  const value = String(productId);
  return /^\d+$/.test(value) ? Number(value) : value;
}

export function WishlistProvider({ children, onShowToast }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('gulfam-wish');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gulfam-wish', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist]);

  const toggleWishlist = useCallback(
    (productId) => {
      const id = normalizeProductId(productId);
      setWishlist((prev) => {
        const exists = prev.some((item) => String(item) === String(id));
        if (exists) {
          if (onShowToast) onShowToast('Removed from wishlist');
          return prev.filter((item) => String(item) !== String(id));
        } else {
          if (onShowToast) onShowToast('Saved to wishlist');
          return [...prev, id];
        }
      });
    },
    [onShowToast]
  );

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => String(item) === String(productId)),
    [wishlist]
  );

  const removeFromWishlist = useCallback((productId) => {
    const id = String(productId);
    setWishlist((prev) => prev.filter((item) => String(item) !== id));
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
