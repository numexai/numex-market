// Numex — tasarruf senaryosu (SADECE simülasyon; gerçek kaydı iptal etmez)
import { aylikTutar, yillikTutar, senaryoDahil } from './hesaplayici.js';
import { seriUret, bugun as bugunFn, gunEkle, tarihAyikla } from './tarih.js';

export const SENARYO_ETIKET = {
  koru: 'Korumak istiyorum',
  iptal: 'İptal etmeyi düşünüyorum',
  ucuz_paket: 'Daha ucuz pakete geçebilirim'
};

// Dönüş: yeni state kopyası (mutasyon yok)
export function senaryoUygula(id, tip, durum) {
  const kopya = JSON.parse(JSON.stringify(durum));
  const a = kopya.abonelikler.find(x => x.id === id);
  if (!a) return durum;
  a.senaryo = ['koru', 'iptal', 'ucuz_paket'].includes(tip) ? tip : 'koru';
  return kopya;
}

export function senaryoSifirla(durum) {
  const kopya = JSON.parse(JSON.stringify(durum));
  for (const a of kopya.abonelikler) a.senaryo = 'koru';
  return kopya;
}

// Senaryo sonrası aylık/yıllık toplamlar (para birimi bazında)
export function tasarrufToplami(durum, bugunT = bugunFn()) {
  const simdikiAylik = {};
  const yeniAylik = {};
  const simdikiYillik = {};
  const yeniYillik = {};
  const kalemler = [];

  for (const a of durum.abonelikler || []) {
    const p = a.paraBirimi || 'TRY';
    const gercek = a.durum !== 'iptal';
    if (gercek) {
      simdikiAylik[p] = (simdikiAylik[p] || 0) + aylikTutar(a);
      simdikiYillik[p] = (simdikiYillik[p] || 0) + yillikTutar(a);
    }
    let yeniA = 0, yeniY = 0;
    if (gercek && a.senaryo !== 'iptal') {
      const katsayi = a.senaryo === 'ucuz_paket' ? 0.6 : 1;
      yeniA = aylikTutar(a) * katsayi;
      yeniY = yillikTutar(a) * katsayi;
      yeniAylik[p] = (yeniAylik[p] || 0) + yeniA;
      yeniYillik[p] = (yeniYillik[p] || 0) + yeniY;
    }
    if (gercek) {
      const fark = aylikTutar(a) - yeniA;
      if (fark > 0.0001) {
        kalemler.push({
          id: a.id, hizmetAdi: a.hizmetAdi, paraBirimi: p,
          senaryo: a.senaryo,
          eskiAylik: aylikTutar(a), yeniAylik: yeniA,
          aylikTasarruf: fark, yillikTasarruf: yillikTutar(a) - yeniY
        });
      }
    }
  }

  const fark = (a, b) => {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = (a[k] || 0) - (b[k] || 0);
    return out;
  };

  return {
    simdikiAylik, yeniAylik, simdikiYillik, yeniYillik,
    aylik: fark(simdikiAylik, yeniAylik),
    yillik: fark(simdikiYillik, yeniYillik),
    kalemler
  };
}

// Senaryo uygulanmış ödeme takvimi önizlemesi
export function yeniTakvim(durum, bugunT = bugunFn(), gunSayisi = 30) {
  const bas = bugunT;
  const bit = gunEkle(bugunT, gunSayisi);
  const kalemler = [];
  for (const a of durum.abonelikler || []) {
    if (a.durum === 'iptal' || a.senaryo === 'iptal') continue;
    const katsayi = a.senaryo === 'ucuz_paket' ? 0.6 : 1;
    for (const o of seriUret(a, bas, bit)) {
      kalemler.push({
        abonelikId: a.id, hizmetAdi: a.hizmetAdi, kategori: a.kategori,
        paraBirimi: a.paraBirimi, tarih: o.tarih, tutar: o.tutar * katsayi,
        senaryo: a.senaryo
      });
    }
  }
  kalemler.sort((x, y) => (x.tarih < y.tarih ? -1 : x.tarih > y.tarih ? 1 : 0));
  return kalemler;
}
