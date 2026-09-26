// Shared plumbing for everything pulled from RSS/Atom feeds: fetching, XML parsing,
// text cleanup and an in-memory cache with request de-duplication.
import { XMLParser } from 'fast-xml-parser';

const USER_AGENT = 'Mozilla/5.0 (compatible; BiotechDaily/1.0; +https://biotech-daily.vercel.app)';
const FETCH_TIMEOUT_MS = 8000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  isArray: (name) => ['item', 'entry', 'category', 'media:content', 'media:thumbnail', 'link'].includes(name),
});

// Returns the feed's items/entries regardless of format (RSS 2.0, RDF, Atom), plus the channel/feed node.
export async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = parser.parse(await res.text());
  const channel = doc.rss?.channel ?? doc['rdf:RDF']?.channel ?? doc.feed;
  if (!channel) throw new Error('Not an RSS or Atom feed');
  const items = doc.rss?.channel?.item ?? doc['rdf:RDF']?.item ?? doc.feed?.entry ?? [];
  return { channel, items };
}

// Runs one loader per source in parallel; a failing source is reported, not fatal.
export async function fetchAll(sources, load) {
  const results = await Promise.allSettled(sources.map(load));
  return {
    values: results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
    errors: results.flatMap((r, i) => (r.status === 'rejected' ? [`${sources[i].name}: ${r.reason?.message ?? r.reason}`] : [])),
  };
}

// Wraps an async `load() -> { items, errors }` with a TTL cache. Concurrent callers share one refresh,
// and a failed or empty refresh keeps serving the last good result if there is one.
export function cachedLoader(load, ttlMs) {
  let cache = null;
  let inflight = null;
  return async function get() {
    if (cache && Date.now() - cache.at < ttlMs) return cache;
    inflight ??= load()
      .then(({ items, errors }) => {
        if (items.length) cache = { at: Date.now(), fetchedAt: new Date().toISOString(), items, errors };
        else if (!cache) throw new Error(`All sources failed: ${errors.join('; ')}`);
        return cache;
      })
      .finally(() => { inflight = null; });
    return inflight;
  };
}

export const text = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') {
    if (v['#text'] != null) return text(v['#text']);
    // Markup inside a field (e.g. Fierce wraps titles in <a>) parses as child elements: use their text.
    const child = Object.entries(v).find(([k]) => !k.startsWith('@'));
    return child ? text(child[1]) : text(v['@href'] ?? '');
  }
  return String(v);
};

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…');

export const stripHtml = (html) => decodeEntities(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

export const truncate = (s, n) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s);

export function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function parseDate(...candidates) {
  for (const c of candidates) {
    // Accept "Sep 24, 2026 9:20pm" (Fierce) by converting the 12-hour clock to 24-hour.
    const raw = text(c).replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i, (_, h, m, ap) => `${(Number(h) % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0)}:${m}`);
    const d = new Date(raw);
    if (raw && !Number.isNaN(d.getTime())) return d;
  }
  return null;
}

// First matching rule wins, so more specific topics come first. Shared by news and videos.
const RULES = [
  ['gene-editing', /\b(crispr|gene[- ]edit|base edit|prime edit|epigenetic edit|cas9|cas12|gene therap)/i],
  ['mrna', /\b(mrna|rna vaccine|vaccin|sarna|lipid nanoparticle)/i],
  ['cell-therapy', /\b(car-?t|cell therap|t[- ]cell engager|nk cell|stem cell|tcr)/i],
  ['ai-discovery', /\b(ai\b|artificial intelligence|machine learning|deep learning|alphafold|protein design|foundation model|language model|computational)/i],
  ['oncology', /\b(cancer|tumou?r|oncolog|leukemia|lymphoma|myeloma|carcinoma|melanoma|adc\b|antibody-drug)/i],
  ['neuro', /\b(alzheimer|parkinson|als\b|neuro|brain|dementia|huntington|multiple sclerosis|epilep|psychiatr|depression|narcolepsy)/i],
  ['regulatory', /\b(fda|ema\b|approv|regulator|clearance|guidance|label|advisory committee|crl\b|complete response|medicare|policy|tariff)/i],
  ['funding', /\b(rais|funding|series [a-e]\b|seed round|ipo\b|financing|venture|acqui|merger|m&a|buyout|licens|deal|invest)/i],
  ['research', /\b(study|researchers|scientists|discover|found that|mice|model|genome|protein|cells?\b|bacteria|microbiome|enzyme)/i],
];

export function classify(title, summary = '', tags = []) {
  const hay = `${title} ${tags.join(' ')}`;
  for (const [id, re] of RULES) if (re.test(hay)) return id;
  // Fall back to the summary, which is noisier than the title.
  for (const [id, re] of RULES) if (re.test(summary)) return id;
  return 'industry';
}
