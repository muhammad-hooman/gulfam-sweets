import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Route wrapper that requires an authenticated customer session.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-m rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-xs">Verifying session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}

/**
 * Route wrapper for guest-only pages (Login, Signup, ForgotPassword).
 * If the user is already authenticated, redirect them to account or intended destination.
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user) {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('redirect') || '/account';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

/**
 * Route wrapper for admin pages that checks database RBAC permissions.
 */
export function AdminRoute({ children }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (loading) return;
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Fast-path: role already loaded in AuthContext
      const currentRole = role || user.role;
      if (currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'manager') {
        if (active) setIsAdmin(true);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_admin_permission', {
          p_permission: 'dashboard.view',
        });

        if (active) {
          setIsAdmin(!error && data === true);
        }
      } catch (err) {
        console.error('Error verifying admin permission:', err);
        if (active) setIsAdmin(false);
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [user, loading, role]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-stone-900 text-stone-300">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs tracking-wider uppercase font-semibold">Verifying Administrator Permissions…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

