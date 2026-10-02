import { useEffect } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';

// Apple-style tab bar for Connect. Phones/tablets: full-width frosted bar at the bottom. Desktop: a floating
// glass capsule centred near the bottom. Filled icon + blue tint for the active tab, red unread badge, profile
// photo as the Profile tab. While mounted it sets html.has-tabbar so --tabbar-h reserves space (see index.css).
export default function TabBar({ path, profile, unread = 0 }) {
  useEffect(() => {
    document.documentElement.classList.add('has-tabbar');
    return () => document.documentElement.classList.remove('has-tabbar');
  }, []);

  const profilePath = profile ? `/connect/u/${profile.username}` : null;
  const tabs = [
    { href: '/connect', label: 'Feed', icon: 'home', activeIcon: 'homeFilled', active: path === '/connect' },
    { href: '/connect/search', label: 'Search', icon: 'search', active: path === '/connect/search' },
    { href: profile ? '/connect/messages' : '/connect/join?mode=signin', label: 'Messages', icon: 'message', activeIcon: 'messageFilled', active: path.startsWith('/connect/messages'), badge: unread },
    profile
      ? { href: profilePath, label: 'Profile', avatar: profile, active: path.startsWith(profilePath) || path === '/connect/settings' }
      : { href: '/connect/join?mode=signin', label: 'Sign in', icon: 'user', active: path === '/connect/join' },
  ];

  return (
    <nav
      aria-label="Connect"
      className={[
        'fixed z-40 backdrop-blur-2xl backdrop-saturate-150',
        // Phones and tablets: full-width bar with a hairline top border and room for the home indicator.
        'inset-x-0 bottom-0 border-t border-slate-200/80 bg-white/75 pb-[env(safe-area-inset-bottom)] dark:border-white/10 dark:bg-ink-950/75',
        // Desktop: a floating glass capsule, centred above the bottom edge.
        'md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:rounded-full md:border md:border-white/60 md:bg-white/55 md:p-1.5 md:pb-1.5 md:shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.6)]',
        'md:dark:border-white/[0.12] md:dark:bg-ink-800/55 md:dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]',
      ].join(' ')}
    >
      <ul className="grid h-[3.25rem] grid-cols-4 md:flex md:h-auto md:gap-1">
        {tabs.map((t) => (
          <li key={t.label}>
            <a
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`focus-ring flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-tight transition active:scale-95 md:h-[3.25rem] md:w-[5.25rem] md:rounded-full md:text-[11px] ${
                t.active
                  ? 'text-brand-600 dark:text-brand-400 md:bg-brand-500/[0.12] md:dark:bg-white/10'
                  : 'text-slate-500 dark:text-slate-400 md:hover:bg-slate-900/[0.04] md:dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className="relative">
                {t.avatar ? (
                  <span className={`block rounded-full ${t.active ? 'ring-2 ring-brand-600 ring-offset-1 ring-offset-white dark:ring-brand-400 dark:ring-offset-ink-950' : ''}`}>
                    <Avatar profile={t.avatar} size="sm" className="!h-[26px] !w-[26px] !text-[10px]" />
                  </span>
                ) : (
                  <Icon name={t.active && t.activeIcon ? t.activeIcon : t.icon} className="h-[26px] w-[26px]" strokeWidth={t.active ? 2.3 : 1.7} />
                )}
                {t.badge > 0 && (
                  <span className="absolute -right-2.5 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-white dark:ring-ink-950" aria-label={`${t.badge} unread`}>
                    {t.badge > 99 ? '99+' : t.badge}
                  </span>
                )}
              </span>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
