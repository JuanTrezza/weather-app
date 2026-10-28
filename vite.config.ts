import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/weather-app/';
const UN_DIA = 24 * 60 * 60;

// base = nombre del repo, para que los assets funcionen en GitHub Pages
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // La app pregunta antes de actualizar (toast "Hay una versión nueva")
      registerType: 'prompt',
      strategies: 'generateSW',
      // El registro lo hace useRegisterSW (virtual:pwa-register/react)
      injectRegister: false,
      // Los íconos y el manifest ya entran por globPatterns: así no se duplican en el precache
      includeManifestIcons: false,
      manifest: {
        id: BASE,
        name: 'WeatherWorld — Clima Global',
        short_name: 'WeatherWorld',
        description: 'Explorá el clima de cualquier lugar del planeta: pronóstico de 5 días, próximas 24 horas y un globo 3D interactivo.',
        lang: 'es-AR',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        // Fondo espacial de la pantalla de inicio
        theme_color: '#030614',
        background_color: '#030614',
        categories: ['weather', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Shell de la app: HTML, JS, CSS, íconos, fuentes locales y texturas del globo
        globPatterns: ['**/*.{html,js,css,svg,png,ico,webp,jpg,woff2}'],
        // El archivo más grande (Three.js) pesa ~530 kB; el límite por defecto (2 MB) alcanza, pero lo dejamos explícito
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        // Las fuentes son locales (woff2 en el precache): no hace falta cachear Google Fonts
        runtimeCaching: [
          {
            // Clima y pronóstico del Worker: la red primero; sin conexión (o si tarda más de 5 s), la última respuesta
            urlPattern: ({ url }) => /\/api\/(weather|forecast)$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-clima',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Autocompletado: respuesta inmediata desde la caché y se refresca en segundo plano
            urlPattern: ({ url }) => url.pathname.endsWith('/api/geocode'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-geocode',
              expiration: { maxEntries: 50, maxAgeSeconds: UN_DIA },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Three.js (~520 kB, casi no se reduce con tree-shaking) va en su propio chunk: se carga con import()
    // después de la primera pintura y, como cambia poco, una versión nueva de la app no obliga a volver a bajarlo
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }],
        },
      },
    },
  },
});
