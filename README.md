# BiotechDaily

A daily biotech briefing site built with React 19, Vite and Tailwind CSS v4.

- **News feed**: search, topic chips, date range, sort, "load more" paging
- **Top 10 company profiles**: Genentech, Amgen, Moderna, BioNTech, Vertex, Regeneron, Gilead, Biogen, Alnylam, CSL, each with key medicines, pipeline stages, a milestone timeline and related news
- **Startup funding tracker**: summary figures, filters by stage and focus area, sort by recency or capital raised
- **Video & news**: YouTube embeds that load on click, with a topic filter and a headlines sidebar
- **Podcasts**: one app-wide audio player (seek, ±15s, speed) that keeps playing while you browse
- **Global search**: ⌘K / Ctrl+K or `/`, covering news, companies, startups, videos and episodes
- **Dark and light mode**: follows the system setting, can be switched manually, and the choice is saved

## Run it

```bash
npm install
npm run dev
```

Run the tests with `npm test`.

## Backend

The backend is a set of Vercel serverless functions in `api/`, deployed with the site. The frontend calls them through `src/services/api.js`.

| Route | Data |
| --- | --- |
| `GET /api/news` | **Live.** STAT, Fierce Biotech, BioPharma Dive, GEN, BioSpace, Labiotech and ScienceDaily RSS feeds (`server/news.js`) |
| `GET /api/videos` | **Live.** Latest uploads from 8 YouTube channels via their free channel feeds, no API key (`server/videos.js`) |
| `GET /api/podcasts` | **Live.** 5 latest episodes from 6 biotech podcasts' RSS feeds (`server/podcasts.js`) |
| `GET /api/trending` | Companies and themes mentioned most in the last 3 days of news, videos and podcasts (`src/services/trending.js`) |
| `GET /api/search` | Live news, funding rounds, videos and episodes + companies |
| `GET /api/companies`, `/api/companies/:id` | Curated profiles (`src/data/companies.js`) |
| `GET /api/companies/:id?section=press` | **Live.** The company's own press releases, for the 6 companies with a public feed (`server/pressReleases.js`) |
| `GET /api/startups` | **Live.** Funding rounds and IPOs extracted from the news headlines (`server/funding.js`) |

How the live sources work (shared plumbing in `server/rss.js`):
- All feeds are fetched in parallel with an 8-second timeout each. If one feed fails, it's skipped and the others still show.
- Stories are normalized, de-duplicated and sorted into topics by keyword rules (`RULES`).
- Results are cached in memory (news 10 minutes, videos and podcasts 30 minutes), and Vercel's CDN caches responses too, so sources are fetched at most a few times an hour.
- If every source of a kind fails, the API returns the sample data instead, so the site keeps working.
- Videos skip hiring/culture clips and feature the most-watched upload of the last two weeks.

The funding tracker reads headlines like "Enveda reaps $311M series E" and extracts the company, amount (converted to approximate USD), stage and therapeutic area. It skips headlines about deals, acquisitions and licensing. It only knows rounds the news feeds currently carry, roughly the last two weeks, and it never falls back to sample data. Parser tests are in `tests/funding.test.js`; run them with `npm test`.

**Trending now** (home page) counts how many distinct stories, videos and episodes from the last 72 hours mention each company or theme in `TRENDING_COMPANIES` / `TRENDING_THEMES` (at least 2 to show, widening to 7 days on very quiet stretches). Each chip links to `/news?trend=<key>`, which filters the feed with the same pattern, so the list matches the count. Add a company or theme by appending an entry with a `match` regex.

**Company pages** also show the company's latest press releases (Amgen, BioNTech, Vertex, Regeneron, Biogen and Alnylam publish feeds; Moderna, Gilead, Genentech and CSL don't), plus videos, podcast episodes and funding rounds that mention it, matched with the same patterns as Trending. Sections only appear when there's something to show.

To add a source, append it to `NEWS_FEEDS`, `VIDEO_CHANNELS` or `PODCAST_FEEDS`. A YouTube channel ID is in the channel page's source (`"externalId"`); a podcast's feed URL can be found with `https://itunes.apple.com/search?media=podcast&term=<name>`.

In development, `npm run dev` serves the same functions through a small Vite plugin (see `vite.config.js`), so there's nothing extra to run. `VITE_API_BASE_URL` is set to `/api` in `.env.development` and `.env.production`. Empty it to run fully on mock data in the browser.

## About the mock data

- **The sample startups, investors and podcast shows are fictional**, and only appear in mock mode. The sample news in `src/data/news.js` is fictional too; it's used only as a fallback when the live feeds fail, or in mock mode.
- **Company background and marketed products** come from public information. Headcount, market cap and pipeline stages are approximate placeholders.
- **Sample videos and podcasts** in `src/data/` are only used as a fallback; the sample podcast audio is royalty-free SoundHelix demo tracks.

## Structure

```
api/                   Vercel serverless functions (one file per route; page.js + seo.js serve HTML/SEO)
public/                favicon, share image
design/                share image source (SVG)
server/rss.js          feed fetching, parsing, topic classification, caching
server/news.js         live news
server/videos.js       live YouTube videos
server/podcasts.js     live podcast episodes
server/funding.js      funding rounds extracted from live news
server/pressReleases.js company press releases
tests/                 node:test tests (npm test)
server/http.js         JSON/caching helpers for the functions
src/
  services/api.js      data layer (mock ↔ HTTP switch)
  services/queries.js  filter/sort logic shared by the mock layer and the API
  services/format.js   date/money formatting
  data/                mock data + shared taxonomy
  hooks/               useAsync, useDebounce, useTheme, useRoute (hash router)
  context/             PlayerContext (global audio)
  components/          Header, Footer, SearchDialog, cards, PodcastPlayer, VideoEmbed, ui primitives
  pages/               Home, News, Companies, CompanyDetail, Startups, Media, Podcasts
  seo.js               per-page titles/descriptions, sitemap paths
```

## Routing and SEO

Pages use clean URLs (`/companies/vertex`) through a small History-API router (`src/hooks/useRoute.js`). Old `#/` links are redirected automatically.

`vercel.json` sends every page URL to `api/page.js`, which serves `index.html` with that page's title, description, canonical link and Open Graph/Twitter tags. The tags come from `src/seo.js`, which the browser also uses to update the title on navigation. Link previews on LinkedIn, X and Slack work because the tags are in the HTML itself. Unknown paths return a real 404, and preview deployments are marked `noindex`.

- `/sitemap.xml` and `/robots.txt` are generated by `api/seo.js`.
- The share image is `public/og-image.png`; its source is `design/og-image.svg`.

## Performance

- Fonts (Inter, Sora) are self-hosted via Fontsource, so no render-blocking Google Fonts request.
- Remote images (news photos, podcast art) go through Vercel Image Optimization (`src/services/images.js`) in production: resized to the size they're shown at, served as AVIF/WebP from the site's own domain. Allowed hosts are listed in both `src/services/images.js` and `images.remotePatterns` in `vercel.json`; images from any other host are used as-is. In development, original URLs are used.
- Pages other than Home are code-split and load on first visit.
- With a custom domain, set the `SITE_URL` environment variable in Vercel (e.g. `https://biotechdaily.com`), and update the defaults in `index.html` and `DEFAULT_SITE_URL` in `src/seo.js`.
