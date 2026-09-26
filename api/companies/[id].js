import { json, notFound } from '../../server/http.js';
import { getPressReleases } from '../../server/pressReleases.js';
import { companies } from '../../src/data/companies.js';

// GET /api/companies/:id                 -> company profile (static, fast)
// GET /api/companies/:id?section=press   -> { pressReleases } from the company's own feed (slower, separate)
export async function GET(request) {
  const url = new URL(request.url);
  const id = decodeURIComponent(url.pathname.split('/').pop());
  const company = companies.find((c) => c.id === id);
  if (!company) return notFound('Company not found');

  if (url.searchParams.get('section') === 'press') {
    const releases = await getPressReleases(id);
    // A failed fetch is cached briefly so the next visitor retries soon.
    return json({ pressReleases: releases ?? [] }, { maxAge: releases ? 1800 : 120 });
  }
  return json(company, { maxAge: 3600 });
}
