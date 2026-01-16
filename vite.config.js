import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    exclude: ['lucide-solid'],
  },
});
