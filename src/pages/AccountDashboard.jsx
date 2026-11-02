import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getOrdersForUser } from '../services/orderService';
import { formatPrice } from '../data/products';

export default function AccountDashboard({ onShowToast }) {
  const { user, logout, updateProfile, updatePassword, loading } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Karachi',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/account');
    } else if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || 'Karachi',
      });

      // Fetch user's orders
      getOrdersForUser(user.id, user.email).then(setOrders);
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500 text-sm">Loading your account...</p>
      </div>
    );
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile(profileForm);
      if (onShowToast) onShowToast('Profile updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await updatePassword(passwordForm.newPassword);
      setPasswordMsg('Password changed successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      if (onShowToast) onShowToast('Password updated successfully!');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onShowToast) onShowToast('Logged out securely');
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      {/* Administrator Portal Access Banner */}
      {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') && (
        <div className="mb-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-900 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <p className="font-bold text-sm text-stone-950">
                Administrator Privileges Active ({user.role})
              </p>
              <p className="text-xs text-stone-900/80">
                You have authorized access to products, inventory, orders, and store analytics.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="btn bg-stone-900 text-amber-400 hover:bg-black !py-2.5 !px-6 text-xs font-bold rounded-xl shadow-md shrink-0 flex items-center gap-2"
          >
            Open Admin Dashboard &rarr;
          </Link>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-m text-white rounded-3xl p-6 sm:p-10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-g shadow-md shrink-0 bg-stone-100"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cream/10 border-2 border-g flex items-center justify-center text-g font-bold text-2xl shrink-0 shadow-md">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-g text-xs font-semibold tracking-[.22em] uppercase">
              ROYAL CUSTOMER LOUNGE
            </span>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">
              Welcome, {user.name}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              {user.email} &middot; Member since{' '}
              {new Date(user.createdAt || Date.now()).getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') && (
            <Link
              to="/admin"
              className="btn bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold !py-2 !px-4 text-xs shadow-md"
            >
              👑 Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-g !py-2 !px-5 text-xs shadow-md shrink-0"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 block uppercase tracking-wider">
            Total Orders
          </span>
          <p className="font-display text-3xl font-bold text-m mt-2">
            {orders.length}
          </p>
          <Link
            to="/account/orders"
            className="text-xs text-m hover:underline font-semibold block mt-3"
          >
            View Order History &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 block uppercase tracking-wider">
            Saved in Wishlist
          </span>
          <p className="font-display text-3xl font-bold text-g-dark mt-2">
            {wishlist.length}
          </p>
          <Link
            to="/wishlist"
            className="text-xs text-g-dark hover:underline font-semibold block mt-3"
          >
            Explore Wishlist &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 block uppercase tracking-wider">
            Delivery City
          </span>
          <p className="font-display text-2xl font-bold text-stone-800 mt-2 truncate">
            {user.city || 'Karachi'}
          </p>
          <span className="text-xs text-emerald-700 font-medium block mt-3">
            ● Same-Day Delivery Zone
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-3 gap-8 mt-10">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h2 className="font-display text-xl font-bold text-m-dark">
                Recent Orders
              </h2>
              <Link
                to="/account/orders"
                className="text-xs font-semibold text-m hover:underline"
              >
                View All ({orders.length})
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <p className="text-sm">You haven't placed any orders yet.</p>
                <Link to="/mithai" className="btn btn-m mt-4 !text-xs">
                  Order Fresh Mithai
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id || ord.orderNumber}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-m">
                          {ord.orderNumber || ord.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          {ord.status || 'Confirmed'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(ord.createdAt || ord.created_at).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} &middot; {ord.items?.length || 0} items
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-stone-900 text-sm">
                        {formatPrice(ord.total)}
                      </span>
                      <Link
                        to={`/account/orders/${ord.orderNumber || ord.id}`}
                        className="btn btn-o !py-1 !px-3 !text-xs"
                      >
                        Receipt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Profile Update Form & Password Security */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-g-light p-6 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-m-dark pb-2 border-b border-stone-100">
              Personal Information
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Default Delivery Address
                </label>
                <textarea
                  rows="2"
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="text-xs"
                  placeholder="Your home or office address"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, city: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-m w-full !text-xs !py-2.5 shadow-sm"
              >
                {isUpdating ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-m-dark pb-2 border-b border-stone-100">
              Account Security
            </h2>
            {passwordMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                {passwordMsg}
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {passwordError}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="btn btn-o w-full !text-xs !py-2.5 shadow-sm"
              >
                {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

