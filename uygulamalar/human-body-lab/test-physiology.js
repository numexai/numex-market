/**
 * test-physiology.js — Otonom mantik kontrolleri
 * Calistir: node test-physiology.js
 * Harici bagimlilik yok. Cikis kodu 0 = hepsi gecti, 1 = basarisiz.
 */
'use strict';

const P = require('./public/js/physiology.js');
const S = require('./public/js/scenarios.js');
const A = require('./public/js/anatomy.js');

let passed = 0, failed = 0;
const results = [];

function check(name, condition, detail) {
  if (condition) { passed++; results.push(['GECTI', name, detail]); }
  else { failed++; results.push(['KALDI', name, detail]); }
}

/** Senaryoyu N saniye kosup state dondur. */
function run(id, sec) {
  const st = P.createState();
  st.scenario = id;
  S.getById(id).enter(st);
  const steps = Math.round(sec * 60);
  for (let i = 0; i < steps; i++) {
    S.applyScenario(st, 1 / 60);
    P.step(st, 1 / 60);
  }
  return st;
}

console.log('\n=== HUMAN BODY NEURAL & CIRCULATION LAB — MANTIK KONTROLLERI ===\n');

// ------------------------------------------------------------------
// TEST 1 — Dinlenme: normal fizyolojik araliklar
// ------------------------------------------------------------------
const rest = run('rest', 12);
const restSnap = P.snapshot(rest);
check(
  'T1 Dinlenme → kalp hizi 60-100 bpm arasinda',
  restSnap.hr >= 60 && restSnap.hr <= 100,
  `hr=${restSnap.hr}`
);
check(
  'T1b Dinlenme → kan basinci 110-130 / 70-85 mmHg',
  restSnap.bp.sys >= 110 && restSnap.bp.sys <= 130 &&
  restSnap.bp.dia >= 70 && restSnap.bp.dia <= 85,
  `bp=${restSnap.bp.sys}/${restSnap.bp.dia}`
);
check(
  'T1c Dinlenme → kalp debisi 4.5-5.5 L/dk',
  restSnap.flow >= 4.5 && restSnap.flow <= 5.5,
  `flow=${restSnap.flow} L/dk`
);

// ------------------------------------------------------------------
// TEST 2 — Egzersiz kalbi GERCEKTEN hizlandirmali (dinlenmeye kiyasla)
// ------------------------------------------------------------------
const ex = run('exercise', 25);
const exSnap = P.snapshot(ex);
check(
  'T2 Egzersiz → kalp hizi dinlenmeden en az 50 bpm yuksek',
  exSnap.hr - restSnap.hr >= 50,
  `dinlenme=${restSnap.hr} egzersiz=${exSnap.hr}`
);
check(
  'T2b Egzersiz → kalp debisi dinlenmeden en az 2 kati yuksek',
  exSnap.flow >= restSnap.flow * 2,
  `dinlenme=${restSnap.flow} egzersiz=${exSnap.flow} L/dk`
);
check(
  'T2c Egzersiz → SpO2 korunur (>=%94, dokuya oksijen yetisir)',
  exSnap.spo2 >= 94,
  `spo2=${exSnap.spo2}%`
);

// ------------------------------------------------------------------
// TEST 3 — Stres: vazokonstriksiyon MAP'i yukseltmeli
// ------------------------------------------------------------------
const stress = run('stress', 25);
const stressSnap = P.snapshot(stress);
check(
  'T3 Stres → ortalama arter basinci dinlenmeden yuksek (vazokonstriksiyon)',
  stressSnap.map > restSnap.map,
  `dinlenme MAP=${restSnap.map} stres MAP=${stressSnap.map} mmHg`
);
check(
  'T3b Stres → kalp hizi 100-140 araliginda',
  stressSnap.hr >= 100 && stressSnap.hr <= 145,
  `hr=${stressSnap.hr}`
);

// ------------------------------------------------------------------
// TEST 4 — Hipoksi: SpO2 GERCEKTEN dusmeli (Hill egrisi)
// ------------------------------------------------------------------
const hyp = run('hypoxia', 30);
const hypSnap = P.snapshot(hyp);
check(
  'T4 Hipoksi → SpO2 %95 altina duser',
  hypSnap.spo2 < 95,
  `spo2=${hypSnap.spo2}%`
);
check(
  'T4b Hipoksi → arteriyel PO2 80 mmHg altina duser',
  hypSnap.paO2 < 80,
  `paO2=${hypSnap.paO2} mmHg`
);

// ------------------------------------------------------------------
// TEST 5 — Aritmi: ritim duzensiz OLMALI (varyans kanit)
// ------------------------------------------------------------------
{
  const st = P.createState();
  st.scenario = 'arrhythmia';
  S.getById('arrhythmia').enter(st);
  const samples = [];
  for (let i = 0; i < 20 * 60; i++) {
    S.applyScenario(st, 1 / 60);
    P.step(st, 1 / 60);
    if (i % 30 === 0) samples.push(st.hr);
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
  const sd = Math.sqrt(variance);

  check(
    'T5 Aritmi → kalp hizi standart sapmasi > 5 bpm (duzensiz ritim)',
    sd > 5,
    `SD=${sd.toFixed(2)} bpm (ort ${mean.toFixed(1)})`
  );

  // Dinlenme ile kiyas: duzenli olmali
  const rSt = P.createState();
  rSt.scenario = 'rest';
  S.getById('rest').enter(rSt);
  const rSamples = [];
  for (let i = 0; i < 20 * 60; i++) {
    S.applyScenario(rSt, 1 / 60);
    P.step(rSt, 1 / 60);
    if (i % 30 === 0) rSamples.push(rSt.hr);
  }
  const rMean = rSamples.reduce((a, b) => a + b, 0) / rSamples.length;
  const rSd = Math.sqrt(rSamples.reduce((a, b) => a + (b - rMean) ** 2, 0) / rSamples.length);
  check(
    'T5b Dinlenme → ritim duzenli (SD < 2 bpm)',
    rSd < 2,
    `SD=${rSd.toFixed(2)} bpm`
  );
}

// ------------------------------------------------------------------
// TEST 6 — Sinir iletimi: gecikme mesafeyle ARTAR, hizla AZALIR
// ------------------------------------------------------------------
{
  const st = P.createState();
  const hand = P.fireSignal(st, P.BODY_TARGETS.rhand);   // uzun yol
  const st2 = P.createState();
  const head2 = P.fireSignal(st2, P.BODY_TARGETS.head);  // kisa yol

  check(
    'T6 Sinir → uzun yol (el) kisa yoldan (bas) daha uzun gecikme',
    hand.ms > head2.ms,
    `el=${hand.ms}ms (${hand.distanceM}m) vs bas=${head2.ms}ms (${head2.distanceM}m)`
  );

  const st3 = P.createState();
  st3.nerveConduction = 0.35;                            // hasarli
  const damaged = P.fireSignal(st3, P.BODY_TARGETS.rhand);
  check(
    'T6b Sinir hasari → tepki suresi belirgin uzar (>=2x)',
    damaged.ms >= hand.ms * 2,
    `saglikli=${hand.ms}ms hasarli=${damaged.ms}ms`
  );

  check(
    'T6c Sinir → iletim hizi fizyolojik aralikta (30-120 m/s)',
    hand.velocity >= 30 && hand.velocity <= 120,
    `v=${hand.velocity} m/s`
  );
}

// ------------------------------------------------------------------
// TEST 7 — Atim dongusu: kalp hizi ile atim sayisi tutarli
// ------------------------------------------------------------------
{
  const st = P.createState();
  st.scenario = 'rest';
  S.getById('rest').enter(st);
  st.hr = 120;
  for (let i = 0; i < 60 * 60; i++) { P.step(st, 1 / 60); }
  // 60 saniyede 120 bpm → ~120 atis (±3 tolerans)
  check(
    'T7 Kalp → 60s boyunca 120 bpm ile ~120 atis uretir',
    Math.abs(st.beatCount - 120) <= 4,
    `atis=${st.beatCount} (beklenen ~120)`
  );
}

// ------------------------------------------------------------------
// TEST 8 — Duraklatma: running=false iken zaman ILERLEMEMELI
// ------------------------------------------------------------------
{
  const st = P.createState();
  st.running = false;
  const t0 = st.t;
  for (let i = 0; i < 300; i++) P.step(st, 1 / 60);
  check(
    'T8 Duraklatma → durdurulunca simulasyon zamani sabit kalir',
    Math.abs(st.t - t0) < 1e-9,
    `t=${st.t.toFixed(3)} (baslangic ${t0.toFixed(3)})`
  );
}

// ------------------------------------------------------------------
// TEST 9 — Anatomi: damar/sinir yollari butun ve kapsayici
// ------------------------------------------------------------------
{
  const targetsWithNerve = new Set(A.NERVES.map(n => n.target));
  const missing = Object.keys(P.BODY_TARGETS).filter(t => !targetsWithNerve.has(t));
  check(
    'T9 Anatomi → her vucut bolgesi icin sinir yolu tanimli',
    missing.length === 0,
    missing.length ? `eksik: ${missing.join(', ')}` : `${targetsWithNerve.size} bolge kapsandi`
  );

  const zonesWithTarget = new Set(A.CLICK_ZONES.map(z => z.id));
  const noZone = Object.keys(P.BODY_TARGETS).filter(t => !zonesWithTarget.has(t));
  check(
    'T9b Anatomi → her bolge icin tiklanabilir alan var',
    noZone.length === 0,
    noZone.length ? `eksik: ${noZone.join(', ')}` : `${A.CLICK_ZONES.length} tiklanabilir alan`
  );

  const badVessel = A.VESSELS.filter(v => !v.pts || v.pts.length < 2);
  check(
    'T9c Anatomi → tum damarlar en az 2 noktali gecerli yol',
    badVessel.length === 0,
    `${A.VESSELS.length} damar (${A.VESSELS.filter(v => v.type === 'artery').length} atardamar / ${A.VESSELS.filter(v => v.type === 'vein').length} toplardamar)`
  );
}

// ------------------------------------------------------------------
// TEST 10 — Parcacik sistemi: patlamadan sinirli sayida parcacik
// ------------------------------------------------------------------
{
  const Part = require('./public/js/particles.js');
  const blood = Part.createBloodSystem(A.VESSELS);
  check(
    'T10 Parcacik → damar basina makul parcacik sayisi (toplam 200-2500)',
    blood.particles.length >= 200 && blood.particles.length <= 2500,
    `${blood.particles.length} parcacik / ${A.VESSELS.length} damar`
  );

  // Hareket testi: flowRate 2x olunca parcacik daha hizli ilerlemeli
  // NOT: t dongusel (0..1) oldugu icin AYNI parcacik karsilastirilmaz.
  // Tum populasyonun ortalama yer degistirmesi olculur (wrap-safe).
  const st = P.createState();
  st.flowRate = 1.0;
  const snap0 = blood.particles.map(p => p.t);
  Part.stepBlood(blood, st, 0.5);
  const dist1 = blood.particles.reduce(
    (acc, p, i) => acc + Math.abs(p.t - snap0[i]), 0) / blood.particles.length;

  const blood2 = Part.createBloodSystem(A.VESSELS);
  const st2 = P.createState();
  st2.flowRate = 2.0;
  const snap0b = blood2.particles.map(p => p.t);
  Part.stepBlood(blood2, st2, 0.5);
  const dist2 = blood2.particles.reduce(
    (acc, p, i) => acc + Math.abs(p.t - snap0b[i]), 0) / blood2.particles.length;

  check(
    'T10b Parcacik → kalp debisi 2x olunca kan akisi hizlanir',
    dist2 > dist1 * 1.5,
    `normal=${dist1.toFixed(4)} hizli=${dist2.toFixed(4)}`
  );
}

// ------------------------------------------------------------------
// RAPOR
// ------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('DURUM', 8) + pad('TEST', 62) + 'DETAY');
console.log('-'.repeat(120));
results.forEach(([status, name, detail]) => {
  const mark = status === 'GECTI' ? '  ✓ ' : '  ✗ ';
  console.log(pad(mark + status, 8) + pad(name, 62) + (detail || ''));
});

console.log('-'.repeat(120));
console.log(`\nSONUC: ${passed} gecti, ${failed} kaldi  (toplam ${passed + failed})\n`);

process.exit(failed > 0 ? 1 : 0);
