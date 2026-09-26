// Single data-access layer for the whole app. Every page calls these functions and nothing else.
//
// VITE_API_BASE_URL set (e.g. "/api"): real HTTP requests to the serverless API in /api.
// VITE_API_BASE_URL empty: answered in the browser from the mock data in src/data.
//
//   GET {BASE}/news?q=&category=&company=&range=&sort=&page=&pageSize=   -> { items, total, page, pageSize, live }
//   GET {BASE}/companies?q=&focus=&sort=                         -> Company[]
//   GET {BASE}/companies/:id                                     -> Company
//   GET {BASE}/startups?q=&stage=&area=&sort=                    -> Startup[]
//   GET {BASE}/videos?category=                                  -> Video[]
//   GET {BASE}/podcasts                                          -> Podcast[]
//   GET {BASE}/search?q=                                         -> { news, companies, startups, videos, episodes }
import { queryNews, queryCompanies, queryStartups, queryVideos, searchAll } from './queries.js';

// Sample data is only needed in mock mode, so it's loaded on demand and kept out of the production bundle.
const loadMockData = () =>
  Promise.all([
    import('../data/news.js'),
    import('../data/companies.js'),
    import('../data/startups.js'),
    import('../data/videos.js'),
    import('../data/podcasts.js'),
  ]).then(([n, c, s, v, p]) => ({ news: n.news, companies: c.companies, startups: s.startups, videos: v.videos, podcasts: p.podcasts }));

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
const MOCK_LATENCY_MS = 220;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
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
  const [data] = await Promise.all([loadMockData(), sleep(MOCK_LATENCY_MS)]);
  return structuredClone(mock(params ?? {}, data));
}

export const api = {
  getNews: (params) =>
    request('/news', params, (p, { news, companies }) => ({
      ...queryNews(news, { ...p, companyName: companies.find((c) => c.id === p.company)?.name.split(' ')[0] }),
      live: false,
    })),
  getCompanies: (params) => request('/companies', params, (p, { companies }) => queryCompanies(companies, p)),
  getCompany: (id) =>
    request(`/companies/${encodeURIComponent(id)}`, null, (_, { companies }) => {
      const company = companies.find((c) => c.id === id);
      if (!company) throw new Error('Company not found');
      return company;
    }),
  getStartups: (params) => request('/startups', params, (p, { startups }) => queryStartups(startups, p)),
  getVideos: (params) => request('/videos', params, (p, { videos }) => queryVideos(videos, p)),
  getPodcasts: () => request('/podcasts', null, (_, { podcasts }) => podcasts),
  search: (q) => request('/search', { q }, (_, data) => searchAll(data, q)),
};

export const isMockMode = !API_BASE;
