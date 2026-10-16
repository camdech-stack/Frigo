import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = sous-chemin de GitHub Pages (https://<pseudo>.github.io/Frigo/)
export default defineConfig({
  plugins: [react()],
  base: '/Frigo/',
})
