import Icon from './Icon.jsx';
import { NEWS_CATEGORIES } from '../data/categories.js';

const hrefFor = (entry) => `/news?trend=${entry.key}`;

// Companies and themes the last few days of coverage mention most. Falls back to the static topic
// list while loading or when nothing crosses the threshold.
export default function TrendingStrip({ data }) {
  const companies = data?.companies ?? [];
  const themes = data?.themes ?? [];

  if (!companies.length && !themes.length) {
    return (
      <div className="no-scrollbar mt-10 flex gap-2 overflow-x-auto">
        {NEWS_CATEGORIES.map((c) => (
          <a key={c.id} href={`/news?category=${c.id}`} className="chip chip-idle focus-ring">{c.label}</a>
        ))}
      </div>
    );
  }

  const period = data.windowHours >= 7 * 24 ? 'this week' : 'last 3 days';
  return (
    <div className="mt-10">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon name="trendingUp" className="h-4 w-4 text-helix-500" />
        Trending now
        <span className="font-medium normal-case tracking-normal text-slate-400">· {period}, by number of stories</span>
      </p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {companies.map((c) => (
          <a key={c.name} href={hrefFor(c)} className="chip chip-idle focus-ring" title={`${c.count} stories mention ${c.name}`}>
            <Icon name="building" className="h-3.5 w-3.5 text-brand-500" />
            {c.name}
            <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-white/10">{c.count}</span>
          </a>
        ))}
        {companies.length > 0 && themes.length > 0 && <span className="mx-1 hidden w-px self-stretch bg-slate-200 sm:block dark:bg-white/10" aria-hidden="true" />}
        {themes.map((t) => (
          <a key={t.label} href={hrefFor(t)} className="chip chip-idle focus-ring" title={`${t.count} stories about ${t.label}`}>
            <span className="text-helix-500">#</span>
            {t.label}
            <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-white/10">{t.count}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
