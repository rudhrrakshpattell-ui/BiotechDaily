import { getLiveNews } from '../server/news.js';
import { getLiveVideos } from '../server/videos.js';
import { getLivePodcasts } from '../server/podcasts.js';
import { json, params } from '../server/http.js';
import { searchAll } from '../src/services/queries.js';
import { companies } from '../src/data/companies.js';
import { startups } from '../src/data/startups.js';
import { news as sampleNews } from '../src/data/news.js';
import { videos as sampleVideos } from '../src/data/videos.js';
import { podcasts as samplePodcasts } from '../src/data/podcasts.js';

// Live sources when available, sample data for any that fail.
const liveOr = (get, fallback) => get().then((r) => r.items, () => fallback);

export async function GET(request) {
  const { q = '' } = params(request);
  const [news, videos, podcasts] = await Promise.all([
    liveOr(getLiveNews, sampleNews),
    liveOr(getLiveVideos, sampleVideos),
    liveOr(getLivePodcasts, samplePodcasts),
  ]);
  return json(searchAll({ news, companies, startups, videos, podcasts }, q));
}
