import { useEffect, useState } from 'react';
import NewsCard from '../components/NewsCard.jsx';
import { Chips, EmptyState, ErrorState, PageHeader, SearchInput, Select, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { NEWS_CATEGORIES } from '../data/categories.js';

const CATEGORY_OPTIONS = [{ id: 'all', label: 'All topics' }, ...NEWS_CATEGORIES];
const RANGE_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Last 24 hours' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'quick', label: 'Quickest reads' },
];

export default function News({ query }) {
  const [q, setQ] = useState(query.q ?? '');
  const [category, setCategory] = useState(query.category ?? 'all');
  const [range, setRange] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q);

  // Follow links like #/news?category=mrna even when already on this page.
  useEffect(() => {
    if (query.category) setCategory(query.category);
    if (query.q !== undefined) setQ(query.q);
  }, [query.category, query.q]);

  useEffect(() => setPage(1), [debouncedQ, category, range, sort]);

  const { data, loading, error, reload } = useAsync(
    () => api.getNews({ q: debouncedQ, category, range, sort, page, pageSize: 8 }),
    [debouncedQ, category, range, sort, page],
  );

  const reset = () => { setQ(''); setCategory('all'); setRange('all'); setSort('newest'); };

  return (
    <>
      <PageHeader eyebrow="News & discoveries" title="The daily feed" description="Research breakthroughs, clinical readouts, approvals and deals, filtered the way you want." />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="sticky top-16 z-20 -mx-4 space-y-3 border-b border-slate-200/70 bg-slate-50/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 dark:border-white/5 dark:bg-ink-950/90">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <SearchInput value={q} onChange={setQ} placeholder="Search headlines, topics, tags…" />
            <Select label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
            <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          <Chips label="Topic" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        </div>

        <div className="mx-auto mt-6 max-w-4xl">
          {data && (
            <p className="mb-4 text-sm text-slate-500" aria-live="polite">
              {data.total} {data.total === 1 ? 'story' : 'stories'}
              {loading && <span className="ml-2 text-brand-500">Updating…</span>}
            </p>
          )}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!data && loading && <div className="space-y-4"><SkeletonList count={4} className="h-40" /></div>}
          {data?.items.length === 0 && <EmptyState onReset={reset} />}
          <div className={`space-y-4 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
            {data?.items.map((n) => <NewsCard key={n.id} item={n} />)}
          </div>
          {data && data.items.length < data.total && (
            <div className="mt-8 text-center">
              <button onClick={() => setPage((p) => p + 1)} disabled={loading} className="focus-ring rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">
                {loading ? 'Loading…' : `Load more (${data.total - data.items.length} left)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
