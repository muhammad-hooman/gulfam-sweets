import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrdersForUser } from '../services/orderService';
import { formatPrice } from '../data/products';

export default function Orders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/account/orders');
    } else if (user) {
      getOrdersForUser(user.id, user.email).then((data) => {
        setOrders(data);
        setIsLoading(false);
      });
    }
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500 text-sm">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <div className="text-xs text-stone-500 flex items-center gap-2 mb-1">
            <Link to="/account" className="hover:text-m">
              My Account
            </Link>
            <span>/</span>
            <span className="text-m font-semibold">Orders</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-m-dark">
            My Order History
          </h1>
        </div>
        <Link to="/mithai" className="btn btn-m !text-xs !py-2 !px-4">
          Order Sweets
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 mt-8 shadow-xs p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream grid place-items-center text-g-dark text-2xl font-serif">
            GS
          </div>
          <h3 className="font-display text-2xl font-bold text-m-dark">
            No Orders Placed Yet
          </h3>
          <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
            All your future orders and online deliveries will be safely recorded
            here for instant receipt viewing and tracking.
          </p>
          <Link to="/mithai" className="btn btn-g mt-6 shadow-sm">
            Browse Royal Mithai Menu
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((ord) => {
            const orderNum = ord.orderNumber || ord.id;
            const dateStr = new Date(ord.createdAt || ord.created_at).toLocaleDateString(
              'en-PK',
              { day: 'numeric', month: 'short', year: 'numeric' }
            );

            return (
              <div
                key={orderNum}
                className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-g-light transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-m">
                      {orderNum}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {ord.status || 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Placed on {dateStr} &middot; {ord.items?.length || 0} item(s) &middot;{' '}
                    {ord.paymentMethod || 'Cash on Delivery'}
                  </p>
                  <p className="text-xs text-stone-600 truncate max-w-md">
                    Ship to: {ord.deliveryAddress}, {ord.city}
                  </p>
                </div>

                <div className="flex items-center gap-5 sm:self-center self-end w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 block uppercase">
                      Total
                    </span>
                    <span className="font-display font-bold text-lg text-m">
                      {formatPrice(ord.total)}
                    </span>
                  </div>
                  <Link
                    to={`/account/orders/${orderNum}`}
                    className="btn btn-m !py-2 !px-4 !text-xs shadow-xs"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

