import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SITE_CONFIG } from '../config/siteConfig';
import { formatPrice } from '../data/products';
import { useCatalog } from '../context/CatalogContext';

export default function Header() {
  const { subtotal, itemCount, openCartDrawer } = useCart();
  const { user } = useAuth();
  const { categories } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navCategories = [
    { name: 'Mithai', path: '/mithai' },
    { name: 'Nimco', path: '/nimco' },
    { name: 'Fresh Snacks', path: '/fresh-snacks' },
    {
      name: 'Frozen Foods',
      path: '/frozen-foods',
      badge: 'NEW',
    },
    { name: 'Bakery', path: '/bakery' },
    { name: 'Cakes', path: '/cakes' },
    {
      name: 'Wedding & Bulk',
      path: '/wedding-bulk',
      highlight: true,
    },
  ];

  return (
    <>
      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm transition-all border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden text-m p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>

          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <span className="w-10 h-10 rounded-lg bg-m grid place-items-center font-display text-2xl font-bold text-g shadow-sm group-hover:scale-105 transition-transform">
              G
            </span>
            <span className="leading-none">
              <span className="font-display text-xl md:text-2xl font-bold text-m block tracking-tight">
                Gulfam Sweets
              </span>
              <span className="text-[9px] tracking-[.22em] text-g-dark font-semibold">
                {SITE_CONFIG.tagline}
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nv hidden xl:flex gap-6 items-center">
            {navCategories.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-stone-800 hover:text-m font-medium text-[14.5px] transition-colors relative py-1 flex items-center gap-1.5 ${
                    item.highlight ? '!text-g-dark font-semibold' : ''
                  } ${isActive ? 'on font-bold !text-m' : ''}`
                }
              >
                {item.name}
                {item.badge && (
                  <sup className="bg-m text-g text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                    {item.badge}
                  </sup>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 text-m">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-700 hover:text-m"
              aria-label="Search delicacies"
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" strokeLinecap="round" />
              </svg>
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="hidden sm:grid place-items-center p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-700 hover:text-m"
              aria-label="Wishlist"
              title="My Wishlist"
            >
              <span className="text-xl leading-none text-stone-400 hover:text-m transition-colors">
                &#9829;
              </span>
            </Link>

            {/* Admin Panel Quick Access Button */}
            {user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-900 font-bold px-3 py-1.5 rounded-full text-xs shadow-xs transition-transform hover:scale-105"
                title="Admin Dashboard"
              >
                <span>👑</span>
                <span className="font-semibold tracking-tight">Admin</span>
              </Link>
            )}

            {/* User Account Link */}
            <Link
              to={user ? '/account' : '/login'}
              className="hidden sm:inline-flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-full hover:bg-stone-100 transition-colors text-stone-700 hover:text-m border border-stone-200"
              aria-label="Account"
              title={user ? `Signed in as ${user.name}` : 'Sign In'}
            >
              <svg
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user ? (
                <span className="text-xs font-semibold text-stone-800 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              ) : (
                <span className="text-xs font-medium text-stone-700">
                  Sign In
                </span>
              )}
            </Link>

            {/* Cart Button (Exact Match to Screenshot) */}
            <button
              onClick={openCartDrawer}
              className="relative bg-m text-white rounded-full pl-3.5 pr-4 sm:pl-4 sm:pr-5 py-2 flex items-center gap-2 hover:bg-m-dark transition-all shadow-md group"
              aria-label="View shopping cart"
            >
              {/* Item Count Badge */}
              <span className="absolute -top-1.5 -left-1 bg-g text-m-dark text-[11px] font-bold rounded-full min-w-[20px] h-[20px] px-1 grid place-items-center shadow-md">
                {itemCount}
              </span>

              {/* Gold Cart Icon */}
              <svg
                width="19"
                height="19"
                fill="none"
                stroke="#D4A62A"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
                className="group-hover:scale-105 transition-transform"
              >
                <path d="M3 4h2l2.4 11h10.2L20 7H6" />
                <circle cx="9" cy="19.5" r="1.3" />
                <circle cx="17" cy="19.5" r="1.3" />
              </svg>

              {/* Live PKR Total */}
              <span className="font-semibold text-xs sm:text-sm text-white tracking-tight">
                {formatPrice(subtotal)}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Search Form Bar */}
        {searchOpen && (
          <div className="border-t border-stone-200 bg-white shadow-inner animate-fadeIn">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto p-3 flex gap-2"
            >
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search samosas, gulab jamun, nan khatai, frozen..."
                className="!rounded-full text-sm"
              />
              <button type="submit" className="btn btn-m shrink-0">
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-stone-200 bg-white px-4 py-4 shadow-xl animate-fadeIn">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm font-medium nv">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `py-1.5 ${isActive ? 'on font-bold !text-m' : ''}`
                }
              >
                Home
              </NavLink>
              {navCategories.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-1.5 flex items-center gap-1 ${
                      item.highlight ? '!text-g-dark font-semibold' : ''
                    } ${isActive ? 'on font-bold !text-m' : ''}`
                  }
                >
                  {item.name}
                  {item.badge && (
                    <span className="bg-m text-g text-[7px] font-bold px-1 rounded">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
              <NavLink
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                Cart ({itemCount})
              </NavLink>
              <NavLink
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                My Wishlist
              </NavLink>
              <NavLink
                to={user ? '/account' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 font-semibold text-m"
              >
                {user ? 'My Account' : 'Sign In / Register'}
              </NavLink>
              {user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 font-bold text-amber-700 flex items-center gap-1.5"
                >
                  <span>👑</span> Admin Dashboard
                </NavLink>
              )}
              <NavLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                Contact
              </NavLink>
              <NavLink
                to="/faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                FAQs
              </NavLink>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Order Delivery Hotline:</span>
              <a
                href={`tel:${SITE_CONFIG.phoneTel}`}
                className="text-m font-bold hover:underline"
              >
                {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
