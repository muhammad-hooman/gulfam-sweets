import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
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
    return false;
  }

  const [, encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature || typeof atob !== 'function') {
    return false;
  }

  try {
    const base64Payload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && isPublicSupabaseKey(supabaseKey)
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
