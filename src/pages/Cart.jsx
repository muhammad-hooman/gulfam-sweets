import React, { useState } from 'react';
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
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Cart({ onShowToast }) {
  const {
    cart,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryRemaining,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const navigate = useNavigate();
  const { products: PRODUCTS } = useCatalog();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    setDiscountAmount(0);
    setCouponMessage('');
    if (!isSupabaseConfigured || !supabase) {
      setCouponMessage('Coupon validation requires the live store database.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const items = cart.map((item) => {
        const product = PRODUCTS.find((entry) => String(entry.id) === String(item.id));
        if (!product) throw new Error('A cart product is no longer available.');
        return {
          product_legacy_id: String(product.legacyId || product.productUuid || product.id),
          variant_label: getProductWeights(product)[item.wi]?.[0] || '',
          quantity: item.q,
        };
      });
      const { data, error } = await supabase.rpc('apply_coupon', {
        p_coupon_code: code,
        p_items: items,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (result?.valid) {
        const discount = Number(result.discount_amount);
        if (!Number.isFinite(discount) || discount < 0) {
          throw new Error('Coupon validation returned an invalid discount.');
        }
        setDiscountAmount(discount);
        setCouponMessage(result.message || 'Coupon applied. Final discount is recalculated at checkout.');
        sessionStorage.setItem('gulfam_checkout_coupon', code);
      } else {
        setDiscountAmount(0);
        sessionStorage.removeItem('gulfam_checkout_coupon');
        setCouponMessage(result?.message || 'Coupon is invalid, expired, or not eligible for this cart.');
      }
    } catch (error) {
      console.error('Coupon validation failed:', error);
      setCouponMessage(error.message || 'Coupon could not be validated.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, total - discountAmount);

  const handleWhatsAppOrder = () => {
    if (!cart.length) return;
    let message = `Assalam o Alaikum! I would like to place an order from Gulfam Sweets & Dairy:\n\n`;
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
    if (discountAmount > 0) {
      message += `\nDiscount: -${formatPrice(discountAmount)}`;
    }
    message += `\nDelivery: ${deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}`;
    message += `\nTotal: ${formatPrice(finalTotal)} (Cash on Delivery)`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cream border border-g-light flex items-center justify-center text-g-dark shadow-sm">
          <svg
            width="42"
            height="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M3 4h2l2.4 11h10.2L20 7H6" />
            <circle cx="9" cy="19.5" r="1.3" />
            <circle cx="17" cy="19.5" r="1.3" />
          </svg>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark">
          Your Cart is Empty
        </h1>
        <p className="text-stone-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Looks like you haven't added any of our handcrafted sweets, bakery
          treats, or savory nimco yet.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/mithai" className="btn btn-m shadow-md">
            Explore Royal Mithai
          </Link>
          <Link to="/fresh-snacks" className="btn btn-g shadow-md">
            Order Fresh Snacks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review your delicacies ({itemCount} item{itemCount === 1 ? '' : 's'})
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-m underline transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Shipping Alert Bar */}
      <div className="my-6 p-4 rounded-2xl bg-cream border border-g-light flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <div>
            {freeDeliveryRemaining > 0 ? (
              <p className="text-stone-700">
                Add{' '}
                <b className="text-m font-bold">
                  {formatPrice(freeDeliveryRemaining)}
                </b>{' '}
                more to unlock <b className="text-emerald-800">FREE delivery!</b>
              </p>
            ) : (
              <p className="text-emerald-800 font-bold">
                🎉 Congratulations! Your order qualifies for FREE delivery!
              </p>
            )}
          </div>
        </div>
        <div className="w-full sm:w-48 bg-stone-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(
                100,
                (subtotal / SITE_CONFIG.freeDeliveryThreshold) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Items Table / Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs divide-y divide-stone-100 overflow-hidden">
            {cart.map((item) => {
              const product = PRODUCTS.find((p) => String(p.id) === String(item.id));
              if (!product) return null;
              const unitLabel = getProductWeights(product)[item.wi]?.[0] || '';
              const unitPrice = calcPrice(product, item.wi);
              const itemTotal = unitPrice * item.q;

              return (
                <div
                  key={item.k}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors hover:bg-stone-50/50"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${product.i}?auto=format&fit=crop&w=160&q=70`}
                    alt={product.n}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-stone-200 shadow-xs"
                  />

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${product.id}`}
                      className="font-display font-bold text-m-dark text-base hover:text-m transition-colors truncate block"
                    >
                      {product.n}
                    </Link>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Pack: <b className="text-stone-700">{unitLabel}</b> &middot;{' '}
                      {formatPrice(unitPrice)} each
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-stone-300 rounded-full bg-white px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.k, -1)}
                          className="w-6 h-6 rounded-full text-stone-600 font-bold hover:bg-stone-100 flex items-center justify-center text-sm"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-m-dark">
                          {item.q}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.k, 1)}
                          className="w-6 h-6 rounded-full text-stone-600 font-bold hover:bg-stone-100 flex items-center justify-center text-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.k)}
                        className="text-xs text-stone-400 hover:text-m transition-colors underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="font-display text-lg font-bold text-m block">
                      {formatPrice(itemTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/mithai"
              className="text-xs sm:text-sm font-semibold text-m hover:underline flex items-center gap-1"
            >
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="bg-white rounded-3xl border border-g-light p-6 md:p-8 shadow-sm space-y-5">
          <h2 className="font-display text-xl font-bold text-m-dark pb-3 border-b border-stone-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal ({itemCount} items)</span>
              <span className="font-semibold text-stone-900">
                {formatPrice(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold text-m-dark pt-3 border-t border-stone-100">
              <span>Total in PKR</span>
              <span className="text-xl text-m">{formatPrice(finalTotal)}</span>
            </div>
          </div>

          {/* Promo code form */}
          <form onSubmit={handleApplyCoupon} className="pt-2">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1.5">
              Have a Promo Code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="!py-2 !px-3 text-xs uppercase font-medium"
              />
              <button type="submit" disabled={validatingCoupon} className="btn btn-o !py-2 !px-4 !text-xs">
                {validatingCoupon ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponMessage && (
              <p
                className={`text-xs mt-1.5 font-medium ${
                  discountAmount > 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {couponMessage}
              </p>
            )}
          </form>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-m w-full shadow-md py-3 text-sm"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={handleWhatsAppOrder}
              className="btn btn-g w-full shadow-sm py-2.5 text-xs"
            >
              Direct Order on WhatsApp
            </button>
          </div>

          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 space-y-1 text-center">
            <p>✓ Cash on Delivery available across Karachi</p>
            <p>✓ Hygienic temperature-controlled packing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
