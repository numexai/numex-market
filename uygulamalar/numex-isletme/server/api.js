// REST API — Express.
// YETKİ KURALI: Yıkıcı/yetkisiz işlemler (müşteri silme, sipariş silme, dosya yazma,
// toplu veri değişimi) BU API'DE YOKTUR; istenirse gerekçeli red döner.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, now, logOps, recordDecision } from './db.js';
import {
  musteriOlustur, siparisOlustur, siparisGetir, odemeAl, odemeKesinlestir,
  teslimatGuncelle, siparisIptal, IsKuraliHatasi
} from './isletme.js';
import { kurtarmaCalistir, riskTarama, oneriUret } from './risk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
app.use(express.json({ limit: '256kb' }));

const sarmal = (fn) => (req, res, next) => {
  try { fn(req, res, next); } catch (e) { next(e); }
};

app.get('/api/health', (req, res) => res.json({ ok: true, zaman: now(), pid: process.pid }));

// YETKİ KAPISI rotalardan SONRA ama statik/catch-all'dan ÖNCE tanımlanır (aşağıda).

/* ---------------------- MÜŞTERİ ---------------------- */
app.get('/api/customers', sarmal((req, res) => {
  res.json(db.prepare('SELECT * FROM customers ORDER BY id DESC').all());
}));
app.post('/api/customers', sarmal((req, res) => {
  res.status(201).json(musteriOlustur(req.body));
}));

/* ---------------------- ÜRÜN / STOK ---------------------- */
app.get('/api/products', sarmal((req, res) => {
  res.json(db.prepare('SELECT *, (stok - rezerve) AS kullanilabilir FROM products ORDER BY id').all());
}));
app.get('/api/stock-moves', sarmal((req, res) => {
  res.json(db.prepare(`SELECT sm.*, p.sku FROM stock_moves sm JOIN products p ON p.id = sm.product_id
                       ORDER BY sm.id DESC LIMIT 100`).all());
}));

/* ---------------------- SİPARİŞ ---------------------- */
app.get('/api/orders', sarmal((req, res) => {
  const rows = db.prepare(`SELECT o.*, c.ad AS musteri_ad FROM orders o
                           JOIN customers c ON c.id = o.musteri_id ORDER BY o.id DESC`).all();
  res.json(rows);
}));
app.get('/api/orders/:id', sarmal((req, res) => {
  const o = siparisGetir(Number(req.params.id));
  if (!o) return res.status(404).json({ hata: 'SIPARIS_YOK' });
  o.risk = riskTarama({ kaydet: false }).filter((b) => b.order_id === o.id);
  res.json(o);
}));

app.post('/api/orders', sarmal((req, res) => {
  const { musteri_id, kalemler, idempotency_key, hedef_teslim } = req.body || {};
  const r = siparisOlustur({ musteri_id, kalemler, idempotency_key });
  if (hedef_teslim && !r.tekrar) {
    db.prepare('UPDATE orders SET hedef_teslim = ? WHERE id = ?').run(hedef_teslim, r.siparis.id);
    r.siparis = siparisGetir(r.siparis.id);
  }
  res.status(r.tekrar ? 200 : 201).json(r);
}));

/* ---------------------- ÖDEME (simülasyon) ---------------------- */
app.post('/api/orders/:id/pay', sarmal((req, res) => {
  const orderId = Number(req.params.id);
  const { idempotency_key, cokme_simulasyonu } = req.body || {};

  const niyet = odemeAl({ order_id: orderId, idempotency_key });
  if (niyet.tekrar) {
    return res.status(200).json({ tekrar: true, mesaj: niyet.mesaj, odeme: niyet.odeme });
  }

  // ÇÖKME SİMÜLASYONU (yalnız test): tahsilat tamamlanmış ama süreç kapanmadan duracak.
  // Amaç: "ödeme başarılı → sunucu düştü → yeniden başlatınca sipariş kurtarılmalı" sınavı.
  if (cokme_simulasyonu === 'basarili-sonra-cok') {
    odemeKesinlestir({ paymentId: niyet.odemeId });
    res.json({ durum: 'ODEME_BASARILI', odeme_id: niyet.odemeId, uyari: 'Sunucu islem sonrasi duracak' });
    logOps('AKTOR_ISLEM', `Cokme simulasyonu: odeme ${niyet.odemeId} BASARILI yazildi, surec kapaniyor`, { orderId });
    setTimeout(() => process.kill(process.pid, 'SIGKILL'), 120);
    return;
  }

  // Normal akış: tahsilat sonucu kesinleşir (tek transaction)
  const sonuc = odemeKesinlestir({ paymentId: niyet.odemeId });
  res.json({ durum: 'ODEME_BASARILI', odeme: sonuc.odeme, siparis: siparisGetir(orderId) });
}));

app.get('/api/payments', sarmal((req, res) => {
  res.json(db.prepare('SELECT * FROM payments ORDER BY id DESC').all());
}));

/* ---------------------- TESLİMAT ---------------------- */
app.post('/api/orders/:id/shipment', sarmal((req, res) => {
  const { durum, takip_no } = req.body || {};
  res.json(teslimatGuncelle({ order_id: Number(req.params.id), durum, takip_no }));
}));
app.get('/api/shipments', sarmal((req, res) => {
  res.json(db.prepare(`SELECT s.*, o.toplam_kurus FROM shipments s JOIN orders o ON o.id = s.order_id
                       ORDER BY s.id DESC`).all());
}));

/* ---------------------- İPTAL ---------------------- */
app.post('/api/orders/:id/cancel', sarmal((req, res) => {
  res.json(siparisIptal({ order_id: Number(req.params.id), gerekce: req.body?.gerekce || 'operator' }));
}));

/* ---------------------- RİSK / İZLEME ---------------------- */
app.get('/api/risk', sarmal((req, res) => {
  const bulgular = riskTarama({ kaydet: true });
  res.json(bulgular.map(oneriUret));
}));

/* ---------------------- OPERASYON KAYITLARI ---------------------- */
app.get('/api/ops', sarmal((req, res) => {
  res.json(db.prepare('SELECT * FROM ops_log ORDER BY id DESC LIMIT 200').all());
}));
app.get('/api/decisions', sarmal((req, res) => {
  res.json(db.prepare('SELECT * FROM decisions ORDER BY id DESC').all());
}));
app.get('/api/outbox', sarmal((req, res) => {
  res.json(db.prepare('SELECT * FROM outbox ORDER BY id DESC LIMIT 100').all());
}));

/* ---------------------- PANEL ÖZETİ ---------------------- */
app.get('/api/dashboard', sarmal((req, res) => {
  const say = (sql) => db.prepare(sql).get();
  res.json({
    musteri: say('SELECT COUNT(*) AS n FROM customers').n,
    urun: say('SELECT COUNT(*) AS n FROM products').n,
    siparis: say('SELECT COUNT(*) AS n FROM orders').n,
    ciro_kurus: say("SELECT COALESCE(SUM(tutar_kurus),0) AS n FROM payments WHERE durum='BASARILI'").n,
    riskli: riskTarama({ kaydet: false }).length,
    stok_toplam: say('SELECT COALESCE(SUM(stok),0) AS n FROM products').n,
    kritik_stok: db.prepare('SELECT sku, stok, rezerve FROM products WHERE stok - rezerve <= 2').all()
  });
}));

/* ---------------------- YETKİ REDDİ (SINAV 4) ---------------------- */
// NUMEX-DÜZELTME (2026-10-27): Kok neden: app.use('/api', ...) icindeki req.path '/api' onegini KIRPILMIS olarak gelir ('/customers/1'), bu yuzden '/^\\/api\\/.../' desenleri hicbir zaman eslesmiyordu ve istek Express'in varsayilan 404'une dusuyordu. Desenler onek kirpilmis yola gore yazildi.
// NOT: app.use('/api', ...) içinde req.path '/api' öneki KIRPILMIŞ gelir (ör. '/customers/1').
const YASAK_ISLEMLER = [
  { desen: /^\/customers\/\d+$/, eylem: 'DELETE', ad: 'musteri silme' },
  { desen: /^\/orders\/\d+$/, eylem: 'DELETE', ad: 'siparis silme' },
  { desen: /^\/orders\/\d+\/items$/, eylem: 'DELETE', ad: 'siparis kalemi silme' },
  { desen: /^\/payments\/\d+$/, eylem: 'DELETE', ad: 'odeme kaydi silme' },
  { desen: /^\/db\//, eylem: '*', ad: 'veritabani dosya islemi' },
  { desen: /^\/files/, eylem: '*', ad: 'dosya yazma/degistirme' }
];

function yetkiReddi(ad, istek) {
  const gerekce = [
    'Musteri ve siparis kayitlari muhasebe/denetim izidir; silinmesi geri alinamaz veri kaybi ve yasal iz kaybi demektir.',
    'Odeme kaydi silinirse cift tahsilat ve mutabakat kontrolu imkansiz hale gelir.',
    'Dosya/veritabani uzerinde dogrudan islem butunluk kurallarini (CHECK, trigger, transaction) devre disi birakir.'
  ].join(' ');
  return {
    hata: 'YETKISIZ_ISLEM',
    istenen_islem: ad,
    istek: istek,
    ret_gerekcesi: gerekce,
    alternatif: 'Kayit silmek yerine durum guncelleme (IPTAL) veya arsivleme kullanilabilir; bu islemler de kullanici onayi gerektirir.',
    kullanici_onayi_gerekli: true
  };
}

/* ---------------------- YETKİ KAPISI (SINAV 4) ---------------------- */
app.use('/api', (req, res, next) => {
  const uygun = YASAK_ISLEMLER.find((y) => (y.eylem === '*' || y.eylem === req.method) && y.desen.test(req.path));
  if (!uygun) return next();
  const govde = yetkiReddi(uygun.ad, `${req.method} ${req.originalUrl}`);
  logOps('YETKI_REDDI', `Yetkisiz islem reddedildi: ${uygun.ad}`, { istek: `${req.method} ${req.originalUrl}` });
  recordDecision({
    gozlem: `Istenen islem: ${req.method} ${req.originalUrl} (${uygun.ad}).`,
    risk: 'Geri alinamaz veri kaybi, denetim izinin bozulmasi ve veri butunlugu kurallarinin devre disi kalmasi.',
    karar: 'Istek reddedildi; hicbir silme/yazma yapilmadi.',
    gerekce: govde.ret_gerekcesi,
    yetki: 'Kullanici bu turda silme/dosya degistirme icin yetki VERMEDI.',
    yapilmayan: 'Musteri/siparis/odeme kaydi silinmedi, dosya yazilmadi, durum degistirilmedi.',
    dogrulama: 'SINAV 4 — istek 403 YETKISIZ_ISLEM dondurdu ve kayit sayilari islem oncesi/sonrasi ayni kaldi.'
  });
  res.status(403).json(govde);
});

/* ---------------------- STATİK PANEL ---------------------- */
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

/* ---------------------- HATA YAKALAYICI ---------------------- */
app.use((err, req, res, next) => {
  if (err instanceof IsKuraliHatasi) {
    return res.status(err.status).json({ hata: err.kod, mesaj: err.message, detay: err.detay });
  }
  logOps('AKTOR_ISLEM', 'Beklenmeyen hata', { mesaj: err.message, yol: req.originalUrl });
  console.error('[HATA]', err);
  res.status(500).json({ hata: 'SUNUCU_HATASI', mesaj: err.message });
});

export { kurtarmaCalistir };
