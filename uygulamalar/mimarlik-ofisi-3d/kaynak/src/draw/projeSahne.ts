/**
 * Proje görsel motoru v2 — kütle (massing) yaklaşımı.
 *
 * NUMEX-DÜZELTME (2026-10-26, ikinci tur): ilk sürümde her duvar ayrı ince plaka
 * olarak çiziliyordu; bina "içi boş kafes" gibi görünüyor, çatısı yoktu ve camlar
 * yüze yapışmış mavi lekeye dönüyordu. Kullanıcı haklı olarak beğenmedi.
 *
 * v2 kuralı: DIŞ KABUK TEK PARÇA KÜTLE olarak çizilir (dolgun cephe yüzeyleri),
 * pencere ve giriş o kabuğun YÜZEYİNE oturur, çatı plakası kütleyi kapatır.
 * İç duvarlar yalnızca üst katı olmayan (tek katlı) projelerde, kesit hissi vermek
 * için ve yalnızca çatının açık bırakılan yarısında gösterilir.
 *
 * Hiçbir hazır model/görsel dosyası kullanılmaz; her şey plan verisinden üretilir.
 */

import type { Aciklik, Duvar, KatPlan } from '../scene/planData';
import { duvarUzunluk } from '../scene/planData';

type Nokta = { x: number; y: number };

export function altTon(hex: string, miktar: number): string {
  const n = hex.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + miktar));
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + miktar));
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + miktar));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const aci = Math.PI / 6;

function izo(x: number, z: number, y: number, olcek: number, ox: number, oy: number): Nokta {
  return {
    x: ox + (x - z) * Math.cos(aci) * olcek,
    y: oy + (x + z) * Math.sin(aci) * olcek - y * olcek,
  };
}

function yol(p: Nokta[]): string {
  return p.map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x.toFixed(1)} ${n.y.toFixed(1)}`).join(' ') + ' Z';
}

/* ------------------------------------------------------------------ */
/* CEPHE — kütlenin yüzeyine oturan pencere / kapı / doku              */
/* ------------------------------------------------------------------ */

type Yuzey = {
  /** yüzeyin sol-alt köşesi (m) */ x: number;
  z: number;
  /** yatay uzunluk (m) */ genislik: number;
  /** yükseklik (m) */ yuk: number;
  /** yatay birim vektör */ dx: number;
  dz: number;
  /** dışa bakan normal */ nx: number;
  nz: number;
  /** taban kotu */ taban: number;
  renk: string;
};

/** Bir duvarın dış yüzeyini tanımlar (kütlenin hangi cephesi olduğu) */
function yuzey(d: Duvar, taban: number, yuk: number, renk: string): Yuzey {
  const len = duvarUzunluk(d);
  const dx = (d.x2 - d.x1) / len;
  const dz = (d.z2 - d.z1) / len;
  // dışa bakan normal: duvarın dış tarafı
  const nx = -dz;
  const nz = dx;
  return { x: d.x1, z: d.z1, genislik: len, yuk, dx, dz, nx, nz, taban, renk };
}

/** Yüzey üzerinde (u: yatay mesafe, y1..y2: düşey aralık) dikdörtgen çizer */
function yuzeyDikdortgen(y: Yuzey, u1: number, u2: number, y1: number, y2: number, disari: number) {
  const p = (u: number, yy: number) => {
    const px = y.x + y.dx * u + y.nx * disari;
    const pz = y.z + y.dz * u + y.nz * disari;
    return { x: px, z: pz, y: y.taban + yy };
  };
  return [p(u1, y1), p(u2, y1), p(u2, y2), p(u1, y2)];
}

/* ------------------------------------------------------------------ */
/* SAHNE                                                               */
/* ------------------------------------------------------------------ */

export type KatTipi =
  | 'villa'
  | 'apartman'
  | 'otel'
  | 'kafe'
  | 'ofis'
  | 'konut'
  | 'dubleks'
  | 'cephe';

export type SahneSecenek = {
  kat: KatPlan;
  ustKat?: KatPlan;
  cephe: string;
  ikincil: string;
  vurgu: string;
  gokyuzu: string;
  gokyuzuAlt: string;
  arazi: string;
  tip: KatTipi;
  seed: number;
  baslik: string;
};

const W = 560;
const H = 400;

export function projeSahne(s: SahneSecenek): string {
  const rast = (i: number) => {
    const v = Math.sin(s.seed * 12.9898 + i * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  const kat = s.kat;
  const GW = kat.genislik;
  const GD = kat.derinlik;

  const katSayisi =
    s.tip === 'apartman' ? 5 : s.tip === 'otel' ? 3 : s.tip === 'cephe' ? 7 : s.tip === 'dubleks' ? 2 : s.ustKat ? 2 : 1;
  const katYuk = 3.05;
  const toplamYuk = katSayisi * katYuk;

  const ayak = Math.max(GW, GD);
  const olcek = Math.min(14.6, (H * 0.56) / (ayak * 1.3));
  const ox = W / 2 - (GW - GD) * Math.cos(aci) * olcek * 0.5;
  const oy = H * 0.78 - toplamYuk * olcek * 0.45;

  const P = (x: number, z: number, y: number) => izo(x, z, y, olcek, ox, oy);

  /* --- gökyüzü + çevre --- */
  let cevre = '';
  const doga = s.tip === 'villa' || s.tip === 'kafe';
  const siluet = altTon(s.ikincil, -68);
  for (let i = 0; i < 14; i++) {
    const bx = -30 + i * 46 + rast(i) * 20;
    if (doga) {
      const gy = H * 0.56 + rast(i + 5) * 16;
      const r = 9 + rast(i + 40) * 13;
      cevre += `<ellipse cx="${bx.toFixed(0)}" cy="${gy.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * 1.6).toFixed(
        0
      )}" fill="${siluet}" opacity="${(0.1 + rast(i + 90) * 0.1).toFixed(2)}"/>`;
    } else {
      const bh = 30 + rast(i + 40) * 88;
      const bw = 22 + rast(i + 70) * 26;
      cevre += `<rect x="${bx.toFixed(0)}" y="${(H * 0.5 - bh).toFixed(0)}" width="${bw.toFixed(
        0
      )}" height="${bh.toFixed(0)}" fill="${siluet}" opacity="${(0.07 + rast(i + 90) * 0.09).toFixed(2)}"/>`;
    }
  }

  /* --- arazi --- */
  const pad = 10;
  const arazi = [
    P(-pad, -pad, 0),
    P(GW + pad, -pad, 0),
    P(GW + pad, GD + pad, 0),
    P(-pad, GD + pad, 0),
  ];

  /* --- kütle yüzeyleri: 4 dış cephe, taban..tepe --- */
  const yanRenk = altTon(s.cephe, -34);
  const onRenk = altTon(s.cephe, 6);

  // izometrikte görünen iki cephe: +x yönü (sağ) ve +z yönü (ön/sol-alt)
  // Dört yüzeyin hepsini çizip sıralıyoruz; arkadakiler öndekilerle örtülür.
  const disDuvarlar = kat.duvarlar.filter((d) => !d.ic);
  const yuzeyler: Yuzey[] = [];
  if (disDuvarlar.length >= 4) {
    // plan verisindeki 4 dış duvarı cephe olarak kullan (kapı/pencere ofsetleri burada)
    const kabuk = disDuvarlar.slice(0, 4);
    // güney (+z) cephe: z sabit, x değişir → en yakın cephe
    const guney = kabuk.find((d) => Math.abs(d.z1 - d.z2) < 0.01 && Math.abs(d.z1 - GD) < 0.6);
    const kuzey = kabuk.find((d) => Math.abs(d.z1 - d.z2) < 0.01 && Math.abs(d.z1) < 0.6);
    const dogu = kabuk.find((d) => Math.abs(d.x1 - d.x2) < 0.01 && Math.abs(d.x1 - GW) < 0.6);
    const bati = kabuk.find((d) => Math.abs(d.x1 - d.x2) < 0.01 && Math.abs(d.x1) < 0.6);

    if (guney) yuzeyler.push(yuzey(guney, 0, toplamYuk, onRenk));
    if (dogu) yuzeyler.push(yuzey(dogu, 0, toplamYuk, yanRenk));
    if (kuzey) yuzeyler.push(yuzey(kuzey, 0, toplamYuk, altTon(s.cephe, -14)));
    if (bati) yuzeyler.push(yuzey(bati, 0, toplamYuk, altTon(s.cephe, -50)));
    void bati;
  }

  /* yüzey çizimi: her cephe düz bir dörtgen + üzerine pencere/kat çizgileri */
  let cepheler = '';
  for (const yz of yuzeyler) {
    const dortgen = yuzeyDikdortgen(yz, 0, yz.genislik, 0, yz.yuk, 0);
    cepheler += `<path d="${yol(dortgen.map((n) => P(n.x, n.z, n.y)))}" fill="${yz.renk}"/>`;
  }

  /* --- pencere ve kapılar: kütle yüzeyine oturur --- */
  let aciklikSvg = '';
  const camTon = altTon(s.cephe, -78);
  const camTonAcik = altTon(s.cephe, -52);

  for (const yz of yuzeyler) {
    // bu yüzeye denk gelen duvarı bul
    const duvar = disDuvarlar.find((d) => {
      const len = duvarUzunluk(d);
      const dx = (d.x2 - d.x1) / len;
      const dz = (d.z2 - d.z1) / len;
      return Math.abs(dx - yz.dx) < 0.01 && Math.abs(dz - yz.dz) < 0.01 && Math.abs(d.x1 - yz.x) < 0.01;
    });
    if (!duvar) continue;

    const aciklar: Aciklik[] = (duvar.acikliklar ?? []).slice().sort((a, b) => a.ofset - b.ofset);

    for (let k = 0; k < katSayisi; k++) {
      const taban = k * katYuk;
      for (const a of aciklar) {
        const u1 = a.ofset;
        const u2 = a.ofset + a.genislik;

        if (a.tip === 'kapi' && k === 0) {
          // giriş: koyu dolu kapı + kasası
          const kasa = yuzeyDikdortgen({ ...yz, taban: 0 }, u1, u2, 0, 2.15, 0.05);
          aciklikSvg += `<path d="${yol(kasa.map((n) => P(n.x, n.z, n.y)))}" fill="${altTon(s.cephe, -86)}"/>`;
          const kanat = yuzeyDikdortgen({ ...yz, taban: 0 }, u1 + 0.06, u2 - 0.06, 0, 2.08, 0.09);
          aciklikSvg += `<path d="${yol(kanat.map((n) => P(n.x, n.z, n.y)))}" fill="${s.vurgu}" opacity="0.82" stroke="${altTon(
            s.vurgu,
            -50
          )}" stroke-width="0.6"/>`;
          continue;
        }
        if (a.tip === 'kapi') continue; // üst katlarda kapı yok

        // pencere: cam + söve gölgesi + denizlik
        const tabanK = taban + (a.taban ?? 0.9);
        const ustK = Math.min(taban + (a.ust ?? 2.4), taban + katYuk - 0.35);
        const cam = yuzeyDikdortgen({ ...yz }, u1, u2, tabanK, ustK, 0.04);
        const gokyansima = rast(Math.round(u1 * 13) + k) > 0.62;
        aciklikSvg += `<path d="${yol(cam.map((n) => P(n.x, n.z, n.y)))}" fill="${
          gokyansima ? camTonAcik : camTon
        }" stroke="${altTon(s.cephe, -92)}" stroke-width="0.7"/>`;
        // orta kayıt (düşey) — pencereyi okutur
        const orta = yuzeyDikdortgen({ ...yz }, u1 + (u2 - u1) / 2 - 0.03, u1 + (u2 - u1) / 2 + 0.03, tabanK, ustK, 0.06);
        aciklikSvg += `<path d="${yol(orta.map((n) => P(n.x, n.z, n.y)))}" fill="${altTon(s.cephe, -46)}" opacity="0.85"/>`;
        // denizlik (alt gölge şeridi)
        const denizlik = yuzeyDikdortgen({ ...yz }, u1 - 0.05, u2 + 0.05, tabanK - 0.07, tabanK, 0.07);
        aciklikSvg += `<path d="${yol(denizlik.map((n) => P(n.x, n.z, n.y)))}" fill="${altTon(s.cephe, -24)}"/>`;
      }
    }

    // kat ayrım çizgisi (her katta ince silme)
    for (let k = 1; k < katSayisi; k++) {
      const bant = yuzeyDikdortgen({ ...yz }, 0, yz.genislik, k * katYuk - 0.06, k * katYuk + 0.02, 0.03);
      aciklikSvg += `<path d="${yol(bant.map((n) => P(n.x, n.z, n.y)))}" fill="${altTon(s.cephe, -30)}" opacity="0.75"/>`;
    }
  }

  /* --- çatı plakası: kütleyi kapatır --- */
  const catiUst = toplamYuk + 0.22;
  const cati = [
    P(-0.35, -0.35, catiUst),
    P(GW + 0.35, -0.35, catiUst),
    P(GW + 0.35, GD + 0.35, catiUst),
    P(-0.35, GD + 0.35, catiUst),
  ];
  let catiSvg = `<path d="${yol(cati)}" fill="${altTon(s.ikincil, 22)}" stroke="${altTon(s.ikincil, -22)}" stroke-width="0.9"/>`;
  // saçak kalınlığı (öne bakan iki kenar)
  catiSvg += `<path d="${yol([
    P(-0.35, GD + 0.35, catiUst),
    P(GW + 0.35, GD + 0.35, catiUst),
    P(GW + 0.35, GD + 0.35, catiUst - 0.24),
    P(-0.35, GD + 0.35, catiUst - 0.24),
  ])}" fill="${altTon(s.ikincil, -30)}"/>`;
  catiSvg += `<path d="${yol([
    P(GW + 0.35, -0.35, catiUst),
    P(GW + 0.35, GD + 0.35, catiUst),
    P(GW + 0.35, GD + 0.35, catiUst - 0.24),
    P(GW + 0.35, -0.35, catiUst - 0.24),
  ])}" fill="${altTon(s.ikincil, -44)}"/>`;

  /* --- tipe özel üst yapılar --- */
  let ekstra = '';
  const tx = GW * 0.6;
  const tz = GD * 0.22;

  if (s.tip === 'villa' || s.tip === 'dubleks' || s.tip === 'kafe' || s.tip === 'konut') {
    // çatı feneri (küçük hacim) — maket ölçeği hissi
    const fw = 2.0;
    const fd = 1.6;
    const fy = 0.85;
    ekstra += `<path d="${yol([
      P(tx, tz, catiUst + fy),
      P(tx + fw, tz, catiUst + fy),
      P(tx + fw, tz + fd, catiUst + fy),
      P(tx, tz + fd, catiUst + fy),
    ])}" fill="${altTon(s.ikincil, 40)}" stroke="${altTon(s.ikincil, -10)}" stroke-width="0.7"/>`;
    ekstra += `<path d="${yol([
      P(tx, tz + fd, catiUst + fy),
      P(tx + fw, tz + fd, catiUst + fy),
      P(tx + fw, tz + fd, catiUst),
      P(tx, tz + fd, catiUst),
    ])}" fill="${altTon(s.ikincil, -14)}"/>`;
    ekstra += `<path d="${yol([
      P(tx + fw, tz, catiUst + fy),
      P(tx + fw, tz + fd, catiUst + fy),
      P(tx + fw, tz + fd, catiUst),
      P(tx + fw, tz, catiUst),
    ])}" fill="${altTon(s.ikincil, -30)}"/>`;
  }

  if (s.tip === 'cephe') {
    // güneş kırıcı lameller: güney cephesine düşey dilimler
    for (let k = 1; k < katSayisi; k++) {
      for (let i = 0; i < Math.floor(GW / 1.35); i++) {
        const x1 = 0.55 + i * 1.35;
        const yy = k * katYuk + 0.45;
        ekstra += `<path d="${yol([
          P(x1, GD + 0.5, yy + 2.2),
          P(x1 + 0.18, GD + 0.5, yy + 2.2),
          P(x1 + 0.18, GD + 0.5, yy),
          P(x1, GD + 0.5, yy),
        ])}" fill="${s.vurgu}" opacity="0.66"/>`;
      }
    }
  }

  if (s.tip === 'otel') {
    // çatıda iki küçük baca / servis hacmi
    for (let i = 0; i < 2; i++) {
      const bx = GW * (0.24 + i * 0.34);
      const bz = GD * 0.3;
      ekstra += `<path d="${yol([
        P(bx, bz, catiUst + 0.7),
        P(bx + 0.9, bz, catiUst + 0.7),
        P(bx + 0.9, bz + 0.9, catiUst + 0.7),
        P(bx, bz + 0.9, catiUst + 0.7),
      ])}" fill="${altTon(s.ikincil, 26)}" stroke="${altTon(s.ikincil, -20)}" stroke-width="0.7"/>`;
      ekstra += `<path d="${yol([
        P(bx, bz + 0.9, catiUst + 0.7),
        P(bx + 0.9, bz + 0.9, catiUst + 0.7),
        P(bx + 0.9, bz + 0.9, catiUst),
        P(bx, bz + 0.9, catiUst),
      ])}" fill="${altTon(s.ikincil, -18)}"/>`;
    }
  }

  /* --- teras / avlu / zemin öğeleri --- */
  let zeminObje = '';

  if (s.tip === 'villa' || s.tip === 'dubleks') {
    const t1 = GW + 0.15;
    zeminObje += `<path d="${yol([
      P(t1, GD * 0.3, 0.12),
      P(t1 + 3.2, GD * 0.3, 0.12),
      P(t1 + 3.2, GD * 0.95, 0.12),
      P(t1, GD * 0.95, 0.12),
    ])}" fill="${altTon(s.arazi, 26)}" stroke="${altTon(s.arazi, -18)}" stroke-width="0.8"/>`;
    // havuz hissi: küçük mavi dikdörtgen
    zeminObje += `<path d="${yol([
      P(t1 + 0.7, GD * 0.42, 0.14),
      P(t1 + 2.6, GD * 0.42, 0.14),
      P(t1 + 2.6, GD * 0.66, 0.14),
      P(t1 + 0.7, GD * 0.66, 0.14),
    ])}" fill="#9fbfcb" opacity="0.85"/>`;
  }

  if (s.tip === 'kafe') {
    // ön bahçede 3 küçük gölgelik/oturma
    for (let i = 0; i < 3; i++) {
      const gx = GW * 0.12 + i * 3.2;
      const gz = GD + 2.4;
      zeminObje += `<path d="${yol([
        P(gx, gz, 2.2),
        P(gx + 1.8, gz, 2.2),
        P(gx + 1.8, gz + 1.8, 2.2),
        P(gx, gz + 1.8, 2.2),
      ])}" fill="${altTon(s.vurgu, 20)}" opacity="0.9" stroke="${altTon(s.vurgu, -40)}" stroke-width="0.7"/>`;
    }
  }

  if (s.tip === 'otel') {
    // avlu zemini
    zeminObje += `<path d="${yol([
      P(GW * 0.3, GD * 0.3, 0.08),
      P(GW * 0.7, GD * 0.3, 0.08),
      P(GW * 0.7, GD * 0.7, 0.08),
      P(GW * 0.3, GD * 0.7, 0.08),
    ])}" fill="${altTon(s.arazi, 28)}" opacity="0.9"/>`;
  }

  /* --- gölge --- */
  const golge = `<path d="${yol([
    P(1.2, 1.2, 0),
    P(GW + 3.2, 1.2, 0),
    P(GW + 3.2, GD + 3.2, 0),
    P(1.2, GD + 3.2, 0),
  ])}" fill="#2a231c" opacity="0.2" filter="url(#yumusak-${s.seed})"/>`;

  /* --- yapının kendi kenar çizgileri (kütle okunsun) --- */
  const kontur = `<path d="${yol([
    P(0, GD, 0),
    P(GW, GD, 0),
    P(GW, GD, toplamYuk),
    P(0, GD, toplamYuk),
  ])}" fill="none" stroke="${altTon(s.cephe, -70)}" stroke-width="0.8" opacity="0.35"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${s.baslik} — temsilî mimari maket görseli">
  <defs>
    <linearGradient id="gok-${s.seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${s.gokyuzu}"/>
      <stop offset="100%" stop-color="${s.gokyuzuAlt}"/>
    </linearGradient>
    <linearGradient id="arazi-${s.seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${altTon(s.arazi, 14)}"/>
      <stop offset="100%" stop-color="${altTon(s.arazi, -20)}"/>
    </linearGradient>
    <filter id="yumusak-${s.seed}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#gok-${s.seed})"/>
  ${cevre}
  <circle cx="${W * 0.79}" cy="${H * 0.16}" r="50" fill="#fff" opacity="0.32" filter="url(#yumusak-${s.seed})"/>

  <path d="${yol(arazi)}" fill="url(#arazi-${s.seed})"/>
  ${golge}
  ${zeminObje}
  ${cepheler}
  ${aciklikSvg}
  ${catiSvg}
  ${ekstra}
  ${kontur}

  <rect x="12" y="${H - 28}" width="126" height="19" fill="${altTon(s.ikincil, -72)}" opacity="0.76" rx="2"/>
  <text x="21" y="${H - 14.5}" font-family="Inter, sans-serif" font-size="8.5" fill="#ffffff" letter-spacing="0.18em">TEMSİLÎ MAKET</text>
</svg>`;
}
