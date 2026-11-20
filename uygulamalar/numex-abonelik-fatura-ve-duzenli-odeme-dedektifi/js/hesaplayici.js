// Numex — hesaplama motoru (para birimi ayrımı korunur)
import { tarihAyikla, bugun as bugunFn, tarihYaz, ayEkleGuvenli, gunEkle } from './tarih.js';

export function aylikTutar(a) {
  const t = Number(a.tutar) || 0;
  switch (a.siklik) {
    case 'haftalik': return t * 52 / 12;
    case 'aylik': return t;
    case '3aylik': return t / 3;
    case 'yillik': return t / 12;
    default: return 0;
  }
}

export function yillikTutar(a) {
  const t = Number(a.tutar) || 0;
  switch (a.siklik) {
    case 'haftalik': return t * 52;
    case 'aylik': return t * 12;
    case '3aylik': return t * 4;
    case 'yillik': return t;
    default: return 0;
  }
}

// Senaryo katmanı: 'iptal' seçilmiş abonelik tahminlere katılmaz (gerçek kayıt bozulmaz)
export function senaryoDahil(a) {
  return a.durum !== 'iptal' && a.senaryo !== 'iptal';
}

export function senaryoTutar(a) {
  if (!senaryoDahil(a)) return 0;
  const t = Number(a.tutar) || 0;
  return a.senaryo === 'ucuz_paket' ? t * 0.6 : t; // daha ucuz paket: %40 düşüş varsayımı
}

export function bosGrup() { return {}; }

export function ekle(grup, para, deger) {
  if (!para) return grup;
  grup[para] = (grup[para] || 0) + (Number(deger) || 0);
  return grup;
}

export function paraBirimiGruplari(liste) {
  const out = {};
  for (const a of liste || []) {
    if (!senaryoDahil(a)) continue;
    const p = a.paraBirimi || 'TRY';
    if (!out[p]) out[p] = { aylik: 0, yillik: 0, adet: 0 };
    out[p].aylik += aylikTutar(a);
    out[p].yillik += yillikTutar(a);
    out[p].adet += 1;
  }
  return out;
}

export function kurCevir(tutar, kaynak, hedef, kurlar) {
  if (kaynak === hedef) return Number(tutar) || 0;
  const k = kurlar || {};
  const kaynakKur = kaynak === 'TRY' ? 1 : k[kaynak];
  const hedefKur = hedef === 'TRY' ? 1 : k[hedef];
  if (!kaynakKur || !hedefKur) return null; // kullanıcı tanımlamadıysa çeviri YOK
  return (Number(tutar) || 0) * (hedefKur / kaynakKur) * (kaynak === 'TRY' ? 1 : 1);
}

// Bir para birimindeki tüm grupları, kullanıcının girdiği kurlarla TRY'ye çevir (yalnız bilgi amaçlı)
export function cevrilebilirToplam(gruplar, kurlar, alan = 'aylik') {
  let toplam = 0;
  const cevrilemeyen = [];
  for (const [para, v] of Object.entries(gruplar || {})) {
    const c = kurCevir(v[alan] || 0, para, 'TRY', kurlar);
    if (c === null) cevrilemeyen.push(para);
    else toplam += c;
  }
  return { toplam, cevrilemeyen };
}

export function gecenAylikToplam(durum, bugunT = bugunFn()) {
  const gecen = ayEkleGuvenli(bugunT, -1, bugunT.getDate());
  const bas = new Date(gecen.getFullYear(), gecen.getMonth(), 1, 12);
  const bit = new Date(gecen.getFullYear(), gecen.getMonth() + 1, 0, 12);
  const out = {};
  for (const a of durum.abonelikler || []) {
    if (!senaryoDahil(a)) continue;
    const capa = tarihAyikla(a.sonOdemeTarihi);
    if (!capa) continue;
    if (gunFarkiYerel(gecen, capa) > 0 && a.durum === 'iptal') continue;
    const p = a.paraBirimi || 'TRY';
    out[p] = (out[p] || 0) + aylikTutar(a);
  }
  return out;
}

function gunFarkiYerel(a, b) {
  return Math.round((a - b) / 86400000);
}

export function ozet(durum, bugunT = bugunFn()) {
  const liste = durum.abonelikler || [];
  const aktifler = liste.filter(senaryoDahil);

  const aylikToplam = {};
  const yillikToplam = {};
  const otuzGunOdemeleri = {};
  const kullanilmayanMaliyet = {};
  const kullanilmayanEsik = durum.esikler?.kullanimsizGun ?? 30;

  for (const a of aktifler) {
    const p = a.paraBirimi || 'TRY';
    ekle(aylikToplam, p, aylikTutar(a));
    ekle(yillikToplam, p, yillikTutar(a));
    const kTarih = tarihAyikla(a.sonKullanimTarihi);
    if (kTarih && gunFarkiYerel(bugunT, kTarih) >= kullanilmayanEsik) {
      ekle(kullanilmayanMaliyet, p, aylikTutar(a));
    }
  }

  // Önümüzdeki 30 gün (yarın → +30 gün dahil) gerçek ödeme tarihleri
  const yarin = gunEkle(bugunT, 0);
  const bitis = gunEkle(bugunT, 30);
  for (const a of aktifler) {
    const p = a.paraBirimi || 'TRY';
    for (const o of seri(a, yarin, bitis)) ekle(otuzGunOdemeleri, p, o.tutar);
  }

  const gecen = gecenAylikToplam(durum, bugunT);
  const anahtar = Object.keys(aylikToplam).sort((x, y) => (aylikToplam[y] || 0) - (aylikToplam[x] || 0))[0] || 'TRY';
  const simdiki = aylikToplam[anahtar] || 0;
  const onceki = gecen[anahtar] || 0;
  const degisimYuzde = onceki > 0 ? ((simdiki - onceki) / onceki) * 100 : null;

  return {
    aylikToplam,
    yillikToplam,
    otuzGunOdemeleri,
    kullanilmayanMaliyet,
    aktifSayi: aktifler.length,
    toplamSayi: liste.length,
    iptalSayi: liste.filter(a => a.durum === 'iptal').length,
    anaParaBirimi: anahtar,
    gecenAyaGoreDegisim: {
      yuzde: degisimYuzde,
      mutlak: simdiki - onceki,
      onceki
    }
  };
}

// döngüsel import olmadan seri üretimi (tarih.js'ten)
let _seri;
export function seriBagla(fn) { _seri = fn; }
function seri(a, bas, bit) { return _seri ? _seri(a, bas, bit) : []; }
