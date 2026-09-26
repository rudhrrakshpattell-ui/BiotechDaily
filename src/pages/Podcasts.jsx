import Icon from '../components/Icon.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import { ErrorState, PageHeader, SkeletonList } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { usePlayer } from '../context/PlayerContext.jsx';

function ShowArt({ show }) {
  if (show.imageUrl) {
    return (
      <div className="relative bg-slate-100 dark:bg-ink-800">
        <img src={show.imageUrl} alt={`${show.title} cover art`} loading="lazy" className="aspect-square w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative flex aspect-square flex-col justify-between bg-gradient-to-br p-6 text-white md:aspect-auto ${show.color}`}>
      <Icon name="mic" className="h-8 w-8" />
      <p className="font-display text-2xl font-semibold leading-tight">{show.title}</p>
    </div>
  );
}

export default function Podcasts() {
  const { data, error, reload } = useAsync(() => api.getPodcasts(), []);
  const player = usePlayer();

  return (
    <>
      <PageHeader eyebrow="Podcasts" title="Biotech in your ears" description="New episodes from the best biotech shows. Pick one and it keeps playing in the bar at the bottom while you browse." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6">
        {error && <ErrorState error={error} onRetry={reload} />}
        {!data && !error && <SkeletonList count={3} className="h-56" />}
        {data?.map((show) => (
          <section key={show.id} className="card grid overflow-hidden md:grid-cols-[14rem_1fr]">
            <ShowArt show={show} />
            <div className="min-w-0 p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-xl">
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{show.title}</h2>
                  <p className="text-xs font-medium text-slate-500">with {show.host}</p>
                  {show.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{show.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {show.url && (
                    <a href={show.url} target="_blank" rel="noopener noreferrer" className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10" aria-label={`${show.title} website`}>
                      <Icon name="arrowUpRight" className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => player.play({ ...show.episodes[0], show: show.title, color: show.color, imageUrl: show.episodes[0].imageUrl ?? show.imageUrl })}
                    className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <Icon name="play" className="h-3.5 w-3.5" /> Latest episode
                  </button>
                </div>
              </div>
              <div className="-mx-3 space-y-0.5">
                {show.episodes.map((e) => <EpisodeRow key={e.id} episode={e} show={show} />)}
              </div>
            </div>
          </section>
        ))}
        <p className="text-xs text-slate-400">Episodes stream from each show’s public feed. BiotechDaily isn’t affiliated with these podcasts.</p>
      </div>
    </>
  );
}
