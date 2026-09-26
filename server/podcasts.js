// Latest episodes from biotech podcasts, read from each show's public RSS feed.
import { cachedLoader, fetchAll, fetchFeed, hash, parseDate, stripHtml, text, truncate } from './rss.js';

// Feed URLs found through Apple's podcast directory (itunes.apple.com/search).
export const PODCAST_FEEDS = [
  { name: 'The Readout Loud', url: 'https://feeds.megaphone.fm/thereadoutloud', color: 'from-rose-500 to-brand-700' },
  { name: 'Biotech Hangout', url: 'https://anchor.fm/s/55bdff38/podcast/rss', color: 'from-brand-500 to-helix-500' },
  { name: 'The Long Run', url: 'https://feeds.soundcloud.com/users/soundcloud:users:317770704/sounds.rss', color: 'from-amber-500 to-rose-600' },
  { name: 'Business of Biotech', url: 'https://rss.buzzsprout.com/1011661.rss', color: 'from-helix-500 to-teal-700' },
  { name: 'BioSpace', url: 'https://api.riverside.fm/hosting/3SxyDAXU.rss', color: 'from-indigo-500 to-brand-700' },
  { name: 'Science Magazine Podcast', url: 'https://feeds.megaphone.fm/AAAS8717073854', color: 'from-sky-500 to-indigo-700' },
];

const EPISODES_PER_SHOW = 5;

// itunes:duration is either seconds ("1781") or "HH:MM:SS" / "MM:SS".
function formatDuration(raw) {
  const s = text(raw).trim();
  if (!s) return null;
  const seconds = s.includes(':') ? s.split(':').reduce((acc, part) => acc * 60 + Number(part), 0) : Number(s);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

const imageOf = (node) => node?.['itunes:image']?.['@href'] || text(node?.image?.url) || null;

async function loadShow(feed) {
  const { channel, items } = await fetchFeed(feed.url);
  const showImage = imageOf(channel);
  const episodes = items
    .filter((it) => it.enclosure?.['@url'] && String(it.enclosure['@type'] ?? 'audio').startsWith('audio'))
    .slice(0, EPISODES_PER_SHOW)
    .map((it) => ({
      id: `ep-${hash(text(it.guid) || it.enclosure['@url'])}`,
      title: stripHtml(text(it.title)),
      date: parseDate(it.pubDate)?.toISOString() ?? null,
      duration: formatDuration(it['itunes:duration']),
      audioUrl: it.enclosure['@url'],
      url: text(it.link) || null,
      imageUrl: imageOf(it) || showImage,
    }));
  if (!episodes.length) throw new Error('No audio episodes');

  return {
    id: `pod-${hash(feed.url)}`,
    title: feed.name,
    host: stripHtml(text(channel['itunes:author'])) || feed.name,
    description: truncate(stripHtml(text(channel['itunes:summary']) || text(channel.description)), 220),
    url: text(channel.link) || null,
    imageUrl: showImage,
    color: feed.color,
    episodes,
  };
}

async function loadPodcasts() {
  const { values, errors } = await fetchAll(PODCAST_FEEDS, loadShow);
  // Most recently updated shows first.
  const items = values.sort((a, b) => new Date(b.episodes[0].date) - new Date(a.episodes[0].date));
  return { items, errors };
}

// Resolves to { items, errors, fetchedAt }, cached for 30 minutes.
export const getLivePodcasts = cachedLoader(loadPodcasts, 30 * 60 * 1000);
