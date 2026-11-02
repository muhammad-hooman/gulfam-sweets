import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to send password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-g-light p-6 sm:p-10 shadow-xl max-w-md w-full text-center">
        <span className="w-12 h-12 rounded-xl bg-m grid place-items-center font-display text-2xl font-bold text-g mx-auto shadow-md">
          G
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-m-dark mt-4">
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Enter your registered email address to receive password reset instructions.
        </p>

        {success ? (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
            <div className="text-3xl">✉️</div>
            <h3 className="font-bold text-base">Check Your Inbox</h3>
            <p className="text-xs leading-relaxed">
              We have dispatched password reset instructions to <b>{email}</b>. Please follow the link in your email to choose a new password.
            </p>
            <div className="pt-2">
              <Link to="/login" className="btn btn-m !text-xs !py-2 !px-5">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4 text-left">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-m w-full py-3 text-sm shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
            </button>

            <div className="text-center pt-3">
              <Link to="/login" className="text-xs font-semibold text-m hover:underline">
                &larr; Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

