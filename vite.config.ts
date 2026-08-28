import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Mirrors the /api rewrite in vercel.json so local dev and production
    // resolve the API the same way. Without this, VITE_API_BASE_URL=/api would
    // hit the Vite dev server and 404.
    proxy: {
      '/api': {
        target: 'https://parcelflowapi.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Split the vendor bundle so a code change doesn't invalidate React itself
    // in the user's cache. Vercel serves /assets/* immutable for a year.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
