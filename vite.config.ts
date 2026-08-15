import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const configuredBase = process.env.VITE_BASE ?? '/'
const base =
  configuredBase === '' || configuredBase === '/'
    ? '/'
    : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`

export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'icon-72x72.png',
        'icon-96x96.png',
        'icon-128x128.png',
        'icon-144x144.png',
        'icon-152x152.png',
        'icon-192x192.png',
        'icon-384x384.png',
        'icon-512x512.png',
      ],
      manifest: {
        name: 'Faraway Scorekeeper',
        short_name: 'Faraway Scores',
        description: 'Fast, offline final scoring for Faraway.',
        theme_color: '#112c27',
        background_color: '#f3f0e8',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}icon-72x72.png`,
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-96x96.png`,
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-128x128.png`,
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-144x144.png`,
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-152x152.png`,
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-384x384.png`,
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icon-512x512.png`,
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
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
