/* =====================================================================
   NUMEX ÇİZGİ — Çekirdek Kesim Motoru (v1.0.0)
   ---------------------------------------------------------------------
   Saf JavaScript. DOM'a dokunmaz; tarayıcıda ve başka bir yerde aynı
   sonucu verir. Deterministik: aynı girdi + aynı strateji => aynı yerleşim.

   KOORDİNAT SİSTEMİ
   Levhanın sol-üst köşesi (0,0). Tüm değerler milimetre (mm).
   Kenar boşluğu (margin) levhanın her dört kenarından düşülür; kullanılabilir
   alan [margin, W-margin] x [margin, H-margin] olur.

   KESİM PAYI (KERF) KURALI
   Her parça, yerleşimde (w+kerf) x (h+kerf) büyüklüğünde bir "ayak izi"
   kaplar; böylece iki parça arasında her zaman en az kerf kadar malzeme
   kalır. Bu yüzden kerf, iki parçanın yan yana gelip gelmeyeceğini
   gerçekten değiştirir. Parçanın kendi çizimi (w x h) ayrı tutulur.
   ===================================================================== */
(function (global) {
  'use strict';

  var EPS = 1e-6;
  var VERSION = '1.0.0';
  var S = { version: VERSION };

  /* ------------------------------------------------------------------ */
  /* küçük yardımcılar                                                   */
  /* ------------------------------------------------------------------ */
  function sayi(v, d) {
    var x = Number(v);
    if (v === '' || v === null || v === undefined || !isFinite(x)) return d;
    return x;
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clip(s, n) {
    s = String(s === null || s === undefined ? '' : s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function hueOf(id) {
    var h = 0, s = String(id || 'x');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }
  function yakin(a, b) { return Math.abs(a - b) <= EPS; }

  /* ------------------------------------------------------------------ */
  /* normalizasyon                                                       */
  /* ------------------------------------------------------------------ */
  S.normalizeStock = function (raw) {
    var r = raw || {};
    return {
      material: String(r.material === null || r.material === undefined ? 'MDF' : r.material).trim(),
      width: Math.max(0, sayi(r.width, 0)),
      height: Math.max(0, sayi(r.height, 0)),
      qty: Math.max(0, Math.floor(sayi(r.qty, 0))),
      cost: Math.max(0, sayi(r.cost, 0)),
      kerf: Math.max(0, sayi(r.kerf, 0)),
      margin: Math.max(0, sayi(r.margin, 0))
    };
  };

  S.normalizePart = function (raw, i) {
    var r = raw || {};
    var id = (r.id === null || r.id === undefined || r.id === '') ? ('p' + (i + 1)) : String(r.id);
    return {
      id: id,
      name: String(r.name === null || r.name === undefined ? '' : r.name).trim() || ('Parça ' + (i + 1)),
      w: Math.max(0, sayi(r.w, 0)),
      h: Math.max(0, sayi(r.h, 0)),
      qty: Math.max(0, Math.floor(sayi(r.qty, 0))),
      rotatable: (r.rotatable === true || r.rotatable === 'true' || r.rotatable === 1 || r.rotatable === '1'),
      material: String(r.material === null || r.material === undefined ? '' : r.material).trim()
    };
  };

  /* Adetleri tek tek "örnek"lere açar. Sıra korunur, kimlikler deterministiktir. */
  S.expandParts = function (parts) {
    var out = [];
    (parts || []).forEach(function (p, pi) {
      var np = S.normalizePart(p, pi);
      for (var i = 0; i < np.qty; i++) {
        out.push({
          iid: np.id + '#' + i, partId: np.id, name: np.name,
          w: np.w, h: np.h, rotatable: np.rotatable, material: np.material
        });
      }
    });
    return out;
  };

  /* Parçanın denenebilir yönleri. Kare parçada döndürme anlamsızdır. */
  S.orientations = function (it) {
    var list = [{ w: it.w, h: it.h, rotated: false }];
    if (it.rotatable && Math.abs(it.w - it.h) > EPS) {
      list.push({ w: it.h, h: it.w, rotated: true });
    }
    return list;
  };

  /* Raf (shelf) mantığı için tercih edilen yön: yüksekliği küçük olan. */
  function prefOrientation(it) {
    var ors = S.orientations(it);
    if (ors.length === 1) return ors[0];
    if (ors[1].h < ors[0].h - EPS) return ors[1];
    if (yakin(ors[1].h, ors[0].h) && ors[1].w < ors[0].w - EPS) return ors[1];
    return ors[0];
  }

  /* Deterministik, toplam sıralama: anahtarlar azalan, eşitlikte iid artan. */
  function sortedDesc(items, keyFn) {
    return items.map(function (it, i) { return { it: it, k: keyFn(it), i: i }; })
      .sort(function (a, b) {
        var n = Math.min(a.k.length, b.k.length);
        for (var i = 0; i < n; i++) {
          if (b.k[i] > a.k[i] + EPS) return 1;
          if (a.k[i] > b.k[i] + EPS) return -1;
        }
        if (a.it.iid < b.it.iid) return -1;
        if (a.it.iid > b.it.iid) return 1;
        return a.i - b.i;
      })
      .map(function (x) { return x.it; });
  }

  /* ------------------------------------------------------------------ */
  /* hazırlık: ölçü/malzeme eleme                                        */
  /* ------------------------------------------------------------------ */
  function materialUyumlu(partMat, stockMat) {
    var a = String(partMat || '').trim().toLocaleLowerCase('tr');
    var b = String(stockMat || '').trim().toLocaleLowerCase('tr');
    if (!a || !b) return true;          /* biri boşsa kısıt sayılmaz */
    return a === b;
  }

  function mkUnplaced(it, reason) {
    return {
      iid: it.iid, partId: it.partId, name: it.name, w: it.w, h: it.h,
      rotatable: it.rotatable, material: it.material, reason: reason
    };
  }

  function mkPlacement(it, o, x, y) {
    return {
      iid: it.iid, partId: it.partId, name: it.name,
      x: x, y: y, w: o.w, h: o.h, rotated: o.rotated,
      rotatable: it.rotatable, material: it.material,
      origW: it.w, origH: it.h, sheet: 1
    };
  }

  function prep(stock, items) {
    var kerf = stock.kerf, m = stock.margin;
    var uW = stock.width - 2 * m;
    var uH = stock.height - 2 * m;
    var ok = [], blocked = [];
    items.forEach(function (it) {
      if (!(it.w > EPS) || !(it.h > EPS)) { blocked.push(mkUnplaced(it, 'invalid')); return; }
      if (!materialUyumlu(it.material, stock.material)) { blocked.push(mkUnplaced(it, 'material')); return; }
      var fits = S.orientations(it).some(function (o) {
        return (o.w + kerf) <= uW + EPS && (o.h + kerf) <= uH + EPS;
      });
      if (!fits) { blocked.push(mkUnplaced(it, 'too-big')); return; }
      ok.push(it);
    });
    return { ok: ok, blocked: blocked, uW: uW, uH: uH };
  }

  function pickOrientation(it, kerf, uW, uH) {
    var ors = S.orientations(it), fitting = [];
    for (var i = 0; i < ors.length; i++) {
      if (ors[i].w + kerf <= uW + EPS && ors[i].h + kerf <= uH + EPS) fitting.push(ors[i]);
    }
    if (!fitting.length) return ors[0];
    fitting.sort(function (a, b) { return (a.h - b.h) || (a.w - b.w); });
    return fitting[0];
  }

  /* ------------------------------------------------------------------ */
  /* STRATEJİ 1 — First Fit Decreasing (raf / shelf)                      */
  /* ------------------------------------------------------------------ */
  /* Parçalar yükseklikçe azalan sırada dizilir. Her levhada yatay "raflar"
     açılır; parça açık rafa sığmazsa yeni raf, o da sığmazsa sıradaki levha
     denenir (first fit: ilk uyan levha kullanılır). Basit ama öngörülebilir;
     dar/uzun parçalarda genelde MaxRects'ten geride kalır.               */
  function packShelf(stock, base) {
    var kerf = stock.kerf, X0 = stock.margin, Y0 = stock.margin;
    var uW = base.uW, uH = base.uH, qty = stock.qty;
    var sheets = [], unplaced = base.blocked.slice();

    var ordered = sortedDesc(base.ok, function (it) {
      var o = prefOrientation(it);
      return [o.h + kerf, o.w + kerf, it.w * it.h];
    });

    ordered.forEach(function (it) {
      var ors = S.orientations(it);
      var done = false, oi, o, fw, fh;

      for (var si = 0; si < sheets.length && !done; si++) {
        var sh = sheets[si];
        var last = sh.shelves.length ? sh.shelves[sh.shelves.length - 1] : null;

        /* 1) açık rafa ilk uyan yön */
        if (last) {
          for (oi = 0; oi < ors.length; oi++) {
            o = ors[oi]; fw = o.w + kerf; fh = o.h + kerf;
            if (fh <= last.height + EPS && last.x + fw <= uW + EPS) {
              sh.placements.push(mkPlacement(it, o, X0 + last.x, Y0 + last.y));
              last.x += fw; done = true; break;
            }
          }
        }
        if (done) break;

        /* 2) aynı levhada yeni raf */
        for (oi = 0; oi < ors.length; oi++) {
          o = ors[oi]; fw = o.w + kerf; fh = o.h + kerf;
          if (fw <= uW + EPS && sh.nextY + fh <= uH + EPS) {
            sh.shelves.push({ y: sh.nextY, height: fh, x: fw });
            sh.nextY += fh;
            sh.placements.push(mkPlacement(it, o, X0, Y0 + sh.shelves[sh.shelves.length - 1].y));
            done = true; break;
          }
        }
      }
      if (done) return;

      if (sheets.length >= qty) { unplaced.push(mkUnplaced(it, 'no-sheet')); return; }

      /* 3) yeni levha */
      o = pickOrientation(it, kerf, uW, uH);
      fw = o.w + kerf; fh = o.h + kerf;
      var ns = { index: sheets.length + 1, placements: [], shelves: [], nextY: fh };
      ns.shelves.push({ y: 0, height: fh, x: fw });
      ns.placements.push(mkPlacement(it, o, X0, Y0));
      sheets.push(ns);
    });

    return { sheets: sheets, unplaced: unplaced };
  }

  /* ------------------------------------------------------------------ */
  /* MaxRects yardımcıları                                               */
  /* ------------------------------------------------------------------ */
  function kesisir(a, b) {
    return (a.x < b.x + b.w - EPS) && (b.x < a.x + a.w - EPS) &&
           (a.y < b.y + b.h - EPS) && (b.y < a.y + a.h - EPS);
  }
  function icinde(dis, ic) {
    return (ic.x >= dis.x - EPS) && (ic.y >= dis.y - EPS) &&
           (ic.x + ic.w <= dis.x + dis.w + EPS) && (ic.y + ic.h <= dis.y + dis.h + EPS);
  }
  /* Kullanılan dikdörtgeni serbest listesinden çıkar, artanı dört dilime böl. */
  function splitFreeMaxRects(sheet, used) {
    var next = [];
    sheet.free.forEach(function (fr) {
      if (!kesisir(fr, used)) { next.push(fr); return; }
      if (used.y > fr.y + EPS) next.push({ x: fr.x, y: fr.y, w: fr.w, h: used.y - fr.y });
      if (used.y + used.h < fr.y + fr.h - EPS) next.push({ x: fr.x, y: used.y + used.h, w: fr.w, h: (fr.y + fr.h) - (used.y + used.h) });
      if (used.x > fr.x + EPS) next.push({ x: fr.x, y: fr.y, w: used.x - fr.x, h: fr.h });
      if (used.x + used.w < fr.x + fr.w - EPS) next.push({ x: used.x + used.w, y: fr.y, w: (fr.x + fr.w) - (used.x + used.w), h: fr.h });
    });
    sheet.free = prune(next);
  }
  /* Başka bir serbest dikdörtgenin içinde kalanları at. */
  function prune(rects) {
    var out = [];
    for (var i = 0; i < rects.length; i++) {
      var a = rects[i];
      if (a.w <= EPS || a.h <= EPS) continue;
      var at = false;
      for (var j = 0; j < rects.length; j++) {
        if (i === j) continue;
        var b = rects[j];
        if (b.w <= EPS || b.h <= EPS) continue;
        if (icinde(b, a) && (!icinde(a, b) || j < i)) { at = true; break; }
      }
      if (!at) out.push(a);
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* STRATEJİ 2 — MaxRects (Best Short Side Fit)                          */
  /* ------------------------------------------------------------------ */
  /* Serbest dikdörtgen listesi tutar; parçayı "artan kenarı en kısa" olan
     konuma koyar ve serbest alanları dört yönden bölerek yönetir. Delikleri
     raf yönteminden çok daha iyi değerlendirir.                           */
  function packMaxRects(stock, base) {
    var kerf = stock.kerf, X0 = stock.margin, Y0 = stock.margin;
    var uW = base.uW, uH = base.uH, qty = stock.qty;
    var sheets = [], unplaced = base.blocked.slice();

    var ordered = sortedDesc(base.ok, function (it) {
      var o = prefOrientation(it);
      return [(o.w + kerf) * (o.h + kerf), Math.max(o.w, o.h), it.w * it.h];
    });

    function yeniLevha() {
      var sh = { index: sheets.length + 1, placements: [], free: [] };
      if (uW > EPS && uH > EPS) sh.free.push({ x: X0, y: Y0, w: uW, h: uH });
      sheets.push(sh);
      return sh;
    }

    function enIyi(sh, it) {
      var ors = S.orientations(it), best = null;
      for (var fi = 0; fi < sh.free.length; fi++) {
        var fr = sh.free[fi];
        for (var oi = 0; oi < ors.length; oi++) {
          var o = ors[oi], fw = o.w + kerf, fh = o.h + kerf;
          if (fw > fr.w + EPS || fh > fr.h + EPS) continue;
          var lw = fr.w - fw, lh = fr.h - fh;
          var s1 = Math.min(lw, lh), s2 = Math.max(lw, lh);
          if (!best || s1 < best.s1 - EPS ||
              (yakin(s1, best.s1) && (s2 < best.s2 - EPS ||
              (yakin(s2, best.s2) && (fi < best.fi || (fi === best.fi && oi < best.oi)))))) {
            best = { s1: s1, s2: s2, fi: fi, oi: oi, o: o, fr: fr };
          }
        }
      }
      return best;
    }

    ordered.forEach(function (it) {
      var best = null, hedef = null;
      for (var si = 0; si < sheets.length; si++) {
        var c = enIyi(sheets[si], it);
        if (!c) continue;
        if (!best || c.s1 < best.s1 - EPS ||
            (yakin(c.s1, best.s1) && (c.s2 < best.s2 - EPS || (yakin(c.s2, best.s2) && si < sheets.indexOf(hedef))))) {
          best = c; hedef = sheets[si];
        }
      }
      if (!best) {
        if (sheets.length >= qty) { unplaced.push(mkUnplaced(it, 'no-sheet')); return; }
        var ns = yeniLevha();
        var c2 = enIyi(ns, it);
        if (!c2) { sheets.pop(); unplaced.push(mkUnplaced(it, 'too-big')); return; }
        best = c2; hedef = ns;
      }
      var o = best.o, fw = o.w + kerf, fh = o.h + kerf, fr = best.fr;
      hedef.placements.push(mkPlacement(it, o, fr.x, fr.y));
      splitFreeMaxRects(hedef, { x: fr.x, y: fr.y, w: fw, h: fh });
    });

    return { sheets: sheets, unplaced: unplaced };
  }

  /* ------------------------------------------------------------------ */
  /* STRATEJİ 3 — Guillotine (Best Area Fit)                              */
  /* ------------------------------------------------------------------ */
  /* Serbest alanı her zaman tek bir "gijotin" kesimiyle ikiye böler; yani
     ortaya çıkan yerleşim, düz testere ile gerçekten kesilebilir bir plan
     olur (MaxRects'in böldüğü artıklar her zaman düz kesimle ayrılamaz).
     Kesim sırası: artan alanı en küçük olan serbest dikdörtgen.          */
  function guillotineBol(fr, fw, fh, rule) {
    var w = fr.w - fw, h = fr.h - fh;
    var sagTam = { x: fr.x + fw, y: fr.y, w: w, h: fr.h };
    var altDar = { x: fr.x, y: fr.y + fh, w: fw, h: h };
    var sagKisa = { x: fr.x + fw, y: fr.y, w: w, h: fh };
    var altGenis = { x: fr.x, y: fr.y + fh, w: fr.w, h: h };
    var out = (rule === 'longerLeftoverAxis')
      ? (w >= h ? [sagTam, altDar] : [sagKisa, altGenis])
      : (w >= h ? [sagKisa, altGenis] : [sagTam, altDar]);
    return out.filter(function (r) { return r.w > EPS && r.h > EPS; });
  }

  function packGuillotine(stock, base) {
    var kerf = stock.kerf, X0 = stock.margin, Y0 = stock.margin;
    var uW = base.uW, uH = base.uH, qty = stock.qty;
    var sheets = [], unplaced = base.blocked.slice();

    var ordered = sortedDesc(base.ok, function (it) {
      var o = prefOrientation(it);
      return [Math.max(o.w, o.h), it.w * it.h, o.w + o.h];
    });

    function yeniLevha() {
      var sh = { index: sheets.length + 1, placements: [], free: [] };
      if (uW > EPS && uH > EPS) sh.free.push({ x: X0, y: Y0, w: uW, h: uH });
      sheets.push(sh);
      return sh;
    }

    function enIyi(sh, it) {
      var ors = S.orientations(it), best = null;
      for (var fi = 0; fi < sh.free.length; fi++) {
        var fr = sh.free[fi];
        for (var oi = 0; oi < ors.length; oi++) {
          var o = ors[oi], fw = o.w + kerf, fh = o.h + kerf;
          if (fw > fr.w + EPS || fh > fr.h + EPS) continue;
          var alan = fr.w * fr.h - fw * fh;
          var k1 = Math.min(fr.w - fw, fr.h - fh), k2 = Math.max(fr.w - fw, fr.h - fh);
          if (!best || alan < best.alan - EPS ||
              (yakin(alan, best.alan) && (k1 < best.k1 - EPS ||
              (yakin(k1, best.k1) && (k2 < best.k2 - EPS ||
              (yakin(k2, best.k2) && (fi < best.fi || (fi === best.fi && oi < best.oi)))))))) {
            best = { alan: alan, k1: k1, k2: k2, fi: fi, oi: oi, o: o, fr: fr };
          }
        }
      }
      return best;
    }

    ordered.forEach(function (it) {
      var best = null, hedef = null;
      for (var si = 0; si < sheets.length; si++) {
        var c = enIyi(sheets[si], it);
        if (!c) continue;
        if (!best || c.alan < best.alan - EPS ||
            (yakin(c.alan, best.alan) && (c.k1 < best.k1 - EPS ||
            (yakin(c.k1, best.k1) && (c.k2 < best.k2 - EPS ||
            (yakin(c.k2, best.k2) && si < sheets.indexOf(hedef))))))) {
          best = c; hedef = sheets[si];
        }
      }
      if (!best) {
        if (sheets.length >= qty) { unplaced.push(mkUnplaced(it, 'no-sheet')); return; }
        var ns = yeniLevha();
        var c2 = enIyi(ns, it);
        if (!c2) { sheets.pop(); unplaced.push(mkUnplaced(it, 'too-big')); return; }
        best = c2; hedef = ns;
      }
      var o = best.o, fw = o.w + kerf, fh = o.h + kerf, fr = best.fr;
      hedef.placements.push(mkPlacement(it, o, fr.x, fr.y));
      var parcalar = guillotineBol(fr, fw, fh, 'longerLeftoverAxis');
      hedef.free.splice(best.fi, 1);
      for (var pi = 0; pi < parcalar.length; pi++) hedef.free.push(parcalar[pi]);
    });

    return { sheets: sheets, unplaced: unplaced };
  }

  /* ------------------------------------------------------------------ */
  /* BAĞIMSIZ DOĞRULAYICI                                               */
  /* ------------------------------------------------------------------ */
  /* Algoritmaya güvenmiyoruz; sonucu sıfırdan kontrol ediyoruz:
     - her parça levha + kenar boşluğu sınırları içinde mi?
     - döndürmeye izin yokken yön değişmiş mi?
     - iki parçanın "ayak izi" (kerf dahil) çakışıyor mu?
     Ayak izi çakışmıyorsa hem bindirme yoktur hem de arada en az kerf
     kadar malzeme kalır.                                                  */
  S.verify = function (res) {
    var st = res.stock, kerf = st.kerf, m = st.margin, p = [];
    var minX = m - EPS, minY = m - EPS;
    var maxX = st.width - m + EPS, maxY = st.height - m + EPS;

    (res.sheets || []).forEach(function (sh) {
      var L = sh.placements;
      for (var i = 0; i < L.length; i++) {
        var a = L[i];
        if (a.x < minX || a.y < minY || a.x + a.w > maxX || a.y + a.h > maxY) {
          p.push({ type: 'tasdi', sheet: sh.index, iid: a.iid, msg: a.name + ' levha dışına taşıyor' });
        }
        if (!a.rotatable && (Math.abs(a.w - a.origW) > EPS || Math.abs(a.h - a.origH) > EPS)) {
          p.push({ type: 'donme', sheet: sh.index, iid: a.iid, msg: a.name + ' izinsiz döndürülmüş' });
        }
        for (var j = i + 1; j < L.length; j++) {
          var b = L[j];
          var fa = { x: a.x, y: a.y, w: a.w + kerf, h: a.h + kerf };
          var fb = { x: b.x, y: b.y, w: b.w + kerf, h: b.h + kerf };
          if (kesisir(fa, fb)) {
            p.push({ type: 'cakisma', sheet: sh.index, iid: a.iid, msg: a.name + ' ↔ ' + b.name + ' çakışıyor' });
          }
        }
      }
    });
    return p;
  };

  /* ------------------------------------------------------------------ */
  /* İSTATİSTİK / FİRE                                                    */
  /* ------------------------------------------------------------------ */
  /* Fire üç bileşene ayrılır ve hepsi raporlanır:
       kerfLoss  : parçaların arasında/çevresinde ayrılan kesim payı
       sheetLoss : levha içinde hiç kullanılmayan (artık) alan
       wasteArea = levha alanı - parçaların gerçek alanı
     Yalnızca FİİLEN kullanılan levhalar maliyete girer; stokta kalan
     levhalar maliyete eklenmez ama ayrıca bilgi olarak gösterilir.       */
  S.computeStats = function (res) {
    var st = res.stock, kerf = st.kerf;
    var sheetArea = st.width * st.height;
    var used = (res.sheets || []).length;
    var stockArea = sheetArea * used;
    var partsArea = 0, footprintArea = 0, placed = 0;

    (res.sheets || []).forEach(function (sh) {
      var pa = 0, fa = 0;
      sh.placements.forEach(function (p) {
        pa += p.w * p.h;
        fa += (p.w + kerf) * (p.h + kerf);
      });
      sh.partsArea = pa;
      sh.footprintArea = fa;
      sh.fillPct = sheetArea > 0 ? (pa / sheetArea) * 100 : 0;
      partsArea += pa; footprintArea += fa; placed += sh.placements.length;
    });

    var kerfLoss = Math.max(0, footprintArea - partsArea);
    var sheetLoss = Math.max(0, stockArea - footprintArea);
    var wasteArea = Math.max(0, stockArea - partsArea);
    var total = (res.total === null || res.total === undefined)
      ? placed + (res.unplaced || []).length : res.total;

    return {
      sheets: used,
      totalSheets: st.qty,
      sheetArea: sheetArea,
      stockArea: stockArea,
      partsArea: partsArea,
      footprintArea: footprintArea,
      kerfLoss: kerfLoss,
      sheetLoss: sheetLoss,
      wasteArea: wasteArea,
      wastePct: stockArea > 0 ? (wasteArea / stockArea) * 100 : 0,
      utilization: stockArea > 0 ? (partsArea / stockArea) * 100 : 0,
      cost: used * st.cost,
      costAllStock: st.qty * st.cost,
      placed: placed,
      unplaced: (res.unplaced || []).length,
      total: total,
      spareSheets: Math.max(0, st.qty - used),
      spareArea: Math.max(0, st.qty - used) * sheetArea
    };
  };

  /* Yerleşimin parmak izi — JSON gidiş-dönüş testi bunu karşılaştırır. */
  S.signature = function (res) {
    var parcalar = [];
    (res.sheets || []).forEach(function (sh) {
      sh.placements.forEach(function (p) {
        parcalar.push([sh.index, p.iid, r2(p.x), r2(p.y), r2(p.w), r2(p.h), p.rotated ? 1 : 0].join('|'));
      });
    });
    parcalar.sort();
    return parcalar.join(';');
  };

  /* ------------------------------------------------------------------ */
  /* STRATEJİ KATALOĞU + ÇALIŞTIRICI                                     */
  /* ------------------------------------------------------------------ */
  S.STRATEGIES = [
    { id: 'shelf', name: 'First Fit Decreasing (raf)', kisa: 'FFD',
      desc: 'Yükseklikçe azalan sıra + yatay raflar. Öngörülebilir, hızlı; dar parçalarda geride kalır.' },
    { id: 'maxrects', name: 'MaxRects — BSSF', kisa: 'MaxRects',
      desc: 'Serbest dikdörtgen listesi; artan kenarı en kısa konuma yerleştirir. Genelde en iyi dolgu.' },
    { id: 'guillotine', name: 'Guillotine — BAF', kisa: 'Guillotine',
      desc: 'Artığı tek düz kesimle böler; düz testerede gerçekten kesilebilir bir plan üretir.' }
  ];

  function runOne(name, stock, base, total) {
    var out;
    if (name === 'shelf') out = packShelf(stock, base);
    else if (name === 'guillotine') out = packGuillotine(stock, base);
    else out = packMaxRects(stock, base);

    out.sheets.forEach(function (s, i) {
      s.index = i + 1;
      s.placements.forEach(function (p) { p.sheet = i + 1; });
    });

    var run = {
      strategy: name, sheets: out.sheets, unplaced: out.unplaced,
      stock: stock, total: total
    };
    run.stats = S.computeStats(run);
    run.violations = S.verify(run);
    return run;
  }

  function daha_iyi(a, b) {
    if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length < b.unplaced.length;
    if (a.sheets.length !== b.sheets.length) return a.sheets.length < b.sheets.length;
    return a.stats.wastePct < b.stats.wastePct - EPS;
  }

  /* Üç stratejiyi de çalıştırır; seçilen (ya da en iyi) sonucu döndürür.
     Sonuç nesnesi .runs içinde üç yarışın tamamını taşır (karşılaştırma). */
  S.pack = function (stockRaw, partsRaw, strategy) {
    var stock = S.normalizeStock(stockRaw);
    var items = S.expandParts(partsRaw);
    var base = prep(stock, items);
    var runs = S.STRATEGIES.map(function (s) { return runOne(s.id, stock, base, items.length); });

    var best = runs[0];
    for (var i = 1; i < runs.length; i++) if (daha_iyi(runs[i], best)) best = runs[i];

    var istenen = null;
    if (strategy && strategy !== 'auto') {
      for (var j = 0; j < runs.length; j++) if (runs[j].strategy === strategy) istenen = runs[j];
    }
    var sec = istenen || best;

    return {
      strategy: sec.strategy, sheets: sec.sheets, unplaced: sec.unplaced,
      stats: sec.stats, violations: sec.violations,
      stock: stock, total: items.length,
      runs: runs, bestStrategy: best.strategy
    };
  };

  /* ------------------------------------------------------------------ */
  /* HAZIR SENARYOLAR                                                    */
  /* ------------------------------------------------------------------ */
  S.scenarios = {
    A: function () {
      return {
        ad: 'Senaryo A — Mobilya (MDF)',
        stock: { material: 'MDF', width: 2440, height: 1220, qty: 4, cost: 850, kerf: 3, margin: 10 },
        parts: [
          { id: 'a1', name: 'Yan panel', w: 580, h: 720, qty: 2, rotatable: true, material: 'MDF' },
          { id: 'a2', name: 'Taban/üst', w: 900, h: 580, qty: 2, rotatable: true, material: 'MDF' },
          { id: 'a3', name: 'Raf', w: 868, h: 560, qty: 4, rotatable: true, material: 'MDF' },
          { id: 'a4', name: 'Kapak', w: 596, h: 715, qty: 2, rotatable: true, material: 'MDF' },
          { id: 'a5', name: 'Arka panel', w: 1200, h: 600, qty: 1, rotatable: true, material: 'MDF' },
          { id: 'a6', name: 'Çekmece önü', w: 596, h: 180, qty: 1, rotatable: false, material: 'MDF' }
        ]
      };
    },
    B: function () {
      return {
        ad: 'Senaryo B — Reklam atölyesi (pleksi)',
        stock: { material: 'Pleksi', width: 2000, height: 1000, qty: 6, cost: 1200, kerf: 2, margin: 5 },
        parts: [
          { id: 'b1', name: 'Tabela gövde', w: 400, h: 300, qty: 6, rotatable: true, material: 'Pleksi' },
          { id: 'b2', name: 'Şerit yazı', w: 600, h: 200, qty: 4, rotatable: true, material: 'Pleksi' },
          { id: 'b3', name: 'Logo kare', w: 250, h: 250, qty: 4, rotatable: false, material: 'Pleksi' },
          { id: 'b4', name: 'Yön levhası', w: 900, h: 150, qty: 3, rotatable: true, material: 'Pleksi' },
          { id: 'b5', name: 'Askı parçası', w: 300, h: 300, qty: 3, rotatable: false, material: 'Pleksi' }
        ]
      };
    },
    C: function () {
      return {
        ad: 'Senaryo C — Zor sınav',
        stock: { material: 'MDF', width: 1000, height: 1000, qty: 3, cost: 300, kerf: 5, margin: 0 },
        parts: [
          { id: 'c1', name: 'Tam kare 500', w: 500, h: 500, qty: 4, rotatable: false, material: 'MDF' },
          { id: 'c2', name: 'Neredeyse tam', w: 995, h: 495, qty: 1, rotatable: false, material: 'MDF' },
          { id: 'c3', name: 'Aşırı geniş', w: 1001, h: 500, qty: 1, rotatable: false, material: 'MDF' }
        ]
      };
    }
  };

  /* ------------------------------------------------------------------ */
  /* SVG ÜRETİCİ (saf metin — testte de kullanılabilir)                  */
  /* ------------------------------------------------------------------ */
  S.renderSheetSVG = function (res, sheetIndex, opts) {
    opts = opts || {};
    var st = res.stock, sh = res.sheets[sheetIndex];
    if (!sh) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>';

    var W = st.width, H = st.height, kerf = st.kerf;
    var pad = Math.max(W, H) * 0.02;
    var sw = Math.max(0.8, Math.max(W, H) * 0.0015);
    var fs = Math.max(6, Math.min(W, H) * 0.028);
    var o = [];

    o.push('<svg xmlns="http://www.w3.org/2000/svg" class="plan-svg" viewBox="' +
      r2(-pad) + ' ' + r2(-pad) + ' ' + r2(W + pad * 2) + ' ' + r2(H + pad * 2) +
      '" preserveAspectRatio="xMidYMid meet" data-sheet="' + sh.index + '">');
    o.push('<rect class="sheet-bg" x="0" y="0" width="' + r2(W) + '" height="' + r2(H) +
      '" fill="#eef2f6" stroke="#8fa3b8" stroke-width="' + r2(sw) + '"/>');
    if (st.margin > 0) {
      o.push('<rect class="sheet-usable" x="' + r2(st.margin) + '" y="' + r2(st.margin) +
        '" width="' + r2(Math.max(0, W - 2 * st.margin)) + '" height="' + r2(Math.max(0, H - 2 * st.margin)) +
        '" fill="none" stroke="#f59e0b" stroke-width="' + r2(sw) + '" stroke-dasharray="' +
        r2(sw * 6) + ' ' + r2(sw * 4) + '"/>');
    }

    sh.placements.forEach(function (p) {
      var hue = hueOf(p.partId);
      var dondur = p.rotated ? 1 : 0;
      if (opts.showKerf && kerf > 0) {
        o.push('<rect class="kerf" x="' + r2(p.x) + '" y="' + r2(p.y) + '" width="' + r2(p.w + kerf) +
          '" height="' + r2(p.h + kerf) + '" fill="rgba(239,68,68,.28)"/>');
      }
      o.push('<g class="part-g">');
      o.push('<rect class="part" data-iid="' + esc(p.iid) + '" data-x="' + r2(p.x) + '" data-y="' + r2(p.y) +
        '" data-w="' + r2(p.w) + '" data-h="' + r2(p.h) + '" data-rot="' + dondur + '"' +
        ' x="' + r2(p.x) + '" y="' + r2(p.y) + '" width="' + r2(p.w) + '" height="' + r2(p.h) +
        '" fill="hsl(' + hue + ',62%,58%)" stroke="#0b131c" stroke-width="' + r2(sw) + '" rx="' + r2(sw) + '">' +
        '<title>' + esc(p.name) + ' — ' + r2(p.w) + ' × ' + r2(p.h) + ' mm' +
        (p.rotated ? ' (döndürülmüş)' : '') + '</title></rect>');
      if (p.w > W * 0.05 && p.h > H * 0.045) {
        var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        o.push('<text class="lbl" x="' + r2(cx) + '" y="' + r2(cy - fs * 0.12) + '" font-size="' + r2(fs) +
          '" text-anchor="middle" fill="#0b131c" font-family="Segoe UI,Arial,sans-serif">' +
          esc(clip(p.name, 16)) + '</text>');
        o.push('<text class="lbl" x="' + r2(cx) + '" y="' + r2(cy + fs * 0.95) + '" font-size="' + r2(fs * 0.78) +
          '" text-anchor="middle" fill="#0b131c" font-family="Segoe UI,Arial,sans-serif">' +
          r2(p.w) + '×' + r2(p.h) + (p.rotated ? ' ↻' : '') + '</text>');
      }
      o.push('</g>');
    });

    o.push('</svg>');
    return o.join('');
  };

  global.CIZGI = S;
})(typeof window !== 'undefined' ? window : this);


