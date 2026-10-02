// Latest uploads from biotech YouTube channels, via YouTube's free per-channel Atom feeds (no API key).
import { cachedLoader, classify, fetchAll, fetchFeed, parseDate, stripHtml, text, truncate } from './rss.js';

// Channel IDs verified against each channel's feed title.
export const VIDEO_CHANNELS = [
  { name: 'STAT', id: 'UC89FjSf9AT1O2qw6vxrrxDQ' },
  { name: 'Endpoints News', id: 'UCTOCA6osUag-hNGKKKUZXdw' },
  { name: 'Broad Institute', id: 'UCv4IbnP9j9RC_aZAs8wqdeQ' },
  { name: 'Nature Video', id: 'UC7c8mE90qCtu11z47U0KErg' },
  { name: 'Science Magazine', id: 'UCv0aU2eKry3kdSTnFa8QAWA' },
  { name: 'Labiotech', id: 'UCLOWmW12tA2dYsPLgdQvtqg' },
  { name: 'Genentech', id: 'UCz3z81ffPPQP9ML_us0xzmw' },
  { name: 'Amgen', id: 'UCDCWgYMRqAQL8uqghy328-g' },
];

const MAX_PER_CHANNEL = 6;
// Company channels also post hiring and culture clips; skip them.
const OFF_TOPIC = /\b(internships?|careers?|recruit\w*|hiring|fellowship|testimonial|employees? spotlight|life at)\b/i;

function normalize(entry, channel) {
  const youtubeId = text(entry['yt:videoId']);
  const date = parseDate(entry.published, entry.updated);
  if (!youtubeId || !date) return null;
  const media = entry['media:group'] ?? {};
  const title = stripHtml(text(entry.title) || text(media['media:title']));
  const description = truncate(stripHtml(text(media['media:description'])), 220);
  const views = Number(media['media:community']?.['media:statistics']?.['@views']);
  return {
    id: `yt-${youtubeId}`,
    youtubeId,
    title,
    description,
    channel: channel.name,
    date: date.toISOString(),
    views: Number.isFinite(views) ? views : null,
    category: classify(title, description),
  };
}

async function loadVideos() {
  const { values, errors } = await fetchAll(VIDEO_CHANNELS, async (channel) => {
    const { items } = await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`);
    return items
      .map((e) => normalize(e, channel))
      .filter((v) => v && !OFF_TOPIC.test(v.title))
      .slice(0, MAX_PER_CHANNEL);
  });
  const items = values.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
  // Feature the most-watched upload of the last two weeks rather than whatever was posted last.
  const recent = items.filter((v) => Date.now() - new Date(v.date) < 14 * 86400000);
  const lead = recent.reduce((best, v) => ((v.views ?? 0) > (best?.views ?? -1) ? v : best), null) ?? items[0];
  if (lead) lead.featured = true;
  return { items, errors };
}

// Resolves to { items, errors, fetchedAt }, cached for 30 minutes (channels upload a few times a week).
export const getLiveVideos = cachedLoader(loadVideos, 30 * 60 * 1000);
