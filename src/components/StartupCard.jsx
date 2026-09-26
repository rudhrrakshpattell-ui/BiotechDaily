import Icon from './Icon.jsx';
import { Monogram } from './ui.jsx';
import { formatDate, formatMoney } from '../services/format.js';

const STAGE_STYLES = {
  Seed: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  'Series A': 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  'Series B': 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  'Series C': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300',
  'Series D+': 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  IPO: 'bg-helix-500/10 text-helix-700 dark:text-helix-300',
  Other: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
};

export const stageStyle = (stage) => STAGE_STYLES[stage] ?? STAGE_STYLES.Other;

// One funding round. With a source URL, the headline link covers the whole card.
export default function StartupCard({ startup: r, maxRaised }) {
  return (
    <article className="card group relative flex flex-col p-5 transition hover:border-brand-200 hover:shadow-md dark:hover:border-brand-400/30">
      <div className="flex items-start gap-3">
        <Monogram name={r.name} color="from-helix-500 to-brand-600" className="h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display font-semibold text-slate-900 dark:text-white">{r.name}</h3>
          <p className="text-xs text-slate-500">{r.area}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stageStyle(r.stage)}`}>{r.stage === 'Other' ? 'Round' : r.stage}</span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-slate-500">{r.stage === 'IPO' ? 'Raised in IPO' : 'Round size'}</span>
          <span className="font-display text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {r.amountLabel}
            {r.currency !== 'USD' && <span className="ml-1.5 text-xs font-medium text-slate-400">≈ {formatMoney(Math.round(r.amountM))}</span>}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-helix-500" style={{ width: `${Math.max(4, (r.amountM / maxRaised) * 100)}%` }} />
        </div>
      </div>

      <p className="mb-4 mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600 group-hover:text-brand-700 dark:text-slate-400 dark:group-hover:text-brand-300">
        {r.url ? (
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded after:absolute after:inset-0 after:content-['']">
            {r.headline}
          </a>
        ) : (
          r.headline
        )}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5">
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
          {(r.sources ?? [r.source]).join(', ')}
          {r.url && <Icon name="arrowUpRight" className="h-3 w-3 text-slate-400" />}
        </span>
        <span className="inline-flex items-center gap-1"><Icon name="calendar" className="h-3.5 w-3.5" />{formatDate(r.date)}</span>
        {r.investors?.length > 0 && <span className="w-full truncate"><span className="text-slate-400">Led by </span>{r.investors.join(', ')}</span>}
      </div>
    </article>
  );
}
