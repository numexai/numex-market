/* ============================================================
   NUMEX KAŞE STÜDYO — KÖPRÜ YÜKLEYİCİ (test yardımcısı)
   ------------------------------------------------------------
   public/js/api.js tarayıcı için yazılmıştır; vitest Node
   bağlamında çalıştığı için tarayıcı global'lerini taklit edip
   köprüyü güvenilir biçimde yükler.

   Neden ayrı bir yardımcı?
   - e2e.test.js içinde satır içi taklit yapıldığında beforeAll
     bloğu şişiyor ve hata ayıklaması zorlaşıyordu.
   - Burada TEK bir fonksiyon var: kopruYukle({ port }).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';

/* Tarayıcıda bulunan ama Node'da olmayan en küçük taklit kümesi. */
function sahteTarayici(port) {
  const temel = 'http://127.0.0.1:' + port + '/';
  const sahteYer = {
    protocol: 'http:',
    host: '127.0.0.1:' + port,
    hostname: '127.0.0.1',
    port: String(port),
    href: temel,
    origin: temel.replace(/\/$/, ''),
    toString() { return temel; }
  };

  const belge = {
    createElement: () => ({ click() {}, style: {}, setAttribute() {}, remove() {} }),
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {},
    querySelector: () => null,
    getElementById: () => null
  };

  return {
    location: sahteYer,
    document: belge,
    navigator: { userAgent: 'numex-test' },
    fetch: globalThis.fetch,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    AbortController,
    Blob: class Blob {},
    URL: Object.assign(function URL() {}, {
      createObjectURL() { return 'blob:test'; },
      revokeObjectURL() {}
    }),
    console
  };
}

/**
 * Köprü dosyasını (public/js/api.js) yükler ve global KaseAPI'yi döner.
 * @param {{ kokDizin: string, port: number }} secenek
 */
export function kopruYukle(secenek) {
  const { kokDizin, port } = secenek;
  const modulYolu = path.join(kokDizin, 'public', 'js', 'api.js');
  const kaynak = fs.readFileSync(modulYolu, 'utf8');

  const sahteGlobal = sahteTarayici(port);
  /* api.js "window" ve "globalThis" bekleyebilir; aynı nesneyi veriyoruz. */
  const runner = new Function('window', 'globalThis', 'self', 'document', 'location', 'fetch', kaynak + '\n//# kaynak: api.js');

  runner(sahteGlobal, sahteGlobal, sahteGlobal, sahteGlobal.document, sahteGlobal.location, sahteGlobal.fetch);

  const api = sahteGlobal.KaseAPI || sahteGlobal.window?.KaseAPI;
  if (!api) {
    throw new Error('KaseAPI köprü dosyasında bulunamadı: ' + modulYolu);
  }
  return { api, sahteGlobal };
}

export default kopruYukle;
