// Live biotech news from newsroom RSS feeds, normalized to the app's news item shape.
import { cachedLoader, classify, fetchAll, fetchFeed, hash, parseDate, stripHtml, text, truncate } from './rss.js';

export const NEWS_FEEDS = [
  { name: 'STAT', url: 'https://www.statnews.com/category/biotech/feed/' },
  { name: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/' },
  { name: 'GEN', url: 'https://www.genengnews.com/feed/' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/plants_animals/biotechnology.xml' },
  { name: 'Labiotech', url: 'https://www.labiotech.eu/feed/' },
  { name: 'BioSpace', url: 'https://www.biospace.com/news.rss' },
];

// Newsroom sources (not press-release or paper feeds) that are eligible for the lead story.
const LEAD_SOURCES = new Set(['STAT', 'BioPharma Dive', 'BioSpace', 'Labiotech']);
const MAX_PER_FEED = 25;
const GENERIC_TAGS = new Set(['biotech', 'biotechnology', 'business', 'pharma', 'pharmaceuticals', 'research', 'news', 'the readout', 'stat+', 'health', 'science']);

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
  const date = parseDate(item.pubDate, item['dc:date'], item.published, item.updated);
  if (!title || !url || !date) return null;

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

async function loadNews() {
  const { values, errors } = await fetchAll(NEWS_FEEDS, async ({ name, url }) => {
    const { items } = await fetchFeed(url);
    return items.slice(0, MAX_PER_FEED).map((it) => normalize(it, name)).filter(Boolean);
  });

  const seen = new Set();
  const items = values
    .flat()
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

// Resolves to { items, errors, fetchedAt }, cached for 10 minutes.
export const getLiveNews = cachedLoader(loadNews, 10 * 60 * 1000);
