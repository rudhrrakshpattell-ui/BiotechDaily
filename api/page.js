// Serves the app's index.html for every page URL, with that page's title, description, canonical link
// and Open Graph / Twitter tags written in. Crawlers and link previews (LinkedIn, X, Slack) don't run
// JavaScript, so these have to be in the HTML itself. vercel.json rewrites page paths here as ?__path=.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_SITE_URL, OG_IMAGE_PATH, SITE_NAME, metaFor } from '../src/seo.js';

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/;
let template = null;

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadTemplate(origin) {
  if (template) return template;
  try {
    // Bundled with the function via "includeFiles" in vercel.json.
    template = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
  } catch {
    // Fall back to the static copy the CDN serves.
    const res = await fetch(`${origin}/index.html`);
    if (!res.ok) throw new Error(`index.html: HTTP ${res.status}`);
    template = await res.text();
  }
  if (!SEO_BLOCK.test(template)) throw new Error('index.html is missing the <!--seo--> block');
  return template;
}

export function seoTags(pathname, query, siteUrl, { production = true } = {}) {
  const meta = metaFor(pathname, query);
  const url = `${siteUrl}${pathname === '/' ? '/' : pathname}${query.category ? `?category=${encodeURIComponent(query.category)}` : ''}`;
  const image = `${siteUrl}${OG_IMAGE_PATH}`;
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    meta.index && production ? `<link rel="canonical" href="${escape(url)}" />` : '<meta name="robots" content="noindex" />',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  return { meta, html: `<!--seo-->\n    ${tags.join('\n    ')}\n    <!--/seo-->` };
}

export async function GET(request) {
  const url = new URL(request.url);
  const pathname = `/${(url.searchParams.get('__path') ?? url.pathname.replace(/^\/api\/page\/?/, '')).replace(/^\/+|\/+$/g, '')}`;
  url.searchParams.delete('__path');
  const query = Object.fromEntries(url.searchParams);

  const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  // Only the production deployment should be indexed; previews get noindex.
  const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';
  const { meta, html } = seoTags(pathname, query, siteUrl, { production });

  const page = (await loadTemplate(url.origin)).replace(SEO_BLOCK, html);
  return new Response(page, {
    status: meta.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
