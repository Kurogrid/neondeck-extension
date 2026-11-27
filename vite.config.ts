import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: './',
  plugins: [preact()],
  build: {
    target: 'es2022', outDir: 'dist', emptyOutDir: true, modulePreload: { polyfill: false },
    // Two pages: the new tab and the setup guide opened on first install.
    rollupOptions: { input: { index: 'index.html', welcome: 'welcome.html' } },
  },
});
