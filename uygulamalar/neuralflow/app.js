/* ============================================================================
   NEURALFLOW — Gerçek Zamanlı Sinir Ağı Simülatörü
   Sıfır kütüphane · saf Canvas 2D · tüm matematik elle
   ============================================================================ */
"use strict";

/* ---------- Sabitler / durum ---------- */
const MAX_LOSS_POINTS = 360;   // saklanan loss noktası üst sınırı
const PULSE_SPEED = 0.55;      // puls ilerleme hızı (birim/sn … 1 birim).
const HEAT_REFRESH_EVERY = 6;  // kaç framede bir heatmap yeniden çizilir
const GRADIENT_DECAY = 0.94;   // node "gradyan ısısı" sönümü

/* Durum: kullanıcı arayüzünden gelen çizim/eğitim ayarları */
let state = {
  trainRunning: false,   // RUN modu
  activation: 'sigmoid', // sigmoid | relu
  learningRate: 0.1,
  inputCount: 2,
  hiddenNeurons: 4,      // her gizli katman için nöron
  hiddenLayers: 3,       // gizli katman sayısı (1..3)
  outputCount: 1,
};
state.layerConfig = [];
state.layerSizes = [];
state.layerLabels = [];

/* Ağ modeli */
let net = {
  layers: [],        // [{name, size}]
  activations: [],   // [] her katman aktivasyon dizisi
  layerSum: [],      // [] aktivasyondan önceki W*a+b (backprop kolaylığı)
  weights: [],       // [katmanIdx][hedefN][kaynakN] (katmanIdx>=1: giriş katmanı weights içinde yok)
  biases: [],        // [katmanIdx][hedefN]  (katmanIdx>=1)
  weightPulses: [],  // animasyonlu ağırlık "nabzı": [{li,ri,from,to,…}]
  nodeBackHeat: [],  // [] her katmanın nöronuna "geri ısısı/alevi" oranı
  nodeFwdHeat: [],   // [] her katmanın nöronuna "ileri ısısı" (sinyal parlaması)
  runningInput: [],  // mevcut eğitim örneğinin girdi vektörü
  runningTarget: [], // hedef çıktı (girdi katmanında etiket için kullanılabilir)
};

let lossHistory = [];     // MSE geçmişi
let samplePointer = 0;    // sürekli RUN modunda sıradaki eğitim örneğinin index'i
let animationId = null;
let lastTs = 0;
let frameCount = 0;
let epochCounter = 0;

/* CANVAS ctx'leri */
let neuralCv, neuralCtx;
let heatCv, heatCtx;
let lossCv, lossCtx;

/* Geometri: nöron konumları (her çerçevede modelden türetilir) */
let NODE_X = [];      // [katman] x merkezi
let NODE_Y = [];      // [katman][] nöron y konumu

/* ---------- DOM yardımcıları ---------- */
function $(id) { return document.getElementById(id); }

/* ============================================================================
   AKTİVASYON & TÜREVLERİ (hep elle)
   ============================================================================ */
function sigmoid(x) {
  if (x < -45) return 0;
  if (x > 45) return 1;
  return 1 / (1 + Math.exp(-x));
}
function sigmoidDerivative(activated) {
  // activated katmanın ÇIKIŞ değeri (zaten aktivasyon uygulanmış)
  return activated * (1 - activated);
}
function relu(x) { return x > 0 ? x : 0; }
function reluDerivative(x) {
  // x = activasyona GİREN net girdi (sum). ReLU türevi.
  return x > 0 ? 1 : 0;
}

/* Per-node activation + türev, katman çıktı değeri & düz net girdi üzerinden */
function activateNode(kind, x) {
  if (kind === 'relu') return relu(x);
  return sigmoid(x);
}
function derivativeOf(kind, output, netInput) {
  if (kind === 'relu') return reluDerivative(netInput);
  return sigmoidDerivative(output);
}

/* Küçük Gaussian benzeri rastgele ağırlık */
function randomWeight() {
  return (Math.random() + Math.random() + Math.random()) / 1.5 - 1; // [-1..1]
}
function randomBias() {
  return (Math.random() - 0.5) * 0.8;
}

/* ============================================================================
   MİMARİ YÖNETİMİ
   ============================================================================ */
function layersConfig() {
  // state -> katman listesi [{name,size}]
  const cfg = [{ name: 'input', size: state.inputCount }];
  for (let h = 1; h <= state.hiddenLayers; h++) {
    cfg.push({ name: 'hidden' + h, size: state.hiddenNeurons });
  }
  cfg.push({ name: 'output', size: state.outputCount });
  return cfg;
}

function buildNetwork() {
  const cfg = layersConfig();
  state.layerConfig = cfg;
  state.layerSizes = cfg.map(function (l) { return l.size; });
  state.layerLabels = cfg.map(function (l) { return l.name; });

  net.layers = cfg.slice();
  const L = cfg.length;
  const acts = [];   // katman sayısı kadar dizi
  const sums = [];
  const nbh = [];
  const nfh = [];
  for (let i = 0; i < L; i++) {
    acts.push(new Array(cfg[i].size).fill(0));
    sums.push(new Array(cfg[i].size).fill(0));
    nbh.push(new Array(cfg[i].size).fill(0));
    nfh.push(new Array(cfg[i].size).fill(0));
  }
  net.activations = acts;
  net.layerSum = sums;
  net.nodeBackHeat = nbh;
  net.nodeFwdHeat = nfh;

  // weights/biases: katman indeks 1..L-1 (çıktı ya da gizli katmanı üreten)
  const W = [];
  const B = [];
  for (let k = 1; k < L; k++) {
    const prev = cfg[k - 1].size;
    const cur = cfg[k].size;
    const m = [];
    for (let j = 0; j < cur; j++) {
      const row = [];
      for (let i = 0; i < prev; i++) row.push(randomWeight());
      m.push(row);
    }
    W.push(m);
    const b = [];
    for (let j = 0; j < cur; j++) b.push(randomBias());
    B.push(b);
  }
  net.weights = W;   // length = L-1
  net.biases = B;

  net.runningInput = new Array(cfg[0].size).fill(0);
  net.runningTarget = new Array(cfg[L - 1].size).fill(0);

  // puls & ısı listesini sıfırla
  net.weightPulses = [];
}

function resetNetwork() {
  buildNetwork();
  lossHistory = [];
  samplePointer = 0;
  epochCounter = 0;
  updateArchBars();
  updateHUD();
}

/* ============================================================================
   GERİ YAYILIM (backpropagation) — matematik elle
   katman k için delta:  önce çıktı katmanı
     δ_out = (a - target) · act'(z)
   sonra gizli katmanlar geriye doğru zincir kuralı:
     δ_k = (W_{k+1}^T · δ_{k+1}) ⊙ act'(z_k)
   Gradyanlar: ∇W_k = δ_k · a_{k-1}^T, ∇b_k = δ_k
   ============================================================================ */
function backprop(target) {
  const L = state.layerSizes.length;
  const acts = net.activations;
  const sums = net.layerSum;
  const delta = [];
  for (let k = 0; k < L; k++) delta.push(new Float64Array(state.layerSizes[k]));

  // ---- çıktı katmanı hatası ----
  const out = acts[L - 1];
  const dOut = delta[L - 1];
  for (let j = 0; j < out.length; j++) {
    const err = out[j] - target[j];
    dOut[j] = err * derivativeOf(state.activation, out[j], sums[L - 1][j]);
  }

  // ---- gizli katmanlar geriye ----
  for (let k = L - 2; k >= 1; k--) {
    const Wnext = net.weights[k];      // (k)->(k+1)
    const dCurr = delta[k];
    const dNext = delta[k + 1];
    const szNext = state.layerSizes[k + 1];
    for (let i = 0; i < state.layerSizes[k]; i++) {
      let sumErr = 0;
      for (let j = 0; j < szNext; j++) sumErr += Wnext[j][i] * dNext[j];
      dCurr[i] = sumErr * derivativeOf(state.activation, acts[k][i], sums[k][i]);
    }
  }

  // nodeBackHeat'i gradyan ile "alevle"
  for (let k = 1; k < L; k++) {
    const dk = delta[k];
    const heat = net.nodeBackHeat[k];
    for (let j = 0; j < dk.length; j++) {
      const mag = Math.abs(dk[j]);
      if (mag > heat[j]) heat[j] = Math.min(1, heat[j] + mag * 3);
    }
  }
  return delta;
}

/* ============================================================================
   SGD GÜNCELLEMESİ — w -= lr·∇W , b -= lr·∇b
   ============================================================================ */
function applySGD(learningRate, delta) {
  const L = state.layerSizes.length;
  const acts = net.activations;
  for (let k = 1; k < L; k++) {
    const Wk = net.weights[k - 1];
    const Bk = net.biases[k - 1];
    const dk = delta[k];
    const prev = acts[k - 1];
    for (let j = 0; j < Wk.length; j++) {
      const row = Wk[j];
      for (let i = 0; i < row.length; i++) {
        row[i] -= learningRate * dk[j] * prev[i];
      }
      Bk[j] -= learningRate * dk[j];
    }
  }
}

/* ============================================================================
   EĞİTİM ADIMI
   ============================================================================ */
function emitForwardSignals() {
  // ileri yön sinyal puls'ları: katman k-1 -> k, mor/cyan, aktivasyon & |w| ile orantılı
  const L = state.layerSizes.length;
  const acts = net.activations;
  const pulses = net.weightPulses;
  for (let k = 1; k < L; k++) {
    const prevY = NODE_Y[k - 1]; if (!prevY) continue;
    const curY = NODE_Y[k]; if (!curY) continue;
    const Wk = net.weights[k - 1];
    const xA = NODE_X[k - 1], xB = NODE_X[k];
    for (let j = 0; j < curY.length; j++) {
      for (let i = 0; i < prevY.length; i++) {
        const a = acts[k - 1][i];
        const wgt = Wk[j][i];
        const mag = a * Math.abs(wgt);
        if (mag < 0.03 || pulses.length > 420) continue;
        pulses.push({
          li: k - 1, ri: k, i, j,
          fromX: xA, fromY: prevY[i],
          toX: xB, toY: curY[j],
          from: i, to: o2n(k, j),
          progress: 0, dir: 'fwd',
          speed: 0.5 + Math.random() * 0.4 + mag * 2,
          mag: Math.min(1, 0.2 + mag * 1.8),
          hueRef: wgt >= 0 ? 285 : 330, // pozitif mor, negatif pembe
        });
      }
    }
  }
}

/* ============================================================================
   İLERİ YAYILIM (forward pass) — matematik elle
   katman katman:  z_k = W_k·a_{k-1} + b_k ,  a_k = act(z_k)
   ============================================================================ */
function forwardPass(inputArr) {
  const L = state.layerSizes.length;
  const acts = net.activations;
  const sums = net.layerSum;
  const kind = state.activation;
  // girdi katmanı aktivasyonunu koy
  const inSize = state.layerSizes[0];
  for (let i = 0; i < inSize; i++) {
    acts[0][i] = (i < inputArr.length) ? (inputArr[i] || 0) : 0;
  }
  for (let k = 1; k < L; k++) {
    const curSize = state.layerSizes[k];
    const prevSize = state.layerSizes[k - 1];
    const Wk = net.weights[k - 1];
    const Bk = net.biases[k - 1];
    const prevA = acts[k - 1];
    const curA = acts[k];
    const curS = sums[k];
    for (let j = 0; j < curSize; j++) {
      let z = Bk[j];
      const row = Wk[j];
      for (let i = 0; i < prevSize; i++) z += row[i] * prevA[i];
      curS[j] = z;
      curA[j] = activateNode(kind, z);
    }
  }
  return acts[L - 1];
}

/* Ortalama kare hata (MSE) — elle */
function meanSquaredError(target, output) {
  const n = Math.min(target.length, output.length);
  let s = 0;
  for (let j = 0; j < n; j++) {
    const d = output[j] - target[j];
    s += d * d;
  }
  return n ? s / n : 0;
}

/* ============================================================================
   EĞİTİM ÖRNEĞİ ÜRETİCİ — deterministik, tekrarlı döngü (öğrenilebilir)
   Girdi sabit "desen havuzu"ndan, hedef türetilmiş yumuşak fonksiyondur.
   Desen halkası tekrar ettiği için küçük ağlar bile zamanla uymayı öğrenir
   → loss çizgisi gerçekten düşer.
   ============================================================================ */
function nextSample() {
  const nIn = state.inputCount;
  const nOut = state.outputCount;
  if (!nIn || nIn < 1) { state.inputCount = 2; return nextSample(); }

  const i = samplePointer % 32;   // kısa halka, tekrarlanır
  const t = i / 32;

  // 1) giriş deseni: bileşik sinusler → pürüzsüz ama ayırt edici girdi
  const f1 = Math.sin(t * Math.PI * 2 * 1.0);
  const f2 = Math.sin(t * Math.PI * 2 * 2.0 + 0.9);
  const f3 = Math.sin(t * Math.PI * 4.0 + 0.4);
  const ph = i * 2.399963;         // altın oran tarama

  const input = [];
  for (let x = 0; x < nIn; x++) {
    // her giriş biraz farklı fazlanmış dalga (0..1) + ince parazit
    const raw = 0.5 * f1 + 0.28 * f2 * Math.cos(0.9 + x * ph) + 0.22 * f3;
    input.push((raw * 0.5 + 0.5));   // [0,1] bandı
  }

  // 2) çıktı hedefi: girişten deterministik türetilmiş sinyal (0.05..0.95)
  const target = [];
  for (let y = 0; y < nOut; y++) {
    const yk = y + 1;
    // bileşik sinüs → sigmoid aralığına sıkıştır, öğrenilebilir ilişki
    const sig =
      Math.sin(input[0] * Math.PI * (1 + yk * 0.17) + yk * 0.6) * 0.5 +
      Math.cos((nIn > 1 ? input[nIn - 1] : input[0]) * Math.PI * (0.5 + yk * 0.23)) * 0.5;
    target.push(0.5 + 0.42 * sig);   // (0.08, 0.92) → sigmoid çıktısı erişebilsin
  }

  return { input: input, target: target };
}

function trainStep() {
  const sample = nextSample();
  samplePointer++;
  net.runningInput = sample.input.slice();
  net.runningTarget = sample.target.slice();

  forwardPass(sample.input);
  emitForwardSignals();
  const out = net.activations[state.layerSizes.length - 1].slice();
  const loss = meanSquaredError(sample.target, out);
  lossHistory.push(loss);
  if (lossHistory.length > MAX_LOSS_POINTS) lossHistory.shift();
  epochCounter++;

  const delta = backprop(sample.target);
  applySGD(state.learningRate, delta);
  generateBackflowVisual(delta, sample.target, out);
  updateHUD();
  return loss;
}

/* "TRAIN STEP" butonu — tek adım + gradyan patlaması */
function onEpochStep() { trainStep(); }

/* ============================================================================
   GERİ AKIŞ GÖRSELİ — gradyan büyüklüğüne göre sağdan sola turuncu alev
   ============================================================================ */
function generateBackflowVisual(delta, target, output) {
  const L = state.layerSizes.length;
  const pulses = net.weightPulses;
  computeLayerXCache();
  for (let k = L - 1; k >= 1; k--) {
    const dk = delta[k];
    const curY = NODE_Y[k];
    const prevY = NODE_Y[k - 1];
    const xA = columnXOf(k - 1);
    const xB = columnXOf(k);
    for (let j = 0; j < dk.length; j++) {
      const heat = Math.abs(dk[j]);
      if (heat < 0.02) continue;
      for (let i = 0; i < prevY.length; i++) {
        const w = net.weights[k - 1][j][i] || 0;
        const mag = heat * (Math.abs(w) + 0.25);
        if (mag < 0.006) continue;
        if (pulses.length > 320) break;
        pulses.push({
          li: k - 1, ri: k,
          i: i, j: j,
          fromX: xA, fromY: prevY[i],
          toX: xB, toY: curY[j],
          from: i, to: o2n(k, j),
          progress: 0, dir: 'bwd',
          speed: 0.45 + Math.random() * 0.5 + mag,
          mag: Math.min(1, mag),
          hueRef: 20,       // alev turuncusu
        });
      }
    }
  }
}

/* "to" hedefini node global index gibi kullanacak helper (sadece etiket) */
function o2n(k, j) { return k * 100 + j; }

/* ------------------ katman x konumu yardımcıları ------------------ */
let _layerXCache = [];
function computeLayerXCache() {
  const n = state.layerSizes.length;
  _layerXCache = [];
  for (let k = 0; k < n; k++) _layerXCache.push((k + 0.5) / n);
}
function columnXOf(k) {
  if (!_layerXCache.length) computeLayerXCache();
  return _layerXCache[k];
}

/* ============================================================================
   SİNYAL / PULS ANİMASYONU
   ============================================================================ */
function setLinkPulse(li, i, j, dir, intensity) {
  // :harici denetçiler için hedeflenmiş bir puls başlatma API'si
  const k = li + 1;
  if (k >= state.layerSizes.length) return;
  const prevY = NODE_Y[k - 1];
  const curY = NODE_Y[k];
  if (!prevY || !curY) return;
  net.weightPulses.push({
    li, ri: k, i, j,
    fromX: columnXOf(k - 1), fromY: prevY[i],
    toX: columnXOf(k), toY: curY[j],
    from: i, to: o2n(k, j),
    progress: 0, dir: dir || 'fwd',
    speed: 0.5, mag: Math.min(1, intensity || 0.3),
    hueRef: dir === 'bwd' ? 22 : 285,
  });
}

function tickSignals(dt) {
  // dt saniye
  const pulses = net.weightPulses;
  const alive = [];
  for (let p = 0; p < pulses.length; p++) {
    const pl = pulses[p];
    pl.progress += dt * pl.speed;
    if (pl.progress >= 1) { continue; }   // ölü -> atla
    alive.push(pl);
  }
  net.weightPulses = alive;
  // kurallı sıfırlayıcı büyüme kısıtı yok
}

function growBackHeat() {
  // frame bazlı nodeBackHeat sönümü
  for (let k = 0; k < net.nodeBackHeat.length; k++) {
    const arr = net.nodeBackHeat[k];
    for (let j = 0; j < arr.length; j++) {
      if (arr[j] > 0.004) arr[j] *= GRADIENT_DECAY; else arr[j] = 0;
    }
  }
}

function growFwdHeat() {
  for (let k = 0; k < net.nodeFwdHeat.length; k++) {
    const arr = net.nodeFwdHeat[k];
    for (let j = 0; j < arr.length; j++) {
      if (arr[j] > 0.002) arr[j] *= 0.92; else arr[j] = 0;
    }
  }
}

/* ============================================================================
   GEOMETRİ: nöron yerleşimi (canvas gerçek pikselinden bağımsız normalized 0..1)
   ============================================================================ */
function computeGeometry(width, height) {
  const L = state.layerSizes.length;
  NODE_X = [];
  NODE_Y = [];
  // padding
  const padX = Math.min(46, width * 0.06);
  const padY = Math.min(26, height * 0.07);
  const drawW = Math.max(10, width - padX * 2);
  const drawH = Math.max(10, height - padY * 2);
  for (let k = 0; k < L; k++) {
    const x = padX + drawW * (L === 1 ? 0.5 : k / (L - 1));
    NODE_X.push(x);
    const size = state.layerSizes[k];
    const col = [];
    if (size === 1) col.push(height / 2);
    else for (let j = 0; j < size; j++) col.push(padY + drawH * (j / (size - 1)));
    NODE_Y.push(col);
  }
  computeLayerXCache();
}

/* ============================================================================
   ÇİZİM: ORTA (NÖRON AKIŞI) KANVASI
   ============================================================================ */
function drawNeuralCanvas() {
  const cv = neuralCv;
  if (!cv) return;
  const w = cv.width, h = cv.height;
  const g = neuralCtx;
  g.clearRect(0, 0, w, h);

  // zaman birikimi (yumuşak nabız/akış efektleri için)
  const tSec = frameCount * 0.016;

  // hafif ızgara arka plan deseni — çok hafif "nefes alan" canlılık
  const breathe = 0.5 + 0.5 * Math.sin(tSec * 0.7);
  g.strokeStyle = 'rgba(90,120,220,' + (0.04 + breathe * 0.03) + ')';
  g.lineWidth = 1;
  const step = 36;
  for (let x = 0; x < w; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }

  // süzülen "veri tozları" — yavaşça sağa süzülen neon parçacık sürüsü
  for (let d = 0; d < 14; d++) {
    const drift = ((d * 0.6180339887) + tSec * 0.045) % 1;      // her biri farklı fazda akar
    const wave = Math.sin(tSec * 0.3 + d * 1.7) * 10;
    const dy = (((d * 53.7 + wave) % h) + h) % h;
    const dx = drift * w;
    const pal = d % 3;
    const cc = pal === 0 ? '55,224,255' : pal === 1 ? '143,123,255' : '255,93,158';
    const tw = 0.5 + 0.5 * Math.sin(tSec * 2.2 + d * 2.9);       // hafif yanıp sönme
    g.fillStyle = 'rgba(' + cc + ',' + (0.10 + tw * 0.12) + ')';
    g.beginPath();
    g.arc(dx, dy, 1.0 + (pal === 2 ? 0.9 : 0.3), 0, Math.PI * 2);
    g.fill();
  }

  const L = state.layerSizes.length;
  const acts = net.activations;

  // ---- bağlantılar ----
  for (let k = 1; k < L; k++) {
    const prevY = NODE_Y[k - 1];
    const curY = NODE_Y[k];
    const Wk = net.weights[k - 1];
    const px = NODE_X[k - 1];
    const cx = NODE_X[k];
    for (let j = 0; j < curY.length; j++) {
      for (let i = 0; i < prevY.length; i++) {
        const wgt = Wk[j][i];
        const a = Math.abs(wgt);
        const pos = wgt >= 0;
        const alpha = 0.16 + a * 0.7;
        g.strokeStyle = pos ? 'rgba(90,200,255,' + alpha + ')'
                             : 'rgba(255,90,110,' + alpha + ')';
        g.lineWidth = 0.6 + a * 3.2;
        const y1 = prevY[i], y2 = curY[j];
        // hafif kavis
        const mx = (px + cx) / 2;
        const ctl = mx + (y2 - y1) * 0.4;
        const ctlY = (y1 + y2) / 2;
        g.beginPath();
        g.moveTo(px, y1);
        g.quadraticCurveTo(ctl, ctlY, cx, y2);
        g.stroke();

        // güçlü bağlantıların üstüne "akan sinyal dalgası" (canlılık)
        if (a > 0.35) {
          const cycle = (tSec * 0.9 + k * 0.6 + ((i + j) % 5) * 0.24) % 1;
          if (cycle < 0.75) { // dalga kuyruğu kesilmesin diye sadece bir aralıkta göster
            const sc = cycle / 0.75;
            const qx = (1 - sc) * (1 - sc) * px + 2 * (1 - sc) * sc * ctl + sc * sc * cx;
            const qy = (1 - sc) * (1 - sc) * y1 + 2 * (1 - sc) * sc * ctlY + sc * sc * y2;
            const fade = (1 - sc) * alpha;
            const wcol = pos ? '90,235,255' : '255,150,120';
            const wg = g.createRadialGradient(qx, qy, 0, qx, qy, 6);
            wg.addColorStop(0, 'rgba(' + wcol + ',' + (0.5 * fade + 0.2) + ')');
            wg.addColorStop(1, 'rgba(' + wcol + ',0)');
            g.fillStyle = wg;
            g.beginPath(); g.arc(qx, qy, 6, 0, Math.PI * 2); g.fill();
          }
        }
      }
    }
  }

  // ---- puls topları (kaplamalı, renkli parlama) ----
  const pulses = net.weightPulses;
  for (let p = 0; p < pulses.length; p++) {
    const pl = pulses[p];
    // normalize konumları gerçek piksele çevir
    let x1, y1, x2, y2;
    const xCache = _layerXCache;
    const li = pl.li, ri = pl.ri;
    if (li < 0 || ri >= L) continue;
    const px = NODE_X[li], cx = NODE_X[ri];
    // puls kaynağı/hedefi nöron Y'lerinden (gerçek piksel)
    const srcY = NODE_Y[li][pl.from];
    const dstY = NODE_Y[ri][pl.to % 100];
    // basit interpolasyon (progress) — kavis ihmal
    const t = pl.progress;
    const X = px + (cx - px) * t;
    const Y = srcY + (dstY - srcY) * t;
    let col;
    if (pl.dir === 'bwd') {
      col = 'hsla(' + pl.hueRef + ',100%,60%,' + (0.5 + pl.mag * 0.5) + ')';
    } else {
      col = 'hsla(' + pl.hueRef + ',100%,66%,' + (0.35 + pl.mag * 0.5) + ')';
    }
    const rad = 2 + pl.mag * 6;
    const glow = g.createRadialGradient(X, Y, 0, X, Y, rad * 5);
    glow.addColorStop(0, col);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(X, Y, rad * 5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.arc(X, Y, rad, 0, Math.PI * 2);
    g.fill();
  }

  // ---- nöronlar (aktivasyona göre parlaklık) ----
  for (let k = 0; k < L; k++) {
    const x = NODE_X[k];
    const arr = NODE_Y[k];
    const fwd = net.nodeFwdHeat[k] || [];
    const bck = net.nodeBackHeat[k] || [];
    // katman etiketi
    g.fillStyle = 'rgba(140,170,230,0.5)';
    g.font = '11px Consolas, monospace';
    g.textAlign = 'center';
    const label = state.layerLabels[k] || '';
    const isIn = k === 0, isOut = k === L - 1;
    g.fillText((isIn ? 'GİRİŞ' : isOut ? 'ÇIKIŞ' : label.toUpperCase()), x, 16);

    for (let j = 0; j < arr.length; j++) {
      const r = isIn || isOut ? 11 : 8;
      const a = acts[k][j];         // aktivasyon 0..1
      const glow = fwd[j] || 0;
      const back = bck[j] || 0;

      // dış parlama
      const coreLum = 0.5 + a * 0.9;
      let rgb;
      if (back > 0.05) {
        const t = Math.min(1, back);
        rgb = 'rgb(' + Math.round(255 * (0.5 + t * 0.5)) + ',' + Math.round(120 * (1 - t)) + ',' + Math.round(80 * (1 - t)) + ')';
      } else {
        const bl = Math.round(90 + coreLum * 210);
        const gr = Math.round(60 + a * 200);
        rgb = 'rgb(' + Math.round(50 + a * 80) + ',' + gr + ',' + bl + ')';
      }
      // zaman bazlı "canlı nabız": aktif nöron hafifçe büyür / parlar
      const pulseK = 1 + (a * 0.22) * (0.5 + 0.5 * Math.sin(tSec * 3.4 + k * 1.3 + j * 0.7));
      const glowR = r * 4 * (0.92 + pulseK * 0.08);
      const galpha = back > 0.05 ? (0.45 + back * 0.45) : (0.32 + a * 0.5);
      const radG = g.createRadialGradient(x, arr[j], 0, x, arr[j], glowR);
      radG.addColorStop(0, back > 0.05 ? 'rgba(255,120,40,' + galpha + ')' : 'rgba(90,220,255,' + galpha + ')');
      radG.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = radG;
      g.beginPath(); g.arc(x, arr[j], glowR, 0, Math.PI * 2); g.fill();

      // çekirdek (canlı parlama katmanı + parlayan ana gövde)
      const coreR = r * (0.96 * pulseK);
      const coreGlow = g.createRadialGradient(x, arr[j], 0, x, arr[j], coreR * 2.5);
      coreGlow.addColorStop(0, 'rgba(255,255,255,' + (0.5 + a * 0.4) + ')');
      coreGlow.addColorStop(0.5, back > 0.05 ? 'rgba(255,180,90,' + (0.5 + a * 0.3) + ')' : 'rgba(150,240,255,' + (0.45 + a * 0.4) + ')');
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = coreGlow;
      g.beginPath(); g.arc(x, arr[j], coreR * 2.5, 0, Math.PI * 2); g.fill();

      const grad = g.createRadialGradient(x - 2, arr[j] - 2, 1, x, arr[j], coreR);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, back > 0.05 ? '#ffc880' : 'rgb(150,240,255)');
      grad.addColorStop(1, 'rgba(25,55,115,0.95)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, arr[j], coreR, 0, Math.PI * 2); g.fill();
      // çekirdek dış ince halka (neon kontur)
      g.strokeStyle = back > 0.05 ? 'rgba(255,180,90,' + (0.5 + back * 0.5) + ')' : 'rgba(140,240,255,' + (0.4 + a * 0.5) + ')';
      g.lineWidth = 1 + a * 1.2;
      g.beginPath(); g.arc(x, arr[j], coreR - 0.6, 0, Math.PI * 2); g.stroke();

      // back ısı parlaması en dış halka
      if (back > 0.05) {
        g.strokeStyle = 'rgba(255,150,40,' + (0.3 + back * 0.6) + ')';
        g.lineWidth = 1.5 + back * 2;
        g.beginPath(); g.arc(x, arr[j], r + 3 + back * 8, 0, Math.PI * 2); g.stroke();
      }
    }
  }
}

/* ============================================================================
   ÇİZİM: SAĞ PANEL — AĞIRLIK ISILOĞ / GÖRSEL MATRİS
   her bağlantı katmanı (k=1..L-1) için mini grid hücre
   hücre boyutu pencere bağımlı; tüm katmanlar tek sütunda, üstte en girişçi
   ============================================================================ */
function drawHeatmap() {
  const cv = heatCv; if (!cv) return;
  const w = cv.width, h = cv.height;
  const g = heatCtx;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,12,24,0.5)'; g.fillRect(0, 0, w, h);

  const L = state.layerSizes.length;
  if (L < 2) return;
  // her layer-k matrisi: rows=cur(data) x cols=prev
  // bir "matris şeridi"ne yerleştir, üstten alta
  let yCursor = 12;
  const cellPad = 3;
  const labelH = 14;
  for (let k = 1; k < L; k++) {
    const cur = state.layerSizes[k];
    const prevC = state.layerSizes[k - 1];
    const mat = net.weights[k - 1];
    // toplam matris alanı; max genişlik w-kaydol => cell
    const padX = 4;
    const availH = Math.max(20, Math.min(cur * (h - labelH) / (L - 1), h / 4.4) - cellPad * cur);
    const availW = w - padX * 2;
    const cw = Math.min(availW / Math.max(1, prevC), 22);
    const ch = Math.min(availH / Math.max(1, cur), 22);
    const cell = Math.min(cw, ch, 26);
    const gridW = cell * prevC - cellPad * (prevC - 1);
    const gridH = cell * cur - cellPad * (cur - 1);
    let x0 = (w - gridW) / 2;
    let y0 = yCursor + labelH;

    // katman etiketi: "k: cur ← prev"
    g.fillStyle = 'rgba(150,180,240,0.5)';
    g.font = '9px Consolas, monospace';
    g.textAlign = 'left';
    const lab = state.layerLabels[k] + '  ' + cur + '←' + prevC;
    g.fillText(lab.toUpperCase(), x0, yCursor + 10);

    for (let j = 0; j < cur; j++) {       // satır = hedef nöron
      for (let i = 0; i < prevC; i++) {   // kolon = kaynak nöron
        const val = mat[j][i];            // -1..1
        const a = Math.abs(val);
        let col;
        if (val >= 0) col = 'rgba(45,175,255,' + (0.15 + a * 0.85) + ')';
        else col = 'rgba(255,80,100,' + (0.15 + a * 0.85) + ')';
        g.fillStyle = col;
        const px = x0 + i * (cell + cellPad);
        const py = y0 + j * (cell + cellPad);
        const rr = cell * 0.16;
        roundRect(g, px, py, cell, cell, rr);
        g.fill();
      }
    }
    yCursor = y0 + gridH + 14;
  }
}

function roundRect(g, x, y, w2, h2, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w2, y, x + w2, y + h2, r);
  g.arcTo(x + w2, y + h2, x, y + h2, r);
  g.arcTo(x, y + h2, x, y, r);
  g.arcTo(x, y, x + w2, y, r);
  g.closePath();
}

/* ============================================================================
   ÇİZİM: ALT — LOSS GRAFİĞİ (neon eğri, kaydırmalı)
   ============================================================================ */
function plotLoss() {
  const cv = lossCv; if (!cv) return;
  const w = cv.width, h = cv.height;
  const g = lossCtx;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,12,24,0.5)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,150,220,0.12)';
  for (let gy = 0; gy < h; gy += h / 4) { g.beginPath(); g.moveTo(0, gy); g.lineTo(w, gy); g.stroke(); }

  if (lossHistory.length < 2) return;
  const maxP = Math.min(MAX_LOSS_POINTS, lossHistory.length);
  // Y ölçek: dönemsel max (ilk 20 dahil)
  let lo = Infinity, hi = -Infinity;
  const from = Math.max(0, lossHistory.length - 260);
  for (let i = from; i < lossHistory.length; i++) { const v = lossHistory[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(hi) || hi - lo < 1e-6) { hi = lo + 1; }
  lo = Math.max(0, lo - (hi - lo) * 0.1);
  hi = hi + (hi - lo) * 0.1;

  const data = lossHistory.slice(-maxP);
  // neon çizgi + alan
  const stepX = w / data.length;
  const py = function (v) { return h - 8 - ((v - lo) / (hi - lo || 1)) * (h - 16); };

  // alan dolgusu
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,77,158,0.28)');
  grad.addColorStop(1, 'rgba(255,77,158,0)');
  g.beginPath();
  g.moveTo(0, py(data[0]));
  for (let i = 0; i < data.length; i++) g.lineTo(i * stepX, py(data[i]));
  g.lineTo(w, h); g.lineTo(0, h); g.closePath();
  g.fillStyle = grad; g.fill();

  // üst parlayan çizgi
  g.beginPath();
  g.moveTo(0, py(data[0]));
  for (let i = 0; i < data.length; i++) g.lineTo(i * stepX, py(data[i]));
  g.strokeStyle = 'rgba(255,110,190,0.15)';
  g.lineWidth = 6; g.stroke();
  g.strokeStyle = '#ff6eae';
  g.lineWidth = 1.6;
  g.shadowColor = '#ff6eae'; g.shadowBlur = 8;
  g.stroke();
  g.shadowBlur = 0;

  // mevcut değer noktası
  const lv = data[data.length - 1];
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(w - stepX, py(lv), 2.4, 0, Math.PI * 2);
  g.fill();
}

/* ============================================================================
   CANVAS BOYUTLANDIRMA + HUD + ARK MİMARİ ÇUBUKLAR
   ============================================================================ */
function resizeCanvases() {
  if (!neuralCv || !heatCv || !lossCv) return;
  const dpr = window.devicePixelRatio || 1;
  for (const cv of [neuralCv, heatCv, lossCv]) {
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(20, Math.round(r.width * dpr));
    cv.height = Math.max(20, Math.round(r.height * dpr));
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    // not: yüksek-dpi'da piksel koordinat pikselleştirme: logikal piksel kullanıyoruz
    // dpr ile CSS'e oranlı çizeceğiz: transform dpr yaptığımız için coordinates logikal kalıyor.
  }
  computeGeometry(neuralCv.clientWidth || neuralCv.parentElement.clientWidth, neuralCv.clientHeight || neuralCv.parentElement.clientHeight);
}

function updateHUD() {
  const e = $('epochReadout'); if (e) e.textContent = epochCounter;
  const lo = $('lossReadout');
  if (lo) lo.textContent = lossHistory.length ? lossHistory[lossHistory.length - 1].toFixed(4) : '—';
  const ae = $('actReadout'); if (ae) ae.textContent = state.activation;
}

function updateArchBars() {
  const holder = $('archBars'); if (!holder) return;
  holder.innerHTML = '';
  const sizes = state.layerSizes;
  const maxS = Math.max.apply(null, sizes);
  for (let k = 0; k < sizes.length; k++) {
    const b = document.createElement('div');
    b.className = 'arch-bar';
    const scale = sizes[k] / maxS;
    b.style.height = (16 + scale * 26) + 'px';
    b.textContent = sizes[k];
    if (k === 0) b.style.background = 'linear-gradient(180deg,#6cf,#38e)';
    else if (k === sizes.length - 1) b.style.background = 'linear-gradient(180deg,#ff7,#ff4d6d)';
    holder.appendChild(b);
  }
}

/* ============================================================================
   ANA ANİMASYON DÖNGÜSÜ (requestAnimationFrame)
   ============================================================================ */
function requestAnimationFrameSim(ts) {
  animationId = requestAnimationFrame(requestAnimationFrameSim);
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
  lastTs = ts;

  tickSignals(dt);
  growBackHeat();
  growFwdHeat();
  tickAutoTrain();

  // çizim
  drawNeuralCanvas();
  frameCount++;
  if (frameCount % HEAT_REFRESH_EVERY === 0) drawHeatmap();
  plotLoss();
  updateHUD();
}

function startSim() {
  if (animationId) return;
  lastTs = 0;
  animationId = requestAnimationFrame(requestAnimationFrameSim);
}
function stopSim() { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }

/* ============================================================================
   KONTROL / UI BAĞLAMA
   ============================================================================ */
function applyActivation(choice) {
  state.activation = (choice === 'relu') ? 'relu' : 'sigmoid';
  updateActivationSeg();
}

function updateActivationSeg() {
  const seg = $('activationSeg'); if (!seg) return;
  const btns = seg.querySelectorAll('.seg-btn');
  btns.forEach(function (b) {
    b.classList.toggle('active', b.dataset.act === state.activation);
  });
}

function onSliderChange() {
  state.inputCount = intVal($('inputSlider'), 2);
  state.hiddenNeurons = intVal($('hiddenSlider'), 4);
  state.hiddenLayers = intVal($('hiddenCountSlider'), 3);
  state.outputCount = intVal($('outputSlider'), 1);
  state.learningRate = (intVal($('lrSlider'), 10)) / 100;

  const io = $('inputOut'); if (io) io.textContent = state.inputCount;
  const ho = $('hiddenOut'); if (ho) ho.textContent = state.hiddenNeurons;
  const hco = $('hiddenCountOut'); if (hco) hco.textContent = state.hiddenLayers;
  const oo = $('outputOut'); if (oo) oo.textContent = state.outputCount;
  const lo2 = $('lrOut'); if (lo2) lo2.textContent = state.learningRate.toFixed(2);

  buildNetwork();
  updateArchBars();
  updateHUD();
}

function intVal(el, d) {
  if (!el) return d;
  const v = parseInt(el.value, 10);
  return isNaN(v) ? d : v;
}

/* RUN/PAUSE mantığı + otomatik forward-pass denemesi her frame */
function toggleRun() {
  state.trainRunning = !state.trainRunning;
  const b = $('runBtn'); if (b) b.classList.toggle('running', state.trainRunning);
}

function tickAutoTrain() {
  // startSim üzerindeki ana döngüde çağrılır — sürekli RUN modunda her frame trainStep
  if (!state.trainRunning) return;
  if (frameCount % 4 === 0) trainStep();
}

/* ============================================================================
   BAŞLATMA / DOM
   ============================================================================ */
function bindUI() {
  const sliders = ['inputSlider', 'hiddenSlider', 'hiddenCountSlider', 'outputSlider', 'lrSlider'];
  sliders.forEach(function (s) {
    const el = $(s); if (el) el.addEventListener('input', onSliderChange);
  });

  const runBtn = $('runBtn');
  if (runBtn) runBtn.addEventListener('click', toggleRun);
  const stepBtn = $('stepBtn');
  if (stepBtn) stepBtn.addEventListener('click', onEpochStep);
  const resetBtn = $('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetNetwork);

  const seg = $('activationSeg');
  if (seg) seg.addEventListener('click', function (ev) {
    const t = ev.target.closest('.seg-btn');
    if (t && t.dataset.act) applyActivation(t.dataset.act);
  });

  window.addEventListener('resize', function () {
    resizeCanvases();
    drawHeatmap();
    plotLoss();
  });
}

function init() {
  neuralCv = $('neuralCanvas');
  heatCv = $('heatCanvas');
  lossCv = $('lossCanvas');
  if (neuralCv) neuralCtx = neuralCv.getContext('2d');
  if (heatCv) heatCtx = heatCv.getContext('2d');
  if (lossCv) lossCtx = lossCv.getContext('2d');

  onSliderChange();      // layerSizes + ilk buildNetwork
  buildNetwork();
  bindUI();
  resizeCanvases();
  updateActivationSeg();
  updateHUD();
  updateArchBars();
  drawHeatmap();
  plotLoss();
  startSim();
}

document.addEventListener('DOMContentLoaded', init);
