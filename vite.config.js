import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // BASE_URL is set by CI workflows; defaults to '/' for local dev
  base: process.env.BASE_URL || '/',
});
