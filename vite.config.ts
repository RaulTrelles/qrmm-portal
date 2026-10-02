import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'https://qrmm-backend.qhapana.com',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: process.env.VITE_WS_TARGET || 'https://qrmm-backend.qhapana.com',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
