import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
        '/perses': {
            target: 'https://prometheus.demo.do.prometheus.io',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/perses/, '')
        },
    },
  },
  build: {
    outDir: 'dist',
  },
  define: {
      global: "window",
  },
});