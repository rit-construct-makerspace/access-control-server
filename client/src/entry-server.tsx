import { renderToString } from 'react-dom/server';
import App from './App';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom"
import { routes } from './AppRouter';
import express from "express";

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
export async function render(req: express.Request, siteSettings: any) {
  const fetchRequest = createFetchRequest(req);

  const { query, dataRoutes } = createStaticHandler(routes, {
    basename: import.meta.env.BASE_URL || "/app",
  });

  const context = await query(fetchRequest);

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(dataRoutes, context);


  const html = renderToString(
    <App siteSettings={siteSettings}>
      <StaticRouterProvider router={router} context={context} />
    </App>
  );
  return { html };
}