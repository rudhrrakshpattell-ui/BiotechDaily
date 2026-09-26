// Fetches biotech RSS/RDF/Atom feeds, normalizes them to the app's news item shape,
// classifies each story into a topic, and caches the result in memory.
import { XMLParser } from 'fast-xml-parser';

export const FEEDS = [
  { source: 'STAT', url: 'https://www.statnews.com/category/biotech/feed/' },
  { source: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/' },
  { source: 'GEN', url: 'https://www.genengnews.com/feed/' },
  { source: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/plants_animals/biotechnology.xml' },
  { source: 'Labiotech', url: 'https://www.labiotech.eu/feed/' },
  { source: 'BioSpace', url: 'https://www.biospace.com/news.rss' },
];

// Newsroom sources (not press-release or paper feeds) that are eligible for the lead story.
const LEAD_SOURCES = new Set(['STAT', 'BioPharma Dive', 'BioSpace', 'Labiotech']);

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_PER_FEED = 25;

// First matching rule wins, so more specific topics come first.
const RULES = [
  ['gene-editing', /\b(crispr|gene[- ]edit|base edit|prime edit|epigenetic edit|cas9|cas12|gene therap)/i],
  ['mrna', /\b(mrna|rna vaccine|vaccin|sarna|lipid nanoparticle)/i],
  ['cell-therapy', /\b(car-?t|cell therap|t[- ]cell engager|nk cell|stem cell|tcr)/i],
  ['ai-discovery', /\b(ai\b|artificial intelligence|machine learning|deep learning|alphafold|protein design|foundation model|language model|computational)/i],
  ['oncology', /\b(cancer|tumou?r|oncolog|leukemia|lymphoma|myeloma|carcinoma|melanoma|adc\b|antibody-drug)/i],
  ['neuro', /\b(alzheimer|parkinson|als\b|neuro|brain|dementia|huntington|multiple sclerosis|epilep|psychiatr|depression)/i],
  ['regulatory', /\b(fda|ema\b|approv|regulator|clearance|guidance|label|advisory committee|crl\b|complete response|medicare|policy|tariff)/i],
  ['funding', /\b(rais|funding|series [a-e]\b|seed round|ipo\b|financing|venture|acqui|merger|m&a|buyout|licens|deal|invest)/i],
  ['research', /\b(study|researchers|scientists|discover|found that|mice|model|genome|protein|cells?\b|bacteria|microbiome|enzyme)/i],
];

const GENERIC_TAGS = new Set(['biotech', 'biotechnology', 'business', 'pharma', 'pharmaceuticals', 'research', 'news', 'the readout', 'stat+', 'health', 'science']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  isArray: (name) => ['item', 'entry', 'category', 'media:content', 'media:thumbnail', 'link'].includes(name),
});

let cache = { at: 0, items: null, errors: [] };
let inflight = null;

const text = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return text(v['#text'] ?? v['@href'] ?? '');
  return String(v);
};

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…');

const stripHtml = (html) => decodeEntities(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s);

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function classify(title, summary, tags = []) {
  const hay = `${title} ${tags.join(' ')}`;
  for (const [id, re] of RULES) if (re.test(hay)) return id;
  // Fall back to the summary, which is noisier than the title.
  for (const [id, re] of RULES) if (re.test(summary)) return id;
  return 'industry';
}

function imageOf(item) {
  const media = item['media:content']?.find((m) => m['@url'] && (!m['@medium'] || m['@medium'] === 'image'));
  if (media) return media['@url'];
  const thumb = item['media:thumbnail']?.[0]?.['@url'];
  if (thumb) return thumb;
  if (item.enclosure?.['@type']?.startsWith('image/')) return item.enclosure['@url'];
  const img = String(item['content:encoded'] ?? '').match(/<img[^>]+src="([^"]+)"/i);
  return img?.[1] ?? null;
}

function linkOf(item) {
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l) => typeof l === 'object' && (!l['@rel'] || l['@rel'] === 'alternate'));
    return text(alt ?? item.link[0]);
  }
  return text(item.link) || item['@rdf:about'] || '';
}

function normalize(item, source) {
  const title = stripHtml(text(item.title)).replace(/^STAT\+:\s*/, '');
  const url = linkOf(item).replace(/[?&]utm_[^&]+/g, '').trim();
  const content = String(item['content:encoded'] ?? item.content?.['#text'] ?? item.content ?? '');
  const summary = truncate(stripHtml(text(item.description) || text(item.summary) || content), 280);
  const rawDate = text(item.pubDate) || text(item['dc:date']) || text(item.published) || text(item.updated);
  const date = new Date(rawDate);
  if (!title || !url || Number.isNaN(date.getTime())) return null;

  const tags = (item.category ?? [])
    .map((c) => stripHtml(text(c)).toLowerCase())
    .filter((t) => t && t.length < 30 && !GENERIC_TAGS.has(t))
    .slice(0, 3);
  const words = stripHtml(content).split(' ').length;

  return {
    id: `live-${hash(url)}`,
    title,
    summary,
    url,
    source,
    author: stripHtml(text(item['dc:creator']) || text(item.author?.name) || text(item.author)) || null,
    date: date.toISOString(),
    category: classify(title, summary, tags),
    tags,
    readTime: words > 150 ? Math.max(2, Math.round(words / 230)) : null,
    imageUrl: imageOf(item),
  };
}

async function fetchFeed({ source, url }) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BiotechDaily/1.0; +https://biotech-daily.vercel.app)', Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`);
  const doc = parser.parse(await res.text());
  const raw = doc.rss?.channel?.item ?? doc['rdf:RDF']?.item ?? doc.feed?.entry ?? [];
  return raw.slice(0, MAX_PER_FEED).map((it) => normalize(it, source)).filter(Boolean);
}

async function refresh() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const errors = results.flatMap((r, i) => (r.status === 'rejected' ? [`${FEEDS[i].source}: ${r.reason?.message ?? r.reason}`] : []));
  const seen = new Set();
  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((n) => {
      const key = n.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
      if (seen.has(key) || seen.has(n.url)) return false;
      seen.add(key).add(n.url);
      return true;
    });
  // Lead with the newest recent newsroom story, preferring one with a photo.
  const recent = items.filter((n) => LEAD_SOURCES.has(n.source) && Date.now() - new Date(n.date) < 2 * 86400000);
  const lead = recent.find((n) => n.imageUrl) ?? recent[0] ?? items[0];
  if (lead) lead.featured = true;
  return { items, errors };
}

// Returns { items, errors, fetchedAt }. Serves from memory for CACHE_TTL_MS; concurrent callers share one refresh.
export async function getLiveNews() {
  if (cache.items && Date.now() - cache.at < CACHE_TTL_MS) return { ...cache, fetchedAt: new Date(cache.at).toISOString() };
  inflight ??= refresh()
    .then(({ items, errors }) => {
      if (items.length) cache = { at: Date.now(), items, errors };
      else if (!cache.items) throw new Error(`All news feeds failed: ${errors.join('; ')}`);
      return cache;
    })
    .finally(() => { inflight = null; });
  const c = await inflight;
  return { ...c, fetchedAt: new Date(c.at).toISOString() };
}
