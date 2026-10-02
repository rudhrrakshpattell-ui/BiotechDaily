import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import Composer from '../components/Composer.jsx';
import PersonRow from '../components/PersonRow.jsx';
import PostList from '../components/PostList.jsx';
import { getStats, suggestions } from '../data.js';
import { navigate } from '../../hooks/useRoute.js';
import { formatNumber } from '../../services/format.js';

function SearchBox() {
  const [q, setQ] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/connect/search?q=${encodeURIComponent(q.trim())}`); }} className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find students, universities…" className="input pl-10" aria-label="Search students" />
    </form>
  );
}

function Suggestions({ me }) {
  const [people, setPeople] = useState(null);
  useEffect(() => { suggestions(me).then(setPeople, () => setPeople([])); }, [me]);
  if (people && !people.length) return null;
  return (
    <section className="card px-5 py-3">
      <h2 className="pt-2 font-display text-base font-semibold text-slate-900 dark:text-white">Students to follow</h2>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {people ? people.map((p) => <PersonRow key={p.id} person={p} me={me} compact />) : <div className="skeleton my-3 h-24" />}
      </div>
    </section>
  );
}

export default function Feed({ profile }) {
  const [tab, setTab] = useState('following');
  const [justPosted, setJustPosted] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => { getStats(profile.id).then(setStats, () => {}); }, [profile.id, justPosted]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-4">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-100 dark:border-white/[0.06]" role="tablist" aria-label="Feed">
            {[['following', 'Following'], ['discover', 'Discover']].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="focus-ring flex justify-center py-3.5 text-[15px] transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <span className={`relative ${tab === id ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500'}`}>
                  {label}
                  {tab === id && <span className="absolute -bottom-3.5 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-brand-500" />}
                </span>
              </button>
            ))}
          </div>
          <Composer profile={profile} onPosted={(p) => { setJustPosted(p); setTab('following'); }} />
        </div>
        <PostList
          key={tab}
          feed={tab}
          me={profile.id}
          prepend={tab === 'following' ? justPosted : null}
          empty={
            <div className="card px-6 py-10 text-center">
              <p className="font-semibold text-slate-900 dark:text-white">{tab === 'following' ? 'Your feed is empty' : 'No posts yet'}</p>
              <p className="mt-1 text-sm text-slate-500">{tab === 'following' ? 'Follow some students, or share your first post above.' : 'Be the first to post!'}</p>
              {tab === 'following' && <button onClick={() => setTab('discover')} className="focus-ring mt-4 text-sm font-semibold text-brand-600 dark:text-brand-300">Discover posts</button>}
            </div>
          }
        />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="card p-5">
          <a href={`/connect/u/${profile.username}`} className="focus-ring flex items-center gap-3 rounded-xl">
            <Avatar profile={profile} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{profile.display_name}</p>
              <p className="truncate text-xs text-slate-500">@{profile.username}</p>
            </div>
          </a>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[['posts', 'Posts'], ['followers', 'Followers'], ['following', 'Following']].map(([k, label]) => (
              <div key={k}>
                <dd className="font-display text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{stats ? formatNumber(stats[k]) : '–'}</dd>
                <dt className="text-xs text-slate-500">{label}</dt>
              </div>
            ))}
          </dl>
          <a href="/connect/settings" className="focus-ring mt-4 block rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:text-slate-200">Edit profile</a>
        </section>
        <SearchBox />
        <Suggestions me={profile.id} />
        <p className="px-1 text-xs text-slate-400"><a href="/connect/guidelines" className="hover:underline">Community guidelines</a></p>
      </aside>
    </div>
  );
}

export { SearchBox };
