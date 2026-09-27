import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';
import PostList from '../components/PostList.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { block, canMessage, getProfile, getStats, hasBlocked, unblock } from '../data.js';
import Icon from '../../components/Icon.jsx';
import { SkeletonList } from '../../components/ui.jsx';
import { formatNumber } from '../../services/format.js';
import { navigate } from '../../hooks/useRoute.js';

function Unavailable({ signedIn }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">This profile isn’t available</p>
      <p className="mt-2 text-sm text-slate-500">
        {signedIn ? 'It may have been deleted, or you can’t view it.' : 'Some profiles are only visible to members.'}
      </p>
      <a href={signedIn ? '/connect' : '/connect/join'} className="focus-ring mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">{signedIn ? 'Back to Connect' : 'Join Connect'}</a>
    </div>
  );
}

export default function Profile({ username, me }) {
  const [person, setPerson] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setPerson(undefined);
    getProfile(username).then(setPerson, () => setPerson(null));
  }, [username]);
  useEffect(() => { if (person) getStats(person.id).then(setStats, () => {}); }, [person]);
  useEffect(() => { if (person && me && me !== person.id) hasBlocked(me, person.id).then(setBlocked, () => {}); }, [person, me]);
  const [messageable, setMessageable] = useState(false);
  const refreshMessageable = () => person && me && me !== person.id && canMessage(person.id).then(setMessageable, () => setMessageable(false));
  useEffect(() => { refreshMessageable(); }, [person, me]);

  if (person === undefined) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><SkeletonList count={2} className="h-40" /></div>;
  if (!person) return <Unavailable signedIn={Boolean(me)} />;

  const isMe = me === person.id;

  async function toggleBlock() {
    setMenu(false);
    if (blocked) {
      await unblock(me, person.id);
      setBlocked(false);
    } else if (window.confirm(`Block @${person.username}? You won’t see each other’s profiles or posts, and any follows between you are removed.`)) {
      await block(person.id);
      navigate('/connect');
    }
  }

  const stat = (key, label, href) => (
    <a href={href} className="focus-ring rounded-lg px-1 hover:underline">
      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{stats ? formatNumber(stats[key]) : '–'}</span> <span className="text-slate-500">{label}</span>
    </a>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar profile={person} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">{person.display_name}</h1>
            <p className="text-slate-500">@{person.username}</p>
            {(person.program || person.university) && <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{[person.program, person.university].filter(Boolean).join(' · ')}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {stat('posts', 'posts', `/connect/u/${person.username}`)}
              {stat('followers', 'followers', `/connect/u/${person.username}/followers`)}
              {stat('following', 'following', `/connect/u/${person.username}/following`)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMe && <a href="/connect/settings" className="focus-ring rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-white/15 dark:text-slate-200">Edit profile</a>}
            {me && !isMe && !blocked && messageable && (
              <a href={`/connect/messages/${person.username}`} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-600 dark:border-white/15 dark:text-slate-200" aria-label={`Message ${person.display_name}`} title="Message">
                <Icon name="message" className="h-[18px] w-[18px]" />
              </a>
            )}
            {me && !isMe && !blocked && <FollowButton me={me} id={person.id} onChange={() => { getStats(person.id).then(setStats); refreshMessageable(); }} />}
            {!me && <a href="/connect/join" className="focus-ring rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">Follow</a>}
            {me && !isMe && (
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="focus-ring rounded-full border border-slate-200 px-3 py-2 text-slate-500 dark:border-white/15" aria-label="More options" aria-expanded={menu}>•••</button>
                {menu && (
                  <div className="card absolute right-0 z-10 mt-1 w-44 overflow-hidden py-1 text-sm shadow-lg">
                    <button onClick={() => { setMenu(false); setReporting(true); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5">Report profile</button>
                    <button onClick={toggleBlock} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">{blocked ? 'Unblock' : 'Block'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {person.bio && <p className="mt-5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{person.bio}</p>}
        {person.interests?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {person.interests.map((i) => <span key={i} className="rounded-md bg-helix-500/10 px-2 py-1 text-xs font-medium text-helix-700 dark:text-helix-300">{i}</span>)}
          </div>
        )}
      </section>

      <h2 className="mb-4 mt-8 font-display text-lg font-semibold text-slate-900 dark:text-white">Posts</h2>
      {blocked ? (
        <p className="card p-6 text-sm text-slate-500">You blocked this person. Unblock them from the ••• menu to see their posts.</p>
      ) : (
        <PostList authorId={person.id} me={me} empty={<p className="card p-6 text-center text-sm text-slate-500">{isMe ? 'You haven’t posted yet.' : 'No posts yet.'}</p>} />
      )}
      {reporting && <ReportDialog target={{ profileId: person.id }} onClose={() => setReporting(false)} />}
    </div>
  );
}
