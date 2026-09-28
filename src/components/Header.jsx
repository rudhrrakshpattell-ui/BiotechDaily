import { useState } from 'react';
import Icon from './Icon.jsx';
import { FOUNDER } from '../seo.js';
import { connectEnabled } from '../connect/enabled.js';

export const NAV = [
  { href: '/news', label: 'News', icon: 'newspaper' },
  { href: '/companies', label: 'Companies', icon: 'building' },
  { href: '/startups', label: 'Startups', icon: 'rocket' },
  { href: '/media', label: 'Video', icon: 'video' },
  { href: '/podcasts', label: 'Podcasts', icon: 'mic' },
  // Shown once Supabase is configured.
  ...(connectEnabled ? [{ href: '/connect', label: 'Connect', icon: 'users' }] : []),
];

export function Logo() {
  return (
    <a href="/" className="focus-ring flex items-center gap-2.5 rounded-lg">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-helix-500 text-white shadow-md shadow-brand-600/25">
        <Icon name="dna" className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Biotech<span className="text-brand-600 dark:text-brand-300">Daily</span>
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-slate-500">by {FOUNDER}</span>
      </span>
    </a>
  );
}

export default function Header({ path, theme, onToggleTheme, onOpenSearch }) {
  const [open, setOpen] = useState(false);
  const isActive = (href) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <a
          href="/"
          aria-current={path === '/' ? 'page' : undefined}
          aria-label="Home"
          title="Home"
          className={`focus-ring ml-1 inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition sm:ml-2 lg:px-3 ${
            path === '/'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
          }`}
        >
          <Icon name={path === '/' ? 'homeFilled' : 'home'} className="h-[18px] w-[18px]" />
          <span className="hidden lg:inline">Home</span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={`focus-ring rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(n.href)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="focus-ring flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:border-brand-300 sm:w-56 dark:border-white/10 dark:bg-ink-900 dark:hover:border-brand-400/40"
            aria-label="Search"
          >
            <Icon name="search" className="h-4 w-4" />
            <span className="hidden sm:inline">Search biotech…</span>
            <kbd className="ml-auto hidden rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-white/10">⌘K</kbd>
          </button>
          <button
            onClick={onToggleTheme}
            className="focus-ring grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="focus-ring grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-white/5"
            aria-label="Menu"
            aria-expanded={open}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200/70 px-4 py-3 lg:hidden dark:border-white/5" aria-label="Mobile">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(n.href) ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon name={n.icon} className="h-4 w-4" />
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
