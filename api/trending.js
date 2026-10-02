import { getLiveNews } from '../server/news.js';
import { getLiveVideos } from '../server/videos.js';
import { getLivePodcasts } from '../server/podcasts.js';
import { json } from '../server/http.js';
import { computeTrending } from '../src/services/trending.js';

const itemsOr = (get) => get().then((r) => r.items, () => []);

export async function GET() {
  const [news, videos, podcasts] = await Promise.all([itemsOr(getLiveNews), itemsOr(getLiveVideos), itemsOr(getLivePodcasts)]);
  return json(computeTrending({ news, videos, podcasts }));
}
