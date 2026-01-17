import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), solid()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['lucide-solid'],
  },
});
