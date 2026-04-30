import { hydrateRoot } from 'react-dom/client';
import App from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './AppRouter';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Grab the theme data injected by the Express server
// @ts-expect-error using a global the server added
const siteSettings = window.__SITE_SETTINGS__;

const root = document.getElementById('root');

const router = createBrowserRouter(
  routes,
  {
    basename: import.meta.env.BASE_URL,
  }
);

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),

  link: new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
    credentials: "include"
  }),
});

if (root !== null) {
  hydrateRoot(
    root,
    <App siteSettings={siteSettings} apolloClient={apolloClient}>
      <RouterProvider router={router} />
    </App>
  );
}

/*
Start: Inserted by Apollo Client 3->4 migration codemod.
Copy the contents of this block into a `.d.ts` file in your project to enable correct response types in your custom links.
If you do not use the `@defer` directive in your application, you can safely remove this block.
*/


import "@apollo/client";
import { Defer20220824Handler } from "@apollo/client/incremental";

declare module "@apollo/client" {
  export interface TypeOverrides extends Defer20220824Handler.TypeOverrides { }
}

/*
End: Inserted by Apollo Client 3->4 migration codemod.
*/


