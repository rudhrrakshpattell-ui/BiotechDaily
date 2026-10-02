// Whether Connect is set up (Supabase env vars present). Tiny on purpose: the header and home page
// import it without pulling in the Supabase client.
export const connectEnabled = Boolean(import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY);
