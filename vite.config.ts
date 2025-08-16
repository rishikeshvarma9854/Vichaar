import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    open: true,
    host: true, // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '37469ec24301.ngrok-free.app', // Your ngrok URL
      '.ngrok-free.app', // Allow all ngrok URLs
      '.ngrok.io', // Allow all ngrok.io URLs
    ],
    proxy: {
      // Proxy to make localhost appear as a real domain
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Optional: Proxy to a fake domain for hCaptcha
      '/hcaptcha-bypass': {
        target: 'https://kmit-vichaar-dev.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hcaptcha-bypass/, ''),
      }
    },
    // Custom headers to trick hCaptcha
    headers: {
      'X-Forwarded-Host': 'kmit-vichaar-dev.vercel.app',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-For': '127.0.0.1',
    }
  },
})
