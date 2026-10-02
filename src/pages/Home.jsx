import Icon from '../components/Icon.jsx';
import NewsCard from '../components/NewsCard.jsx';
import CompanyCard from '../components/CompanyCard.jsx';
import VideoEmbed from '../components/VideoEmbed.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import TrendingStrip from '../components/TrendingStrip.jsx';
import DnaHelix from '../components/DnaHelix.jsx';
import { connectEnabled } from '../connect/enabled.js';
import { LinkArrow, SectionHeader, SkeletonList, Monogram } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { timeAgo } from '../services/format.js';

const EXPLORE = [
  { href: '/news', icon: 'newspaper', title: 'News', text: 'Live headlines from STAT, Fierce Biotech, BioPharma Dive and more.', cta: 'Read' },
  { href: '/podcasts', icon: 'mic', title: 'Podcasts', text: 'Deep-dives and deal talk you can play right on the page.', cta: 'Listen' },
  { href: '/media', icon: 'video', title: 'Videos', text: 'The science explained, from CRISPR to AlphaFold.', cta: 'Watch' },
  { href: '/companies', icon: 'building', title: 'Companies', text: 'Profiles, marketed medicines and pipelines of the industry leaders.', cta: 'Browse' },
  { href: '/startups', icon: 'rocket', title: 'Startups', text: 'Every new funding round, by stage and therapeutic area.', cta: 'Track' },
  { href: '/connect', icon: 'users', title: 'Connect', text: 'Follow people, post papers and questions, join the discussion.', cta: 'Join' },
];

export default function Home() {
  const newsQ = useAsync(() => api.getNews({ pageSize: 20 }), []);
  const companiesQ = useAsync(() => api.getCompanies({}), []);
  const startupsQ = useAsync(() => api.getStartups({ sort: 'recent' }), []);
  const videosQ = useAsync(() => api.getVideos({}), []);
  const podcastsQ = useAsync(() => api.getPodcasts(), []);
  const trendingQ = useAsync(() => api.getTrending(), []);

  const items = newsQ.data?.items ?? [];
  const featured = items.find((n) => n.featured) ?? items[0];
  const rest = items.filter((n) => n !== featured).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-helix-400/20 blur-3xl dark:bg-helix-400/10" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            The life sciences,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-helix-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-helix-400">decoded daily.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            News, podcasts, videos, company profiles and funding rounds from across biotech and pharma, curated into a ten-minute read.
            {connectEnabled && ' Then talk it through with the people building it.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/news" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
              Read today’s brief <Icon name="chevronRight" className="h-4 w-4" />
            </a>
            {connectEnabled ? (
              <a href="/connect/join" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">
                <Icon name="users" className="h-4 w-4" /> Join the conversation
              </a>
            ) : (
              <a href="/podcasts" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">
                <Icon name="headphones" className="h-4 w-4" /> Listen instead
              </a>
            )}
          </div>
          {/* Phones and tablets: the helix runs horizontally under the buttons. */}
          <DnaHelix orientation="horizontal" pairs={24} turns={2.5} speed={0.8} className="relative -mx-2 mt-8 h-36 sm:h-44 lg:hidden" />
          <TrendingStrip data={trendingQ.data} />
          </div>

          {/* Desktop: a tall vertical helix with floating cards. */}
          <div className="relative hidden h-[34rem] lg:block">
            <DnaHelix pairs={26} turns={2.2} className="absolute inset-0" />
            {connectEnabled && (
              <a href="/connect" className="focus-ring card absolute left-0 top-16 w-60 animate-[bob_6s_ease-in-out_infinite] p-4 !bg-white/85 backdrop-blur hover:border-brand-300 motion-reduce:animate-none dark:!bg-ink-900/85">
                <p className="eyebrow">Connect</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">Discuss the papers, readouts and deals behind every headline</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Icon name="message" className="h-3.5 w-3.5" /> Join the community</p>
              </a>
            )}
            <a href="/podcasts" className="focus-ring card absolute bottom-16 right-0 w-60 animate-[bob_7s_ease-in-out_-3s_infinite] p-4 !bg-white/85 backdrop-blur hover:border-brand-300 motion-reduce:animate-none dark:!bg-ink-900/85">
              <p className="eyebrow">Listen</p>
              <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">New episodes from the week’s biggest stories</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Icon name="headphones" className="h-3.5 w-3.5" /> Podcasts</p>
            </a>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section className="mx-auto mb-20 mt-4 max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Explore" title="Everything biotech, one front page" />
        <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${connectEnabled ? 'xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
          {EXPLORE.filter((e) => connectEnabled || e.href !== '/connect').map((e, i) => (
            <a key={e.href} href={e.href} className="focus-ring card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-300 dark:hover:border-brand-400/40">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${i % 2 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300'}`}>
                <Icon name={e.icon} className="h-5 w-5" />
              </span>
              <span className="mt-4 font-display font-semibold text-slate-900 dark:text-white">{e.title}</span>
              <span className="mt-1 flex-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">{e.text}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
                {e.cta} <Icon name="chevronRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Top stories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Top stories" title="Today’s discoveries" action={<LinkArrow href="/news">All news</LinkArrow>} />
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
        <SectionHeader eyebrow="Industry leaders" title="Top biotech & pharma companies" description="Profiles, marketed medicines, pipeline focus and milestones." action={<LinkArrow href="/companies">All profiles</LinkArrow>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companiesQ.data ? companiesQ.data.slice(0, 4).map((c) => <CompanyCard key={c.id} company={c} />) : <SkeletonList count={4} className="h-60" />}
        </div>
        {companiesQ.data && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {companiesQ.data.slice(4).map((c) => (
              <a key={c.id} href={`/companies/${c.id}`} className="focus-ring flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300">
                <Monogram name={c.name} color={c.color} className="h-7 w-7 rounded-lg text-[10px]" />
                {c.name}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Connect (only once Supabase is configured) */}
      {connectEnabled && <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 p-8 text-white sm:p-10">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-helix-400/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-helix-300">New · BiotechDaily Connect</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">The community for biotech students</h2>
              <p className="mt-3 max-w-xl text-brand-100">Create your profile, follow students from universities around the world, and share papers, lab wins and questions.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/connect/join" className="focus-ring rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Join free</a>
                <a href="/connect" className="focus-ring rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Explore Connect</a>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[['users', 'Follow students and build your network'], ['sparkles', 'Post research, tips and questions'], ['flask', 'Profiles built around your program and interests']].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Icon name={icon} className="h-5 w-5 text-helix-300" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>}

      {/* Startups + podcasts */}
      <section className="mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card min-w-0 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Funding</p>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Latest funding rounds</h2>
            </div>
            <LinkArrow href="/startups">Tracker</LinkArrow>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {(startupsQ.data ?? []).slice(0, 5).map((s) => (
              <li key={s.id} className="relative flex items-center gap-4 py-3">
                <Monogram name={s.name} color="from-helix-500 to-brand-600" className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded after:absolute after:inset-0 after:content-[''] hover:text-brand-700 dark:hover:text-brand-300">{s.name}</a> : s.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{s.area} · {timeAgo(s.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold tabular-nums text-helix-600 dark:text-helix-400">{s.amountLabel}</p>
                  <p className="text-xs text-slate-500">{s.stage === 'Other' ? 'Round' : s.stage}</p>
                </div>
              </li>
            ))}
            {startupsQ.data?.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No funding rounds in the news right now.</li>}
            {!startupsQ.data && <SkeletonList count={5} className="my-2 h-12" />}
          </ul>
        </div>

        <div className="card min-w-0 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Listen</p>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">New episodes</h2>
            </div>
            <LinkArrow href="/podcasts">All shows</LinkArrow>
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
        <SectionHeader eyebrow="Watch" title="Science explained" action={<LinkArrow href="/media">Video library</LinkArrow>} />
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
