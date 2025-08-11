import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from "vite-plugin-eslint2";


export default defineConfig({
  plugins: [
    react(),
    eslint({
      dev: true,
      
      build: true, // lint on build
      cache: true, // cache lints
      emitWarning: true,
      emitError: true,
      // Don't fail build on errors (bc the entire build would fail rn)
      // if its 2026 and this is still here you should feel bad
      emitErrorAsWarning: true, 
      
    }),
  ],
  base: "/app/",
  
  build: {
    outDir: 'build',
  },
  server: {
    port: 3001, // dont conflict with dev server
    // allowedHosts: ['http://localhost:3000']
    // cors: {
      // origin: 'http://localhost:3000',
      // preflightContinue: true
    // },
    // allowedHosts: ['http://localhost:3000/', 'http://localhost:3001/'],
    // headers: {
      // "access-control-allow-origin": "http://localhost:3000/"
    // }
  },
});
