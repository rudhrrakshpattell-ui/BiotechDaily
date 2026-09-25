import Icon from './Icon.jsx';
import { Monogram } from './ui.jsx';
import { formatDate, formatMoney } from '../services/format.js';

const STAGE_STYLES = {
  Seed: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  'Series A': 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  'Series B': 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  'Series C': 'bg-helix-500/10 text-helix-700 dark:text-helix-300',
};

export default function StartupCard({ startup: s, maxRaised }) {
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Monogram name={s.name} color="from-helix-500 to-brand-600" className="h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white">{s.name}</h3>
          <p className="text-xs text-slate-500">{s.area}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STAGE_STYLES[s.stage]}`}>{s.stage}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.tagline}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Total raised</span>
          <span className="font-display text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(s.totalRaisedM)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-helix-500" style={{ width: `${Math.max(4, (s.totalRaisedM / maxRaised) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Latest: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMoney(s.lastRoundM)}</span> on {formatDate(s.lastRoundDate)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/5">
        <span className="inline-flex items-center gap-1"><Icon name="mapPin" className="h-3.5 w-3.5" />{s.hq}</span>
        <span className="inline-flex items-center gap-1"><Icon name="users" className="h-3.5 w-3.5" />{s.employees}</span>
        <span className="inline-flex items-center gap-1"><Icon name="calendar" className="h-3.5 w-3.5" />Est. {s.founded}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        <span className="text-slate-400">Investors: </span>{s.investors.join(', ')}
      </p>
    </article>
  );
}
