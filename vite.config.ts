import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — удобно для GitHub Pages / любого подпути
export default defineConfig({
  plugins: [react()],
  base: './',
})
