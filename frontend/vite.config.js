import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
<<<<<<< HEAD
  plugins: [react()]
=======
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
})