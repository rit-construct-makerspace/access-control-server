import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from "vite-plugin-eslint2";


export default defineConfig({
  plugins: [
    react(),
    eslint({
      dev: true,
      
      // Optional: Configure ESLint options here
      // For example, to enable caching for faster builds:
      build: true,
      cache: true,
      emitWarning: true,
      emitError: true,
      emitErrorAsWarning: true,
      // To show ESLint warnings as build errors:
      // failOnWarning: false, // Set to true to fail build on warnings
      // failOnError: true,
      
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
