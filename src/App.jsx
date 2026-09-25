import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import PodcastPlayer from './components/PodcastPlayer.jsx';
import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import { useRoute } from './hooks/useRoute.js';
import { useTheme } from './hooks/useTheme.js';
import Home from './pages/Home.jsx';
import News from './pages/News.jsx';
import Companies from './pages/Companies.jsx';
import CompanyDetail from './pages/CompanyDetail.jsx';
import Startups from './pages/Startups.jsx';
import Media from './pages/Media.jsx';
import Podcasts from './pages/Podcasts.jsx';

function Page({ route }) {
  const [section, id] = route.segments;
  switch (section) {
    case undefined: return <Home />;
    case 'news': return <News query={route.query} />;
    case 'companies': return id ? <CompanyDetail id={id} /> : <Companies />;
    case 'startups': return <Startups query={route.query} />;
    case 'media': return <Media query={route.query} />;
    case 'podcasts': return <Podcasts />;
    default:
      return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
          <a href="#/" className="mt-6 inline-block font-semibold text-brand-600">Back to today’s brief</a>
        </div>
      );
  }
}

function Shell() {
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const { episode } = usePlayer();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`flex min-h-screen flex-col ${episode ? 'pb-20' : ''}`}>
      <Header path={route.path} theme={theme} onToggleTheme={toggle} onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">
        <Page route={route} />
      </main>
      <Footer />
      <PodcastPlayer />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <Shell />
    </PlayerProvider>
  );
}
