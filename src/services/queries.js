// Pure filter/sort/paginate helpers shared by the browser mock layer (src/services/api.js)
// and the serverless API (api/*.js), so both behave identically.

export const matches = (q, ...fields) => {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return fields.flat().filter(Boolean).some((f) => String(f).toLowerCase().includes(needle));
};

import { mentionsCompany, trendByKey } from './trending.js';

const RANGE_DAYS = { today: 1, week: 7, month: 31 };

export function queryNews(news, { q, category, company, trend, range, sort = 'newest', page = 1, pageSize = 8 } = {}) {
  const now = Date.now();
  page = Number(page) || 1;
  pageSize = Math.min(Number(pageSize) || 8, 50);
  // Sample stories carry companyIds; live ones are matched by name (same patterns as Trending).
  const aboutCompany = (n) => n.companyIds?.includes(company) || mentionsCompany(company, `${n.title} ${n.summary ?? ''}`);

  const trendRule = trend ? trendByKey[trend]?.match ?? /$^/ : null;
  let items = news.filter(
    (n) =>
      (!category || category === 'all' || n.category === category) &&
      (!company || aboutCompany(n)) &&
      (!trendRule || trendRule.test(`${n.title} ${n.summary ?? ''} ${(n.tags ?? []).join(' ')}`)) &&
      (!RANGE_DAYS[range] || now - new Date(n.date).getTime() <= RANGE_DAYS[range] * 86400000) &&
      matches(q, n.title, n.summary, n.tags, n.source),
  );
  items.sort((a, b) =>
    sort === 'oldest' ? new Date(a.date) - new Date(b.date)
      : sort === 'quick' ? (a.readTime ?? Infinity) - (b.readTime ?? Infinity)
      : new Date(b.date) - new Date(a.date),
  );
  const total = items.length;
  items = items.slice(0, page * pageSize);
  return { items, total, page, pageSize };
}

// sector is 'Biotech' or 'Pharma'; 'all' or empty matches both.
const inSector = (sector, x) => !sector || sector === 'all' || x.sector === sector;

export function queryCompanies(companies, { q, sector, focus, sort = 'name' } = {}) {
  const items = companies.filter(
    (c) => inSector(sector, c) && (!focus || focus === 'all' || c.focus.includes(focus)) && matches(q, c.name, c.ticker, c.focus, c.products.map((p) => p.name), c.hq),
  );
  return items.sort((a, b) =>
    sort === 'founded' ? a.founded - b.founded
      : sort === 'size' ? b.employees - a.employees
      : a.name.localeCompare(b.name),
  );
}

export function queryStartups(rounds, { q, sector, stage, area, sort = 'recent' } = {}) {
  const items = rounds.filter(
    (r) =>
      inSector(sector, r) &&
      (!stage || stage === 'all' || r.stage === stage) &&
      (!area || area === 'all' || r.area === area) &&
      matches(q, r.name, r.area, r.headline, r.investors, r.sources ?? r.source),
  );
  return items.sort((a, b) => (sort === 'raised' ? b.amountM - a.amountM : new Date(b.date) - new Date(a.date)));
}

export const queryVideos = (videos, { category } = {}) =>
  videos.filter((v) => !category || category === 'all' || v.category === category);

export function searchAll({ news, companies, startups, videos, podcasts }, q) {
  return {
    news: news.filter((n) => matches(q, n.title, n.summary, n.tags)).slice(0, 5),
    companies: companies.filter((c) => matches(q, c.name, c.ticker, c.focus, c.products.map((p) => p.name))).slice(0, 5),
    startups: startups.filter((s) => matches(q, s.name, s.area, s.headline)).slice(0, 5),
    videos: videos.filter((v) => matches(q, v.title, v.channel)).slice(0, 4),
    episodes: podcasts
      .flatMap((p) => p.episodes.map((e) => ({ ...e, show: p.title, showId: p.id, color: p.color })))
      .filter((e) => matches(q, e.title, e.show))
      .slice(0, 4),
  };
}
