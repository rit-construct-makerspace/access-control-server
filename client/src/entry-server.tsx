import { renderToPipeableStream, renderToString } from 'react-dom/server';
import App from './App';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom"
import { routes } from './AppRouter';
import express from "express";
import { SiteSettings } from './types/site_settings/SiteSettings';
import { Transform } from 'node:stream';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

function createFetchRequest(req: express.Request): Request {
  const origin = `${req.protocol}://${req.get("host")}`;
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();
  req.on("close", () => controller.abort());

  const headers = new Headers();
  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) headers.append(key, value);
      } else {
        headers.set(key, values);
      }
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body as any;
  }

  return new Request(url.href, init);
}

// The server calls this function to get the HTML string
export async function render(req: express.Request, res: express.Response, siteSettings: SiteSettings, head: string, tail: string) {
  const fetchRequest = createFetchRequest(req);

  const { query, dataRoutes } = createStaticHandler(routes, {
    basename: import.meta.env.BASE_URL || "/app",
  });

  const context = await query(fetchRequest);

  if (context instanceof Response) {
    return res.redirect(context.status, context.headers.get("Location") || "/app");
  }

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),

    link: new HttpLink({
      uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
      credentials: "include"
    }),
  });

  const router = createStaticRouter(dataRoutes, context);

  let didError = false;

  const { pipe } = renderToPipeableStream(
    <App siteSettings={siteSettings} apolloClient={apolloClient}>
      <StaticRouterProvider router={router} context={context} />
    </App>,
    {
      onShellReady() {
        // The shell is ready to be sent to the browser
        res.status(didError ? 500 : 200).set({ 'Content-Type': 'text/html' });

        // 1. Write the top half of the Vite HTML template
        res.write(head);

        // 2. Create a transform stream to pipe React chunks to the Express response
        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            res.write(chunk, encoding);
            callback();
          }
        });

        // 3. When React finishes streaming, append the bottom half of the template and close
        transformStream.on('finish', () => {
          res.end(tail);
        });

        // 4. Start the pipe
        pipe(transformStream);
      },

      onShellError(error) {
        // Something went wrong rendering the initial shell
        console.error("Shell error:", error);
        res.status(500).set({ 'Content-Type': 'text/html' }).end("<h1>Internal Server Error</h1>");
      },

      onError(error) {
        // Catch errors that happen inside Suspense boundaries while streaming
        didError = true;
        console.error("Streaming error:", error);
      }
    }
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
