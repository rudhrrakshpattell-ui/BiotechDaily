// Entry point for /connect/*. Loaded on demand, so Supabase code never slows down the rest of the site.
import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { SkeletonList } from '../components/ui.jsx';
import { isConfigured } from './supabase.js';
import { useSession } from './session.js';
import Avatar from './components/Avatar.jsx';
import Feed from './pages/Feed.jsx';
import Guidelines from './pages/Guidelines.jsx';
import Join from './pages/Join.jsx';
import Landing from './pages/Landing.jsx';
import Onboarding from './pages/Onboarding.jsx';
import People from './pages/People.jsx';
import PostPage from './pages/PostPage.jsx';
import Messages from './pages/Messages.jsx';
import Chat from './pages/Chat.jsx';
import { useUnreadMessages } from './unread.js';
import TabBar from './components/TabBar.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"><Icon name="users" /></span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900 dark:text-white">Connect is almost ready</h1>
      <p className="mt-2 text-slate-500">The community for biotech students is launching soon.</p>
    </div>
  );
}

// Read once at load: why a sign-in link didn't work, if Supabase or the URL says so.
function readLinkProblem() {
  const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`);
  const description = params.get('error_description');
  const code = params.get('error_code');
  if (description || code) {
    const expired = /expired|invalid/i.test(`${description} ${code}`);
    return expired
      ? 'That sign-in link has expired or was already used. Links work once and expire after an hour. Please request a new one.'
      : `Sign-in didn’t work: ${description ?? code}.`;
  }
  return params.get('code') ? 'pending-code' : null;
}

function LinkProblem({ message }) {
  return (
    <div className="mx-auto mt-6 max-w-xl px-4">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
        <p className="font-semibold">Couldn’t sign you in</p>
        <p className="mt-1">{message}</p>
        <a href="/connect/join?mode=signin" className="mt-2 inline-block font-semibold underline">Send a new sign-in link</a>
      </div>
    </div>
  );
}

function SubNav({ path, profile, unread }) {
  const links = [
    { href: '/connect', label: 'Feed', icon: 'home', active: path === '/connect', tab: true },
    ...(profile
      ? [
          { href: '/connect/messages', label: 'Messages', icon: 'message', active: path.startsWith('/connect/messages'), badge: unread, tab: true },
          { href: `/connect/u/${profile.username}`, label: 'My profile', avatar: profile, active: path.startsWith(`/connect/u/${profile.username}`), tab: true },
          { href: '/connect/settings', label: 'Settings', icon: 'settings', active: path === '/connect/settings' },
        ]
      : []),
    { href: '/connect/guidelines', label: 'Guidelines', icon: 'flask', active: path === '/connect/guidelines' },
  ];
  return (
    <div className="border-b border-slate-200/70 bg-white/60 dark:border-white/5 dark:bg-ink-900/40">
      <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        <span className="mr-3 flex shrink-0 items-center gap-2 py-3 font-display text-sm font-semibold text-slate-900 dark:text-white">
          <Icon name="users" className="h-4 w-4 text-helix-500" /> Connect
        </span>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            aria-current={l.active ? 'page' : undefined}
            // Feed, Messages and My profile live in the bottom tab bar on phones, so show them here from md up.
            className={`focus-ring ${l.tab ? 'hidden md:inline-flex' : 'inline-flex'} shrink-0 items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium ${l.active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {l.avatar ? <Avatar profile={l.avatar} size="sm" className="!h-5 !w-5 !text-[8px]" /> : <Icon name={l.active && l.icon === 'home' ? 'homeFilled' : l.icon} className="h-4 w-4" />}
            {l.label}
            {l.badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1.5 text-[11px] font-bold text-white" aria-label={`${l.badge} unread`}>{l.badge > 99 ? '99+' : l.badge}</span>}
          </a>
        ))}
        {!profile && (
          <span className="ml-auto shrink-0 py-2">
            <a href="/connect/join?mode=signin" className="focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">Sign in</a>
          </span>
        )}
      </div>
    </div>
  );
}

export default function ConnectApp({ route }) {
  const { loading, session, profile } = useSession();
  const [linkProblem] = useState(readLinkProblem);
  const unread = useUnreadMessages(profile?.id);
  if (!isConfigured) return <NotConfigured />;

  // A ?code= in the URL with no session means the link was opened in a different browser than the one
  // that requested it (the sign-in is tied to that browser), or it was already used.
  const problem =
    linkProblem === 'pending-code'
      ? !loading && !session
        ? 'Sign-in links only work in the browser you requested them from. Open the link in that browser, or request a new link here.'
        : null
      : linkProblem;

  const [, page, a, b] = route.segments; // /connect/<page>/<a>/<b>
  const me = profile?.id ?? null;
  const needsProfile = session && !profile && !loading;

  let body;
  if (loading) body = <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><SkeletonList count={3} className="h-32" /></div>;
  else if (page === 'guidelines') body = <Guidelines />;
  else if (page === 'join') body = session && profile ? <Feed profile={profile} /> : needsProfile ? <Onboarding session={session} /> : <Join key={route.query.mode ?? 'join'} mode={route.query.mode} />;
  else if (needsProfile) body = <Onboarding session={session} />;
  else if (page === undefined) body = profile ? <Feed profile={profile} /> : <Landing />;
  else if (page === 'settings') body = profile ? <Settings profile={profile} /> : <Join mode="signin" />;
  else if (page === 'search') body = <People query={route.query.q ?? ''} me={me} />;
  else if (page === 'messages' && !b) body = profile ? (a ? <Chat key={a} profile={profile} username={a} /> : <Messages profile={profile} />) : <Join mode="signin" />;
  else if (page === 'p' && a && !b) body = <PostPage key={a} id={a} me={me} />;
  else if (page === 'u' && a && !b) body = <Profile key={a} username={a} me={me} />;
  else if (page === 'u' && a && (b === 'followers' || b === 'following')) body = <People key={`${a}/${b}`} username={a} direction={b} me={me} />;
  else body = <div className="py-24 text-center text-slate-500">Page not found. <a href="/connect" className="font-semibold text-brand-600">Back to Connect</a></div>;

  return (
    <>
      <SubNav path={route.path} profile={profile} unread={unread} />
      {problem && !profile && <LinkProblem message={problem} />}
      {body}
      {/* Hidden inside a chat, like Apple Messages, to give the conversation the whole screen. */}
      {!(page === 'messages' && a) && <TabBar path={route.path} profile={profile} unread={unread} />}
    </>
  );
}
