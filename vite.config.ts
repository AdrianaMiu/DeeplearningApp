import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/DeeplearningApp/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      scope: '/DeeplearningApp/',
      base: '/DeeplearningApp/',
      includeAssets: ['icons/companion-icon.svg', 'labs/linear-regression-pytorch.ipynb'],
      manifest: {
        name: 'Deep Learning Companion',
        short_name: 'DL Companion',
        description: 'A private, evidence-based companion for learning deep learning.',
        theme_color: '#f1f3ea',
        background_color: '#f1f3ea',
        display: 'standalone',
        start_url: '/DeeplearningApp/#/',
        scope: '/DeeplearningApp/',
        icons: [
          { src: 'icons/companion-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,ipynb}'],
        navigateFallback: '/DeeplearningApp/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
});
