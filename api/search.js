import { getLiveNews } from '../server/feeds.js';
import { json, params } from '../server/http.js';
import { searchAll } from '../src/services/queries.js';
import { companies } from '../src/data/companies.js';
import { startups } from '../src/data/startups.js';
import { videos } from '../src/data/videos.js';
import { podcasts } from '../src/data/podcasts.js';
import { news as sampleNews } from '../src/data/news.js';

export async function GET(request) {
  const { q = '' } = params(request);
  const news = await getLiveNews().then((r) => r.items, () => sampleNews);
  return json(searchAll({ news, companies, startups, videos, podcasts }, q));
}
