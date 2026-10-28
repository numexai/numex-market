/**
 * test-dom.js — Tarayici ici (headless) DOM + etkilesim testi
 * ---------------------------------------------------------------
 * Sayfayi jsdom OLMADAN, saf Node + CDP gerektirmeden dogrulamak
 * zor oldugu icin bu test, mantik katmanini ve canvas hit-test
 * matematigini birebir ayni formullerle dogrular.
 * Boylece "tiklayinca sinyal gidiyor mu" sorusunun ARKASINDAKI
 * hesap kanitlanir.
 *
 * Calistir: node test-dom.js
 */
'use strict';

const P = require('./public/js/physiology.js');
const A = require('./public/js/anatomy.js');
const Part = require('./public/js/particles.js');

let passed = 0, failed = 0;
const results = [];
function check(name, cond, detail) {
  if (cond) { passed++; results.push(['GECTI', name, detail]); }
  else { failed++; results.push(['KALDI', name, detail]); }
}

console.log('\n=== ETKILESIM & HIT-TEST KONTROLLERI ===\n');

// ---------------------------------------------------------------
// Hit-test: app.js ile AYNI formul (ekran -> normalize donusum)
// ---------------------------------------------------------------
function hitTest(nx, ny) {
  let best = null, bestD = Infinity;
  for (const z of A.CLICK_ZONES) {
    const dx = (nx - z.cx) / z.rx;
    const dy = (ny - z.cy) / z.ry;
    const d = dx * dx + dy * dy;
    if (d <= 1 && d < bestD) { bestD = d; best = z; }
  }
  return best;
}

// TEST A — her bolgenin MERKEZINE tiklayinca o bolge secilmeli
{
  let ok = 0, bad = [];
  A.CLICK_ZONES.forEach(z => {
    const hit = hitTest(z.cx, z.cy);
    if (hit && hit.id === z.id) ok++;
    else bad.push(`${z.id}→${hit ? hit.id : 'yok'}`);
  });
  check(
    'A Hit-test → her tiklanabilir alanin merkezi dogru bolgeyi secer',
    ok === A.CLICK_ZONES.length,
    bad.length ? `hatali: ${bad.join(', ')}` : `${ok}/${A.CLICK_ZONES.length} alan dogru`
  );
}

// TEST B — bos alana (vucut disi) tiklayinca hicbir bolge secilmemeli
{
  const empty = hitTest(0.05, 0.05);   // sol-ust kose, vucut disi
  const empty2 = hitTest(0.95, 0.95);  // sag-alt kose
  check(
    'B Hit-test → vucut disina tiklayinca bolge secilmez',
    empty === null && empty2 === null,
    `kose1=${empty ? empty.id : 'yok'} kose2=${empty2 ? empty2.id : 'yok'}`
  );
}

// TEST C — her bolge icin sinir yolu + fizyolojik tepki uretimi
{
  const rows = [];
  let ok = true;
  Object.keys(P.BODY_TARGETS).forEach(id => {
    const target = P.BODY_TARGETS[id];
    const nerve = A.NERVES.find(n => n.target === id);
    if (!nerve) { ok = false; rows.push(`${id}: SINIR YOK`); return; }

    const st = P.createState();
    const res = P.fireSignal(st, target);

    // Gecikme pozitif ve makul aralikta olmali (5ms - 500ms)
    if (!(res.ms >= 5 && res.ms <= 500)) { ok = false; rows.push(`${id}: ms=${res.ms}`); }
    // state'e yazilmis olmali
    if (st.responseMs !== res.ms || st.lastTarget !== id) {
      ok = false; rows.push(`${id}: state yazilmadi`);
    }
    // sinyal paketi uretilebilmeli
    const sig = Part.createNerveSignal(nerve, nerve.type, res.ms);
    if (!(sig.speed > 0 && sig.t === 0 && !sig.done)) {
      ok = false; rows.push(`${id}: sinyal bozuk`);
    }
    rows.push(`${id}=${res.ms}ms`);
  });
  check(
    'C Etkilesim → 10 bolgenin tamami sinyal + gecikme uretir',
    ok,
    rows.join(' ')
  );
}

// TEST D — sinyal paketi zamanda hedefe ULASMALI (animasyon gercek)
{
  const nerve = A.NERVES.find(n => n.target === 'rhand');
  const st = P.createState();
  const res = P.fireSignal(st, P.BODY_TARGETS.rhand);
  const sig = Part.createNerveSignal(nerve, nerve.type, res.ms);
  const signals = [sig];

  let elapsed = 0;
  while (!sig.done && elapsed < 5) {
    Part.stepSignals(signals, 1 / 60);
    elapsed += 1 / 60;
  }

  check(
    'D Sinyal → paket hedefe ulasir ve sonra kaybolur',
    sig.done === true && elapsed < 5,
    `varis=${elapsed.toFixed(2)}s (fizyolojik beklenti ~${(res.ms / 1000).toFixed(2)}s)`
  );

  // Animasyon suresi bilinçli olarak olceklenir (gercek 20ms
  // gozle gorulemez) ANCAK fizyolojik SIRALAMAYI korumali:
  // uzun yol / hasarli sinir → ekranda da daha uzun surer.
  {
    const fastNerve = A.NERVES.find(n => n.target === 'head');   // kisa yol
    const slowSt = P.createState();
    slowSt.nerveConduction = 0.35;                               // hasarli
    const slowRes = P.fireSignal(slowSt, P.BODY_TARGETS.lfoot);  // uzun yol
    const slowSig = Part.createNerveSignal(
      A.NERVES.find(n => n.target === 'lfoot'), 'sensory', slowRes.ms
    );
    const arr = [slowSig];
    let t = 0;
    while (!slowSig.done && t < 10) { Part.stepSignals(arr, 1 / 60); t += 1 / 60; }

    check(
      'D2 Sinyal → animasyon bilinçli olcekli ama SIRALAMA korunur',
      elapsed >= 0.1 && elapsed < 2 && t > elapsed * 1.5,
      `hizli (bas, ${res.ms}ms) → ${elapsed.toFixed(2)}s | yavas (hasarli ayak, ${slowRes.ms}ms) → ${t.toFixed(2)}s`
    );
  }
}

// TEST E — sinyal sonme dongusu (bellegi sizdirmaz)
{
  const nerve = A.NERVES.find(n => n.target === 'head');
  const signals = [];
  // 60 sinyal uret, hepsi sonup temizlenmeli
  for (let i = 0; i < 60; i++) {
    signals.push(Part.createNerveSignal(nerve, nerve.type, 30));
  }
  for (let i = 0; i < 300; i++) Part.stepSignals(signals, 1 / 60);

  check(
    'E Sinyal yasam dongusu → tum paketler sonup listeden temizlenir',
    signals.length === 0,
    `kalan=${signals.length} (60 uretildi)`
  );
}

// TEST F — nabiz dalgasi kalp atisiyla senkron uretilir ve soner
{
  const pulses = [];
  pulses.push(Part.createPulseWave(A.VESSELS, 'aorta'));
  for (let i = 0; i < 120; i++) Part.stepPulses(pulses, 1 / 60);
  check(
    'F Nabiz dalgasi → uretilir, ilerler ve damardan cikinca silinir',
    pulses.length === 0,
    `kalan=${pulses.length}`
  );
}

// TEST G — senaryo degisimi state parametrelerini GERCEKTEN degistirir
{
  const S = require('./public/js/scenarios.js');
  const ids = ['rest', 'exercise', 'stress', 'hypoxia', 'arrhythmia', 'nerve-delay'];
  const finals = {};

  ids.forEach(id => {
    const st = P.createState();
    st.scenario = id;
    S.getById(id).enter(st);
    for (let i = 0; i < 20 * 60; i++) {
      S.applyScenario(st, 1 / 60);
      P.step(st, 1 / 60);
    }
    finals[id] = P.snapshot(st);
  });

  const hrSet = new Set(ids.map(id => finals[id].hr));
  check(
    'G Senaryolar → her senaryo farkli kalp hizi uretir (6 ayri deger)',
    hrSet.size === ids.length,
    ids.map(id => `${id}=${finals[id].hr}`).join(' ')
  );

  check(
    'G2 Senaryolar → hipoksi tek basina dusuk SpO2 uretir',
    finals['hypoxia'].spo2 < 90 && finals['rest'].spo2 >= 95,
    `hipoksi=${finals['hypoxia'].spo2}% dinlenme=${finals['rest'].spo2}%`
  );

  check(
    'G3 Senaryolar → sinir gecikmesi senaryosu iletimi dusurur',
    finals['nerve-delay'].nerveConduction < 0.5,
    `iletim=${finals['nerve-delay'].nerveConduction}×`
  );
}

// TEST H — reset davranisi temiz state uretir
{
  const st = P.createState();
  st.scenario = 'hypoxia';
  for (let i = 0; i < 600; i++) P.step(st, 1 / 60);
  const dirty = st.t;

  const fresh = P.createState();
  check(
    'H Reset → yeni state sifir zaman ve bazal degerlerle baslar',
    fresh.t === 0 && fresh.hr === 72 && fresh.spo2 === 98 && dirty > 0,
    `kirli t=${dirty.toFixed(1)}s → temiz t=${fresh.t}s hr=${fresh.hr}`
  );
}

// RAPOR
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('DURUM', 8) + pad('TEST', 66) + 'DETAY');
console.log('-'.repeat(128));
results.forEach(([status, name, detail]) => {
  console.log(pad((status === 'GECTI' ? '  ✓ ' : '  ✗ ') + status, 8) + pad(name, 66) + (detail || ''));
});
console.log('-'.repeat(128));
console.log(`\nSONUC: ${passed} gecti, ${failed} kaldi  (toplam ${passed + failed})\n`);
process.exit(failed > 0 ? 1 : 0);
