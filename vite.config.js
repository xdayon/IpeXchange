import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — smallest possible initial chunk
          'vendor-react': ['react', 'react-dom'],
          // Leaflet map library — only loaded when map is shown
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // Icon library — shared across all pages
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
