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
          if (id.includes('node_modules/viem')) return 'viem';
          if (id.includes('node_modules/@privy-io')) return 'privy';
        },
      },
    },
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
