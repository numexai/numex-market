// NUMEX CORE — EVENT HORIZON
// Denetleyici: WebGL2 kurulumu, kamera durumu, UI bağlantısı, FPS ölçümü, adaptif kalite.
// Ana fizik hesabı shader.js içindeki fragment shader'dadır; bu dosya ona veri sağlar.
// GLOBAL HATA YAKALAYICI — her şeyden önce kurulur, hatayı ekranda gösterir
window.addEventListener('error', function (ev) {
  var box = document.getElementById('errbox');
  var ov = document.getElementById('overlay');
  var ld = document.getElementById('ldbox');
  if (box && ov) {
    ov.classList.remove('gone');
    ov.style.visibility = 'visible';
    ov.style.opacity = '1';
    if (ld) ld.style.display = 'none';
    box.style.display = 'block';
    var pre = document.getElementById('errtext');
    if (pre) pre.textContent = (ev.message || '') + '\n' + (ev.filename || '') + ':' + (ev.lineno || '');
  }
  console.error('[NUMEX HATA]', ev.message, ev.filename, ev.lineno);
});

(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl2', {
    antialias: false, alpha: false, depth: false, stencil: false,
    preserveDrawingBuffer: true, powerPreference: 'high-performance'
  });

  // ---------------- HATA GÖSTERİMİ ----------------
  const overlay = document.getElementById('overlay');
  const ldbox = document.getElementById('ldbox');
  const errbox = document.getElementById('errbox');
  const errtext = document.getElementById('errtext');

  function fail(title, detail) {
    overlay.classList.remove('gone');
    ldbox.style.display = 'none';
    errbox.style.display = 'block';
    errbox.querySelector('h2').textContent = title;
    errtext.textContent = detail;
    // Sayfa boş kalmasın: canvas'a okunabilir bir mesaj zemini çiz
    try {
      const ctx2 = canvas.getContext('2d');
      if (ctx2) {
        canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
        ctx2.fillStyle = '#080a10'; ctx2.fillRect(0, 0, canvas.width, canvas.height);
        ctx2.fillStyle = '#f87171'; ctx2.font = '16px monospace';
        ctx2.fillText('GPU hatası — simülasyon çalışmıyor', 40, 60);
      }
    } catch (e) { /* yok say */ }
  }

  if (!gl) {
    fail('WEBGL2 DESTEĞİ YOK', 'Bu tarayıcı WebGL2 sağlamıyor. Chrome/Edge güncel bir sürüm deneyin ya da donanım hızlandırmayı açın.');
    return;
  }

  // ---- ÖLÇÜM API'si: sahne tamponundan gerçek piksel değerleri okur (test/doğrulama için)
  window.numexProbe = function (nx, ny) {
    // nx, ny ∈ [0,1] normalize ekran koordinatı (sol-alt orijin)
    if (!window.__sceneT || !gl) return null;
    const t = window.__sceneT;
    const px = new Uint8Array(4);
    // HDR (RGBA16F) hedefte readPixels UNSIGNED_BYTE çalışmaz → küçük bir kopya FBO kullan
    try {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, t.fbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, window.__probeFBO);
      const x = Math.floor(nx * (t.w - 1)), y = Math.floor(ny * (t.h - 1));
      gl.blitFramebuffer(x, y, x + 1, y + 1, 0, 0, 1, 1, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, window.__probeFBO);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      return [px[0], px[1], px[2], px[3]];
    } catch (e) {
      return 'err:' + e.message;
    }
  };

  // ---------------- SHADER DERLEME ----------------
  function compile(type, src, label) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) || '(boş log)';
      throw new Error('[' + label + '] ' + log);
    }
    return sh;
  }
  function program(vs, fs, label) {
    const p = gl.createProgram();
    const v = compile(gl.VERTEX_SHADER, vs, label + ':vs');
    const f = compile(gl.FRAGMENT_SHADER, fs, label + ':fs');
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('[' + label + ':link] ' + (gl.getProgramInfoLog(p) || '(boş log)'));
    }
    gl.deleteShader(v); gl.deleteShader(f);
    return p;
  }

  let mainProg, brightProg, blurProg, compProg;
  try {
    mainProg = program(window.VS_SOURCE, window.FS_SOURCE, 'raytracer');
    brightProg = program(window.POST_VS, window.BRIGHT_FS, 'bright');
    blurProg = program(window.POST_VS, window.BLUR_FS, 'blur');
    compProg = program(window.POST_VS, window.COMPOSITE_FS, 'composite');
  } catch (e) {
    fail('SHADER DERLEME HATASI', (e && e.message) ? e.message : String(e));
    return;
  }

  // uniform konumları önbelleğe al
  const U = {};
  const names = ['uRes', 'uTime', 'uCamPos', 'uCamBasis', 'uTanHalfFov',
    'uDiskInner', 'uDiskOuter', 'uTempScale', 'uSpin', 'uTurb', 'uDoppler',
    'uLensing', 'uExposure', 'uMode', 'uRadii', 'uQuality', 'uMaxSteps'];
  names.forEach(n => U[n] = gl.getUniformLocation(mainProg, n));
  const UB = {
    tex: gl.getUniformLocation(brightProg, 'uTex'),
    threshold: gl.getUniformLocation(brightProg, 'uThreshold'),
    soft: gl.getUniformLocation(brightProg, 'uSoft')
  };
  const UL = {
    tex: gl.getUniformLocation(blurProg, 'uTex'),
    dir: gl.getUniformLocation(blurProg, 'uDir')
  };
  const UC = {
    scene: gl.getUniformLocation(compProg, 'uScene'),
    bloom: gl.getUniformLocation(compProg, 'uBloom'),
    amt: gl.getUniformLocation(compProg, 'uBloomAmt'),
    mode: gl.getUniformLocation(compProg, 'uMode')
  };

  const vao = gl.createVertexArray();

  // Adaptif kalite çarpanı (0.25–1.0). resize() bunu kullanır → TANIMI ÖNCE olmalı.
  let qualityLevel = 1.0;

  // ---------------- PİKSEL TAMPONLARI ----------------
  function makeTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, ok: st === gl.FRAMEBUFFER_COMPLETE };
  }
  function freeTarget(t) {
    if (!t) return;
    gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo);
  }

  // HDR desteklenmiyorsa düşük duyarlıklı hedef
  let hdrOK = true;
  let sceneT = makeTarget(8, 8);
  if (!sceneT.ok) {
    hdrOK = false;
    freeTarget(sceneT);
    sceneT = { tex: gl.createTexture(), fbo: gl.createFramebuffer(), w: 8, h: 8, ok: true, ldr: true };
  }

  function allocTarget(w, h) {
    if (hdrOK) {
      const t = makeTarget(w, h);
      if (t.ok) return t;
      hdrOK = false;
      freeTarget(t);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, ok: true, ldr: true };
  }

  let bloomA = null, bloomB = null;

  // ölçüm için 1x1 RGBA8 kopya hedefi
  (function initProbe() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    window.__probeFBO = fbo;
  })();

  function resize(dpr) {
    const scale = state.renderScale;
    const w = Math.max(64, Math.floor(canvas.clientWidth * dpr * scale));
    const h = Math.max(64, Math.floor(canvas.clientHeight * dpr * scale));
    // Boyut gerçekten değişmediyse yeniden ayırma (her resize'da doku yenilemek pahalı)
    if (sceneT && sceneT.w === w && sceneT.h === h && canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h;
    freeTarget(sceneT); freeTarget(bloomA); freeTarget(bloomB);
    sceneT = allocTarget(w, h);
    window.__sceneT = sceneT;
    // Bloom hedefleri 1/8 çözünürlük: 4× daha az piksel.
    // Bloom zaten bulanık bir efekt — tam çözünürlük gereksiz maliyet.
    const bw = Math.max(16, w >> 3), bh = Math.max(16, h >> 3);
    bloomA = allocTarget(bw, bh);
    bloomB = allocTarget(bw, bh);
    document.getElementById('hud-res').textContent = w + '×' + h;
  }

  // ---------------- DURUM ----------------
  window.__state = null; // teşhis için (render içinde atanır)

  const state = {
    mass: 1.0,
    dist: 18.0,          // rs birimi
    incl: 12,            // derece
    azim: 0.6,           // radyan
    fov: 52,
    inner: 3.0,
    outer: 12.0,
    temp: 1.0,
    spin: 1.0,
    turb: 0.55,
    doppler: true,
    lensing: true,
    steps: 130,
    renderScale: 0.32,
    bloom: 1.0,
    exposure: 0.75,
    adaptive: true,
    radii: false,
    speed: 1.0,
    paused: false,
    mode: 0,             // 0 bilimsel, 1 sinematik
    quality: 0.5
  };

  // kamera yumuşatma hedefleri (sıçramasız geçiş — TEST 7)
  const cam = { dist: state.dist, incl: state.incl, azim: state.azim, fov: state.fov };
  const camTarget = { dist: state.dist, incl: state.incl, azim: state.azim, fov: state.fov };

  // ---------------- KAMERA ----------------
  function updateCamera(dt) {
    const k = 1 - Math.pow(0.001, dt);       // üstel yumuşatma
    cam.dist += (camTarget.dist - cam.dist) * k;
    cam.incl += (camTarget.incl - cam.incl) * k;
    cam.azim += (camTarget.azim - cam.azim) * k;
    cam.fov += (camTarget.fov - cam.fov) * k;
    state.dist = cam.dist; state.incl = cam.incl; state.azim = cam.azim; state.fov = cam.fov;

    // Shader tüm uzunlukları r_s = 1 biriminde kullanır → kamera konumu da r_s cinsinden.
    const th = cam.incl * Math.PI / 180;
    const rRs = Math.max(cam.dist, 2.15);
    camPos = [
      Math.cos(th) * Math.cos(cam.azim) * rRs,
      Math.sin(th) * rRs,
      Math.cos(th) * Math.sin(cam.azim) * rRs
    ];
  }
  let camPos = [0, 2, 18];

  function cameraBasis(pos) {
    // ileri = -normalize(pos) (merkeze bak), sağ/yukarı dünya Y ekseni ile
    const f = norm([-pos[0], -pos[1], -pos[2]]);
    let upWorld = [0, 1, 0];
    let rgt = cross(f, upWorld);
    if (len(rgt) < 1e-4) rgt = [1, 0, 0];
    rgt = norm(rgt);
    const up = norm(cross(rgt, f));
    return [rgt, up, f];
  }
  const len = v => Math.hypot(v[0], v[1], v[2]);
  const norm = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // ---------------- RENDER ----------------
  let simTime = 0;
  let lastT = performance.now();
  let fpsAcc = 0, fpsFrames = 0, fps = 0, msAcc = 0;
  let lastAdapt = 0;

  function drawQuad() {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function render(dt) {
    const w = canvas.width, h = canvas.height;
    const th = cam.incl * Math.PI / 180;
    const rs = state.mass;
    // shader rs = 1 birimini kullanır: kamera konumu rs cinsinden
    const rRs = Math.max(cam.dist, 2.15);
    const pos = [
      Math.cos(th) * Math.cos(cam.azim) * rRs,
      Math.sin(th) * rRs,
      Math.cos(th) * Math.sin(cam.azim) * rRs
    ];
    const [R, Uv, F] = cameraBasis(pos);

    // 1) ana ışın izleme → sceneT
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneT.fbo);
    gl.viewport(0, 0, sceneT.w, sceneT.h);
    gl.useProgram(mainProg);
    gl.uniform2f(U.uRes, sceneT.w, sceneT.h);
    gl.uniform1f(U.uTime, simTime);
    gl.uniform3f(U.uCamPos, pos[0], pos[1], pos[2]);
    // WebGL matrisleri SÜTUN-öncelikli: her sütun bir eksen → mat3(e1,e2,e3)*v = e1*v.x + e2*v.y + e3*v.z
    gl.uniformMatrix3fv(U.uCamBasis, false, new Float32Array([
      R[0], R[1], R[2],
      Uv[0], Uv[1], Uv[2],
      F[0], F[1], F[2]
    ]));
    gl.uniform1f(U.uTanHalfFov, Math.tan((cam.fov * Math.PI / 180) * 0.5));
    gl.uniform1f(U.uDiskInner, Math.max(1.55, state.inner));
    gl.uniform1f(U.uDiskOuter, Math.max(state.inner + 0.5, state.outer));
    gl.uniform1f(U.uTempScale, state.temp);
    gl.uniform1f(U.uSpin, state.spin);
    gl.uniform1f(U.uTurb, state.turb);
    gl.uniform1f(U.uDoppler, state.doppler ? 1 : 0);
    gl.uniform1f(U.uLensing, state.lensing ? 1 : 0);
    gl.uniform1f(U.uExposure, state.exposure);
    gl.uniform1f(U.uMode, state.mode);
    gl.uniform1f(U.uRadii, state.radii ? 1 : 0);
    gl.uniform1i(U.uMaxSteps, Math.round(state.steps * qualityLevel));
    window.__state = state; window.__pos = pos; window.__cam = cam;
    drawQuad();

    // 2) bloom: bright pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.viewport(0, 0, bloomA.w, bloomA.h);
    gl.useProgram(brightProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneT.tex);
    gl.uniform1i(UB.tex, 0);
    // Bloom eşiği: gölgeye taşmayı azaltmak için yüksek tutulur
    gl.uniform1f(UB.threshold, state.mode > 0.5 ? 0.62 : 0.75);
    gl.uniform1f(UB.soft, 0.35);
    drawQuad();

    // 3) ayrılabilir blur (2 geçiş)
    gl.useProgram(blurProg);
    gl.uniform1i(UL.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
    gl.viewport(0, 0, bloomB.w, bloomB.h);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform2f(UL.dir, 1.6 / bloomA.w, 0);
    drawQuad();

    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
    gl.uniform2f(UL.dir, 0, 1.6 / bloomB.h);
    drawQuad();

    // 4) kompozit → ekran
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(compProg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneT.tex);
    gl.uniform1i(UC.scene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform1i(UC.bloom, 1);
    gl.uniform1f(UC.amt, state.bloom * (state.mode > 0.5 ? 0.9 : 0.55));
    gl.uniform1f(UC.mode, state.mode);
    drawQuad();
  }

  // ---------------- ANA DÖNGÜ ----------------
  const hudFps = document.getElementById('hud-fps');
  const hudMs = document.getElementById('hud-ms');
  const hudSteps = document.getElementById('hud-steps');
  const hudQuality = document.getElementById('hud-quality');
  const hudCam = document.getElementById('hud-cam');
  const hudMode = document.getElementById('hud-mode');

  function qualityLabel() {
    const s = Math.round(state.steps * qualityLevel);
    if (s >= 300) return 'YÜKSEK';
    if (s >= 180) return 'ORTA';
    if (s >= 90) return 'DÜŞÜK';
    return 'MİNİMUM';
  }

  function frame(now) {
    const dtReal = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;

    updateCamera(dtReal * 2.2);
    if (!state.paused) simTime += dtReal * state.speed;

    const t0 = performance.now();
    try {
      render(dtReal);
    } catch (e) {
      if (!window.__renderErrShown) {
        window.__renderErrShown = true;
        fail('RENDER HATASI', (e && e.stack) ? e.stack : String(e));
      }
      window.__stopLoop = true;   // döngüyü durdur, ekranda hata kalsın
      return;
    }
    const t1 = performance.now();

    // ölçümler
    const frameMs = t1 - t0;
    msAcc = msAcc * 0.9 + frameMs * 0.1;
    fpsAcc += dtReal; fpsFrames++;
    if (fpsAcc >= 0.5 && fpsFrames > 0) {
      fps = fpsFrames / fpsAcc;
      fpsAcc = 0; fpsFrames = 0;
      hudFps.textContent = fps.toFixed(0);
      hudMs.textContent = msAcc.toFixed(1) + ' ms';
      hudSteps.textContent = Math.round(state.steps * qualityLevel);
      hudQuality.textContent = 'KALİTE: ' + qualityLabel();
      hudQuality.className = 'pill ' + (fps >= 45 ? 'ok' : fps >= 25 ? 'warn' : 'err');
      hudCam.textContent = 'r = ' + cam.dist.toFixed(1) + ' r_s · θ = ' + cam.incl.toFixed(0) + '°';
    }

    // adaptif kalite (TEST 5): 60 FPS mümkün değilse örneklemeyi azalt
    if (state.adaptive && now - lastAdapt > 1200 && fps > 0) {
      lastAdapt = now;
      // Hedef 60 FPS: altına düşünce adımları kıs, üstüne çıkınca geri al
      if (fps < 50 && qualityLevel > 0.22) {
        qualityLevel = Math.max(0.22, qualityLevel - 0.18);
      } else if (fps > 58 && qualityLevel < 1.0) {
        qualityLevel = Math.min(1.0, qualityLevel + 0.06);
      }
    }
    // DİKKAT: burada requestAnimationFrame YOK — zinciri loop() yürütür.
  }

  // ---------------- UI BAĞLANTISI ----------------
  function bindSlider(id, key, fmt, cb) {
    const el = document.getElementById(id);
    const vEl = document.getElementById('v-' + (id === 'speed' ? 'speed' : id));
    const apply = () => {
      const v = parseFloat(el.value);
      state[key] = v;
      if (vEl) vEl.textContent = fmt ? fmt(v) : v.toFixed(2);
      if (cb) cb(v);
    };
    el.addEventListener('input', apply);
    apply();
  }

  bindSlider('mass', 'mass', v => v.toFixed(2), v => {
    document.getElementById('rs-val').textContent = v.toFixed(3);
    document.getElementById('rph-val').textContent = (1.5 * v).toFixed(3);
    document.getElementById('isco-val').textContent = (3 * v).toFixed(3);
  });
  bindSlider('dist', 'dist', v => v.toFixed(1), v => camTarget.dist = v);
  bindSlider('incl', 'incl', v => v.toFixed(0), v => camTarget.incl = v);
  bindSlider('fov', 'fov', v => v.toFixed(0), v => camTarget.fov = v);
  bindSlider('inner', 'inner', v => v.toFixed(2));
  bindSlider('outer', 'outer', v => v.toFixed(1));
  bindSlider('temp', 'temp', v => v.toFixed(2));
  bindSlider('spin', 'spin', v => v.toFixed(2));
  bindSlider('turb', 'turb', v => v.toFixed(2));
  bindSlider('steps', 'steps', v => v.toFixed(0));
  bindSlider('scale', 'renderScale', v => v.toFixed(2), () => resize(devicePixelRatio));
  bindSlider('bloom', 'bloom', v => v.toFixed(2));
  bindSlider('exposure', 'exposure', v => v.toFixed(2));
  bindSlider('speed', 'speed', v => v.toFixed(2));

  document.getElementById('doppler').addEventListener('change', e => state.doppler = e.target.checked);
  document.getElementById('adaptive').addEventListener('change', e => { state.adaptive = e.target.checked; });
  document.getElementById('lensing-on').addEventListener('change', e => state.lensing = e.target.checked);
  document.getElementById('radii-on').addEventListener('change', e => state.radii = e.target.checked);

  // mod düğmeleri
  const bsci = document.getElementById('mode-sci');
  const bcin = document.getElementById('mode-cin');
  function setMode(m) {
    state.mode = m;
    bsci.classList.toggle('on', m === 0);
    bcin.classList.toggle('on', m === 1);
    hudMode.textContent = m === 0 ? 'BİLİMSEL MOD' : 'SİNEMATİK MOD';
    // sinematik mod yalnız sunum parametrelerini değiştirir (geometri aynı)
    const bloomEl = document.getElementById('bloom');
    state.bloom = m === 0 ? 0.7 : 1.35;
    bloomEl.value = state.bloom;
    document.getElementById('v-bloom').textContent = state.bloom.toFixed(2);
    state.exposure = m === 0 ? 0.95 : 1.25;
    document.getElementById('exposure').value = state.exposure;
    document.getElementById('v-exposure').textContent = state.exposure.toFixed(2);
  }
  bsci.addEventListener('click', () => setMode(0));
  bcin.addEventListener('click', () => setMode(1));

  // kamera konumları
  const presets = {
    far: { dist: 26, incl: 14, fov: 52 },
    orbit: { dist: 9.5, incl: 4, fov: 62 },
    horizon: { dist: 3.0, incl: 2, fov: 86 }
  };
  function goPreset(p, name) {
    tour.active = false;
    document.getElementById('cam-tour').classList.remove('on');
    document.getElementById('tour2').classList.remove('on');
    camTarget.dist = p.dist;
    camTarget.incl = p.incl;
    camTarget.fov = p.fov;
    document.getElementById('dist').value = p.dist;
    document.getElementById('v-dist').textContent = p.dist.toFixed(1);
    document.getElementById('incl').value = p.incl;
    document.getElementById('v-incl').textContent = p.incl.toFixed(0);
    document.getElementById('fov').value = p.fov;
    document.getElementById('v-fov').textContent = p.fov.toFixed(0);
    state.dist = cam.dist; // hedefe yumuşak geçiş
    if (name) hudCam.textContent = name;
  }
  document.getElementById('cam-far').addEventListener('click', () => goPreset(presets.far, 'UZAK GÖZLEMCİ'));
  document.getElementById('cam-orbit').addEventListener('click', () => goPreset(presets.orbit, 'DİSK YÖRÜNGESİ'));
  document.getElementById('cam-horizon').addEventListener('click', () => goPreset(presets.horizon, 'OLAY UFKUNA YAKLAŞMA'));
  document.getElementById('cam-reset').addEventListener('click', () => goPreset(presets.far, 'UZAK GÖZLEMCİ'));

  // sinematik tur
  const tour = { active: false, t: 0, start: null };
  function toggleTour() {
    tour.active = !tour.active;
    document.getElementById('cam-tour').classList.toggle('on', tour.active);
    document.getElementById('tour2').classList.toggle('on', tour.active);
    if (tour.active) {
      tour.t = 0;
      tour.start = { dist: cam.dist, incl: cam.incl, azim: cam.azim };
    }
  }
  document.getElementById('cam-tour').addEventListener('click', toggleTour);
  document.getElementById('tour2').addEventListener('click', toggleTour);

  // duraklat
  const pauseBtn = document.getElementById('pause');
  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'DEVAM ET' : 'DURAKLAT';
    pauseBtn.classList.toggle('on', state.paused);
  });

  // panel katlama
  document.getElementById('toggle-panel').addEventListener('click', () => {
    const p = document.getElementById('panel');
    p.classList.toggle('hide');
    document.getElementById('toggle-panel').textContent = p.classList.contains('hide') ? '›' : '‹';
  });
  document.querySelectorAll('.sec h3').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('closed'));
  });

  // ---------------- FARE / DOKUNMA ----------------
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, incl: camTarget.incl, azim: camTarget.azim, shift: e.shiftKey };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.shift) {
      camTarget.incl = Math.max(-89, Math.min(89, drag.incl - dy * 0.25));
      document.getElementById('incl').value = camTarget.incl;
      document.getElementById('v-incl').textContent = camTarget.incl.toFixed(0);
    } else {
      camTarget.azim = drag.azim - dx * 0.005;
      if (tour.active) { tour.active = false; document.getElementById('cam-tour').classList.remove('on'); document.getElementById('tour2').classList.remove('on'); }
    }
  });
  canvas.addEventListener('pointerup', e => { drag = null; try { canvas.releasePointerCapture(e.pointerId); } catch (err) { } });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    camTarget.dist = Math.max(2.2, Math.min(60, camTarget.dist * (1 + Math.sign(e.deltaY) * 0.08)));
    document.getElementById('dist').value = camTarget.dist;
    document.getElementById('v-dist').textContent = camTarget.dist.toFixed(1);
    if (tour.active) { tour.active = false; document.getElementById('cam-tour').classList.remove('on'); document.getElementById('tour2').classList.remove('on'); }
  }, { passive: false });

  // ---------------- SİNEMATİK TUR GÜNCELLEME ----------------
  const tourFrames = [
    { dist: 26, incl: 14, fov: 52 },
    { dist: 12, incl: 6, fov: 58 },
    { dist: 7, incl: 42, fov: 66 },
    { dist: 4, incl: -8, fov: 80 },
    { dist: 18, incl: 22, fov: 54 }
  ];
  let tourIdx = 0;

  function updateTour(dt) {
    if (!tour.active) return;
    tour.t += dt;
    camTarget.azim += dt * 0.12;
    if (tour.t > 5.0) {
      tour.t = 0;
      tourIdx = (tourIdx + 1) % tourFrames.length;
      const f = tourFrames[tourIdx];
      camTarget.dist = f.dist; camTarget.incl = f.incl; camTarget.fov = f.fov;
      document.getElementById('dist').value = f.dist;
      document.getElementById('v-dist').textContent = f.dist.toFixed(1);
      document.getElementById('incl').value = f.incl;
      document.getElementById('v-incl').textContent = f.incl.toFixed(0);
      document.getElementById('fov').value = f.fov;
      document.getElementById('v-fov').textContent = f.fov.toFixed(0);
    }
  }

  // Ana animasyon zinciri: loop() → tur güncellemesi + frame().
  // frame() KENDİ İÇİNDE requestAnimationFrame ÇAĞIRMAZ; zinciri loop() yürütür
  // (çift zincir = çift simülasyon hızı olurdu).
  function loop(now) {
    const dtReal = Math.min(0.1, (now - lastT) / 1000);
    updateTour(dtReal);
    frame(now);
    if (!window.__stopLoop) requestAnimationFrame(loop);
  }

  // ---------------- BAŞLAT ----------------
  function start() {
    // Hata olsa bile perde kalksın; hata varsa ekranda görünsün
    window.addEventListener('error', ev => {
      fail('ÇALIŞMA HATASI', (ev.message || '') + '\n' + (ev.filename || '') + ':' + (ev.lineno || ''));
    });
    resize(devicePixelRatio || 1);
    window.addEventListener('resize', () => resize(devicePixelRatio || 1));
    // yöntem metni
    document.getElementById('method-text').innerHTML =
      '<b>Model:</b> Dönmeyen (Schwarzschild) kara delik. Işınlar kameradan geriye izlenir.<br><br>' +
      '<b>Yörünge denklemi:</b> u″ = −u + 1.5·r<sub>s</sub>·u², u = 1/r. RK4 ile değişken adımda (Δφ ≈ 0.0015–0.06) integre edilir.<br><br>' +
      '<b>Olay ufku:</b> u ≥ 1/r<sub>s</sub> bölgesine giren ışın yutulur → siyah piksel.<br>' +
      '<b>Foton küresi:</b> r<sub>ph</sub> = 1.5 r<sub>s</sub>; görüntüdeki foton halkası bu küreye teğet geçen ışınlardan doğar — ikisi aynı şey değildir.<br><br>' +
      '<b>Disk:</b> ışının y=0 düzlemiyle kesişimi üzerinden örneklenir (halka geometrisi değil). T(r) ∝ r<sup>−3/4</sup>(1−√(r<sub>in</sub>/r))<sup>1/4</sup>.<br><br>' +
      '<b>Yaklaşımlar:</b> (1) Doppler/beaming faktörü basitleştirilmiş Kepler hızıyla (β = √(r<sub>s</sub>/2r)) uygulanır — tam relativistik ışın izleme değildir; (2) disk ince ve geometrik olarak opaktır, yükseklik yoktur; (3) ışık yolu sonlu adımda integre edilir (sayısal hata ~10⁻³ mertebesinde); (4) kara delik dönmüyor (spin a = 0).';
    lastT = performance.now();
    // ?norender=1 → tek kare bile çizmeden dur (performans teşhisi)
    if (!new URLSearchParams(location.search).has('norender')) {
      requestAnimationFrame(loop);
    }
  }

  // Perdeyi kaldırmayı GARANTİ et: hata olsa bile sahne/arayüz görünsün.
  overlay.classList.add('gone');
  try {
    start();
  } catch (e) {
    fail('BAŞLATMA HATASI', (e && e.stack) ? e.stack : String(e));
  }
})();
