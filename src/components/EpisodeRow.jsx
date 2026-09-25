import Icon from './Icon.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { formatDate } from '../services/format.js';

export default function EpisodeRow({ episode, show }) {
  const player = usePlayer();
  const isCurrent = player.episode?.id === episode.id;
  const isPlaying = isCurrent && player.playing;

  return (
    <div className={`flex items-center gap-4 rounded-xl p-3 transition ${isCurrent ? 'bg-brand-50 dark:bg-brand-400/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}>
      <button
        onClick={() => player.play({ ...episode, show: show.title, color: show.color })}
        className={`focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isCurrent ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white dark:bg-white/10 dark:text-slate-200'}`}
        aria-label={isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} className={`h-4 w-4 ${isPlaying ? '' : 'ml-0.5'}`} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
        <p className="text-xs text-slate-500">{formatDate(episode.date, { month: 'short', day: 'numeric' })} · {episode.duration}</p>
      </div>
      {isPlaying && (
        <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1 animate-pulse rounded-full bg-brand-500" style={{ height: `${[60, 100, 40][i]}%`, animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      )}
    </div>
  );
}
