import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(), // polyfill ALL node modules — must come before react
    react(),
  ],
  define: {
    // Ensure `global` is always available for libraries that rely on it
    global: 'globalThis',
  },
  optimizeDeps: {
    // Force Vite to pre-bundle privy and its dependencies
    include: ['@privy-io/react-auth'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
