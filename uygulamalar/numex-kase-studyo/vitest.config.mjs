import { defineConfig } from 'vitest/config';

/* ============================================================
   NUMEX KAŞE STÜDYO — vitest yapılandırması
   ------------------------------------------------------------
   NEDEN BU DOSYA VAR (gerçek bir hatanın çözümü):

   server.test.js ve e2e.test.mjs AYNI Node sürecinde paralel
   çalışıyordu. e2e testleri global fetch'i geçici olarak eziyor
   (sunucu-kapalı senaryosu). Paralel koşumda bu stub diğer
   dosyanın CANLI HTTP isteklerine sızıyor ve şu YANLIŞ hata
   üretiyordu:

     AssertionError: expected false to be true
     server/tests/e2e.test.mjs:120  ← KaseAPI.saglik()

   Oysa sunucu ayaktaydı ve tek başına çalıştırıldığında test
   geçiyordu (kanıt: e2e tek başına 14/14, hep birlikte 46/46).

   Kök çözüm: dosyaları İZOLE süreçlerde, paralel OLMADAN koştur.
   Test sayısı az (46) ve süre ~1,3 sn — izolasyonun maliyeti yok.
   ============================================================ */
export default defineConfig({
  test: {
    dir: 'server/tests',

    /* Her test dosyası kendi sürecinde — global sızıntı imkânsız. */
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        /* Tek süreçte sırayla: dosyalar birbirinin global'ini görmez. */
        singleFork: true
      }
    },

    /* Global durum (fetch stub'ı) testler arası sızmasın. */
    restoreMocks: true,
    unstubGlobals: true,
    clearMocks: true,

    /* Asılı kalan bir test tüm koşumu kilitlemesin. */
    testTimeout: 20000,
    hookTimeout: 20000,

    /* Hata ayıklamayı kolaylaştır: başarısızda tam yığın. */
    reporters: ['default']
  }
});
