import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Serves the Vercel functions in /api during `npm run dev`, so the frontend can call /api/* locally.
// Mirrors Vercel's file routing: /api/news -> api/news.js, /api/companies/amgen -> api/companies/[id].js.
function devApiRoutes() {
  const root = join(process.cwd(), 'api');

  function resolve(segments) {
    const exact = join(root, ...segments) + '.js';
    if (existsSync(exact)) return exact;
    const dir = join(root, ...segments.slice(0, -1));
    const dynamic = existsSync(dir) && readdirSync(dir).find((f) => /^\[[^\]]+\]\.js$/.test(f));
    return dynamic ? join(dir, dynamic) : null;
  }

  return {
    name: 'dev-api-routes',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const file = resolve(url.pathname.split('/').filter(Boolean));
        if (!file) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method] ?? (req.method === 'HEAD' ? mod.GET : null);
          if (!handler) {
            res.statusCode = 405;
            return res.end('Method not allowed');
          }
          const response = await handler(new Request(`http://${req.headers.host}/api${req.url}`, { method: req.method }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(`[api] ${req.url}: ${err.stack ?? err}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiRoutes()],
});
