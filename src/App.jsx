import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CatalogProvider } from './context/CatalogContext';
import { SiteMediaProvider } from './context/SiteMediaContext';

// Layout & Global Components
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Toast from './components/Toast';

// 24 Dedicated Pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetails from './pages/ProductDetails';
import SearchResults from './pages/SearchResults';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import AccountDashboard from './pages/AccountDashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQs from './pages/FAQs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminPages from './pages/admin/AdminPages';

import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import { ProtectedRoute, GuestRoute, AdminRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

function PublicChrome({ children }) {
  const { pathname } = useLocation();
  return pathname === '/admin' || pathname.startsWith('/admin/')
    ? null
    : children;
}

export default function App() {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2200);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CatalogProvider>
          <SiteMediaProvider>
            <CartProvider>
              <WishlistProvider onShowToast={showToast}>
              <div className="flex flex-col min-h-screen text-[#2d2326] bg-cream/30">
              {/* Header */}
              <PublicChrome>
                <Header />
              </PublicChrome>

              {/* Main Routing View */}
              <main className="flex-1">
                <Routes>
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminPages />} />
                    <Route path="*" element={<AdminPages />} />
                  </Route>
                  <Route
                    path="/category/:categorySlug"
                    element={<CategoryPage onShowToast={showToast} />}
                  />

                  {/* 1. Home */}
                  <Route path="/" element={<Home onShowToast={showToast} />} />

                  {/* 2 - 8. Category Subpages */}
                  <Route
                    path="/mithai"
                    element={
                      <CategoryPage
                        forcedSlug="mithai"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/nimco"
                    element={
                      <CategoryPage
                        forcedSlug="nimco"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/fresh-snacks"
                    element={
                      <CategoryPage
                        forcedSlug="snacks"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/frozen-foods"
                    element={
                      <CategoryPage
                        forcedSlug="frozen"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/bakery"
                    element={
                      <CategoryPage
                        forcedSlug="bakery"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/cakes"
                    element={
                      <CategoryPage
                        forcedSlug="cakes"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/wedding-bulk"
                    element={
                      <CategoryPage
                        forcedSlug="wedding"
                        onShowToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="/category/:categorySlug"
                    element={<CategoryPage onShowToast={showToast} />}
                  />

                  {/* 9. Product Details */}
                  <Route
                    path="/product/:id"
                    element={<ProductDetails onShowToast={showToast} />}
                  />

                  {/* 10. Search Results */}
                  <Route
                    path="/search"
                    element={<SearchResults onShowToast={showToast} />}
                  />

                  {/* 11. Shopping Cart */}
                  <Route
                    path="/cart"
                    element={<Cart onShowToast={showToast} />}
                  />

                  {/* 12. Checkout */}
                  <Route
                    path="/checkout"
                    element={<Checkout onShowToast={showToast} />}
                  />

                  {/* 13. Login */}
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <Login onShowToast={showToast} />
                      </GuestRoute>
                    }
                  />

                  {/* 14. Signup */}
                  <Route
                    path="/signup"
                    element={
                      <GuestRoute>
                        <Signup onShowToast={showToast} />
                      </GuestRoute>
                    }
                  />

                  {/* 15. Forgot Password */}
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPassword />
                      </GuestRoute>
                    }
                  />

                  {/* Dedicated Password Reset & OAuth Callback Routes */}
                  <Route
                    path="/reset-password"
                    element={<ResetPassword onShowToast={showToast} />}
                  />
                  <Route
                    path="/auth/callback"
                    element={<AuthCallback />}
                  />

                  {/* 16. My Account / Dashboard */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <AccountDashboard onShowToast={showToast} />
                      </ProtectedRoute>
                    }
                  />

                  {/* 17. My Orders & Order Details */}
                  <Route
                    path="/account/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account/orders/:orderId"
                    element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* 18. Wishlist */}
                  <Route
                    path="/wishlist"
                    element={<Wishlist onShowToast={showToast} />}
                  />

                  {/* 19. About Us */}
                  <Route path="/about" element={<About />} />

                  {/* 20. Contact Us */}
                  <Route
                    path="/contact"
                    element={<Contact onShowToast={showToast} />}
                  />

                  {/* 21. FAQs */}
                  <Route path="/faqs" element={<FAQs />} />

                  {/* 22. Privacy Policy */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                  {/* 23. Terms & Conditions */}
                  <Route path="/terms" element={<Terms />} />

                  {/* 24. 404 Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              {/* Footer */}
              <PublicChrome>
                <Footer />
              </PublicChrome>

              {/* Slide-over Cart Drawer */}
              <PublicChrome>
                <CartDrawer onShowToast={showToast} />
              </PublicChrome>

              {/* Floating WhatsApp Action Button */}
              <PublicChrome>
                <FloatingWhatsApp />
              </PublicChrome>

              {/* Global Toast Notification */}
              <PublicChrome>
                <Toast message={toastMessage} />
              </PublicChrome>
              </div>
            </WishlistProvider>
          </CartProvider>
        </SiteMediaProvider>
      </CatalogProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
