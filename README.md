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

No Node yet? Serve the folder with any static server and open `preview.html`, which runs the same `src/` files in the browser:

```bash
python3 -m http.server 5178
```

## Backend

The backend is a set of Vercel serverless functions in `api/`, deployed with the site. The frontend calls them through `src/services/api.js`.

| Route | Data |
| --- | --- |
| `GET /api/news` | **Live.** STAT, Fierce Biotech, BioPharma Dive, GEN, BioSpace, Labiotech and ScienceDaily RSS feeds (`server/news.js`) |
| `GET /api/videos` | **Live.** Latest uploads from 8 YouTube channels via their free channel feeds, no API key (`server/videos.js`) |
| `GET /api/podcasts` | **Live.** 5 latest episodes from 6 biotech podcasts' RSS feeds (`server/podcasts.js`) |
| `GET /api/search` | Live news, funding rounds, videos and episodes + companies |
| `GET /api/companies`, `/api/companies/:id` | Curated data (`src/data/companies.js`) |
| `GET /api/startups` | **Live.** Funding rounds and IPOs extracted from the news headlines (`server/funding.js`) |

How the live sources work (shared plumbing in `server/rss.js`):
- All feeds are fetched in parallel with an 8-second timeout each. If one feed fails, it's skipped and the others still show.
- Stories are normalized, de-duplicated and sorted into topics by keyword rules (`RULES`).
- Results are cached in memory (news 10 minutes, videos and podcasts 30 minutes), and Vercel's CDN caches responses too, so sources are fetched at most a few times an hour.
- If every source of a kind fails, the API returns the sample data instead, so the site keeps working.
- Videos skip hiring/culture clips and feature the most-watched upload of the last two weeks.

The funding tracker reads headlines like "Enveda reaps $311M series E" and extracts the company, amount (converted to approximate USD), stage and therapeutic area. It skips headlines about deals, acquisitions and licensing. It only knows rounds the news feeds currently carry, roughly the last two weeks, and it never falls back to sample data. Parser tests are in `tests/funding.test.js`; run them with `npm test`.

To add a source, append it to `NEWS_FEEDS`, `VIDEO_CHANNELS` or `PODCAST_FEEDS`. A YouTube channel ID is in the channel page's source (`"externalId"`); a podcast's feed URL can be found with `https://itunes.apple.com/search?media=podcast&term=<name>`.

In development, `npm run dev` serves the same functions through a small Vite plugin (see `vite.config.js`), so there's nothing extra to run. `VITE_API_BASE_URL` is set to `/api` in `.env.development` and `.env.production`. Empty it to run fully on mock data in the browser.

## About the mock data

- **The sample startups, investors and podcast shows are fictional**, and only appear in mock mode. The sample news in `src/data/news.js` is fictional too; it's used only as a fallback when the live feeds fail, or in mock mode.
- **Company background and marketed products** come from public information. Headcount, market cap and pipeline stages are approximate placeholders.
- **Sample videos and podcasts** in `src/data/` are only used as a fallback; the sample podcast audio is royalty-free SoundHelix demo tracks.

## Structure

```
api/                   Vercel serverless functions (one file per route)
server/rss.js          feed fetching, parsing, topic classification, caching
server/news.js         live news
server/videos.js       live YouTube videos
server/podcasts.js     live podcast episodes
server/funding.js      funding rounds extracted from live news
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
```

Routing uses the URL hash (`#/companies/vertex`), so it works on any static host without server rewrites. Swap in react-router if you need clean URLs.
