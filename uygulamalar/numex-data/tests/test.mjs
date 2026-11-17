/**
 * Numex Data Detective — motor testleri (bilinen sonuçlu veri setleri)
 * Çalıştır:  npm test        ya da   node tests/test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  paraKurus, kurusYazi, tarihISO, gunFarki, anahtarNorm, anahtarCekirdek,
  csvCoz, sutunTani
} from '../js/core.js';
import { karsilastir } from '../js/engine.js';

let gecen = 0;
const hatalar = [];
function test(ad, fn) {
  try { fn(); gecen++; console.log('  \x1b[32m✓\x1b[0m ' + ad); }
  catch (e) { hatalar.push({ ad, mesaj: e.message }); console.log('  \x1b[31m✗\x1b[0m ' + ad + '\n      → ' + e.message); }
}
function bolum(ad) { console.log('\n\x1b[1m' + ad + '\x1b[0m'); }

function yukle(dosya, ad) {
  const yol = new URL('../data/' + dosya, import.meta.url);
  const t = csvCoz(fs.readFileSync(yol, 'utf8'));
  return { ad, basliklar: t.basliklar, satirlar: t.satirlar, mapping: sutunTani(t.basliklar, t.satirlar) };
}
const tipSay = (r, tip) => r.sorunlar.filter(s => s.tip === tip);
const tek = (r, tip) => { const l = tipSay(r, tip); assert.equal(l.length, 1, `${tip} tam 1 kez beklenirken ${l.length} bulundu`); return l[0]; };

/* ============================ 1. PARA (KESİN) ============================ */
bolum('1) Para — kuruş bazlı tamsayı, kayan nokta yok');

test('Türkçe biçim "1.234,56" -> 123456 kuruş', () => assert.equal(paraKurus('1.234,56'), 123456));
test('Nokta ondalıklı "1234.56" -> 123456 kuruş', () => assert.equal(paraKurus('1234.56'), 123456));
test('Türkçe binlik "1.234" -> 123400 kuruş', () => assert.equal(paraKurus('1.234'), 123400));
test('"1.234.567,89" -> 123456789 kuruş', () => assert.equal(paraKurus('1.234.567,89'), 123456789));
test('Para simgesi/boşluk "₺ 2.780,25" -> 278025', () => assert.equal(paraKurus('₺ 2.780,25'), 278025));
test('Virgüllü ondalık "12,5" -> 1250', () => assert.equal(paraKurus('12,5'), 1250));
test('Negatif "-45,10" -> -4510', () => assert.equal(paraKurus('-45,10'), -4510));
test('Muhasebe parantezi "(45,10)" -> -4510', () => assert.equal(paraKurus('(45,10)'), -4510));
test('0,1 + 0,2 === 0,3 (float hatası yok)', () =>
  assert.equal(paraKurus('0,1') + paraKurus('0,2'), paraKurus('0,3')));
test('Sayı girdisi 1234.56 -> 123456 kuruş', () => assert.equal(paraKurus(1234.56), 123456));
test('Metin "abc" -> null (para sayılmaz)', () => assert.equal(paraKurus('abc'), null));
test('Telefon "05551234567" para olarak okunmaz (sütun tanımada yasak)', () => {
  const t = csvCoz('Telefon;Tutar;Tarih\n05551234567;1.500,00;01.11.2026\n05559876543;2.250,50;02.11.2026\n');
  const m = sutunTani(t.basliklar, t.satirlar);
  assert.equal(m.tutar, 1, 'tutar sütunu Tutar olmalı, Telefon değil');
  assert.equal(paraKurus(t.satirlar[0].hucre[0]) > 100000000, true, 'telefon ham sayı olarak büyük çıkar — bu yüzden toplanmamalı');
});
test('kurusYazi(123456) -> "1.234,56 TL"', () => assert.equal(kurusYazi(123456), '1.234,56 TL'));
test('kurusYazi(6400, "Adet") -> "64 Adet"', () => assert.equal(kurusYazi(6400, 'Adet'), '64 Adet'));

/* =============================== 2. TARİH =============================== */
bolum('2) Tarih — Türkçe biçim, ISO, Excel serisi');

test('"01.11.2026" -> 2026-11-01', () => assert.equal(tarihISO('01.11.2026'), '2026-11-01'));
test('"2026-11-17" -> 2026-11-17', () => assert.equal(tarihISO('2026-11-17'), '2026-11-17'));
test('"17/11/2026" -> 2026-11-17', () => assert.equal(tarihISO('17/11/2026'), '2026-11-17'));
test('Geçersiz "31.02.2026" -> null', () => assert.equal(tarihISO('31.02.2026'), null));
test('Date nesnesi -> ISO', () => assert.equal(tarihISO(new Date(2026, 10, 5)), '2026-11-05'));
test('Excel serisi 46375 -> 2026-12-19', () => assert.equal(tarihISO(46375), '2026-12-19'));
test('gunFarki 05.11 -> 19.11 = 14', () => assert.equal(gunFarki('2026-11-05', '2026-11-19'), 14));

/* =============================== 3. KİMLİK ============================== */
bolum('3) Kimlik — 00123 ile 123 ASLA eşit değil');

test('anahtarNorm boşluk kırpar, büyük harfe çevirir', () => assert.equal(anahtarNorm('  s-1001 '), 'S-1001'));
test('"00123" !== "123" (birebir)', () => assert.notEqual(anahtarNorm('00123'), anahtarNorm('123')));
test('anahtarCekirdek("S-00123") === anahtarCekirdek("S-123") (yalnız şüphe için)', () =>
  assert.equal(anahtarCekirdek('S-00123'), anahtarCekirdek('S-123')));
test('anahtarCekirdek("S-1005") !== anahtarCekirdek("S-1080")', () =>
  assert.notEqual(anahtarCekirdek('S-1005'), anahtarCekirdek('S-1080')));
test('anahtarCekirdek("P-0048") === anahtarCekirdek("P-048")', () =>
  assert.equal(anahtarCekirdek('P-0048'), anahtarCekirdek('P-048')));
test('anahtarCekirdek("U-00108") === anahtarCekirdek("U-108")', () =>
  assert.equal(anahtarCekirdek('U-00108'), anahtarCekirdek('U-108')));

/* ================================ 4. CSV ================================ */
bolum('4) CSV — ayraç, tırnak, BOM, satır numarası');

test('Noktalı virgül ayracı ve tırnak içi ayraç', () => {
  const t = csvCoz('A;B\n"x;y";2\n');
  assert.deepEqual(t.basliklar, ['A', 'B']);
  assert.equal(t.satirlar[0].hucre[0], 'x;y');
});
test('BOM temizlenir', () => {
  const t = csvCoz('\uFEFFAd;Tutar\nAli;5\n');
  assert.equal(t.basliklar[0], 'Ad');
});
test('Satır numarası Excel ile aynı (başlık 1. satır)', () => {
  const t = csvCoz('Ad;Tutar\nAli;5\nVeli;6\n');
  assert.equal(t.satirlar[0].satir, 2);
  assert.equal(t.satirlar[1].satir, 3);
});

/* ====================== 5. SENARYO 1 — BİLİNEN SONUÇ ==================== */
bolum('5) Senaryo 1 — banka & satış mutabakatı (bilinen 8 hata)');

const A1 = yukle('senaryo1-satis.csv', 'satis.csv');
const B1 = yukle('senaryo1-banka.csv', 'banka.csv');
const r1 = karsilastir({ A: A1, B: B1, ayar: {}, elle: {} });

test('Sütunlar otomatik doğru tanındı (kimlik 0, tutar 3, tarih 2)', () => {
  assert.equal(A1.mapping.anahtar, 0);
  assert.equal(A1.mapping.tutar, 3);
  assert.equal(A1.mapping.tarih, 2);
  assert.equal(B1.mapping.anahtar, 0);
  assert.equal(B1.mapping.tutar, 3);
});
test('8 kesin eşleşme bulundu', () => assert.equal(r1.istatistik.eslesme, 8));
test('Toplam 8 sorun: 3 kritik + 5 uyarı', () => {
  assert.equal(r1.istatistik.toplam, 8, 'sorun sayısı');
  assert.equal(r1.istatistik.kritik, 3, 'kritik: yinelenen + eksik + karşılıksız');
});
test('Eksik ödeme: S-1005 · satış satır 6', () => {
  const s = tek(r1, 'eksik-odeme');
  assert.equal(s.a.anahtar, 'S-1005');
  assert.equal(s.a.satir, 6);
  assert.equal(s.a.tutar, 278025);
  assert.equal(s.b, null);
});
test('Çift kayıt: banka satır 6 ve 7 (S-1006)', () => {
  const s = tek(r1, 'yinelenen');
  assert.match(s.aciklama, /satır 6/);
  assert.match(s.aciklama, /satır 7/);
  assert.equal(s.guven.seviye, 'kesin');
});
test('Tutar farkı 1: S-1002 · 875,50 vs 875,05 (45 kuruş)', () => {
  const s = tipSay(r1, 'tutar-farki').find(x => x.a.anahtar === 'S-1002');
  assert.ok(s, 'S-1002 tutar farkı bulunamadı');
  assert.equal(s.a.tutar, 87550);
  assert.equal(s.b.tutar, 87505);
  assert.equal(s.beklenen, '875,50 TL');
  assert.equal(s.mevcut, '875,05 TL');
});
test('Tutar farkı 2: S-1003 · 360,00 TL', () => {
  const s = tipSay(r1, 'tutar-farki').find(x => x.a.anahtar === 'S-1003');
  assert.ok(s);
  assert.equal(s.b.tutar - s.a.tutar, -36000);
});
test('Tarih farkı: S-1004 · 14 gün (satır 5 ↔ 5)', () => {
  const s = tek(r1, 'tarih-farki');
  assert.equal(s.a.anahtar, 'S-1004');
  assert.equal(s.a.satir, 5);
  assert.equal(s.b.satir, 5);
  assert.match(s.baslik, /14 gün/);
});
test('Kimlik formatı: S-00123 (satır 9) ↔ S-123 (satır 9) — OTOMATİK EŞLEŞMEDİ', () => {
  const s = tek(r1, 'kimlik-format');
  assert.equal(s.a.anahtar, 'S-00123');
  assert.equal(s.b.anahtar, 'S-123');
  assert.equal(s.a.satir, 9);
  assert.equal(s.b.satir, 9);
  const otomatik = r1.eslesmeler.some(e =>
    (e.a.anahtar === 'S-00123' && e.b.anahtar === 'S-123') || (e.a.anahtar === 'S-123' && e.b.anahtar === 'S-00123'));
  assert.equal(otomatik, false, '00123 ile 123 otomatik eşleştirilmemeli!');
  assert.equal(s.guven.seviye, 'orta', 'format farkı yüksek güven göstermemeli');
});
test('Yanlış eşleştirme adayı: S-1008 ↔ S-1080 (transpoze)', () => {
  const s = tek(r1, 'supheli-eslesme');
  assert.equal(s.a.anahtar, 'S-1008');
  assert.equal(s.b.anahtar, 'S-1080');
  assert.equal(r1.eslesmeler.some(e => e.a.anahtar === 'S-1008'), false);
});
test('Karşılığı olmayan ödeme: S-2001 · banka satır 13', () => {
  const s = tek(r1, 'karsiliksiz-odeme');
  assert.equal(s.b.anahtar, 'S-2001');
  assert.equal(s.b.satir, 13);
});
test('Toplamlar kuruşu kuruşuna doğru (A 30.616,25 · B 29.675,55)', () => {
  assert.equal(r1.istatistik.aToplamKurus, 3061625);
  assert.equal(r1.istatistik.bToplamKurus, 2967555);
  assert.equal(r1.istatistik.farkToplamKurus, -36045);
});
test('Şüpheli eşleşme onaylanınca kesin eşleşmeye döner (9 eşleşme)', () => {
  const r = karsilastir({ A: A1, B: B1, ayar: {}, elle: { onayli: [[9, 9]] } });
  assert.equal(r.istatistik.eslesme, 9);
  assert.equal(tipSay(r, 'kimlik-format').length, 0);
});
test('Şüpheli eşleşme reddedilince kayıtlar ayrı sorun olur', () => {
  const r = karsilastir({ A: A1, B: B1, ayar: {}, elle: { reddedilen: ['supheli-eslesme|A12|B12'] } });
  assert.equal(tipSay(r, 'supheli-eslesme').length, 0);
  assert.ok(tipSay(r, 'eksik-odeme').some(x => x.a.anahtar === 'S-1008'), 'S-1008 eksik ödemeye düşmeli');
  assert.ok(tipSay(r, 'karsiliksiz-odeme').some(x => x.b.anahtar === 'S-1080'), 'S-1080 karşılıksıza düşmeli');
});
test('Eşleşme ayrılınca çift bozulur (S-1006 satır 7 ↔ 6)', () => {
  const r = karsilastir({ A: A1, B: B1, ayar: {}, elle: { ayrilan: [[7, 6]] } });
  assert.equal(r.eslesmeler.some(e => e.a.satir === 7 && e.b.satir === 6), false);
});
test('Tarih toleransı 20 gün olunca tarih uyarısı kalkar', () => {
  const r = karsilastir({ A: A1, B: B1, ayar: { tarihTolerans: 20 }, elle: {} });
  assert.equal(tipSay(r, 'tarih-farki').length, 0);
});
test('Tutar toleransı 100 kuruş olunca 45 kuruşluk fark susar, 360 TL kalır', () => {
  const r = karsilastir({ A: A1, B: B1, ayar: { tutarTolerans: 100 }, elle: {} });
  assert.equal(tipSay(r, 'tutar-farki').length, 1);
});

/* =================== 6. SENARYO 2 — DEPO / MAĞAZA ====================== */
bolum('6) Senaryo 2 — depo & mağaza stok (adet)');

const A2 = yukle('senaryo2-depo.csv', 'depo.csv');
const B2 = yukle('senaryo2-magaza.csv', 'magaza.csv');
const r2 = karsilastir({ A: A2, B: B2, ayar: { birim: 'Adet' }, elle: {} });

test('Stok sütunları tanındı (kimlik 0, miktar 2, tarih 3)', () => {
  assert.equal(A2.mapping.anahtar, 0);
  assert.equal(A2.mapping.tutar, 2);
  assert.equal(A2.mapping.tarih, 3);
});
test('6 kesin eşleşme', () => assert.equal(r2.istatistik.eslesme, 6));
test('Miktar farkları: U-101 (-2 adet) ve U-107 (+2 adet)', () => {
  const f = tipSay(r2, 'tutar-farki');
  assert.equal(f.length, 2);
  const u101 = f.find(x => x.a.anahtar === 'U-101');
  assert.equal(u101.b.tutar - u101.a.tutar, -200);
  assert.equal(u101.mevcut, '118 Adet');
  const u107 = f.find(x => x.a.anahtar === 'U-107');
  assert.equal(u107.b.tutar - u107.a.tutar, 200);
});
test('Tarih farkı U-104 (4 gün)', () => {
  const s = tek(r2, 'tarih-farki');
  assert.equal(s.a.anahtar, 'U-104');
  assert.equal(s.gunFark ?? gunFarki(s.a.tarih, s.b.tarih), 4);
});
test('Depoda olup mağazada olmayan ürün: U-105 · satır 6', () => {
  const s = tek(r2, 'eksik-odeme');
  assert.equal(s.a.anahtar, 'U-105');
  assert.equal(s.a.satir, 6);
  assert.equal(s.a.tutar, 0);
});
test('Mağazada olup depoda olmayan ürün: U-110 · satır 10', () => {
  const s = tek(r2, 'karsiliksiz-odeme');
  assert.equal(s.b.anahtar, 'U-110');
  assert.equal(s.b.satir, 10);
});
test('Yinelenen sayım: U-106 (mağaza 6 ve 7)', () => {
  const s = tek(r2, 'yinelenen');
  assert.match(s.aciklama, /satır 6/);
  assert.match(s.aciklama, /satır 7/);
});
test('U-00108 ↔ U-108 format farkı, otomatik eşleşme yok', () => {
  const s = tek(r2, 'kimlik-format');
  assert.equal(s.a.anahtar, 'U-00108');
  assert.equal(s.b.anahtar, 'U-108');
});
test('Toplam sorun 7', () => assert.equal(r2.istatistik.toplam, 7));

/* =================== 7. SENARYO 3 — MAAŞ / ÖDEME ======================== */
bolum('7) Senaryo 3 — personel maaş & ödeme');

const A3 = yukle('senaryo3-personel.csv', 'personel.csv');
const B3 = yukle('senaryo3-odeme.csv', 'odeme.csv');
const r3 = karsilastir({ A: A3, B: B3, ayar: {}, elle: {} });

test('7 kesin eşleşme (P-0048/P-048 hariç)', () => assert.equal(r3.istatistik.eslesme, 7));
test('Maaş farkı P-1045: 180,00 TL eksik', () => {
  const s = tek(r3, 'tutar-farki');
  assert.equal(s.a.anahtar, 'P-1045');
  assert.equal(s.a.tutar - s.b.tutar, 18000);
});
test('Çift maaş: P-1047 (ödeme satır 7 ve 8)', () => {
  const s = tek(r3, 'yinelenen');
  assert.match(s.aciklama, /satır 7/);
  assert.match(s.aciklama, /satır 8/);
});
test('P-0048 ↔ P-048 format farkı, otomatik eşleşme yok', () => {
  const s = tek(r3, 'kimlik-format');
  assert.equal(s.a.anahtar, 'P-0048');
  assert.equal(s.b.anahtar, 'P-048');
  assert.equal(r3.eslesmeler.some(e => e.a.anahtar === 'P-0048'), false);
});
test('Geç ödenen maaş P-1049: 4 gün', () => {
  const s = tek(r3, 'tarih-farki');
  assert.equal(s.a.anahtar, 'P-1049');
});
test('Karşılığı olmayan ödeme: P-1099', () => {
  const s = tek(r3, 'karsiliksiz-odeme');
  assert.equal(s.b.anahtar, 'P-1099');
});
test('Personel P-0048 "ödemesi gelmemiş" diye ayrıca raporlanmaz (şüpheli aday var)', () => {
  assert.equal(tipSay(r3, 'eksik-odeme').length, 0);
});

/* ============================== SONUÇ ================================== */
console.log('\n' + '─'.repeat(64));
if (hatalar.length) {
  console.log(`\x1b[31m${hatalar.length} test BAŞARISIZ\x1b[0m · ${gecen} test geçti`);
  hatalar.forEach(h => console.log('  • ' + h.ad));
  process.exit(1);
} else {
  console.log(`\x1b[32mTÜM TESTLER GEÇTİ\x1b[0m · ${gecen} test`);
  process.exit(0);
}
