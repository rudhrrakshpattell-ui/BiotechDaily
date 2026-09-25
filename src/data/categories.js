// Shared taxonomy for news and videos. Keep ids stable: they are used as API query values.
export const NEWS_CATEGORIES = [
  { id: 'gene-editing', label: 'Gene Editing', color: 'emerald' },
  { id: 'mrna', label: 'mRNA & Vaccines', color: 'sky' },
  { id: 'oncology', label: 'Oncology', color: 'rose' },
  { id: 'ai-discovery', label: 'AI & Drug Discovery', color: 'violet' },
  { id: 'neuro', label: 'Neuroscience', color: 'amber' },
  { id: 'cell-therapy', label: 'Cell Therapy', color: 'teal' },
  { id: 'regulatory', label: 'Regulatory', color: 'slate' },
  { id: 'funding', label: 'Funding & Deals', color: 'blue' },
];

export const categoryById = Object.fromEntries(NEWS_CATEGORIES.map((c) => [c.id, c]));

// Full class strings so Tailwind can find them when it scans the source.
export const CATEGORY_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-600/15 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
};
