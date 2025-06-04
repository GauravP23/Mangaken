import { defineConfig } from 'vite'
// Remove @tailwindcss/vite, use standard Vite config for Tailwind
export default defineConfig({
  // No need for tailwindcss() in plugins, Tailwind is handled via postcss config
  plugins: [],
})
