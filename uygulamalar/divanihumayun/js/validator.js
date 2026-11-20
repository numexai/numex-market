/* ===================================================================
   NUMEX NÖBET — BAĞIMSIZ KISIT DOĞRULAYICI
   Motora hiç güvenmez: her şeyi ham veriden yeniden hesaplar.
   =================================================================== */
(function (global) {
  'use strict';
  var DAY = 1440;

  function araliklar(m) {
    var s = (m.start == null) ? 480 : m.start;
    var e = (m.end == null) ? 1080 : m.end;
    if (s === e) return [[0, DAY]];
    if (s < e) return [[s, e]];
    return [[s, DAY], [0, e]];
  }

  function vardiyaIcinde(m, bas, bit) {
    var gun = Math.floor(bas / DAY);
    for (var d = gun - 1; d <= gun + 1; d++) {
      var a = araliklar(m);
      for (var i = 0; i < a.length; i++) {
        var s = d * DAY + a[i][0], e = d * DAY + a[i][1];
        if (bas >= s && bit <= e) return true;
      }
    }
    return false;
  }

  function bakimlaCakisiyor(m, bas, bit) {
    var liste = m.maintenance || [];
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].start < bit && liste[i].end > bas) return true;
    }
    return false;
  }

  function donguVarMi(isler) {
    var map = new Map(isler.map(function (j) { return [j.id, j]; }));
    var indeg = new Map(), sonraki = new Map();
    isler.forEach(function (j) { indeg.set(j.id, 0); sonraki.set(j.id, []); });
    isler.forEach(function (j) {
      (j.deps || []).forEach(function (d) {
        if (!map.has(d)) return;
        sonraki.get(d).push(j.id);
        indeg.set(j.id, indeg.get(j.id) + 1);
      });
    });
    var k = [];
    indeg.forEach(function (v, id) { if (v === 0) k.push(id); });
    var sayac = 0;
    while (k.length) {
      var id = k.shift(); sayac++;
      sonraki.get(id).forEach(function (n) {
        indeg.set(n, indeg.get(n) - 1);
        if (indeg.get(n) === 0) k.push(n);
      });
    }
    return sayac !== isler.length;
  }

  function dogrula(isler, makineler, sonuc) {
    var hatalar = [];
    var jm = new Map(isler.map(function (j) { return [j.id, j]; }));
    var mm = new Map(makineler.map(function (m) { return [m.id, m]; }));
    var bloklar = (sonuc && sonuc.blocks) || [];
    var planlanamayan = (sonuc && sonuc.unscheduled) || [];
    var gorulen = new Set();
    var blokMap = new Map();

    function hata(tur, mesaj) { hatalar.push({ tur: tur, mesaj: mesaj }); }

    bloklar.forEach(function (b) {
      var j = jm.get(b.jobId), m = mm.get(b.machineId);
      if (!j) { hata('veri', 'Blokta tanınmayan iş: ' + b.jobId); return; }
      if (!m) { hata('veri', 'Blokta tanınmayan makine: ' + b.machineId); return; }
      if (gorulen.has(j.id)) hata('tekrar', 'Aynı iş birden fazla planlanmış: ' + j.name);
      gorulen.add(j.id);
      blokMap.set(j.id, b);

      if (b.end - b.start !== j.duration) {
        hata('sure', j.name + ': blok süresi ' + (b.end - b.start) + ' dk, işin süresi ' + j.duration + ' dk');
      }
      if (!(m.types || []).some(function (t) { return t === j.type; })) {
        hata('yetenek', j.name + ': ' + m.name + ' bu işlem türünü (' + j.type + ') desteklemiyor');
      }
      if (j.machines && j.machines.length && j.machines.indexOf(m.id) < 0) {
        hata('yetenek', j.name + ': bu iş ' + m.name + ' makinesinde çalışamaz');
      }
      if (m.available === false) hata('kapali', j.name + ': ' + m.name + ' kapalı');
      if (!vardiyaIcinde(m, b.start, b.end)) {
        hata('vardiya', j.name + ': ' + global.NumexPlan.fmtWhen(b.start) + ' vardiya dışında');
      }
      if (bakimlaCakisiyor(m, b.start, b.end)) {
        hata('bakim', j.name + ': ' + m.name + ' bakım/arıza aralığında planlanmış');
      }
    });

    // makine çakışması
    var makineyeGore = new Map();
    bloklar.forEach(function (b) {
      if (!makineyeGore.has(b.machineId)) makineyeGore.set(b.machineId, []);
      makineyeGore.get(b.machineId).push(b);
    });
    makineyeGore.forEach(function (liste, mid) {
      liste.sort(function (a, b) { return a.start - b.start; });
      for (var i = 1; i < liste.length; i++) {
        if (liste[i].start < liste[i - 1].end) {
          var m = mm.get(mid);
          hata('cakisma', (m ? m.name : mid) + ' üzerinde çakışma: ' +
            (jm.get(liste[i - 1].jobId) || {}).name + ' ↔ ' + (jm.get(liste[i].jobId) || {}).name);
        }
      }
    });

    // ön koşullar
    bloklar.forEach(function (b) {
      var j = jm.get(b.jobId);
      if (!j) return;
      (j.deps || []).forEach(function (d) {
        var db = blokMap.get(d);
        if (!db) { hata('bagimlilik', j.name + ': ön koşulu ' + d + ' planlanmamış ama iş planlanmış'); return; }
        if (db.end > b.start) {
          hata('bagimlilik', j.name + ': ön koşulu ' + ((jm.get(d) || {}).name || d) + ' bitmeden başlıyor');
        }
      });
    });

    // her iş ya planlı ya gerekçeli planlanamayan olmalı
    var raporlanan = new Set(planlanamayan.map(function (u) { return u.jobId; }));
    isler.forEach(function (j) {
      if (!gorulen.has(j.id) && !raporlanan.has(j.id)) {
        hata('kapsam', j.name + ': ne planlandı ne de gerekçesi yazıldı');
      }
      if (gorulen.has(j.id) && raporlanan.has(j.id)) {
        hata('kapsam', j.name + ': hem planlanmış hem planlanamayan listesinde');
      }
    });

    if (donguVarMi(isler)) {
      var donguPlanli = donguVarMi(isler) && bloklar.some(function (b) { return true; });
      if (!donguPlanli) hata('dongu', 'Döngüsel bağımlılık var ama hiçbir iş planlanamadı denmemiş');
    }

    return { gecti: hatalar.length === 0, hatalar: hatalar };
  }

  global.NumexValidator = { dogrula: dogrula, vardiyaIcinde: vardiyaIcinde };
})(typeof window !== 'undefined' ? window : globalThis);
