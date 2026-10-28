/* =========================================================
   NUMEX AI — Neural Network Core Visualizer
   Canlı sinir ağı animasyonu + içinden akan NUMEX token akışı
   Saf Canvas — harici bağımlılık yok.
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Konfigürasyon ---------- */
  const CONFIG = {
    // Katman mimarisi (nöron sayıları)
    layers: [6, 14, 20, 16, 10, 7, 4, 2, 1],
    tokenText: "NUMEX",
    tokenSpawn: 1.7,          // sn'de üretilecek token sayısı
    activationSpeed: 0.9,     // aktivasyon yayılım hızı
    colorHot:  [0, 226, 255], // camgöbeği — aktivasyon
    colorCool: [88, 101, 242],// indigo — ağırlıklar
    colorText: [255, 220, 90] // amber — NUMEX akışı
  };

  /* ---------- DOM Bağlantıları ---------- */
  const netCanvas = document.getElementById("net");
  const chartCanvas = document.getElementById("lossChart");
  const ctx = netCanvas.getContext("2d");
  const cctx = chartCanvas.getContext("2d");
  const epochEl = document.getElementById("epoch");
  const ppsEl = document.getElementById("pps");
  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeLabel = document.getElementById("gaugeLabel");

  /* ---------- Durum ---------- */
  let W = 0, H = 0;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let nodePositions = [];      // her katman için nöron pozisyonları
  let tokenParticles = [];     // NUMEX harfleri
  let pulseEvents = [];        // sinir darbeleri
  let connectionCache = [];    // ön hesaplanmış bağlantı puanları
  let epoch = 0;
  let lastSpawn = 0;
  let trainProgress = 0;
  let chartData = new Array(52).fill(1.0);

  const LETTERS = CONFIG.tokenText.split("");
  const FONT_BASIS = 16;

  /* ---------- Sayı yardımcıları ---------- */
  const rnd  = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Boyutlandırma ---------- */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    netCanvas.width = W * DPR;
    netCanvas.height = H * DPR;
    netCanvas.style.width = W + "px";
    netCanvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNodes();
  }

  /* ---------- Nöron yerleşimi ---------- */
  function buildNodes() {
    nodePositions = [];
    const marginX = W * 0.12;
    const usableW = W - marginX * 2;
    const usableH = H * 0.72;
    const topY = H * 0.18;
    const gapX = usableW / (CONFIG.layers.length - 1);

    CONFIG.layers.forEach((count, li) => {
      const col = [];
      const x = marginX + gapX * li;
      // Katman yüksekliği nöron sayısıyla orantılı (görsel coşku)
      const maxH = Math.max(...CONFIG.layers.slice(-3));
      const span = Math.max(usableH * (count / maxH), 40);
      for (let ni = 0; ni < count; ni++) {
        const t = count === 1 ? 0.5 : ni / (count - 1);
        const y = topY + span / 2 + (t - 0.5) * span * 1.2 + rnd(-3, 3);
        // Her nöronun kendine has "canlılık" fazı
        col.push({
          x, y,
          radius: count <= 2 ? 5 : count <= 6 ? 4 : 3.5,
          seed: Math.random() * Math.PI * 2,
          weight: rnd(-1, 1)
        });
      }
      nodePositions.push(col);
    });

    // Bağlantı önbelleği
    connectionCache = [];
    for (let li = 0; li < nodePositions.length - 1; li++) {
      const left = nodePositions[li];
      const right = nodePositions[li + 1];
      for (const a of left) {
        for (const b of right) {
          connectionCache.push({
            ax: a.x, ay: a.y, bx: b.x, by: b.y,
            l: li,
            w: Math.random() * 2 - 1
          });
        }
      }
    }
  }

  /* ---------- NUMEX token parçacığı oluştur ---
     Bir nöronun üstünden süzülüp komşu katmana akar. */
  function spawnToken() {
    const li = Math.floor(Math.random() * (nodePositions.length - 2));
    const col = nodePositions[li];
    if (!col || !col.length) return;
    const n = col[Math.floor(Math.random() * col.length)];
    const target = nodePositions[li + 1][Math.floor(Math.random() * nodePositions[li + 1].length)];

    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    tokenParticles.push({
      x: n.x, y: n.y,
      tx: target.x, ty: target.y,
      t: 0,
      speed: rnd(1.2, 2.2),       // akış hızı
      letter,
      size: rnd(FONT_BASIS * 0.7, FONT_BASIS * 1.1),
      phase: Math.random() * Math.PI * 2,
      life: 1
    });
    pushPulse(n.x, n.y, 0.7);
  }

  function pushPulse(x, y, r) {
    pulseEvents.push({ x, y, r, a: 1, t: 0 });
  }

  /* ---------- Aktivasyon darbesi ---------- */
  function spawnActivation() {
    const li = Math.floor(Math.random() * nodePositions.length);
    const col = nodePositions[li];
    if (!col || !col.length) return;
    const n = col[Math.floor(Math.random() * col.length)];
    pushPulse(n.x, n.y, 1.6);
  }

  /* ---------- Ana döngü ---------- */
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Epoch simülasyonu
    epoch += dt * 24;
    epochEl.textContent = String(Math.floor(epoch)).padStart(4, "0");
    const pps = Math.floor(rnd(18, 44) * 1000);
    ppsEl.textContent = (pps / 1000).toFixed(1) + "K";

    trainProgress = Math.min(1, trainProgress + dt * 0.012);
    gaugeFill.style.width = (trainProgress * 100).toFixed(1) + "%";
    gaugeLabel.textContent =
      trainProgress >= 1 ? "Training complete ✓" : "Optimizing weights " + (trainProgress * 100).toFixed(1) + "%";

    // Token üretimi
    lastSpawn += dt;
    while (lastSpawn > 1 / CONFIG.tokenSpawn) {
      lastSpawn -= 1 / CONFIG.tokenSpawn;
      spawnToken();
      spawnActivation();
    }

    // Böcekleyici — aşırı birikmeyi önle
    if (tokenParticles.length > 340) tokenParticles.splice(0, tokenParticles.length - 340);

    updateTokens(dt);
    updatePulses(dt);
    updateChart(dt);
    draw();

    requestAnimationFrame(loop);
  }

  /* ---------- Token güncelleme ---------- */
  function updateTokens(dt) {
    for (let i = tokenParticles.length - 1; i >= 0; i--) {
      const p = tokenParticles[i];
      p.t += dt * p.speed;
      // Bezier kavsi veren ara nokta (hafif bombe)
      const mx = (p.x + p.tx) / 2;
      const my = Math.min(p.y, p.ty) - rnd(8, 22);
      p.cx = mx;
      p.cy = my;
      if (p.t >= 1) {
        pushPulse(p.tx, p.ty, 1.1);
        tokenParticles.splice(i, 1);
      }
    }
  }

  function updatePulses(dt) {
    for (let i = pulseEvents.length - 1; i >= 0; i--) {
      const e = pulseEvents[i];
      e.t += dt * 1.6;
      e.r += dt * 24;
      e.a = Math.max(0, 1 - e.t);
      if (e.a <= 0) pulseEvents.splice(i, 1);
    }
  }

  function updateChart(dt) {
    // Kayıp eğrisi monoton azalan + gürültü
    const cur = chartData[chartData.length - 1];
    const next = Math.max(0.08, cur - dt * 0.06 + rnd(-0.03, 0.03));
    chartData.push(clamp(next, 0.08, 1));
    chartData.shift();
  }

  /* ---------- Çizim ---------- */
  function lerpColor(c1, c2, t) {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ];
  }

  function rgba(c, a) {
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  function draw() {
    // — Arka plan degrade
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#05060f");
    bg.addColorStop(0.5, "#070a1a");
    bg.addColorStop(1, "#04050c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // — İnce grid
    ctx.strokeStyle = "rgba(88,101,242,0.05)";
    ctx.lineWidth = 1;
    const gs = 54;
    ctx.beginPath();
    for (let x = 0; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // — Bağlantılar (renk=ağırlık)
    for (const c of connectionCache) {
      const alpha = 0.05 + Math.abs(c.w) * 0.16;
      const col = c.w > 0 ? CONFIG.colorHot : CONFIG.colorCool;
      ctx.strokeStyle = rgba(col, alpha);
      ctx.lineWidth = Math.abs(c.w) * 1.6;
      ctx.beginPath();
      ctx.moveTo(c.ax, c.ay);
      ctx.lineTo(c.bx, c.by);
      ctx.stroke();
    }

    // — Nöronlar (parlama)
    nodePositions.forEach((col) => {
      for (const n of col) {
        const pulse = (Math.sin(now_t() * 1.2 + n.seed) + 1) / 2;
        const base = n.weight > 0 ? CONFIG.colorHot : CONFIG.colorCool;
        const hitC = lerpColor(base, [255,255,255], pulse * 0.4);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 4);
        g.addColorStop(0, rgba(hitC, 0.35 + pulse * 0.3));
        g.addColorStop(1, rgba(hitC, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rgba(base, 0.5 + pulse * 0.5);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rgba(hitC, 0.8);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // — Token akışı (NUMEX) ve aktivasyon darbeleri
    drawPulses();
    drawTokens();

    // — Alt grafik çizimi
    drawChart();
  }

  let _t = 0;
  function now_t() { return _t; } // loop içinde _t güncellenir

  function drawPulses() {
    for (const e of pulseEvents) {
      const col = lerpColor(CONFIG.colorHot, [255,255,255], e.a);
      ctx.strokeStyle = rgba(col, e.a * 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, rgba(col, e.a * 0.4));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTokens() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of tokenParticles) {
      // Bezier ara nokta
      const tt = p.t;
      const bx = (1 - tt) * (1 - tt) * p.x + 2 * (1 - tt) * tt * p.cx + tt * tt * p.tx;
      const by = (1 - tt) * (1 - tt) * p.y + 2 * (1 - tt) * tt * p.cy + tt * tt * p.ty;

      const fade = Math.sin(tt * Math.PI); // başta-sonda silik, ortada parlak
      // Harfin arkasına hafif glow
      ctx.shadowBlur = 14;
      ctx.shadowColor = rgba(CONFIG.colorText, 0.9);
      ctx.fillStyle = rgba(CONFIG.colorText, 0.35 + fade * 0.65);
      ctx.font = `700 ${p.size}px 'Segoe UI', system-ui, sans-serif`;
      ctx.fillText(p.letter, bx, by);
      ctx.shadowBlur = 0;

      // İz bırakma (çizgi)
      ctx.strokeStyle = rgba(CONFIG.colorText, fade * 0.18);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  function drawChart() {
    cctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    cctx.strokeStyle = "rgba(255,255,255,0.06)";
    cctx.lineWidth = 1;
    for (let i = 0; i <= 2; i++) {
      const y = (chartCanvas.height / 2) * i;
      cctx.beginPath();
      cctx.moveTo(0, y);
      cctx.lineTo(chartCanvas.width, y);
      cctx.stroke();
    }
    cctx.beginPath();
    chartData.forEach((v, i) => {
      const x = (i / (chartData.length - 1)) * chartCanvas.width;
      const y = (1 - v) * chartCanvas.height;
      i === 0 ? cctx.moveTo(x, y) : cctx.lineTo(x, y);
    });
    cctx.strokeStyle = rgba(CONFIG.colorHot, 0.9);
    cctx.lineWidth = 2;
    cctx.stroke();
  }

  /* ---------- Başlangıç ---------- */
  window.addEventListener("resize", resize);
  resize();

  // Gerçek zaman _t güncellemesi için loop'a entegre
  const _origLoop = loop;
  function finalLoop(now) {
    _t = now / 1000;
    _origLoop(now);
  }
  requestAnimationFrame(finalLoop);
})();
