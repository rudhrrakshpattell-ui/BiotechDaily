import { useEffect, useState } from 'react';

// Minimal hash router: "#/companies/amgen?tab=x" -> { path: '/companies/amgen', segments: ['companies', 'amgen'], query: { tab: 'x' } }.
// Hash routing works on any static host with no server config. Swap for react-router if you need more.
function parse() {
  const [path, qs = ''] = (window.location.hash.replace(/^#/, '') || '/').split('?');
  return { path: path || '/', segments: path.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = (to) => { window.location.hash = to; };
