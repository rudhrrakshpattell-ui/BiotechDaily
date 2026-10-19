import { useEffect } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';

// Apple-style tab bar for Connect: a floating glass capsule centred near the bottom on every screen size
// (full width minus a margin on phones, sized to its tabs from tablet up). Filled icon + blue tint for the active tab, red unread badge, profile
// photo as the Profile tab. While mounted it sets html.has-tabbar so --tabbar-h reserves space (see index.css).
export default function TabBar({ path, profile, unread = 0 }) {
  useEffect(() => {
    document.documentElement.classList.add('has-tabbar');
    return () => document.documentElement.classList.remove('has-tabbar');
  }, []);

  const profilePath = profile ? `/connect/u/${profile.username}` : null;
  const tabs = [
    { href: '/', label: 'Home', icon: 'home', active: false }, // back to the main site
    { href: '/connect', label: 'Feed', icon: 'feed', activeIcon: 'feedFilled', active: path === '/connect' },
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
        'fixed left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/60 bg-white/60 p-1.5 backdrop-blur-2xl backdrop-saturate-150',
        'shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.6)]',
        'dark:border-white/[0.12] dark:bg-ink-800/60 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]',
        // Phones: nearly full width, floating above the home indicator. Tablet and up: sized to its tabs.
        'bottom-[calc(0.75rem+env(safe-area-inset-bottom))] w-[min(calc(100vw-1.5rem),23rem)] md:bottom-6 md:w-auto',
      ].join(' ')}
    >
      <ul className="grid h-[3.25rem] grid-cols-5 md:flex md:h-auto md:gap-1">
        {tabs.map((t) => (
          <li key={t.label}>
            <a
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`focus-ring flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium tracking-tight transition active:scale-95 md:h-[3.25rem] md:w-[5.25rem] md:text-[11px] ${
                t.active
                  ? 'bg-brand-500/[0.12] text-brand-600 dark:bg-white/10 dark:text-brand-400'
                  : 'text-slate-500 dark:text-slate-400 md:hover:bg-slate-900/[0.04] md:dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className="relative">
                {t.avatar ? (
                  <span className={`block rounded-full ${t.active ? 'ring-2 ring-brand-600 ring-offset-1 ring-offset-white dark:ring-brand-400 dark:ring-offset-ink-950' : ''}`}>
                    <Avatar profile={t.avatar} size="sm" className="!h-6 !w-6 !text-[10px] md:!h-[26px] md:!w-[26px]" />
                  </span>
                ) : (
                  <Icon name={t.active && t.activeIcon ? t.activeIcon : t.icon} className="h-6 w-6 md:h-[26px] md:w-[26px]" strokeWidth={t.active ? 2.3 : 1.7} />
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
