// Numex — merkezi state + localStorage
import { demoVeriUret } from './demo.js';
import { bugun as bugunFn } from './tarih.js';

const ANAHTAR = 'numex_dedektif_v1';
const YEDEK = 'numex_dedektif_v1_yedek';

export function varsayilanDurum() {
  const b = bugunFn();
  return {
    surum: 1,
    tema: 'koyu',
    abonelikler: [],
    kurlar: { TRY: 1, USD: null, EUR: null },
    esikler: { yillik: 3000, kucukUcret: 60, kullanimsizGun: 30 },
    filtre: { arama: '', kategori: 'hepsi', durum: 'hepsi', paraBirimi: 'hepsi', yalnizZorunlu: false },
    aktifSekme: 'panel',
    takvimAy: { yil: b.getFullYear(), ay0: b.getMonth() },
    demoYuklendi: false,
    sonKaydetme: null
  };
}

let _durum = null; // dikkat: degistir() bunu yeniden atayabildiği için const DEĞİL
const dinleyiciler = new Set();

export function durum() {
  if (!_durum) _durum = yukle();
  return _durum;
}

export function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) {
      const d = varsayilanDurum();
      d.abonelikler = demoVeriUret();
      d.demoYuklendi = true;
      _durum = d;
      kaydet(d);
      return d;
    }
    const p = JSON.parse(ham);
    if (!p || p.surum !== 1 || !Array.isArray(p.abonelikler)) throw new Error('şema');
    const vars = varsayilanDurum();
    const birlesik = {
      ...vars, ...p,
      kurlar: { ...vars.kurlar, ...(p.kurlar || {}) },
      esikler: { ...vars.esikler, ...(p.esikler || {}) },
      filtre: { ...vars.filtre, ...(p.filtre || {}) },
      takvimAy: { ...vars.takvimAy, ...(p.takvimAy || {}) }
    };
    _durum = birlesik;
    return birlesik;
  } catch (e) {
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (ham) localStorage.setItem(YEDEK, ham);
    } catch (e2) { /* yoksay */ }
    const d = varsayilanDurum();
    d.abonelikler = demoVeriUret();
    d.demoYuklendi = true;
    _durum = d;
    return d;
  }
}

let sonHata = null;
export function kaydet(s = durum()) {
  try {
    s.sonKaydetme = new Date().toISOString();
    localStorage.setItem(ANAHTAR, JSON.stringify(s));
    sonHata = null;
    return true;
  } catch (e) {
    sonHata = 'Tarayıcı depolaması dolu olabilir; son değişiklik kalıcı yazılamadı.';
    return false;
  }
}
export function depolamaHatasi() { return sonHata; }

export function aboneOl(fn) {
  dinleyiciler.add(fn);
  return () => dinleyiciler.delete(fn);
}
export function yayinla() {
  for (const fn of dinleyiciler) { try { fn(durum()); } catch (e) { console.error(e); } }
}

// NUMEX-DÜZELTME (2026-11-20): `_durum` const idi, atama "Assignment to constant variable" fırlatıp render'ı çökertiyordu — `let` yapıldı.
export function degistir(fn) {
  if (!_durum) _durum = yukle();
  fn(_durum);
  kaydet(_durum);
  yayinla();
  return _durum;
}

export function yeniId() {
  if (window.crypto && crypto.randomUUID) return 'ab_' + crypto.randomUUID().slice(0, 8);
  return 'ab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function abonelikEkle(veri) {
  return degistir(d => {
    d.abonelikler.push({ id: yeniId(), senaryo: 'koru', odemeler: {}, durum: 'aktif', ...veri });
  });
}

export function abonelikGuncelle(id, veri) {
  return degistir(d => {
    const i = d.abonelikler.findIndex(a => a.id === id);
    if (i >= 0) d.abonelikler[i] = { ...d.abonelikler[i], ...veri, id };
  });
}

export function abonelikSil(id) {
  return degistir(d => { d.abonelikler = d.abonelikler.filter(a => a.id !== id); });
}

export function odemeDurumuDegistir(abonelikId, tarihIso, odendi) {
  return degistir(d => {
    const a = d.abonelikler.find(x => x.id === abonelikId);
    if (!a) return;
    a.odemeler = a.odemeler || {};
    if (odendi) a.odemeler[tarihIso] = true;
    else delete a.odemeler[tarihIso];
  });
}

export function kurlarGuncelle(kod, deger) {
  return degistir(d => { d.kurlar[kod] = deger === '' || deger === null ? null : Number(deger); });
}

export function temaDegistir(tema) {
  return degistir(d => { d.tema = tema === 'acik' ? 'acik' : 'koyu'; });
}

export function durumSifirla(yeni) {
  _durum = yeni;
  kaydet(_durum);
  yayinla();
  return _durum;
}

export function durumOrnekle() { return JSON.parse(JSON.stringify(durum())); }
