import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api-auth': {
        target: 'https://test-app.febtw.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-auth/, ''),
      },
    },
  },
})
