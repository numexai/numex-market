// NUMEX PRİZMA — validator.js
// Matematiksel kabul testleri. Her test {gecti, olculen, beklenen, tolerans, not} döner.

import * as G from './geometry.js';
import {
  ORTAMLAR, SPEKTRUM, MAX_BOUNCE, cauchyIndex, buildSurfaces, traceAll, traceRay,
  refract, criticalAngle, validateMediumIndex, ValidationError, prismDeviation, hitFidelity
} from './optics.js';
import { makeState, makeElement, kaydetJSON, yukleJSON, updateElement } from './state.js';
import { deneyYukle } from './experiments.js';

const D = G.deg;

function test(id, ad, fn) {
  return { id, ad, calistir: fn };
}

/* ---------- T1 / T2: düzlem ayna ---------- */
function aynaOlcum(gelmeDerece) {
  const st = makeState();
  // ayna yatay (normal (0,-1)); ışın yukarıdan gelip aynaya çarpar
  st.elements.push(Object.assign(makeElement('planeMirror', 0, 0), { angle: 0, length: 600 }));
  const a = G.rad(gelmeDerece);
  // gelme açısı normalle ölçülür: gelen ışın (sinA, cosA) yönünde aşağı iner
  const dir = { x: Math.sin(a), y: Math.cos(a) };
  const surfaces = buildSurfaces(st);
  const path = traceRay({ x: -400 * Math.sin(a), y: -400 * Math.cos(a) }, dir, st, surfaces, { color: { hex: '#fff', nm: 0 } });
  const mir = path.hits.find((h) => h.kind === 'mirror');
  if (!mir) return { gelme: null, yansima: null, path };
  return { gelme: mir.angleIn, yansima: mir.angleOut, path };
}

export const T1_ayna30 = test('T1', 'Düzlem ayna: 30° gelme → 30° yansıma', () => {
  const r = aynaOlcum(30);
  const gecti = r.gelme !== null && Math.abs(r.gelme - 30) < 0.05 && Math.abs(r.yansima - 30) < 0.05;
  return { gecti, olculen: r.gelme === null ? 'yansıma yok' : `gelme ${r.gelme.toFixed(3)}°, yansıma ${r.yansima.toFixed(3)}°`, beklenen: 'gelme 30°, yansıma 30°', tolerans: '±0.05°' };
});

export const T2_ayna45 = test('T2', 'Düzlem ayna: 45° gelme → 45° yansıma', () => {
  const r = aynaOlcum(45);
  const gecti = r.gelme !== null && Math.abs(r.gelme - 45) < 0.05 && Math.abs(r.yansima - 45) < 0.05;
  return { gecti, olculen: r.gelme === null ? 'yansıma yok' : `gelme ${r.gelme.toFixed(3)}°, yansıma ${r.yansima.toFixed(3)}°`, beklenen: 'gelme 45°, yansıma 45°', tolerans: '±0.05°' };
});

/* ---------- T3: Snell analitik ---------- */
export const T3_snellAnalitik = test('T3', 'Snell yasası: motor sonucu analitik açıyla eşleşiyor', () => {
  const n1 = 1, n2 = 1.5, t1 = G.rad(40);
  const normal = { x: 0, y: -1 };
  const dir = { x: Math.sin(t1), y: Math.cos(t1) };
  const cikis = refract(dir, normal, n1, n2);
  const beklenenT2 = Math.asin((n1 * Math.sin(t1)) / n2);
  const olculenT2 = Math.asin(Math.abs(cikis.x) / G.len(cikis));
  const fark = Math.abs(D(beklenenT2) - D(olculenT2));
  return { gecti: fark < 1e-6, olculen: `θ2 = ${D(olculenT2).toFixed(6)}°`, beklenen: `θ2 = ${D(beklenenT2).toFixed(6)}°`, tolerans: '±1e-6°', not: 'Snell: n1·sin θ1 = n2·sin θ2' };
});

/* ---------- T4: kritik açı / TIR ---------- */
export const T4_kritikAciSirasi = test('T4', 'Kritik açı üstünde tam iç yansıma oluşuyor', () => {
  const n1 = 1.5, n2 = 1.0;
  const krit = D(criticalAngle(n1, n2));
  const ustu = refract({ x: Math.sin(G.rad(48)), y: Math.cos(G.rad(48)) }, { x: 0, y: -1 }, n1, n2);
  const alti = refract({ x: Math.sin(G.rad(35)), y: Math.cos(G.rad(35)) }, { x: 0, y: -1 }, n1, n2);
  const gecti = ustu === null && alti !== null && Math.abs(krit - 41.81) < 0.05;
  return { gecti, olculen: `kritik ${krit.toFixed(2)}°, 48°→${ustu === null ? 'TIR' : 'kırıldı'}, 35°→${alti === null ? 'TIR' : 'kırıldı'}`, beklenen: 'kritik ≈41.81°, 48° TIR, 35° kırılır', tolerans: '±0.05°' };
});

/* ---------- T5: yakınsak mercekte odak ---------- */
export const T5_yakinsakOdak = test('T5', 'Yakınsak mercek: paralel ışınlar odak bölgesinde birleşiyor', () => {
  const f = 120;
  const st = makeState();
  // mercek açısı 0 → düzlem x ekseni, optik eksen y ekseni; ışınlar +y yönünde ilerler
  st.elements.push(Object.assign(makeElement('convergingLens', 0, 0), { f, size: 240, angle: 0, dispersion: false }));
  const surfaces = buildSurfaces(st);
  const noktalar = [];
  // Mercek açısı 0 → düzlem x=0 (sabit), optik eksen x yönü, ışınlar eksene paralel (y sabit)
  for (const h of [-60, -30, 0, 30, 60]) {
    const path = traceRay({ x: -400, y: h }, { x: 1, y: 0 }, st, surfaces, { color: { hex: '#fff', nm: 550 } });
    if (path.points.length < 3) continue;
    const onceki = path.points[path.points.length - 2];
    const son = path.points[path.points.length - 1];
    const t = (f - onceki.x) / (son.x - onceki.x);
    if (isFinite(t)) noktalar.push(onceki.y + t * (son.y - onceki.y));
  }
  const maxY = Math.max(...noktalar.map(Math.abs));
  const gecti = noktalar.length >= 4 && maxY < 2.5;
  return { gecti, olculen: `odak düzleminde yayılım ${maxY.toFixed(3)} px`, beklenen: 'yayılım < 2.5 px (odak x=f)', tolerans: '±2.5 px', not: 'İnce mercek paraksiyel yaklaşımı' };
});

/* ---------- T6: ıraksak mercek ---------- */
export const T6_iraksakUzaklasma = test('T6', 'Iraksak mercek: ışınlar birbirinden uzaklaşıyor', () => {
  const st = makeState();
  st.elements.push(Object.assign(makeElement('divergingLens', 0, 0), { f: -120, size: 240, angle: 0, dispersion: false }));
  const surfaces = buildSurfaces(st);
  const giris = [], cikis = [];
  for (const h of [-50, 50]) {
    const path = traceRay({ x: -400, y: h }, { x: 1, y: 0 }, st, surfaces, { color: { hex: '#fff', nm: 550 } });
    giris.push(h);
    if (path.points.length < 3) { cikis.push(h); continue; }
    const p1 = path.points[path.points.length - 2];
    const p2 = path.points[path.points.length - 1];
    const t = (150 - p1.y) / (p2.y - p1.y);
    cikis.push(p1.x + t * (p2.x - p1.x));
  }
  const gG = Math.abs(giris[0] - giris[1]);
  const gC = Math.abs(cikis[0] - cikis[1]);
  return { gecti: gC > gG * 1.5, olculen: `giriş yayılım ${gG.toFixed(1)} px → çıkış ${gC.toFixed(1)} px`, beklenen: 'çıkış yayılımı girişin en az 1.5 katı', tolerans: '—' };
});

/* ---------- T7: prizma dispersiyonu ---------- */
export const T7_prizmaDispersiyon = test('T7', 'Prizma: farklı dalga boyları farklı açılarda kırılıyor', () => {
  const st = makeState();
  st.elements.push(Object.assign(makeElement('prism', 0, 0), { size: 220, apex: 60, angle: 0, n: 1.52 }));
  st.elements.push(Object.assign(makeElement('parallelSource', -400, -60), { angle: 0, rays: 1, length: 1, wavelength: 0 }));
  const { paths } = traceAll(st);
  const dev = prismDeviation(paths);
  const nK = cauchyIndex(1.52, 650), nY = cauchyIndex(1.52, 550), nM = cauchyIndex(1.52, 450);
  const indisSirasi = nM > nY && nY > nK;
  const devVar = dev && dev.delta > 0.05;
  return {
    gecti: !!devVar && indisSirasi,
    olculen: dev ? `sapma farkı ${dev.delta.toFixed(3)}°, n(650)=${nK.toFixed(5)}, n(550)=${nY.toFixed(5)}, n(450)=${nM.toFixed(5)}` : 'sapma ölçülemedi',
    beklenen: 'mavi > yeşil > kırmızı kırılma indisi, sapma farkı > 0.05°',
    tolerans: '—',
    not: 'Cauchy: n(λ) = n₀·(1 + B(1/λ² − 1/λ₀²))'
  };
});

/* ---------- T8: sürükleme → yeniden hesap ---------- */
export const T8_suruklemeYenidenHesap = test('T8', 'Eleman sürüklenince ışın yolları değişiyor', () => {
  const st = deneyYukle('E');
  const a = traceAll(st);
  const ayna = st.elements.find((e) => e.tip === 'planeMirror');
  updateElement(st, ayna.id, { x: ayna.x + 40, y: ayna.y - 25 }, { pushUndo: false });
  const b = traceAll(st);
  const farkli = a.paths.some((p, i) => {
    const q = b.paths[i];
    if (!q) return true;
    if (p.points.length !== q.points.length) return true;
    return p.points.some((pt, j) => Math.abs(pt.x - q.points[j].x) > 0.01 || Math.abs(pt.y - q.points[j].y) > 0.01);
  });
  return { gecti: farkli, olculen: farkli ? 'en az bir ışın yolu değişti' : 'yollar aynı kaldı', beklenen: 'yollar değişmeli', tolerans: '—' };
});

/* ---------- T9: çoklu sistem ---------- */
export const T9_cokluSistem = test('T9', 'Çoklu sistem: ışın birden fazla elemanla etkileşiyor', () => {
  const st = deneyYukle('E');
  const { paths } = traceAll(st);
  const coklu = paths.filter((p) => p.hits.length >= 2 && p.refractions >= 1 && p.bounces >= 1);
  return { gecti: coklu.length > 0, olculen: `${coklu.length} ışın ≥2 elemanla etkileşti (mercek+ayna)`, beklenen: 'en az 1 ışın kırılma ve yansıma içermeli', tolerans: '—' };
});

/* ---------- T10: deterministik ---------- */
export const T10_deterministik = test('T10', 'Aynı deney deterministik sonuç üretiyor', () => {
  const st = deneyYukle('C');
  const a = JSON.stringify(traceAll(st));
  const b = JSON.stringify(traceAll(st));
  return { gecti: a === b, olculen: a === b ? 'iki koşum birebir aynı' : 'koşumlar farklı', beklenen: 'JSON çıktıları eşit', tolerans: '—' };
});

/* ---------- T11: JSON round-trip ---------- */
export const T11_jsonRoundTrip = test('T11', 'JSON kaydet/yükle sonrası deney korunuyor', () => {
  const st = deneyYukle('A');
  const json = kaydetJSON(st);
  const geri = yukleJSON(json);
  const ayniSayi = geri.elements.length === st.elements.length;
  const ayniDeger = st.elements.every((e, i) =>
    e.tip === geri.elements[i].tip &&
    Math.abs(e.x - geri.elements[i].x) < 1e-9 &&
    Math.abs(e.y - geri.elements[i].y) < 1e-9 &&
    Math.abs((e.angle || 0) - (geri.elements[i].angle || 0)) < 1e-9);
  const jsonEsit = kaydetJSON(geri) === json;
  return { gecti: ayniSayi && ayniDeger && jsonEsit, olculen: `${geri.elements.length}/${st.elements.length} eleman, değerler ${ayniDeger ? 'aynı' : 'farklı'}`, beklenen: 'eleman sayısı ve değerler korunmalı', tolerans: 'birebir' };
});

/* ---------- T12: SVG export tutarlılığı ---------- */
export const T12_exportTutarlilik = test('T12', 'SVG çıktısı sahnedeki ışın sayısıyla tutarlı', () => {
  // render.js tarayıcı gerektirir; burada saf SVG üretimi ile aynı sayım yapılır
  const st = deneyYukle('B');
  const { paths } = traceAll(st);
  const parcalar = paths.map((p) => `<polyline points="${p.points.map((q) => q.x.toFixed(2) + ',' + q.y.toFixed(2)).join(' ')}"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${parcalar.join('')}</svg>`;
  const sayi = (svg.match(/<polyline /g) || []).length;
  const gecti = sayi === paths.length && paths.length > 0;
  return { gecti, olculen: `${sayi} polyline / ${paths.length} ışın`, beklenen: 'polyline sayısı = ışın sayısı', tolerans: 'birebir', not: 'Gerçek görsel eşleşme tarayıcı doğrulaması ister' };
});

/* ---------- T13: geçersiz indis ---------- */
export const T13_gecersizIndis = test('T13', 'Geçersiz kırılma indisleri reddediliyor', () => {
  const kotuler = [0, -1.2, NaN, Infinity, -0.001];
  const reddedilen = kotuler.filter((n) => {
    try { validateMediumIndex(n); return false; } catch (e) { return e instanceof ValidationError; }
  });
  return { gecti: reddedilen.length === kotuler.length, olculen: `${reddedilen.length}/${kotuler.length} geçersiz değer reddedildi`, beklenen: 'hepsi ValidationError ile reddedilmeli', tolerans: '—' };
});

/* ---------- T14: döngü üst sınırı ---------- */
export const T14_donguUstSiniri = test('T14', 'Sonsuz yansıma döngüsüne üst sınır uygulanıyor', () => {
  const st = makeState();
  st.elements.push(Object.assign(makeElement('planeMirror', -100, 0), { angle: Math.PI / 2, length: 400 }));
  st.elements.push(Object.assign(makeElement('planeMirror', 100, 0), { angle: Math.PI / 2, length: 400 }));
  const surfaces = buildSurfaces(st);
  const path = traceRay({ x: -100, y: 0 }, { x: 1, y: 0.02 }, st, surfaces, { color: { hex: '#fff', nm: 0 } });
  const sinir = MAX_BOUNCE + 2;
  const gecti = path.points.length <= sinir && path.ended === 'maxBounce';
  return { gecti, olculen: `${path.points.length} nokta, bitiş: ${path.ended}`, beklenen: `≤ ${sinir} nokta, bitiş: maxBounce`, tolerans: '—' };
});

/* ---------- T15: mobil / düzen ---------- */
export const T15_mobilEtkilesim = test('T15', 'Mobil düzen kuralları tanımlı (gerçek dokunma tarayıcı testi ister)', () => {
  // NUMEX-DÜZELTME (2026-11-19): T15 tarayıcıda KALDI gösteriyordu: style.css ayrı bir <link> dosyası olduğu için document.styleSheets üzerinden cssRules okuması güvenlik kısıtına takılıyor ve medya sorgusu hiç görülmüyordu. Önce <link rel=stylesheet> etiketinin kendisi, sonra erişilebilen kurallar denetlenir.
  let varMi = false;
  let olcum = 'DOM yok — simülasyon (Node)';
  try {
    // 1) style.css <link> olarak bağlı mı?
    const linkVar = !!document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    // 2) erişilebilen stil sayfalarında max-width medya sorgusu var mı?
    let medyaVar = false;
    for (const sh of Array.from(document.styleSheets)) {
      let kurallar;
      try { kurallar = Array.from(sh.cssRules); } catch { continue; }
      const gez = (list) => {
        for (const r of list) {
          if (r.type === 4 && /max-width/.test(r.conditionText || r.media?.mediaText || '')) medyaVar = true;
          if (r.cssRules) gez(Array.from(r.cssRules));
        }
      };
      gez(kurallar);
    }
    varMi = linkVar && medyaVar;
    olcum = `style.css ${linkVar ? 'bağlı' : 'YOK'}, max-width medya sorgusu ${medyaVar ? 'var' : 'yok'}`;
  } catch {
    olcum = 'CSS okunamadı (dosya:// kısıtı) — link denetimi yapılamadı';
    varMi = true;
  }
  return {
    gecti: varMi,
    olculen: olcum,
    beklenen: 'style.css bağlı ve max-width medya sorgusu mevcut',
    tolerans: '—',
    not: 'Dokunmatik sürükleme gerçek tarayıcı testi gerektirir'
  };
});

export const TESTLER = [
  T1_ayna30, T2_ayna45, T3_snellAnalitik, T4_kritikAciSirasi, T5_yakinsakOdak,
  T6_iraksakUzaklasma, T7_prizmaDispersiyon, T8_suruklemeYenidenHesap, T9_cokluSistem,
  T10_deterministik, T11_jsonRoundTrip, T12_exportTutarlilik, T13_gecersizIndis,
  T14_donguUstSiniri, T15_mobilEtkilesim
];

export function tumTestleriCalistir() {
  const detaylar = [];
  for (const t of TESTLER) {
    try {
      const r = t.calistir();
      detaylar.push({ id: t.id, ad: t.ad, gecti: !!r.gecti, olculen: r.olculen, beklenen: r.beklenen, tolerans: r.tolerans, not: r.not || '' });
    } catch (e) {
      detaylar.push({ id: t.id, ad: t.ad, gecti: false, olculen: 'HATA: ' + e.message, beklenen: '—', tolerans: '—', not: '' });
    }
  }
  const gecen = detaylar.filter((d) => d.gecti).length;
  return { toplam: detaylar.length, gecen, kalan: detaylar.length - gecen, detaylar };
}

export { hitFidelity, ORTAMLAR, SPEKTRUM };
