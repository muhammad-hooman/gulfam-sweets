import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import { formatPrice, WHATSAPP_NUMBER } from '../data/products';

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(orderId).then((data) => {
      setOrder(data);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-m-dark">
          Order Not Found
        </h2>
        <p className="text-stone-500 text-sm mt-2">
          Unable to locate order reference #{orderId}.
        </p>
        <Link to="/account/orders" className="btn btn-m mt-6">
          Back to Orders
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || order.order_items || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="text-xs text-stone-500 flex items-center gap-2 mb-6">
        <Link to="/account" className="hover:text-m">
          My Account
        </Link>
        <span>/</span>
        <Link to="/account/orders" className="hover:text-m">
          Orders
        </Link>
        <span>/</span>
        <span className="text-m font-semibold">{order.orderNumber || order.id}</span>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-10 shadow-sm space-y-8">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs text-g-dark uppercase font-semibold tracking-widest block">
              TAX INVOICE &amp; RECEIPT
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-m-dark mt-1">
              Order #{order.orderNumber || order.id}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Placed on{' '}
              {new Date(order.createdAt || order.created_at).toLocaleString('en-PK', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn btn-o !py-2 !px-4 !text-xs shrink-0"
            >
              Print Receipt
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {order.status || 'Confirmed'}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-cream/50 rounded-2xl p-5 border border-g-light/50">
          <span className="text-xs font-bold text-m-dark uppercase tracking-wider block mb-4">
            Order Status Tracking
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="space-y-1">
              <div className="w-7 h-7 mx-auto rounded-full bg-m text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <p className="font-semibold text-stone-900">Received</p>
            </div>
            <div className="space-y-1">
              <div className="w-7 h-7 mx-auto rounded-full bg-m text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <p className="font-semibold text-stone-900">Fresh Preparation</p>
            </div>
            <div className="space-y-1">
              <div className="w-7 h-7 mx-auto rounded-full bg-g text-m-dark flex items-center justify-center font-bold text-xs">
                ●
              </div>
              <p className="font-semibold text-stone-900">Packed for Delivery</p>
            </div>
            <div className="space-y-1">
              <div className="w-7 h-7 mx-auto rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-xs">
                ○
              </div>
              <p className="text-stone-400">Delivered</p>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid sm:grid-cols-2 gap-6 text-xs text-stone-700 bg-stone-50/80 p-5 rounded-2xl border border-stone-100">
          <div>
            <b className="text-stone-900 text-sm block mb-1">Customer Information</b>
            <p className="font-medium text-stone-900">{order.customerName}</p>
            <p>Phone: {order.customerPhone}</p>
            {order.customerEmail && <p>Email: {order.customerEmail}</p>}
          </div>

          <div>
            <b className="text-stone-900 text-sm block mb-1">Delivery Destination</b>
            <p>{order.deliveryAddress}</p>
            <p>{order.city}, Pakistan</p>
            {order.deliveryDate && <p className="mt-1 font-medium text-m">Requested Date: {order.deliveryDate}</p>}
            {order.notes && <p className="text-stone-500 italic mt-1">"{order.notes}"</p>}
          </div>
        </div>

        {/* Items Table */}
        <div>
          <b className="text-sm font-bold text-stone-900 block mb-3">
            Purchased Delicacies
          </b>
          <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs sm:text-sm">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-stone-900">
                    {it.name || it.product_name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {it.unitLabel || it.unit_label} &times; {it.q || it.quantity}
                  </p>
                </div>
                <div className="font-bold text-stone-900">
                  {formatPrice(it.totalPrice || it.total_price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-stone-200 max-w-xs ml-auto space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-medium text-stone-900">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-m-dark pt-2 border-t border-stone-200">
            <span>Grand Total</span>
            <span className="text-lg text-m">{formatPrice(order.total)}</span>
          </div>
          <p className="text-[11px] text-stone-400 text-right">
            Payment: {order.paymentMethod || 'Cash on Delivery'}
          </p>
        </div>

        <div className="pt-6 border-t border-stone-100 flex justify-between items-center text-xs">
          <Link to="/account/orders" className="text-m font-semibold hover:underline">
            &larr; Return to Orders
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Assalam%20o%20Alaikum%20inquiry%20regarding%20Order%20${order.orderNumber || order.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            WhatsApp Support &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

