import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

function isValidSupabaseUrl(value) {
  if (typeof value !== 'string' || value.includes('your-supabase-project')) {
    return false;
  }

  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const isHttps = url.protocol === 'https:';

    return (isHttps || isLocalHttp) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isPublicSupabaseKey(value) {
  if (typeof value !== 'string' || value.length <= 20) {
    return false;
  }

  if (value.startsWith('sb_publishable_')) {
    return true;
  }

  if (value.startsWith('sb_secret_')) {
    console.error('CRITICAL: Supabase secret key detected in frontend environment. Only use the public anon key.');
    return false;
  }

  const parts = value.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [, encodedPayload] = parts;
  if (!encodedPayload || typeof atob !== 'function') {
    return false;
  }

  try {
    const base64Payload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload));
    if (payload.role === 'service_role') {
      console.error('CRITICAL: Supabase service_role key detected. Only use the public anon key in frontend.');
      return false;
    }
    return payload.role === 'anon' || Boolean(payload.iss && payload.exp);
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && isPublicSupabaseKey(supabaseKey)
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;
