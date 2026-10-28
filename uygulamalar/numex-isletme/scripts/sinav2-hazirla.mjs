// SINAV 2 — kontrollü çökme senaryosu: ödeme BASARILI yazılmış ama sipariş hâlâ REZERVE.
// Bu durum gerçek hayatta "ödeme sağlayıcısı onayladı, sunucu tam bu anda düştü" demektir.
// Kurtarma rutini bunu görüp siparişi ODENDI'ye çekmeli, İKİNCİ tahsilat YAPMAMALI.
import { db, now, logOps } from '../server/db.js';
import { siparisOlustur } from '../server/isletme.js';

const urun = db.prepare('SELECT id FROM products WHERE stok - rezerve >= 1').get();
if (!urun) { console.error('Uygun ürün yok'); process.exit(1); }
const r = siparisOlustur({ musteri_id: 2, kalemler: [{ product_id: urun.id, adet: 1 }], idempotency_key: 'sinav2-' + Date.now() });
const orderId = r.siparis.id;

// Ödeme kaydını doğrudan BASARILI yaz, siparişi REZERVE'de bırak (çökme anı)
db.prepare(`INSERT INTO payments (order_id, tutar_kurus, durum, idempotency_key, islem_no, olusturma)
            VALUES (?, ?, 'BASARILI', ?, ?, ?)`)
  .run(orderId, r.siparis.toplam_kurus, 'pay-sinav2-' + orderId, 'SIM-CRASH-' + orderId, now());

const durum = db.prepare('SELECT id, durum FROM orders WHERE id = ?').get(orderId);
const odeme = db.prepare('SELECT id, durum FROM payments WHERE order_id = ?').all(orderId);
console.log(JSON.stringify({
  asama: 'COKME_ANINDA',
  siparis: durum,
  odemeler: odeme,
  beklenen: 'Yeniden baslatmada kurtarma siparisi ODENDI yapmali, ikinci odeme olusturmamali'
}, null, 2));
logOps('AKTOR_ISLEM', `SINAV 2 cokme ani kurgulandi: siparis #${orderId} REZERVE, odeme BASARILI`, { orderId });
