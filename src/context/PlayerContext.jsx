import { createContext, useContext, useEffect, useRef, useState } from 'react';

// One <audio> element for the whole app, so an episode keeps playing while the user browses.
const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [episode, setEpisode] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !episode) return;
    a.src = episode.audioUrl;
    a.playbackRate = rate;
    a.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode]);

  const value = {
    episode,
    playing,
    time,
    rate,
    play(ep) {
      if (episode?.id === ep.id) return this.toggle();
      setEpisode(ep);
    },
    toggle() {
      const a = audioRef.current;
      if (!a || !episode) return;
      a.paused ? a.play() : a.pause();
    },
    seek(seconds) {
      const a = audioRef.current;
      if (a) a.currentTime = Math.max(0, Math.min(seconds, a.duration || seconds));
    },
    skip(delta) {
      const a = audioRef.current;
      if (a) this.seek(a.currentTime + delta);
    },
    cycleRate() {
      const next = { 1: 1.25, 1.25: 1.5, 1.5: 2, 2: 1 }[rate] ?? 1;
      setRate(next);
      if (audioRef.current) audioRef.current.playbackRate = next;
    },
    close() {
      audioRef.current?.pause();
      setEpisode(null);
    },
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime({ current: e.currentTarget.currentTime, duration: e.currentTarget.duration || 0 })}
        onLoadedMetadata={(e) => setTime({ current: 0, duration: e.currentTarget.duration || 0 })}
      />
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
