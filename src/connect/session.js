// Shared auth state for Connect: the Supabase session and the signed-in member's profile.
import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase.js';

const SIGNED_OUT = { loading: false, session: null, profile: null };
let state = { loading: true, session: null, profile: null };
const listeners = new Set();
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

async function loadProfile(session) {
  if (!session) return set({ loading: false, session: null, profile: null });
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  set({ loading: false, session, profile: data ?? null });
}

let started = false;
function start() {
  if (started || !supabase) return;
  started = true;
  supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
  supabase.auth.onAuthStateChange((_event, session) => {
    // Defer: calling Supabase inside this callback can deadlock the auth lock.
    setTimeout(() => loadProfile(session), 0);
  });
}

export const refreshProfile = () => loadProfile(state.session);

export function useSession() {
  useEffect(start, []);
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => (supabase ? state : SIGNED_OUT),
  );
}
