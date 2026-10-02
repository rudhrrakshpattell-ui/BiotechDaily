import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import { listConversations, messageCandidates, subscribeToMessages } from '../data.js';
import { SkeletonList } from '../../components/ui.jsx';
import { timeAgo } from '../../services/format.js';
import { navigate } from '../../hooks/useRoute.js';

function NewMessageDialog({ me, onClose }) {
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { messageCandidates(me).then(setPeople, () => setPeople([])); }, [me]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (people ?? []).filter((p) => !needle || `${p.display_name} ${p.username} ${p.university ?? ''}`.toLowerCase().includes(needle));
  }, [people, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="New message">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <button onClick={onClose} className="focus-ring grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close"><Icon name="x" className="h-4 w-4" /></button>
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">New message</p>
        </div>
        <div className="border-b border-slate-100 px-4 py-2 dark:border-white/5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people you follow" autoFocus className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" aria-label="Search" />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {!people && <div className="p-4"><SkeletonList count={3} className="my-2 h-12" /></div>}
          {people?.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">Follow some students first. You can message people you follow; if they don’t follow you back, your first message arrives as a request.</p>
          )}
          {shown.map((p) => (
            <button key={p.id} onClick={() => navigate(`/connect/messages/${p.username}`)} className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5">
              <Avatar profile={p} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{p.display_name}</span>
                <span className="block truncate text-xs text-slate-500">@{p.username}{p.university ? ` · ${p.university}` : ''}</span>
              </span>
              {p.followsMe && <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">Follows you</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Messages({ profile }) {
  const me = profile.id;
  const [conversations, setConversations] = useState(null);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('chats');
  const chats = conversations?.filter((c) => !c.isRequest) ?? null;
  const requests = conversations?.filter((c) => c.isRequest) ?? [];
  const shown = tab === 'requests' ? requests : chats;

  useEffect(() => {
    const load = () => listConversations().then(setConversations, (err) => setError(err.message));
    load();
    return subscribeToMessages(me, load);
  }, [me]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Messages</h1>
        <button onClick={() => setComposing(true)} className="focus-ring inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          <Icon name="message" className="h-4 w-4" /> New message
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-100 dark:border-white/[0.06]" role="tablist" aria-label="Conversations">
          {[['chats', 'Chats'], ['requests', `Requests${requests.length ? ` (${requests.length})` : ''}`]].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="focus-ring flex justify-center py-3.5 text-[15px] transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <span className={`relative ${tab === id ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500'}`}>
                {label}
                {tab === id && <span className="absolute -bottom-3.5 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-brand-500" />}
              </span>
            </button>
          ))}
        </div>
        {tab === 'requests' && requests.length > 0 && (
          <p className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-white/[0.06]">People you don’t follow. Open a request to reply (which accepts it) or block them. They can’t send more until you reply.</p>
        )}
        {error && <p className="p-6 text-sm text-rose-600">Couldn’t load messages: {error}</p>}
        {!conversations && !error && <div className="p-4"><SkeletonList count={4} className="my-2 h-14" /></div>}
        {tab === 'requests' && conversations && requests.length === 0 && (
          <p className="px-6 py-14 text-center text-sm text-slate-500">No message requests.</p>
        )}
        {tab === 'chats' && chats?.length === 0 && (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"><Icon name="message" /></span>
            <p className="mt-4 font-semibold text-slate-900 dark:text-white">No messages yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Start a private conversation with someone you follow.</p>
            <button onClick={() => setComposing(true)} className="focus-ring mt-5 rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700">Write a message</button>
          </div>
        )}
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {shown?.map((c) => (
            <li key={c.other_id}>
              <a href={`/connect/messages/${c.person.username}`} className="focus-ring flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <Avatar profile={c.person} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`truncate text-[15px] ${c.unread ? 'font-bold' : 'font-semibold'} text-slate-900 dark:text-white`}>{c.person.display_name}</span>
                    <span className="shrink-0 text-xs text-slate-500">@{c.person.username} · {timeAgo(c.last_at)}</span>
                  </span>
                  <span className={`block truncate text-sm ${c.unread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    {c.last_sender === me && 'You: '}{c.last_body}
                  </span>
                </span>
                {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {composing && <NewMessageDialog me={me} onClose={() => setComposing(false)} />}
    </div>
  );
}
