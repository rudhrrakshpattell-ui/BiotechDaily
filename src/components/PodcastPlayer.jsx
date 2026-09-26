import Icon from './Icon.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';

const fmt = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// Sticky mini-player shown whenever an episode is loaded.
export default function PodcastPlayer() {
  const player = usePlayer();
  const { episode, playing, time, rate } = player;
  if (!episode) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        {episode.imageUrl ? (
          <img src={episode.imageUrl} alt="" className="hidden h-11 w-11 shrink-0 rounded-xl object-cover sm:block" />
        ) : (
          <div className={`hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white sm:grid ${episode.color || 'from-brand-500 to-helix-500'}`}>
            <Icon name="headphones" className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{episode.title}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{episode.show}</p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => player.skip(-15)} className="focus-ring hidden rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:block dark:hover:bg-white/10 dark:hover:text-white" aria-label="Back 15 seconds">
            <Icon name="back15" className="h-5 w-5" />
          </button>
          <button onClick={() => player.toggle()} className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700" aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} className="h-4 w-4" />
          </button>
          <button onClick={() => player.skip(15)} className="focus-ring hidden rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:block dark:hover:bg-white/10 dark:hover:text-white" aria-label="Forward 15 seconds">
            <Icon name="fwd15" className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <span className="w-10 text-right text-xs tabular-nums text-slate-500">{fmt(time.current)}</span>
          <input
            type="range"
            min={0}
            max={time.duration || 0}
            step={1}
            value={time.current}
            onChange={(e) => player.seek(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer"
            aria-label="Seek"
          />
          <span className="w-10 text-xs tabular-nums text-slate-500">{fmt(time.duration)}</span>
        </div>

        <button onClick={() => player.cycleRate()} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600 hover:border-brand-300 dark:border-white/10 dark:text-slate-300" aria-label="Playback speed">
          {rate}×
        </button>
        <button onClick={() => player.close()} className="focus-ring rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close player">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      {/* thin progress line for small screens */}
      <div className="h-0.5 bg-slate-100 md:hidden dark:bg-white/5">
        <div className="h-full bg-brand-500" style={{ width: `${time.duration ? (time.current / time.duration) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
