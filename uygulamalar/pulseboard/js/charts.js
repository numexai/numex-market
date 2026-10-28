/* =========================================================
   PulseBoard — Saf SVG grafikler
   Harici kütüphane yok. Her fonksiyon HTML string döndürür.
   ========================================================= */

import { kacis, gunKisa, kisaTarih, bugunISO } from "./utils.js";

let gradyanSayaci = 0;

/** Tanım bloğu içindeki gradyan kimliğini üretir (çakışmayı önler) */
function gradyanlar() {
  gradyanSayaci += 1;
  const b = `pbBar${gradyanSayaci}`;
  const h = `pbHalka${gradyanSayaci}`;
  return {
    idBar: b,
    idHalka: h,
    tanim: `
      <defs>
        <linearGradient id="${b}" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="55%" stop-color="#2dd4bf"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
        <linearGradient id="${h}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2dd4bf"/>
          <stop offset="55%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
    `,
  };
}

/**
 * Sütun grafiği (haftalık aktivite).
 * @param {Array<{tarih:string, adet:number}>} seri
 * @param {object} [secenek] - { yukseklik, etiketGoster }
 */
export function sutunGrafik(seri, secenek = {}) {
  const veri = Array.isArray(seri) ? seri : [];
  const yukseklik = secenek.yukseklik || 200;
  const ustBosluk = secenek.degerGoster === false ? 14 : 30;
  const altBosluk = 30;
  const genislik = 100; // viewBox birimi; CSS ile ölçeklenir
  const maks = Math.max(1, ...veri.map((v) => Number(v.adet) || 0));
  const adim = genislik / Math.max(1, veri.length);
  const cubukGenislik = Math.min(adim * 0.52, 7);

  const { idBar, tanim } = gradyanlar();
  const bugun = bugunISO();

  const parcalar = [];
  // Yatay kılavuz çizgileri + etiketleri
  const kilavuzSayisi = 3;
  for (let i = 0; i <= kilavuzSayisi; i++) {
    const oran = i / kilavuzSayisi;
    const y = ustBosluk + (100 - ustBosluk - altBosluk) * (1 - oran);
    const deger = Math.round(maks * oran);
    parcalar.push(
      `<line class="izgara-cizgi" x1="0" y1="${y.toFixed(2)}" x2="${genislik}" y2="${y.toFixed(2)}" vector-effect="non-scaling-stroke"/>`,
      `<text class="bar-etiket" x="${genislik}" y="${(y - 2).toFixed(2)}" text-anchor="end" opacity=".7">${deger}</text>`,
    );
  }

  const toplamYukseklik = 100 - ustBosluk - altBosluk;

  veri.forEach((oge, i) => {
    const adet = Number(oge.adet) || 0;
    const oran = adet / maks;
    const h = Math.max(adet > 0 ? 3 : 1.5, toplamYukseklik * oran);
    const x = adim * i + adim / 2;
    const y = 100 - altBosluk - h;
    const bos = adet === 0;
    const doluYazi = adet > 0 && secenek.degerGoster !== false;

    parcalar.push(`
      <g class="grafik-grup">
        <title>${kacis(kisaTarih(oge.tarih))} — ${adet} görev</title>
        <rect class="${bos ? "bar-cubuk bos" : "bar-cubuk"}"
              x="${(x - cubukGenislik / 2).toFixed(2)}" y="${y.toFixed(2)}"
              width="${cubukGenislik.toFixed(2)}" height="${h.toFixed(2)}"
              rx="1.6" ${bos ? "" : `fill="url(#${idBar})"`}/>
        ${doluYazi ? `<text class="bar-deger" x="${x.toFixed(2)}" y="${(y - 3).toFixed(2)}" text-anchor="middle">${adet}</text>` : ""}
        <text class="bar-etiket" x="${x.toFixed(2)}" y="${(100 - 12).toFixed(2)}" text-anchor="middle"
              ${oge.tarih === bugun ? 'fill="#2dd4bf" font-weight="700"' : ""}>${kacis(gunKisa(oge.tarih))}</text>
      </g>
    `);
  });

  return `
    <div class="grafik-sarmal">
      <svg viewBox="0 0 ${genislik} 100" preserveAspectRatio="none"
           style="height:${yukseklik}px" role="img"
           aria-label="${secenek.etiket || "Sütun grafiği"}">
        ${tanim}
        ${parcalar.join("")}
      </svg>
    </div>
  `;
}

/**
 * Alan (çizgi) grafiği — haftalık eğilim.
 */
export function alanGrafik(seri, secenek = {}) {
  const veri = Array.isArray(seri) ? seri : [];
  const yukseklik = secenek.yukseklik || 160;
  if (!veri.length) return `<div class="bos-durum"><p>Gösterilecek veri yok.</p></div>`;

  const { idBar, tanim } = gradyanlar();
  const maks = Math.max(1, ...veri.map((v) => Number(v.adet) || 0));
  const ust = 12;
  const alt = 26;
  const toplam = 100 - ust - alt;
  const adim = 100 / Math.max(1, veri.length - 1 || 1);

  const noktalar = veri.map((o, i) => {
    const x = veri.length === 1 ? 50 : adim * i;
    const y = 100 - alt - toplam * ((Number(o.adet) || 0) / maks);
    return { x, y, ...o };
  });

  const cizgi = noktalar.map((n, i) => `${i === 0 ? "M" : "L"}${n.x.toFixed(2)},${n.y.toFixed(2)}`).join(" ");
  const alan = `${cizgi} L${noktalar[noktalar.length - 1].x.toFixed(2)},${(100 - alt).toFixed(2)} L${noktalar[0].x.toFixed(2)},${(100 - alt).toFixed(2)} Z`;

  const noktaSvg = noktalar
    .map(
      (n) => `
      <g>
        <title>${kacis(kisaTarih(n.tarih))} — ${n.adet} görev</title>
        <circle cx="${n.x.toFixed(2)}" cy="${n.y.toFixed(2)}" r="1.6" fill="#2dd4bf" stroke="var(--zemin-2)" stroke-width=".8"/>
        <text class="bar-etiket" x="${n.x.toFixed(2)}" y="${(100 - 10).toFixed(2)}" text-anchor="middle">${kacis(gunKisa(n.tarih))}</text>
      </g>`,
    )
    .join("");

  return `
    <div class="grafik-sarmal">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="height:${yukseklik}px" role="img"
           aria-label="${secenek.etiket || "Alan grafiği"}">
        ${tanim}
        <defs>
          <linearGradient id="alanDolgu${gradyanSayaci}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(45,212,191,.42)"/>
            <stop offset="100%" stop-color="rgba(45,212,191,0)"/>
          </linearGradient>
        </defs>
        <path d="${alan}" fill="url(#alanDolgu${gradyanSayaci})" stroke="none"/>
        <path d="${cizgi}" fill="none" stroke="url(#${idBar})" stroke-width="1.6" vector-effect="non-scaling-stroke"
              stroke-linecap="round" stroke-linejoin="round"/>
        ${noktaSvg}
      </svg>
    </div>
  `;
}

/**
 * Yüzde halkası (büyük).
 */
export function yuzdeHalkasi(yuzdeDeger, secenek = {}) {
  const deger = Math.max(0, Math.min(100, Math.round(Number(yuzdeDeger) || 0)));
  const yaricap = 54;
  const cevre = 2 * Math.PI * yaricap;
  const dolgu = cevre * (deger / 100);
  const { idHalka, tanim } = gradyanlar();

  return `
    <div class="grafik-sarmal">
      <svg class="halka-buyuk" viewBox="0 0 128 128" role="img"
           aria-label="${secenek.etiket || "Tamamlama oranı"}: %${deger}">
        ${tanim}
        <circle class="zemin" cx="64" cy="64" r="${yaricap}"/>
        <circle class="dolgu" cx="64" cy="64" r="${yaricap}"
                stroke="url(#${idHalka})"
                stroke-dasharray="${cevre.toFixed(2)}"
                stroke-dashoffset="${(cevre - dolgu).toFixed(2)}"/>
      </svg>
    </div>
    <div class="halka-merkez">
      <strong>%${deger}</strong>
      <span>${kacis(secenek.altMetin || "tamamlama oranı")}</span>
    </div>
  `;
}

/**
 * Yatay dağılım çubukları (öncelik / kategori).
 * @param {Array<{ad:string, adet:number, renk?:string}>} satirlar
 */
export function dagilimCubuklari(satirlar, secenek = {}) {
  const liste = Array.isArray(satirlar) ? satirlar : [];
  const toplam = liste.reduce((t, s) => t + (Number(s.adet) || 0), 0);
  if (!liste.length || toplam === 0) {
    return `<div class="bos-durum" style="padding:var(--bosluk-5) var(--bosluk-3)">
      <p>${kacis(secenek.bosMesaj || "Henüz veri yok.")}</p>
    </div>`;
  }

  const satirHtml = liste
    .map((s) => {
      const oran = Math.round(((Number(s.adet) || 0) / toplam) * 100);
      const renkStil = s.renk ? `background:${s.renk}` : "";
      return `
        <div class="kategori-satir">
          <span class="ad" title="${kacis(s.ad)}">${kacis(s.ad)}</span>
          <div class="kategori-bar"><span style="width:${oran}%;${renkStil}"></span></div>
          <span class="sayi">${s.adet}</span>
        </div>`;
    })
    .join("");

  return `<div class="kategori-liste">${satirHtml}</div>`;
}

/**
 * Isı haritası (12 hafta = 84 gün).
 * @param {Array<{tarih:string, gorev:number, aliskanlik:number}>} gunler
 */
export function isiHaritasi(gunler) {
  const liste = Array.isArray(gunler) ? gunler : [];
  if (!liste.length) return "";
  const bugun = bugunISO();

  const maks = Math.max(1, ...liste.map((g) => (g.gorev || 0) + (g.aliskanlik || 0)));

  // Başlangıcı Pazartesi'ye hizala
  const dolguBas = [];
  const hucreler = liste.map((g) => {
    const puan = (g.gorev || 0) + (g.aliskanlik || 0);
    const oran = puan / maks;
    let seviye = 0;
    if (puan > 0) seviye = oran <= 0.25 ? 1 : oran <= 0.5 ? 2 : oran <= 0.75 ? 3 : 4;
    const bugunSinif = g.tarih === bugun ? " bugun" : "";
    return `<div class="isi-hucre seviye-${seviye}${bugunSinif}"
              title="${kacis(kisaTarih(g.tarih))}: ${g.gorev} görev, ${g.aliskanlik} alışkanlık"
              role="img" aria-label="${kacis(kisaTarih(g.tarih))}: ${puan} aktivite">${puan || ""}</div>`;
  });

  return `
    <div class="isi-haritasi">${dolguBas.join("")}${hucreler.join("")}</div>
    <div class="isi-lejant">
      <span>Az</span>
      <i class="s0"></i><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i>
      <span>Çok</span>
    </div>
  `;
}

/**
 * Küçük sparkline (metrik kartları için).
 */
export function sparkline(degerler, secenek = {}) {
  const veri = (Array.isArray(degerler) ? degerler : []).map((v) => Number(v) || 0);
  if (veri.length < 2) return "";
  const maks = Math.max(1, ...veri);
  const adim = 100 / (veri.length - 1);
  const noktalar = veri.map((v, i) => `${(adim * i).toFixed(2)},${(28 - (v / maks) * 24).toFixed(2)}`);
  const renk = secenek.renk || "#2dd4bf";
  return `
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style="width:100%;height:32px"
         aria-hidden="true" focusable="false">
      <polyline points="${noktalar.join(" ")}" fill="none" stroke="${renk}" stroke-width="1.8"
                vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

export default { sutunGrafik, alanGrafik, yuzdeHalkasi, dagilimCubuklari, isiHaritasi, sparkline };
