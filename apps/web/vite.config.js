import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react(),
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these as CJS so they don't create circular ESM deps
    include: [
      '@privy-io/react-auth',
      'viem',
      'viem/utils',
      'viem/chains',
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rolldownOptions: {
      output: {
        // Prevent viem from being split into multiple async chunks
        // which causes circular initialization issues
        manualChunks: (id) => {
          if (/preload-helper|node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/vite-plugin-node-polyfills|node_modules\/(buffer|process|ieee754|base64-js)\//.test(id)) return 'polyfills';
          if (id.includes('node_modules/viem')) return 'viem';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
})
