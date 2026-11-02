import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const navigation = [
  { label: 'Dashboard Overview', path: '/admin', icon: '⌂' },
  { label: 'Media Library', path: '/admin/media', icon: '🖼' },
  { label: 'Website Media Editor', path: '/admin/website-media', icon: '✦' },
  { label: 'Products Management', path: '/admin/products', icon: '▦' },
  { label: 'Categories Management', path: '/admin/categories', icon: '◈' },
  { label: 'Product Variants', path: '/admin/variants', icon: '◇' },
  { label: 'Inventory Management', path: '/admin/inventory', icon: '▤' },
  { label: 'Stock Movements', path: '/admin/stock-movements', icon: '↕' },
  { label: 'Orders Management', path: '/admin/orders', icon: '▣' },
  { label: 'Customers Management', path: '/admin/customers', icon: '♙' },
  { label: 'Coupons & Discounts', path: '/admin/coupons', icon: '%' },
  { label: 'Fresh Food Management', path: '/admin/fresh-food', icon: '✿' },
  { label: 'Frozen Food Management', path: '/admin/frozen-food', icon: '❄' },
  { label: 'Delivery Management', path: '/admin/delivery', icon: '⌖' },
  { label: 'Payments Management', path: '/admin/payments', icon: '₨' },
  { label: 'Reviews Management', path: '/admin/reviews', icon: '☆' },
  { label: 'Banners & Promotions', path: '/admin/promotions', icon: '▧' },
  { label: 'Contact Inquiries', path: '/admin/inquiries', icon: '✉' },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: '▥' },
  { label: 'Admin Users & Roles', path: '/admin/team', icon: '♧' },
  { label: 'Store Settings', path: '/admin/settings', icon: '⚙' },
];

export default function AdminLayout() {
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [access, setAccess] = useState({ status: 'loading', message: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [checkAttempt, setCheckAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (authLoading) return;
      if (!user) {
        setAccess({ status: 'unauthenticated', message: '' });
        return;
      }
      if (!isSupabaseConfigured || !supabase) {
        setAccess({
          status: 'error',
          message: 'Supabase is not configured. Admin access requires the live database.',
        });
        return;
      }

      setAccess({ status: 'loading', message: '' });
      const { data, error } = await supabase.rpc('has_admin_permission', {
        p_permission: 'dashboard.view',
      });

      if (!active) return;
      if (error) {
        console.error('Admin permission check failed:', error);
        setAccess({
          status: 'error',
          message: 'Could not verify administrator permissions. Check the Supabase migrations and try again.',
        });
      } else if (data === true) {
        setAccess({ status: 'authorized', message: '' });
      } else {
        setAccess({ status: 'denied', message: '' });
      }
    }

    verifyAdmin();
    return () => {
      active = false;
    };
  }, [authLoading, user, location.pathname, checkAttempt]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Admin sign out failed:', error);
      setAccess({
        status: 'error',
        message: 'Sign out failed. Please try again.',
      });
    }
  }

  if (access.status === 'unauthenticated') {
    return (
      <AdminAccessMessage
        title="Sign in required"
        message="Sign in with an authorized Gulfam Sweets administrator account to continue."
        action={<Link className="btn btn-m" to="/login" state={{ from: location }}>Sign in</Link>}
      />
    );
  }

  if (access.status === 'denied') {
    return (
      <AdminAccessMessage
        title="Administrator access required"
        message="This account does not have permission to access the administration area."
        action={<Link className="btn btn-o" to="/">Return to storefront</Link>}
      />
    );
  }

  if (access.status !== 'authorized') {
    return (
      <AdminAccessMessage
        title={access.status === 'error' ? 'Unable to verify access' : 'Verifying access'}
        message={access.message || 'Checking your administrator permissions with Supabase…'}
        action={access.status === 'error' ? <button className="btn btn-o" onClick={() => setCheckAttempt((attempt) => attempt + 1)}>Retry</button> : null}
      />
    );
  }

  const activePage = navigation.find((item) =>
    item.path === '/admin'
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)
  );
  const initials = (user?.name || user?.email || 'Admin')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          className="admin-sidebar-scrim"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <Link to="/admin" className="admin-brand" onClick={() => setSidebarOpen(false)}>
          <span className="admin-brand-mark">G</span>
          <span>
            <strong>Gulfam Sweets</strong>
            <small>STORE ADMIN</small>
          </span>
        </Link>

        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="admin-logout-link" onClick={handleLogout}>
          <span className="admin-nav-icon" aria-hidden="true">↪</span>
          <span>Logout</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            aria-label="Open admin navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="admin-breadcrumb">
            <span>Gulfam Sweets</span>
            <span aria-hidden="true">/</span>
            <strong>{activePage?.label || 'Administration'}</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link to="/admin/inquiries" className="admin-notification-link" aria-label="View notifications and customer inquiries">
              <span aria-hidden="true">!</span>
              <span>Notifications</span>
            </Link>
            <Link className="admin-store-link" to="/" aria-label="Open storefront">
              View Store
            </Link>
            <div className="admin-profile-wrap">
              <button
                className="admin-profile-button"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="admin-avatar">{initials}</span>
                <span className="admin-profile-text">
                  <strong>{user?.name || 'Administrator'}</strong>
                  <small>Admin account</small>
                </span>
                <span aria-hidden="true">⌄</span>
              </button>
              {profileOpen && (
                <div className="admin-profile-menu">
                  <span>{user?.email}</span>
                  <button onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminAccessMessage({ title, message, action }) {
  return (
    <main className="admin-access">
      <section className="admin-access-card">
        <span className="admin-brand-mark">G</span>
        <p className="admin-eyebrow">GULFAM SWEETS ADMIN</p>
        <h1>{title}</h1>
        <p className="admin-access-message">{message}</p>
        {action}
      </section>
    </main>
  );
}
