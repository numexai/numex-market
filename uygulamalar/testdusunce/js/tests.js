/* =====================================================================
   NUMEX ÇİZGİ — kabul testleri
   Arayüzden bağımsız çalışır: motoru sıfırdan kurar, sonucu ölçer.
   Her test { id, name, pass, detail } döndürür.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.CIZGI;
  if (!S) return;

  function T(id, name, fn) { return { id: id, name: name, fn: fn }; }

  /* 1 — hiçbir koşulda çakışma / taşma / izinsiz dönme */
  function t1() {
    var senaryolar = ['A', 'B', 'C'], stratejiler = ['shelf', 'maxrects', 'guillotine'];
    var kosu = 0, yerlesim = 0, hata = [];
    senaryolar.forEach(function (k) {
      var s = S.scenarios[k]();
      stratejiler.forEach(function (st) {
        var res = S.pack(s.stock, s.parts, st);
        kosu++;
        res.sheets.forEach(function (sh) { yerlesim += sh.placements.length; });
        if (res.violations.length) hata.push(k + '/' + st + ' → ' + res.violations[0].msg);
      });
    });
    return {
      pass: hata.length === 0,
      detail: kosu + ' koşu (3 senaryo × 3 strateji), ' + yerlesim + ' yerleşim incelendi. ' +
        (hata.length ? 'Hatalar: ' + hata.join(' | ') : 'Çakışma, taşma, izinsiz dönme: 0.')
    };
  }

  /* 2 — kerf 0 → 5 sonucu gerçekten değiştiriyor mu? */
  function t2() {
    var parcalar = [{ id: 'k1', name: 'Kare 500', w: 500, h: 500, qty: 4, rotatable: false, material: 'MDF' }];
    var s0 = { material: 'MDF', width: 1000, height: 1000, qty: 4, cost: 100, kerf: 0, margin: 0 };
    var s5 = { material: 'MDF', width: 1000, height: 1000, qty: 4, cost: 100, kerf: 5, margin: 0 };
    var r0 = S.pack(s0, parcalar, 'maxrects');
    var r5 = S.pack(s5, parcalar, 'maxrects');
    var farkli = S.signature(r0) !== S.signature(r5);
    return {
      pass: r0.stats.sheets === 1 && r5.stats.sheets > 1 && farkli &&
            r0.violations.length === 0 && r5.violations.length === 0,
      detail: 'kerf 0 → ' + r0.stats.sheets + ' levha (' + r0.stats.utilization.toFixed(1) + '% doluluk); ' +
        'kerf 5 → ' + r5.stats.sheets + ' levha (' + r5.stats.utilization.toFixed(1) + '%). ' +
        'İki 505×505 ayak izi 1000 mm genişliğe sığmadığı için yerleşim gerçekten değişti.'
    };
  }

  /* 3 — döndürme kapalıyken yön kısıtına uyuluyor mu? */
  function t3() {
    var stock = { material: 'MDF', width: 1000, height: 400, qty: 2, cost: 10, kerf: 0, margin: 0 };
    var kapali = S.pack(stock, [{ id: 'r1', name: 'Uzun', w: 300, h: 900, qty: 1, rotatable: false, material: 'MDF' }], 'auto');
    var acik = S.pack(stock, [{ id: 'r2', name: 'Uzun', w: 300, h: 900, qty: 1, rotatable: true, material: 'MDF' }], 'auto');
    var p = acik.sheets.length ? acik.sheets[0].placements[0] : null;
    var izinsiz = 0;
    kapali.runs.forEach(function (r) {
      r.sheets.forEach(function (sh) {
        sh.placements.forEach(function (q) { if (q.w !== 300 || q.h !== 900) izinsiz++; });
      });
    });
    return {
      pass: kapali.sheets.length === 0 && kapali.unplaced.length === 1 &&
            kapali.unplaced[0].reason === 'too-big' && izinsiz === 0 &&
            acik.sheets.length === 1 && p && p.rotated === true && p.w === 900 && p.h === 300,
      detail: 'Döndürme kapalı: 300×900 parça 1000×400 levhaya sığmadı, "sığmıyor" olarak bildirildi. ' +
        'Döndürme açık: 900×300 olarak 1 levhaya yerleşti (rotated=true).'
    };
  }

  /* 4 — stok yetersizliğinde yerleşmeyenler listeleniyor mu? */
  function t4() {
    var stock = { material: 'MDF', width: 100, height: 100, qty: 1, cost: 50, kerf: 0, margin: 0 };
    var parts = [{ id: 's1', name: 'Altmış', w: 60, h: 60, qty: 3, rotatable: false, material: 'MDF' }];
    var res = S.pack(stock, parts, 'maxrects');
    var sebep = res.unplaced.length ? res.unplaced[0].reason : '';
    return {
      pass: res.stats.placed === 1 && res.unplaced.length === 2 && sebep === 'no-sheet' &&
            res.stats.total === 3 && res.unplaced.every(function (u) { return u.name === 'Altmış'; }),
      detail: '1 levha, 3 parça (60×60): ' + res.stats.placed + ' yerleşti, ' +
        res.unplaced.length + ' yerleşmedi (gerekçe: ' + sebep + '). Sahte %100 üretilmedi.'
    };
  }

  /* 5 — 1001×500 parça 1000×1000 levhaya asla sığmamalı */
  function t5() {
    var stock = { material: 'MDF', width: 1000, height: 1000, qty: 2, cost: 50, kerf: 0, margin: 0 };
    var duz = S.pack(stock, [{ id: 'z1', name: 'Aşırı', w: 1001, h: 500, qty: 1, rotatable: false, material: 'MDF' }], 'auto');
    var don = S.pack(stock, [{ id: 'z2', name: 'Aşırı', w: 1001, h: 500, qty: 1, rotatable: true, material: 'MDF' }], 'auto');
    var kerfli = S.pack({ material: 'MDF', width: 1000, height: 1000, qty: 2, cost: 50, kerf: 5, margin: 0 },
      [{ id: 'z3', name: 'Tam 1000', w: 1000, h: 500, qty: 1, rotatable: false, material: 'MDF' }], 'auto');
    var hic = (duz.stats.placed + don.stats.placed + kerfli.stats.placed) === 0;
    return {
      pass: hic && duz.unplaced[0].reason === 'too-big' && don.unplaced[0].reason === 'too-big' &&
            kerfli.unplaced[0].reason === 'too-big',
      detail: '1001×500 (düz ve döndürülmüş) sığmadı. Kerf 5 iken tam 1000×500 bile sığmadı ' +
        '(ayak izi 1005×505). Üçü de "levhaya sığmıyor" olarak bildirildi; hiçbiri zorla yerleştirilmedi.'
    };
  }

  /* 6 — iki optimizasyon stratejisi gerçekten farklı algoritmalar mı? */
  function t6() {
    var stock = { material: 'MDF', width: 100, height: 100, qty: 2, cost: 1, kerf: 0, margin: 0 };
    var parts = [
      { id: 'f1', name: 'A', w: 50, h: 100, qty: 1, rotatable: false, material: 'MDF' },
      { id: 'f2', name: 'B', w: 50, h: 50, qty: 2, rotatable: false, material: 'MDF' }
    ];
    var raf = S.pack(stock, parts, 'shelf');
    var mr = S.pack(stock, parts, 'maxrects');
    var gu = S.pack(stock, parts, 'guillotine');
    var ayri = S.signature(raf) !== S.signature(mr);
    return {
      pass: raf.stats.sheets !== mr.stats.sheets && ayri && S.STRATEGIES.length >= 3 &&
            gu.stats.placed === 3,
      detail: 'Raf (FFD): ' + raf.stats.sheets + ' levha · MaxRects: ' + mr.stats.sheets +
        ' levha · Guillotine: ' + gu.stats.sheets + ' levha. MaxRects deliği (50×50) değerlendirdi, ' +
        'raf yöntemi değerlendiremedi → gerçekten farklı algoritmalar.'
    };
  }

  /* 7 — JSON dışa aktar / içe aktar: aynı yerleşim */
  function t7() {
    var s = S.scenarios.A();
    var once = S.pack(s.stock, s.parts, 'auto');
    var json = JSON.stringify({ format: 'numex-cizgi', version: S.version, strategy: 'auto', stock: s.stock, parts: s.parts });
    var geri = JSON.parse(json);
    var sonra = S.pack(geri.stock, geri.parts, 'auto');
    var ayni = S.signature(once) === S.signature(sonra);
    return {
      pass: ayni && once.sheets.length === sonra.sheets.length &&
            Math.abs(once.stats.wastePct - sonra.stats.wastePct) < 1e-9,
      detail: 'Senaryo A: ' + once.sheets.length + ' levha, fire %' + once.stats.wastePct.toFixed(2) +
        '. JSON (' + json.length + ' karakter) geri yüklendi → parmak izi birebir aynı: ' + ayni + '.'
    };
  }

  /* 8 — SVG içindeki koordinatlar uygulama sonucuyla örtüşüyor mu? */
  function t8() {
    var s = S.scenarios.A();
    var res = S.pack(s.stock, s.parts, 'auto');
    var hata = [], kontrol = 0;
    res.sheets.forEach(function (sh, i) {
      var svg = S.renderSheetSVG(res, i, { showKerf: true });
      var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      var rects = doc.querySelectorAll('rect.part');
      if (rects.length !== sh.placements.length) hata.push('levha ' + (i + 1) + ': rect sayısı uyuşmuyor');
      var map = {};
      sh.placements.forEach(function (p) { map[p.iid] = p; });
      Array.prototype.forEach.call(rects, function (rc) {
        var iid = rc.getAttribute('data-iid'), p = map[iid];
        if (!p) { hata.push('bilinmeyen parça ' + iid); return; }
        kontrol++;
        if (Math.abs(parseFloat(rc.getAttribute('x')) - p.x) > 0.02) hata.push(iid + ' x');
        if (Math.abs(parseFloat(rc.getAttribute('y')) - p.y) > 0.02) hata.push(iid + ' y');
        if (Math.abs(parseFloat(rc.getAttribute('width')) - p.w) > 0.02) hata.push(iid + ' w');
        if (Math.abs(parseFloat(rc.getAttribute('height')) - p.h) > 0.02) hata.push(iid + ' h');
        if (parseInt(rc.getAttribute('data-rot'), 10) !== (p.rotated ? 1 : 0)) hata.push(iid + ' rot');
      });
    });
    return {
      pass: hata.length === 0 && kontrol > 0,
      detail: kontrol + ' SVG dikdörtgeni, yerleşim verisiyle karşılaştırıldı (x, y, genişlik, yükseklik, yön). ' +
        (hata.length ? 'Uyuşmazlık: ' + hata.join(', ') : 'Hepsi birebir örtüşüyor.')
    };
  }

  var TESTLER = [
    T(1, 'İki parça hiçbir koşulda üst üste geliyor mu?', t1),
    T(2, 'Kesim payı 0 → 5 mm olunca sonuç yeniden hesaplanıyor mu?', t2),
    T(3, 'Döndürme kapatılınca yön kısıtına uyuluyor mu?', t3),
    T(4, 'Stok yetersizliğinde yerleşmeyen parçalar listeleniyor mu?', t4),
    T(5, '1000×1000 levhaya 1001×500 parça yanlışlıkla sığdırılıyor mu?', t5),
    T(6, 'İki optimizasyon stratejisi gerçekten farklı algoritmalar mı?', t6),
    T(7, 'JSON dışa aktarılıp yeniden yüklenince aynı yerleşim hesaplanıyor mu?', t7),
    T(8, 'SVG içindeki parça ölçüleri ve koordinatları sonuçla örtüşüyor mu?', t8)
  ];

  S.runTests = function () {
    return TESTLER.map(function (t) {
      var r;
      try { r = t.fn() || {}; }
      catch (e) { r = { pass: false, detail: 'Test çalıştırılamadı: ' + (e && e.message ? e.message : e) }; }
      return { id: t.id, name: t.name, pass: !!r.pass, detail: r.detail || '' };
    });
  };
})();
