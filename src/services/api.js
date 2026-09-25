// Single data-access layer for the whole app. Every page calls these functions and nothing else.
//
// With VITE_API_BASE_URL unset, requests are answered from the local mock data (with a short delay
// so loading states are exercised). Set it and the same calls become real HTTP requests:
//   GET {BASE}/news?q=&category=&company=&range=&sort=&page=&pageSize=   -> { items, total, page, pageSize }
//   GET {BASE}/companies?q=&focus=&sort=                         -> Company[]
//   GET {BASE}/companies/:id                                     -> Company
//   GET {BASE}/startups?q=&stage=&area=&sort=                    -> Startup[]
//   GET {BASE}/videos?category=                                  -> Video[]
//   GET {BASE}/podcasts                                          -> Podcast[]
//   GET {BASE}/search?q=                                         -> { news, companies, startups, videos, episodes }
import { news } from '../data/news.js';
import { companies } from '../data/companies.js';
import { startups } from '../data/startups.js';
import { videos } from '../data/videos.js';
import { podcasts } from '../data/podcasts.js';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
const MOCK_LATENCY_MS = 220;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(path, params, mock) {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}${path}${toQuery(params)}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Request failed (${res.status}) for ${path}`);
    return res.json();
  }
  await sleep(MOCK_LATENCY_MS);
  return structuredClone(mock(params ?? {}));
}

// ---- mock query helpers (mirror what the real API is expected to do server-side) ----
const matches = (q, ...fields) => {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return fields.flat().filter(Boolean).some((f) => String(f).toLowerCase().includes(needle));
};

const RANGE_DAYS = { today: 1, week: 7, month: 31 };

function queryNews({ q, category, company, range, sort = 'newest', page = 1, pageSize = 8 }) {
  const now = Date.now();
  let items = news.filter(
    (n) =>
      (!category || category === 'all' || n.category === category) &&
      (!company || n.companyIds?.includes(company)) &&
      (!RANGE_DAYS[range] || now - new Date(n.date).getTime() <= RANGE_DAYS[range] * 86400000) &&
      matches(q, n.title, n.summary, n.tags, n.source),
  );
  items.sort((a, b) =>
    sort === 'oldest' ? new Date(a.date) - new Date(b.date)
      : sort === 'quick' ? a.readTime - b.readTime
      : new Date(b.date) - new Date(a.date),
  );
  const total = items.length;
  items = items.slice(0, page * pageSize);
  return { items, total, page, pageSize };
}

function queryCompanies({ q, focus, sort = 'name' }) {
  const items = companies.filter(
    (c) => (!focus || focus === 'all' || c.focus.includes(focus)) && matches(q, c.name, c.ticker, c.focus, c.products.map((p) => p.name), c.hq),
  );
  return items.sort((a, b) =>
    sort === 'founded' ? a.founded - b.founded
      : sort === 'size' ? b.employees - a.employees
      : a.name.localeCompare(b.name),
  );
}

function queryStartups({ q, stage, area, sort = 'recent' }) {
  const items = startups.filter(
    (s) =>
      (!stage || stage === 'all' || s.stage === stage) &&
      (!area || area === 'all' || s.area === area) &&
      matches(q, s.name, s.area, s.tagline, s.hq, s.investors),
  );
  return items.sort((a, b) =>
    sort === 'raised' ? b.totalRaisedM - a.totalRaisedM : new Date(b.lastRoundDate) - new Date(a.lastRoundDate),
  );
}

// ---- public API ----
export const api = {
  getNews: (params) => request('/news', params, queryNews),
  getCompanies: (params) => request('/companies', params, queryCompanies),
  getCompany: (id) =>
    request(`/companies/${encodeURIComponent(id)}`, null, () => {
      const company = companies.find((c) => c.id === id);
      if (!company) throw new Error('Company not found');
      return company;
    }),
  getStartups: (params) => request('/startups', params, queryStartups),
  getVideos: (params) =>
    request('/videos', params, ({ category }) => videos.filter((v) => !category || category === 'all' || v.category === category)),
  getPodcasts: () => request('/podcasts', null, () => podcasts),
  search: (q) =>
    request('/search', { q }, () => ({
      news: news.filter((n) => matches(q, n.title, n.summary, n.tags)).slice(0, 5),
      companies: companies.filter((c) => matches(q, c.name, c.ticker, c.focus, c.products.map((p) => p.name))).slice(0, 5),
      startups: startups.filter((s) => matches(q, s.name, s.area, s.tagline)).slice(0, 5),
      videos: videos.filter((v) => matches(q, v.title, v.channel)).slice(0, 4),
      episodes: podcasts
        .flatMap((p) => p.episodes.map((e) => ({ ...e, show: p.title, showId: p.id })))
        .filter((e) => matches(q, e.title, e.show))
        .slice(0, 4),
    })),
};

export const isMockMode = !API_BASE;
