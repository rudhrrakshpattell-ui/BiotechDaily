import { useEffect, useState } from 'react';

// Minimal History-API router: "/companies/amgen?tab=x" -> { path: '/companies/amgen', segments: ['companies', 'amgen'], query: { tab: 'x' } }.
// Plain <a href="/news"> links are intercepted below, so components don't need a <Link> component.
// Production serves every page path through api/page.js (see vercel.json); Vite's dev server does the same fallback.

const EVENT = 'bd:navigate';

function parse() {
  const { pathname, search } = window.location;
  return {
    path: pathname || '/',
    segments: pathname.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(search)),
  };
}

export function navigate(to, { replace = false } = {}) {
  const current = window.location.pathname + window.location.search;
  if (to === current) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new Event(EVENT));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Same-origin, left-click, no modifier keys, no target: handle in-app instead of reloading the page.
function onLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || a.target || a.hasAttribute('download') || a.origin !== window.location.origin) return;
  if (a.pathname.startsWith('/api/')) return;
  e.preventDefault();
  navigate(a.pathname + a.search);
}

export function useRoute() {
  const [route, setRoute] = useState(() => {
    // Old links used hash routing ("/#/companies/vertex"); move them to the real path.
    if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.hash.slice(1));
    return parse();
  });

  useEffect(() => {
    const update = () => setRoute(parse());
    window.addEventListener(EVENT, update);
    window.addEventListener('popstate', update);
    document.addEventListener('click', onLinkClick);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener('popstate', update);
      document.removeEventListener('click', onLinkClick);
    };
  }, []);

  return route;
}
