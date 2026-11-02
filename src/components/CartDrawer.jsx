import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  calcPrice,
  getProductWeights,
  formatPrice,
  WHATSAPP_NUMBER,
} from '../data/products';
import { SITE_CONFIG } from '../config/siteConfig';
import { useCatalog } from '../context/CatalogContext';

export default function CartDrawer({ onShowToast }) {
  const {
    cart,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryRemaining,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const navigate = useNavigate();
  const { products: PRODUCTS } = useCatalog();

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartDrawerOpen) closeCartDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  const handleProceedToCheckout = () => {
    closeCartDrawer();
    navigate('/checkout');
  };

  const handleWhatsAppQuickOrder = () => {
    if (!cart.length) return;
    let message = `Assalam o Alaikum! New order from Gulfam Sweets & Dairy website:\n\nItems:\n`;
    cart.forEach((c) => {
      const product = PRODUCTS.find((p) => String(p.id) === String(c.id));
      if (!product) return;
      const unitLabel = getProductWeights(product)[c.wi]?.[0] || '';
      const itemPrice = calcPrice(product, c.wi) * c.q;
      message += `- ${product.n} (${unitLabel}) x ${c.q} = ${formatPrice(
        itemPrice
      )}\n`;
    });
    message += `\nSubtotal: ${formatPrice(subtotal)}`;
    message += `\nDelivery: ${deliveryFee ? formatPrice(deliveryFee) : 'Free'}`;
    message += `\nTotal: ${formatPrice(total)} (Cash on Delivery)`;
    message += `\n\nPlease confirm my order.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isCartDrawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCartDrawer}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-m text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl text-g font-bold">
              Your Order
            </h3>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
              {cart.reduce((c, i) => c + i.q, 0)} items
            </span>
          </div>
          <button
            onClick={closeCartDrawer}
            className="text-2xl hover:text-g transition-colors leading-none p-1"
            aria-label="Close cart drawer"
          >
            &times;
          </button>
        </div>

        {/* Free Shipping Alert Bar */}
        <div className="bg-cream border-b border-g-light/80 px-4 py-2 text-xs text-stone-700 text-center font-medium">
          {freeDeliveryRemaining > 0 ? (
            <span>
              Add <b className="text-m">{formatPrice(freeDeliveryRemaining)}</b>{' '}
              more to get <b className="text-emerald-700">FREE delivery!</b>
            </span>
          ) : (
            <span className="text-emerald-800 font-semibold">
              🎉 Congratulations! You have unlocked FREE delivery!
            </span>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-stone-500 py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream grid place-items-center text-g-dark">
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 4h2l2.4 11h10.2L20 7H6" />
                  <circle cx="9" cy="19.5" r="1.2" />
                  <circle cx="17" cy="19.5" r="1.2" />
                </svg>
              </div>
              <p className="text-base font-semibold text-stone-800">
                Your cart is currently empty.
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explore our handcrafted royal sweets, freshly baked cookies, and
                crisp savoury nimco.
              </p>
              <Link
                to="/mithai"
                onClick={closeCartDrawer}
                className="btn btn-m mt-5 inline-block text-xs"
              >
                Browse Royal Mithai
              </Link>
            </div>
          ) : (
            cart.map((item) => {
              const product = PRODUCTS.find((p) => String(p.id) === String(item.id));
              if (!product) return null;
              const unitLabel = getProductWeights(product)[item.wi]?.[0] || '';
              const unitPrice = calcPrice(product, item.wi);

              return (
                <div
                  key={item.k}
                  className="flex gap-3 items-center border-b border-g-light pb-4"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${product.i}?auto=format&fit=crop&w=140&q=70`}
                    alt={product.n}
                    className="w-16 h-16 object-cover rounded-xl shrink-0 border border-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={closeCartDrawer}
                      className="font-medium text-sm leading-tight text-stone-900 hover:text-m transition-colors truncate block"
                    >
                      {product.n}
                    </Link>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {unitLabel} &middot; {formatPrice(unitPrice)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.k, -1)}
                        className="w-6 h-6 rounded-full border border-g grid place-items-center text-sm font-semibold hover:bg-g-light transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="text-sm w-6 text-center font-semibold">
                        {item.q}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.k, 1)}
                        className="w-6 h-6 rounded-full border border-g grid place-items-center text-sm font-semibold hover:bg-g-light transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-m block mb-2">
                      {formatPrice(unitPrice * item.q)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.k)}
                      className="text-stone-400 hover:text-m text-lg p-1 transition-colors leading-none"
                      aria-label="Remove item"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-g-light bg-cream space-y-3 shrink-0">
            <div className="text-sm space-y-1.5 pb-2 border-b border-stone-200">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-m text-base pt-1">
                <span>Estimated Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleProceedToCheckout}
                className="btn btn-m w-full shadow-md py-3 text-sm"
              >
                Proceed to Checkout
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/cart"
                  onClick={closeCartDrawer}
                  className="btn btn-o !py-2 !text-xs text-center"
                >
                  View Full Cart
                </Link>
                <button
                  type="button"
                  onClick={handleWhatsAppQuickOrder}
                  className="btn btn-g !py-2 !text-xs"
                >
                  Order via WhatsApp
                </button>
              </div>

              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-stone-400 hover:text-m w-full text-center py-1 transition-colors block"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
