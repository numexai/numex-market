// ÇEKİRDEK İŞ MANTIĞI — stok, sipariş, ödeme, teslimat
//
// Tasarım kararı: stok kontrolü ile düşümü ARASINDA hiçbir async boşluk yok.
// better-sqlite3 senkron çalışır; işlem `BEGIN IMMEDIATE` ile açılır (yazma kilidi
// baştan alınır) → iki eşzamanlı istek sıraya girer, ikincisi güncel stoğu görür.
// Böylece "oku- sonra karar ver- sonra yaz" yarışı (TOCTOU) oluşamaz.
import { db, now, logOps, recordDecision } from './db.js';

export class IsKuraliHatasi extends Error {
  constructor(kod, mesaj, ek = {}) {
    super(mesaj);
    this.kod = kod;
    this.status = ek.status || 409;
    this.detay = ek.detay || null;
  }
}

// NUMEX-DÜZELTME (2026-10-27): db.transaction modül yüklenirken (db export'u bağlanmadan) çalışıyordu; TypeError: Cannot read properties of undefined. Tembel sarmalayıcı ile düzeltildi.
// NUMEX-DÜZELTME (2026-10-27): db.transaction modül yüklenirken çağrılıyordu; ESM'de
// döngüsel import sırasında `db` henüz bağlanmamış olabildiği için "this[cppdb] undefined"
// hatası veriyordu. Artık her çağrıda bağlı db üzerinden alınıyor.
const trx = (fn) => (...args) => db.transaction(fn)(...args);

/* ---------------------------- MÜŞTERİ ---------------------------- */
export const musteriOlustur = trx(({ ad, telefon, email, adres }) => {
  if (!ad || !telefon) throw new IsKuraliHatasi('EKSIK_ALAN', 'ad ve telefon zorunlu', { status: 400 });
  const r = db.prepare('INSERT INTO customers (ad, telefon, email, adres, olusturma) VALUES (?,?,?,?,?)')
    .run(ad, telefon, email || null, adres || null, now());
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid);
});

/* ---------------------------- SİPARİŞ ---------------------------- */
/**
 * Sipariş oluşturur ve stoğu ATOMİK olarak rezerve eder.
 * Aynı idempotency_key ile ikinci çagrı yeni sipariş açmaz, mevcut olanı döndürür.
 */
export const siparisOlustur = trx(({ musteri_id, kalemler, idempotency_key }) => {
  if (!musteri_id || !Array.isArray(kalemler) || kalemler.length === 0) {
    throw new IsKuraliHatasi('EKSIK_ALAN', 'musteri_id ve kalemler zorunlu', { status: 400 });
  }
  const musteri = db.prepare('SELECT * FROM customers WHERE id = ?').get(musteri_id);
  if (!musteri) throw new IsKuraliHatasi('MUSTERI_YOK', 'Musteri bulunamadi', { status: 404 });

  // Aynı istek tekrar geldiyse (retry) yeni sipariş açma.
  const key = idempotency_key || null;
  if (key) {
    const mevcut = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(key);
    if (mevcut) return { siparis: siparisGetir(mevcut.id), tekrar: true };
  }

  // Kalemleri stok koduna göre sadeleştir (aynı ürün iki satırda gelirse topla)
  const toplu = new Map();
  for (const k of kalemler) {
    const adet = Number(k.adet);
    if (!Number.isInteger(adet) || adet <= 0) {
      throw new IsKuraliHatasi('GECERSIZ_ADET', 'adet pozitif tam sayi olmali', { status: 400 });
    }
    const pid = Number(k.product_id);
    toplu.set(pid, (toplu.get(pid) || 0) + adet);
  }

  let toplam = 0;
  const satirlar = [];
  for (const [pid, adet] of toplu) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(pid);
    if (!p) throw new IsKuraliHatasi('URUN_YOK', `Urun bulunamadi: ${pid}`, { status: 404 });
    const kullanilabilir = p.stok - p.rezerve;
    if (kullanilabilir < adet) {
      // (kullanilabilir = fiziksel stok - ayrilmis miktar)
      throw new IsKuraliHatasi('STOK_YETERSIZ',
        `Yetersiz stok: ${p.sku} (istenen ${adet}, kullanilabilir ${kullanilabilir})`,
        { status: 409, detay: { sku: p.sku, istenen: adet, kullanilabilir } });
    }
    toplam += p.birim_fiyat * adet;
    satirlar.push({ product_id: p.id, adet, birim_fiyat: p.birim_fiyat, sku: p.sku });
  }

  const olus = now();
  const sonuc = db.prepare(`INSERT INTO orders (musteri_id, durum, toplam_kurus, idempotency_key, olusturma)
                            VALUES (?, 'REZERVE', ?, ?, ?)`)
    .run(musteri_id, toplam, key, olus);
  const orderId = Number(sonuc.lastInsertRowid);

  for (const s of satirlar) {
    db.prepare('INSERT INTO order_items (order_id, product_id, adet, birim_fiyat) VALUES (?,?,?,?)')
      .run(orderId, s.product_id, s.adet, s.birim_fiyat);
    // NUMEX-DÜZELTME (2026-10-27): Kok neden: rezervasyonda hem stok hem rezerve degistiriliyordu; kullanilabilir = stok - rezerve oldugu icin bu cift sayim yapip kullanilabilir'i negatife dusuruyordu (stok 10 -> 2, rezerve 0 -> 8 => kullanilabilir -6). Dogru model: fiziksel stok degismez, rezerve artar; kullanilabilir = stok - rezerve. Teslimde rezerve sifirlanir ve fiziksel stok o zaman duser.
    // Rezervasyon: FİZİKSEL STOK DEĞİŞMEZ, yalnız ayrılan (rezerve) miktar artar.
    // kullanılabilir = stok - rezerve → bu UPDATE ile tam olarak istenen kadar azalır.
    const g = db.prepare('UPDATE products SET rezerve = rezerve + ? WHERE id = ? AND stok - rezerve >= ?')
      .run(s.adet, s.product_id, s.adet);
    if (g.changes !== 1) {
      // Buraya normalde düşülmez; düşerse transaction'ın tamamı geri alınır.
      throw new IsKuraliHatasi('STOK_YETERSIZ', `Stok rezervasyonu basarisiz: ${s.sku}`);
    }
    db.prepare('INSERT INTO stock_moves (product_id, delta, sebep, order_id, olusturma) VALUES (?,?,?,?,?)')
      .run(s.product_id, -s.adet, 'SIPARIS_REZERVE', orderId, olus);
  }

  logOps('AKTOR_ISLEM', `Siparis #${orderId} olusturuldu`, { musteri: musteri.ad, toplam, kalem: satirlar.length });
  return { siparis: siparisGetir(orderId), tekrar: false };
});

export function siparisGetir(id) {
  const o = db.prepare(`SELECT o.*, c.ad AS musteri_ad, c.telefon AS musteri_telefon
                        FROM orders o JOIN customers c ON c.id = o.musteri_id WHERE o.id = ?`).get(id);
  if (!o) return null;
  o.kalemler = db.prepare(`SELECT oi.*, p.sku, p.ad FROM order_items oi
                           JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`).all(id);
  o.odemeler = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id').all(id);
  o.teslimat = db.prepare('SELECT * FROM shipments WHERE order_id = ? ORDER BY id DESC').all(id);
  return o;
}

/* ---------------------------- ÖDEME ---------------------------- */
/**
 * Ödeme simülasyonu. Sıra: niyet kaydı (BASLATILDI) commit → tahsilat → sonuç commit.
 * Sunucu bu sırada ölürse, açılışta kurtarma rutini (recovery) yarım kalan
 * "BASARILI ama sipariş ODENDI'ye geçmemiş" kaydı bulup tamamlar.
 * Mükerrer tahsilat DB kalkanıyla da engellenir (ux_payments_basarili / ux_payments_idem).
 */
export const odemeAl = trx(({ order_id, idempotency_key }) => {
  const key = idempotency_key || `pay-${order_id}-${Date.now()}`;
  const siparis = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!siparis) throw new IsKuraliHatasi('SIPARIS_YOK', 'Siparis bulunamadi', { status: 404 });

  // 1) Aynı anahtar daha önce kullanıldıysa tekrar tahsilat YOK
  const ayniAnahtar = db.prepare('SELECT * FROM payments WHERE idempotency_key = ?').get(key);
  if (ayniAnahtar) {
    return { odeme: ayniAnahtar, tekrar: true, mesaj: 'Ayni idempotency anahtari ile ikinci tahsilat yapilmadi' };
  }
  // 2) Sipariş zaten başarıyla ödenmişse tekrar tahsilat YOK
  const basarili = db.prepare("SELECT * FROM payments WHERE order_id = ? AND durum = 'BASARILI'").get(order_id);
  if (basarili) {
    return { odeme: basarili, tekrar: true, mesaj: 'Siparis zaten odendi — mukerrer tahsilat engellendi' };
  }

  // 3) Ödeme niyeti (niyet önce diske yazılır — cokme olursa iz kalır)
  const r = db.prepare(`INSERT INTO payments (order_id, tutar_kurus, durum, idempotency_key, olusturma)
                        VALUES (?, ?, 'BASLATILDI', ?, ?)`)
    .run(order_id, siparis.toplam_kurus, key, now());
  const paymentId = Number(r.lastInsertRowid);
  return { odemeId: paymentId, orderId: order_id, tutar: siparis.toplam_kurus, key, _niyet: true };
});

/** Tahsilatın "kesinleştiği" an — kurtarma rutini de bu tek noktayı kullanır. */
export const odemeKesinlestir = trx(({ paymentId, islem_no }) => {
  const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!p) throw new IsKuraliHatasi('ODEME_YOK', 'Odeme kaydi bulunamadi', { status: 404 });
  // NUMEX-DÜZELTME (2026-10-27): Kok neden: odeme zaten BASARILI ise fonksiyon erken donuyordu ve siparisi ODENDI'ye cekmiyordu. Cokme tam bu iki yazma arasinda oldugunda siparis REZERVE kaliyor, kurtarma da bir sey yapmiyordu. Artik siparis durumu da senkronize edilir; tahsilat TEKRAR edilmez (para hareketi yok), yalniz durum yazilir.
  if (p.durum === 'BASARILI') {
    // NUMEX-DÜZELTME (2026-10-27): Ödeme zaten başarılıysa fonksiyon erken dönüp siparişi
    // ODENDI'ye çekmiyordu; çökme tam bu iki yazma arasında olursa sipariş REZERVE kalıyordu.
    // Burada YALNIZ durum senkronize edilir — ikinci tahsilat (para hareketi) yapılmaz.
    db.prepare(`UPDATE orders SET durum = 'ODENDI', odeme_zamani = COALESCE(odeme_zamani, ?)
                WHERE id = ? AND durum = 'REZERVE'`).run(now(), p.order_id);
    const sipVar = db.prepare('SELECT id FROM shipments WHERE order_id = ?').get(p.order_id);
    if (!sipVar) {
      db.prepare(`INSERT INTO shipments (order_id, durum, tahmini_varis) VALUES (?, 'HAZIRLANIYOR', ?)`)
        .run(p.order_id, new Date(Date.now() + 3 * 86400000).toISOString());
    }
    return { odeme: p, zaten: true, senkronize: true };
  }

  db.prepare(`UPDATE payments SET durum = 'BASARILI', islem_no = ?, guncelleme = ? WHERE id = ?`)
    .run(islem_no || `SIM-${p.order_id}-${p.id}`, now(), paymentId);
  db.prepare(`UPDATE orders SET durum = 'ODENDI', odeme_zamani = ? WHERE id = ? AND durum = 'REZERVE'`)
    .run(now(), p.order_id);

  // Ödeme kesinleşince tedarik/teslimat kaydı açılır (outbox ile aynı transaction'da)
  const sip = db.prepare("SELECT * FROM shipments WHERE order_id = ?").get(p.order_id);
  if (!sip) {
    db.prepare(`INSERT INTO shipments (order_id, durum, tahmini_varis) VALUES (?, 'HAZIRLANIYOR', ?)`)
      .run(p.order_id, new Date(Date.now() + 3 * 86400000).toISOString());
  }
  db.prepare('INSERT INTO outbox (tur, payload, olusturma) VALUES (?,?,?)')
    .run('SIPARIS_ODENDI', JSON.stringify({ order_id: p.order_id }), now());

  logOps('AKTOR_ISLEM', `Siparis #${p.order_id} odemesi kesinlesti`, { paymentId, tutar: p.tutar_kurus });
  return { odeme: db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) };
});

/* ---------------------------- TESLİMAT ---------------------------- */
export const teslimatGuncelle = trx(({ order_id, durum, takip_no }) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!o) throw new IsKuraliHatasi('SIPARIS_YOK', 'Siparis bulunamadi', { status: 404 });
  const izinli = ['HAZIRLANIYOR', 'YOLDA', 'TESLIM_EDILDI'];
  if (!izinli.includes(durum)) throw new IsKuraliHatasi('GECERSIZ_DURUM', 'Gecersiz teslimat durumu', { status: 400 });

  const mevcut = db.prepare('SELECT * FROM shipments WHERE order_id = ? ORDER BY id DESC').get(order_id);
  if (mevcut) {
    db.prepare('UPDATE shipments SET durum = ?, takip_no = COALESCE(?, takip_no), cikis = COALESCE(cikis, ?), teslim = ? WHERE id = ?')
      .run(durum, takip_no || null, durum === 'YOLDA' ? now() : null,
        durum === 'TESLIM_EDILDI' ? now() : null, mevcut.id);
  } else {
    db.prepare('INSERT INTO shipments (order_id, durum, takip_no, cikis, teslim) VALUES (?,?,?,?,?)')
      .run(order_id, durum, takip_no || null, durum === 'YOLDA' ? now() : null, durum === 'TESLIM_EDILDI' ? now() : null);
  }

  db.prepare('UPDATE orders SET durum = ?, teslim_tarihi = ? WHERE id = ?')
    .run(durum, durum === 'TESLIM_EDILDI' ? now() : null, order_id);

  if (durum === 'TESLIM_EDILDI') {
    // NUMEX-DÜZELTME (2026-10-27): Rezervasyon modeli degisti (fiziksel stok rezervasyonda dusmuyor). Teslimde artik hem rezerve sifirlanmali hem fiziksel stok maldan cikmali: stok = stok - adet, rezerve = rezerve - adet. Onceki kod stogu dusurmuyordu, bu da teslim edilen malin depoda sayilmaya devam etmesi demekti.
    // Teslim: mal fiziksel olarak cikti → stok duser, ayrim (rezerve) kalkar.
    const kalemler = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order_id);
    for (const k of kalemler) {
      db.prepare('UPDATE products SET stok = stok - ?, rezerve = rezerve - ? WHERE id = ? AND stok >= ? AND rezerve >= ?')
        .run(k.adet, k.adet, k.product_id, k.adet, k.adet);
      db.prepare('INSERT INTO stock_moves (product_id, delta, sebep, order_id, olusturma) VALUES (?,?,?,?,?)')
        .run(k.product_id, -k.adet, 'TESLIM', order_id, now());
    }
  }
  logOps('AKTOR_ISLEM', `Siparis #${order_id} teslimat durumu: ${durum}`, { takip_no });
  return { siparis: siparisGetir(order_id) };
});

/* ---------------------------- İPTAL (iade) ---------------------------- */
export const siparisIptal = trx(({ order_id, gerekce }) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!o) throw new IsKuraliHatasi('SIPARIS_YOK', 'Siparis bulunamadi', { status: 404 });
  if (o.durum === 'TESLIM_EDILDI') throw new IsKuraliHatasi('GEC_GIPTAL', 'Teslim edilmis siparis iptal edilemez', { status: 409 });
  if (o.durum === 'IPTAL') return { siparis: siparisGetir(order_id), zaten: true };

  // NUMEX-DÜZELTME (2026-10-27): Rezervasyonda fiziksel stok dusmedigi icin iptalde stoga eklemek stogu sisirirdi. Iptal yalniz ayrimi (rezerve) kaldirmali; fiziksel stok zaten hic degismemisti.
  // Rezervasyon fiziksel stogu dusurmemisti → iptal yalniz ayrimi kaldirir, stok sabit kalir.
  const kalemler = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order_id);
  for (const k of kalemler) {
    db.prepare('UPDATE products SET rezerve = rezerve - ? WHERE id = ? AND rezerve >= ?')
      .run(k.adet, k.product_id, k.adet);
    db.prepare('INSERT INTO stock_moves (product_id, delta, sebep, order_id, olusturma) VALUES (?,?,?,?,?)')
      .run(k.product_id, 0, 'IPTAL_IADE', order_id, now());
  }
  db.prepare("UPDATE orders SET durum = 'IPTAL' WHERE id = ?").run(order_id);
  logOps('AKTOR_ISLEM', `Siparis #${order_id} iptal edildi`, { gerekce });
  return { siparis: siparisGetir(order_id) };
});

export { recordDecision };
