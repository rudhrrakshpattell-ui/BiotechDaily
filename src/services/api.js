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
import { news } from '../data/news.js';
import { companies } from '../data/companies.js';
import { startups } from '../data/startups.js';
import { videos } from '../data/videos.js';
import { podcasts } from '../data/podcasts.js';
import { queryNews, queryCompanies, queryStartups, queryVideos, searchAll } from './queries.js';

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
  await sleep(MOCK_LATENCY_MS);
  return structuredClone(mock(params ?? {}));
}

export const api = {
  getNews: (params) =>
    request('/news', params, (p) => ({
      ...queryNews(news, { ...p, companyName: companies.find((c) => c.id === p.company)?.name.split(' ')[0] }),
      live: false,
    })),
  getCompanies: (params) => request('/companies', params, (p) => queryCompanies(companies, p)),
  getCompany: (id) =>
    request(`/companies/${encodeURIComponent(id)}`, null, () => {
      const company = companies.find((c) => c.id === id);
      if (!company) throw new Error('Company not found');
      return company;
    }),
  getStartups: (params) => request('/startups', params, (p) => queryStartups(startups, p)),
  getVideos: (params) => request('/videos', params, (p) => queryVideos(videos, p)),
  getPodcasts: () => request('/podcasts', null, () => podcasts),
  search: (q) => request('/search', { q }, () => searchAll({ news, companies, startups, videos, podcasts }, q)),
};

export const isMockMode = !API_BASE;
