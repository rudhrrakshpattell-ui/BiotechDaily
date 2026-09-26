import Icon from '../components/Icon.jsx';
import NewsCard from '../components/NewsCard.jsx';
import { ErrorState, Monogram, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { PIPELINE_STAGES } from '../data/companies.js';
import { formatNumber } from '../services/format.js';

export default function CompanyDetail({ id }) {
  const { data: c, error, reload } = useAsync(() => api.getCompany(id), [id]);
  const related = useAsync(() => api.getNews({ company: id, pageSize: 4 }), [id]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState error={error} onRetry={reload} /></div>;
  if (!c || c.id !== id) return <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 sm:px-6"><SkeletonList count={3} className="h-40" /></div>;

  const stats = [
    { label: 'Founded', value: c.founded },
    { label: 'Headquarters', value: c.hq },
    { label: 'CEO', value: c.ceo },
    { label: 'Employees', value: `~${formatNumber(c.employees)}` },
    { label: c.parent ? 'Parent' : 'Market cap', value: c.parent ?? (c.marketCapB ? `~$${c.marketCapB}B` : '—') },
    { label: 'Ticker', value: c.ticker },
  ];

  return (
    <article>
      <header className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/5">
        <div className={`absolute inset-0 bg-gradient-to-br opacity-[0.08] dark:opacity-[0.15] ${c.color}`} />
        <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
          <a href="/companies" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">
            <Icon name="chevronLeft" className="h-4 w-4" /> All companies
          </a>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Monogram name={c.name} color={c.color} className="h-16 w-16 rounded-2xl text-xl" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{c.name}</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{c.tagline}</p>
            </div>
            <a href={c.website} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">
              <Icon name="globe" className="h-4 w-4" /> Website <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
            </a>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-6 dark:border-white/[0.07] dark:bg-white/[0.07]">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-4 py-3 dark:bg-ink-900">
                <dt className="text-xs text-slate-500">{s.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white" title={String(s.value)}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">About</h2>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.focus.map((f) => <span key={f} className="rounded-md bg-helix-500/10 px-2 py-1 text-xs font-medium text-helix-700 dark:text-helix-300">{f}</span>)}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Key marketed medicines</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.products.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"><Icon name="flask" className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.indication}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Pipeline focus</h2>
            <p className="mt-1 text-xs text-slate-500">Most advanced stage per program area</p>
            <div className="mt-5 space-y-4">
              {c.pipeline.map((p) => {
                const idx = PIPELINE_STAGES.indexOf(p.stage);
                return (
                  <div key={p.name}>
                    <div className="mb-1.5 flex justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-300">{p.stage}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {PIPELINE_STAGES.map((s, i) => (
                        <div key={s} title={s} className={`h-2 rounded-full ${i < idx ? 'bg-brand-500' : i === idx ? 'bg-helix-500' : 'bg-slate-100 dark:bg-white/5'}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-5 gap-1 pt-1 text-[10px] text-slate-400">
                {PIPELINE_STAGES.map((s) => <span key={s} className="truncate">{s}</span>)}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Milestones</h2>
            <ol className="mt-5 space-y-5 border-l-2 border-slate-100 pl-5 dark:border-white/5">
              {c.milestones.map((m) => (
                <li key={m.year + m.event} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-helix-500 dark:border-ink-900" />
                  <p className="font-display text-sm font-semibold text-brand-600 dark:text-brand-300">{m.year}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{m.event}</p>
                </li>
              ))}
            </ol>
          </section>

          {related.data?.items.length > 0 && (
            <section className="card px-6 py-4">
              <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">In the news</h2>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {related.data.items.map((n) => <NewsCard key={n.id} item={n} variant="compact" />)}
              </div>
            </section>
          )}
          <p className="px-1 text-xs leading-relaxed text-slate-400">Headcount, market cap and pipeline stages are approximate sample values. Connect a live data source for current figures.</p>
        </aside>
      </div>
    </article>
  );
}
