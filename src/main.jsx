import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { preloadPage } from './App.jsx';
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import './index.css';

// Fetch the current page's code first so the initial render is complete (no loading placeholder).
// Old "#/path" links are redirected by the router, so check the hash path too.
const initialPath = window.location.hash.startsWith('#/') ? window.location.hash.slice(1).split('?')[0] : window.location.pathname;

preloadPage(initialPath).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
