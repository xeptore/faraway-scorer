import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Faraway Scorekeeper',
        short_name: 'Faraway Scores',
        description: 'Fast, offline final scoring for Faraway.',
        theme_color: '#112c27',
        background_color: '#f3f0e8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      },
      devOptions: { enabled: true }
    })
  ],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'https://faraway.local/' }
    },
    include: ['src/**/*.test.ts']
  }
})
