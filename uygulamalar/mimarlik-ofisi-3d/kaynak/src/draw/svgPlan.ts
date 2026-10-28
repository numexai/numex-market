/**
 * SVG çizim motoru — AutoCAD estetiğinde TEMSİLÎ teknik çizimler üretir.
 * Tüm çizimler aynı planData geometrisinden çizilir; hiçbiri gerçek bir
 * AutoCAD (.dwg) dosyası değildir, site içinde bu açıkça belirtilir.
 */

import type { KatPlan, Duvar, Mahal } from '../scene/planData';
import { aciklikKonum, duvarUzunluk } from '../scene/planData';

const CIZGI = '#33302c';
const INCE = '#6f6a62';
const AKS = '#9a6f3f';
const MAHAL_DOLGU: Record<Mahal['tip'], string> = {
  yasam: '#f0e2cc',
  islak: '#dfe7ea',
  yatak: '#e8e0d2',
  servis: '#e3ded3',
  sirkulasyon: '#f6f2ea',
  dis: '#ffffff',
};

export type CizimSecenek = {
  /** ölçü çizgileri gösterilsin mi */ olcu?: boolean;
  /** aks çizgileri gösterilsin mi */ akslar?: boolean;
  /** mahal isimleri gösterilsin mi */ etiket?: boolean;
  /** duvar kalınlıkları vurgulansın (poché) */ dolgu?: boolean;
  /** ölçek yazısı */ olcek?: string;
  /** pafta başlığı */ baslik?: string;
  /** çizim türü: plan | kesit | cephe | sema */ tur?: string;
};

/** Plan koordinatını SVG koordinatına çevirir (mm'ye ölçeklenmiş) */
function olcekle(v: number): number {
  return v * 52;
}

const PX = 52; // metre → piksel

function svgAcilis(w: number, h: number, pad: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w + pad * 2} ${
    h + pad * 2
  }" role="img">`;
}

/* ------------------------------------------------------------------ */
/* DUVAR ÇİZİMİ                                                        */
/* ------------------------------------------------------------------ */
function duvarCiz(d: Duvar): string {
  const x2 = olcekle(d.x2);
  const z2 = olcekle(d.z2);
  const t = olcekle(d.t);
  const kalinlik = d.ic ? 2.2 : 4.6;

  // Açıklıklar duvarı parçalara böler
  const parcalar: { x1: number; z1: number; x2: number; z2: number; tip?: string }[] = [];
  const len = duvarUzunluk(d);
  const yonx = len ? (d.x2 - d.x1) / len : 0;
  const yonz = len ? (d.z2 - d.z1) / len : 0;
  const acikliklar = (d.acikliklar ?? []).slice().sort((a, b) => a.ofset - b.ofset);

  let imlec = 0;
  for (const a of acikliklar) {
    if (a.ofset > imlec) {
      parcalar.push({
        x1: olcekle(d.x1 + yonx * imlec),
        z1: olcekle(d.z1 + yonz * imlec),
        x2: olcekle(d.x1 + yonx * a.ofset),
        z2: olcekle(d.z1 + yonz * a.ofset),
      });
    }
    const k = aciklikKonum(d, a);
    parcalar.push({
      x1: olcekle(k.bas.x),
      z1: olcekle(k.bas.z),
      x2: olcekle(k.son.x),
      z2: olcekle(k.son.z),
      tip: a.tip,
    });
    imlec = a.ofset + a.genislik;
  }
  if (imlec < len) {
    parcalar.push({
      x1: olcekle(d.x1 + yonx * imlec),
      z1: olcekle(d.z1 + yonz * imlec),
      x2: x2,
      z2: z2,
    });
  }

  let out = '';
  for (const p of parcalar) {
    if (p.tip === 'pencere') {
      // pencere: ince çift çizgi
      out += `<line x1="${p.x1}" y1="${p.z1}" x2="${p.x2}" y2="${p.z2}" stroke="${CIZGI}" stroke-width="${t}" stroke-opacity="0.18"/>`;
      out += `<line x1="${p.x1}" y1="${p.z1}" x2="${p.x2}" y2="${p.z2}" stroke="${CIZGI}" stroke-width="1.2"/>`;
      out += `<line x1="${p.x1}" y1="${p.z1}" x2="${p.x2}" y2="${p.z2}" stroke="#fbf8f2" stroke-width="${t * 0.55}"/>`;
    } else if (p.tip === 'kapi') {
      // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "kapı detayı yok"): kapı yalnız düz bir çizgi +
      // yay idi; AutoCAD dilinde okunur bir kapı gösterimi için: açıklık sınır çizgileri (kasa),
      // 90° açılı kanat, kanat yayı ve eşik çizgisi eklendi.
      const gen = Math.hypot(p.x2 - p.x1, p.z2 - p.z1);
      const aci = (Math.atan2(p.z2 - p.z1, p.x2 - p.x1) * 180) / Math.PI;
      out += `<g transform="translate(${p.x1} ${p.z1}) rotate(${aci})">`;
      out += `<line x1="0" y1="${-t / 2}" x2="0" y2="${t / 2}" stroke="${CIZGI}" stroke-width="1.4"/>`;
      out += `<line x1="${gen}" y1="${-t / 2}" x2="${gen}" y2="${t / 2}" stroke="${CIZGI}" stroke-width="1.4"/>`;
      out += `<line x1="0" y1="0" x2="0" y2="${gen}" stroke="${CIZGI}" stroke-width="1.8" stroke-linecap="round"/>`;
      out += `<path d="M0 ${gen} A ${gen} ${gen} 0 0 1 ${gen} 0" fill="none" stroke="${INCE}" stroke-width="0.7" stroke-dasharray="2.5 2.5"/>`;
      out += `<line x1="0" y1="0" x2="${gen}" y2="0" stroke="${INCE}" stroke-width="0.5" opacity="0.6"/>`;
      out += `</g>`;
    } else {
      out += `<line x1="${p.x1}" y1="${p.z1}" x2="${p.x2}" y2="${p.z2}" stroke="${CIZGI}" stroke-width="${t}" stroke-linecap="butt"/>`;
      out += `<line x1="${p.x1}" y1="${p.z1}" x2="${p.x2}" y2="${p.z2}" stroke="#fbf8f2" stroke-width="${Math.max(
        t - kalinlik,
        0.4
      )}" stroke-linecap="butt"/>`;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* PLAN ÇİZİMİ                                                         */
/* ------------------------------------------------------------------ */
export function planCiz(kat: KatPlan, sec: CizimSecenek = {}): string {
  const { olcu = true, akslar = true, etiket = true, dolgu = true, olcek = '1/50' } = sec;
  const W = olcekle(kat.genislik);
  const H = olcekle(kat.derinlik);
  const pad = olcu ? 92 : 44;

  let s = svgAcilis(W, H, pad);
  s += `<title>${kat.ad} — temsili mimari plan (AutoCAD tarzı)</title>`;
  s += `<rect x="${-pad}" y="${-pad}" width="${W + pad * 2}" height="${H + pad * 2}" fill="#fbf8f2"/>`;

  // mahal dolguları + isimleri
  for (const m of kat.mahaller) {
    if (m.w <= 0 || m.d <= 0) continue;
    const x = olcekle(m.x);
    const z = olcekle(m.z);
    const w = olcekle(m.w);
    const d = olcekle(m.d);
    if (dolgu) {
      s += `<rect x="${x}" y="${z}" width="${w}" height="${d}" fill="${MAHAL_DOLGU[m.tip]}" opacity="0.75"/>`;
    }
    if (etiket) {
      s += `<text x="${x + w / 2}" y="${z + d / 2}" font-family="Inter, sans-serif" font-size="11.5" fill="${
        m.tip === 'islak' ? '#3c5058' : '#4a453e'
      }" text-anchor="middle" letter-spacing="0.06em">${m.ad}</text>`;
    }
  }

  // aks çizgileri
  if (akslar) {
    const aksAdlari = ['A', 'B', 'C', 'D', 'E', 'F'];
    const dikeyAkslar = [0, 0.25, 0.5, 0.75, 1];
    dikeyAkslar.forEach((f, i) => {
      const x = olcekle(kat.genislik * f);
      s += `<line x1="${x}" y1="${-26}" x2="${x}" y2="${H + 26}" stroke="${AKS}" stroke-width="0.7" stroke-dasharray="16 5 3 5" opacity="0.85"/>`;
      s += `<circle cx="${x}" cy="${-34}" r="11" fill="#fbf8f2" stroke="${AKS}" stroke-width="0.9"/>`;
      s += `<text x="${x}" y="${-30}" font-family="Inter, sans-serif" font-size="11" fill="${AKS}" text-anchor="middle">${aksAdlari[i]}</text>`;
    });
    const yatayAkslar = [0, 0.5, 1];
    yatayAkslar.forEach((f, i) => {
      const z = olcekle(kat.derinlik * f);
      s += `<line x1="${-26}" y1="${z}" x2="${W + 26}" y2="${z}" stroke="${AKS}" stroke-width="0.7" stroke-dasharray="16 5 3 5" opacity="0.85"/>`;
      s += `<circle cx="${-34}" cy="${z}" r="11" fill="#fbf8f2" stroke="${AKS}" stroke-width="0.9"/>`;
      s += `<text x="${-34}" y="${z + 4}" font-family="Inter, sans-serif" font-size="11" fill="${AKS}" text-anchor="middle">${i + 1}</text>`;
    });
  }

  // duvarlar
  for (const d of kat.duvarlar) s += duvarCiz(d);

  // mobilya temsilleri
  for (const f of kat.mobilyalar ?? []) {
    const x = olcekle(f.x);
    const z = olcekle(f.z);
    const w = olcekle(f.w);
    const d = olcekle(f.d);
    s += `<rect x="${x}" y="${z}" width="${w}" height="${d}" fill="none" stroke="${INCE}" stroke-width="0.9" stroke-dasharray="${
      f.tip === 'ada' ? '0' : '4 3'
    }"/>`;
    if (f.tip === 'kanepe' || f.tip === 'yatak') {
      s += `<line x1="${x + 4}" y1="${z + 4}" x2="${x + w - 4}" y2="${z + 4}" stroke="${INCE}" stroke-width="0.7"/>`;
    }
  }

  // ölçü çizgileri
  if (olcu) {
    s += olcuZinciri(0, W, H + 46, 'x', kat.genislik);
    s += olcuZinciri(0, W, H + 76, 'x', kat.genislik, true);
    s += olcuZinciri(0, H, -56, 'z', kat.derinlik);
    s += olcuZinciri(0, H, -86, 'z', kat.derinlik, true);
  }

  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "pafta yazısı plana biniyor"): pafta yazısı SVG'nin
  // İÇİNE yazılıyordu; kartta ayrıca HTML pafta etiketi varken iki yazı üst üste biniyor ve
  // çizimin köşesini kirletiyordu. Yazı artık yalnız kart etiketinde (.proje-gorsel__pafta).
  void olcek;
  void pad;
  s += `</svg>`;
  return s;
}

/** Ölçü zinciri çizer */
function olcuZinciri(
  bas: number,
  son: number,
  konum: number,
  eksen: 'x' | 'z',
  toplam: number,
  genel = false
): string {
  const adim = genel ? son - bas : (son - bas) / 4;
  let s = '';
  const capraz = (p: number, k: number) => {
    if (eksen === 'x') {
      return `<line x1="${p}" y1="${k - 4}" x2="${p}" y2="${k + 4}" stroke="${INCE}" stroke-width="1"/>`;
    }
    return `<line x1="${k - 4}" y1="${p}" x2="${k + 4}" y2="${p}" stroke="${INCE}" stroke-width="1"/>`;
  };

  if (eksen === 'x') {
    s += `<line x1="${bas}" y1="${konum}" x2="${son}" y2="${konum}" stroke="${INCE}" stroke-width="0.8"/>`;
  } else {
    s += `<line x1="${konum}" y1="${bas}" x2="${konum}" y2="${son}" stroke="${INCE}" stroke-width="0.8"/>`;
  }

  const noktalar = genel ? [bas, son] : [bas, bas + adim, bas + adim * 2, bas + adim * 3, son];
  for (const p of noktalar) {
    s += capraz(p, konum);
    // uzatma çizgisi
    if (eksen === 'x') {
      s += `<line x1="${p}" y1="${konum - 8}" x2="${p}" y2="${konum - 18}" stroke="${INCE}" stroke-width="0.5" opacity="0.5"/>`;
    } else {
      s += `<line x1="${konum + 8}" y1="${p}" x2="${konum + 18}" y2="${p}" stroke="${INCE}" stroke-width="0.5" opacity="0.5"/>`;
    }
  }

  for (let i = 0; i < noktalar.length - 1; i++) {
    const a = noktalar[i];
    const b = noktalar[i + 1];
    const m = (a + b) / 2;
    const metre = ((b - a) / PX).toFixed(2).replace('.', ',');
    if (eksen === 'x') {
      s += `<text x="${m}" y="${konum - 5}" font-family="Inter, sans-serif" font-size="9" fill="${INCE}" text-anchor="middle">${metre}</text>`;
    } else {
      s += `<text x="${konum - 6}" y="${m + 3}" font-family="Inter, sans-serif" font-size="9" fill="${INCE}" text-anchor="middle" transform="rotate(-90 ${konum - 6} ${m + 3})">${metre}</text>`;
    }
  }

  if (genel) {
    const m = ((son - bas) / PX).toFixed(2).replace('.', ',');
    if (eksen === 'x') {
      s += `<text x="${(bas + son) / 2}" y="${konum + 16}" font-family="Inter, sans-serif" font-size="10" fill="${CIZGI}" text-anchor="middle" font-weight="600">${m} m</text>`;
    } else {
      s += `<text x="${konum - 16}" y="${(bas + son) / 2}" font-family="Inter, sans-serif" font-size="10" fill="${CIZGI}" text-anchor="middle" font-weight="600" transform="rotate(-90 ${konum - 16} ${
        (bas + son) / 2
      })">${m} m</text>`;
    }
    void toplam;
  }
  return s;
}
