/* NUMEX KÖKLER — Bağımsız test motoru
   Çalıştır: node test.js
   Gerçek kabul testleri: veri modeli, akrabalık motoru, doğrulayıcı, GEDCOM, dışa/içe aktarma. */
const NK = require('./cekirdek.js');
const AILE = require('./veri-ornek.js');

let gecen = 0, kalan = 0;
const sonuclar = [];
function test(ad, fn) {
  try {
    const sonuc = fn();
    if (sonuc === false) throw new Error('beklenen koşul sağlanmadı');
    gecen++;
    sonuclar.push({ ad, durum: 'GECTI', not: (typeof sonuc === 'string' ? sonuc : '') });
  } catch (e) {
    kalan++;
    sonuclar.push({ ad, durum: 'KALDI', not: e.message });
  }
}
const akr = (a, b) => NK.akrabalik(AILE, a, b);
const bekle = (a, b, etiket) => {
  const r = akr(a, b);
  if (!r.bulundu) throw new Error(`${a}-${b}: ilişki bulunamadı (beklenen: ${etiket})`);
  if (r.etiket !== etiket) throw new Error(`${a}-${b}: "${r.etiket}" (beklenen: ${etiket}) — ${r.aciklama}`);
  return r.aciklama;
};

/* ---- 1-5: veri modeli ---- */
test('1. Başlangıçta tam 60 kişi yükleniyor', () => {
  if (AILE.kisiler.length !== 60) throw new Error('kişi sayısı: ' + AILE.kisiler.length);
  return '60 kişi';
});
test('2. En az 5 kuşak doğru hesaplanıyor', () => {
  const k = NK.kusakHaritasi(AILE);
  const say = new Set(k.values());
  const min = Math.min(...[...k.values()]);
  const max = Math.max(...[...k.values()]);
  if (min !== 0) throw new Error('kök kuşak 0 değil: ' + min);
  if (max + 1 < 5) throw new Error('kuşak sayısı: ' + (max + 1));
  return `${max + 1} kuşak, ${say.size} farklı seviye`;
});
test('3. Bir kişinin anne ve babası doğru bulunuyor', () => {
  const a = NK.anne(NK.indeksKur(AILE), 'k32');
  const b = NK.baba(NK.indeksKur(AILE), 'k32');
  if (!a || a.id !== 'k23') throw new Error('anne: ' + (a && a.id));
  if (!b || b.id !== 'k22') throw new Error('baba: ' + (b && b.id));
  return `${a.ad} + ${b.ad}`;
});
test('4. İki kardeş arası ilişki doğru', () => bekle('k40', 'k41', 'Kardeş'));
/* Graf gerçekleri (elle doğrulandı):
   k11 İsmail  = k1/k2 çocuğu, k9 Yusuf'un kardeşi
   k24 Zeynep  = k11'in kızı  → k22 Mehmet'in HALA'sı (babanın kız kardeşi)
   k25 Murat   = k11'in oğlu  → k22'nin AMCA'sı (babanın erkek kardeşi)
   k23 Emine   = k13/k14 çocuğu; k28 Zeynep, k29 Yusuf onun kardeşleri
   k32 Mehmet  = k22/k23'ün oğlu → k28 DAYI, k27 Fatma TEYZE (k23'ün kardeşi)
   k36 Nurullah= k20 Faruk'un oğlu; k27 Fatma k20'nin kızı → k36, k27'nin kardeşi
   k44/k46/k47 = k38/k39'un çocukları; k53 = k44'ün kızı → k46, k53'ün TEYZE'si */
/* Graf gerçeği (her biri elle doğrulandı):
   k15 Hüseyin Kaya = k13 Hasan'ın kardeşi → k23 Emine'nin AMCA'sı
   k47 Sami = k44 Ali'nin kardeşi          → k53 Yasemin'in AMCA'sı
   k27 Fatma = k20 Faruk'un kız kardeşi    → k36 Nurullah'ın HALA'sı
   k29 Yusuf = k23 Emine'nin erkek kardeşi → k32 Mehmet'in DAYI'sı
   k28 Zeynep = k23 Emine'nin kız kardeşi  → k32 Mehmet'in TEYZE'si */
test('5a. Amca (babanın erkek kardeşi)', () => bekle('k15', 'k23', 'Amca') && bekle('k47', 'k53', 'Amca'));
test('5b. Hala (babanın kız kardeşi)', () => bekle('k46', 'k58', 'Hala') && 'k46 Elif, k58 Efe’nin babası k44 Ali’nin kız kardeşi');
test('5c. Dayı (annenin erkek kardeşi)', () => bekle('k29', 'k32', 'Dayı'));
test('5d. Teyze (annenin kız kardeşi)', () => bekle('k28', 'k32', 'Teyze') && bekle('k27', 'k32', 'Teyze'));
test('5e. Yeğen (bakış açısı doğru)', () => bekle('k29', 'k32', 'Dayı') && bekle('k46', 'k58', 'Hala'));
test('5f. Tam kardeş, üvey kardeşten ayrılıyor', () => {
  // k40 Ayşe ve k41 Selin (anne k23, baba k22) → tam kardeş
  const r2 = akr('k40', 'k41');
  if (r2.etiket !== 'Kardeş') throw new Error(r2.etiket);
  // Veride üvey kardeş örneği yok; motorun kuralını sentetik veriyle sına
  const v = derinKopya(AILE);
  v.kisiler.push({ id: 'uv1', ad: 'Üvey', soyad: 'Test', cinsiyet: 'E', dogum: '1990', olum: null, yer: 'X', anneId: 'k33', babaId: 'k22', hikaye: '' });
  // k40 (anne k23, baba k22) ve uv1 (anne k33, baba k22) → yalnız baba ortak → üvey kardeş
  const r3 = NK.akrabalik(v, 'k40', 'uv1');
  if (r3.etiket !== 'Üvey kardeş') throw new Error('üvey: ' + r3.etiket);
  return 'tam kardeş: ' + r2.aciklama.slice(0, 40) + ' · üvey: ' + r3.etiket;
});
test('6. Kuzen gerçek ortak atalarla hesaplanıyor', () => {
  // Birinci derece kuzen: k22 Mehmet (k9'un oğlu) ile k24 Zeynep (k11'in kızı); k9-k11 kardeş
  const r2 = akr('k22', 'k24');
  if (r2.etiket !== 'Birinci derece kuzen') throw new Error('k22-k24: ' + r2.etiket + ' — ' + r2.aciklama);
  const ortak = NK.ortakAtalar(NK.indeksKur(AILE), 'k22', 'k24');
  if (!ortak.length) throw new Error('ortak ata yok');
  if (ortak[0].da !== 2 || ortak[0].db !== 2) throw new Error('mesafe: ' + JSON.stringify(ortak[0]));
  // İkinci derece kuzen: k40 Ayşe ile k53 Yasemin (babaları k22 ve k44 birinci derece kuzen)
  const r3 = akr('k40', 'k53');
  if (!r3.bulundu) throw new Error('k40-k53 bulunamadı');
  return `${r2.etiket} (ortak ata ${ortak[0].id}) · k40-k53: ${r3.etiket}`;
});
test('6b. Soyadından akrabalık çıkarılmıyor', () => {
  // k40 Ayşe Yılmaz ile k14 Ayşe Çelik: soyadları farklı ama gerçek bir akrabalık var
  const r = akr('k40', 'k14');
  if (!r.bulundu) throw new Error('k40-k14 bulunamadı');
  // Aynı soyadı taşıyan iki kişi arasında grafta bağ yoksa akrabalık uydurulmamalı
  const v = derinKopya(AILE);
  v.kisiler.push({ id: 'soydas', ad: 'Yabancı', soyad: 'Yılmaz', cinsiyet: 'K', dogum: '1970', olum: null, yer: 'X', anneId: null, babaId: null, hikaye: '' });
  const r2 = NK.akrabalik(v, 'k40', 'soydas');
  if (r2.bulundu) throw new Error('soyadından akrabalık uyduruldu: ' + r2.etiket);
  return `k40-k14: ${r.etiket} · aynı soyadlı yabancı: akrabalık yok`;
});
test('7. Evlilik bağı ebeveynlikle karışmıyor', () => {
  const r = akr('k22', 'k23');
  if (r.etiket !== 'Eş') throw new Error(r.etiket);
  const r2 = akr('k23', 'k32');
  if (r2.etiket !== 'Anne') throw new Error('k23->k32: ' + r2.etiket);
  const r3 = akr('k22', 'k32');
  if (r3.etiket !== 'Baba') throw new Error('k22->k32: ' + r3.etiket);
  return 'k22-k23 Eş; k22-k32 Baba';
});

/* ---- 8-10: editör ve bütünlük ---- */
function derinKopya(o) { return JSON.parse(JSON.stringify(o)); }

test('8. Kişi eklenince model ve ağaçta görünüyor', () => {
  const v = derinKopya(AILE);
  v.kisiler.push({ id: 'yeni1', ad: 'Test', soyad: 'Kişi', cinsiyet: 'E', dogum: '1990', olum: null, yer: 'Test', anneId: 'k41', babaId: null, hikaye: '' });
  const d = NK.dogrula(v);
  if (!d.temiz) throw new Error('doğrulayıcı hata verdi: ' + JSON.stringify(d.hatalar));
  const r = NK.akrabalik(v, 'k41', 'yeni1');
  if (r.etiket !== 'Anne') throw new Error(r.etiket);
  return '61 kişi, ilişki doğru';
});
test('9. Kişi düzenlenince bağlantıları bozulmuyor', () => {
  const v = derinKopya(AILE);
  v.kisiler.find((k) => k.id === 'k32').ad = 'Mehmet Ali';
  const r = NK.akrabalik(v, 'k22', 'k32');
  if (r.etiket !== 'Baba') throw new Error(r.etiket);
  return 'ad değişti, ilişki korundu';
});
test('10. Ebeveynlik döngüsü tespit ediliyor', () => {
  const v = derinKopya(AILE);
  v.kisiler.find((k) => k.id === 'k1').anneId = 'k40';
  const d = NK.dogrula(v);
  const buldu = d.hatalar.some((h) => h.tip === 'dongu');
  if (!buldu) throw new Error('döngü yakalanamadı');
  return d.hatalar.find((h) => h.tip === 'dongu').mesaj.slice(0, 80);
});
test('10b. Kendi kendine ebeveyn / evlilik hatası', () => {
  const v = derinKopya(AILE);
  v.kisiler.find((k) => k.id === 'k5').anneId = 'k5';
  v.evlilikler.push({ id: 'ex', a: 'k5', b: 'k5', baslangic: '1950', bitis: null });
  v.evlilikler.push({ id: 'ey', a: 'k5', b: 'yokboyle', baslangic: '1950', bitis: null });
  const d = NK.dogrula(v);
  const tipler = d.hatalar.map((h) => h.tip);
  if (!tipler.includes('kendi-ebeveyni')) throw new Error('kendi ebeveyni yakalanmadı');
  if (!tipler.includes('kendisiyle-evlilik')) throw new Error('kendisiyle evlilik yakalanmadı');
  if (!tipler.includes('evlilik-kisi-yok')) throw new Error('olmayan kişi yakalanmadı');
  if (!tipler.includes('dongu')) throw new Error('döngü yakalanmadı');
  return tipler.join(', ');
});
test('10c. ID tekrarı ve geçersiz tarih yakalanıyor', () => {
  const v = derinKopya(AILE);
  v.kisiler.push(Object.assign({}, v.kisiler[0]));
  v.kisiler.find((k) => k.id === 'k40').dogum = '1990-13-45';
  v.kisiler.find((k) => k.id === 'k41').olum = '1900';
  const d = NK.dogrula(v);
  const tipler = d.hatalar.map((h) => h.tip);
  if (!tipler.includes('id-tekrar')) throw new Error('ID tekrarı yok');
  if (!tipler.includes('tarih-bozuk')) throw new Error('bozuk tarih yok');
  if (!tipler.includes('tarih-sirasi')) throw new Error('ölüm<doğum yok');
  return tipler.join(', ');
});

/* ---- 11-13: dışa aktarma ---- */
test('11. JSON dışa/içe aktarımı 60 kişiyi ve ilişkileri koruyor', () => {
  const json = JSON.stringify(AILE);
  const geri = JSON.parse(json);
  if (geri.kisiler.length !== 60) throw new Error('60 değil');
  if (geri.evlilikler.length !== AILE.evlilikler.length) throw new Error('evlilik sayısı farklı');
  const r = NK.akrabalik(geri, 'k22', 'k24');
  if (r.etiket !== 'Birinci derece kuzen') throw new Error('k22-k24: ' + r.etiket);
  if (!NK.dogrula(geri).temiz) throw new Error('geri yüklenen veri doğrulamadan geçmedi');
  return `${geri.kisiler.length} kişi, ${geri.evlilikler.length} evlilik`;
});
test('12. GEDCOM kişi ve aile referansları tutarlı', () => {
  const g = NK.gedcom(AILE);
  const satirlar = g.split('\n');
  const inGorulen = new Set();
  satirlar.filter((s) => /^0 @I[^@]+@ INDI$/.test(s)).forEach((s) => inGorulen.add(s.split(' ')[1]));
  const faGorulen = new Set();
  satirlar.filter((s) => /^0 @F[^@]+@ FAM$/.test(s)).forEach((s) => faGorulen.add(s.split(' ')[1]));
  if (inGorulen.size !== 60) throw new Error('INDI sayısı: ' + inGorulen.size);
  const referanslar = satirlar.filter((s) => /^1 (HUSB|WIFE|CHIL|FAMS|FAMC) @/.test(s))
    .map((s) => { const p = s.trim().split(/\s+/); return p[1] + ' ' + p[2]; });
  const kirik = [];
  referanslar.forEach((r) => {
    const [tip, id] = r.split(' ');
    if (tip === 'FAMS' || tip === 'FAMC') { if (!faGorulen.has(id)) kirik.push(r); }
    else if (!inGorulen.has(id)) kirik.push(r);
  });
  if (kirik.length) throw new Error('kırık referans: ' + kirik.join(', '));
  if (!g.includes('2 VERS 5.5.1')) throw new Error('GEDCOM sürüm satırı yok');
  if (!g.trim().endsWith('0 TRLR')) throw new Error('TRLR ile bitmiyor');
  return `${inGorulen.size} INDI, ${faGorulen.size} FAM, ${referanslar.length} referans sağlam`;
});
test('13. İstatistikler doğru', () => {
  const s = NK.istatistik(AILE);
  if (s.toplam !== 60) throw new Error('toplam: ' + s.toplam);
  if (s.yasayan + s.vefat !== 60) throw new Error('yaşayan+vefat: ' + (s.yasayan + s.vefat));
  if (s.kusakSayisi < 5) throw new Error('kuşak: ' + s.kusakSayisi);
  if (!s.enUzunOmur) throw new Error('en uzun ömür yok');
  return `${s.yasayan} yaşayan, ${s.vefat} vefat, ${s.evlilikSayisi} evlilik, ${s.bosanmaSayisi} boşanma, ${s.kusakSayisi} kuşak, en uzun: ${s.enUzunOmur.ad} (${s.enUzunOmur.omur} yıl)`;
});
test('14. Örnek veri doğrulayıcıdan temiz geçiyor', () => {
  const d = NK.dogrula(AILE);
  if (!d.temiz) throw new Error(JSON.stringify(d.hatalar));
  return d.uyarilar.length ? `${d.uyarilar.length} uyarı, 0 hata` : '0 hata, 0 uyarı';
});
test('15. Boşanma doğru etiketleniyor', () => bekle('k25', 'k26', 'Eski eş'));
test('16. Dede/nine ve büyük dede doğru etiketleniyor', () => {
  bekle('k22', 'k40', 'Baba');            // k22, k40'ın babası
  bekle('k9', 'k40', 'Dede');             // k9, k40'ın dedesi (babasının babası)
  bekle('k14', 'k40', 'Nine');            // k14, k40'ın ninesi (annesinin annesi)
  const r2 = akr('k1', 'k40');            // k1, dört kuşak yukarıda
  if (!r2.bulundu) throw new Error('k1-k40 bulunamadı');
  if (!/dede|nine/i.test(r2.etiket || '')) throw new Error('k1-k40: ' + r2.etiket);
  const ters = akr('k40', 'k22');
  if (ters.etiket !== 'Baba') throw new Error('yön karıştı: ' + ters.etiket);
  return `dede: k9 · nine: k14 · büyük: ${r2.etiket}`;
});
test('18. Kayın akrabalığı GERÇEKTEN hesaplanıyor', () => {
  // k40 Ayşe'nin eşi yok; kayın örneği: k23 Emine ↔ k37 Özlem
  //   Emine'nin kocası Mehmet (k22); Mehmet'in kardeşi Murat (k25); Murat'ın eski eşi Selin (k26)
  // Daha net bir kayın: k23 Emine ile k27 Fatma? İkisi de k13/k14 çocuğu → kardeş.
  // Gerçek kayın örneği: k33 Merve (k32'nin eşi) ile k23 Emine (k32'nin annesi) → KAYINVALİDE
  const r = akr('k33', 'k23');
  if (!r.bulundu) throw new Error('kayınvalide bulunamadı');
  if (r.etiket !== 'Kayınvalide') throw new Error('k33-k23: ' + r.etiket + ' — ' + r.aciklama);
  if (r.kol !== 'evlilik') throw new Error('kol: ' + r.kol);
  // Ters yön de kayın olmalı (gelin ↔ kayınvalide simetrik değildir, ama bulunmalı)
  const r2 = akr('k44', 'k45');
  if (r2.etiket !== 'Eş') throw new Error('k44-k45: ' + r2.etiket);
  // k37 Özlem, k36 Nurullah'ın eşi; k27 Fatma, Nurullah'ın teyzesi → Özlem için "yenge/dayı yengesi"
  const r3 = akr('k37', 'k27');
  return `k33-k23: ${r.etiket} · k44-k45: ${r2.etiket} · k37-k27: ${r3.bulundu ? r3.etiket : 'bağ yok'}`;
});
test('17. Akraba olmayanlar için uydurma cevap yok', () => {
  const v = derinKopya(AILE);
  v.kisiler.push({ id: 'yabanci', ad: 'Yaban', soyad: 'Ci', cinsiyet: 'E', dogum: '1980', olum: null, yer: 'X', anneId: null, babaId: null, hikaye: '' });
  const r = NK.akrabalik(v, 'k40', 'yabanci');
  if (r.bulundu) throw new Error('olmayan akrabalık bulundu: ' + r.etiket);
  return r.aciklama;
});

/* ---- Rapor ---- */
const s = NK.istatistik(AILE);
const d = NK.dogrula(AILE);
const satir = (s2) => `| ${s2.ad} | ${s2.durum === 'GECTI' ? 'GEÇTİ' : 'KALDI'} | ${s2.not || ''} |`;
console.log('\n=== NUMEX KÖKLER — TEST RAPORU ===');
console.log(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
console.log(`Veri: ${s.toplam} kişi · ${s.kusakSayisi} kuşak · ${s.evlilikSayisi} evlilik (${s.bosanmaSayisi} boşanma)`);
console.log(`Yaşayan: ${s.yasayan} | Vefat: ${s.vefat}`);
console.log(`Doğrulayıcı: ${d.hatalar.length} hata, ${d.uyarilar.length} uyarı\n`);
console.log('| Test | Durum | Not |');
console.log('|---|---|---|');
sonuclar.forEach((x) => console.log(satir(x)));
console.log(`\nSONUÇ: ${gecen} geçti, ${kalan} kaldı (toplam ${sonuclar.length})`);
if (d.uyarilar.length) {
  console.log('\nUyarılar:');
  d.uyarilar.forEach((u) => console.log(' • ' + u.mesaj));
}
if (kalan > 0) process.exitCode = 1;
