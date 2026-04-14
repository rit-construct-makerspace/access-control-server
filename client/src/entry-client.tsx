import { hydrateRoot } from 'react-dom/client';
import App from './App';

// Grab the theme data injected by the Express server
// @ts-expect-error using a global the server added
const siteSettings = window.__SITE_SETTINGS__;

const root = document.getElementById('root');

if (root !== null) {
  hydrateRoot(
    root,
    <App siteSettings={siteSettings} />
  );
}

