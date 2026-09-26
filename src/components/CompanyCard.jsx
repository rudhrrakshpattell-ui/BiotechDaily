import Icon from './Icon.jsx';
import { Monogram } from './ui.jsx';
import { formatNumber } from '../services/format.js';

export default function CompanyCard({ company: c }) {
  return (
    <a href={`/companies/${c.id}`} className="card focus-ring group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 dark:hover:border-brand-400/30">
      <div className="flex items-start gap-4">
        <Monogram name={c.name} color={c.color} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{c.name}</h3>
          <p className="text-xs font-medium text-slate-500">{c.ticker} · Est. {c.founded}</p>
        </div>
        <Icon name="arrowUpRight" className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{c.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {c.focus.slice(0, 3).map((f) => (
          <span key={f} className="rounded-md bg-helix-500/10 px-2 py-0.5 text-[11px] font-medium text-helix-700 dark:text-helix-300">{f}</span>
        ))}
      </div>
      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs dark:border-white/5">
        <div><dt className="text-slate-400">HQ</dt><dd className="truncate font-medium text-slate-700 dark:text-slate-300">{c.hq.split(',')[0]}</dd></div>
        <div><dt className="text-slate-400">Staff</dt><dd className="font-medium text-slate-700 dark:text-slate-300">~{formatNumber(c.employees)}</dd></div>
        <div><dt className="text-slate-400">Products</dt><dd className="font-medium text-slate-700 dark:text-slate-300">{c.products.length} listed</dd></div>
      </dl>
    </a>
  );
}
