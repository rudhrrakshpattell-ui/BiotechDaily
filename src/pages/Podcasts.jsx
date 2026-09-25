import Icon from '../components/Icon.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import { PageHeader, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function Podcasts() {
  const { data } = useAsync(() => api.getPodcasts(), []);
  const player = usePlayer();

  return (
    <>
      <PageHeader eyebrow="Podcasts" title="Biotech in your ears" description="Pick an episode. It keeps playing in the bar at the bottom while you browse the rest of the site." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6">
        {!data && <SkeletonList count={3} className="h-56" />}
        {data?.map((show) => (
          <section key={show.id} className="card grid overflow-hidden md:grid-cols-[16rem_1fr]">
            <div className={`relative flex flex-col justify-between gap-6 bg-gradient-to-br p-6 text-white ${show.color}`}>
              <svg viewBox="0 0 100 100" className="absolute -bottom-6 -right-6 h-40 w-40 opacity-20" aria-hidden="true">
                {[20, 32, 44].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="white" strokeWidth="2" />)}
              </svg>
              <Icon name="mic" className="h-8 w-8" />
              <div className="relative">
                <h2 className="font-display text-2xl font-semibold leading-tight">{show.title}</h2>
                <p className="mt-1 text-sm text-white/80">with {show.host}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">{show.description}</p>
                <button
                  onClick={() => player.play({ ...show.episodes[0], show: show.title, color: show.color })}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Icon name="play" className="h-3.5 w-3.5" /> Latest episode
                </button>
              </div>
              <div className="-mx-3 space-y-0.5">
                {show.episodes.map((e) => <EpisodeRow key={e.id} episode={e} show={show} />)}
              </div>
            </div>
          </section>
        ))}
        <p className="text-xs text-slate-400">Shows are samples; audio uses royalty-free demo tracks. Point <code className="rounded bg-slate-100 px-1 dark:bg-white/5">GET /podcasts</code> at real RSS feeds to go live.</p>
      </div>
    </>
  );
}
