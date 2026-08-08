import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/tasks': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/ingest': 'http://localhost:8000'
    }
  }
})
