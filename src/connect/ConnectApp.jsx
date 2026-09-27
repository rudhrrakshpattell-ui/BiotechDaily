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

function SubNav({ path, profile }) {
  const links = [
    ['/connect', 'Feed'],
    ...(profile ? [[`/connect/u/${profile.username}`, 'My profile'], ['/connect/settings', 'Settings']] : []),
    ['/connect/guidelines', 'Guidelines'],
  ];
  return (
    <div className="border-b border-slate-200/70 bg-white/60 dark:border-white/5 dark:bg-ink-900/40">
      <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        <span className="mr-3 flex shrink-0 items-center gap-2 py-3 font-display text-sm font-semibold text-slate-900 dark:text-white">
          <Icon name="users" className="h-4 w-4 text-helix-500" /> Connect
        </span>
        {links.map(([href, label]) => (
          <a key={href} href={href} aria-current={path === href ? 'page' : undefined} className={`focus-ring shrink-0 rounded-lg px-3 py-3 text-sm font-medium ${path === href ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}</a>
        ))}
        <span className="ml-auto shrink-0 py-2">
          {profile ? (
            <a href={`/connect/u/${profile.username}`} className="focus-ring flex items-center gap-2 rounded-full" aria-label="Your profile"><Avatar profile={profile} size="sm" /></a>
          ) : (
            <a href="/connect/join?mode=signin" className="focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">Sign in</a>
          )}
        </span>
      </div>
    </div>
  );
}

export default function ConnectApp({ route }) {
  const { loading, session, profile } = useSession();
  const [linkProblem] = useState(readLinkProblem);
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
  else if (page === 'u' && a && !b) body = <Profile key={a} username={a} me={me} />;
  else if (page === 'u' && a && (b === 'followers' || b === 'following')) body = <People key={`${a}/${b}`} username={a} direction={b} me={me} />;
  else body = <div className="py-24 text-center text-slate-500">Page not found. <a href="/connect" className="font-semibold text-brand-600">Back to Connect</a></div>;

  return (
    <>
      <SubNav path={route.path} profile={profile} />
      {problem && !profile && <LinkProblem message={problem} />}
      {body}
    </>
  );
}
