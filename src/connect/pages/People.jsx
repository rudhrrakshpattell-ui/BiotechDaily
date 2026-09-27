import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PersonRow from '../components/PersonRow.jsx';
import { getProfile, listConnections, searchStudents } from '../data.js';
import { SkeletonList } from '../../components/ui.jsx';

// Followers / following of a member, or student search results.
export default function People({ username, direction, query, me }) {
  const [people, setPeople] = useState(null);
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    setPeople(null);
    if (query !== undefined) {
      (query.trim() ? searchStudents(query) : Promise.resolve([])).then(setPeople, () => setPeople([]));
      return;
    }
    getProfile(username).then(async (p) => {
      setOwner(p);
      setPeople(p ? await listConnections(p.id, direction) : []);
    }, () => setPeople([]));
  }, [username, direction, query]);

  const missing = query === undefined && people && !owner;
  const title = query !== undefined ? `Students matching “${query}”` : owner ? `${owner.display_name} · ${direction === 'followers' ? 'Followers' : 'Following'}` : missing ? 'This profile isn’t available' : '';

  if (missing) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">{title}</p>
        <a href="/connect" className="focus-ring mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Back to Connect</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {owner && (
        <a href={`/connect/u/${owner.username}`} className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-slate-500 hover:text-brand-600">
          <Icon name="chevronLeft" className="h-4 w-4" /> @{owner.username}
        </a>
      )}
      <h1 className="mb-4 font-display text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      {owner && (
        <div className="mb-4 flex gap-2">
          <a href={`/connect/u/${owner.username}/followers`} className={`chip focus-ring ${direction === 'followers' ? 'chip-active' : 'chip-idle'}`}>Followers</a>
          <a href={`/connect/u/${owner.username}/following`} className={`chip focus-ring ${direction === 'following' ? 'chip-active' : 'chip-idle'}`}>Following</a>
        </div>
      )}
      <div className="card divide-y divide-slate-100 px-5 dark:divide-white/5">
        {!people && <div className="py-4"><SkeletonList count={3} className="my-2 h-14" /></div>}
        {people?.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{query !== undefined ? 'No students found.' : 'Nobody here yet.'}</p>}
        {people?.map((p) => <PersonRow key={p.id} person={p} me={me} />)}
      </div>
    </div>
  );
}
