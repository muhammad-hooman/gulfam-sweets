import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(true);
  const exchangedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for URL query error parameters from OAuth provider
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth error from provider:', error, errorDescription);
        if (isMounted) {
          if (error === 'access_denied') {
            setErrorMessage('Google sign-in was cancelled or access was denied.');
          } else {
            setErrorMessage(errorDescription || 'Authentication failed. Please try again.');
          }
          setProcessing(false);
        }
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setErrorMessage('Supabase is not configured. Unable to complete sign-in.');
          setProcessing(false);
        }
        return;
      }

      // 2. Check if authorization code is present in query parameters (PKCE flow)
      const code = searchParams.get('code');

      if (code && !exchangedRef.current) {
        exchangedRef.current = true;
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          if (data?.session && isMounted) {
            const savedRedirect = sessionStorage.getItem('gulfam_auth_redirect') || '/account';
            sessionStorage.removeItem('gulfam_auth_redirect');
            navigate(savedRedirect, { replace: true });
            return;
          }
        } catch (exchangeErr) {
          console.error('Error exchanging code for session:', exchangeErr);
          if (isMounted) {
            setErrorMessage(exchangeErr.message || 'Failed to exchange authorization code.');
            setProcessing(false);
          }
          return;
        }
      }

      try {
        // 3. Fallback: check existing session or hash tokens
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (data?.session) {
          const savedRedirect = sessionStorage.getItem('gulfam_auth_redirect') || '/account';
          sessionStorage.removeItem('gulfam_auth_redirect');

          if (isMounted) {
            navigate(savedRedirect, { replace: true });
          }
        } else {
          // Listen for onAuthStateChange in case session is being processed asynchronously
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user && isMounted) {
              authListener?.subscription?.unsubscribe();
              const savedRedirect = sessionStorage.getItem('gulfam_auth_redirect') || '/account';
              sessionStorage.removeItem('gulfam_auth_redirect');
              navigate(savedRedirect, { replace: true });
            }
          });

          // Timeout fallback in case no session arrives
          setTimeout(() => {
            if (isMounted && processing) {
              authListener?.subscription?.unsubscribe();
              setErrorMessage('Session confirmation timed out. Please try signing in again.');
              setProcessing(false);
            }
          }, 6000);
        }
      } catch (err) {
        console.error('Failed to process auth callback:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Authentication failed. Please try again.');
          setProcessing(false);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  if (errorMessage) {
    const isExternalCodeError = errorMessage.toLowerCase().includes('external code');

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-xl max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 grid place-items-center text-2xl mx-auto">
            ⚠
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
                <span>🔑</span> Google OAuth Credentials Fix:
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Supabase received the Google authorization code, but Google's OAuth servers rejected the token exchange. This happens due to one of the following:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-700">
                <li>
                  <strong className="text-amber-950">Redirect URI in Google Console:</strong> Go to <em>Google Cloud Console &rarr; Credentials &rarr; OAuth 2.0 Client IDs</em>, and verify <strong>Authorized redirect URIs</strong> is set to:
                  <div className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-amber-300 mt-1 select-all break-all text-amber-900">
                    https://ggiustpuhrskaeamksdy.supabase.co/auth/v1/callback
                  </div>
                  <em>(Do NOT put localhost here — Google must redirect to Supabase)</em>
                </li>
                <li>
                  <strong className="text-amber-950">Client Secret in Supabase:</strong> In <em>Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Google</em>, ensure your <strong>Client Secret</strong> was copied without any extra spaces or missing characters.
                </li>
                <li>
                  <strong className="text-amber-950">Testing Status in Google:</strong> If your OAuth Consent Screen in Google Cloud Console is in <strong>Testing</strong> mode, add your Gmail account to the <strong>Test users</strong> list, or click <strong>Publish App</strong>.
                </li>
              </ul>
            </div>
          )}

          <div className="pt-3 flex items-center justify-center gap-3">
            <Link to="/login" className="btn btn-m !text-xs !py-2.5 !px-6">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl max-w-sm w-full text-center space-y-4">
        <div className="w-10 h-10 border-3 border-stone-200 border-t-m rounded-full animate-spin mx-auto" />
        <h2 className="font-display text-xl font-bold text-m-dark">
          Completing Sign-In
        </h2>
        <p className="text-xs text-stone-500">
          Securing your Gulfam Sweets session…
        </p>
      </div>
    </div>
  );
}

