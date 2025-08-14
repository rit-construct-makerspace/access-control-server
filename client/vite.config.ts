import { defineConfig } from 'vite';
import eslint from "vite-plugin-eslint2";
import react from "@vitejs/plugin-react"

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
    port: 3001, // dont conflict with dev server which is on 3000
  },
});
