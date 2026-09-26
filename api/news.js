import { getLiveNews } from '../server/news.js';
import { json, params } from '../server/http.js';
import { queryNews } from '../src/services/queries.js';
import { news as sampleNews } from '../src/data/news.js';

export async function GET(request) {
  const p = params(request);
  try {
    const { items, errors, fetchedAt } = await getLiveNews();
    return json({ ...queryNews(items, p), live: true, fetchedAt, sourceErrors: errors });
  } catch (err) {
    // Every feed failed: keep the site usable with sample stories, and don't let the CDN cache this for long.
    console.error(err);
    return json({ ...queryNews(sampleNews, p), live: false, error: err.message }, { maxAge: 60 });
  }
}
