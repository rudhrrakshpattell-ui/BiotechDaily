import { Logo, NAV } from './Header.jsx';
import { FOUNDER } from '../seo.js';
import { isMockMode } from '../services/api.js';
import { connectEnabled } from '../connect/enabled.js';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200/70 bg-white dark:border-white/5 dark:bg-ink-900/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The juiciest biotech and pharma news, spilled fresh every morning. Discoveries, deals, drama and the people behind them.
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
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Join the conversation</p>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Talk science with biotech and pharma students on Connect.</p>
          <a href={connectEnabled ? '/connect/join' : '/news'} className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            {connectEnabled ? 'Join Connect' : 'Read today’s tea'}
          </a>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400 dark:border-white/5">
        © {new Date().getFullYear()} Spill the Genes. Not medical or investment advice. <a href="/privacy" className="underline hover:text-brand-600">Privacy</a>
      </div>
    </footer>
  );
}
