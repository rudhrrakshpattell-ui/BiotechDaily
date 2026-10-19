// Supabase client for Connect (the community, under /connect). Only imported by the Connect pages, so the rest of the
// site doesn't download it. The anon key is public by design: access is enforced by the row-level
// security policies in supabase/migrations/0001_connect.sql.
import { createClient } from '@supabase/supabase-js';
import { connectEnabled } from './enabled.js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isConfigured = connectEnabled;

export const supabase = isConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
  : null;

// Whether a sign-in provider (e.g. 'google') is switched on in the Supabase dashboard. Read from the public
// auth settings, so the button only appears once it works. Cached for the page's lifetime.
let authSettings = null;
export function providerEnabled(provider) {
  if (!isConfigured) return Promise.resolve(false);
  authSettings ??= fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return authSettings.then((s) => Boolean(s.external?.[provider]));
}

// Supabase errors from our RPCs carry a friendly message; fall back to a generic one otherwise.
export function friendlyError(error) {
  if (!error) return null;
  if (error.code === 'P0001' || error.code === '23514') return error.message;
  if (error.code === '23505') return 'That’s already taken.';
  if (/rate limit/i.test(error.message)) return 'Too many attempts. Please wait a minute and try again.';
  return error.message || 'Something went wrong. Please try again.';
}
