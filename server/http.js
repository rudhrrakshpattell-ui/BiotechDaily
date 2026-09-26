// Small helpers for Web-standard (Request -> Response) handlers, which Vercel's Node runtime
// runs natively and the Vite dev middleware (vite.config.js) calls directly.

export const params = (request) => Object.fromEntries(new URL(request.url).searchParams);

// s-maxage lets Vercel's CDN serve cached responses; stale-while-revalidate refreshes them in the background.
export function json(data, { status = 200, maxAge = 600 } = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 3}` },
  });
}

export const notFound = (message = 'Not found') => json({ error: message }, { status: 404, maxAge: 60 });

// Short keyword used to find a company in free-text headlines ("Gilead Sciences" -> "Gilead").
export const companyKeyword = (companies, id) => companies.find((c) => c.id === id)?.name.split(' ')[0];
