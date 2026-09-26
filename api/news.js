import { getLiveNews } from '../server/news.js';
import { json, params, companyKeyword } from '../server/http.js';
import { queryNews } from '../src/services/queries.js';
import { companies } from '../src/data/companies.js';
import { news as sampleNews } from '../src/data/news.js';

export async function GET(request) {
  const p = params(request);
  const companyName = companyKeyword(companies, p.company);
  try {
    const { items, errors, fetchedAt } = await getLiveNews();
    return json({ ...queryNews(items, { ...p, companyName }), live: true, fetchedAt, sourceErrors: errors });
  } catch (err) {
    // Every feed failed: keep the site usable with sample stories, and don't let the CDN cache this for long.
    console.error(err);
    return json({ ...queryNews(sampleNews, { ...p, companyName }), live: false, error: err.message }, { maxAge: 60 });
  }
}
