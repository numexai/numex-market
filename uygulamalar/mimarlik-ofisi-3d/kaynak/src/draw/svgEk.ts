/**
 * Kesit, cephe, vaziyet ve tesisat şemalarını üreten temsilî çizimler.
 * Hepsi eldeki plan geometrisinden türetilir; hiçbiri gerçek bir .dwg değildir.
 */

const CIZGI = '#33302c';
const INCE = '#6f6a62';
const AKS = '#9a6f3f';
const PX = 52;

const ol = (v: number) => v * PX;

function bas(w: number, h: number, pad: number, baslik: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w + pad * 2} ${
      h + pad * 2
    }" role="img"><title>${baslik}</title>` +
    `<rect x="${-pad}" y="${-pad}" width="${w + pad * 2}" height="${h + pad * 2}" fill="#fbf8f2"/>`
  );
}

function paftaYazisi(w: number, h: number, metin: string) {
  return `<text x="${w + 12}" y="${h + 12}" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}" text-anchor="end" letter-spacing="0.14em">${metin}</text>`;
}

/* ------------------------------------------------------------------ */
/* KESİT                                                              */
/* ------------------------------------------------------------------ */
export function kesitCiz(): string {
  const Wm = 14;
  const zeminH = 3.05;
  const ustH = 3.05;
  const toplamH = zeminH + ustH + 0.4; // çatı döşemesi dahil
  const W = ol(Wm);
  const H = ol(toplamH);
  const pad = 104;
  const baseY = H;

  let s = bas(W, H, pad, 'A-A Kesiti — temsili mimari kesit');
  const y = (m: number) => baseY - ol(m);

  // zemin hattı
  s += `<line x1="${-40}" y1="${baseY}" x2="${W + 40}" y2="${baseY}" stroke="${CIZGI}" stroke-width="2.4"/>`;
  s += `<line x1="${-40}" y1="${baseY + 6}" x2="${W + 40}" y2="${baseY + 6}" stroke="${CIZGI}" stroke-width="0.8" opacity="0.6"/>`;
  for (let i = 0; i < 44; i++) {
    const x = -34 + i * 17;
    s += `<line x1="${x}" y1="${baseY + 6}" x2="${x + 11}" y2="${baseY + 16}" stroke="${INCE}" stroke-width="0.5" opacity="0.55"/>`;
  }

  // dış duvarlar (sol ve sağ) — kesilmiş duvarlar taralı
  const duvar = (x: number, wd: number, y1: number, y2: number) => {
    let out = `<rect x="${x}" y="${y1}" width="${wd}" height="${y2 - y1}" fill="#efe7d9" stroke="${CIZGI}" stroke-width="1.5"/>`;
    const adım = 8;
    for (let py = y1 + adım; py < y2; py += adım) {
      out += `<line x1="${x}" y1="${py}" x2="${x + wd}" y2="${py}" stroke="${INCE}" stroke-width="0.35" opacity="0.5"/>`;
    }
    rectBuffer.push(out);
    return out;
  };
  const rectBuffer: string[] = [];

  // sol dış duvar
  s += duvar(0, ol(0.4), y(zeminH + ustH + 0.4), y(0));
  // sağ dış duvar
  s += duvar(W - ol(0.4), ol(0.4), y(zeminH + ustH + 0.4), y(0));

  // döşemeler
  const doseme = (m: number) => {
    const yy = y(m);
    let out = `<rect x="${0}" y="${yy}" width="${W}" height="${ol(0.35)}" fill="#e2d8c6" stroke="${CIZGI}" stroke-width="1.3"/>`;
    for (let i = 0; i < 3; i++) {
      out += `<line x1="0" y1="${yy + 5 + i * 5}" x2="${W}" y2="${yy + 5 + i * 5}" stroke="${INCE}" stroke-width="0.3" opacity="0.4"/>`;
    }
    return out;
  };
  s += doseme(0);
  s += doseme(zeminH);
  s += doseme(zeminH + ustH);

  // iç bölme (salon | mutfak) — kesitte ince
  s += `<rect x="${ol(7.4) - 4}" y="${y(zeminH)}" width="${ol(0.15)}" height="${ol(zeminH) - ol(0.35)}" fill="#efe7d9" stroke="${CIZGI}" stroke-width="1.1"/>`;
  s += `<rect x="${ol(7.2) - 4}" y="${y(zeminH + ustH)}" width="${ol(0.15)}" height="${ol(ustH) - ol(0.35)}" fill="#efe7d9" stroke="${CIZGI}" stroke-width="1.1"/>`;

  // teras saçağı
  s += `<rect x="${W}" y="${y(zeminH)}" width="${ol(2.6)}" height="${ol(0.22)}" fill="#ddd2bd" stroke="${CIZGI}" stroke-width="1.1"/>`;
  s += `<line x1="${W}" y1="${y(zeminH)}" x2="${W + ol(2.6)}" y2="${y(zeminH)}" stroke="${CIZGI}" stroke-width="1.1"/>`;

  // çatı eğimi
  s += `<path d="M${-ol(0.3)} ${y(zeminH + ustH + 0.4)} L${W / 2} ${y(zeminH + ustH + 0.4 + 0.85)} L${
    W + ol(0.3)
  } ${y(zeminH + ustH + 0.4)}" fill="none" stroke="${CIZGI}" stroke-width="2.2" stroke-linejoin="round"/>`;

  // pencereler (kesitte görünen)
  const pencere = (xm: number, wm: number, alt: number, ust: number) => {
    const x = ol(xm);
    const w = ol(wm);
    return (
      `<rect x="${x}" y="${y(ust)}" width="${w}" height="${y(alt) - y(ust)}" fill="#fbf8f2" stroke="${CIZGI}" stroke-width="1.4"/>` +
      `<line x1="${x}" y1="${y((alt + ust) / 2)}" x2="${x + w}" y2="${y((alt + ust) / 2)}" stroke="${CIZGI}" stroke-width="0.9"/>`
    );
  };
  s += pencere(1.6, 2.4, 0, 2.4);
  s += pencere(6.2, 2.0, 0.9, 2.4);
  s += pencere(2.0, 2.4, zeminH, zeminH + 2.5);
  s += pencere(7.0, 2.4, zeminH + 0.9, zeminH + 2.5);

  // kot çizgileri
  const kot = (m: number, etiket: string) => {
    const yy = y(m);
    return (
      `<line x1="${-92}" y1="${yy}" x2="${-70}" y2="${yy}" stroke="${AKS}" stroke-width="0.8"/>` +
      `<text x="${-96}" y="${yy + 4}" font-family="Inter, sans-serif" font-size="10" fill="${AKS}" text-anchor="end">${etiket}</text>`
    );
  };
  s += kot(0, '±0,00');
  s += kot(zeminH, '+3,05');
  s += kot(zeminH + ustH, '+6,10');
  s += kot(zeminH + ustH + 0.4 + 0.85, '+7,35 (mahya)');

  // kat yüksekliği ölçüsü
  s += `<line x1="${W + 26}" y1="${y(0)}" x2="${W + 26}" y2="${y(zeminH)}" stroke="${INCE}" stroke-width="0.8"/>`;
  s += `<line x1="${W + 20}" y1="${y(0)}" x2="${W + 32}" y2="${y(0)}" stroke="${INCE}" stroke-width="1"/>`;
  s += `<line x1="${W + 20}" y1="${y(zeminH)}" x2="${W + 32}" y2="${y(zeminH)}" stroke="${INCE}" stroke-width="1"/>`;
  s += `<text x="${W + 34}" y="${y(zeminH / 2)}" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}">3,05</text>`;
  s += `<text x="${-pad + 8}" y="${-pad + 20}" font-family="Inter, sans-serif" font-size="11" fill="${CIZGI}" letter-spacing="0.16em">A — A KESİTİ</text>`;
  s += paftaYazisi(W, H, 'A-A KESİTİ · 1/50 · TEMSİLÎ ÇİZİM');
  s += '</svg>';
  return s;
}

/* ------------------------------------------------------------------ */
/* CEPHE                                                              */
/* ------------------------------------------------------------------ */
export function cepheCiz(): string {
  const Wm = 14;
  const toplamH = 6.5;
  const W = ol(Wm);
  const H = ol(toplamH);
  const pad = 60;
  const y = (m: number) => H - ol(m);

  let s = bas(W, H, pad, 'Kuzey Cephesi görünüşü — temsili');
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f4efe5" stroke="${CIZGI}" stroke-width="2"/>`;

  // zemin kat cephe malzemesi (doku)
  s += `<rect x="0" y="${y(3.05)}" width="${W}" height="${ol(3.05)}" fill="#e9e1d2" stroke="none"/>`;
  for (let i = 0; i < 14; i++) {
    s += `<line x1="${i * ol(1)}" y1="${y(3.05)}" x2="${i * ol(1)}" y2="${H}" stroke="${INCE}" stroke-width="0.25" opacity="0.35"/>`;
  }
  // üst kat
  s += `<rect x="0" y="${y(6.1)}" width="${W}" height="${ol(3.05)}" fill="#f7f3ea" stroke="none"/>`;

  // kat silmesi
  s += `<rect x="0" y="${y(3.05)}" width="${W}" height="${ol(0.2)}" fill="#ddd2bd" stroke="${CIZGI}" stroke-width="1"/>`;

  // pencereler
  const penc = (x: number, w: number, alt: number, ust: number, derin = false) => {
    let out = `<rect x="${ol(x)}" y="${y(ust)}" width="${ol(w)}" height="${y(alt) - y(ust)}" fill="#c9d3d6" stroke="${CIZGI}" stroke-width="1.6"/>`;
    out += `<line x1="${ol(x)}" y1="${y((alt + ust) / 2)}" x2="${ol(x + w)}" y2="${y((alt + ust) / 2)}" stroke="${CIZGI}" stroke-width="1"/>`;
    if (w > 1.4) {
      out += `<line x1="${ol(x + w / 2)}" y1="${y(ust)}" x2="${ol(x + w / 2)}" y2="${y(alt)}" stroke="${CIZGI}" stroke-width="1"/>`;
    }
    if (derin) {
      out += `<rect x="${ol(x) - 4}" y="${y(ust) - 4}" width="${ol(w) + 8}" height="${y(alt) - y(ust)}" fill="none" stroke="${INCE}" stroke-width="0.8" opacity="0.6"/>`;
    }
    return out;
  };
  s += penc(1.6, 2.4, 0, 2.4, true);
  s += penc(6.2, 2.0, 0.9, 2.4);
  s += penc(10.6, 2.0, 0.9, 2.4);
  s += penc(2.0, 2.4, 3.4, 5.4, true);
  s += penc(7.0, 2.4, 3.4, 5.4);
  s += penc(11.4, 1.8, 3.4, 5.4);

  // güneş kırıcı lameller (üst kat)
  for (let i = 0; i < 10; i++) {
    const x = ol(1.2) + i * ol(1.15);
    s += `<line x1="${x}" y1="${y(6.1)}" x2="${x}" y2="${y(6.1) - 0}" stroke="none"/>`;
  }
  s += `<rect x="${ol(6.6)}" y="${y(5.4) - 22}" width="${ol(3.0)}" height="7" fill="#c9b291" stroke="${CIZGI}" stroke-width="0.8"/>`;

  // saçak
  s += `<rect x="${-14}" y="${y(6.5)}" width="${W + 28}" height="${ol(0.35)}" fill="#ddd2bd" stroke="${CIZGI}" stroke-width="1.4"/>`;

  // zemin hattı + ölçü
  s += `<line x1="${-30}" y1="${H}" x2="${W + 30}" y2="${H}" stroke="${CIZGI}" stroke-width="2.4"/>`;
  const olc = (x1: number, x2: number, y: number, metin: string) => {
    let o = `<line x1="${ol(x1)}" y1="${y}" x2="${ol(x2)}" y2="${y}" stroke="${INCE}" stroke-width="0.8"/>`;
    o += `<line x1="${ol(x1)}" y1="${y - 4}" x2="${ol(x1)}" y2="${y + 4}" stroke="${INCE}" stroke-width="1"/>`;
    o += `<line x1="${ol(x2)}" y1="${y - 4}" x2="${ol(x2)}" y2="${y + 4}" stroke="${INCE}" stroke-width="1"/>`;
    o += `<text x="${(ol(x1) + ol(x2)) / 2}" y="${y - 4}" font-family="Inter, sans-serif" font-size="9" fill="${INCE}" text-anchor="middle">${metin}</text>`;
    return o;
  };
  s += olc(0, 3, H + 24, '3,00');
  s += olc(3, 7.4, H + 24, '4,40');
  s += olc(7.4, 11, H + 24, '3,60');
  s += olc(11, 14, H + 24, '3,00');
  s += olc(0, 14, H + 44, '14,00 m');
  s += `<text x="0" y="${-20}" font-family="Inter, sans-serif" font-size="11" fill="${CIZGI}" letter-spacing="0.16em">KUZEY CEPHESİ</text>`;
  s += paftaYazisi(W, H, 'CEPHE GÖRÜNÜŞÜ · 1/50 · TEMSİLÎ ÇİZİM');
  s += '</svg>';
  return s;
}

/* ------------------------------------------------------------------ */
/* VAZİYET PLANI                                                      */
/* ------------------------------------------------------------------ */
export function vaziyetCiz(): string {
  const W = ol(40);
  const H = ol(30);
  const pad = 70;
  let s = bas(W, H, pad, 'Vaziyet planı — temsili yerleşim');
  // parsel
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f6f2e9" stroke="${CIZGI}" stroke-width="2" stroke-dasharray="14 6"/>`;
  s += `<text x="14" y="26" font-family="Inter, sans-serif" font-size="10" fill="${INCE}" letter-spacing="0.14em">PARSEL SINIRI · 1.240 m²</text>`;

  // yapı oturumu
  const bx = ol(8);
  const bz = ol(8);
  const bw = ol(14);
  const bd = ol(11);
  s += `<rect x="${bx}" y="${bz}" width="${bw}" height="${bd}" fill="#e3d8c4" stroke="${CIZGI}" stroke-width="2.4"/>`;
  s += `<rect x="${bx}" y="${bz}" width="${bw}" height="${bd}" fill="none" stroke="${CIZGI}" stroke-width="0.8" stroke-dasharray="5 4"/>`;
  s += `<text x="${bx + bw / 2}" y="${bz + bd / 2}" font-family="Inter, sans-serif" font-size="11" fill="${CIZGI}" text-anchor="middle">YAPI OTURUMU</text>`;
  s += `<text x="${bx + bw / 2}" y="${bz + bd / 2 + 16}" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}" text-anchor="middle">14,00 × 11,00 m</text>`;

  // teras
  s += `<rect x="${bx + bw}" y="${bz + ol(4)}" width="${ol(4)}" height="${ol(6)}" fill="#eee5d4" stroke="${INCE}" stroke-width="1.2" stroke-dasharray="6 4"/>`;
  s += `<text x="${bx + bw + ol(2)}" y="${bz + ol(7.1)}" font-family="Inter, sans-serif" font-size="9" fill="${INCE}" text-anchor="middle">TERAS</text>`;

  // havuz
  s += `<ellipse cx="${bx + bw + ol(9)}" cy="${bz + ol(6)}" rx="${ol(4)}" ry="${ol(2.4)}" fill="#cfe0e5" stroke="${CIZGI}" stroke-width="1.4"/>`;

  // yol
  s += `<rect x="0" y="${H}" width="${W}" height="${ol(5)}" fill="#e8e3d9" stroke="${CIZGI}" stroke-width="1.4"/>`;
  s += `<line x1="0" y1="${H + ol(2.5)}" x2="${W}" y2="${H + ol(2.5)}" stroke="${INCE}" stroke-width="0.9" stroke-dasharray="12 10"/>`;
  s += `<text x="${W / 2}" y="${H + ol(4.2)}" font-family="Inter, sans-serif" font-size="10" fill="${INCE}" text-anchor="middle" letter-spacing="0.2em">YOL</text>`;

  // giriş oku + kot
  s += `<path d="M${bx + bw / 2} ${H + ol(4)} L${bx + bw / 2} ${bz + bd + 8}" stroke="${AKS}" stroke-width="1.6" marker-end="url(#ok)"/>`;
  s += `<defs><marker id="ok" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="${AKS}"/></marker></defs>`;
  s += `<text x="${bx + bw / 2 + 10}" y="${bz + bd + 30}" font-family="Inter, sans-serif" font-size="9.5" fill="${AKS}">GİRİŞ</text>`;

  // kuzey oku
  s += `<g transform="translate(${W + 34} 40)"><path d="M0 0 L7 24 L0 18 L-7 24 z" fill="${CIZGI}"/><text x="0" y="-6" font-family="Inter, sans-serif" font-size="11" fill="${CIZGI}" text-anchor="middle">K</text></g>`;

  // yeşil alan temsili
  for (let i = 0; i < 7; i++) {
    const cx = ol(4 + (i % 4) * 9);
    const cy = ol(24 + Math.floor(i / 4) * 3.6);
    s += `<circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#7f9a6e" stroke-width="0.9" opacity="0.8"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 9}" stroke="#7f9a6e" stroke-width="0.9"/>`;
  }

  s += paftaYazisi(W, H, 'VAZİYET PLANI · 1/500 · TEMSİLÎ ÇİZİM');
  s += '</svg>';
  return s;
}

/* ------------------------------------------------------------------ */
/* ELEKTRİK ŞEMASI                                                    */
/* ------------------------------------------------------------------ */
export function elektrikCiz(): string {
  // temel plan çizimi + üstüne semboller
  const W = ol(14);
  const H = ol(11);
  const pad = 60;
  let s = bas(W, H, pad, 'Elektrik yerleşim şeması — temsili');

  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f8f5ee" stroke="${CIZGI}" stroke-width="2.4"/>`;

  // iç duvarlar (sadeleştirilmiş)
  const ic = (x1: number, z1: number, x2: number, z2: number) =>
    `<line x1="${ol(x1)}" y1="${ol(z1)}" x2="${ol(x2)}" y2="${ol(z2)}" stroke="${CIZGI}" stroke-width="3"/>`;
  s += ic(7.4, 0, 7.4, 6.4);
  s += ic(7.4, 6.4, 14, 6.4);
  s += ic(7.4, 6.4, 7.4, 11);
  s += ic(11, 6.4, 11, 11);
  s += ic(0, 7.2, 3.6, 7.2);
  s += ic(3.6, 7.2, 3.6, 11);

  // priz sembolleri (yarım daire + çizgi)
  const priz = (x: number, z: number) =>
    `<g transform="translate(${ol(x)} ${ol(z)})"><circle r="7.5" fill="#fbf8f2" stroke="${CIZGI}" stroke-width="1.1"/><line x1="-7.5" y1="0" x2="7.5" y2="0" stroke="${CIZGI}" stroke-width="1.1"/><line x1="0" y1="-4" x2="0" y2="4" stroke="${CIZGI}" stroke-width="0.9"/></g>`;

  // anahtar (dolu daire + çubuk)
  const anahtar = (x: number, z: number) =>
    `<g transform="translate(${ol(x)} ${ol(z)})"><circle r="6.5" fill="${CIZGI}"/><line x1="6.5" y1="-4" x2="14" y2="-8" stroke="${CIZGI}" stroke-width="1.4"/></g>`;

  // aydınlatma (şema: çarpı daire)
  const lamba = (x: number, z: number) =>
    `<g transform="translate(${ol(x)} ${ol(z)})"><circle r="6.5" fill="none" stroke="${AKS}" stroke-width="1.1"/><line x1="-4.6" y1="-4.6" x2="4.6" y2="4.6" stroke="${AKS}" stroke-width="1.1"/><line x1="4.6" y1="-4.6" x2="-4.6" y2="4.6" stroke="${AKS}" stroke-width="1.1"/></g>`;

  const prizlar: [number, number][] = [
    [1.2, 0.6], [4.4, 0.6], [6.6, 1.4], [1.2, 4.2], [0.7, 6.6], [2.6, 6.6],
    [8.2, 1.0], [12.4, 1.0], [12.4, 4.4], [8.0, 5.8], [2.0, 10.3], [5.4, 10.3],
    [8.2, 7.6], [12.6, 7.6], [12.6, 10.2],
  ];
  const anahtarlar: [number, number][] = [
    [3.9, 6.9], [3.9, 10.3], [6.6, 6.9], [7.7, 1.0], [10.6, 6.9], [10.6, 10.3], [7.7, 6.9],
  ];
  const lambalar: [number, number][] = [
    [3.4, 2.4], [3.4, 5.2], [4.9, 3.8], [10.8, 3.2], [8.6, 3.4], [12.6, 2.2],
    [1.8, 9.0], [5.4, 9.6], [9.3, 9.3], [12.6, 8.8], [5.2, 8.1],
  ];

  for (const [x, z] of prizlar) s += priz(x, z);
  for (const [x, z] of anahtarlar) s += anahtar(x, z);
  for (const [x, z] of lambalar) s += lamba(x, z);

  // besleme hattı
  s += `<path d="M${ol(3.6)} ${ol(7.2)} L${ol(7.4)} ${ol(6.4)} L${ol(7.4)} ${ol(0.4)}" fill="none" stroke="#9d5f3f" stroke-width="1.6" stroke-dasharray="8 4"/>`;
  s += `<rect x="${ol(3.2)}" y="${ol(7.0)}" width="${ol(0.8)}" height="${ol(0.5)}" fill="#fbf8f2" stroke="#9d5f3f" stroke-width="1.2"/>`;
  s += `<text x="${ol(4.1)}" y="${ol(7.5)}" font-family="Inter, sans-serif" font-size="9" fill="#9d5f3f">PANOLAR</text>`;

  // açıklama (legend)
  const ly = H + 22;
  s += `<g transform="translate(0 ${ly})">`;
  s += `<circle cx="8" cy="0" r="7.5" fill="#fbf8f2" stroke="${CIZGI}" stroke-width="1.1"/><line x1="0.5" y1="0" x2="15.5" y2="0" stroke="${CIZGI}" stroke-width="1.1"/><text x="22" y="4" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}">Priz</text>`;
  s += `<circle cx="90" cy="0" r="6.5" fill="${CIZGI}"/><text x="104" y="4" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}">Anahtar</text>`;
  s += `<circle cx="176" cy="0" r="6.5" fill="none" stroke="${AKS}" stroke-width="1.1"/><text x="190" y="4" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}">Aydınlatma</text>`;
  s += `<line x1="286" y1="0" x2="312" y2="0" stroke="#9d5f3f" stroke-width="1.6" stroke-dasharray="8 4"/><text x="320" y="4" font-family="Inter, sans-serif" font-size="9.5" fill="${INCE}">Besleme hattı</text>`;
  s += `</g>`;

  s += paftaYazisi(W, H + 40, 'ELEKTRİK YERLEŞİMİ · 1/50 · TEMSİLÎ ÇİZİM');
  s += '</svg>';
  return s;
}

/* ------------------------------------------------------------------ */
/* KAPI-PENCERE YERLEŞİMİ                                             */
/* ------------------------------------------------------------------ */
export function kapiPencereCiz(): string {
  const W = ol(14);
  const H = ol(11);
  const pad = 66;
  let s = bas(W, H, pad, 'Kapı-pencere yerleşim şeması — temsili');
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f9f6ef" stroke="${CIZGI}" stroke-width="4"/>`;

  // doğrama kutuları (P1, P2 ... K1, K2)
  const dograma = (x: number, z: number, w: number, d: number, etiket: string, kapi = false) => {
    let o = `<rect x="${ol(x)}" y="${ol(z)}" width="${ol(w)}" height="${ol(d)}" fill="${
      kapi ? '#efe0cc' : '#dbe4e7'
    }" stroke="${CIZGI}" stroke-width="1.5"/>`;
    o += `<line x1="${ol(x)}" y1="${ol(z + d / 2)}" x2="${ol(x + w)}" y2="${ol(z + d / 2)}" stroke="${CIZGI}" stroke-width="0.9"/>`;
    o += `<text x="${ol(x + w / 2)}" y="${ol(z + d / 2) - 4}" font-family="Inter, sans-serif" font-size="9" fill="${CIZGI}" text-anchor="middle">${etiket}</text>`;
    return o;
  };

  // pencere listesi (P1..P10)
  const pencereler: [number, number, number, number, string][] = [
    [1.6, 0, 2.4, 0.4, 'P1'],
    [6.2, 0, 2.0, 0.4, 'P2'],
    [10.6, 0, 2.0, 0.4, 'P3'],
    [13.6, 1.4, 0.4, 2.2, 'P4'],
    [13.6, 6.0, 0.4, 1.8, 'P5'],
    [8.4, 10.6, 2.4, 0.4, 'P6'],
    [0, 2.6, 0.4, 2.2, 'P7'],
    [0, 7.4, 0.4, 1.8, 'P8'],
  ];
  for (const [x, z, w, d, e] of pencereler) s += dograma(x, z, w, d, e);

  // kapı listesi (K1 giriş, K2..K6 iç)
  s += dograma(4.2, 10.6, 2.8, 0.4, 'K1 (GİRİŞ)', true);
  const kapilar: [number, number, number, number, string][] = [
    [7.4, 1.9, 0.16, 1.0, 'K2'],
    [7.5, 6.4, 0.9, 0.16, 'K3'],
    [7.4, 9.0, 0.16, 0.9, 'K4'],
    [3.5, 8.8, 0.16, 0.9, 'K5'],
    [1.6, 7.2, 0.9, 0.16, 'K6'],
  ];
  for (const [x, z, w, d, e] of kapilar) s += dograma(x, z, w, d, e, true);

  // açılış yönü okları
  s += `<path d="M${ol(9.6)} ${ol(10.4)} l0 -18" stroke="${AKS}" stroke-width="1.4" marker-end="url(#ok2)"/>`;
  s += `<defs><marker id="ok2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${AKS}"/></marker></defs>`;

  // doğrama tablosu
  s += `<g transform="translate(0 ${H + 18})" font-family="Inter, sans-serif" font-size="9" fill="${INCE}">`;
  s += `<text x="0" y="0" letter-spacing="0.14em" fill="${CIZGI}">DOĞRAMA LİSTESİ</text>`;
  const satirlar = [
    'P1–P3  Ahşap doğrama, çift cam · 240/200/200 × 150',
    'P4–P5  Sürmeli, ısı yalıtımlı · 220/180 × 150',
    'P6–P8  Ahşap doğrama, çift cam · 240/220/180 × 150',
    'K1     Çelik giriş kapısı · 280 × 220',
    'K2–K6  Ahşap iç kapı · 90/85 × 210',
  ];
  satirlar.forEach((t, i) => {
    s += `<text x="0" y="${16 + i * 13}">${t}</text>`;
  });
  s += `</g>`;

  s += paftaYazisi(W, H + 90, 'KAPI-PENCERE YERLEŞİMİ · 1/50 · TEMSİLÎ ÇİZİM');
  s += '</svg>';
  return s;
}
