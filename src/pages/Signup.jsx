import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Signup({ onShowToast }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      if (onShowToast) onShowToast('Account created successfully!');
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-g-light p-6 sm:p-10 shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="text-center">
          <span className="w-12 h-12 rounded-xl bg-m grid place-items-center font-display text-2xl font-bold text-g mx-auto shadow-md">
            G
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-m-dark mt-4">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Join the Gulfam family for fast checkout and royal privileges
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
            Or register with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Fatima Ali"
              value={formData.name}
              onChange={handleChange}
              className="text-sm"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. fatima@example.com"
              value={formData.email}
              onChange={handleChange}
              className="text-sm"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="0300 1234567"
              value={formData.phone}
              onChange={handleChange}
              className="text-sm"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Create Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="text-sm pr-10"
                autoComplete="new-password"
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

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Confirm Password <span className="text-rose-600">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="text-sm"
              autoComplete="new-password"
            />
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed">
            By signing up, you agree to Gulfam Sweets &amp; Dairy{' '}
            <Link to="/terms" className="text-m underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-m underline">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-m w-full py-3 text-sm shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            Already registered?{' '}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-m font-bold hover:underline"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
