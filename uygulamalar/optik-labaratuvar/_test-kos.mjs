// Node koşum betiği: validator.js testlerini terminalde çalıştırır. (Tarayıcı gerekmez.)
import { tumTestleriCalistir } from './js/validator.js';

const r = tumTestleriCalistir();
console.log('GECEN:', r.gecen, '/', r.toplam, ' KALAN:', r.kalan);
for (const d of r.detaylar) {
  console.log((d.gecti ? 'OK  ' : 'FAIL'), d.id, '|', d.olculen, '| beklenen:', d.beklenen);
}
