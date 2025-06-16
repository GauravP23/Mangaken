import { defineConfig } from 'vite'
// Remove @tailwindcss/vite, use standard Vite config for Tailwind
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5001', // Proxy API requests to backend on port 5001
    },
  },
  plugins: [],
})
