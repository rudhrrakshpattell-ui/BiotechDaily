import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Helix3D from '../components/Helix3D.jsx';
import LogoMark from '../components/LogoMark.jsx';
import VideoEmbed from '../components/VideoEmbed.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import { CategoryBadge, LinkArrow, Monogram, SkeletonList } from '../components/ui.jsx';
import { categoryById } from '../data/categories.js';
import { connectEnabled } from '../connect/enabled.js';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { timeAgo } from '../services/format.js';

const WEEK_MS = 7 * 24 * 3600 * 1000;
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const money = (m) => (m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.round(m)}M`);
const MANIFESTO = 'Every morning we read the journals, the trial readouts, the FDA drama and the funding rounds. Then we spill the good stuff. No jargon. No snooze. Just the science everyone will be talking about today.';
const HIGHLIGHT = new Set(['spill', 'good', 'stuff.', 'talking']);

// True once the element has scrolled into view (and stays true).
function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return [ref, inView];
}

function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...props}>
      {children}
    </Tag>
  );
}

// Counts up from zero the first time it scrolls into view.
function CountUp({ value, format = (v) => Math.round(v).toLocaleString('en-US'), className = '' }) {
  const [ref, inView] = useInView(0.4);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView || value == null) return;
    if (reduceMotion()) return setShown(value);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      setShown(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref} className={className}>{value == null ? '–' : format(shown)}</span>;
}

// A paragraph whose words light up as you scroll through a tall section that pins it in place.
function Manifesto() {
  const ref = useRef(null);
  const words = MANIFESTO.split(' ');
  const [lit, setLit] = useState(reduceMotion() ? words.length : 0);
  useEffect(() => {
    if (reduceMotion()) return;
    const onScroll = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const p = Math.min(1, Math.max(0, (-r.top / (r.height - window.innerHeight)) * 1.15));
      setLit(Math.round(p * words.length));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [words.length]);
  return (
    <section ref={ref} className="h-[150vh] sm:h-[240vh] motion-reduce:h-auto">
      <div className="sticky top-0 flex h-[70vh] items-center sm:h-screen motion-reduce:static motion-reduce:h-auto motion-reduce:py-28">
        <p className="mx-auto max-w-5xl px-4 font-display text-[clamp(30px,5.2vw,60px)] font-semibold leading-[1.12] tracking-[-0.035em] sm:px-6">
          {words.map((w, i) => (
            <span key={i} className={`manifesto-word ${i < lit ? 'is-lit' : ''} ${HIGHLIGHT.has(w.toLowerCase()) ? 'is-highlight' : ''}`}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function Eyebrow({ children, tone = 'brand' }) {
  return <p className={`mb-3 font-display text-[15px] font-semibold tracking-tight ${tone === 'green' ? 'text-helix-600 dark:text-helix-400' : 'text-brand-600 dark:text-brand-300'}`}>{children}</p>;
}
const H2 = ({ children, className = '' }) => <h2 className={`font-display text-[clamp(36px,6vw,64px)] font-semibold leading-[1.05] tracking-[-0.035em] text-slate-900 dark:text-white ${className}`}>{children}</h2>;
const Lede = ({ children, className = '' }) => <p className={`mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-400 ${className}`}>{children}</p>;

function FloatingChip({ label, children, className }) {
  return (
    <div className={`absolute z-10 hidden animate-[sway_7s_ease-in-out_infinite] rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-left shadow-xl shadow-slate-900/5 backdrop-blur-xl motion-reduce:animate-none lg:block dark:border-white/10 dark:bg-ink-900/60 ${className}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{children}</p>
    </div>
  );
}

export default function Home() {
  const newsQ = useAsync(() => api.getNews({ pageSize: 20 }), []);
  const companiesQ = useAsync(() => api.getCompanies({}), []);
  const startupsQ = useAsync(() => api.getStartups({ sort: 'recent' }), []);
  const videosQ = useAsync(() => api.getVideos({}), []);
  const podcastsQ = useAsync(() => api.getPodcasts(), []);
  const trendingQ = useAsync(() => api.getTrending(), []);

  const items = newsQ.data?.items ?? [];
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => ['all', ...new Set(items.map((n) => n.category).filter((c) => categoryById[c]))], [items]);
  const stories = items.filter((n) => category === 'all' || n.category === category).slice(0, 6);

  // Startup rounds from the last week (or everything tracked, if the week has been quiet).
  const rounds = useMemo(() => {
    const all = startupsQ.data ?? [];
    const recent = all.filter((s) => Date.now() - new Date(s.date).getTime() < WEEK_MS);
    return recent.length >= 3 ? recent : all;
  }, [startupsQ.data]);
  const raised = startupsQ.data ? rounds.reduce((sum, s) => sum + (s.amountM || 0), 0) : null;
  const biggest = [...rounds].sort((a, b) => b.amountM - a.amountM).slice(0, 6);
  const maxRound = biggest[0]?.amountM || 1;

  const themes = trendingQ.data?.themes ?? [];
  const trendCompanies = trendingQ.data?.companies ?? [];
  const marquee = [...themes.map((t) => ({ ...t, kind: 'theme' })), ...trendCompanies.map((c) => ({ ...c, label: c.name, kind: 'company' }))];

  const railRef = useRef(null);
  const scrollRail = (dir) => railRef.current?.scrollBy({ left: dir * 316, behavior: reduceMotion() ? 'auto' : 'smooth' });

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative pt-10 text-center sm:pt-24">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="hero-rise font-display text-[clamp(44px,8.4vw,100px)] font-semibold leading-[0.98] tracking-[-0.045em] text-slate-900 dark:text-white">
            <span className="block">Biotech and pharma.</span>
            <span className="text-shimmer block">Served hot.</span>
          </h1>
          <p className="hero-rise mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 [animation-delay:120ms] sm:text-[22px] dark:text-slate-400">
            The breakthroughs, the plot twists and the big money moves. All the juicy science news, spilled fresh every morning.
          </p>
          <div className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 [animation-delay:240ms]">
            <a href="/news" className="focus-ring bouncy rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700">Get the tea</a>
            {connectEnabled ? (
              <a href="/connect" className="focus-ring inline-flex items-center gap-1 rounded-full px-2 py-3 font-medium text-brand-600 hover:underline dark:text-brand-300">Dive into The Gene Pool <Icon name="chevronRight" className="h-4 w-4" /></a>
            ) : (
              <a href="/podcasts" className="focus-ring inline-flex items-center gap-1 rounded-full px-2 py-3 font-medium text-brand-600 hover:underline dark:text-brand-300">Listen instead <Icon name="chevronRight" className="h-4 w-4" /></a>
            )}
          </div>
        </div>
        <div className="relative mt-2 h-[52vh] sm:h-[clamp(420px,66vh,720px)]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-[2/1] w-[min(900px,120%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(50_131_248/0.28),transparent_70%),radial-gradient(closest-side_at_70%_60%,rgb(16_185_138/0.24),transparent_70%)] blur-2xl" />
          <Helix3D className="h-full" />
          <FloatingChip label="Fresh spills today" className="left-[4%] top-[16%]">
            <CountUp value={newsQ.data?.total} />
          </FloatingChip>
          <FloatingChip label="Everyone’s talking about" className="right-[9%] top-[8%] [animation-delay:-2s]">
            {themes[0]?.label ?? 'AI in biotech'}
          </FloatingChip>
          <FloatingChip label="Cash splashed this week" className="bottom-[16%] right-[5%] [animation-delay:-4s]">
            <CountUp value={raised} format={money} />
          </FloatingChip>
        </div>
      </section>

      <Manifesto />

      {/* Numbers */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-28">
        <Reveal><Eyebrow>The tea, by the numbers</Eyebrow></Reveal>
        <Reveal delay={80}><H2>A whole industry.<br />Spilled in minutes.</H2></Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:mt-14 sm:gap-y-10 md:grid-cols-4">
          {[
            [newsQ.data?.total, undefined, 'stories read today, so you don’t have to'],
            [startupsQ.data ? rounds.length : null, undefined, 'funding rounds spotted this week'],
            [raised, money, 'of fresh cash raised'],
            [companiesQ.data?.length, undefined, 'companies we keep tabs on'],
          ].map(([value, format, label], i) => (
            <Reveal key={label} delay={i * 80}>
              <CountUp value={value} format={format} className={`block font-display text-[clamp(48px,7vw,84px)] font-semibold leading-none tracking-[-0.045em] ${i % 2 ? 'text-helix-500' : 'text-brand-500'}`} />
              <span className="mt-3 block max-w-[13rem] text-[15px] text-slate-600 dark:text-slate-400">{label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Today's spill */}
      <section className="bg-slate-100/70 py-16 sm:py-32 dark:bg-ink-900/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><Eyebrow>Today’s spill</Eyebrow></Reveal>
              <Reveal delay={80}><H2>What’s hot right now.</H2></Reveal>
            </div>
            <Reveal delay={160} as="p" className="max-w-sm text-lg text-slate-600 dark:text-slate-400">
              Hand-picked from STAT, Endpoints, BioPharma Dive, GEN and more. Translated from jargon to human.
            </Reveal>
          </div>
          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1" role="toolbar" aria-label="Filter stories">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-sm transition ${category === c ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-ink-950' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300'}`}
              >
                {c === 'all' ? 'All' : categoryById[c].label}
              </button>
            ))}
          </div>
          {newsQ.loading && !newsQ.data ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div className="skeleton h-[26rem] md:col-span-2 md:row-span-2" /><SkeletonList count={4} className="h-60" /></div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((n, i) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`focus-ring bouncy-card group relative flex min-h-60 flex-col overflow-hidden rounded-[28px] p-7 ${
                    i === 0
                      ? 'min-h-[26rem] bg-[radial-gradient(120%_120%_at_0%_0%,#2a6fe0_0%,#0c3a8a_45%,#06223f_75%)] text-white md:col-span-2 md:row-span-2 sm:p-9'
                      : 'border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-ink-900'
                  }`}
                >
                  {i === 0 && <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-helix-400/50 blur-3xl" />}
                  {i === 0 ? <span className="relative self-start rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{categoryById[n.category]?.label ?? 'News'}</span> : <CategoryBadge id={n.category} className="self-start" />}
                  <h3 className={`relative mt-4 font-display font-semibold tracking-tight ${i === 0 ? 'max-w-2xl text-[clamp(28px,3.6vw,44px)] leading-[1.08]' : 'text-xl leading-snug text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300'}`}>{n.title}</h3>
                  {n.summary && <p className={`relative mt-3 line-clamp-3 ${i === 0 ? 'max-w-xl text-lg text-white/75 sm:line-clamp-4' : 'text-[15px] text-slate-600 dark:text-slate-400'}`}>{n.summary}</p>}
                  {i === 0 && <LogoMark className="relative mt-8 h-24 w-24 text-white" />}
                  <div className={`relative mt-auto flex justify-between gap-3 pt-5 text-[13px] ${i === 0 ? 'text-white/65' : 'text-slate-500'}`}>
                    <span className={`font-medium ${i === 0 ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{n.source}</span>
                    <span>{timeAgo(n.date)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="mt-8 text-center"><LinkArrow href="/news">All the news</LinkArrow></div>
        </div>
      </section>

      {/* Trending marquee */}
      {marquee.length > 0 && (
        <div className="marquee border-y border-slate-200/70 py-6 dark:border-white/5" aria-label="Trending now">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1 || undefined}>
                {marquee.map((t) => (
                  <a key={t.label} href={`/news?trend=${t.key}`} tabIndex={copy ? -1 : undefined} className={`focus-ring flex shrink-0 items-center gap-4 px-1 font-display text-[clamp(20px,3vw,30px)] font-semibold tracking-tight hover:text-brand-600 ${t.kind === 'company' ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {t.label}
                    <span className="h-2 w-2 rounded-full bg-helix-500" />
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funding: a dark chapter */}
      <section className="relative overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(16_185_138/0.22),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal><Eyebrow tone="green">Show me the money</Eyebrow></Reveal>
          <Reveal delay={80}><H2 className="!text-white">Who’s raising what.</H2></Reveal>
          <Reveal delay={160}><Lede className="!text-slate-400">Seeds, series and IPOs, tracked as they happen. These are the biggest splashes this week.</Lede></Reveal>
          <Reveal>
            <CountUp value={raised} format={money} className="mt-8 block bg-gradient-to-b from-white from-30% to-white/35 bg-clip-text font-display text-[clamp(84px,17vw,210px)] font-semibold leading-[0.9] tracking-[-0.055em] text-transparent" />
          </Reveal>
          <Reveal className="mt-10 sm:mt-14">
            {biggest.map((r) => (
              <a key={r.id} href={r.url || '/startups'} target={r.url ? '_blank' : undefined} rel="noopener noreferrer" className="focus-ring grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1.5 border-t border-white/10 py-5 last:border-b">
                <span className="font-display text-[clamp(19px,2.4vw,24px)] font-semibold tracking-tight">{r.name}</span>
                <span className="row-span-2 text-right font-display text-[clamp(22px,3vw,32px)] font-semibold tracking-tight text-helix-300">{r.amountLabel}</span>
                <span className="text-sm text-slate-400">{r.stage === 'Other' ? 'Venture round' : r.stage} · {r.area} · {timeAgo(r.date)}</span>
                <span className="col-span-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="funding-bar block h-full rounded-full bg-gradient-to-r from-brand-500 to-helix-500" style={{ '--w': `${Math.max(4, (r.amountM / maxRound) * 100)}%` }} />
                </span>
              </a>
            ))}
            {!startupsQ.data && <SkeletonList count={4} className="my-3 h-14 !bg-white/5" />}
          </Reveal>
          <div className="mt-8"><a href="/startups" className="focus-ring inline-flex items-center gap-1 font-medium text-helix-300 hover:underline">The full funding tracker <Icon name="chevronRight" className="h-4 w-4" /></a></div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-16 sm:py-32">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
          <div>
            <Reveal><Eyebrow>The cast</Eyebrow></Reveal>
            <Reveal delay={80}><H2>The giants and<br />the rising stars.</H2></Reveal>
          </div>
          <div className="flex gap-2">
            {[[-1, 'Previous companies', 'chevronLeft'], [1, 'Next companies', 'chevronRight']].map(([dir, label, icon]) => (
              <button key={label} onClick={() => scrollRail(dir)} aria-label={label} className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-slate-200/70 text-slate-800 hover:bg-slate-300/70 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                <Icon name={icon} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
        <div ref={railRef} className="no-scrollbar mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 pt-2 sm:scroll-px-6 sm:px-6 xl:scroll-px-[calc((100vw-72rem)/2+1.5rem)] xl:px-[calc((100vw-72rem)/2+1.5rem)]">
          {(companiesQ.data ?? []).map((c) => (
            <a key={c.id} href={`/companies/${c.id}`} className="focus-ring bouncy-card flex min-h-72 w-[min(78vw,300px)] shrink-0 snap-start flex-col rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-ink-900">
              <Monogram name={c.name} color={c.color} className="h-14 w-14 rounded-2xl text-lg" />
              <h3 className="mt-5 font-display text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">{c.name}</h3>
              <p className="text-[13px] text-slate-500">{c.ticker ? `${c.ticker} · ` : ''}Founded {c.founded}</p>
              <p className="mt-3 line-clamp-3 text-[15px] text-slate-600 dark:text-slate-400">{c.tagline}</p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                {(c.focus ?? []).slice(0, 2).map((f) => <span key={f} className="rounded-full bg-helix-500/10 px-2.5 py-1 text-xs font-medium text-helix-700 dark:text-helix-300">{f}</span>)}
              </div>
            </a>
          ))}
          {!companiesQ.data && <SkeletonList count={4} className="h-72 w-[300px] shrink-0" />}
        </div>
      </section>

      {/* Watch and listen */}
      <section className="bg-slate-100/70 py-16 sm:py-32 dark:bg-ink-900/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal><Eyebrow tone="green">Watch and listen</Eyebrow></Reveal>
          <Reveal delay={80}><H2>Biotech, out loud.</H2></Reveal>
          <Reveal delay={160}><Lede>Talks, briefings and podcasts worth your commute. Picked by humans, not algorithms.</Lede></Reveal>
          <div className="mt-8 grid gap-4 sm:mt-12 lg:grid-cols-[1.25fr_1fr]">
            <Reveal className="min-w-0 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7 dark:border-white/[0.07] dark:bg-ink-900">
              <div className="mb-5 flex items-center justify-between"><h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Watch</h3><LinkArrow href="/media">All videos</LinkArrow></div>
              <div className="grid gap-5 sm:grid-cols-2">
                {(videosQ.data ?? []).slice(0, 2).map((v) => (
                  <div key={v.id} className="min-w-0">
                    <VideoEmbed video={v} className="!rounded-2xl" />
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
                    <p className="text-xs text-slate-500">{v.channel}</p>
                  </div>
                ))}
                {!videosQ.data && <SkeletonList count={2} className="aspect-video" />}
              </div>
            </Reveal>
            <Reveal delay={80} className="min-w-0 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7 dark:border-white/[0.07] dark:bg-ink-900">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Listen</h3><LinkArrow href="/podcasts">All shows</LinkArrow></div>
              <div className="-mx-3">
                {(podcastsQ.data ?? []).slice(0, 4).flatMap((p) => p.episodes.slice(0, 1).map((e) => (
                  <div key={e.id}>
                    <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{p.title}</p>
                    <EpisodeRow episode={e} show={p} />
                  </div>
                )))}
                {!podcastsQ.data && <SkeletonList count={3} className="mx-3 my-2 h-14" />}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The Gene Pool */}
      {connectEnabled && (
        <section className="py-16 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <Reveal><Eyebrow>The Gene Pool</Eyebrow></Reveal>
              <Reveal delay={80}><H2>Dive into<br /><span className="text-shimmer">The Gene Pool.</span></H2></Reveal>
              <Reveal delay={160}><Lede>A friendly community for biotech and pharma students. Share what you’re learning, follow people you admire and swap science gossip.</Lede></Reveal>
              <ul className="mt-9 space-y-6">
                {[
                  ['message', 'Posts and conversations', 'Write, comment and like. Clean, calm and about the science.'],
                  ['shield', 'Safe by design', 'For ages 13 and up. Younger members can only message people they follow back.'],
                  ['users', 'Direct messages', 'Chat with friends, with message requests for everyone else.'],
                ].map(([icon, title, text], i) => (
                  <Reveal as="li" key={title} delay={i * 80} className="grid grid-cols-[2.5rem_1fr] gap-4">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${i === 1 ? 'bg-helix-500/10 text-helix-600 dark:text-helix-400' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'}`}><Icon name={icon} className="h-5 w-5" /></span>
                    <div><p className="font-semibold text-slate-900 dark:text-white">{title}</p><p className="text-[15px] text-slate-600 dark:text-slate-400">{text}</p></div>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
                <a href="/connect/join" className="focus-ring bouncy rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700">Dive in free</a>
                <a href="/connect" className="focus-ring rounded-full px-4 py-3 font-medium text-brand-600 hover:underline dark:text-brand-300">Have a look around</a>
              </Reveal>
            </div>
            <Reveal className="phone-tilt">
              <PhoneMockup headline={items[0]?.title} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Finale */}
      <section className="pb-8 pt-16 text-center sm:pt-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal><LogoMark className="teacup-wobble mx-auto h-44 w-44 text-slate-900 dark:text-white" /></Reveal>
          <Reveal delay={80}><H2 className="mt-6 !text-[clamp(40px,7vw,80px)]">Your daily dose of<br /><span className="text-shimmer">science gossip.</span></H2></Reveal>
          <Reveal delay={160}><Lede className="mx-auto">Free, fresh every morning, on every device.</Lede></Reveal>
          <Reveal delay={240} className="mt-8"><a href="/news" className="focus-ring bouncy inline-block rounded-full bg-brand-600 px-7 py-3.5 font-medium text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700">Get today’s tea</a></Reveal>
        </div>
      </section>
    </div>
  );
}

// An iPhone showing The Gene Pool feed, with the floating glass tab bar. Illustrative posts only.
function PhoneMockup({ headline }) {
  const posts = [
    ['Maya R.', '@maya.bio', '2h', 'Finally got clean bands on my first Western blot. Three weeks of troubleshooting and it was the transfer buffer.', 24, true, 'from-brand-500 to-helix-500'],
    ['Arjun S.', '@arjun.genes', '4h', `Today’s tea: ${headline ?? 'a new cancer vaccine round'}. Anyone following this space?`, 11, false, 'from-indigo-500 to-brand-500'],
    ['Lena K.', '@lena.k', '6h', 'Study group for the CRISPR unit this Thursday. Bringing the good snacks.', 38, true, 'from-teal-500 to-helix-500'],
  ];
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[9/19.3] w-[min(320px,82vw)] rounded-[52px] bg-gradient-to-br from-[#2a3446] to-[#0b1220] p-3 shadow-[0_40px_80px_-30px_rgba(11,24,43,0.55),inset_0_0_0_2px_rgba(255,255,255,0.08)]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[41px] bg-white dark:bg-ink-950">
        <div className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <p className="border-b border-slate-200/70 px-[18px] pb-2.5 pt-12 font-display text-[22px] font-semibold tracking-tight text-slate-900 dark:border-white/10 dark:text-white">The Gene Pool</p>
        <div className="flex-1 overflow-hidden px-3.5">
          {posts.map(([name, handle, ago, body, likes, liked, avatar]) => (
            <div key={handle} className="grid grid-cols-[34px_1fr] gap-2.5 border-b border-slate-200/70 py-3.5 text-[12.5px] leading-snug dark:border-white/10">
              <span className={`h-[34px] w-[34px] rounded-full bg-gradient-to-br ${avatar}`} />
              <div>
                <p><b className="text-slate-900 dark:text-white">{name}</b> <span className="text-[11.5px] text-slate-400">{handle} · {ago}</span></p>
                <p className="mt-0.5 line-clamp-3 text-slate-700 dark:text-slate-300">{body}</p>
                <p className="mt-2 flex gap-4 text-[11px] text-slate-400"><span>Reply</span><span className={liked ? 'text-rose-500' : ''}>{liked ? '♥' : '♡'} {likes}</span></p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-[18px] left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-white/60 bg-white/60 p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-800/60">
          {[['homeFilled', true], ['message', false], ['user', false]].map(([icon, on]) => (
            <span key={icon} className={`grid h-[38px] w-[52px] place-items-center rounded-full ${on ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'text-slate-400'}`}><Icon name={icon} className="h-5 w-5" /></span>
          ))}
        </div>
      </div>
    </div>
  );
}
