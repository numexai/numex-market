'use strict';
const { DB } = require('../db');
const { Motor, Hata } = require('../engine');

let gecen = 0;
let kalan = 0;
const satirlar = [];

function test(ad, kosucu) {
  try {
    const sonuc = kosucu();
    gecen += 1;
    satirlar.push({ ad, ok: true, mesaj: sonuc || '' });
  } catch (e) {
    kalan += 1;
    satirlar.push({ ad, ok: false, mesaj: e.message });
  }
}

function esit(gercek, beklenen, etiket) {
  const g = typeof gercek === 'number' ? Math.round(gercek * 100) / 100 : gercek;
  if (g !== beklenen) throw new Error(`${etiket}: beklenen ${beklenen}, gerçek ${g}`);
}

function temiz() {
  const db = new DB(null);
  return new Motor(db);
}

// 1. BOM / maliyet / süre hesabı
test('BOM ve maliyet: 20 sandalye', () => {
  const m = temiz();
  const p = m.planla('P1', 20);
  const kereste = p.ihtiyaclar.find((i) => i.malzemeId === 'M1');
  esit(kereste.gereken, 80, 'Kereste ihtiyacı');
  // 80×38 + 240×4,5 + 6×46 + 5×92 + 20×3,5 = 3040 + 1080 + 276 + 460 + 70
  esit(p.malzemeMaliyeti, 4926, 'Malzeme maliyeti');
  esit(p.iscilikMaliyeti, 12600, 'İşçilik maliyeti');
  esit(p.toplamMaliyet, 17526, 'Toplam maliyet');
  esit(p.satisGeliri, 37000, 'Satış geliri');
  esit(p.tahminiKar, 19474, 'Tahmini kâr');
  // 20 sandalye kesim: 120 dk / kapasite 2 = 60 dk
  const kesim = p.makinePlan.find((x) => x.istasyonId === 'S1');
  esit(kesim.toplamDk, 120, 'Kesim toplam süre');
  esit(kesim.bitisSim - kesim.baslangicSim, 60, 'Kesim takvim süresi');
  return `toplam ${p.toplamMaliyet} TL, üretim ${p.tahminiUretimDk} sim-dk`;
});

// 2. Stok yetersizse üretim engellenir
test('Yetersiz stok engeli', () => {
  const m = temiz();
  m.stokCikisi('M2', 60, 'Test: stok düşür');
  let yakalandi = false;
  try {
    m.siparisOlustur({ urunId: 'P2', adet: 15 });
  } catch (e) {
    yakalandi = true;
    if (!(e instanceof Hata) || e.status !== 409) throw new Error('Hata kodu 409 değil');
    if (!e.detay.eksikler.length) throw new Error('Eksik listesi boş');
  }
  if (!yakalandi) throw new Error('Stok yetersizken sipariş kabul edildi');
  esit(m.v.siparisler.length, 0, 'Sipariş sayısı');
  return 'engellendi, eksik malzeme raporlandı';
});

// 3. Stok eksiye düşmez
test('Stok eksiye düşmez', () => {
  const m = temiz();
  let hata = false;
  try {
    m.stokCikisi('M1', 100000);
  } catch (e) {
    hata = true;
  }
  if (!hata) throw new Error('Aşırı çıkış kabul edildi');
  const s = m.malzeme('M1').stok;
  if (s < 0) throw new Error('Stok negatif: ' + s);
  return `M1 stok ${s}`;
});

// 4. Sipariş → rezervasyon → başlat → tamamla → stok düşümü
test('Uçtan uca: sipariş, kapasite, üretim, stok düşümü', () => {
  const m = temiz();
  const r = m.siparisOlustur({ urunId: 'P1', adet: 20, musteri: 'Test' });
  esit(m.v.emirler.length, 1, 'Emir sayısı');
  esit(m.malzeme('M1').stok, 240, 'Rezervasyon stok düşürmemeli');
  esit(m.rezerveHaritasi().M1, 80, 'Rezerve M1');
  m.emriBaslat(r.emir.id);
  esit(r.emir.durum, 'calisiyor', 'Emir durumu');
  m.ilerlet(r.emir.id, 1);
  esit(m.malzeme('M1').stok, 160, 'Üretim sonrası M1 stoğu');
  esit(m.malzeme('M6').stok, 55, 'Üretim sonrası vernik stoğu');
  esit(m.v.emirler.length, 0, 'Aktif emir sayısı');
  esit(m.v.emirlerArsiv.length, 1, 'Arşiv emir sayısı');
  return 'stok ve arşiv doğru';
});

// 5. Çift tamamlama = çift düşüm yok
test('İdempotans: iki kez tamamla', () => {
  const m = temiz();
  const r = m.siparisOlustur({ urunId: 'P3', adet: 10 });
  m.emriBaslat(r.emir.id);
  m.ilerlet(r.emir.id, 1);
  const sonra = m.malzeme('M3').stok;
  m.ilerlet(r.emir.id, 1);
  esit(m.malzeme('M3').stok, sonra, 'M3 ikinci kez düşmemeli');
  return `M3 son stok ${sonra}`;
});

// 6. İptal rezervasyonu serbest bırakır
test('İptal → rezervasyon serbest', () => {
  const m = temiz();
  const r = m.siparisOlustur({ urunId: 'P1', adet: 20 });
  esit(m.rezerveHaritasi().M1, 80, 'Rezerve önce');
  m.emirIptal(r.emir.id, 'test');
  esit(m.rezerveHaritasi().M1, 0, 'Rezerve sonra');
  esit(m.malzeme('M1').stok, 240, 'Stok dokunulmamalı');
  // iptal sonrası aynı miktar yeniden sipariş edilebilmeli
  m.siparisOlustur({ urunId: 'P1', adet: 20 });
  return 'rezervasyon 80 → 0';
});

// 7. Kapasite çakışması yok
test('Kapasite: iki emir aynı istasyonda çakışmaz', () => {
  const m = temiz();
  const a = m.siparisOlustur({ urunId: 'P1', adet: 20 });
  const b = m.siparisOlustur({ urunId: 'P3', adet: 10 });
  const kesitA = a.emir.adimlar.find((x) => x.istasyonId === 'S1');
  const kesitB = b.emir.adimlar.find((x) => x.istasyonId === 'S1');
  if (kesitB.baslangicSim < kesitA.bitisSim - 1e-6) {
    throw new Error(`Çakışma: A bitiş ${kesitA.bitisSim}, B başlangıç ${kesitB.baslangicSim}`);
  }
  // Aynı istasyonda iki emir "çalışıyor" olamaz
  m.emriBaslat(a.emir.id);
  let reddedildi = false;
  try {
    m.emriBaslat(b.emir.id);
  } catch (e) {
    reddedildi = true;
  }
  if (!reddedildi) throw new Error('İkinci emir aynı istasyonda başlatıldı');
  return `B kuyruğa alındı, ${Math.round(kesitB.baslangicSim - kesitA.bitisSim)} sim-dk sonra`;
});

// 8. Eşzamanlı çift tıklama → tek sipariş
test('Eşzamanlı çift sipariş → tek emir', () => {
  const m = temiz();
  const sonuc = [];
  // Senkron motor: 1. çağrı stok ayırır, 2. çağrı rezerve görüp reddeder
  for (let i = 0; i < 2; i++) {
    try {
      sonuc.push(m.siparisOlustur({ urunId: 'P2', adet: 60 }));
    } catch (e) {
      sonuc.push(null);
    }
  }
  esit(m.v.emirler.length, 1, 'Emir sayısı');
  esit(m.rezerveHaritasi().M2, 60, 'Rezerve M2');
  return 'ikinci istek reddedildi, çift rezervasyon yok';
});

console.log('');
for (const s of satirlar) {
  console.log(`${s.ok ? 'GEÇTİ ' : 'KALDI '} | ${s.ad}${s.mesaj ? ' — ' + s.mesaj : ''}`);
}
console.log(`\nSonuç: ${gecen} geçti, ${kalan} kaldı\n`);
process.exit(kalan ? 1 : 0);
