import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base = nombre del repo, para que los assets funcionen en GitHub Pages
export default defineConfig({
  base: '/weather-app/',
  plugins: [react()],
  build: {
    // Three.js solo ocupa ~600 kB minificado y casi no se puede reducir con tree-shaking
    chunkSizeWarningLimit: 800,
  },
});
