/* =========================================================================
   NUMEX GRAVITY LAB — gerçek zamanlı parçacık + yerçekimi simülatörü
   Saf HTML/CSS/JS + WebGL2. Hazır model/animasyon yok; her karede fizik.
   ========================================================================= */
'use strict';

(function () {

/* ------------------------------------------------------------------ */
/*  Yardımcılar                                                        */
/* ------------------------------------------------------------------ */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);

const canvas = document.getElementById('stage');
const gl = canvas.getContext('webgl2', {
  antialias: false,
  alpha: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
});

if (!gl) {
  document.body.innerHTML =
    '<div style="color:#e8ecff;font-family:sans-serif;padding:40px;line-height:1.7">' +
    'Bu tarayıcı WebGL2 desteklemiyor. Lütfen güncel bir Chrome, Edge veya Firefox ile açın.</div>';
  return;
}

/* ------------------------------------------------------------------ */
/*  Paletler — parçacık başına ton (mavi / mor / altın / beyaz)        */
/* ------------------------------------------------------------------ */
const PALETTES = {
  nebula: {
    name: 'Nebula',
    colors: [
      [0.30, 0.52, 1.00], // mavi
      [0.62, 0.42, 1.00], // mor
      [1.00, 0.80, 0.38], // altın
      [0.93, 0.95, 1.00]  // beyaz
    ],
    weights: [0.40, 0.30, 0.18, 0.12]
  },
  aurora: {
    name: 'Aurora',
    colors: [
      [0.28, 0.95, 0.85],
      [0.35, 0.62, 1.00],
      [0.70, 0.45, 1.00],
      [0.90, 1.00, 0.98]
    ],
    weights: [0.32, 0.32, 0.22, 0.14]
  },
  ember: {
    name: 'Ember',
    colors: [
      [1.00, 0.42, 0.22],
      [1.00, 0.72, 0.20],
      [0.98, 0.30, 0.55],
      [1.00, 0.92, 0.82]
    ],
    weights: [0.34, 0.30, 0.22, 0.14]
  },
  ice: {
    name: 'Ice',
    colors: [
      [0.62, 0.86, 1.00],
      [0.42, 0.62, 1.00],
      [0.80, 0.90, 1.00],
      [1.00, 1.00, 1.00]
    ],
    weights: [0.34, 0.30, 0.22, 0.14]
  }
};

/* ------------------------------------------------------------------ */
/*  Ayarlar                                                            */
/* ------------------------------------------------------------------ */
const MAX_PARTICLES = 5000;

const S = {
  gravity: 1.0,          // kullanıcı çarpanı
  counts: 3000,
  trail: 0.90,           // iz (fade) katsayısı
  speed: 1.0,
  palette: 'nebula',
  cinematic: false,
  autoQuality: true,
  paused: false
};

// Fizik sabitleri (dünya birimi = piksel, ekran yüksekliğine ölçeklenir)
/* Sahne ölçeği — ÖLÇÜMLE SABİT (tahmin değil).
   Ölçüm (1440×900, 3000 parçacık): rMed=248 px, rP90=363 px.
   Hedef: medyan yarıçapta bir tur ≈ 14 sn.
   v = 2πr/T ⇒ v≈111 px/s ; v = sqrt(G/r) ⇒ G = v²·r = 111²·248 ≈ 3.05e6.
   Sahne yeniden boyutlanırsa __gravityCalibrate() yeni G'yi ölçer. */
const G_BASE      = 3.09e6;  // çekim sabiti (medyan yörünge 14 sn tur)
const ORBIT_MASS  = 1.0;     // varsayılan merkez kütlesi
/* Yumuşatma ÖLÇÜMLE: 260 px merkeze yakın geçişte ivmeyi kırpmaya yetmiyordu
   (ölçüm: iç bölgede a_gercek/a_gerek ≈ 4.6–6.7 → parçacıklar dışa fırlıyor).
   Medyan yarıçap 248 px olduğu için yumuşatma yarıçapı sahne ölçeğine çekildi. */
/* Yumuşatma: yalnızca YAKIN GEÇİŞTE devreye girmeli (sayısal kararlılık).
   520 px sahne ölçeğinde ivmenin %78'ini yiyordu (ölçüm: vTan=49 / vCirc=105,
   parçacıklar içe düşüp halka yapıyordu). Sahne medyan yarıçapı 248 px olduğu
   için yumuşatma bunun çok altında: 60 px. */
const SOFTENING   = 60;      // yumuşatma yarıçapı (px) — yalnız yakın geçiş
const PULL_GAIN   = 6.0e5;   // sol tık çekiminin hissedilir gücü
const PUSH_GAIN   = 5.0e4;   // sağ tık itmesinin hissedilir gücü
const MAX_ACC     = 4200;    // ivme kırpma — sayısal kararlılık
const MAX_SPEED   = 2600;    // hız tavanı
const MAX_MASSES  = 6;

/* ------------------------------------------------------------------ */
/*  Gölgelendiriciler                                                  */
/* ------------------------------------------------------------------ */
const VS_POINT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec3 aColor;
layout(location=2) in float aSize;
uniform vec2 uRes;
uniform vec2 uCam;
out vec3 vColor;
void main(){
  vec2 p = aPos - uCam;
  vec2 ndc = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
  gl_PointSize = aSize;
  vColor = aColor;
}`;

const FS_POINT = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 outColor;
void main(){
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d,d) * 4.0;
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 4.5);          // sıcak çekirdek
  float halo = exp(-r2 * 1.6) * 0.34;   // kontrollü parıltı
  float a = core + halo;
  vec3 c = vColor * (0.72 + core * 1.45) + vec3(halo * 0.22);
  outColor = vec4(c * a, 1.0);          // additive: alfa = parlaklık
}`;

const VS_QUAD = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uRadius;
uniform vec2 uCam;
out vec2 vLocal;
void main(){
  vLocal = aCorner;
  vec2 p = uCenter + aCorner * uRadius - uCam;
  vec2 ndc = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

const FS_BODY = `#version 300 es
precision highp float;
in vec2 vLocal;
out vec4 outColor;
uniform vec3 uTint;
uniform float uPull;
void main(){
  float r = length(vLocal);
  if (r > 1.0) discard;
  float core = smoothstep(0.42, 0.0, r);
  float ring = smoothstep(1.0, 0.78, r) * smoothstep(0.72, 0.90, r);
  float glow = exp(-r * 3.2) * 0.55;
  vec3 c = uTint * (core * 1.5 + ring * 0.7 + glow);
  c += vec3(1.0) * core * 0.55;
  float a = clamp(core + glow + ring * 0.8, 0.0, 1.0);
  outColor = vec4(c * a, a * 0.92);
}`;

function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error('Shader: ' + gl.getShaderInfoLog(sh));
  }
  return sh;
}
function program(vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('Program: ' + gl.getProgramInfoLog(p));
  }
  return p;
}

const progPoint = program(VS_POINT, FS_POINT);
const progBody  = program(VS_QUAD, FS_BODY);

const uPoint = {
  res: gl.getUniformLocation(progPoint, 'uRes'),
  cam: gl.getUniformLocation(progPoint, 'uCam')
};
const uBody = {
  res:    gl.getUniformLocation(progBody, 'uRes'),
  center: gl.getUniformLocation(progBody, 'uCenter'),
  radius: gl.getUniformLocation(progBody, 'uRadius'),
  cam:    gl.getUniformLocation(progBody, 'uCam'),
  tint:   gl.getUniformLocation(progBody, 'uTint'),
  pull:   gl.getUniformLocation(progBody, 'uPull')
};

/* ------------------------------------------------------------------ */
/*  Parçacık verileri                                                  */
/* ------------------------------------------------------------------ */
const px = new Float32Array(MAX_PARTICLES);  // konum
const py = new Float32Array(MAX_PARTICLES);
const vx = new Float32Array(MAX_PARTICLES);  // hız
const vy = new Float32Array(MAX_PARTICLES);
const pc = new Float32Array(MAX_PARTICLES * 3); // renk
const ps = new Float32Array(MAX_PARTICLES);  // boyut
const baseColor = new Float32Array(MAX_PARTICLES * 3);
const phase = new Float32Array(MAX_PARTICLES); // parıltı fazı

const gpuPos   = new Float32Array(MAX_PARTICLES * 2);
const gpuColor = new Float32Array(MAX_PARTICLES * 3);
const gpuSize  = new Float32Array(MAX_PARTICLES);

let count = 0;          // aktif parçacık sayısı
let renderScale = 1;    // piksel oranı (DPR ayarı)
let viewW = 1, viewH = 1;       // mantıksal (CSS px)
let worldW = 1, worldH = 1;     // dünya (mantıksal * zoom)

/* GPU tamponları */
const vao = gl.createVertexArray();
const bufPos = gl.createBuffer();
const bufCol = gl.createBuffer();
const bufSize = gl.createBuffer();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
gl.bufferData(gl.ARRAY_BUFFER, gpuPos.byteLength, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, bufCol);
gl.bufferData(gl.ARRAY_BUFFER, gpuColor.byteLength, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, bufSize);
gl.bufferData(gl.ARRAY_BUFFER, gpuSize.byteLength, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

/* kütle çizimi için tam ekran quad */
const quadVAO = gl.createVertexArray();
const quadBuf = gl.createBuffer();
gl.bindVertexArray(quadVAO);
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

/* ------------------------------------------------------------------ */
/*  Kütleler                                                           */
/* ------------------------------------------------------------------ */
/** @type {{x:number,y:number,m:number,vx:number,vy:number,fixed:boolean,id:number,tint:number[]}[]} */
const masses = [];
let massSeq = 0;

function addMass(x, y, m, fixed, tint) {
  if (masses.length >= MAX_MASSES) masses.shift();
  masses.push({
    x, y, m, vx: 0, vy: 0, fixed: !!fixed,
    id: ++massSeq,
    tint: tint || pickTint(masses.length)
  });
  updateHud();
  return masses[masses.length - 1];
}
const TINTS = [
  [0.55, 0.72, 1.00],
  [0.78, 0.55, 1.00],
  [1.00, 0.82, 0.45],
  [0.65, 1.00, 0.88]
];
function pickTint(i) { return TINTS[i % TINTS.length]; }

/* ------------------------------------------------------------------ */
/*  Kamera (sinematik mode)                                            */
/* ------------------------------------------------------------------ */
const cam = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tz: 1, drift: 0 };

/* ------------------------------------------------------------------ */
/*  Başlatma / sıfırlama                                               */
/* ------------------------------------------------------------------ */
function currentPalette() { return PALETTES[S.palette] || PALETTES.nebula; }

function pickColorInto(out, off) {
  const pal = currentPalette();
  let r = Math.random();
  let idx = 0;
  for (let i = 0; i < pal.weights.length; i++) {
    r -= pal.weights[i];
    if (r <= 0) { idx = i; break; }
    idx = i;
  }
  const c = pal.colors[idx];
  // hafif ton sapması — tek renk düzlüğünü kırar
  const j = 0.10;
  out[off]     = clamp(c[0] + rand(-j, j), 0, 1);
  out[off + 1] = clamp(c[1] + rand(-j, j), 0, 1);
  out[off + 2] = clamp(c[2] + rand(-j, j), 0, 1);
}

/** Konumları dünya uzayına dağıt: yörüngeye uygun teğetsel hızlarla */
function seedParticles(from, to) {
  const pal = currentPalette();
  const start = from || 0;
  const end = (to === undefined) ? count : to;
  for (let i = start; i < end; i++) {
    // yoğunluk: merkeze doğru artan disk/elips
    let x, y;
    const mode = Math.random();
    const RMAX = Math.min(worldW, worldH) * 0.46;
    if (mode < 0.74) {
      // SARMAL GALAKSİ: 2 kol, logaritmik sarmal + kol içi saçılma
      const arm = Math.random() < 0.5 ? 0 : Math.PI;
      const t = Math.pow(Math.random(), 0.75);          // merkeze yoğunlaşma
      const r = t * RMAX;
      const theta = arm + r * 0.0125 + rand(-0.34, 0.34) * (1 - t * 0.45);
      x = worldW * 0.5 + Math.cos(theta) * r;
      y = worldH * 0.5 + Math.sin(theta) * r * 0.68;    // basık disk
    } else if (mode < 0.92) {
      // çekirdek bulutu — parlak merkez
      const a = Math.random() * TAU;
      const r = Math.pow(Math.random(), 1.6) * RMAX * 0.30;
      x = worldW * 0.5 + Math.cos(a) * r;
      y = worldH * 0.5 + Math.sin(a) * r * 0.85;
    } else {
      // hâle — geniş seyrek dış bölge
      const a = Math.random() * TAU;
      const r = RMAX * rand(0.55, 1.15);
      x = worldW * 0.5 + Math.cos(a) * r;
      y = worldH * 0.5 + Math.sin(a) * r * 0.75;
    }

    px[i] = x; py[i] = y;

    // teğetsel hız → yörüngeye oturma (daire hızı = sqrt(GM/r))
    const dx = x - worldW * 0.5;
    const dy = y - worldH * 0.5;
    const dist = Math.hypot(dx, dy) + 1e-3;
    /* DİFERANSİYEL DÖNME (kolların görünmesini sağlayan şey):
       Kepler hızı v = sqrt(G*M/r) parçacığın bulunduğu diskin İÇİNDEKİ kütleye
       göre hesaplanır. Kütle merkeze yığılı olduğu için iç bölgede açısal hız
       yüksek, dışta düşük → kollar zamanla sarılır (gerçek galaksi gibi).
       Ölçümle sabit: 0.98 katı alt-hız → kollar içe doğru hafif sarar,
       4 saniyede dağılmaz (kollar ölçümü: 0.12r→634, 0.42r→461). */
    /* ÖLÇÜMLE: 0.975-0.995 alt-hız 10 sn'de diski dışa savuruyordu
       (orta500px=2707/3000 ama sarmal yok, parçacıklar kaçıyor).
       Dairesel hızın TAM üstünde %0-1 fazla veriyoruz: yörünge kapalı kalır,
       diferansiyel dönme kolları sardırmaya devam eder. */
    /* KÖK DÜZELTME (ölçüm: r=243'te vTan=105 fakat 3 sn sonra r=446 — dışa kaçış):
       Fizikteki gerçek ivme a = G·M/(r² + SOFTENING²), ama tohum hızı yumuşatmasız
       sqrt(G/r) ile kuruluyordu → parçacıklar fazla hızlı başlıyor ve dışa kaçıyordu.
       Dairesel hız artık FİZİĞİN KENDİ paydasından türetiliyor: v = sqrt(a·r). */
    const rEff = Math.max(dist, 30);
    const aReal = G_BASE * S.gravity * ORBIT_MASS / (rEff * rEff + SOFTENING * SOFTENING);
    const vMag = Math.sqrt(aReal * rEff) * rand(1.0, 1.01);
    /* KÖK DÜZELTME (ölçümle kanıtlı): tohumdaki rastgele gürültü X ve Y eksenine
       AYRI ekleniyordu; bunun bir kısmı RADYAL yöne düşüp parçacığı dışa itiyordu
       (ölçüm: vRad=28, t3'te YORUNGEDE=0 / KACAN=2536). Gürültü artık SADECE
       teğetsel yöne ekleniyor → radyal hız 0, yörünge kapalı kalır. */
    const tx = -dy / dist, ty = dx / dist;          // teğet birim vektör
    const jitter = rand(-4, 4);                      // teğetsel saçılma
    vx[i] = tx * (vMag + jitter);
    vy[i] = ty * (vMag + jitter);

    // hız sınırı
    const sp = Math.hypot(vx[i], vy[i]);
    if (sp > MAX_SPEED) { vx[i] *= MAX_SPEED / sp; vy[i] *= MAX_SPEED / sp; }
    if (i === 0) {
      console.log('[SEED] dist=' + dist.toFixed(1) + ' vMag=' + vMag.toFixed(1) +
                  ' vx=' + vx[0].toFixed(2) + ' vy=' + vy[0].toFixed(2) +
                  ' maxSpeed=' + MAX_SPEED + ' G_BASE=' + G_BASE);
    }

    pickColorInto(baseColor, i * 3);
    pc[i*3] = baseColor[i*3]; pc[i*3+1] = baseColor[i*3+1]; pc[i*3+2] = baseColor[i*3+2];
    ps[i] = rand(1.4, 3.1) * (renderScale > 1 ? 1.15 : 1);
    phase[i] = Math.random() * TAU;
  }
  // palet referansı kullanılıyor (lint)
  void pal;
}

function resetAll(keepSettings) {
  if (!keepSettings) {
    S.gravity = 1.0;
    S.counts = Math.min(3000, MAX_PARTICLES);
    S.trail = 0.90;
    S.speed = 1.0;
    S.palette = 'nebula';
    S.cinematic = false;
    S.paused = false;
    syncUIFromState();
  }
  masses.length = 0;
  massSeq = 0;
  cam.x = cam.y = 0; cam.zoom = 1; cam.tx = 0; cam.ty = 0; cam.tz = 1;
  /* SIRA ÖNEMLİ: tohumlama hızları v=sqrt(G*M/r) merkez kütleye göre kurulur,
     bu yüzden kütle önce eklenir, parçacıklar sonra tohumlanır. */
  addMass(worldW * 0.5, worldH * 0.5, 1.0, true, TINTS[0]);
  /* KÖK DÜZELTME: count=0 + applyCount() yolu sıfırlamada seed'i çalıştırmıyordu
     (n > count karşılaştırması hazırda kalan dizileri koruyordu) → sıfırlama
     eski dağınık tozu bırakıyordu. Sıfırlama artık DOĞRUDAN tohumlar. */
  count = 0;
  S.counts = Math.round(clamp(S.counts, 500, MAX_PARTICLES));
  seedParticles(0, S.counts);
  count = S.counts;
  updateHud();
  clearScreen();
}

/* ------------------------------------------------------------------ */
/*  Boyut / ölçek                                                      */
/* ------------------------------------------------------------------ */
let dprCap = 2;

function resize() {
  viewW = Math.max(320, window.innerWidth);
  viewH = Math.max(240, window.innerHeight);
  const dpr = clamp(window.devicePixelRatio || 1, 1, dprCap);
  renderScale = dpr;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  canvas.style.width = viewW + 'px';
  canvas.style.height = viewH + 'px';
  worldW = viewW;
  worldH = viewH;
  gl.viewport(0, 0, canvas.width, canvas.height);
  clearScreen();
}

function clearScreen() {
  gl.clearColor(0.02, 0.024, 0.047, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/* ------------------------------------------------------------------ */
/*  Parçacık sayısı ayarı                                              */
/* ------------------------------------------------------------------ */
function applyCount(n) {
  n = Math.round(clamp(n, 500, MAX_PARTICLES));
  if (n > count) {
    // KÖK DÜZELTME (kanıtlı): eskiden burada parçacıklar rand(-40,40) hızıyla
    // üretiliyordu → teğetsel hız ~6 px/s, hiçbiri yörüngeye girmiyordu
    // (ölçüm: YORUNGEDE=0 / KACAN=1529). Artık tek doğru yol: seedParticles().
    seedParticles(count, n);
    count = n;
    S.counts = n;
    updateHud();
    return;
  }
  // sayı azaltılıyorsa: dizilerin başı korunur, kuyruk atılır
  count = n;
  S.counts = n;
  updateHud();
}

function recolorParticles() {
  for (let i = 0; i < count; i++) {
    pickColorInto(baseColor, i * 3);
    pc[i*3] = baseColor[i*3]; pc[i*3+1] = baseColor[i*3+1]; pc[i*3+2] = baseColor[i*3+2];
  }
}

/* ------------------------------------------------------------------ */
/*  Fizik — her karede tek geçiş                                       */
/* ------------------------------------------------------------------ */
let simTime = 0;

function physics(dt) {
  const gScale = G_BASE * S.gravity;
  const soft2 = SOFTENING * SOFTENING;
  simTime += dt;

  // kütleler: serbest olanlar birbirini çeker (fixed olanlar sabit)
  for (let a = 0; a < masses.length; a++) {
    const ma = masses[a];
    if (ma.fixed) continue;
    let ax = 0, ay = 0;
    for (let b = 0; b < masses.length; b++) {
      if (a === b) continue;
      const mb = masses[b];
      let dx = mb.x - ma.x, dy = mb.y - ma.y;
      const d2 = dx*dx + dy*dy + soft2;
      const inv = 1 / Math.sqrt(d2);
      const f = gScale * mb.m * 2.2 / d2;
      ax += dx * inv * f;
      ay += dy * inv * f;
    }
    ma.vx += ax * dt; ma.vy += ay * dt;
    const sp = Math.hypot(ma.vx, ma.vy);
    if (sp > MAX_SPEED) { ma.vx *= MAX_SPEED/sp; ma.vy *= MAX_SPEED/sp; }
    ma.x += ma.vx * dt;
    ma.y += ma.vy * dt;
  }

  // parçacıklar — tüm kütlelerin kuvvetleri birleşir
  const nM = masses.length;
  const mx = new Float64Array(nM), my = new Float64Array(nM), mm = new Float64Array(nM);
  for (let k = 0; k < nM; k++) { mx[k] = masses[k].x; my[k] = masses[k].y; mm[k] = masses[k].m; }

  const maxSp = MAX_SPEED * S.speed;
  const margin = 60;

  for (let i = 0; i < count; i++) {
    let ax = 0, ay = 0;
    const x = px[i], y = py[i];

    for (let k = 0; k < nM; k++) {
      const dx = mx[k] - x;
      const dy = my[k] - y;
      const d2 = dx*dx + dy*dy + soft2;      // yumuşatma: yakın geçiş patlamasını önler
      const inv = 1 / Math.sqrt(d2);
      // f = G*M/r^2 ; dx*inv*f → ivme vektörü (tek ölçek: tohum hızıyla aynı)
      const f = gScale * mm[k] / d2;
      ax += dx * inv * f;
      ay += dy * inv * f;
    }

    // ivme kırpma (sayısal kararlılık)
    const am = Math.hypot(ax, ay);
    if (am > MAX_ACC) { const s = MAX_ACC / am; ax *= s; ay *= s; }

    let nvx = vx[i] + ax * dt;
    let nvy = vy[i] + ay * dt;

    const sp = Math.hypot(nvx, nvy);
    if (sp > maxSp) { const s = maxSp / sp; nvx *= s; nvy *= s; }

    // hafif sürtünme — sonsuz ivmelenmeyi engeller
    nvx *= 0.9992; nvy *= 0.9992;

    vx[i] = nvx; vy[i] = nvy;
    let nx = x + nvx * dt;
    let ny = y + nvy * dt;

    // dünya sınırları: yumuşak geri dönüş
    if (nx < -margin) { nx = -margin; vx[i] = Math.abs(vx[i]) * 0.6; }
    else if (nx > worldW + margin) { nx = worldW + margin; vx[i] = -Math.abs(vx[i]) * 0.6; }
    if (ny < -margin) { ny = -margin; vy[i] = Math.abs(vy[i]) * 0.6; }
    else if (ny > worldH + margin) { ny = worldH + margin; vy[i] = -Math.abs(vy[i]) * 0.6; }

    px[i] = nx; py[i] = ny;
  }

  // itme darbeleri (sağ tık) — sönümlenerek kaybolur
  for (let j = impulses.length - 1; j >= 0; j--) {
    const im = impulses[j];
    im.life -= dt;
    im.strength *= Math.pow(0.02, dt);
    if (im.life <= 0 || im.strength < 1) { impulses.splice(j, 1); continue; }
    applyRadialImpulse(im);
  }
}

/* ------------------------------------------------------------------ */
/*  Darbeler (itme / çekim)                                            */
/* ------------------------------------------------------------------ */
const impulses = [];

function applyRadialImpulse(im) {
  const radius = im.radius;
  const r2 = radius * radius;
  const soft = 120;
  for (let i = 0; i < count; i++) {
    const dx = px[i] - im.x;
    const dy = py[i] - im.y;
    const d2 = dx*dx + dy*dy;
    if (d2 > r2) continue;
    const dist = Math.sqrt(d2) + soft;
    const falloff = 1 - Math.sqrt(d2) / radius;
    const f = im.strength * falloff * falloff / dist * (PUSH_GAIN / 900);
    vx[i] += dx / dist * f;
    vy[i] += dy / dist * f;
  }
}

/** Sol tık: geçici çekim merkezi — basılı olduğu süre boyunca canlı iter */
const pull = { active: false, x: 0, y: 0, strength: 0, target: 0 };

function applyPull(dt) {
  if (!pull.active) return;
  pull.strength += (pull.target - pull.strength) * clamp(dt * 9, 0, 1);
  const gScale = PULL_GAIN * S.gravity * pull.strength;
  const soft2 = SOFTENING * SOFTENING;
  const R = 760;
  const r2max = R * R;
  for (let i = 0; i < count; i++) {
    const dx = pull.x - px[i];
    const dy = pull.y - py[i];
    const d2 = dx*dx + dy*dy;
    if (d2 > r2max) continue;
    const d2s = d2 + soft2;
    const inv = 1 / Math.sqrt(d2s);
    // 1/r^2 çekim, kenara doğru yumuşak sönüm (darbeden çok akıntı)
    const edge = 1 - Math.sqrt(d2) / R;
    const f = gScale * edge / d2s;
    let ax = dx * inv * f;
    let ay = dy * inv * f;
    const am = Math.hypot(ax, ay);
    if (am > MAX_ACC) { const s = MAX_ACC / am; ax *= s; ay *= s; }
    vx[i] += ax * dt;
    vy[i] += ay * dt;
  }
}

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */
const trailQuadVAO = quadVAO;

function updateCamera(dt) {
  if (S.cinematic) {
    cam.drift += dt * 0.22;
    const amp = 26;
    cam.tx = Math.sin(cam.drift * 0.9) * amp;
    cam.ty = Math.cos(cam.drift * 0.7) * amp * 0.7;
    cam.tz = 1 + Math.sin(cam.drift * 0.35) * 0.045;
  } else {
    cam.tx = 0; cam.ty = 0; cam.tz = 1;
  }
  const k = clamp(dt * 2.2, 0, 1);
  cam.x += (cam.tx - cam.x) * k;
  cam.y += (cam.ty - cam.y) * k;
  cam.zoom += (cam.tz - cam.zoom) * k;
}

function drawFrame(dt) {
  gl.viewport(0, 0, canvas.width, canvas.height);

  /* --- iz koruması: önceki kareyi kısmen sil --- */
  // Not: alpha blend ile ekranı koyu renkle kaplayarak iz bırakıyoruz.
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const fade = 1 - clamp(S.trail, 0, 0.985);   // trail büyük = daha uzun iz
  gl.clearColor(0.02, 0.024, 0.047, clamp(fade * 1.35, 0.012, 1));
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* --- parçacık verisini hazırla --- */
  const camZoom = cam.zoom;
  const halfW = worldW * 0.5, halfH = worldH * 0.5;
  // kamera ofsetini zoom ile ölçekle (merkez etrafında)
  const camOx = (halfW + cam.x) - halfW / camZoom * camZoom; // sadeleşir; aşağıda kullanılıyor
  void camOx;

  const shimmer = 0.55 + 0.45 * Math.sin(simTime * 2.0);
  for (let i = 0; i < count; i++) {
    gpuPos[i*2]     = px[i];
    gpuPos[i*2 + 1] = py[i];
    const tw = 0.72 + 0.28 * Math.sin(simTime * 1.7 + phase[i]);
    const k = 0.55 + 0.45 * tw;
    gpuColor[i*3]     = baseColor[i*3] * k;
    gpuColor[i*3 + 1] = baseColor[i*3 + 1] * k;
    gpuColor[i*3 + 2] = baseColor[i*3 + 2] * k;
    gpuSize[i] = ps[i] * renderScale * (0.85 + 0.3 * tw);
  }
  void shimmer;

  /* --- parçacıkları çiz (additive) --- */
  gl.blendFunc(gl.ONE, gl.ONE);

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpuPos.subarray(0, count * 2));
  gl.bindBuffer(gl.ARRAY_BUFFER, bufCol);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpuColor.subarray(0, count * 3));
  gl.bindBuffer(gl.ARRAY_BUFFER, bufSize);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpuSize.subarray(0, count));

  gl.useProgram(progPoint);
  gl.uniform2f(uPoint.res, worldW, worldH);
  gl.uniform2f(uPoint.cam, cam.x, cam.y);
  gl.drawArrays(gl.POINTS, 0, count);

  /* --- kütleleri çiz --- */
  gl.useProgram(progBody);
  gl.uniform2f(uBody.res, worldW, worldH);
  gl.uniform2f(uBody.cam, cam.x, cam.y);
  gl.bindVertexArray(quadVAO);
  for (let k = 0; k < masses.length; k++) {
    const m = masses[k];
    const base = 16 + Math.pow(m.m, 0.5) * 22;
    const pulse = 1 + Math.sin(simTime * 1.6 + k) * 0.045;
    const rad = Math.min(base * pulse, 140);
    gl.uniform2f(uBody.center, m.x, m.y);
    gl.uniform1f(uBody.radius, rad);
    gl.uniform3f(uBody.tint, m.tint[0], m.tint[1], m.tint[2]);
    gl.uniform1f(uBody.pull, m.fixed ? 1 : 0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  gl.bindVertexArray(null);
  gl.disable(gl.BLEND);
}

/* ------------------------------------------------------------------ */
/*  Döngü + dinamik kalite                                             */
/* ------------------------------------------------------------------ */
let last = performance.now();
let fps = 60;
let fpsAcc = 0, fpsFrames = 0;
let slowFrames = 0, fastFrames = 0;
let qualityLevel = 0; // 0 = tam kalite, 1 = düşürüldü, 2 = en düşük
const Q_NAMES = ['tam', 'dengeli', 'ekonomik'];

/* ÖLÇÜM KANCASI: otomatik kalite yolu yalnız cihaz zorlandığında çalışır.
   Gerçek donanımda zorlanma olmadığı için bu yol CANLI ölçülemiyordu; bu kanca
   aynı kod yolunu yapay bir "yavaş kare" dizisiyle tetikleyip sonucu raporlar. */
window.__gravityForceSlow = function (frames) {
  const n = frames || 50;
  for (let i = 0; i < n; i++) autoQuality(1 / 30);
  return { quality: Q_NAMES[qualityLevel], particles: count, dprCap: dprCap };
};

function autoQuality(dt) {
  if (!S.autoQuality) return;
  if (dt > 1 / 40) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
  if (dt < 1 / 55) fastFrames++; else fastFrames = Math.max(0, fastFrames - 1);

  if (slowFrames > 45 && qualityLevel < 2) {
    // cihaz zorlanıyor → parçacık ve çözünürlük düşür
    qualityLevel++;
    slowFrames = 0;
    if (qualityLevel === 1) {
      applyCount(Math.min(count, 2400));
      dprCap = 1.4; resize();
    } else {
      applyCount(Math.min(count, 1500));
      dprCap = 1.0; resize();
    }
    toast('Performans için kalite düşürüldü: ' + Q_NAMES[qualityLevel] + ' (' + count + ' parçacık)');
  } else if (fastFrames > 240 && qualityLevel > 0) {
    qualityLevel--;
    fastFrames = 0;
    if (qualityLevel === 0) { dprCap = 2; resize(); }
    else { dprCap = 1.4; resize(); }
    toast('Kalite yükseltildi: ' + Q_NAMES[qualityLevel]);
  }
}

function frame(now) {
  const rawDt = Math.min((now - last) / 1000, 0.05); // sekme geri gelince sıçramayı kırp
  last = now;

  fpsAcc += rawDt; fpsFrames++;
  if (fpsAcc >= 0.35) {
    fps = fpsFrames / fpsAcc;
    fpsAcc = 0; fpsFrames = 0;
    updateFpsChip();
  }

  if (!S.paused) {
    const dt = clamp(rawDt, 0.0005, 0.033) * S.speed;
    applyPull(dt);
    physics(dt);
    updateCamera(rawDt);
  }

  drawFrame(rawDt);
  autoQuality(rawDt);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ */
/*  HUD + bildirim                                                     */
/* ------------------------------------------------------------------ */
const chipFps = document.getElementById('chipFps');
const chipCount = document.getElementById('chipCount');
const chipMass = document.getElementById('chipMass');

function updateFpsChip() {
  chipFps.innerHTML = '<b>' + Math.round(fps) + '</b> FPS';
  chipFps.className = 'chip ' + (fps >= 55 ? 'fps-good' : fps >= 35 ? 'fps-mid' : 'fps-bad');
}
function updateHud() {
  chipCount.innerHTML = 'Parçacık <b>' + count + '</b>';
  chipMass.innerHTML = 'Kütle <b>' + masses.length + '</b>';
}

const toastEl = document.getElementById('toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ------------------------------------------------------------------ */
/*  Panel bağlantıları                                                 */
/* ------------------------------------------------------------------ */
const rGrav = document.getElementById('rGrav');
const rCount = document.getElementById('rCount');
const rTrail = document.getElementById('rTrail');
const rSpeed = document.getElementById('rSpeed');
const vGrav = document.getElementById('vGrav');
const vCount = document.getElementById('vCount');
const vTrail = document.getElementById('vTrail');
const vSpeed = document.getElementById('vSpeed');
const bCinema = document.getElementById('bCinema');
const bClear = document.getElementById('bClear');
const bReset = document.getElementById('bReset');
const bAuto = document.getElementById('bAuto');
const swatches = document.getElementById('swatches');
const panel = document.getElementById('panel');
const panelToggle = document.getElementById('panelToggle');

/* palet düğmeleri */
const palKeys = Object.keys(PALETTES);
palKeys.forEach(key => {
  const pal = PALETTES[key];
  const el = document.createElement('div');
  el.className = 'sw' + (key === S.palette ? ' on' : '');
  el.dataset.key = key;
  el.title = pal.name;
  const grad = pal.colors.map((c, i) =>
    `rgb(${(c[0]*255)|0},${(c[1]*255)|0},${(c[2]*255)|0}) ${(i/pal.colors.length*100)|0}%`
  ).join(',');
  el.style.background = `linear-gradient(135deg, ${pal.colors.map(c =>
    `rgb(${(c[0]*255)|0},${(c[1]*255)|0},${(c[2]*255)|0})`).join(',')})`;
  void grad;
  el.addEventListener('click', () => {
    S.palette = key;
    recolorParticles();
    [...swatches.children].forEach(s => s.classList.toggle('on', s.dataset.key === key));
    toast('Palet: ' + pal.name);
  });
  swatches.appendChild(el);
});

function syncUIFromState() {
  rGrav.value = S.gravity;      vGrav.textContent = S.gravity.toFixed(2) + '×';
  rCount.value = S.counts;      vCount.textContent = String(S.counts);
  rTrail.value = S.trail;       vTrail.textContent = S.trail.toFixed(2);
  rSpeed.value = S.speed;       vSpeed.textContent = S.speed.toFixed(2) + '×';
  bCinema.classList.toggle('on', S.cinematic);
  bAuto.textContent = 'Otomatik kalite: ' + (S.autoQuality ? 'açık' : 'kapalı');
  [...swatches.children].forEach(s => s.classList.toggle('on', s.dataset.key === S.palette));
}

rGrav.addEventListener('input', () => {
  S.gravity = parseFloat(rGrav.value);
  vGrav.textContent = S.gravity.toFixed(2) + '×';
});
rCount.addEventListener('input', () => {
  const v = parseInt(rCount.value, 10);
  vCount.textContent = String(v);
  applyCount(v);
});
rTrail.addEventListener('input', () => {
  S.trail = parseFloat(rTrail.value);
  vTrail.textContent = S.trail.toFixed(2);
});
rSpeed.addEventListener('input', () => {
  S.speed = parseFloat(rSpeed.value);
  vSpeed.textContent = S.speed.toFixed(2) + '×';
});

bCinema.addEventListener('click', () => {
  S.cinematic = !S.cinematic;
  bCinema.classList.toggle('on', S.cinematic);
  toast(S.cinematic ? 'Sinematik mod açık' : 'Sinematik mod kapalı');
});
bClear.addEventListener('click', () => {
  masses.length = 0;
  updateHud();
  toast('Tüm kütleler silindi');
});
bReset.addEventListener('click', () => {
  resetAll(false);
  toast('Sistem sıfırlandı');
  if (window.__gravityReport) {
    window.dispatchEvent(new CustomEvent('numex:reset'));
  }
});
bAuto.addEventListener('click', () => {
  S.autoQuality = !S.autoQuality;
  bAuto.textContent = 'Otomatik kalite: ' + (S.autoQuality ? 'açık' : 'kapalı');
  if (!S.autoQuality) { qualityLevel = 0; dprCap = 2; resize(); }
  toast(S.autoQuality ? 'Otomatik kalite açık' : 'Otomatik kalite kapalı');
});

panelToggle.addEventListener('click', () => {
  panel.classList.toggle('hidden');
});

/* ------------------------------------------------------------------ */
/*  Fare + dokunma etkileşimi                                          */
/* ------------------------------------------------------------------ */
let dragging = null;     // sürüklenen kütle
let dragMoved = false;
let downPos = { x: 0, y: 0 };
let rightPulse = { active: false, x: 0, y: 0 };
let lastClickTime = 0;

function toWorld(ev) {
  const rect = canvas.getBoundingClientRect();
  // ekran → dünya (kamera tersi)
  const sx = ev.clientX - rect.left;
  const sy = ev.clientY - rect.top;
  return { x: sx + cam.x, y: sy + cam.y };
}

function massAt(x, y, tol) {
  let best = null, bestD = Infinity;
  for (const m of masses) {
    const d = Math.hypot(m.x - x, m.y - y);
    const rad = 16 + Math.pow(m.m, 0.5) * 22;
    if (d < rad + tol && d < bestD) { best = m; bestD = d; }
  }
  return best;
}

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('pointerdown', (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  const p = toWorld(ev);
  downPos = p;
  dragMoved = false;

  if (ev.button === 2) {
    // Sağ tık → itme darbesi (basılı tuttukça sürer)
    rightPulse.active = true;
    rightPulse.x = p.x; rightPulse.y = p.y;
    impulses.push({ x: p.x, y: p.y, strength: 900, radius: 460, life: 0.9 });
    toast('İtme kuvveti uygulandı');
    return;
  }

  if (ev.button !== 0) return;

  // kütleye mi bastık? → sürükleme
  const hit = massAt(p.x, p.y, 10 * cam.zoom);
  if (hit) {
    dragging = hit;
    return;
  }

  // boş alan → geçici çekim merkezi
  pull.active = true;
  pull.x = p.x; pull.y = p.y;
  pull.target = 1;
  pull.strength = 0.15;
});

canvas.addEventListener('pointermove', (ev) => {
  const p = toWorld(ev);

  if (rightPulse.active) {
    rightPulse.x = p.x; rightPulse.y = p.y;
  }

  if (dragging) {
    if (Math.hypot(p.x - downPos.x, p.y - downPos.y) > 2) dragMoved = true;
    dragging.x = p.x;
    dragging.y = p.y;
    dragging.vx *= 0.5;
    dragging.vy *= 0.5;
    return;
  }

  if (pull.active) {
    pull.x = p.x; pull.y = p.y;
  }
});

function endPointer(ev) {
  const p = toWorld(ev);
  if (dragging) {
    if (!dragMoved) {
      // kütleye tıkladık ama sürüklemedik → hiçbir şey yapma
    }
    dragging = null;
  }
  if (pull.active) {
    pull.active = false;
    pull.target = 0;
  }
  rightPulse.active = false;
  void p;
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

/* çift tık → kalıcı kütle */
canvas.addEventListener('dblclick', (ev) => {
  ev.preventDefault();
  const p = toWorld(ev);
  // mevcut kütleye çift tıkladıysak sil
  const hit = massAt(p.x, p.y, 8);
  if (hit) {
    const idx = masses.indexOf(hit);
    if (idx >= 0) { masses.splice(idx, 1); updateHud(); toast('Kütle kaldırıldı'); }
    return;
  }
  const m = addMass(p.x, p.y, rand(0.7, 1.5), false);
  void m;
  toast('Kütle yerleştirildi — toplam ' + masses.length);
});

/* çift tık algısı için ek yedek (dokunmatik) */
canvas.addEventListener('click', (ev) => {
  const now = performance.now();
  if (now - lastClickTime < 320 && ev.pointerType !== 'mouse') {
    const p = toWorld(ev);
    const hit = massAt(p.x, p.y, 8);
    if (hit) {
      const idx = masses.indexOf(hit);
      if (idx >= 0) masses.splice(idx, 1);
    } else {
      addMass(p.x, p.y, rand(0.7, 1.5), false);
    }
    updateHud();
  }
  lastClickTime = now;
});

/* klavye */
window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space') {
    ev.preventDefault();
    S.paused = !S.paused;
    toast(S.paused ? 'Duraklatıldı' : 'Devam ediyor');
  } else if (ev.key === 'h' || ev.key === 'H') {
    panel.classList.toggle('hidden');
  } else if (ev.key === 'r' || ev.key === 'R') {
    resetAll(false);
    toast('Sistem sıfırlandı');
  } else if (ev.key === 'c' || ev.key === 'C') {
    bCinema.click();
  }
});

/* ------------------------------------------------------------------ */
/*  Ölçüm köprüsü — tarayıcı doğrulaması için                          */
/* ------------------------------------------------------------------ */
/* KÖK ÖLÇÜM: bir parçacığın merkez kütleden gördüğü ivme ile
   dairesel yörünge için gereken ivmeyi (v^2/r) yan yana verir. */
/* KÖK ÖLÇÜM 2: galaksinin GERÇEK yarıçap dağılımını ve istenen tur süresi
   için gereken G'yi sayı olarak verir. Tahmin yok, sahne ölçümü var. */
window.__gravityCalibrate = function (targetTurnSeconds) {
  const cx = worldW * 0.5, cy = worldH * 0.5;
  const rs = [];
  for (let i = 0; i < count; i++) rs.push(Math.hypot(px[i] - cx, py[i] - cy));
  rs.sort((a, b) => a - b);
  const q = f => rs[Math.min(rs.length - 1, Math.floor(rs.length * f))];
  const rMed = q(0.5), rP90 = q(0.9);
  const T = targetTurnSeconds || 14;
  // v = 2πr/T ve v = sqrt(G/r)  ⇒  G = v²·r = (2πr/T)²·r
  const G_med = Math.pow(2 * Math.PI * rMed / T, 2) * rMed;
  const G_p90 = Math.pow(2 * Math.PI * rP90 / T, 2) * rP90;
  return {
    worldW: Math.round(worldW), worldH: Math.round(worldH),
    rMed: Math.round(rMed), rP90: Math.round(rP90),
    G_BASE_now: G_BASE,
    G_median: Math.round(G_med), G_p90: Math.round(G_p90),
    turnSecNow_med: +(2 * Math.PI * rMed / Math.sqrt(G_BASE / Math.max(rMed, 1))).toFixed(1)
  };
};

/* KÖK ÖLÇÜM 3: parçacığın TAM durumu — yarıçap, hız, daire hızı (v_circ),
   teğetsel ve RADYAL hız bileşenleri. Radyal hız büyükse parçacık yörüngede
   değil, kaçıyor/düşüyor demektir. Kaç parçacık gerçekten yörüngede? */
window.__gravityDiagnose = function () {
  const cx = worldW * 0.5, cy = worldH * 0.5;
  const out = [];
  let onOrbit = 0, escaping = 0, falling = 0;
  for (let i = 0; i < count; i++) {
    const dx = px[i] - cx, dy = py[i] - cy;
    const r = Math.hypot(dx, dy) || 1e-6;
    const vRad = (vx[i]*dx + vy[i]*dy) / r;      // radyal (dışa +)
    const vTan = (-vx[i]*dy + vy[i]*dx) / r;     // teğetsel
    const vCirc = Math.sqrt(G_BASE * ORBIT_MASS / Math.max(r, 30));
    const ratio = Math.abs(vTan) / vCirc;
    if (ratio > 0.85 && ratio < 1.15 && Math.abs(vRad) < vCirc * 0.35) onOrbit++;
    else if (vRad > 0) escaping++; else falling++;

    if (i < 3) {
      out.push('p' + i + ' r=' + Math.round(r) + ' vTan=' + Math.round(vTan) +
               ' vRad=' + Math.round(vRad) + ' vCirc=' + Math.round(vCirc) +
               ' oran=' + ratio.toFixed(2));
    }
  }
  return out.join(' | ') + ' ⇒ YORUNGEDE=' + onOrbit + ' KACAN=' + escaping + ' DUSEN=' + falling;
};

/* yörünge dayanıklılık ölçümü: r yarıçapındaki halka parçacıkların
   belirli süre sonra ne kadarının hâlâ o yarıçapta olduğunu sayar */
window.__gravityOrbit = function () {
  const cx = worldW * 0.5, cy = worldH * 0.5;
  const bands = [0.12, 0.2, 0.3, 0.42];
  const RMAX = Math.min(worldW, worldH);
  return bands.map(f => {
    let n = 0;
    const r0 = RMAX * f;
    for (let i = 0; i < count; i++) {
      const d = Math.hypot(px[i] - cx, py[i] - cy);
      if (Math.abs(d - r0) < RMAX * 0.05) n++;
    }
    return f.toFixed(2) + 'r:' + n;
  }).join(' ');
};

window.__gravityNear = function (cx, cy, R) {
  let n = 0;
  const r2 = R * R;
  for (let i = 0; i < count; i++) {
    const dx = px[i] - cx, dy = py[i] - cy;
    if (dx*dx + dy*dy < r2) n++;
  }
  return n;
};

window.__gravityReport = function () {
  let sx = 0, sy = 0, sv = 0;
  for (let i = 0; i < count; i++) {
    sx += px[i]; sy += py[i];
    sv += Math.hypot(vx[i], vy[i]);
  }
  return {
    fps: Math.round(fps * 10) / 10,
    particles: count,
    masses: masses.length,
    massList: masses.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), m: +m.m.toFixed(2), fixed: m.fixed })),
    centroid: { x: Math.round(sx / count), y: Math.round(sy / count) },
    avgSpeed: Math.round(sv / count * 10) / 10,
    gravity: S.gravity,
    speed: S.speed,
    trail: S.trail,
    palette: S.palette,
    cinematic: S.cinematic,
    paused: S.paused,
    pullActive: pull.active,
    quality: Q_NAMES[qualityLevel]
  };
};

/* ------------------------------------------------------------------ */
/*  Başlat                                                             */
/* ------------------------------------------------------------------ */
window.addEventListener('resize', resize);
resize();
resetAll(false);
syncUIFromState();
requestAnimationFrame(function start(t) {
  last = t;
  requestAnimationFrame(frame);
});

})();
