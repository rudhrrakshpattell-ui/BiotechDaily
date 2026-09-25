import { useState } from 'react';
import Icon from './Icon.jsx';

// Click-to-load YouTube embed: shows the thumbnail first so the page doesn't load several heavy iframes up front.
export default function VideoEmbed({ video, autoLoad = false, className = '' }) {
  const [active, setActive] = useState(autoLoad);
  const thumb = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-ink-900 ${className}`}>
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setActive(true)} className="focus-ring group absolute inset-0 h-full w-full" aria-label={`Play video: ${video.title}`}>
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-700 shadow-xl transition group-hover:scale-110">
            <Icon name="play" className="ml-0.5 h-5 w-5" />
          </span>
        </button>
      )}
    </div>
  );
}
