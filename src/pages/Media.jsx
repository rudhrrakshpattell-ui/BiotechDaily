import { useEffect, useMemo, useState } from 'react';
import VideoEmbed from '../components/VideoEmbed.jsx';
import NewsCard from '../components/NewsCard.jsx';
import { Chips, LinkArrow, PageHeader, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { NEWS_CATEGORIES } from '../data/categories.js';
import { formatNumber, timeAgo } from '../services/format.js';

const videoMeta = (v) => [v.channel, v.date && timeAgo(v.date), v.views != null && `${formatNumber(v.views)} views`].filter(Boolean).join(' · ');

export default function Media({ query }) {
  const [topic, setTopic] = useState('all');
  const [currentId, setCurrentId] = useState(query.v ?? null);
  // Load every video once and filter locally, so the topic chips can reflect what's actually available.
  const videos = useAsync(() => api.getVideos({}), []);
  const headlines = useAsync(() => api.getNews({ pageSize: 6 }), []);

  useEffect(() => { if (query.v) setCurrentId(query.v); }, [query.v]);

  const all = videos.data ?? [];
  const topics = useMemo(
    () => [{ id: 'all', label: 'All videos' }, ...NEWS_CATEGORIES.filter((c) => all.some((v) => v.category === c.id))],
    [all],
  );
  const list = topic === 'all' ? all : all.filter((v) => v.category === topic);
  const current = all.find((v) => v.id === currentId) ?? all.find((v) => v.featured) ?? all[0];

  return (
    <>
      <PageHeader eyebrow="Video & news" title="Watch and catch up" description="The latest uploads from STAT, Endpoints News, the Broad Institute, Nature, Science and more, next to today’s top stories." />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          {current ? (
            <div>
              <VideoEmbed key={current.id} video={current} autoLoad={Boolean(currentId)} className="shadow-xl shadow-brand-900/10" />
              <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">{current.title}</h2>
              <p className="text-sm text-slate-500">{videoMeta(current)}</p>
              {current.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{current.description}</p>}
            </div>
          ) : (
            <div className="skeleton aspect-video" />
          )}

          <div className="mb-4 mt-10">
            <Chips label="Video topic" options={topics} value={topic} onChange={setTopic} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {videos.data
              ? list.map((v) => (
                  <button key={v.id} onClick={() => { setCurrentId(v.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`focus-ring group rounded-xl text-left ${v.id === current?.id ? 'ring-2 ring-brand-500 ring-offset-4 ring-offset-slate-50 dark:ring-offset-ink-950' : ''}`}>
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-900">
                      <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">{v.title}</p>
                    <p className="text-xs text-slate-500">{videoMeta(v)}</p>
                  </button>
                ))
              : <SkeletonList count={3} className="aspect-video" />}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card px-5 py-4">
            <div className="flex items-center justify-between pt-1">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Latest headlines</h2>
              <LinkArrow href="/news">Feed</LinkArrow>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {headlines.data ? headlines.data.items.map((n) => <NewsCard key={n.id} item={n} variant="compact" />) : <SkeletonList count={5} className="my-3 h-14" />}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
