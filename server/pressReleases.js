// Official press releases for profiled companies, from their investor-relations / newsroom RSS feeds.
// Moderna, Gilead, Genentech and CSL don't publish a reachable feed, so their pages go without.
import { cachedLoader, fetchFeed, hash, parseDate, stripHtml, text } from './rss.js';

export const PRESS_FEEDS = {
  amgen: 'https://investors.amgen.com/rss/news-releases.xml',
  biontech: 'https://investors.biontech.de/rss/news-releases.xml',
  vertex: 'https://investors.vrtx.com/rss/news-releases.xml',
  regeneron: 'https://investor.regeneron.com/rss/news-releases.xml',
  biogen: 'https://investors.biogen.com/rss/news-releases.xml',
  alnylam: 'https://news.alnylam.com/rss.xml',
};

const MAX_RELEASES = 6;

// Some companies (Amgen) publish titles in ALL CAPS. Convert those to title case, keeping acronyms,
// product codes and anything with digits ("FDA", "LDL-C", "GLP-1", "Q3") as they are.
const ACRONYMS = new Set(['FDA', 'EMA', 'US', 'U.S.', 'EU', 'UK', 'CEO', 'CFO', 'LDL', 'LDL-C', 'HDL', 'ASCO', 'ESMO', 'AHA', 'ACC', 'ADA', 'EASD', 'AAN', 'AI', 'RNA', 'DNA', 'MRNA', 'IPO', 'HIV', 'ALS', 'NSCLC', 'SCLC', 'CAR-T', 'ADC', 'II', 'III', 'IV', 'NEJM', 'CHMP', 'NDA', 'BLA', 'SNDA', 'SBLA', 'ASH', 'EHA', 'AACR', 'ATTR', 'ATTR-CM', 'HATTR', 'COVID-19', 'RSV', 'SMA', 'MS', 'CF', 'CKD', 'TED', 'COPD']);
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'vs', 'with']);

export function fixAllCaps(title) {
  const letters = title.replace(/[^A-Za-z]/g, '');
  if (!letters || letters.replace(/[^A-Z]/g, '').length / letters.length < 0.8) return title;
  return title
    .split(/(\s+)/)
    .map((word, i) => {
      if (/^\s+$/.test(word)) return word;
      const bare = word.replace(/[^A-Za-z0-9.\-]/g, '');
      if (ACRONYMS.has(bare.toUpperCase()) || /\d/.test(word)) return word;
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      // Capitalize the first letter of each hyphen-separated part: "MODERATE-TO-SEVERE" -> "Moderate-to-Severe".
      return lower.replace(/(^|[-/(“"])([a-z])/g, (_, pre, c) => pre + c.toUpperCase()).replace(/-(To|And|Of|In)-/g, (m) => m.toLowerCase());
    })
    .join('');
}

async function loadReleases(id) {
  const { items } = await fetchFeed(PRESS_FEEDS[id]);
  const releases = items
    .map((it) => {
      const url = text(it.link).trim();
      const date = parseDate(it.pubDate, it['dc:date'], it.published);
      const title = fixAllCaps(stripHtml(text(it.title)));
      return url && title && date ? { id: `pr-${hash(url)}`, title, url, date: date.toISOString() } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_RELEASES);
  return { items: releases, errors: [] };
}

const loaders = Object.fromEntries(Object.keys(PRESS_FEEDS).map((id) => [id, cachedLoader(() => loadReleases(id), 60 * 60 * 1000)]));

// Latest releases for a company id: [] if it has no feed, null if the feed is unavailable right now.
export async function getPressReleases(id) {
  if (!loaders[id]) return [];
  try {
    return (await loaders[id]()).items;
  } catch (err) {
    console.error(`press releases (${id}):`, err.message);
    return null;
  }
}
