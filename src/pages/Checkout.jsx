import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  calcPrice,
  getProductWeights,
  formatPrice,
  WHATSAPP_NUMBER,
} from '../data/products';
import { createOrder } from '../services/orderService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useCatalog } from '../context/CatalogContext';

export default function Checkout({ onShowToast }) {
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products: PRODUCTS } = useCatalog();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [couponCode] = useState(() => {
    try {
      return sessionStorage.getItem('gulfam_checkout_coupon') || '';
    } catch (error) {
      console.error('Could not read the pending coupon code:', error);
      return '';
    }
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || 'Karachi',
    deliveryDate: '',
    notes: '',
    paymentMethod: 'Cash on Delivery',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cart.length) {
      setErrorMsg('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('Please complete your name, phone number, and delivery address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cart.map((c) => {
        const prod = PRODUCTS.find((p) => String(p.id) === String(c.id));
        if (!prod) throw new Error('A cart product is no longer available.');
        const weights = getProductWeights(prod);
        const safeWi = typeof c.wi === 'number' && weights[c.wi] ? c.wi : 0;
        const unitLabel = (weights[safeWi]?.[0] && weights[safeWi][0].trim()) || prod.variants?.[0]?.name || 'Standard';
        const unitPrice = calcPrice(prod, safeWi) || Number(prod.p) || Number(prod.base_price) || 0;
        const variantId = prod.variants?.[safeWi]?.id || (prod.variants && prod.variants[0]?.id) || null;
        return {
          id: prod.id,
          legacyId: prod.legacyId || prod.id,
          productUuid: prod.productUuid || null,
          variantId,
          name: prod.n,
          unitLabel: unitLabel || 'Standard',
          unitPrice,
          totalPrice: unitPrice * c.q,
          q: c.q,
        };
      });

      const customerNotes = [
        formData.notes.trim(),
        formData.deliveryDate ? `[Preferred Delivery Date: ${formData.deliveryDate}]` : '',
      ].filter(Boolean).join('\n');

      const orderPayload = {
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim() || null,
        userId: user?.id || null,
        deliveryAddress: formData.address.trim(),
        city: formData.city,
        deliveryDate: formData.deliveryDate || null,
        notes: customerNotes,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: formData.paymentMethod,
        items: orderItems,
        idempotencyKey: idempotencyKey.current,
        couponCode,
      };

      const result = await createOrder(orderPayload);
      setPlacedOrder(result);
      idempotencyKey.current = crypto.randomUUID();
      try {
        sessionStorage.removeItem('gulfam_checkout_coupon');
      } catch (storageError) {
        console.error('Could not clear the pending coupon code:', storageError);
      }
      clearCart();
      if (onShowToast) onShowToast('Order placed successfully!');
    } catch (err) {
      console.error('Order placement error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    if (!placedOrder) return;
    const ord = placedOrder.order;
    let msg = `New Order Placed - Gulfam Sweets & Dairy\n`;
    msg += `Order ID: ${placedOrder.orderId}\n`;
    msg += `Customer: ${ord.customerName}\n`;
    msg += `Phone: ${ord.customerPhone}\n`;
    msg += `Address: ${ord.deliveryAddress}, ${ord.city}\n`;
    if (ord.deliveryDate) msg += `Delivery Date: ${ord.deliveryDate}\n`;
    if (ord.notes) msg += `Notes: ${ord.notes}\n`;
    msg += `\nItems:\n`;
    ord.items.forEach((it) => {
      msg += `- ${it.name} (${it.unitLabel}) x ${it.q} = ${formatPrice(it.totalPrice)}\n`;
    });
    msg += `\nSubtotal: ${formatPrice(ord.subtotal)}`;
    msg += `\nDelivery: ${ord.deliveryFee === 0 ? 'Free' : formatPrice(ord.deliveryFee)}`;
    msg += `\nTotal: ${formatPrice(ord.total)} (${ord.paymentMethod})`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  // If order was placed, display receipt view
  if (placedOrder) {
    const ord = placedOrder.order;
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-g-light p-6 md:p-10 shadow-lg text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-3xl font-bold shadow-sm">
            ✓
          </div>

          <h1 className="font-display text-3xl font-bold text-m-dark mt-4">
            Order Confirmed!
          </h1>
          <p className="text-stone-600 text-sm mt-2">
            Thank you, <b className="text-stone-900">{ord.customerName}</b>. Your order has been placed.
          </p>

          {/* Backend Mode Banner */}
          <div className="mt-4 p-3 rounded-xl text-xs font-medium inline-block bg-cream border border-g-light text-stone-700">
            {isSupabaseConfigured ? (
              <span className="text-emerald-800">
                ● Live Production Database: Order securely stored.
              </span>
            ) : (
              <span className="text-amber-800">
                ● Development / Demo Mode: Order recorded in local customer history. (Set Supabase credentials in .env for production database storage).
              </span>
            )}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wider block">
                  Order Number
                </span>
                <span className="font-mono font-bold text-lg text-m">
                  {placedOrder.orderId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 uppercase tracking-wider block">
                  Status
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  {ord.status}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs text-stone-700">
              <div>
                <b className="text-stone-900 block mb-0.5">Shipping Address:</b>
                <p>{ord.deliveryAddress}</p>
                <p>{ord.city}, Pakistan</p>
                <p className="mt-1">Phone: {ord.customerPhone}</p>
              </div>
              <div>
                <b className="text-stone-900 block mb-0.5">Payment Method:</b>
                <p>{ord.paymentMethod}</p>
                <b className="text-stone-900 block mt-2 mb-0.5">Grand Total:</b>
                <p className="text-base font-bold text-m">
                  {formatPrice(ord.total)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200">
              <b className="text-xs text-stone-900 block mb-2">Order Items:</b>
              <div className="divide-y divide-stone-100 text-xs">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <span>
                      {it.name} ({it.unitLabel}) x {it.q}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {formatPrice(it.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleWhatsAppConfirm}
              className="btn btn-g shadow-md"
            >
              Confirm on WhatsApp
            </button>
            {user ? (
              <Link to="/account/orders" className="btn btn-m shadow-md">
                View My Orders
              </Link>
            ) : (
              <Link to="/mithai" className="btn btn-m shadow-md">
                Order More Sweets
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and not placed order
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <h2 className="font-display text-2xl font-bold text-m-dark">
          Your Cart is Empty
        </h2>
        <p className="text-stone-500 text-sm mt-2">
          Add items to your cart before proceeding to checkout.
        </p>
        <Link to="/mithai" className="btn btn-m mt-6">
          Browse Royal Mithai
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Complete your delivery details &bull; Guest checkout enabled
        </p>
      </div>

      {!user && (
        <div className="mb-8 p-4 rounded-2xl bg-cream border border-g-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <span>
            Already have an account? Sign in to autofill your saved addresses.
          </span>
          <Link
            to={`/login?redirect=/checkout`}
            className="btn btn-o !py-1.5 !px-4 text-xs shrink-0 self-start sm:self-auto"
          >
            Sign In
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Contact */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-m-dark pb-2 border-b border-stone-100">
              1. Contact Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Phone / WhatsApp <span className="text-rose-600">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="0300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Email Address <span className="text-stone-400 font-normal">(Optional for digital receipt)</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-m-dark pb-2 border-b border-stone-100">
              2. Delivery Address &amp; Schedule
            </h2>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Street Address / House / Flat <span className="text-rose-600">*</span>
              </label>
              <textarea
                name="address"
                rows="2"
                required
                placeholder="House #, Street name, Block/Sector, Landmark"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  City
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                >
                  <option value="Karachi">Karachi (Same Day Fresh Delivery)</option>
                  <option value="Lahore">Lahore (Next Day Express)</option>
                  <option value="Islamabad">Islamabad / Rawalpindi (Express)</option>
                  <option value="Other">Other City (Call to Coordinate)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Preferred Delivery Date
                </label>
                <input
                  name="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Special Delivery Notes / Cake Inscription
              </label>
              <input
                name="notes"
                placeholder="e.g. Ring bell twice, write 'Happy Birthday Ayan' on cake"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-m-dark pb-2 border-b border-stone-100">
              3. Payment Method
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.paymentMethod === 'Cash on Delivery'
                  ? 'border-m bg-m-soft/30'
                  : 'border-stone-200 hover:border-stone-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={formData.paymentMethod === 'Cash on Delivery'}
                  onChange={handleChange}
                  className="!w-auto"
                />
                <div>
                  <span className="font-semibold text-stone-900 text-sm block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-xs text-stone-500">
                    Pay securely in cash when your fresh delivery arrives at your doorstep.
                  </span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.paymentMethod === 'EasyPaisa'
                  ? 'border-m bg-m-soft/30'
                  : 'border-stone-200 hover:border-stone-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="EasyPaisa"
                  checked={formData.paymentMethod === 'EasyPaisa'}
                  onChange={handleChange}
                  className="!w-auto"
                />
                <div>
                  <span className="font-semibold text-stone-900 text-sm block">
                    EasyPaisa / Digital Wallet
                  </span>
                  <span className="text-xs text-stone-500">
                    Send instant payment via EasyPaisa to Gulfam Sweets official business account.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary & Place Order */}
        <div className="bg-white rounded-3xl border border-g-light p-6 md:p-8 shadow-sm space-y-5 h-fit">
          <h2 className="font-display text-xl font-bold text-m-dark pb-3 border-b border-stone-100">
            Order Review
          </h2>

          <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => {
              const product = PRODUCTS.find((p) => String(p.id) === String(item.id));
              if (!product) return null;
              const weights = getProductWeights(product);
              const safeWi = typeof item.wi === 'number' && weights[item.wi] ? item.wi : 0;
              const unitLabel = (weights[safeWi]?.[0] && weights[safeWi][0].trim()) || product.variants?.[0]?.name || 'Standard';
              const unitPrice = calcPrice(product, safeWi) || Number(product.p) || Number(product.base_price) || 0;

              return (
                <div key={item.k} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <span className="font-medium text-stone-900 block">
                      {product.n}
                    </span>
                    <span className="text-stone-500">
                      {unitLabel} &times; {item.q}
                    </span>
                  </div>
                  <span className="font-semibold text-stone-800">
                    {formatPrice(unitPrice * item.q)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-stone-600 pt-3 border-t border-stone-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-m-dark pt-2 border-t border-stone-100">
              <span>Total Payable</span>
              <span className="text-xl text-m">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-m w-full py-3 text-sm shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Placing Order...' : `Place Order • ${formatPrice(total)}`}
          </button>

          <p className="text-[11px] text-stone-500 text-center leading-relaxed">
            By placing your order, you agree to Gulfam Sweets &amp; Dairy terms of service and delivery policy.
          </p>
        </div>
      </form>
    </div>
  );
}
