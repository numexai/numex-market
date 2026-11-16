/* Anadolu Atölyesi — desen motoru
   Her üreteç, merkezi (0,0) olan saf SVG geometrisi (path/polygon) döndürür.
   Hiçbir raster görüntü üretilmez veya gömülmez. */

(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const yuvarla = (n) => Math.round(n * 100) / 100;

  function nk(cx, cy, r, a) {
    return [yuvarla(cx + Math.cos(a) * r), yuvarla(cy + Math.sin(a) * r)];
  }

  function poly(noktalar) {
    return 'M' + noktalar.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z';
  }

  // Tek bir şekil: dolgu ve çizgi katman parametrelerinden gelir.
  function sekil(d, p, o) {
    o = o || {};
    const dolgu = o.dolgu === false ? 'none' : (o.dolguRenk || p.dolgu);
    const cizgi = o.cizgi === false ? 'none' : (o.cizgiRenk || p.cizgiRenk);
    const kalinlik = o.kalinlik != null ? o.kalinlik : p.cizgi;
    const op = dolgu === 'none' ? '' : ` fill-opacity="${o.op != null ? o.op : 1}"`;
    return `<path d="${d}" fill="${dolgu}"${op} stroke="${cizgi}" stroke-width="${yuvarla(kalinlik)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  /* 1 — Sekiz köşeli yıldız (Selçuklu yıldız geleneğinden esinlenilmiş özgün kurgu) */
  function yildiz8(p) {
    const r = p.r, ic = r * 0.764, bosluk = p.bosluk;
    const dis = [], govde = [];
    for (let i = 0; i < 16; i++) {
      const a = (TAU / 16) * i - Math.PI / 2;
      govde.push(nk(0, 0, i % 2 ? ic : r, a));
      dis.push(nk(0, 0, (i % 2 ? ic : r) * 0.62, a));
    }
    const sekizgen = [];
    for (let i = 0; i < 8; i++) sekizgen.push(nk(0, 0, Math.max(r * 0.34 - bosluk, r * 0.12), (TAU / 8) * i - Math.PI / 2 + TAU / 16));
    let s = sekil(poly(govde), p, { dolgu: false });
    s += sekil(poly(sekizgen), p, { dolgu: true, kalinlik: p.cizgi * 0.8, op: 0.9 });
    s += sekil(poly(dis), p, { dolgu: false, kalinlik: p.cizgi * 0.6 });
    for (let i = 0; i < 8; i++) {
      const a = (TAU / 8) * i - Math.PI / 2;
      const a1 = nk(0, 0, r * 0.34 - bosluk, a), b1 = nk(0, 0, r * 0.62, a);
      s += sekil(`M${a1[0]} ${a1[1]}L${b1[0]} ${b1[1]}`, p, { dolgu: false, kalinlik: p.cizgi * 0.7 });
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.1 - bosluk * 0.3, 1))}" fill="${p.dolgu}" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi * 0.7)}"/>`;
    return s;
  }

  /* 2 — Geometrik geçme (girih örgülerinden esinlenilmiş, özgün örgü kurgusu) */
  function gecme(p) {
    const r = p.r, b = Math.max(p.bosluk, 0) * 0.5;
    let s = '';
    for (let q = 0; q < 4; q++) {
      const a = (TAU / 4) * q;
      const c = Math.cos(a), sn = Math.sin(a);
      const don = (x, y) => [yuvarla(x * c - y * sn), yuvarla(x * sn + y * c)];
      const k1 = don(-r, -r * 0.52), k2 = don(-r * 0.52, -r);
      s += sekil(`M${k1[0]} ${k1[1]}A${yuvarla(r * 0.48)} ${yuvarla(r * 0.48)} 0 0 1 ${k2[0]} ${k2[1]}`, p, { dolgu: false });
      const m1 = don(-r, 0), m2 = don(0, -r);
      s += sekil(`M${m1[0]} ${m1[1]}Q0 0 ${m2[0]} ${m2[1]}`, p, { dolgu: false, kalinlik: p.cizgi * 0.55 });
      const n1 = don(-r * 0.72, -r * 0.72), n2 = don(-r * 0.72, r * 0.72);
      s += sekil(`M${n1[0]} ${n1[1]}Q${yuvarla(-r * 0.3)} 0 ${n2[0]} ${n2[1]}`, p, { dolgu: false, kalinlik: p.cizgi * 0.7 });
    }
    const kare = [[-r * 0.62, -r * 0.62], [r * 0.62, -r * 0.62], [r * 0.62, r * 0.62], [-r * 0.62, r * 0.62]].map((q) => [yuvarla(q[0]), yuvarla(q[1])]);
    s += sekil(poly(kare), p, { dolgu: false, kalinlik: p.cizgi * 0.8 });
    const merkez = [];
    for (let i = 0; i < 8; i++) merkez.push(nk(0, 0, Math.max(r * 0.2 - b, r * 0.05), (TAU / 8) * i + TAU / 16));
    s += sekil(poly(merkez), p, { dolgu: true, kalinlik: p.cizgi * 0.7 });
    return s;
  }

  /* 3 — Çini kompozisyonu (İznik çinilerinin kompozisyon düzeninden esinlenilmiş özgün çiçek) */
  function cini(p) {
    const r = p.r, yaprak = Math.max(r * 0.42 - p.bosluk * 0.5, r * 0.12);
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a = (TAU / 8) * i - Math.PI / 2;
      const u = nk(0, 0, r * 0.34, a - 0.28), v = nk(0, 0, r * 0.34, a + 0.28);
      const tepe = nk(0, 0, yaprak + r * 0.34, a);
      s += sekil(`M${u[0]} ${u[1]}Q${tepe[0]} ${tepe[1]} ${v[0]} ${v[1]}Q0 0 ${u[0]} ${u[1]}Z`, p, { dolgu: true, op: 0.92, kalinlik: p.cizgi * 0.8 });
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.24 - p.bosluk * 0.4, 2))}" fill="none" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi)}"/>`;
    for (let i = 0; i < 8; i++) {
      const a = (TAU / 8) * i + TAU / 16;
      const c = nk(0, 0, r * 0.78, a);
      s += `<circle cx="${c[0]}" cy="${c[1]}" r="${yuvarla(Math.max(r * 0.075 - p.bosluk * 0.2, 1))}" fill="${p.dolgu}" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi * 0.75)}"/>`;
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(r * 0.11)}" fill="${p.cizgiRenk}" opacity="0.85"/>`;
    return s;
  }

  /* 4 — Özgün rozet (12 dilimli gül) */
  function rozet(p) {
    const r = p.r, dilim = 12, s0 = [];
    let s = '';
    for (let i = 0; i < dilim; i++) {
      const a1 = (TAU / dilim) * i - Math.PI / 2;
      const a2 = (TAU / dilim) * (i + 1) - Math.PI / 2;
      const am = (a1 + a2) / 2;
      const ic1 = nk(0, 0, r * 0.3, a1), ic2 = nk(0, 0, r * 0.3, a2);
      const dis = nk(0, 0, r, am);
      s += sekil(`M${ic1[0]} ${ic1[1]}L${dis[0]} ${dis[1]}L${ic2[0]} ${ic2[1]}Z`, p, { dolgu: i % 2 === 0, op: 0.95, kalinlik: p.cizgi * 0.8 });
      s0.push(nk(0, 0, Math.max(r * 0.58 - p.bosluk, r * 0.2), am));
    }
    for (let i = 0; i < dilim; i++) {
      const a = (TAU / dilim) * i - Math.PI / 2;
      const c = nk(0, 0, Math.max(r * 0.58 - p.bosluk, r * 0.2), a);
      s += `<circle cx="${c[0]}" cy="${c[1]}" r="${yuvarla(Math.max(r * 0.045, 0.8))}" fill="${p.cizgiRenk}"/>`;
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.3 - p.bosluk * 0.4, 2))}" fill="none" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi)}"/>`;
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.12, 1))}" fill="${p.dolgu}" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi * 0.8)}"/>`;
    return s;
  }

  /* 5 — Eşkenar dörtgen ızgara (baklava) */
  function baklava(p) {
    const r = p.r, ad = 3, adim = (r * 2) / ad;
    let s = '';
    for (let i = 0; i < ad; i++) {
      for (let j = 0; j < ad; j++) {
        const cx = -r + adim / 2 + i * adim, cy = -r + adim / 2 + j * adim;
        const yarim = adim / 2 - p.bosluk * 0.25;
        const d = poly([[cx, cy - yarim], [cx + yarim, cy], [cx, cy + yarim], [cx - yarim, cy]].map((q) => [yuvarla(q[0]), yuvarla(q[1])]));
        s += sekil(d, p, { dolgu: (i + j) % 2 === 0, op: 0.9, kalinlik: p.cizgi * 0.85 });
      }
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.16, 2))}" fill="${p.cizgiRenk}" opacity="0.75"/>`;
    return s;
  }

  /* 6 — Damla dizisi */
  function damla(p) {
    const r = p.r, icR = Math.max(r * 0.42 - p.bosluk * 0.4, r * 0.2);
    let s = '';
    for (let i = 0; i < 6; i++) {
      const a = (TAU / 6) * i - Math.PI / 2;
      const u = nk(0, 0, icR, a - 0.34), v = nk(0, 0, icR, a + 0.34);
      const tepe = nk(0, 0, r, a);
      const yon = nk(0, 0, icR * 0.55, a);
      s += sekil(`M${u[0]} ${u[1]}C${nk(0, 0, r * 0.9, a - 0.45).join(' ')} ${nk(0, 0, r * 0.9, a + 0.45).join(' ')} ${v[0]} ${v[1]}Q${yon[0]} ${yon[1]} ${u[0]} ${u[1]}Z`, p, { dolgu: true, op: 0.92, kalinlik: p.cizgi * 0.8 });
      const m = nk(0, 0, icR * 0.62, a);
      s += `<circle cx="${m[0]}" cy="${m[1]}" r="${yuvarla(Math.max(r * 0.035, 0.8))}" fill="${p.cizgiRenk}"/>`;
    }
    s += `<circle cx="0" cy="0" r="${yuvarla(icR)}" fill="none" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi)}"/>`;
    return s;
  }

  /* 7 — Halka örgüsü */
  function halka(p) {
    const r = p.r;
    let s = '';
    const halkalar = [[r, 0], [r * 0.74, 6], [r * 0.5, 10]];
    halkalar.forEach(([rr, ad], idx) => {
      for (let i = 0; i < ad; i++) {
        const c = nk(0, 0, rr * 0.86, (TAU / ad) * i + (idx % 2) * 0.2);
        s += `<circle cx="${c[0]}" cy="${c[1]}" r="${yuvarla(Math.max(rr * 0.24 - p.bosluk * 0.3, 1))}" fill="${idx === 1 ? 'none' : p.dolgu}" fill-opacity="0.85" stroke="${p.cizgiRenk}" stroke-width="${yuvarla(p.cizgi * 0.85)}"/>`;
      }
    });
    s += `<circle cx="0" cy="0" r="${yuvarla(Math.max(r * 0.12, 1))}" fill="${p.cizgiRenk}"/>`;
    return s;
  }

  const MOTIFLER = {
    yildiz8: { ad: 'Sekiz köşeli yıldız', not: 'Sekiz köşeli yıldız geleneğinden esinlenilmiş özgün kurgu', uret: yildiz8, varsayilanR: 170 },
    gecme:   { ad: 'Geometrik geçme', not: 'Girih örgülerinden esinlenilmiş özgün örgü', uret: gecme, varsayilanR: 180 },
    cini:    { ad: 'Çini kompozisyonu', not: 'İznik çini düzeninden esinlenilmiş özgün çiçek', uret: cini, varsayilanR: 160 },
    rozet:   { ad: 'Rozet', not: 'On iki dilimli özgün gül', uret: rozet, varsayilanR: 150 },
    baklava: { ad: 'Baklava ızgara', not: 'Eşkenar dörtgen ızgara, özgün dizilim', uret: baklava, varsayilanR: 160 },
    damla:   { ad: 'Damla dizisi', not: 'Altı damlalı özgün rozet', uret: damla, varsayilanR: 150 },
    halka:   { ad: 'Halka örgüsü', not: 'İç içe halka kurgusu, özgün', uret: halka, varsayilanR: 165 }
  };

  const PALETLER = {
    iznik:    { ad: 'İznik', renkler: ['#f6f3ea', '#1e5f9e', '#2b8ec4', '#c9a227', '#123a63', '#7fb4cf'] },
    selcuklu: { ad: 'Selçuklu', renkler: ['#f3ead8', '#0d5c53', '#1f8f86', '#b8892b', '#6b2f2a', '#3d6b5a'] },
    toprak:   { ad: 'Toprak', renkler: ['#f2e7d8', '#8a4b2a', '#b9723f', '#d9a35f', '#5d3a26', '#c98c5f'] },
    gece:     { ad: 'Gece', renkler: ['#eef2f6', '#1b3b5f', '#2f6d8c', '#c9a227', '#0f2237', '#5f8fa8'] }
  };

  global.Desen = { MOTIFLER, PALETLER, TAU, nk, poly, yuvarla };
})(window);
