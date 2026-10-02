import { Logo, NAV } from './Header.jsx';
import { FOUNDER } from '../seo.js';
import { isMockMode } from '../services/api.js';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200/70 bg-white dark:border-white/5 dark:bg-ink-900/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Your daily briefing on discoveries, companies and capital shaping the life sciences.
            <span className="mt-2 block font-medium text-slate-700 dark:text-slate-300">Founded by {FOUNDER}</span>
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full ${isMockMode ? 'bg-amber-500' : 'bg-helix-500'}`} />
            {isMockMode
              ? 'Demo mode: all content is sample data'
              : 'Live news, funding rounds, videos and podcasts from STAT, Fierce Biotech, Fierce Pharma, BioPharma Dive, Endpoints News, GEN, BioSpace, Labiotech and more.'}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Explore</p>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}><a href={n.href} className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">{n.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">The daily brief</p>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Top stories in your inbox at 7am.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input type="email" placeholder="you@lab.org" className="input" aria-label="Email address" />
            <button className="focus-ring shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400 dark:border-white/5">
        © {new Date().getFullYear()} BiotechDaily. Not medical or investment advice.
      </div>
    </footer>
  );
}
