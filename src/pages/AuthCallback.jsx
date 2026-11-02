import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

function sanitizeRedirect(target) {
  if (!target || typeof target !== 'string') return '/account';
  const clean = target.trim();
  if (
    clean === '' ||
    clean.startsWith('/auth/callback') ||
    clean.startsWith('/login') ||
    clean.startsWith('/signup') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('//')
  ) {
    return '/account';
  }
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      // 1. Guard against duplicate execution in React StrictMode
      if (processedRef.current) return;
      processedRef.current = true;

      // 2. Parse query parameters and hash fragment
      const queryError = searchParams.get('error');
      const queryErrorDesc = searchParams.get('error_description');

      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);

      const hashError = hashParams.get('error');
      const hashErrorDesc = hashParams.get('error_description');

      const oauthError = queryError || hashError;
      const oauthErrorDesc = queryErrorDesc || hashErrorDesc;

      if (oauthError) {
        console.error('OAuth callback error:', oauthError, oauthErrorDesc);
        if (isMounted) {
          if (oauthError === 'access_denied') {
            setErrorMessage('Google sign-in was cancelled or access was not granted.');
          } else {
            setErrorMessage(oauthErrorDesc || 'Google sign-in failed. Please try again.');
          }
          setProcessing(false);
        }
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setErrorMessage('Supabase is not configured on this deployment. Please verify your environment variables.');
          setProcessing(false);
        }
        return;
      }

      const getDestination = () => {
        let dest = '/account';
        try {
          dest = sessionStorage.getItem('gulfam_auth_redirect') || searchParams.get('redirect') || '/account';
          sessionStorage.removeItem('gulfam_auth_redirect');
        } catch {
          dest = '/account';
        }
        return sanitizeRedirect(dest);
      };

      // 3. Handle PKCE authorization code (?code=...)
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;

          if (data?.session && isMounted) {
            // Strip the code from the URL for cleanliness and security
            window.history.replaceState(null, '', window.location.pathname);
            const destination = getDestination();
            navigate(destination, { replace: true });
            return;
          }
        } catch (err) {
          console.error('PKCE exchange error:', err);
          if (isMounted) {
            setErrorMessage(err.message || 'Failed to exchange authorization code for an active session.');
            setProcessing(false);
          }
          return;
        }
      }

      // 4. Handle Implicit Flow hash tokens (#access_token=...&refresh_token=...)
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data, error: setSessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // Scrub sensitive tokens from the browser URL immediately
          window.history.replaceState(null, '', window.location.pathname);

          if (setSessionErr) throw setSessionErr;

          if (data?.session && isMounted) {
            const destination = getDestination();
            navigate(destination, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Hash token session establishment error:', err);
          if (isMounted) {
            setErrorMessage(err.message || 'Failed to establish session from authentication tokens.');
            setProcessing(false);
          }
          return;
        }
      }

      // 5. Check if Supabase client auto-detected the session in the background
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (sessionData?.session?.user && isMounted) {
          window.history.replaceState(null, '', window.location.pathname);
          const destination = getDestination();
          navigate(destination, { replace: true });
          return;
        }

        // 6. Listen briefly for an asynchronous auth state change event
        let sessionResolved = false;
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && newSession?.user) {
            sessionResolved = true;
            authListener?.subscription?.unsubscribe();
            if (isMounted) {
              window.history.replaceState(null, '', window.location.pathname);
              const destination = getDestination();
              navigate(destination, { replace: true });
            }
          }
        });

        // 7. Safety timeout: if no code, no tokens, and no session, redirect to login cleanly
        setTimeout(() => {
          if (!sessionResolved && isMounted) {
            authListener?.subscription?.unsubscribe();
            // If user opened /auth/callback directly without tokens/codes:
            if (!code && !accessToken && !oauthError) {
              navigate('/login', { replace: true });
            } else {
              setErrorMessage('Authentication verification timed out. Please try signing in again.');
              setProcessing(false);
            }
          }
        }, 3500);

      } catch (err) {
        console.error('Session retrieval error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Unable to confirm authentication session.');
          setProcessing(false);
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  if (errorMessage) {
    const isExternalCodeError = errorMessage.toLowerCase().includes('external code');

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-xl max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 grid place-items-center text-2xl mx-auto font-bold">
            !
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-800">
            Sign-In Incomplete
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            {errorMessage}
          </p>

          {isExternalCodeError && (
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-left text-xs text-amber-900 space-y-2.5">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>Key</span> Google OAuth Configuration Checklist:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-700">
                <li>
                  <strong className="text-amber-950">Authorized redirect URIs in Google Cloud:</strong> Must be set to:
                  <div className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-amber-300 mt-1 select-all break-all text-amber-900">
                    https://ggiustpuhrskaeamksdy.supabase.co/auth/v1/callback
                  </div>
                </li>
                <li>
                  <strong className="text-amber-950">Supabase Redirect URLs:</strong> Add your production Vercel domain:
                  <div className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-amber-300 mt-1 select-all break-all text-amber-900">
                    https://&lt;your-domain&gt;/auth/callback
                  </div>
                </li>
              </ul>
            </div>
          )}

          <div className="pt-3 flex items-center justify-center gap-3">
            <Link to="/login" className="btn btn-m !text-xs !py-2.5 !px-6">
              Return to Sign In
            </Link>
            <Link to="/" className="btn btn-outline !text-xs !py-2.5 !px-6">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl max-w-sm w-full text-center space-y-4">
        <div className="w-10 h-10 border-3 border-stone-200 border-t-[#6B0F1A] rounded-full animate-spin mx-auto" />
        <h2 className="font-display text-xl font-bold text-[#45090F]">
          Completing Sign-In
        </h2>
        <p className="text-xs text-stone-500">
          Securing your Gulfam Sweets session…
        </p>
      </div>
    </div>
  );
}
