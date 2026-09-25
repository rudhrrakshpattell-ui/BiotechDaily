import Icon from './Icon.jsx';
import { categoryById, CATEGORY_STYLES } from '../data/categories.js';

export function CategoryBadge({ id, className = '' }) {
  const cat = categoryById[id];
  if (!cat) return null;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CATEGORY_STYLES[cat.color]} ${className}`}>
      {cat.label}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/5">
      <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="absolute -top-24 right-0 h-64 w-96 rounded-full bg-helix-400/15 blur-3xl dark:bg-helix-400/10" />
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
        {children}
      </div>
    </header>
  );
}

export function LinkArrow({ href, children }) {
  return (
    <a href={href} className="focus-ring group inline-flex items-center gap-1 rounded-md text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
      {children}
      <Icon name="chevronRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`chip focus-ring ${value === o.id ? 'chip-active' : 'chip-idle'}`}
        >
          {o.label}
          {o.count !== undefined && <span className="opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-10" aria-label={placeholder} />
    </div>
  );
}

export function Select({ value, onChange, options, label }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input cursor-pointer appearance-none pr-9">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevronRight" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
    </label>
  );
}

export function EmptyState({ title = 'Nothing matches those filters', hint = 'Try a different search or clear a filter.', onReset }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
        <Icon name="flask" />
      </div>
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      {onReset && (
        <button onClick={onReset} className="focus-ring mt-5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-400/10">
          Clear filters
        </button>
      )}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="font-semibold text-rose-600 dark:text-rose-400">Couldn’t load this section</p>
      <p className="mt-1 text-sm text-slate-500">{error?.message}</p>
      {onRetry && <button onClick={onRetry} className="focus-ring mt-4 text-sm font-semibold text-brand-600">Try again</button>}
    </div>
  );
}

export function SkeletonList({ count = 4, className = 'h-32' }) {
  return Array.from({ length: count }, (_, i) => <div key={i} className={`skeleton ${className}`} />);
}

export function Monogram({ name, color, className = 'h-12 w-12 text-base' }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);
  return (
    <div className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-display font-semibold text-white shadow-sm ${color} ${className}`}>
      {initials}
    </div>
  );
}
