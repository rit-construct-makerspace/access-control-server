import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [
    react(),
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
    allowedHosts: ['http://localhost:3000/', 'http://localhost:3001/'],
    headers: {
      "access-control-allow-origin": "http://localhost:3000/"
    }
  },
});
