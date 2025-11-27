import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://dashboard.tros.com.au',
        changeOrigin: true,
        ws: true,
      },
      '/socket.io': {
        target: 'http://dashboard.tros.com.au',
        changeOrigin: true,
        ws: true,
      }
    },
  },
});

