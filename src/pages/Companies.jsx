import { useState } from 'react';
import CompanyCard from '../components/CompanyCard.jsx';
import { Chips, EmptyState, ErrorState, PageHeader, SearchInput, Select, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';

const FOCUS_OPTIONS = ['all', 'Oncology', 'Neuroscience', 'Immunology', 'Rare disease', 'Infectious disease', 'Cardiometabolic', 'Gene editing'].map((f) => ({ id: f, label: f === 'all' ? 'All areas' : f }));
const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'founded', label: 'Oldest first' },
  { value: 'size', label: 'Largest workforce' },
];

export default function Companies() {
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState('all');
  const [sort, setSort] = useState('name');
  const debouncedQ = useDebounce(q);
  const { data, loading, error, reload } = useAsync(() => api.getCompanies({ q: debouncedQ, focus, sort }), [debouncedQ, focus, sort]);

  return (
    <>
      <PageHeader eyebrow="Company profiles" title="Top 10 biotech companies" description="The companies that built the industry and the platforms defining its next decade: medicines, pipelines and history." />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <SearchInput value={q} onChange={setQ} placeholder="Search by name, ticker or product (e.g. Dupixent)…" />
            <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          <Chips label="Therapeutic area" options={FOCUS_OPTIONS} value={focus} onChange={setFocus} />
        </div>
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.length === 0 && <EmptyState onReset={() => { setQ(''); setFocus('all'); }} />}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading && data ? 'opacity-60' : ''}`}>
          {data ? data.map((c) => <CompanyCard key={c.id} company={c} />) : <SkeletonList count={6} className="h-64" />}
        </div>
      </div>
    </>
  );
}
