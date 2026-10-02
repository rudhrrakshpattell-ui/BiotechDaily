// "Trending now": which companies and themes the last few days of coverage mention most.
// Pure functions, shared by the API (api/trending.js) and the browser's mock mode.

// Companies worth tracking. `match` is tested against story text (and filters /news?trend=<key>).
// "Vertex" and "CSL" match case-sensitively because the lowercase words are common.
// `id` links companies that have a profile page.
export const TRENDING_COMPANIES = [
  { name: 'Eli Lilly', id: 'lilly', match: /\b(eli )?lilly\b/i },
  { name: 'Novo Nordisk', id: 'novo-nordisk', match: /\bnovo( nordisk)?\b/i },
  { name: 'Pfizer', id: 'pfizer', match: /\bpfizer\b/i },
  { name: 'Merck', id: 'merck', match: /\bmerck\b/i },
  { name: 'AstraZeneca', id: 'astrazeneca', match: /\bastrazeneca\b/i },
  { name: 'Roche', id: 'roche', match: /\broche\b/i },
  { name: 'Novartis', id: 'novartis', match: /\bnovartis\b/i },
  { name: 'Sanofi', id: 'sanofi', match: /\bsanofi\b/i },
  { name: 'GSK', match: /\b(gsk|glaxosmithkline)\b/i },
  { name: 'AbbVie', id: 'abbvie', match: /\babbvie\b/i },
  { name: 'Johnson & Johnson', id: 'jnj', match: /\b(johnson & johnson|j&j)\b/i },
  { name: 'Bristol Myers Squibb', match: /\b(bristol[- ]myers|bms)\b/i },
  { name: 'Bayer', match: /\bbayer\b/i },
  { name: 'Takeda', match: /\btakeda\b/i },
  { name: 'Boehringer Ingelheim', match: /\bboehringer\b/i },
  { name: 'Flagship Pioneering', match: /\bflagship\b/i },
  { name: 'Genentech', id: 'genentech', match: /\bgenentech\b/i },
  { name: 'Amgen', id: 'amgen', match: /\bamgen\b/i },
  { name: 'Moderna', id: 'moderna', match: /\bmoderna\b/i },
  { name: 'BioNTech', id: 'biontech', match: /\bbiontech\b/i },
  { name: 'Vertex', id: 'vertex', match: /\bVertex\b/ },
  { name: 'Regeneron', id: 'regeneron', match: /\bregeneron\b/i },
  { name: 'Gilead', id: 'gilead', match: /\bgilead\b/i },
  { name: 'Biogen', id: 'biogen', match: /\bbiogen\b/i },
  { name: 'Alnylam', id: 'alnylam', match: /\balnylam\b/i },
  { name: 'CSL', id: 'csl', match: /\bCSL\b/ },
];

// Recurring themes, matched the same way.
export const TRENDING_THEMES = [
  { label: 'Obesity drugs', match: /\b(obesity|glp-1|weight[- ]loss|incretin|semaglutide|tirzepatide|wegovy|zepbound|ozempic)/i },
  { label: 'FDA decisions', match: /\bfda\b/i },
  { label: 'China biotech', match: /\b(china|chinese)\b/i },
  { label: 'IPOs', match: /\bipos?\b/i },
  { label: 'M&A', match: /\b(acqui\w*|merger|buyout|takeover)\b/i },
  { label: 'Drug pricing & tariffs', match: /\b(tariffs?|drug pric\w*|most favored nation|medicare negotiation)\b/i },
  { label: 'Layoffs', match: /\b(layoffs?|job cuts|workforce reduction)\b/i },
  { label: 'Rare disease', match: /\brare disease/i },
  { label: 'AI in biotech', match: /\b(ai|artificial intelligence|machine learning)\b/i },
  { label: 'Gene editing', match: /\b(crispr|gene[- ]edit\w*|base edit\w*|prime edit\w*)/i },
  { label: 'Cell therapy', match: /\b(car-?t|cell therap\w*)/i },
  { label: 'Alzheimer’s', match: /\balzheimer/i },
  { label: 'Vaccines', match: /\bvaccin\w*/i },
  { label: 'Cancer', match: /\b(cancer|tumou?r|oncolog\w*)/i },
];

const slug = (s) => s.toLowerCase().replace(/\s*&\s*/g, ' and ').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Stable keys for /news?trend=<key>, which filters with the same `match` so counts and results agree.
for (const c of TRENDING_COMPANIES) c.key = slug(c.name);
for (const t of TRENDING_THEMES) t.key = slug(t.label);
export const trendByKey = Object.fromEntries([...TRENDING_COMPANIES, ...TRENDING_THEMES].map((e) => [e.key, e]));
export const trendLabel = (e) => e.name ?? e.label;

// Whether `text` mentions the profiled company with this id (e.g. 'vertex'). Used for company pages.
const byCompanyId = Object.fromEntries(TRENDING_COMPANIES.filter((c) => c.id).map((c) => [c.id, c.match]));
export const mentionsCompany = (id, text) => Boolean(byCompanyId[id]?.test(text));
// The /news?trend=<key> key for a profiled company, for "see all coverage" links.
export const companyTrendKey = (id) => TRENDING_COMPANIES.find((c) => c.id === id)?.key;

// 72h balances freshness against having enough stories for counts to mean something (weekends are thin).
const WINDOW_HOURS = 72;
const MIN_MENTIONS = 2;
const MAX_ITEMS = 8;

// Normalizes stories, videos and episodes to { text, date } documents.
export function toDocuments({ news = [], videos = [], podcasts = [] }) {
  return [
    ...news.map((n) => ({ text: `${n.title} ${n.summary ?? ''} ${(n.tags ?? []).join(' ')}`, date: n.date })),
    ...videos.map((v) => ({ text: `${v.title} ${v.description ?? ''}`, date: v.date })),
    ...podcasts.flatMap((p) => p.episodes.map((e) => ({ text: e.title, date: e.date }))),
  ].filter((d) => d.date);
}

// Counts how many distinct documents mention each entry, within the last WINDOW_HOURS.
function rank(entries, docs) {
  return entries
    .map(({ match, ...rest }) => ({ ...rest, count: docs.filter((d) => match.test(d.text)).length }))
    .filter((e) => e.count >= MIN_MENTIONS)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_ITEMS);
}

export function computeTrending(sources, now = Date.now()) {
  const all = toDocuments(sources);
  let docs = all.filter((d) => now - new Date(d.date).getTime() <= WINDOW_HOURS * 3600 * 1000);
  let windowHours = WINDOW_HOURS;
  // Unusually quiet stretch (holidays): widen to a week rather than show an empty strip.
  if (docs.length < 30) {
    docs = all.filter((d) => now - new Date(d.date).getTime() <= 7 * 24 * 3600 * 1000);
    windowHours = 7 * 24;
  }
  return {
    companies: rank(TRENDING_COMPANIES, docs),
    themes: rank(TRENDING_THEMES, docs),
    windowHours,
    documents: docs.length,
  };
}
