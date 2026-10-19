import { useEffect } from 'react';
import Icon from './Icon.jsx';
import { connectEnabled } from '../connect/enabled.js';

const TABS = [
  { href: '/', label: 'Home', icon: 'home', activeIcon: 'homeFilled' },
  { href: '/news', label: 'News', icon: 'newspaper' },
  { href: '/startups', label: 'Funding', icon: 'rocket' },
  { href: '/podcasts', label: 'Listen', icon: 'headphones' },
  ...(connectEnabled ? [{ href: '/connect', label: 'Gene Pool', icon: 'users' }] : []),
];

// Phones and tablets: a floating glass capsule of the main sections, like the Gene Pool's tab bar. Hidden on
// desktop, where the header shows every section. While mounted it sets html.has-site-tabbar so --tabbar-h
// keeps content and the podcast player clear of it (see index.css).
export default function SiteTabBar({ path }) {
  useEffect(() => {
    document.documentElement.classList.add('has-site-tabbar');
    return () => document.documentElement.classList.remove('has-site-tabbar');
  }, []);

  const isActive = (href) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(calc(100vw-1.5rem),23rem)] -translate-x-1/2 rounded-full border border-white/60 bg-white/60 p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden dark:border-white/[0.12] dark:bg-ink-800/60 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <li key={t.href}>
              <a
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`focus-ring flex h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium tracking-tight transition active:scale-95 ${
                  active ? 'bg-brand-500/[0.12] text-brand-600 dark:bg-white/10 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon name={active && t.activeIcon ? t.activeIcon : t.icon} className="h-6 w-6" strokeWidth={active ? 2.2 : 1.7} />
                {t.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
