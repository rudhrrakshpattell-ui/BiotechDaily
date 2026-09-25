import { useMemo, useState } from 'react';
import StartupCard from '../components/StartupCard.jsx';
import { Chips, EmptyState, ErrorState, PageHeader, SearchInput, Select, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { STARTUP_STAGES } from '../data/startups.js';
import { formatMoney } from '../services/format.js';

const STAGE_OPTIONS = [{ id: 'all', label: 'All stages' }, ...STARTUP_STAGES.map((s) => ({ id: s, label: s }))];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent round' },
  { value: 'raised', label: 'Most capital raised' },
];

export default function Startups({ query }) {
  const [q, setQ] = useState(query.q ?? '');
  const [stage, setStage] = useState('all');
  const [area, setArea] = useState('all');
  const [sort, setSort] = useState('recent');
  const debouncedQ = useDebounce(q);

  // Unfiltered list powers the summary tiles and the area dropdown.
  const all = useAsync(() => api.getStartups({}), []);
  const { data, loading, error, reload } = useAsync(() => api.getStartups({ q: debouncedQ, stage, area, sort }), [debouncedQ, stage, area, sort]);

  const summary = useMemo(() => {
    const list = all.data ?? [];
    const total = list.reduce((s, x) => s + x.totalRaisedM, 0);
    const recent = list.filter((x) => Date.now() - new Date(x.lastRoundDate) < 90 * 86400000);
    return {
      areas: [...new Set(list.map((x) => x.area))].sort(),
      max: Math.max(1, ...list.map((x) => x.totalRaisedM)),
      tiles: [
        { label: 'Startups tracked', value: list.length },
        { label: 'Total capital raised', value: formatMoney(total) },
        { label: 'Rounds in last 90 days', value: recent.length },
        { label: 'Raised in last 90 days', value: formatMoney(recent.reduce((s, x) => s + x.lastRoundM, 0)) },
      ],
    };
  }, [all.data]);

  return (
    <>
      <PageHeader eyebrow="Emerging startups" title="Funding tracker" description="Early-stage companies to watch, with their latest rounds, investors and focus areas.">
        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.tiles.map((t) => (
            <div key={t.label} className="card px-4 py-3">
              <dt className="text-xs text-slate-500">{t.label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{all.data ? t.value : '—'}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <SearchInput value={q} onChange={setQ} placeholder="Search startups, investors, locations…" />
            <Select label="Focus area" value={area} onChange={setArea} options={[{ value: 'all', label: 'All focus areas' }, ...summary.areas.map((a) => ({ value: a, label: a }))]} />
            <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          <Chips label="Stage" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
        </div>
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.length === 0 && <EmptyState onReset={() => { setQ(''); setStage('all'); setArea('all'); }} />}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading && data ? 'opacity-60' : ''}`}>
          {data ? data.map((s) => <StartupCard key={s.id} startup={s} maxRaised={summary.max} />) : <SkeletonList count={6} className="h-72" />}
        </div>
      </div>
    </>
  );
}
