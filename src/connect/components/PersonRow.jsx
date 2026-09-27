import Avatar from './Avatar.jsx';
import FollowButton from './FollowButton.jsx';

export default function PersonRow({ person, me, compact = false }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <a href={`/connect/u/${person.username}`} className="focus-ring rounded-full"><Avatar profile={person} size={compact ? 'sm' : 'md'} /></a>
      <div className="min-w-0 flex-1">
        <a href={`/connect/u/${person.username}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white">{person.display_name}</a>
        <p className="truncate text-xs text-slate-500">@{person.username}{person.university ? ` · ${person.university}` : ''}</p>
        {!compact && person.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{person.bio}</p>}
      </div>
      {me && me !== person.id && <FollowButton me={me} id={person.id} small />}
    </div>
  );
}
