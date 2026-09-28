// Unread direct-message count for the signed-in member, kept live for the Messages badge.
import { useEffect, useSyncExternalStore } from 'react';
import { subscribeToMessages, unreadMessageCount } from './data.js';

let count = 0;
let owner = null;
let stop = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export async function refreshUnread() {
  if (!owner) return;
  try { count = await unreadMessageCount(); emit(); } catch {}
}

function start(me) {
  if (owner === me) return;
  stop?.();
  owner = me;
  count = 0;
  emit();
  if (!me) { stop = null; return; }
  refreshUnread();
  const unsubscribe = subscribeToMessages(me, () => refreshUnread());
  const onFocus = () => refreshUnread();
  window.addEventListener('focus', onFocus);
  stop = () => { unsubscribe(); window.removeEventListener('focus', onFocus); };
}

export function useUnreadMessages(me) {
  useEffect(() => { start(me ?? null); }, [me]);
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => count);
}
