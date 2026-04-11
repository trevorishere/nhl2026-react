import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // BASE_URL is set by CI workflows; defaults to '/' for local dev
  base: process.env.BASE_URL || '/',
  server: {
    // In dev (npm run dev), proxy NHL API requests to avoid CORS issues.
    // Built/deployed files use corsproxy.io instead (see usePlayerDetail.js).
    proxy: {
      '/nhl-api': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nhl-api/, ''),
      },
    },
  },
});
