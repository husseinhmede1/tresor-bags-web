import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Module workers (the admin's photo cleaner) can load their own chunks and WebAssembly.
  worker: { format: 'es' },
})
