/* ===================================================================
   NUMEX NÖBET — Kabul sınavları (tarayıcıda gerçekten koşar)
   =================================================================== */
(function (global) {
  'use strict';
  var P = global.NumexPlan, V = global.NumexValidator, SEN = global.NumexSenaryolar;

  function klon(x) { return JSON.parse(JSON.stringify(x)); }
  function s(no, ad, gecti, detay) { return { no: no, ad: ad, gecti: !!gecti, detay: detay || '' }; }

  /* 1 — aynı makinede çakışma yok */
  function t1() {
    var d = SEN.A();
    var r = P.planla(d.jobs, d.machines, { algo: 'priority' });
    var cakisma = 0;
    for (var i = 0; i < r.blocks.length; i++) {
      for (var j = i + 1; j < r.blocks.length; j++) {
        var a = r.blocks[i], b = r.blocks[j];
        if (a.machineId === b.machineId && a.start < b.end && b.start < a.end) cakisma++;
      }
    }
    return s(1, 'Tek makinede iki iş asla çakışmıyor', cakisma === 0 && r.blocks.length > 0,
      cakisma ? cakisma + ' çakışma bulundu' : r.blocks.length + ' blok tarandı, çakışma yok');
  }

  /* 2 — A→B→C sırası korunuyor */
  function t2() {
    var m = [{ id: 'M', name: 'Tezgâh', types: ['X'], start: 480, end: 1080, available: true, maintenance: [] }];
    var j = [
      { id: 'A', name: 'A', type: 'X', duration: 30, priority: 3, due: 900, machines: [], deps: [] },
      { id: 'B', name: 'B', type: 'X', duration: 30, priority: 3, due: 900, machines: [], deps: ['A'] },
      { id: 'C', name: 'C', type: 'X', duration: 30, priority: 3, due: 900, machines: [], deps: ['B'] }
    ];
    var r = P.planla(j, m, { algo: 'earliest' });
    var bm = new Map(r.blocks.map(function (b) { return [b.jobId, b]; }));
    var okB = bm.has('A') && bm.has('B') && bm.has('C') && bm.get('A').end <= bm.get('B').start && bm.get('B').end <= bm.get('C').start;
    return okB
      ? s(2, 'A → B → C bağımlılık sırası korunuyor', true, 'A bitiş ' + P.fmtClock(bm.get('A').end) + ' ≤ B başlangıç ' + P.fmtClock(bm.get('B').start))
      : s(2, 'A → B → C bağımlılık sırası korunuyor', false, 'Sıra bozuk: ' + JSON.stringify(r.blocks));
  }

  /* 3 — döngü yakalanıyor */
  function t3() {
    var m = [{ id: 'M', name: 'Tezgâh', types: ['X'], start: 480, end: 1080, available: true, maintenance: [] }];
    var j = [
      { id: 'A', name: 'A', type: 'X', duration: 30, priority: 3, due: 900, machines: [], deps: ['B'] },
      { id: 'B', name: 'B', type: 'X', duration: 30, priority: 3, due: 900, machines: [], deps: ['A'] }
    ];
    var r = P.planla(j, m, { algo: 'priority' });
    var dongu = r.cycles.inCycle.length === 2;
    var rapor = r.unscheduled.some(function (u) { return u.tur === 'dongu'; });
    return s(3, 'A → B → A döngüsü yakalanıyor ve raporlanıyor', dongu && rapor && r.blocks.length === 0,
      'döngü: ' + (r.cycles.path || []).join(' → ') + ' · planlanamayan: ' + r.unscheduled.length);
  }

  /* 4 — uygun makine yoksa planlanamıyor */
  function t4() {
    var d = SEN.A();
    var ekstra = { id: 'ZX', name: 'Lazer kazıma', type: 'Lazer', duration: 30, priority: 5, due: 900, machines: [], deps: [] };
    var isler = d.jobs.concat([ekstra]);
    var r = P.planla(isler, d.machines, { algo: 'priority' });
    var u = r.unscheduled.filter(function (x) { return x.jobId === 'ZX'; })[0];
    return s(4, 'Uygun makine yoksa iş planlanamıyor', !!u && /makine yok/i.test(u.sebep),
      u ? 'gerekçe: ' + u.sebep : 'iş yanlışlıkla planlandı');
  }

  /* 5 — arıza sonrası bakım aralığına iş konmuyor */
  function t5() {
    var d = SEN.A();
    var mk = klon(d.machines);
    var hedef = mk[0];
    hedef.maintenance.push({ start: 600, end: 720, reason: 'Test arızası (10:00–12:00)' });
    var r = P.planla(d.jobs, mk, { algo: 'priority' });
    var ihlal = r.blocks.filter(function (b) {
      return b.machineId === hedef.id && b.start < 720 && b.end > 600;
    });
    var dg = V.dogrula(d.jobs, mk, r);
    return s(5, 'Arıza sonrası bakım aralığına iş konmuyor', ihlal.length === 0 && dg.gecti,
      ihlal.length ? ihlal.length + ' iş bakım aralığında' : '0 ihlal · doğrulayıcı: ' + (dg.gecti ? 'GEÇTİ' : 'HATA'));
  }

  /* 6 — acil iş eklenince yeniden plan */
  function t6() {
    var d = SEN.A();
    var ilk = P.planla(d.jobs, d.machines, { algo: 'priority' });
    var acil = { id: 'ACIL', name: 'ACİL — kırık parça', type: 'Kesim', duration: 45, priority: 5, due: 660, machines: [], deps: [] };
    var yeni = P.planla(d.jobs.concat([acil]), d.machines, { algo: 'priority' });
    var planli = yeni.blocks.some(function (b) { return b.jobId === 'ACIL'; });
    var dg = V.dogrula(d.jobs.concat([acil]), d.machines, yeni);
    var fark = P.karsilastir(ilk, yeni).yerDegistiren.length;
    return s(6, 'Acil iş eklenince plan yeniden hesaplanıyor', planli && dg.gecti,
      planli ? 'acil iş planlandı · ' + fark + ' iş yer değiştirdi' : 'acil iş planlanamadı');
  }

  /* 7 — algoritmalar gerçekten farklı karar veriyor */
  function t7() {
    var m = [{ id: 'M1', name: 'Tek Tezgâh', types: ['X'], start: 480, end: 1080, available: true, maintenance: [] }];
    var j = [
      { id: 'UZUN', name: 'Uzun iş', type: 'X', duration: 120, priority: 5, due: 900, machines: [], deps: [] },
      { id: 'KISA', name: 'Kısa iş', type: 'X', duration: 20, priority: 1, due: 700, machines: [], deps: [] }
    ];
    var a = P.planla(j, m, { algo: 'priority' });
    var b = P.planla(j, m, { algo: 'earliest' });
    var ilkA = a.blocks[0] && a.blocks[0].jobId, ilkB = b.blocks[0] && b.blocks[0].jobId;
    return s(7, 'Öncelik ve erken bitirme farklı karar kuralları kullanıyor', ilkA === 'UZUN' && ilkB === 'KISA',
      'Öncelik ilk: ' + ilkA + ' · Erken bitirme ilk: ' + ilkB);
  }

  /* 8 — JSON gidiş-dönüş aynı planı üretiyor */
  function t8() {
    var d = SEN.B();
    var r1 = P.planla(d.jobs, d.machines, { algo: 'earliest' });
    var yuvarlak = JSON.parse(JSON.stringify({ jobs: d.jobs, machines: d.machines }));
    var r2 = P.planla(yuvarlak.jobs, yuvarlak.machines, { algo: 'earliest' });
    var ayni = JSON.stringify(r1.blocks) === JSON.stringify(r2.blocks);
    return s(8, 'JSON geri yüklenince aynı girdi aynı planı üretiyor', ayni,
      ayni ? r1.blocks.length + ' blok birebir aynı' : 'planlar farklı çıktı');
  }

  /* 9 — Gantt koordinatları hesapla örtüşüyor */
  function t9() {
    var d = SEN.A();
    var r = P.planla(d.jobs, d.machines, { algo: 'priority' });
    var scale = 0.8, LW = 158;
    var L = P.yerlesim(d.jobs, d.machines, r, { scale: scale, labelWidth: LW });
    var bozuk = 0, ornek = '';
    L.bars.forEach(function (bar) {
      var beklenenSol = LW + (bar.start - L.base) * scale;
      var beklenenGen = (bar.end - bar.start) * scale;
      if (Math.abs(bar.left - beklenenSol) > 0.001 || Math.abs(bar.width - beklenenGen) > 0.001) {
        bozuk++; if (!ornek) ornek = bar.jobId;
      }
    });
    return s(9, 'Gantt blok koordinatları başlangıç/bitişle eşleşiyor', bozuk === 0 && L.bars.length > 0,
      bozuk ? bozuk + ' blok kaymış (ör. ' + ornek + ')' : L.bars.length + ' blok koordinatı birebir doğru');
  }

  /* 10 — kaos senaryosunda tüm kısıtlar bağımsız doğrulayıcıdan geçiyor */
  function t10() {
    var d = SEN.C();
    var r = P.planla(d.jobs, d.machines, { algo: 'earliest' });
    var dg = V.dogrula(d.jobs, d.machines, r);
    var m = r.metrics;
    return s(10, 'Kaos senaryosu bağımsız doğrulayıcıdan geçiyor', dg.gecti,
      dg.gecti
        ? '20 iş · ' + m.planlanan + ' planlandı · ' + m.planlanamayan + ' planlanamadı · bitiş ' + P.fmtClock(m.makespan)
        : dg.hatalar.length + ' hata: ' + dg.hatalar.slice(0, 3).map(function (h) { return h.mesaj; }).join(' | '));
  }

  function calistir() {
    var liste = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10];
    var cikti = [];
    liste.forEach(function (fn) {
      try { cikti.push(fn()); }
      catch (e) { cikti.push(s(cikti.length + 1, 'Test çöktü', false, e.message)); }
    });
    return cikti;
  }

  global.NumexTestler = { calistir: calistir };
})(typeof window !== 'undefined' ? window : globalThis);
