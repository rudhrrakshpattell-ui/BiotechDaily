// Title, description and indexing rules per URL. Used by the browser (document.title on navigation)
// and by api/page.js, which writes these tags into the HTML for crawlers and link previews.
import { companies } from './data/companies.js';
import { categoryById } from './data/categories.js';
import { trendByKey, trendLabel } from './services/trending.js';

export const SITE_NAME = 'BiotechDaily';
export const FOUNDER = 'Rudhrraksh Pattell';
// Canonical origin for links in sitemaps and share tags. Override with SITE_URL for a custom domain.
export const DEFAULT_SITE_URL = 'https://biotech-daily.vercel.app';
export const OG_IMAGE_PATH = '/og-image.png';

const HOME = {
  title: 'BiotechDaily: daily biotech news, funding rounds, videos & podcasts',
  description: 'BiotechDaily, founded by Rudhrraksh Pattell: live biotech news from STAT, Fierce Biotech and BioPharma Dive, funding rounds, company profiles, videos and podcasts.',
};

const page = (title, description) => ({ title: `${title} | ${SITE_NAME}`, description });

// Returns { title, description, status, index } for a path like "/companies/vertex" and its query.
export function metaFor(pathname, query = {}) {
  const [section, id, ...rest] = pathname.split('/').filter(Boolean);
  const notFound = { ...page('Page not found', 'This page doesn’t exist. Head back to today’s biotech brief.'), status: 404, index: false };
  if (rest.length) return notFound;

  switch (section) {
    case undefined:
      return { ...HOME, status: 200, index: true };
    case 'news': {
      if (id) return notFound;
      const cat = categoryById[query.category];
      const trend = trendByKey[query.trend];
      if (trend) return { ...page(`${trendLabel(trend)} news`, `The latest biotech stories about ${trendLabel(trend)}, updated throughout the day.`), status: 200, index: false };
      return cat
        ? { ...page(`${cat.label} news`, `The latest ${cat.label.toLowerCase()} stories in biotech, updated throughout the day from leading newsrooms.`), status: 200, index: true }
        : { ...page('Biotech news today', 'Live biotech news from STAT, Fierce Biotech, BioPharma Dive, GEN and more: research breakthroughs, clinical readouts, approvals and deals.'), status: 200, index: !query.q };
    }
    case 'companies': {
      if (!id) return { ...page('Top 10 biotech companies', 'Profiles of Genentech, Amgen, Moderna, BioNTech, Vertex, Regeneron, Gilead, Biogen, Alnylam and CSL: medicines, pipelines and milestones.'), status: 200, index: true };
      const c = companies.find((x) => x.id === id);
      if (!c) return notFound;
      const products = c.products.slice(0, 3).map((p) => p.name).join(', ');
      return {
        ...page(`${c.name}: company profile, pipeline & news`, `${c.name} (${c.ticker}), founded ${c.founded} in ${c.hq}. ${c.tagline} Key medicines include ${products}.`),
        status: 200,
        index: true,
      };
    }
    case 'startups':
      if (id) return notFound;
      return { ...page('Biotech funding tracker', 'The latest biotech venture rounds and IPOs, pulled from the news with amounts, stages and therapeutic areas.'), status: 200, index: !query.q };
    case 'media':
      if (id) return notFound;
      return { ...page('Biotech videos', 'The latest videos from STAT, Endpoints News, the Broad Institute, Nature and Science, alongside today’s top biotech stories.'), status: 200, index: !query.v };
    case 'podcasts':
      if (id) return notFound;
      return { ...page('Biotech podcasts', 'New episodes from The Readout Loud, Biotech Hangout, The Long Run and more, playable right in your browser.'), status: 200, index: true };
    default:
      return notFound;
  }
}

// Paths listed in sitemap.xml.
export const SITEMAP_PATHS = ['/', '/news', '/companies', ...companies.map((c) => `/companies/${c.id}`), '/startups', '/media', '/podcasts'];
