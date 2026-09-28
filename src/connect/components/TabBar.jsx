import { useEffect } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';

// iOS-style bottom tab bar for Connect on phones and tablets (hidden from md up, where the top menu is used).
// Frosted background, filled icon + blue tint for the active tab, red unread badge, profile photo as the
// Profile tab. While mounted it sets html.has-tabbar so --tabbar-h reserves space for it (see index.css).
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 md:hidden dark:border-white/10 dark:bg-ink-950/75"
    >
      <ul className="grid h-[3.25rem] grid-cols-4">
        {tabs.map((t) => (
          <li key={t.label}>
            <a
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-tight transition active:scale-95 ${
                t.active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
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
