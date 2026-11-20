// Numex — abonelik yorgunluğu analizi
// KURAL: hiçbir yerde "gereksiz" hükmü üretilmez. Yalnız veri + gerekçe + "kararı siz verin".
import { aylikTutar, yillikTutar, senaryoDahil } from './hesaplayici.js';
import { tarihAyikla, bugun as bugunFn, gunFarki } from './tarih.js';
import { para, tarih as tarihBicim } from './bicim.js';

function gunOnce(t, gun) {
  return Math.round((t - gun) / 86400000);
}

export function kuralKullanilmayan(durum, bugunT = bugunFn()) {
  const esik = durum.esikler?.kullanimsizGun ?? 30;
  const kalemler = (durum.abonelikler || []).filter(a => {
    if (!senaryoDahil(a)) return false;
    const k = tarihAyikla(a.sonKullanimTarihi);
    if (!k) return false;
    return gunFarki(bugunT, k) >= esik;
  });
  if (!kalemler.length) return null;
  return {
    tip: 'kullanilmayan',
    seviye: 'uyari',
    baslik: `${esik}+ gündür kullanım kaydı girilmemiş hizmetler`,
    abonelikIdler: kalemler.map(a => a.id),
    gerekce: kalemler.map(a => `${a.hizmetAdi} — son kullanım ${tarihBicim(a.sonKullanimTarihi)}`).join(' · '),
    etkiTutari: kalemler.reduce((s, a) => s + aylikTutar(a), 0),
    para: kalemler[0].paraBirimi
  };
}

export function kuralYuksekYillik(durum) {
  const esik = durum.esikler?.yillik ?? 3000;
  const kalemler = (durum.abonelikler || []).filter(a => senaryoDahil(a) && yillikTutar(a) >= esik);
  if (!kalemler.length) return null;
  return {
    tip: 'yuksek-yillik',
    seviye: 'bilgi',
    baslik: `Yıllık maliyeti ${para(esik)} üzerindeki abonelikler`,
    abonelikIdler: kalemler.map(a => a.id),
    gerekce: kalemler.map(a => `${a.hizmetAdi} — yılda ${para(yillikTutar(a), a.paraBirimi)}`).join(' · '),
    etkiTutari: kalemler.reduce((s, a) => s + yillikTutar(a), 0),
    para: kalemler[0].paraBirimi
  };
}

export function kuralKategoriYigin(durum) {
  const aktif = (durum.abonelikler || []).filter(senaryoDahil);
  const grup = {};
  for (const a of aktif) {
    (grup[a.kategori] = grup[a.kategori] || []).push(a);
  }
  const yiginlar = Object.entries(grup).filter(([, l]) => l.length >= 2);
  if (!yiginlar.length) return null;
  return {
    tip: 'kategori-yigin',
    seviye: 'bilgi',
    baslik: 'Aynı kategoride birden fazla hizmet',
    abonelikIdler: yiginlar.flatMap(([, l]) => l.map(a => a.id)),
    gerekce: yiginlar.map(([kat, l]) =>
      `${kat}: ${l.map(a => a.hizmetAdi).join(', ')} (${l.length} hizmet, aylık ${para(l.reduce((s, a) => s + aylikTutar(a), 0), l[0].paraBirimi)})`
    ).join(' · '),
    etkiTutari: yiginlar.reduce((s, [, l]) => s + l.reduce((x, a) => x + aylikTutar(a), 0), 0),
    para: yiginlar[0][1][0].paraBirimi
  };
}

export function kuralYaklasanYenileme(durum, bugunT) {
  const kalemler = (durum.abonelikler || []).filter(a => {
    if (!senaryoDahil(a) || a.siklik !== 'yillik') return false;
    const c = tarihAyikla(a.sonOdemeTarihi);
    if (!c) return false;
    const f = gunFarki(c, bugunT);
    return f >= 0 && f <= 30;
  });
  if (!kalemler.length) return null;
  return {
    tip: 'yaklasan-yenileme',
    seviye: 'uyari',
    baslik: '30 gün içinde yenilenecek yıllık ödemeler',
    abonelikIdler: kalemler.map(a => a.id),
    gerekce: kalemler.map(a => `${a.hizmetAdi} — ${tarihBicim(a.sonOdemeTarihi)} tarihinde ${para(a.tutar, a.paraBirimi)}`).join(' · '),
    etkiTutari: kalemler.reduce((s, a) => s + Number(a.tutar), 0),
    para: kalemler[0].paraBirimi
  };
}

export function kuralKucukBirikim(durum) {
  const esik = durum.esikler?.kucukUcret ?? 60;
  const aktif = (durum.abonelikler || []).filter(senaryoDahil);
  const aylikToplamlar = {};
  for (const a of aktif) {
    const p = a.paraBirimi || 'TRY';
    aylikToplamlar[p] = (aylikToplamlar[p] || 0) + aylikTutar(a);
  }
  const kalemler = aktif.filter(a => {
    const p = a.paraBirimi || 'TRY';
    const at = aylikTutar(a);
    const toplam = aylikToplamlar[p] || 0;
    return at < esik && toplam > 0 && (at / toplam) * 100 >= 3;
  });
  if (!kalemler.length) return null;
  return {
    tip: 'kucuk-birikim',
    seviye: 'bilgi',
    baslik: `Küçük ama birikince büyüyen ücretler (aylık < ${para(esik)})`,
    abonelikIdler: kalemler.map(a => a.id),
    gerekce: kalemler.map(a => `${a.hizmetAdi} — aylık ${para(aylikTutar(a), a.paraBirimi)} (yılda ${para(yillikTutar(a), a.paraBirimi)})`).join(' · '),
    etkiTutari: kalemler.reduce((s, a) => s + aylikTutar(a), 0),
    para: kalemler[0].paraBirimi
  };
}

export function analizEt(durum, bugunT = bugunFn()) {
  const uyarilar = [
    kuralKullanilmayan(durum, bugunT),
    kuralYaklasanYenileme(durum, bugunT),
    kuralKategoriYigin(durum),
    kuralYuksekYillik(durum),
    kuralKucukBirikim(durum)
  ].filter(Boolean);

  return {
    uyarilar,
    sayilar: {
      uyariliAbonelik: new Set(uyarilar.flatMap(u => u.abonelikIdler)).size
    },
    kararNotu: 'Bu ekran yalnız gözlem sunar; hiçbir hizmet "gereksiz" olarak ilan edilmez. Kararı siz verin.'
  };
}
