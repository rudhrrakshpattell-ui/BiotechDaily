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
| `GET /api/news` | **Live.** Pulled from STAT, BioPharma Dive, GEN, BioSpace, Labiotech and ScienceDaily RSS feeds |
| `GET /api/search` | Live news + sample data |
| `GET /api/companies`, `/api/companies/:id` | Sample data (`src/data/companies.js`) |
| `GET /api/startups`, `/api/videos`, `/api/podcasts` | Sample data |

How the news feed works (`server/feeds.js`):
- All feeds are fetched in parallel with an 8-second timeout each. If one feed fails, it's skipped and the others still show.
- Stories are normalized, de-duplicated and sorted into topics by keyword rules (`RULES`).
- Results are cached in memory for 10 minutes. Vercel's CDN also caches responses (`s-maxage=600`), so the feeds are fetched at most a few times an hour.
- If every feed fails, the API returns the sample stories with `live: false`, so the site keeps working.

To add a feed, append it to `FEEDS` in `server/feeds.js`. It must be RSS 2.0, RDF or Atom.

In development, `npm run dev` serves the same functions through a small Vite plugin (see `vite.config.js`), so there's nothing extra to run. `VITE_API_BASE_URL` is set to `/api` in `.env.development` and `.env.production`. Empty it to run fully on mock data in the browser.

## About the mock data

- **Startups, investors and podcast shows are fictional.** The sample news in `src/data/news.js` is fictional too; it's used only as a fallback when the live feeds fail, or in mock mode.
- **Company background and marketed products** come from public information. Headcount, market cap and pipeline stages are approximate placeholders.
- **Videos** are real public YouTube videos.
- **Podcast audio** uses royalty-free SoundHelix demo tracks.

## Structure

```
api/                   Vercel serverless functions (one file per route)
server/feeds.js        RSS fetching, parsing, classification, caching
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
