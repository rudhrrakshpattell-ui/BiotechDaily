import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import Linkified from '../components/Linkified.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { canMessage, deleteMessage, getProfile, listMessages, markConversationRead, sendMessage, subscribeToMessages } from '../data.js';
import { friendlyError } from '../supabase.js';
import { refreshUnread } from '../unread.js';
import { SkeletonList } from '../../components/ui.jsx';

const MAX = 2000;
const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};
const timeLabel = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function Bubble({ m, mine, onDelete, onReport }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={`group flex items-end gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
      {mine && (
        <div className="relative opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button onClick={() => setMenu((v) => !v)} className="focus-ring grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Message options"><Icon name="more" className="h-4 w-4" /></button>
          {menu && (
            <div className="card absolute bottom-8 right-0 z-10 w-36 overflow-hidden py-1 text-sm shadow-lg">
              <button onClick={() => { setMenu(false); onDelete(m); }} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Unsend</button>
            </div>
          )}
        </div>
      )}
      <div
        title={new Date(m.created_at).toLocaleString()}
        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2 text-[15px] leading-snug ${
          mine ? 'rounded-br-md bg-brand-600 text-white [&_a]:text-white [&_a]:decoration-white/60' : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-white/[0.08] dark:text-slate-100'
        }`}
      >
        <Linkified text={m.body} />
      </div>
      {!mine && (
        <div className="relative opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button onClick={() => setMenu((v) => !v)} className="focus-ring grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Message options"><Icon name="more" className="h-4 w-4" /></button>
          {menu && (
            <div className="card absolute bottom-8 left-0 z-10 w-36 overflow-hidden py-1 text-sm shadow-lg">
              <button onClick={() => { setMenu(false); onReport(m); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5">Report</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Chat({ profile, username }) {
  const me = profile.id;
  const [other, setOther] = useState(undefined);
  const [messages, setMessages] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState({ sending: false, error: null });
  const [reporting, setReporting] = useState(null);
  const bottomRef = useRef(null);
  const textRef = useRef(null);

  // Load the person, the history and whether we may send; then mark their messages read.
  useEffect(() => {
    let live = true;
    setOther(undefined);
    setMessages(null);
    getProfile(username).then(async (p) => {
      if (!live) return;
      setOther(p);
      if (!p) return;
      const [history, ok] = await Promise.all([listMessages(me, p.id), canMessage(p.id)]);
      if (!live) return;
      setMessages(history);
      setAllowed(ok);
      await markConversationRead(me, p.id).catch(() => {});
      refreshUnread();
    }, () => live && setOther(null));
    return () => { live = false; };
  }, [username, me]);

  // Live: append their new messages and mark them read while the chat is open.
  useEffect(() => {
    if (!other) return;
    return subscribeToMessages(me, (m) => {
      if (m.sender_id !== other.id) return;
      setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
      markConversationRead(me, other.id).then(refreshUnread, () => {});
    });
  }, [me, other]);

  useLayoutEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages?.length]);

  async function send(e) {
    e?.preventDefault();
    if (!draft.trim() || !other) return;
    setState({ sending: true, error: null });
    try {
      const m = await sendMessage(me, other.id, draft);
      setMessages((prev) => [...(prev ?? []), m]);
      setDraft('');
      if (textRef.current) textRef.current.style.height = 'auto';
      setState({ sending: false, error: null });
    } catch (err) {
      setState({ sending: false, error: friendlyError(err) });
      canMessage(other.id).then(setAllowed, () => {});
    }
  }

  async function unsend(m) {
    if (!window.confirm('Unsend this message? It will be removed for both of you.')) return;
    await deleteMessage(m.id);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
  }

  if (other === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">This conversation isn’t available</p>
        <a href="/connect/messages" className="focus-ring mt-6 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">Back to messages</a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-2xl flex-col px-0 sm:px-6 sm:py-4">
      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden rounded-none sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 dark:border-white/[0.06]">
          <a href="/connect/messages" className="focus-ring grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Back to messages"><Icon name="chevronLeft" className="h-5 w-5" /></a>
          {other ? (
            <a href={`/connect/u/${other.username}`} className="focus-ring flex min-w-0 items-center gap-2.5 rounded-lg">
              <Avatar profile={other} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-tight text-slate-900 dark:text-white">{other.display_name}</span>
                <span className="block truncate text-xs text-slate-500">@{other.username}</span>
              </span>
            </a>
          ) : <span className="skeleton h-9 w-40" />}
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p className="mx-auto mb-5 max-w-md rounded-2xl bg-amber-50 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
            Messages are private between you two. Never share your address, phone number, passwords or where you are. If anything feels wrong, use ••• → <span className="font-semibold">Report</span> or block them from their profile.
          </p>
          {!messages && <SkeletonList count={3} className="my-2 h-10" />}
          {messages?.length === 0 && other && <p className="py-8 text-center text-sm text-slate-500">Say hi to {other.display_name} 👋</p>}
          <div className="space-y-1.5">
            {messages?.map((m, i) => {
              const newDay = i === 0 || new Date(m.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
              const lastOfRun = i === messages.length - 1 || messages[i + 1].sender_id !== m.sender_id || new Date(messages[i + 1].created_at) - new Date(m.created_at) > 5 * 60000;
              const mine = m.sender_id === me;
              return (
                <Fragment key={m.id}>
                  {newDay && <p className="py-3 text-center text-xs font-medium text-slate-500">{dayLabel(m.created_at)}</p>}
                  <Bubble m={m} mine={mine} onDelete={unsend} onReport={(x) => setReporting(x.id)} />
                  {lastOfRun && (
                    <p className={`pb-2 text-[11px] text-slate-400 ${mine ? 'pr-1 text-right' : 'pl-1'}`}>
                      {timeLabel(m.created_at)}{mine && i === messages.length - 1 && m.read_at ? ' · Seen' : ''}
                    </p>
                  )}
                </Fragment>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 p-3 dark:border-white/[0.06]">
          {allowed === false ? (
            <p className="px-2 py-2 text-center text-sm text-slate-500">
              You can message {other?.display_name ?? 'this member'} when you <span className="font-semibold">follow each other</span>.{' '}
              {other && <a href={`/connect/u/${other.username}`} className="font-semibold text-brand-600 dark:text-brand-300">View profile</a>}
            </p>
          ) : (
            <form onSubmit={send} className="flex items-end gap-2">
              <label htmlFor="dm-input" className="sr-only">Message</label>
              <textarea
                ref={textRef}
                id="dm-input"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value.slice(0, MAX));
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                rows={1}
                placeholder="Start a new message"
                disabled={allowed === null}
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              />
              <button disabled={!draft.trim() || state.sending} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40" aria-label="Send">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3 10l12 2-12 2z" /></svg>
              </button>
            </form>
          )}
          {state.error && <p className="mt-1 px-2 text-sm text-rose-600">{state.error}</p>}
        </div>
      </div>
      {reporting && <ReportDialog target={{ messageId: reporting }} onClose={() => setReporting(null)} />}
    </div>
  );
}
