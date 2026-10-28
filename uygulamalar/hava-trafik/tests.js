/* NUMEX CORE — SKY COMMAND · otomatik test koşucusu (TEST 1-6)
   Tarayıcıda gerçek motora karşı koşar; sonucu window.__TEST_RESULTS'a yazar. */
(function () {
  'use strict';
  const R = [];
  const ok = (id, name, pass, detail) => R.push({ id, name, pass: !!pass, detail });

  function run() {
    const N = window.NUMEX;
    if (!N) { window.__TEST_RESULTS = [{ id: 0, name: 'motor yüklü', pass: false, detail: 'NUMEX yok' }]; return; }
    // Test sayfasında uygulama arayüzü (index.html DOM'u) yoktur → motoru doğrudan tohumla
    if (!N.flights.length) N.seedWorld();
    N.STATE.running = true;
    if (window.SKY3D) { try { window.SKY3D.update(); } catch (_) { } }

    // --- TEST 1: radar / 3D tutarlılığı ---
    try {
      const f = N.flights.find(x => x.state !== 'BİTTİ' && x.altitude > 60) || N.flights[0];
      const motorPos = { x: f.x, z: f.z };
      const S3 = window.SKY3D;
      let det, pass;
      if (!S3) {
        // 3D kurulamamışsa kanıtı ile bildir (hangi ön koşul eksik)
        det = `SKY3D yok · THREE=${!!window.THREE} · canvas=${!!document.getElementById('three')} · wrap=${!!document.getElementById('threeWrap')} · HATA=${window.__SKY3D_ERR || 'kayıtlı hata yok'}`;
        pass = false;
      }
      else {
        S3.update(); // 3D senkronu zorla
        const p = S3.worldPosOf(f.id);
        if (!p) { det = 'uçak 3D sahnede bulunamadı'; pass = false; }
        else {
          const dx = Math.abs(p.x - motorPos.x), dz = Math.abs(p.z - motorPos.z);
          pass = dx < 1e-6 && dz < 1e-6;
          det = `${f.callsign}: motor(x=${motorPos.x.toFixed(4)}, z=${motorPos.z.toFixed(4)}) · 3D(x=${p.x.toFixed(4)}, z=${p.z.toFixed(4)}) · sapma=${Math.max(dx, dz).toExponential(2)} km`;
        }
      }
      ok(1, 'Radar / 3D tutarlılığı', pass, det);
    } catch (e) { ok(1, 'Radar / 3D tutarlılığı', false, 'istisna: ' + e.message); }

    // --- TEST 2: pist çatışması ---
    try {
      const rw = N.AIRPORT.runways[0];
      // NUMEX-DÜZELTME (2026-10-27): Test 2 yanlış negatif veriyordu: seçilen ikinci uçağa pist dolu olduğu için (doğru biçimde) reddediliyordu. Test artık iki uçağı da pistsiz başlangıca alıp çakışma kuralını yalıtıyor.
      rw.assigned = null; rw.closed = false;
      const adaylar = N.flights.filter(f => f.state !== 'BİTTİ');
      const a = adaylar[0], b = adaylar[1];
      // iki uçağı da pistsiz başlangıca al (test yalnız çakışma kuralını ölçsün)
      [a, b].forEach(x => { if (x) { const o = N.AIRPORT.runways.find(r => r.short === x.runway); if (o && o.assigned === x.callsign) o.assigned = null; x.runway = null; } });
      rw.assigned = null;
      if (!a || !b) { ok(2, 'Pist çatışması', false, 'denenecek iki uçuş bulunamadı'); }
      else {
        const r1 = N.doAction(a, 'reroute', 'TEST');
        // ikinci uçağı aynı piste zorla: pist dolu olduğu için REDDEDİLMELİ
        const r2 = N.applyDecision({ flightId: b.id, type: 'runway', action: 'reroute', forceRunway: rw.short, reason: 'test' }, 'OPERATOR');
        const pass = r1.ok === true && r2.ok === false;
        ok(2, 'Pist çatışması', pass,
          `${rw.short}: 1. uçak ${a.callsign}=${r1.ok ? 'atandı' : 'reddedildi'} · 2. uçak ${b.callsign}=${r2.ok ? 'ATANDI (HATA)' : 'reddedildi'} → ${r2.why || ''}`);
      }
    } catch (e) { ok(2, 'Pist çatışması', false, 'istisna: ' + e.message); }

    // --- TEST 3: acil durum önceliği ---
    try {
      N.scenario('B');
      N.tick(4000); // motoru besle
      const list = N.analyze();
      const emgAlert = list.find(x => /acil/i.test(x.title) || /acil/i.test(x.type));
      const emgFlight = N.flights.find(f => f.emergency);
      const pass = !!emgFlight && !!emgAlert && emgAlert.action && emgAlert.expected;
      ok(3, 'Acil durum önceliği', pass,
        emgFlight
          ? `${emgFlight.callsign} acil=${emgFlight.emergency} · uyarı="${emgAlert ? emgAlert.title : 'YOK'}" · öneri="${emgAlert ? emgAlert.action : '—'}" · sonuç="${emgAlert ? emgAlert.expected : '—'}"`
          : 'acil durum bildiren uçak oluşmadı');
    } catch (e) { ok(3, 'Acil durum önceliği', false, 'istisna: ' + e.message); }

    // --- TEST 4: yetkisiz müdahale (ÖNERİ modu) ---
    try {
      N.authority.mode = 'ONERI';
      const f = N.flights.find(x => x.state === 'SEYİR') || N.flights.find(x => x.state !== 'BİTTİ');
      const before = f.state;
      const r = N.applyDecision({ flightId: f.id, type: 'other', action: 'climb', reason: 'yetkisiz test' }, 'MOTOR');
      const after = f.state;
      const denyLogged = N.events.some(e => e.kind === 'DENY');
      const pass = r.ok === false && before === after && denyLogged;
      ok(4, 'Yetkisiz müdahale', pass,
        `mod=ONERI · motor isteği=${r.ok ? 'KABUL (HATA)' : 'REDDEDİLDİ'} · gerekçe="${r.why || ''}" · uçuş durumu ${before}→${after} · DENY kaydı=${denyLogged}`);
    } catch (e) { ok(4, 'Yetkisiz müdahale', false, 'istisna: ' + e.message); }

    // --- TEST 5: çoklu kriz ---
    try {
      N.scenario('E');
      N.tick(3000);
      const list = N.analyze();
      const kinds = [...new Set(list.map(a => a.type))];
      // çelişki kontrolü: aynı uçağa zıt yönlü iki karar (ör. hem tırman hem alçal)
      const perFlight = {};
      list.forEach(a => {
        if (!a.target) return;
        (perFlight[a.target] = perFlight[a.target] || []).push(a);
      });
      let conflict = null;
      Object.entries(perFlight).forEach(([fid, arr]) => {
        const acts = arr.map(x => (x.decision && x.decision.action) || '');
        if (acts.includes('climb') && acts.includes('descend')) conflict = `uçak #${fid}: hem tırman hem alçal`;
      });
      const closed = N.AIRPORT.runways.some(r => r.closed);
      const pass = closed && kinds.length >= 3 && !conflict;
      ok(5, 'Çoklu kriz', pass,
        `kapalı pist=${closed} · algılanan olay türü=${kinds.length} (${kinds.join(' / ')}) · uyarı sayısı=${list.length} · çelişen karar=${conflict || 'yok'}`);
    } catch (e) { ok(5, 'Çoklu kriz', false, 'istisna: ' + e.message); }

    // --- TEST 6: durum sürekliliği (sekme geçişi) ---
    try {
      const snapshot = N.flights.map(f => ({ id: f.id, state: f.state, cs: f.callsign }));
      const simBefore = performance.now();
      document.querySelector('.tab[data-tab="airport"]').click();
      document.querySelector('.tab[data-tab="ops"]').click();
      document.querySelector('.tab[data-tab="radar"]').click();
      const after = N.flights;
      let diff = 0;
      snapshot.forEach(s => {
        const f = after.find(x => x.id === s.id);
        if (!f || f.callsign !== s.cs) diff++;
      });
      const pass = diff === 0 && after.length === snapshot.length;
      ok(6, 'Durum sürekliliği', pass,
        `sekme geçişi (radar→3D→operasyon→radar) sonrası ${after.length} uçuş korundu, kayıp/bozulma=${diff}`);
    } catch (e) { ok(6, 'Durum sürekliliği', false, 'istisna: ' + e.message); }

    window.__TEST_RESULTS = R;
    return R;
  }

  window.__RUN_TESTS = run;
})();
