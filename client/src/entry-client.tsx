import { hydrateRoot } from 'react-dom/client';
import App from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './AppRouter';

// Grab the theme data injected by the Express server
// @ts-expect-error using a global the server added
const siteSettings = window.__SITE_SETTINGS__;

const root = document.getElementById('root');

const router = createBrowserRouter(
  routes,
  {
    basename: import.meta.env.BASE_URL,
  }
)

if (root !== null) {
  hydrateRoot(
    root,
    <App siteSettings={siteSettings}>
      <RouterProvider router={router} />
    </App>
  );
}

