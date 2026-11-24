import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, /api se manda al backend (FastAPI en el puerto 8000).
// Así el navegador ve un solo origen y la cookie de sesión funciona sin configurar CORS.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: BACKEND, changeOrigin: true } },
  },
  preview: {
    proxy: { '/api': { target: BACKEND, changeOrigin: true } },
  },
});
