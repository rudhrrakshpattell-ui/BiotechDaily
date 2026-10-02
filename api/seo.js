// sitemap.xml and robots.txt (vercel.json rewrites both here).
import { DEFAULT_SITE_URL, SITEMAP_PATHS } from '../src/seo.js';

export function GET(request) {
  const file = new URL(request.url).searchParams.get('file');
  const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';
  const headers = { 'Cache-Control': 'public, s-maxage=86400' };

  if (file === 'robots') {
    const body = production
      ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n';
    return new Response(body, { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  if (file === 'sitemap') {
    const today = new Date().toISOString().slice(0, 10);
    const urls = SITEMAP_PATHS.map((p) => {
      // News, funding, video and podcast pages change daily; company profiles rarely.
      const daily = !p.startsWith('/companies/');
      return `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod><changefreq>${daily ? 'daily' : 'monthly'}</changefreq></url>`;
    });
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
    return new Response(body, { headers: { ...headers, 'Content-Type': 'application/xml; charset=utf-8' } });
  }

  return new Response('Not found', { status: 404 });
}
