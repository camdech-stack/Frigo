import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base = sous-chemin de GitHub Pages (https://<pseudo>.github.io/Frigo/)
const base = '/Frigo/'

export default defineConfig({
  base,
  // Les fichiers *.node.test.js sont exécutés par node:test (npm test), pas par vitest.
  test: { exclude: ['node_modules/**', '**/*.node.test.js'] },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' : la nouvelle version attend ; src/pwa.js l'active quand aucune saisie n'est en cours
      // (un « autoUpdate » brut rechargerait la page n'importe quand).
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Frigo',
        short_name: 'Frigo',
        description: 'Inventaire du frigo et dates de péremption',
        lang: 'fr',
        display: 'standalone',
        start_url: base,
        scope: base,
        theme_color: '#FFF4E6',
        background_color: '#FFF4E6',
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Seul le « shell » de l'app (HTML, JS, CSS, icônes) est précaché. Aucune règle runtimeCaching :
        // les appels à Supabase et à Open Food Facts ne passent jamais par le cache.
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,woff2}'], // woff2 : Nunito disponible hors ligne
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
