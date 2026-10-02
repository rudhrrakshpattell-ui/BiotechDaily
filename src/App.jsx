import { Suspense, lazy, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import PodcastPlayer from './components/PodcastPlayer.jsx';
import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import { useRoute } from './hooks/useRoute.js';
import { useTheme } from './hooks/useTheme.js';
import Home from './pages/Home.jsx';
// Home ships in the main bundle; other pages are code-split. Once a page's module has loaded (e.g. via
// preloadPage before the first render), it renders directly instead of suspending, so there's no
// placeholder flash and no layout shift on a direct visit.
function lazyPage(loader) {
  let Loaded = null;
  const load = () => loader().then((m) => (Loaded = m.default));
  const Lazy = lazy(() => loader());
  const Page = (props) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  Page.preload = load;
  return Page;
}

const News = lazyPage(() => import('./pages/News.jsx'));
const Companies = lazyPage(() => import('./pages/Companies.jsx'));
const CompanyDetail = lazyPage(() => import('./pages/CompanyDetail.jsx'));
const Startups = lazyPage(() => import('./pages/Startups.jsx'));
const Media = lazyPage(() => import('./pages/Media.jsx'));
const Podcasts = lazyPage(() => import('./pages/Podcasts.jsx'));
const Connect = lazyPage(() => import('./connect/ConnectApp.jsx'));

// Loads the code for the page at `pathname` (no-op for Home and unknown paths).
export function preloadPage(pathname) {
  const [section, id] = pathname.split('/').filter(Boolean);
  const page = { news: News, companies: id ? CompanyDetail : Companies, startups: Startups, media: Media, podcasts: Podcasts, connect: Connect }[section];
  return page ? page.preload().catch(() => {}) : Promise.resolve();
}
import { metaFor } from './seo.js';

function Page({ route }) {
  const [section, id] = route.segments;
  switch (section) {
    case undefined: return <Home />;
    case 'news': return <News query={route.query} />;
    case 'companies': return id ? <CompanyDetail id={id} /> : <Companies />;
    case 'startups': return <Startups query={route.query} />;
    case 'media': return <Media query={route.query} />;
    case 'podcasts': return <Podcasts />;
    case 'connect': return <Connect route={route} />;
    default:
      return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
          <a href="/" className="mt-6 inline-block font-semibold text-brand-600">Back to today’s brief</a>
        </div>
      );
  }
}

function Shell() {
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const { episode } = usePlayer();

  // Keep the tab title and description in step with in-app navigation (the server sets them on first load).
  useEffect(() => {
    const meta = metaFor(route.path, route.query);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [route.path, route.query.category, route.query.trend]);

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
    <div className="flex min-h-screen flex-col" style={{ paddingBottom: episode ? 'calc(5rem + var(--tabbar-h))' : 'var(--tabbar-h)' }}>
      <Header path={route.path} theme={theme} onToggleTheme={toggle} onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">
        {/* min-h-screen keeps the footer below the fold while a page's code loads, so it doesn't jump. */}
        <Suspense fallback={<div className="mx-auto min-h-screen max-w-7xl space-y-4 px-4 py-12 sm:px-6"><div className="skeleton h-10 w-72" /><div className="skeleton h-64" /></div>}>
          <Page route={route} />
        </Suspense>
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
