import { useState } from 'react';
import Icon from './Icon.jsx';
import { CategoryBadge } from './ui.jsx';
import { categoryById } from '../data/categories.js';
import { timeAgo } from '../services/format.js';
import { imageProps } from '../services/images.js';

// Abstract "cover art" per category until real article images come from the API (item.imageUrl).
const COVERS = {
  emerald: 'from-emerald-400 via-teal-500 to-sky-600',
  sky: 'from-sky-400 via-brand-500 to-indigo-600',
  rose: 'from-rose-400 via-fuchsia-500 to-indigo-600',
  violet: 'from-violet-400 via-indigo-500 to-brand-600',
  amber: 'from-amber-300 via-orange-400 to-rose-500',
  teal: 'from-teal-300 via-helix-500 to-brand-600',
  slate: 'from-slate-400 via-slate-500 to-brand-700',
  blue: 'from-brand-400 via-brand-600 to-indigo-700',
  cyan: 'from-cyan-300 via-sky-500 to-brand-600',
  indigo: 'from-indigo-400 via-brand-600 to-ink-700',
};

// `widths`/`sizes` describe how large the image is displayed, so the optimizer serves a fitting size.
// `priority` is for the one above-the-fold image (the featured story): load it eagerly and first.
export function NewsCover({ item, className = '', widths = [384, 640], sizes = '100vw', priority = false }) {
  const color = categoryById[item.category]?.color ?? 'blue';
  const [imageFailed, setImageFailed] = useState(false);
  if (item.imageUrl && !imageFailed) {
    return (
      <img
        {...imageProps(item.imageUrl, widths, sizes)}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${COVERS[color]} ${className}`}>
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 C40 20, 80 120, 120 60 S180 10, 200 50" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M0 40 C40 100, 80 0, 120 60 S180 110, 200 70" stroke="white" strokeWidth="1.5" fill="none" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={i * 22 + 10} x2={i * 22 + 10} y1={60 - Math.sin(i) * 25} y2={60 + Math.sin(i) * 25} stroke="white" strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

export default function NewsCard({ item, variant = 'row' }) {
  if (variant === 'featured') {
    return (
      <article className="card group relative overflow-hidden">
        <NewsCover item={item} className="aspect-[16/8] w-full" widths={[640, 828, 1200]} sizes="(min-width: 1024px) 720px, 100vw" priority />
        <div className="p-6">
          <div className="mb-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <CategoryBadge id={item.category} />
            <span>{timeAgo(item.date)}</span>
          </div>
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            <Title item={item} />
          </h3>
          <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{item.summary}</p>
          <Meta item={item} />
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group relative flex gap-3 py-3">
        <NewsCover item={item} className="h-14 w-14 shrink-0 rounded-lg" widths={[128]} sizes="56px" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300"><Title item={item} /></h3>
          <p className="mt-1 text-xs text-slate-500">{categoryById[item.category]?.label} · {timeAgo(item.date)}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="card group relative flex flex-col gap-4 p-4 transition hover:border-brand-200 hover:shadow-md sm:flex-row sm:p-5 dark:hover:border-brand-400/30">
      <NewsCover item={item} className="aspect-[16/9] w-full shrink-0 rounded-xl sm:aspect-auto sm:h-auto sm:w-44" widths={[384, 640]} sizes="(min-width: 640px) 176px, 100vw" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <CategoryBadge id={item.category} />
          <span>{timeAgo(item.date)}</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300"><Title item={item} /></h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.summary}</p>
        <Meta item={item} />
      </div>
    </article>
  );
}

// With a source URL, the title's link stretches over the whole card (after:inset-0) so any click opens the article.
function Title({ item }) {
  if (!item.url) return item.title;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded after:absolute after:inset-0 after:content-['']">
      {item.title}
    </a>
  );
}

function Meta({ item }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
        {item.source}
        {item.url && <Icon name="arrowUpRight" className="h-3 w-3 text-slate-400" />}
      </span>
      {item.author && <span>{item.author}</span>}
      {item.readTime && <span className="inline-flex items-center gap-1"><Icon name="clock" className="h-3.5 w-3.5" />{item.readTime} min read</span>}
      <span className="flex flex-wrap gap-1.5">
        {item.tags?.slice(0, 3).map((t) => (
          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400">#{t}</span>
        ))}
      </span>
    </div>
  );
}
