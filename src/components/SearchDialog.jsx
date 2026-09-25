import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../services/api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { navigate } from '../hooks/useRoute.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { categoryById } from '../data/categories.js';

const SUGGESTIONS = ['CRISPR', 'mRNA', 'Alzheimer', 'CAR-T', 'Series B', 'Vertex', 'AlphaFold'];

// Global command-palette search across news, companies, startups, videos and podcast episodes.
export default function SearchDialog({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(q, 200);
  const inputRef = useRef(null);
  const player = usePlayer();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ('');
  }, [open]);

  useEffect(() => {
    if (!debounced.trim()) return setResults(null);
    let live = true;
    setLoading(true);
    api.search(debounced).then((r) => live && (setResults(r), setLoading(false)));
    return () => { live = false; };
  }, [debounced]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const go = (to) => { navigate(to); onClose(); };
  const groups = results && [
    { label: 'Companies', icon: 'building', items: results.companies.map((c) => ({ key: c.id, title: c.name, sub: c.focus.join(' · '), action: () => go(`/companies/${c.id}`) })) },
    { label: 'News', icon: 'newspaper', items: results.news.map((n) => ({ key: n.id, title: n.title, sub: categoryById[n.category]?.label, action: () => go(`/news?q=${encodeURIComponent(q)}`) })) },
    { label: 'Startups', icon: 'rocket', items: results.startups.map((s) => ({ key: s.id, title: s.name, sub: `${s.stage} · ${s.area}`, action: () => go(`/startups?q=${encodeURIComponent(s.name)}`) })) },
    { label: 'Videos', icon: 'video', items: results.videos.map((v) => ({ key: v.id, title: v.title, sub: v.channel, action: () => go(`/media?v=${v.id}`) })) },
    { label: 'Podcast episodes', icon: 'mic', items: results.episodes.map((e) => ({ key: e.id, title: e.title, sub: e.show, action: () => { player.play(e); onClose(); } })) },
  ].filter((g) => g.items.length);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-white/5">
          <Icon name="search" className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search news, companies, startups, videos…"
            className="h-14 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-white/10">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q.trim() && (
            <div className="p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Try</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => setQ(s)} className="chip chip-idle focus-ring">{s}</button>)}
              </div>
            </div>
          )}
          {q.trim() && loading && !results && <p className="p-4 text-sm text-slate-500">Searching…</p>}
          {groups?.length === 0 && <p className="p-4 text-sm text-slate-500">No results for “{q}”.</p>}
          {groups?.map((g) => (
            <div key={g.label} className="mb-1">
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{g.label}</p>
              {g.items.map((it) => (
                <button key={it.key} onClick={it.action} className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-brand-400/10">
                  <Icon name={g.icon} className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{it.title}</span>
                    <span className="block truncate text-xs text-slate-500">{it.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
