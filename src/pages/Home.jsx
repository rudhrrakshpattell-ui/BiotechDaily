import Icon from '../components/Icon.jsx';
import NewsCard from '../components/NewsCard.jsx';
import CompanyCard from '../components/CompanyCard.jsx';
import VideoEmbed from '../components/VideoEmbed.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import { LinkArrow, SectionHeader, SkeletonList, Monogram } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatMoney, formatDate } from '../services/format.js';
import { NEWS_CATEGORIES } from '../data/categories.js';

export default function Home() {
  const newsQ = useAsync(() => api.getNews({ pageSize: 20 }), []);
  const companiesQ = useAsync(() => api.getCompanies({}), []);
  const startupsQ = useAsync(() => api.getStartups({ sort: 'recent' }), []);
  const videosQ = useAsync(() => api.getVideos({}), []);
  const podcastsQ = useAsync(() => api.getPodcasts(), []);

  const items = newsQ.data?.items ?? [];
  const featured = items.find((n) => n.featured) ?? items[0];
  const rest = items.filter((n) => n !== featured).slice(0, 6);
  const today = formatDate(new Date().toISOString(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-helix-400/20 blur-3xl dark:bg-helix-400/10" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-helix-500/20 bg-white/70 px-3 py-1 text-xs font-semibold text-helix-700 backdrop-blur dark:bg-ink-900/60 dark:text-helix-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-helix-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-helix-500" /></span>
            {today}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            The life sciences,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-helix-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-helix-400">decoded daily.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Breakthroughs, company moves and funding rounds from across biotech, curated into a ten-minute read.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/news" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
              Read today’s brief <Icon name="chevronRight" className="h-4 w-4" />
            </a>
            <a href="#/podcasts" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">
              <Icon name="headphones" className="h-4 w-4" /> Listen instead
            </a>
          </div>
          <div className="no-scrollbar mt-10 flex gap-2 overflow-x-auto">
            {NEWS_CATEGORIES.map((c) => (
              <a key={c.id} href={`#/news?category=${c.id}`} className="chip chip-idle focus-ring">{c.label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* Top stories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Top stories" title="Today’s discoveries" action={<LinkArrow href="#/news">All news</LinkArrow>} />
        {newsQ.loading && !newsQ.data ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]"><div className="skeleton h-[28rem]" /><div className="space-y-3"><SkeletonList count={5} className="h-16" /></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {featured && <NewsCard item={featured} variant="featured" />}
            <div className="card divide-y divide-slate-100 px-5 py-2 dark:divide-white/5">
              {rest.map((n) => <NewsCard key={n.id} item={n} variant="compact" />)}
            </div>
          </div>
        )}
      </section>

      {/* Companies */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Industry leaders" title="Top 10 biotech companies" description="Profiles, marketed medicines, pipeline focus and milestones." action={<LinkArrow href="#/companies">All profiles</LinkArrow>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companiesQ.data ? companiesQ.data.slice(0, 4).map((c) => <CompanyCard key={c.id} company={c} />) : <SkeletonList count={4} className="h-60" />}
        </div>
        {companiesQ.data && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {companiesQ.data.slice(4).map((c) => (
              <a key={c.id} href={`#/companies/${c.id}`} className="focus-ring flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300">
                <Monogram name={c.name} color={c.color} className="h-7 w-7 rounded-lg text-[10px]" />
                {c.name}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Startups + podcasts */}
      <section className="mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Emerging startups</p>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Latest funding rounds</h2>
            </div>
            <LinkArrow href="#/startups">Tracker</LinkArrow>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {(startupsQ.data ?? []).slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-3">
                <Monogram name={s.name} color="from-helix-500 to-brand-600" className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{s.area} · {s.hq}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold tabular-nums text-helix-600 dark:text-helix-400">{formatMoney(s.lastRoundM)}</p>
                  <p className="text-xs text-slate-500">{s.stage}</p>
                </div>
              </li>
            ))}
            {!startupsQ.data && <SkeletonList count={5} className="my-2 h-12" />}
          </ul>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Listen</p>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">New episodes</h2>
            </div>
            <LinkArrow href="#/podcasts">All shows</LinkArrow>
          </div>
          <div className="-mx-3 space-y-1">
            {(podcastsQ.data ?? []).flatMap((p) => p.episodes.slice(0, 1).map((e) => (
              <div key={e.id}>
                <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{p.title}</p>
                <EpisodeRow episode={e} show={p} />
              </div>
            )))}
            {!podcastsQ.data && <SkeletonList count={3} className="mx-3 h-14" />}
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Watch" title="Science explained" action={<LinkArrow href="#/media">Video library</LinkArrow>} />
        <div className="grid gap-5 md:grid-cols-3">
          {(videosQ.data ?? []).slice(0, 3).map((v) => (
            <div key={v.id}>
              <VideoEmbed video={v} />
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
              <p className="text-xs text-slate-500">{v.channel}</p>
            </div>
          ))}
          {!videosQ.data && <SkeletonList count={3} className="aspect-video" />}
        </div>
      </section>
    </>
  );
}
