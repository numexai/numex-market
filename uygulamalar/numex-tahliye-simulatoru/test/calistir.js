// NUMEX AFET — Node üzerinde test koşucusu (node test/calistir.js)
// NOT: 12. test gerçek tarayıcı etkileşimi ölçer (DOM gerekir). Node'da bu test
// "atlandı" sayılır; başarısız sayılıp çıkış kodunu kırmızıya çekmez.
// Tarayıcı kanıtı için: test/test.html (index.html'i iframe'e alıp 12'yi canlı koşar).
import { tumTestleriCalistir } from './test.js';

const r = tumTestleriCalistir();
const atlanan = r.sonuclar.filter(s => s.atlandi);
const gecerliBasarisiz = r.sonuclar.filter(s => !s.basarili && !s.atlandi).length;
const kosulan = r.toplam - atlanan.length;

console.log('='.repeat(72));
console.log('KOSULAN:', kosulan, '| BASARILI:', r.basarili, '| BASARISIZ:', gecerliBasarisiz, '| ATLANDI:', atlanan.length);
console.log('='.repeat(72));
for (const s of r.sonuclar) {
  const etiket = s.basarili ? 'PASS' : (s.atlandi ? 'SKIP' : 'FAIL');
  console.log(etiket + ' | ' + s.ad + (s.ayrinti ? '  →  ' + s.ayrinti : ''));
}
if (atlanan.length) {
  console.log('-'.repeat(72));
  console.log('ATLANAN TESTLER (bu ortamda ölçülemez — tarayıcı gerekir):');
  for (const s of atlanan) console.log('  • ' + s.ad + ' → test/test.html üzerinden doğrulanır');
}
process.exitCode = gecerliBasarisiz > 0 ? 1 : 0;
