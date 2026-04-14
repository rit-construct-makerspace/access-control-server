import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

// The server calls this function to get the HTML string
export function render(url: string, siteSettings: any) {
  const html = renderToString(
    <App siteSettings={siteSettings} />
  );
  return { html };
}