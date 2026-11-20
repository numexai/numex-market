/* ===================================================================
   NUMEX NÖBET — Planlama Çekirdeği (arayüzden tamamen bağımsız)
   İki algoritma: A) öncelik tabanlı  B) erken bitirme odaklı
   =================================================================== */
(function (global) {
  'use strict';

  var DAY = 1440;

  /* ---------------- zaman yardımcıları ---------------- */
  function pad(n) { return String(n).padStart(2, '0'); }

  function parseHHMM(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return v;
    var m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(v));
    if (!m) return null;
    return (+m[1]) * 60 + (+m[2]);
  }

  function fmtClock(min) {
    if (min == null || isNaN(min)) return '—';
    var d = Math.floor(min / DAY);
    var t = ((min % DAY) + DAY) % DAY;
    var s = pad(Math.floor(t / 60)) + ':' + pad(t % 60);
    return d > 0 ? s + ' (+' + d + 'g)' : s;
  }

  function fmtWhen(min) {
    if (min == null || isNaN(min)) return '—';
    var d = Math.floor(min / DAY) + 1;
    var t = ((min % DAY) + DAY) % DAY;
    return d + '. gün ' + pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  }

  function fmtSure(dk) {
    dk = Math.round(dk || 0);
    var s = Math.floor(dk / 60), d = dk % 60;
    if (s && d) return s + ' sa ' + d + ' dk';
    if (s) return s + ' sa';
    return d + ' dk';
  }

  /* ---------------- makine takvimi ---------------- */
  function vardiyaAraliklari(m) {
    var s = (m.start == null) ? 480 : m.start;
    var e = (m.end == null) ? 1080 : m.end;
    if (s === e) return [[0, DAY]];
    if (s < e) return [[s, e]];
    return [[s, DAY], [0, e]];
  }

  function makineTakvimi(m, gunSayisi) {
    if (m.available === false) return [];
    var parcalar = [];
    for (var d = 0; d < gunSayisi; d++) {
      var v = vardiyaAraliklari(m);
      for (var i = 0; i < v.length; i++) {
        parcalar.push({ start: d * DAY + v[i][0], end: d * DAY + v[i][1] });
      }
    }
    var bakim = (m.maintenance || []).slice().sort(function (a, b) { return a.start - b.start; });
    for (var b = 0; b < bakim.length; b++) {
      var yeni = [];
      for (var p = 0; p < parcalar.length; p++) {
        var iv = parcalar[p];
        if (bakim[b].end <= iv.start || bakim[b].start >= iv.end) { yeni.push(iv); continue; }
        if (bakim[b].start > iv.start) yeni.push({ start: iv.start, end: bakim[b].start });
        if (bakim[b].end < iv.end) yeni.push({ start: bakim[b].end, end: iv.end });
      }
      parcalar = yeni;
    }
    return parcalar.sort(function (a, b) { return a.start - b.start; });
  }

  /* İlk uygun boşluğu bul */
  function boslukBul(takvim, mesguller, enErken, sure) {
    for (var i = 0; i < takvim.length; i++) {
      var iv = takvim[i];
      var t = Math.max(enErken, iv.start);
      var kalkan = 0;
      while (t + sure <= iv.end && kalkan++ < 500) {
        var cakisan = null;
        for (var k = 0; k < mesguller.length; k++) {
          var b = mesguller[k];
          if (b.start < t + sure && b.end > t) { cakisan = b; break; }
        }
        if (!cakisan) return t;
        t = cakisan.end;
      }
    }
    return null;
  }

  /* ---------------- bağımlılık / döngü ---------------- */
  function tespitEt(isler) {
    var map = new Map(isler.map(function (j) { return [j.id, j]; }));
    var indeg = new Map(), adj = new Map();
    isler.forEach(function (j) { indeg.set(j.id, 0); adj.set(j.id, []); });
    var eksik = [];
    isler.forEach(function (j) {
      (j.deps || []).forEach(function (d) {
        if (!map.has(d)) { eksik.push({ job: j.id, dep: d }); return; }
        adj.get(d).push(j.id);
        indeg.set(j.id, indeg.get(j.id) + 1);
      });
    });
    var kuyruk = [];
    indeg.forEach(function (v, k) { if (v === 0) kuyruk.push(k); });
    var gorulen = 0;
    while (kuyruk.length) {
      var id = kuyruk.shift(); gorulen++;
      var komsu = adj.get(id);
      for (var i = 0; i < komsu.length; i++) {
        indeg.set(komsu[i], indeg.get(komsu[i]) - 1);
        if (indeg.get(komsu[i]) === 0) kuyruk.push(komsu[i]);
      }
    }
    var dongude = [];
    indeg.forEach(function (v, k) { if (v > 0) dongude.push(k); });
    return { inCycle: dongude, missingDeps: eksik, path: donguYolu(isler) };
  }

  function donguYolu(isler) {
    var map = new Map(isler.map(function (j) { return [j.id, (j.deps || []).slice()]; }));
    var durum = new Map(), yigin = [], bulunan = null;
    function gez(id) {
      if (bulunan) return;
      durum.set(id, 1); yigin.push(id);
      var deps = map.get(id) || [];
      for (var i = 0; i < deps.length; i++) {
        var d = deps[i];
        if (!map.has(d)) continue;
        if (durum.get(d) === 1) { var idx = yigin.indexOf(d); bulunan = yigin.slice(idx).concat(d); return; }
        if (!durum.has(d)) { gez(d); if (bulunan) return; }
      }
      yigin.pop(); durum.set(id, 2);
    }
    for (var i = 0; i < isler.length; i++) { if (!durum.has(isler[i].id)) gez(isler[i].id); if (bulunan) break; }
    return bulunan;
  }

  /* ---------------- planlama ---------------- */
  function planla(islerGirdi, makinelerGirdi, secenekler) {
    var opt = secenekler || {};
    var algo = opt.algo === 'earliest' ? 'earliest' : 'priority';
    var ufuk = opt.horizonDays || 3;

    var isler = islerGirdi.map(function (j) {
      return Object.assign({}, j, { deps: (j.deps || []).slice(), machines: (j.machines || []).slice() });
    });
    var makineler = makinelerGirdi.map(function (m) {
      return Object.assign({}, m, {
        types: (m.types || []).slice(),
        maintenance: (m.maintenance || []).map(function (b) { return Object.assign({}, b); })
      });
    });

    var dongu = tespitEt(isler);
    var islerMap = new Map(isler.map(function (j) { return [j.id, j]; }));
    var takvim = new Map(makineler.map(function (m) { return [m.id, makineTakvimi(m, ufuk)]; }));
    var mesgul = new Map(makineler.map(function (m) { return [m.id, []]; }));
    var bitis = new Map();
    var bloklar = [];
    var planlanamayan = [];
    var bekleyen = new Set(isler.map(function (j) { return j.id; }));

    dongu.inCycle.forEach(function (id) {
      planlanamayan.push({ jobId: id, sebep: 'Döngüsel bağımlılık — bu iş planlanamaz', tur: 'dongu' });
      bekleyen.delete(id);
    });

    function uygunMakineler(j) {
      return makineler.filter(function (m) {
        if ((m.types || []).indexOf(j.type) < 0) return false;
        if (j.machines && j.machines.length && j.machines.indexOf(m.id) < 0) return false;
        return true;
      });
    }

    function enErken(j) {
      var t = 0;
      (j.deps || []).forEach(function (d) {
        var f = bitis.get(d);
        if (f != null && f > t) t = f;
      });
      return t;
    }

    function yerBul(j) {
      if (!(j.duration > 0)) return null;
      var en = null;
      var adaylar = uygunMakineler(j);
      for (var i = 0; i < adaylar.length; i++) {
        var m = adaylar[i];
        var s = boslukBul(takvim.get(m.id) || [], mesgul.get(m.id), enErken(j), j.duration);
        if (s == null) continue;
        if (!en || s < en.start || (s === en.start && m.id < en.machineId)) en = { machineId: m.id, start: s };
      }
      return en;
    }

    function sebep(j) {
      var um = uygunMakineler(j);
      if (!um.length) return 'Bu işlem türünü yapan uygun makine yok';
      var acik = um.filter(function (m) { return (takvim.get(m.id) || []).length > 0; });
      if (!acik.length) return 'Makine kapalı ya da tümüyle bakımda';
      return 'Zaman ufkuna sığmıyor (vardiya/bakım dolu)';
    }

    function yerlestir(j, yer) {
      var b = { jobId: j.id, machineId: yer.machineId, start: yer.start, end: yer.start + j.duration };
      bloklar.push(b);
      bitis.set(j.id, b.end);
      var mb = mesgul.get(yer.machineId);
      mb.push(b);
      mb.sort(function (x, y) { return x.start - y.start; });
      bekleyen.delete(j.id);
    }

    var kalkan = 0;
    while (bekleyen.size && kalkan++ < 4000) {
      var oluVar = false;
      var bekleyenListe = Array.from(bekleyen);
      for (var bi = 0; bi < bekleyenListe.length; bi++) {
        var jj = islerMap.get(bekleyenListe[bi]);
        var olu = (jj.deps || []).some(function (d) { return !bitis.has(d) && !bekleyen.has(d); });
        if (olu) {
          planlanamayan.push({ jobId: jj.id, sebep: 'Ön koşulu planlanamayan iş', tur: 'bagimlilik' });
          bekleyen.delete(jj.id); oluVar = true;
        }
      }
      if (oluVar) continue;

      var hazir = Array.from(bekleyen).map(function (id) { return islerMap.get(id); })
        .filter(function (j) { return (j.deps || []).every(function (d) { return bitis.has(d); }); });

      if (!hazir.length) {
        Array.from(bekleyen).forEach(function (id) {
          planlanamayan.push({ jobId: id, sebep: 'Ön koşullar hiçbir zaman tamamlanmıyor', tur: 'bagimlilik' });
        });
        bekleyen.clear();
        break;
      }

      if (algo === 'priority') {
        hazir.sort(function (a, b) {
          return (b.priority || 3) - (a.priority || 3)
            || (a.due == null ? 1e9 : a.due) - (b.due == null ? 1e9 : b.due)
            || a.duration - b.duration
            || String(a.id).localeCompare(String(b.id));
        });
        var secilen = hazir[0];
        var yer = yerBul(secilen);
        if (yer) yerlestir(secilen, yer);
        else {
          planlanamayan.push({ jobId: secilen.id, sebep: sebep(secilen), tur: 'sigmiyor' });
          bekleyen.delete(secilen.id);
        }
      } else {
        var en = null;
        for (var h = 0; h < hazir.length; h++) {
          var j = hazir[h];
          var y = yerBul(j);
          if (!y) continue;
          var fin = y.start + j.duration;
          if (!en || fin < en.fin || (fin === en.fin && ((j.due == null ? 1e9 : j.due) < (en.job.due == null ? 1e9 : en.job.due)))) {
            en = { job: j, yer: y, fin: fin };
          }
        }
        if (!en) {
          hazir.forEach(function (j) {
            planlanamayan.push({ jobId: j.id, sebep: sebep(j), tur: 'sigmiyor' });
            bekleyen.delete(j.id);
          });
          continue;
        }
        yerlestir(en.job, en.yer);
      }
    }

    bloklar.sort(function (a, b) { return a.start - b.start || String(a.machineId).localeCompare(String(b.machineId)); });

    var sonuc = {
      algo: algo,
      blocks: bloklar,
      unscheduled: planlanamayan,
      cycles: dongu,
      machines: makineler,
      horizonDays: ufuk
    };
    sonuc.metrics = olcutler(isler, makineler, sonuc);
    return sonuc;
  }

  /* ---------------- ölçütler ---------------- */
  function olcutler(isler, makineler, sonuc) {
    var jm = new Map(isler.map(function (j) { return [j.id, j]; }));
    var bloklar = sonuc.blocks || [];
    var makespan = 0;
    bloklar.forEach(function (b) { if (b.end > makespan) makespan = b.end; });

    var geciken = [], toplamGecikme = 0;
    bloklar.forEach(function (b) {
      var j = jm.get(b.jobId);
      if (!j || j.due == null) return;
      if (b.end > j.due) {
        geciken.push({ jobId: j.id, gecikme: b.end - j.due });
        toplamGecikme += b.end - j.due;
      }
    });

    var gun = Math.max(1, Math.ceil((makespan || 1) / DAY) + 1);
    var kullanim = makineler.map(function (m) {
      var cal = makineTakvimi(m, gun);
      var kapasite = 0;
      cal.forEach(function (iv) {
        var a = Math.max(iv.start, 0), b = Math.min(iv.end, makespan);
        if (b > a) kapasite += (b - a);
      });
      var mesgulSure = 0, isSayisi = 0;
      bloklar.forEach(function (b) {
        if (b.machineId === m.id) { mesgulSure += (b.end - b.start); isSayisi++; }
      });
      return {
        machineId: m.id, ad: m.name, mesgul: mesgulSure, kapasite: kapasite,
        oran: kapasite ? mesgulSure / kapasite : 0, isSayisi: isSayisi
      };
    });

    return {
      makespan: makespan,
      planlanan: bloklar.length,
      planlanamayan: (sonuc.unscheduled || []).length,
      gecikenSayisi: geciken.length,
      geciken: geciken,
      toplamGecikme: toplamGecikme,
      ortalamaGecikme: geciken.length ? toplamGecikme / geciken.length : 0,
      kullanim: kullanim
    };
  }

  /* ---------------- plan karşılaştırma ---------------- */
  function karsilastir(onceki, yeni) {
    var a = new Map((onceki.blocks || []).map(function (b) { return [b.jobId, b]; }));
    var b = new Map((yeni.blocks || []).map(function (x) { return [x.jobId, x]; }));
    var yerDegistiren = [], makineDegisen = [], yeniler = [], dusenler = [];
    b.forEach(function (nb, id) {
      var ob = a.get(id);
      if (!ob) { yeniler.push(id); return; }
      if (ob.machineId !== nb.machineId) {
        makineDegisen.push({ jobId: id, eski: ob.machineId, yeni: nb.machineId });
        yerDegistiren.push(id);
      } else if (ob.start !== nb.start) yerDegistiren.push(id);
    });
    a.forEach(function (ob, id) { if (!b.has(id)) dusenler.push(id); });
    var mOnce = onceki.metrics || {}, mYeni = yeni.metrics || {};
    return {
      yerDegistiren: yerDegistiren,
      makineDegisen: makineDegisen,
      yeniler: yeniler,
      dusenler: dusenler,
      makespanFark: (mYeni.makespan || 0) - (mOnce.makespan || 0),
      gecikenFark: (mYeni.gecikenSayisi || 0) - (mOnce.gecikenSayisi || 0),
      planlananFark: (mYeni.planlanan || 0) - (mOnce.planlanan || 0)
    };
  }

  /* ---------------- Gantt yerleşimi (arayüz + test ortak) ---------------- */
  function yerlesim(isler, makineler, sonuc, secenek) {
    var o = secenek || {};
    var scale = o.scale || 0.6;
    var labelWidth = o.labelWidth || 158;
    var rowHeight = o.rowHeight || 46;
    var barHeight = Math.max(14, rowHeight - 20);
    var bloklar = (sonuc && sonuc.blocks) || [];

    var bas = Infinity, son = 0;
    makineler.forEach(function (m) {
      var v = vardiyaAraliklari(m);
      bas = Math.min(bas, v[0][0]);
      son = Math.max(son, v[v.length - 1][1]);
    });
    bloklar.forEach(function (b) { bas = Math.min(bas, b.start); son = Math.max(son, b.end); });
    if (!isFinite(bas)) bas = 0;
    bas = Math.floor(bas / 60) * 60;
    son = Math.ceil((son + 30) / 60) * 60;
    if (son <= bas) son = bas + 480;

    var span = son - bas;
    var width = labelWidth + span * scale + 24;
    var rows = makineler.map(function (m, i) {
      return { machineId: m.id, ad: m.name, top: i * rowHeight, height: rowHeight };
    });
    var satirMap = new Map(rows.map(function (r) { return [r.machineId, r]; }));

    var bars = bloklar.map(function (b) {
      var r = satirMap.get(b.machineId);
      return {
        jobId: b.jobId, machineId: b.machineId, start: b.start, end: b.end,
        left: labelWidth + (b.start - bas) * scale,
        width: Math.max(3, (b.end - b.start) * scale),
        top: (r ? r.top : 0) + 10, height: barHeight
      };
    });

    return {
      scale: scale, labelWidth: labelWidth, rowHeight: rowHeight,
      base: bas, end: son, span: span, width: width,
      height: rows.length * rowHeight,
      rows: rows, bars: bars
    };
  }

  global.NumexPlan = {
    DAY: DAY,
    parseHHMM: parseHHMM,
    fmtClock: fmtClock,
    fmtWhen: fmtWhen,
    fmtSure: fmtSure,
    vardiyaAraliklari: vardiyaAraliklari,
    makineTakvimi: makineTakvimi,
    tespitEt: tespitEt,
    donguYolu: donguYolu,
    planla: planla,
    olcutler: olcutler,
    karsilastir: karsilastir,
    yerlesim: yerlesim
  };
})(typeof window !== 'undefined' ? window : globalThis);
