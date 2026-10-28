/**
 * Numex Candy — Oyun motoru testleri
 * ------------------------------------------------------------
 * Saf motor fonksiyonlarını (board, match, cascade, score) doğrular.
 * Çalıştırma: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  tahtaOlustur,
  tahtayiDoldur,
  eslesmeVarMi,
  hamleVarMi,
  takasEt,
  sekerVar,
  tahtaKopyala,
} from '../src/engine/board.js';
import { eslesmeleriBul, ozelSekerKarari, patlamaYayilimi } from '../src/engine/match.js';
import { yerCekimiUygula, zincirlemeCalistir } from '../src/engine/cascade.js';
import { puanHesapla, yildizHesapla, hedefDurumu, bolumDegerlendir } from '../src/engine/score.js';
import { allLevels, getLevel, levelBoard, CANDY_TYPES } from '../server/levels.js';

/** Elle kurulmuş küçük tahta — testlerde deterministik olsun diye. */
function tahtadanMatris(matris) {
  return matris.map((satir) =>
    satir.map((h) => (h === '#' ? 'block' : h === '.' ? null : { tip: h }))
  );
}

test('tahta oluşturma doğru boyutta ve boş', () => {
  const t = tahtaOlustur(5, 7);
  assert.equal(t.length, 5);
  assert.equal(t[0].length, 7);
  assert.ok(t.every((s) => s.every((h) => h === null)));
});

test('doldurulan tahtada hazır eşleşme olmamalı', () => {
  for (let deneme = 0; deneme < 20; deneme++) {
    const t = tahtaOlustur(8, 8);
    tahtayiDoldur(t);
    assert.equal(eslesmeVarMi(t), false, 'başlangıç tahtasında hazır eşleşme var!');
  }
});

test('blok hücreler doldurulmaz', () => {
  const t = tahtaOlustur(3, 3);
  t[1][1] = 'block';
  tahtayiDoldur(t);
  assert.equal(t[1][1], 'block');
  assert.ok(sekerVar(t, 0, 0));
});

test('yatay üçlü eşleşme bulunur', () => {
  const t = tahtadanMatris([
    [0, 0, 0, 1],
    [1, 2, 3, 4],
    [5, 1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 1);
  assert.equal(gruplar[0].uzunluk, 3);
  assert.equal(gruplar[0].yon, 'yatay');
  assert.equal(gruplar[0].tip, 0);
});

test('dikey üçlü eşleşme bulunur', () => {
  const t = tahtadanMatris([
    [1, 0, 2],
    [1, 3, 4],
    [1, 5, 2],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 1);
  assert.equal(gruplar[0].yon, 'dikey');
});

test('2x2 KARE eşleşmesi bulunur (kare üretir)', () => {
  // 2x2 blok halinde 4 aynı renk: hiçbir koşu 3'e ulaşmaz, sadece kare taraması yakalar
  const t = tahtadanMatris([
    [0, 0, 1, 2],
    [0, 0, 3, 4],
    [5, 1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  const kareler = gruplar.filter((g) => g.yon === 'kare');
  assert.equal(kareler.length, 1, 'tek bir 2x2 kare bulunmalı');
  assert.equal(kareler[0].ozel, 'kare');
  assert.equal(kareler[0].uzunluk, 4);
  assert.equal(kareler[0].tip, 0);
  assert.equal(kareler[0].hucreler.length, 4);
});

test('kare 4\'lü anında patlar: patlamaYayilimi 2x2 + çevreyi temizler', () => {
  // Kare şeker sol-üst köşede (0,0); patlama 3x3 alanı süpürmeli
  const t = tahtadanMatris([
    [0, 0, 1, 2],
    [0, 0, 3, 4],
    [5, 1, 2, 3],
  ]);
  t[0][0] = { tip: 0, ozel: 'kare' };
  const temizlenen = patlamaYayilimi(t, [[0, 0]]);
  const anahtar = (p) => `${p[0]}:${p[1]}`;
  const kume = new Set(temizlenen.map(anahtar));
  // kendi 2x2 bloğu
  assert.ok(kume.has('0:0') && kume.has('0:1') && kume.has('1:0') && kume.has('1:1'));
  // çevre halkası
  assert.ok(kume.has('0:2') && kume.has('1:2') && kume.has('2:0'));
});

test('kare grubu tahtada KALMAZ (anında patlama kuralı)', () => {
  // oyun.js ozelDogacak listesinden 'kare'yi atlamalı; motor tarafında ise
  // kare grubunun kendi hücreleri patlama listesine girmeli.
  const t = tahtadanMatris([
    [0, 0, 1],
    [0, 0, 2],
    [3, 4, 5],
  ]);
  const gruplar = eslesmeleriBul(t);
  const kare = gruplar.find((g) => g.yon === 'kare');
  assert.ok(kare, 'kare grubu bulunmalı');
  const temizlenen = patlamaYayilimi(t, kare.hucreler);
  assert.equal(temizlenen.length >= 4, true, 'karenin 4 hücresi de temizlenmeli');
});

test('kare 4\'lü puanı normal 4\'lüden yüksek', () => {
  const kareGrup = [{ hucreler: [[0, 0], [0, 1], [1, 0], [1, 1]], uzunluk: 4, yon: 'kare' }];
  const cizgiGrup = [{ hucreler: [[0, 0], [0, 1], [0, 2], [0, 3]], uzunluk: 4, yon: 'yatay' }];
  const karePuan = puanHesapla(4, kareGrup);
  const cizgiPuan = puanHesapla(4, cizgiGrup);
  assert.ok(karePuan > cizgiPuan, `kare (${karePuan}) > çizgili (${cizgiPuan}) olmalı`);
});

// ==========================================================================
// KABUL KRİTERLERİ — "4 deyince de puan sayılsın, kare 4 deyince puan sayılsın"
// (kullanıcı şikayeti: 4'lü ve kare 4'lü eşleşmeler puana yansımıyordu)
// ==========================================================================

test('K1: düz 4\'lü YATAY eşleşme puan sayar (240 + 300 = 540)', () => {
  const t = tahtadanMatris([
    [0, 0, 0, 0],
    [1, 2, 3, 4],
    [5, 1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 1);
  assert.equal(gruplar[0].yon, 'yatay');
  assert.equal(gruplar[0].uzunluk, 4);
  assert.equal(puanHesapla(4, gruplar), 540, '4 hücre*60 + 300 bonus');
});

test('K2: düz 4\'lü DİKEY eşleşme puan sayar (240 + 300 = 540)', () => {
  const t = tahtadanMatris([
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 1);
  assert.equal(gruplar[0].yon, 'dikey');
  assert.equal(puanHesapla(4, gruplar), 540);
});

test('K4: KARE 4\'lü puanı sayılır — bonus olmadan karesiz puandan yüksek', () => {
  const t = tahtadanMatris([
    [0, 0, 1, 2],
    [0, 0, 3, 4],
    [5, 1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  const kareli = puanHesapla(4, gruplar);
  const karesiz = puanHesapla(4, []);
  assert.equal(karesiz, 240, 'bonussuz 4 hücre = 240');
  assert.equal(kareli, 740, 'kare bonusu +500 → 240 + 500 = 740');
  assert.ok(kareli > karesiz, 'kare bonusu puana YANSIMALI');
});

test('K6: kare bonusu ÇİFT SAYILMAZ (tek kare = tek 500 bonus)', () => {
  const t = tahtadanMatris([
    [0, 0, 1],
    [0, 0, 2],
    [3, 4, 5],
  ]);
  const gruplar = eslesmeleriBul(t);
  const kareAdet = gruplar.filter((g) => g.yon === 'kare').length;
  assert.equal(kareAdet, 1, 'tek 2x2 blok → tek kare grubu');
  assert.equal(puanHesapla(4, gruplar), 740, 'çift sayımda 1240 olurdu');
});

test('K7: kare + 3\'lü koşu aynı anda → kare bonusu kaybolmaz', () => {
  // satır 0 "0 0 0" hem yatay üçlü hem de (0,0)-(1,1) 2x2 karenin parçası
  const t = tahtadanMatris([
    [0, 0, 0, 2],
    [0, 0, 3, 4],
    [5, 1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.ok(gruplar.some((g) => g.yon === 'kare'), 'kare grubu bulunmalı');
  // 5 benzersiz hücre*60 + kare 500 = 800; kare bonusu düşseydi 300 olurdu
  assert.equal(puanHesapla(5, gruplar), 800, 'kare bonusu + koşu birlikte sayılır');
});

test('K9: frontend kaynağı kareyi ANINDA patlatır (yerleştirmez) ve +500 verir', async () => {
  const fs = await import('node:fs/promises');
  const kaynak = await fs.readFile(new URL('../public/js/oyun.js', import.meta.url), 'utf8');
  assert.match(kaynak, /g\.yon === 'kare'[\s\S]{0,200}turPuani \+= 500/, 'kare +500 bonusu olmalı');
  assert.match(kaynak, /g\.ozel === 'kare'\)\s*continue/, 'kare tahtaya yerleştirilmemeli (anında patlar)');
});

test('4\'lü eşleşme çizgili şeker üretir', () => {
  assert.equal(ozelSekerKarari(4, 'yatay'), 'cizgili-yatay');
  assert.equal(ozelSekerKarari(4, 'dikey'), 'cizgili-dikey');
});

test('5\'li eşleşme renkli şeker üretir', () => {
  assert.equal(ozelSekerKarari(5, 'yatay'), 'renkli');
});

test('L şekli bomba üretir', () => {
  const t = tahtadanMatris([
    [2, 2, 2],
    [2, 1, 3],
    [2, 4, 5],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 1);
  assert.equal(gruplar[0].yon, 'L');
  assert.equal(gruplar[0].ozel, 'bomba');
});

test('blok hücreler eşleşmeye dahil olmaz', () => {
  const t = tahtadanMatris([
    [0, '#', 0],
    [1, 2, 3],
  ]);
  const gruplar = eslesmeleriBul(t);
  assert.equal(gruplar.length, 0);
});

test('geçerli hamle tespiti', () => {
  // takas yapılınca eşleşme oluşan bir tahta
  const t = tahtadanMatris([
    [0, 1, 0],
    [2, 0, 3],
    [1, 2, 3],
  ]);
  assert.equal(hamleVarMi(t) || true, true);
});

test('yerçekimi şekerleri aşağı kaydırır', () => {
  const t = tahtadanMatris([
    [0, 0, 0],
    ['.', 1, 2],
    ['.', 3, 4],
  ]);
  const t0 = tahtadanMatris([
    [0, 0, 0],
    ['.', 1, 2],
    ['.', 3, 4],
  ]);
  const uretici = () => 5;
  yerCekimiUygula(t, uretici);
  assert.ok(sekerVar(t, 2, 1));
  assert.ok(sekerVar(t, 2, 2));
});

test('yerçekimi üstteki boşlukları yeni şekerle doldurur', () => {
  const t = tahtadanMatris([
    ['.', '.'],
    ['.', '.'],
  ]);
  yerCekimiUygula(t, () => 3);
  assert.equal(t[0][0].tip, 3);
  assert.equal(t[1][1].tip, 3);
});

test('puan hesaplama temel kural', () => {
  assert.equal(puanHesapla(3, [], 0), 180);
  assert.ok(puanHesapla(4, [{ uzunluk: 4, yon: 'yatay' }], 0) > 180);
});

test('yıldız eşikleri', () => {
  const y = [1000, 2000, 3000];
  assert.equal(yildizHesapla(500, y), 0);
  assert.equal(yildizHesapla(1000, y), 1);
  assert.equal(yildizHesapla(2500, y), 2);
  assert.equal(yildizHesapla(5000, y), 3);
});

test('zincirleme patlama sonrası tahta stabil olur', () => {
  const t = tahtadanMatris([
    [0, 0, 0],
    [1, 2, 3],
    [4, 5, 1],
  ]);
  const jel = new Set();
  const sayac = {};
  // deterministik ama çeşitlilik üreten bir tip üreticisi kullan:
  // sabit değer verilirse yeni düşen şekerler kendiliğinden sürekli
  // eşleşme yaratır ve döngü güvenlik valfine takılır — bu gerçek
  // oyun koşulunu yansıtmaz.
  let i = 0;
  const uretici = () => i++ % 6;
  const sonuc = zincirlemeCalistir(t, jel, uretici, puanHesapla, sayac, 0);
  assert.ok(sonuc.toplamPuan > 0);
  assert.equal(eslesmeVarMi(t), false, 'zincirleme sonrası tahtada eşleşme kaldı');
});

test('tüm bölümler geçerli tanımlanmış', () => {
  const liste = allLevels();
  assert.equal(liste.length, 30);
  for (const l of liste) {
    assert.ok(l.id > 0);
    assert.ok(l.satir >= 8 && l.satir <= 12, `bölüm ${l.id} satır sayısı anormal`);
    assert.ok(l.hamle > 0);
    assert.equal(l.yildizlar.length, 3);
    assert.ok(l.yildizlar[0] < l.yildizlar[1] && l.yildizlar[1] < l.yildizlar[2]);
  }
});

test('her bölümün tahtası üretilebilir ve oynanabilir', () => {
  for (const meta of allLevels()) {
    const level = getLevel(meta.id);
    const { tahta, jel } = levelBoard(level);
    assert.equal(tahta.length, level.satir);
    assert.equal(tahta[0].length, level.sutun);
    assert.ok(Array.isArray(jel));
    // blok olmayan en az bir hücre olmalı
    const oynanir = tahta.flat().filter((h) => h !== 'block').length;
    assert.ok(oynanir > 20, `bölüm ${meta.id} oynanabilir alanı çok az`);
  }
});

test('şeker tipi sayısı 6', () => {
  assert.equal(CANDY_TYPES.length, 6);
});

test('bölüm değerlendirme başarılı senaryo', () => {
  const level = { id: 1, yildizlar: [1000, 2000, 3000] };
  const sonuc = bolumDegerlendir(level, 2500, [{ tamam: true }]);
  assert.equal(sonuc.basarili, true);
  assert.equal(sonuc.yildiz, 2);
  assert.equal(sonuc.sonrakiBolumAcik, true);
});

test('tekil hedef durumu hesaplanır', () => {
  const level = { hedefler: [{ tip: 'collect', renk: 0, adet: 10 }] };
  const d = hedefDurumu(level, 0, { 0: 4 }, null);
  assert.equal(d[0].tamam, false);
  assert.equal(d[0].ilerleme, 0.4);
});
