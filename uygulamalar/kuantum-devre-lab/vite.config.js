import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Ürün ölçeği kuralı: sayfa public/ altında durur (public/index.html),
 * kaynak ağacı (src/) kökte kalır. Vite'ın varsayılanı kökte index.html
 * aradığı için `root` public/ olarak verilir ve `/src/*` istekleri
 * alias ile gerçek kök src/ ağacına yönlendirilir — böylece kökte
 * yasak olan index.html oluşturmaya gerek kalmaz.
 *
 * Birleştirme fileURLToPath ile yapılır (Windows sürücü harfi/dizin ayracı
 * güvenliği), böylece yol ayracı farklılıklarından kaynaklanan 404 oluşmaz.
 */
const srcDir = fileURLToPath(new URL('./src/', import.meta.url));
const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const publicHtml = fileURLToPath(new URL('./public/index.html', import.meta.url));

export default defineConfig({
  root: 'public',
  publicDir: false,
  resolve: {
    alias: [
      // /src/... -> <proje kökü>/src/...   (public/ içindeki SPA girişi)
      { find: /^\/src\//, replacement: srcDir },
    ],
  },
  server: {
    port: 4180,
    strictPort: false,
    open: false,
    fs: {
      // root public/ olduğu için kök src/ ağacına okuma izni verilir.
      allow: [projectRoot],
    },
  },
  preview: {
    port: 4181,
  },
  build: {
    // Kaynak ağacı kökte; çıktı da kökte dist/ altına yazılır.
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: publicHtml,
    },
  },
  // Vitest çağrıldığında vite `root`'u public/ yapar ve testleri kaybeder;
  // bu yüzden testlerin kendi kökü/taraması açıkça proje köküne sabitlenir.
  test: {
    root: projectRoot,
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
