import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:demo` produces one self-contained HTML file (dist-demo/index.html)
// that runs on mock data, handy for sharing the demo without a server.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  build: mode === 'demo' ? { outDir: 'dist-demo' } : undefined,
  server: {
    host: true,
    port: 5173,
  },
}));
