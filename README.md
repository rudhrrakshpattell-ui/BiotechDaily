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

## Connecting a real API

All data goes through `src/services/api.js`. Pages never import mock data directly.

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL=https://your-api.example.com`.
2. Implement the endpoints listed at the top of `api.js`. The mock query functions in the same file show how each endpoint should filter and sort, and what shape it should return.

If `VITE_API_BASE_URL` is empty, the app uses the mock data in `src/data/` and adds a short delay so loading states still show. The footer shows a "Demo mode" badge while mock data is in use.

Suggested sources: an RSS/news aggregator for `/news`, the YouTube Data API (a curated playlist) for `/videos`, podcast RSS feeds parsed server-side for `/podcasts`, and a financial-data provider for live company figures.

## About the mock data

- **News headlines, startups, investors and podcast shows are fictional.** News dates are generated relative to today, so the feed always looks current.
- **Company background and marketed products** come from public information. Headcount, market cap and pipeline stages are approximate placeholders.
- **Videos** are real public YouTube videos.
- **Podcast audio** uses royalty-free SoundHelix demo tracks.

## Structure

```
src/
  services/api.js      data layer (mock ↔ HTTP switch)
  services/format.js   date/money formatting
  data/                mock data + shared taxonomy
  hooks/               useAsync, useDebounce, useTheme, useRoute (hash router)
  context/             PlayerContext (global audio)
  components/          Header, Footer, SearchDialog, cards, PodcastPlayer, VideoEmbed, ui primitives
  pages/               Home, News, Companies, CompanyDetail, Startups, Media, Podcasts
```

Routing uses the URL hash (`#/companies/vertex`), so it works on any static host without server rewrites. Swap in react-router if you need clean URLs.
