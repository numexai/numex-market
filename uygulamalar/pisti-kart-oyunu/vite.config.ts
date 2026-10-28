import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5178,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    reporters: 'default',
  },
});
