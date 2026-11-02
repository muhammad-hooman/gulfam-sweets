import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login({ onShowToast }) {
  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authResult = await login({ emailOrPhone: emailOrPhone.trim(), password, rememberMe });
      if (onShowToast) onShowToast('Logged in successfully!');
      const resolvedRole = authResult?.role || authResult?.user?.role;
      if (
        (resolvedRole === 'super_admin' || resolvedRole === 'admin' || resolvedRole === 'manager') &&
        redirectPath === '/account'
      ) {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-g-light p-6 sm:p-10 shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="text-center">
          <span className="w-12 h-12 rounded-xl bg-m grid place-items-center font-display text-2xl font-bold text-g mx-auto shadow-md">
            G
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-m-dark mt-4">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Sign in to track orders, manage addresses &amp; wishlist
          </p>
        </div>

        {error && (
          <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="mt-6">
          <GoogleSignInButton
            redirectPath={redirectPath}
            onError={setError}
          />
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-stone-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-semibold text-stone-400 tracking-wider uppercase">
            Or continue with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Email or Phone Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. customer@example.com or 03001234567"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="text-sm"
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-stone-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-m hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-sm pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-semibold"
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-stone-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="!w-auto"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-m w-full py-3 text-sm shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            Don't have an account yet?{' '}
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-m font-bold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
