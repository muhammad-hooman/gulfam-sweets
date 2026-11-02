import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ResetPassword({ onShowToast }) {
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      if (onShowToast) onShowToast('Password updated successfully!');
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-g-light p-6 sm:p-10 shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="text-center">
          <span className="w-12 h-12 rounded-xl bg-m grid place-items-center font-display text-2xl font-bold text-g mx-auto shadow-md">
            G
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-m-dark mt-4">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Choose a strong password for your Gulfam Sweets account
          </p>
        </div>

        {success ? (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
            <div className="text-3xl">✓</div>
            <h2 className="font-bold text-base">Password Updated!</h2>
            <p className="text-xs leading-relaxed text-stone-600">
              Your password has been changed securely. You can now use your new password to sign in to your account.
            </p>
            <div className="pt-2">
              <Link to="/account" className="btn btn-m !text-xs !py-2.5 !px-6">
                Go to My Account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                New Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Confirm New Password <span className="text-rose-600">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-m w-full py-3 text-sm shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              {loading ? 'Updating Password…' : 'Save New Password'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-stone-500 hover:text-m">
                &larr; Cancel and return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

