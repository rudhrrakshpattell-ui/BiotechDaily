import { useMemo, useState } from 'react';
import StartupCard from '../components/StartupCard.jsx';
import { Chips, EmptyState, ErrorState, PageHeader, SearchInput, Select, SkeletonList } from '../components/ui.jsx';
import { api, isMockMode } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { STARTUP_STAGES } from '../data/startups.js';
import { SECTORS } from '../data/companies.js';
import { formatMoney } from '../services/format.js';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'raised', label: 'Largest first' },
];

export default function Startups({ query }) {
  const [q, setQ] = useState(query.q ?? '');
  const [sector, setSector] = useState('all');
  const [stage, setStage] = useState('all');
  const [area, setArea] = useState('all');
  const [sort, setSort] = useState('recent');
  const debouncedQ = useDebounce(q);

  // Unfiltered list powers the summary tiles, the area dropdown and the stage chips.
  const all = useAsync(() => api.getStartups({}), []);
  const { data, loading, error, reload } = useAsync(() => api.getStartups({ q: debouncedQ, sector, stage, area, sort }), [debouncedQ, sector, stage, area, sort]);

  const summary = useMemo(() => {
    const list = all.data ?? [];
    const largest = list.reduce((best, r) => (r.amountM > (best?.amountM ?? 0) ? r : best), null);
    const approx = list.some((r) => r.currency !== 'USD') ? '≈ ' : '';
    return {
      areas: [...new Set(list.map((r) => r.area))].sort(),
      stages: STARTUP_STAGES.filter((s) => list.some((r) => r.stage === s)),
      max: Math.max(1, ...list.map((r) => r.amountM)),
      tiles: [
        { label: 'Rounds reported', value: list.length },
        { label: 'Total raised', value: `${approx}${formatMoney(Math.round(list.reduce((s, r) => s + r.amountM, 0)))}` },
        { label: 'Largest round', value: largest ? `${largest.name} · ${largest.amountLabel}` : '—' },
        { label: 'IPOs', value: list.filter((r) => r.stage === 'IPO').length },
      ],
    };
  }, [all.data]);

  const stageOptions = [{ id: 'all', label: 'All stages' }, ...summary.stages.map((s) => ({ id: s, label: s === 'Other' ? 'Undisclosed stage' : s }))];
  const sectorOptions = [{ id: 'all', label: 'All sectors' }, ...SECTORS.map((s) => ({ id: s, label: s }))];
  const reset = () => { setQ(''); setSector('all'); setStage('all'); setArea('all'); };

  return (
    <>
      <PageHeader
        eyebrow="Funding tracker"
        title="Who’s raising in biotech"
        description={
          isMockMode
            ? 'Sample funding rounds (demo mode).'
            : 'Venture rounds and IPOs picked out of today’s biotech news automatically. Each links to the article that reported it; coverage spans roughly the last two weeks.'
        }
      >
        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.tiles.map((t) => (
            <div key={t.label} className="card min-w-0 px-4 py-3">
              <dt className="text-xs text-slate-500">{t.label}</dt>
              <dd className="mt-1 truncate font-display text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl dark:text-white" title={String(t.value)}>{all.data ? t.value : '—'}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <SearchInput value={q} onChange={setQ} placeholder="Search companies, areas, headlines…" />
            <Select label="Area" value={area} onChange={setArea} options={[{ value: 'all', label: 'All areas' }, ...summary.areas.map((a) => ({ value: a, label: a }))]} />
            <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          <Chips label="Sector" options={sectorOptions} value={sector} onChange={setSector} />
          {summary.stages.length > 1 && <Chips label="Stage" options={stageOptions} value={stage} onChange={setStage} />}
        </div>
        <h2 className="sr-only">Funding rounds</h2>
        {error && <ErrorState error={error} onRetry={reload} />}
        {all.data?.length === 0 && !error && (
          <EmptyState title="No funding rounds in the news right now" hint="Rounds appear here as soon as our news sources report them." />
        )}
        {all.data?.length > 0 && data?.length === 0 && <EmptyState onReset={reset} />}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading && data ? 'opacity-60' : ''}`}>
          {data ? data.map((r) => <StartupCard key={r.id} startup={r} maxRaised={summary.max} />) : <SkeletonList count={6} className="h-72" />}
        </div>
      </div>
    </>
  );
}
