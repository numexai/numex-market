/* NEXUS — Parçacık Akışı
   Canvas 2D üzerinde 6000'e kadar parçacıklı akış alanı simülasyonu.
   Fare/dokunma girdisi + Web Audio mikrofon analizi ile canlı etkileşim. */
(function () {
  "use strict";

  var canvas = document.getElementById("stage");
  var ctx = canvas.getContext("2d", { alpha: false });

  var elFps = document.getElementById("fps");
  var elCount = document.getElementById("pcount");
  var elEnergy = document.getElementById("energy");
  var elHint = document.getElementById("hint");

  var rDensity = document.getElementById("density");
  var rSpeed = document.getElementById("speed");
  var rTrail = document.getElementById("trail");
  var rHue = document.getElementById("hue");

  var audioBtn = document.getElementById("audioBtn");
  var audioLabel = document.getElementById("audioLabel");
  var colorBtn = document.getElementById("colorBtn");
  var resetBtn = document.getElementById("resetBtn");

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  // ---- Ayarlar ----
  var cfg = {
    mode: "flow",
    speed: 1.2,
    trail: 0.22,
    hue: 190,
    autoColor: false,
    audio: false
  };

  // ---- Parçacıklar (struct of arrays yerine dizi nesnesi; okunabilirlik) ----
  var MAX = 6000;
  var particles = [];
  var count = 2600;
  var nextFree = 0;

  function Particle() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 100;
    this.maxLife = 100;
    this.size = 1.2;
    this.seed = Math.random();
    this.hOff = Math.random();
    this.orbitA = Math.random() * Math.PI * 2;
    this.orbitR = 0;
  }

  function initParticles() {
    particles = new Array(MAX);
    for (var i = 0; i < MAX; i++) particles[i] = new Particle();
    for (var j = 0; j < MAX; j++) spawn(particles[j], true);
    nextFree = 0;
  }

  function spawn(p, anywhere) {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = (Math.random() - 0.5) * 0.4;
    p.maxLife = 60 + Math.random() * 160;
    p.life = anywhere ? Math.random() * p.maxLife : p.maxLife;
    p.size = 0.7 + Math.random() * 1.9;
    p.seed = Math.random();
    p.hOff = Math.random();
    p.orbitA = Math.random() * Math.PI * 2;
    p.orbitR = 40 + Math.random() * Math.min(W, H) * 0.45;
    return p;
  }

  // Breathing flow field: sürekli dönen, tıkanmayan bir hız alanı.
  var t = 0;
  function noiseAngle(x, y, time) {
    var s = 0.0022;
    var a = Math.sin(x * s + time * 0.35) * Math.cos(y * s * 1.3 - time * 0.22);
    var b = Math.cos(y * s * 0.9 + time * 0.29) * Math.sin(x * s * 1.7 + time * 0.17);
    return (a + b) * Math.PI;
  }

  // ---- Girdi ----
  var pointer = { x: -9999, y: -9999, down: false, active: false, px: 0, py: 0, vx: 0, vy: 0 };

  function setPointer(cx, cy) {
    var r = canvas.getBoundingClientRect();
    var nx = (cx - r.left);
    var ny = (cy - r.top);
    pointer.vx = nx - pointer.px;
    pointer.vy = ny - pointer.py;
    pointer.px = nx; pointer.py = ny;
    pointer.x = nx; pointer.y = ny;
    pointer.active = true;
    elHint.classList.add("hide");
  }

  canvas.addEventListener("mousemove", function (e) { setPointer(e.clientX, e.clientY); }, { passive: true });
  canvas.addEventListener("mouseleave", function () { pointer.active = false; pointer.x = -9999; pointer.y = -9999; });
  canvas.addEventListener("mousedown", function (e) {
    pointer.down = true;
    setPointer(e.clientX, e.clientY);
    burst(pointer.x, pointer.y, 160, 5.5);
  });
  window.addEventListener("mouseup", function () { pointer.down = false; });

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    var tt = e.touches;
    for (var i = 0; i < tt.length; i++) {
      pointer.down = true;
      setPointer(tt[i].clientX, tt[i].clientY);
      burst(pointer.x, pointer.y, 110, 4.5);
    }
  }, { passive: false });
  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    for (var i = 0; i < e.touches.length; i++) setPointer(e.touches[i].clientX, e.touches[i].clientY);
  }, { passive: false });
  canvas.addEventListener("touchend", function (e) {
    if (!e.touches || e.touches.length === 0) { pointer.down = false; pointer.active = false; }
  }, { passive: true });

  // Patlama: pointer çevresine dışa savrulan parçacık enjekte et.
  function burst(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var p = particles[nextFree];
      nextFree = (nextFree + 1) % count;
      var a = Math.random() * Math.PI * 2;
      var sp = Math.random() * power;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.maxLife = 80 + Math.random() * 140;
      p.life = p.maxLife;
      p.size = 0.9 + Math.random() * 2.2;
      p.hOff = Math.random();
      p.orbitA = a;
    }
  }

  // ---- Ses analizi ----
  var audioCtx = null, analyser = null, freqData = null, micStream = null;
  var audioLevel = 0, bassLevel = 0;

  function startAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { audioLabel.textContent = "Ses API desteklenmiyor"; return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      audioLabel.textContent = "Mikrofon erişimi yok";
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      micStream = stream;
      audioCtx = new AC();
      var src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      freqData = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      cfg.audio = true;
      audioBtn.classList.add("live");
      audioLabel.textContent = "Ses Modu AKTİF";
    }).catch(function () {
      cfg.audio = false;
      audioLabel.textContent = "Mikrofon izni verilmedi";
      setTimeout(function () { audioLabel.textContent = "Mikrofon ile Ses Modu"; }, 2600);
    });
  }

  function stopAudio() {
    cfg.audio = false;
    audioLevel = 0; bassLevel = 0;
    if (micStream) { var tr = micStream.getTracks(); for (var i = 0; i < tr.length; i++) tr[i].stop(); micStream = null; }
    if (audioCtx && audioCtx.state !== "closed") { audioCtx.close(); }
    audioCtx = null; analyser = null;
    audioBtn.classList.remove("live");
    audioLabel.textContent = "Mikrofon ile Ses Modu";
  }

  audioBtn.addEventListener("click", function () {
    if (cfg.audio) stopAudio(); else startAudio();
  });

  function readAudio() {
    if (!analyser) return;
    analyser.getByteFrequencyData(freqData);
    var i, sum = 0, bass = 0;
    for (i = 0; i < freqData.length; i++) sum += freqData[i];
    for (i = 2; i < 24; i++) bass += freqData[i];
    audioLevel = sum / (freqData.length * 255);
    bassLevel = bass / (22 * 255);
  }

  // ---- Kontroller ----
  function bindRange(el, key, scale) {
    el.addEventListener("input", function () {
      cfg[key] = parseFloat(el.value) * (scale || 1);
      if (key === "trail") { /* iz değeri doğrudan kullanılır */ }
      if (key === "hue") applyHueVars();
    });
  }
  bindRange(rSpeed, "speed", 0.01);
  bindRange(rTrail, "trail", 0.01);
  bindRange(rHue, "hue", 1);

  rDensity.addEventListener("input", function () {
    count = parseInt(rDensity.value, 10);
    elCount.textContent = count;
  });

  var modeBtns = document.querySelectorAll(".mode");
  Array.prototype.forEach.call(modeBtns, function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(modeBtns, function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      cfg.mode = b.getAttribute("data-mode");
      if (cfg.mode === "explode") burst(W / 2, H / 2, 700, 9);
      if (cfg.mode === "orbit") {
        for (var i = 0; i < count; i++) {
          var p = particles[i];
          p.orbitA = Math.random() * Math.PI * 2;
          p.orbitR = 40 + Math.random() * Math.min(W, H) * 0.45;
        }
      }
    });
  });

  colorBtn.addEventListener("click", function () {
    cfg.autoColor = !cfg.autoColor;
    colorBtn.style.borderColor = cfg.autoColor ? "rgba(53,208,255,.9)" : "";
    colorBtn.style.color = cfg.autoColor ? "#35d0ff" : "";
  });

  resetBtn.addEventListener("click", function () {
    for (var i = 0; i < MAX; i++) spawn(particles[i], true);
    burst(W / 2, H / 2, 900, 8);
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "1") clickMode(0);
    else if (e.key === "2") clickMode(1);
    else if (e.key === "3") clickMode(2);
    else if (e.key === "4") clickMode(3);
    else if (e.code === "Space") { e.preventDefault(); burst(W / 2, H / 2, 800, 9); }
  });
  function clickMode(i) { if (modeBtns[i]) modeBtns[i].click(); }

  function applyHueVars() {
    var h = cfg.hue;
    document.documentElement.style.setProperty("--accent", "hsl(" + h + ",100%,60%)");
    document.documentElement.style.setProperty("--accent2", "hsl(" + ((h + 70) % 360) + ",95%,62%)");
  }

  // ---- Boyutlandırma ----
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  // ---- Ana döngü ----
  var lastTime = performance.now();
  var fpsAccum = 0, fpsFrames = 0, fpsTimer = 0;
  var uiTimer = 0;
  var autoHue = 0;

  function frame(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    t += dt;

    if (cfg.audio) { readAudio(); } else { audioLevel *= 0.94; bassLevel *= 0.94; }
    if (cfg.autoColor) { autoHue = (autoHue + dt * 26) % 360; cfg.hue = autoHue; rHue.value = Math.floor(autoHue); applyHueVars(); }

    var speed = cfg.speed * (1 + audioLevel * 3.2);
    var h = cfg.hue;

    // İz efekti: yarı saydam koyu perde
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(5,6,12," + Math.max(0.02, Math.min(0.9, cfg.trail)) + ")";
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";

    var n = Math.min(count, MAX);
    var cx = W * 0.5, cy = H * 0.5;
    var glow = pointer.down ? 1.9 : 1;

    for (var i = 0; i < n; i++) {
      var p = particles[i];
      var ax, ay;

      if (cfg.mode === "flow") {
        var a = noiseAngle(p.x, p.y, t);
        ax = Math.cos(a); ay = Math.sin(a);
      } else if (cfg.mode === "vortex") {
        var dx = p.x - cx, dy = p.y - cy;
        var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        ax = -dy / d - dx / d * 0.28;
        ay = dx / d - dy / d * 0.28;
      } else if (cfg.mode === "explode") {
        var ex = p.x - cx, ey = p.y - cy;
        var ed = Math.sqrt(ex * ex + ey * ey) + 0.001;
        ax = ex / ed * 0.6; ay = ey / ed * 0.6;
      } else { // orbit
        var ox = p.x - cx, oy = p.y - cy;
        var od = Math.sqrt(ox * ox + oy * oy) + 0.001;
        ax = -oy / od; ay = ox / od;
        var pull = (p.orbitR - od) / Math.max(p.orbitR, 60);
        ax += ox / od * pull * 1.5; ay += oy / od * pull * 1.5;
      }

      // Fare/dokunma çekimi (basılıyken itim)
      if (pointer.active) {
        var px = p.x - pointer.x, py = p.y - pointer.y;
        var pd2 = px * px + py * py;
        var R = 220;
        if (pd2 < R * R) {
          var pd = Math.sqrt(pd2) + 0.001;
          var f = (1 - pd / R);
          var dir = pointer.down ? -1 : 1;
          ax += (px / pd) * f * dir * 3.0;
          ay += (py / pd) * f * dir * 3.0;
          ax += pointer.vx * 0.05 * f;
          ay += pointer.vy * 0.05 * f;
        }
      }

      // Ses enerjisi: parçacıkları dışa savur + hızlandır
      if (bassLevel > 0.05) {
        var sx = p.x - cx, sy = p.y - cy;
        var sd = Math.sqrt(sx * sx + sy * sy) + 0.001;
        ax += sx / sd * bassLevel * 2.4;
        ay += sy / sd * bassLevel * 2.4;
      }

      p.vx += ax * speed * 60 * dt;
      p.vy += ay * speed * 60 * dt;

      // Sürtünme
      var fr = Math.pow(0.94, dt * 60);
      p.vx *= fr; p.vy *= fr;

      p.x += p.vx * speed * 60 * dt * 0.9;
      p.y += p.vy * speed * 60 * dt * 0.9;

      // Sarma (ekran dışına çıkınca karşıdan gir)
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;

      p.life -= dt * 26;
      if (p.life <= 0) {
        // Yaşam döngüsü: eski parçacıklar merkez dışına yeniden doğar
        var ra = Math.random() * Math.PI * 2;
        var rr = Math.random() * Math.max(W, H) * 0.55;
        p.x = cx + Math.cos(ra) * rr;
        p.y = cy + Math.sin(ra) * rr;
        p.vx = 0; p.vy = 0;
        p.maxLife = 60 + Math.random() * 160;
        p.life = p.maxLife;
        p.size = 0.7 + Math.random() * 1.9;
        p.hOff = Math.random();
        p.orbitR = 40 + Math.random() * Math.min(W, H) * 0.45;
      }

      // Çizim
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var lifeK = p.life / p.maxLife;
      var alpha = 0.12 + lifeK * 0.72;
      var sz = p.size * (1 + Math.min(spd, 6) * 0.3) * glow;
      var hue = (h + p.hOff * 90 + spd * 16) % 360;

      // Hız çizgisi (motion trail)
      var tail = Math.min(spd * 2.4, 16);
      if (tail > 1.2) {
        ctx.strokeStyle = "hsla(" + hue + ",100%," + (55 + lifeK * 20) + "%," + alpha * 0.55 + ")";
        ctx.lineWidth = Math.max(0.5, sz * 0.7);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * tail * 0.12, p.y - p.vy * tail * 0.12);
        ctx.stroke();
      }

      ctx.fillStyle = "hsla(" + hue + ",100%," + (62 + lifeK * 18) + "%," + alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 0.55, 0, 6.2832);
      ctx.fill();
    }

    // Pointer halo
    if (pointer.active) {
      var grd = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
      var ph = (h + 40) % 360;
      grd.addColorStop(0, "hsla(" + ph + ",100%,70%," + (pointer.down ? 0.30 : 0.14) + ")");
      grd.addColorStop(1, "hsla(" + ph + ",100%,50%,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 190, 0, 6.2832);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    // ---- UI güncelle (kare başına değil, ~5/s) ----
    fpsAccum += dt; fpsFrames++; fpsTimer += dt; uiTimer += dt;
    if (fpsTimer >= 0.5) {
      elFps.textContent = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0; fpsFrames = 0; fpsTimer = 0;
    }
    if (uiTimer >= 0.15) {
      uiTimer = 0;
      var e = Math.round((audioLevel * 62 + 4) + Math.min(60, energyFromMotion()));
      elEnergy.textContent = e;
    }

    requestAnimationFrame(frame);
  }

  var _lastEnergy = 0;
  function energyFromMotion() {
    // Ortalama hızın kaba bir ölçüsü — her 10. parçacığı örnekle
    var s = 0, c = 0;
    var n = Math.min(count, MAX);
    for (var i = 0; i < n; i += 10) {
      var p = particles[i];
      s += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      c++;
    }
    _lastEnergy = c ? (s / c) * 6 : 0;
    return _lastEnergy;
  }

  // ---- Başlat ----
  resize();
  initParticles();
  elCount.textContent = count;
  applyHueVars();
  requestAnimationFrame(function (ts) { lastTime = ts; frame(ts); });

  // 6 saniye sonra ipucu kendiliğinden kaybolur
  setTimeout(function () { elHint.classList.add("hide"); }, 6000);
})();
