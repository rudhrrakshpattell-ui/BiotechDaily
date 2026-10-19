import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App, { preloadPage } from './App.jsx';
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import './index.css';

// Visitor counts (Vercel Web Analytics: no cookies, no cross-site tracking). Member names and chat partners
// in Connect URLs are blanked out before anything is sent.
function redact(event) {
  const url = new URL(event.url);
  url.pathname = url.pathname
    .replace(/^\/connect\/u\/[^/]+/, '/connect/u/[member]')
    .replace(/^\/connect\/messages\/[^/]+/, '/connect/messages/[chat]');
  return { ...event, url: url.toString() };
}

// Fetch the current page's code first so the initial render is complete (no loading placeholder).
// Old "#/path" links are redirected by the router, so check the hash path too.
const initialPath = window.location.hash.startsWith('#/') ? window.location.hash.slice(1).split('?')[0] : window.location.pathname;

preloadPage(initialPath).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      <Analytics beforeSend={redact} />
    </StrictMode>,
  );
});
