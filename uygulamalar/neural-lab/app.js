/* Neural Lab — gerçek bir MLP'nin forward pass + backpropagation ile eğitimi.
   Saf JS, bağımlılık yok. Öğrenme tamamen istemci tarafında çalışır. */
(function () {
  "use strict";

  // ---------------- Yardımcılar ----------------
  function randn() { // Box-Muller
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // ---------------- Aktif fonksiyonlar ----------------
  // Her biri: f(x), türev f'(x) (çıktıya değil, girdi x'e göre)
  var ACT = {
    sigmoid: {
      f: function (x) { return 1 / (1 + Math.exp(-clamp(x, -40, 40))); },
      df: function (x) { var s = ACT.sigmoid.f(x); return s * (1 - s); }
    },
    tanh: {
      f: function (x) { return Math.tanh(x); },
      df: function (x) { var t = Math.tanh(x); return 1 - t * t; }
    },
    relu: {
      f: function (x) { return x > 0 ? x : 0; },
      df: function (x) { return x > 0 ? 1 : 0; }
    }
  };

  // ---------------- Veri Setleri ----------------
  // Her örnek: {x:[x1,x2], y:0|1}. Koordinatlar [-1,1] aralığında.
  var DATA = {
    xor: function (n) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var x1 = Math.random() * 2 - 1;
        var x2 = Math.random() * 2 - 1;
        // küçük gürültü: sınırda biraz karışıklık
        var g = (Math.random() - 0.5) * 0.12;
        var y = ((x1 * x2) + g) >= 0 ? 1 : 0;
        pts.push({ x: [x1, x2], y: y });
      }
      return pts;
    },
    circle: function (n) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var x1 = Math.random() * 2 - 1;
        var x2 = Math.random() * 2 - 1;
        var r = Math.sqrt(x1 * x1 + x2 * x2);
        var g = (Math.random() - 0.5) * 0.1;
        var y = (r + g) < 0.62 ? 1 : 0;
        pts.push({ x: [x1, x2], y: y });
      }
      return pts;
    },
    moons: function (n) {
      var pts = [], half = Math.floor(n / 2);
      for (var i = 0; i < half; i++) { // üst hilal
        var t = Math.PI * Math.random();
        var x1 = Math.cos(t) * 0.75;
        var x2 = Math.sin(t) * 0.75 - 0.15;
        pts.push({ x: [clamp(x1 + (Math.random() - 0.5) * 0.14, -1, 1),
                       clamp(x2 + (Math.random() - 0.5) * 0.14, -1, 1)], y: 0 });
      }
      for (var j = 0; j < n - half; j++) { // alt hilal (kaydırılmış)
        var t2 = Math.PI * Math.random();
        var y1 = Math.cos(t2) * 0.75 + 0.25;
        var y2 = Math.sin(t2) * 0.75 + 0.15;
        pts.push({ x: [clamp(y1 + (Math.random() - 0.5) * 0.14, -1, 1),
                       clamp(-y2 + (Math.random() - 0.5) * 0.14, -1, 1)], y: 1 });
      }
      return pts;
    }
  };

  // ---------------- Yapay Sinir Ağı (MLP) ----------------
  // Katman yapısı örn: [2, 8, 1] veya [2, 8, 8, 1]
  function MLP(sizes, actName, optName, lr) {
    this.sizes = sizes.slice();
    this.actName = actName;
    this.act = ACT[actName];
    this.opt = optName;
    this.lr = lr;
    this.W = []; // her katman için ağırlık matrisi [out][in]
    this.b = []; // bias vektörü [out]
    this.vW = []; this.vb = []; // momentum hızları
    this.init();
  }

  MLP.prototype.init = function () {
    this.W = []; this.b = []; this.vW = []; this.vb = [];
    for (var l = 0; l < this.sizes.length - 1; l++) {
      var nin = this.sizes[l], nout = this.sizes[l + 1];
      var Wl = [], bl = [], vwl = [], vbl = [];
      // He init (ReLU) / Xavier (diğerleri)
      var scale = this.actName === "relu" ? Math.sqrt(2 / nin) : Math.sqrt(1 / nin);
      for (var o = 0; o < nout; o++) {
        var row = [], vrow = [];
        for (var i = 0; i < nin; i++) { row.push(randn() * scale); vrow.push(0); }
        Wl.push(row); vwl.push(vrow);
        bl.push(0); vbl.push(0);
      }
      this.W.push(Wl); this.b.push(bl);
      this.vW.push(vwl); this.vb.push(vbl);
    }
  };

  // Forward pass: her katmanın z (ön-aktivasyon) ve a (aktivasyon) değerlerini saklar
  MLP.prototype.forward = function (x) {
    var acts = [x.slice()];     // a[0] = girdi
    var zs = [];                // z[l] = W[l]·a[l]+b
    var a = x;
    for (var l = 0; l < this.W.length; l++) {
      var W = this.W[l], b = this.b[l], nout = W.length;
      var z = new Array(nout), out = new Array(nout);
      var isLast = (l === this.W.length - 1);
      for (var o = 0; o < nout; o++) {
        var s = b[o], Wo = W[o];
        for (var i = 0; i < a.length; i++) s += Wo[i] * a[i];
        z[o] = s;
        out[o] = isLast ? ACT.sigmoid.f(s) : this.act.f(s);
      }
      zs.push(z); acts.push(out);
      a = out;
    }
    return { acts: acts, zs: zs, yhat: a[0] };
  };

  // Tek örnekte backpropagation: gradyanları döndürür
  MLP.prototype.backprop = function (x, y) {
    var fwd = this.forward(x);
    var acts = fwd.acts, zs = fwd.zs;
    var L = this.W.length;
    var deltas = new Array(L); // her katman için delta vektörü

    // Çıkış katmanı: BCE + sigmoid → delta = (yhat - y)
    var yhat = acts[L][0];
    deltas[L - 1] = [yhat - y];

    // Geriye yayılım
    for (var l = L - 2; l >= 0; l--) {
      var Wnext = this.W[l + 1], dnext = deltas[l + 1];
      var nin = this.sizes[l + 1];
      var d = new Array(nin);
      for (var i = 0; i < nin; i++) {
        var sum = 0;
        for (var o = 0; o < dnext.length; o++) sum += Wnext[o][i] * dnext[o];
        d[i] = sum * this.act.df(zs[l][i]);
      }
      deltas[l] = d;
    }

    // Gradyanları hesapla
    var gW = [], gb = [];
    for (var l2 = 0; l2 < L; l2++) {
      var aPrev = acts[l2], d2 = deltas[l2];
      var gw = [], gbias = [];
      for (var o2 = 0; o2 < this.W[l2].length; o2++) {
        var grow = [];
        for (var i2 = 0; i2 < aPrev.length; i2++) grow.push(d2[o2] * aPrev[i2]);
        gw.push(grow);
        gbias.push(d2[o2]);
      }
      gW.push(gw); gb.push(gbias);
    }
    return { gW: gW, gb: gb, loss: -Math.log(clamp(y === 1 ? yhat : 1 - yhat, 1e-9, 1)) };
  };

  // Bir epoch: tüm veri üzerinde gradyanları topla, ortala, uygula
  MLP.prototype.trainEpoch = function (data) {
    var L = this.W.length;
    var sumGW = [], sumGB = [];
    for (var l = 0; l < L; l++) {
      var gw = [], gb = [];
      for (var o = 0; o < this.W[l].length; o++) {
        var row = [];
        for (var i = 0; i < this.W[l][o].length; i++) row.push(0);
        gw.push(row); gb.push(0);
      }
      sumGW.push(gw); sumGB.push(gb);
    }

    var totalLoss = 0, correct = 0;
    for (var n = 0; n < data.length; n++) {
      var r = this.backprop(data[n].x, data[n].y);
      totalLoss += r.loss;
      var yhat = this.forward(data[n].x).yhat;
      if ((yhat >= 0.5 ? 1 : 0) === data[n].y) correct++;
      for (var l2 = 0; l2 < L; l2++) {
        for (var o2 = 0; o2 < sumGW[l2].length; o2++) {
          for (var i2 = 0; i2 < sumGW[l2][o2].length; i2++) sumGW[l2][o2][i2] += r.gW[l2][o2][i2];
          sumGB[l2][o2] += r.gb[l2][o2];
        }
      }
    }

    var m = data.length;
    // Gradyan inişi + (opsiyonel) momentum
    var mu = this.opt === "momentum" ? 0.9 : 0;
    for (var l3 = 0; l3 < L; l3++) {
      for (var o3 = 0; o3 < this.W[l3].length; o3++) {
        var gbo = sumGB[l3][o3] / m;
        if (mu > 0) {
          this.vb[l3][o3] = mu * this.vb[l3][o3] - this.lr * gbo;
          this.b[l3][o3] += this.vb[l3][o3];
        } else {
          this.b[l3][o3] -= this.lr * gbo;
        }
        for (var i3 = 0; i3 < this.W[l3][o3].length; i3++) {
          var g = sumGW[l3][o3][i3] / m;
          if (mu > 0) {
            this.vW[l3][o3][i3] = mu * this.vW[l3][o3][i3] - this.lr * g;
            this.W[l3][o3][i3] += this.vW[l3][o3][i3];
          } else {
            this.W[l3][o3][i3] -= this.lr * g;
          }
        }
      }
    }

    return { loss: totalLoss / m, acc: correct / m };
  };

  // Tek örnek tahmini (karar sınırı için)
  MLP.prototype.predict = function (x) { return this.forward(x).yhat; };

  // Sayısal gradyan kontrolü (backprop doğruluğu kanıtı)
  MLP.prototype.gradCheck = function (x, y) {
    var eps = 1e-5, maxRel = 0;
    var r = this.backprop(x, y);
    // rastgele birkaç ağırlığı kontrol et
    var checks = 0;
    for (var l = 0; l < this.W.length && checks < 6; l++) {
      for (var o = 0; o < this.W[l].length && checks < 6; o++) {
        var i = Math.floor(Math.random() * this.W[l][o].length);
        var orig = this.W[l][o][i];
        this.W[l][o][i] = orig + eps;
        var lp = -Math.log(clamp(y === 1 ? this.forward(x).yhat : 1 - this.forward(x).yhat, 1e-9, 1));
        this.W[l][o][i] = orig - eps;
        var lm = -Math.log(clamp(y === 1 ? this.forward(x).yhat : 1 - this.forward(x).yhat, 1e-9, 1));
        this.W[l][o][i] = orig;
        var num = (lp - lm) / (2 * eps);
        var ana = r.gW[l][o][i];
        var denom = Math.max(1e-7, Math.abs(num) + Math.abs(ana));
        maxRel = Math.max(maxRel, Math.abs(num - ana) / denom);
        checks++;
      }
    }
    return maxRel; // ~1e-6 civarı ise backprop doğru
  };

  // ---------------- Uygulama Durumu ----------------
  var ST = {
    dataType: "xor",
    actName: "sigmoid",
    hidden: 8,
    lr: 0.30,
    layers: 1,
    opt: "sgd",
    net: null,
    data: [],
    epoch: 0,
    losshist: [],
    acchist: [],
    running: false,
    speed: 1,
    lastLoss: 0,
    lastAcc: 0,
    grads: null // son backprop gradyanları (görselleştirme için)
  };

  var N_POINTS = 120;

  function buildNet() {
    var sizes = [2];
    for (var i = 0; i < ST.layers; i++) sizes.push(ST.hidden);
    sizes.push(1);
    ST.net = new MLP(sizes, ST.actName, ST.opt, ST.lr);
    ST.epoch = 0;
    ST.losshist = [];
    ST.acchist = [];
  }
  function regenData() { ST.data = DATA[ST.dataType](N_POINTS); }

  // ---------------- DOM Refs ----------------
  var $ = function (id) { return document.getElementById(id); };
  var elEpoch = $("statEpoch"), elLoss = $("statLoss"), elAcc = $("statAcc"), elState = $("statState");
  var elValHidden = $("valHidden"), elValLr = $("valLr");
  var btnTrain = $("btnTrain"), btnStep = $("btnStep"), btnReset = $("btnReset");
  var btnNewData = $("btnNewData"), btnSpeed = $("btnSpeed");
  var svg = $("net"), nodeDetail = $("nodeDetail"), gradCheckEl = $("gradCheck");
  var dbCanvas = $("db"), dbCtx = dbCanvas.getContext("2d");
  var lossCtx = $("lossChart").getContext("2d"), accCtx = $("accChart").getContext("2d");

  // ---------------- Ağ Görselleştirme (SVG) ----------------
  var SVG_W = 640, SVG_H = 460;
  var nodeCoords = []; // [katman][nöron] = {x,y}

  function layoutNodes() {
    nodeCoords = [];
    var sizes = ST.net.sizes;
    var padX = 90, padY = 40;
    var usableW = SVG_W - padX * 2, usableH = SVG_H - padY * 2;
    var nLayers = sizes.length;
    for (var l = 0; l < nLayers; l++) {
      var n = sizes[l];
      var col = [];
      var x = padX + (nLayers === 1 ? 0 : (usableW * l / (nLayers - 1)));
      for (var i = 0; i < n; i++) {
        var y = n === 1 ? SVG_H / 2 : (padY + usableH * i / (n - 1));
        col.push({ x: x, y: y });
      }
      nodeCoords.push(col);
    }
  }

  function weightColor(w, maxAbs) {
    var t = clamp(Math.abs(w) / (maxAbs || 1), 0, 1);
    // negatif = sıcak/pembe kırmızı, pozitif = teal/yeşil
    if (w >= 0) return "rgba(94,234,212," + (0.15 + t * 0.85) + ")";
    return "rgba(244,114,182," + (0.15 + t * 0.85) + ")";
  }

  function renderNet() {
    layoutNodes();
    var nLayers = ST.net.sizes.length;
    // en büyük |ağırlık| — renk normalizasyonu
    var maxAbs = 1e-6;
    for (var l = 0; l < ST.net.W.length; l++)
      for (var o = 0; o < ST.net.W[l].length; o++)
        for (var i = 0; i < ST.net.W[l][o].length; i++)
          maxAbs = Math.max(maxAbs, Math.abs(ST.net.W[l][o][i]));

    var parts = [];
    // Bağlantı çizgileri (önce, nöronların altında kalsın)
    for (var l2 = 0; l2 < ST.net.W.length; l2++) {
      var Wl = ST.net.W[l2];
      for (var o2 = 0; o2 < Wl.length; o2++) {
        for (var i2 = 0; i2 < Wl[o2].length; i2++) {
          var w = Wl[o2][i2];
          var a = nodeCoords[l2][i2], b = nodeCoords[l2 + 1][o2];
          var t2 = clamp(Math.abs(w) / maxAbs, 0, 1);
          var sw = 0.6 + t2 * 3.4;
          parts.push('<line class="net-link" x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) +
            '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) +
            '" stroke="' + weightColor(w, maxAbs) + '" stroke-width="' + sw.toFixed(2) + '" />');
        }
      }
    }
    // Nöronlar
    var layerNames = [];
    for (var ln = 0; ln < nLayers; ln++) {
      if (ln === 0) layerNames.push("Girdi");
      else if (ln === nLayers - 1) layerNames.push("Çıkış");
      else layerNames.push("Gizli " + ln);
    }
    for (var l3 = 0; l3 < nLayers; l3++) {
      for (var n3 = 0; n3 < nodeCoords[l3].length; n3++) {
        var p = nodeCoords[l3][n3];
        var isOut = l3 === nLayers - 1;
        var fill = ln === 0 ? "#334155" : (isOut ? "#f472b6" : "#5eead4");
        var r = l3 === 0 ? 13 : (isOut ? 15 : 12);
        parts.push('<circle class="net-node" data-l="' + l3 + '" data-n="' + n3 + '" cx="' +
          p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + fill +
          '" stroke="#0a0e17" stroke-width="2.5" />');
      }
      // katman etiketi
      var cy = SVG_H - 8;
      parts.push('<text class="net-lbl" x="' + nodeCoords[l3][0].x.toFixed(1) +
        '" y="' + cy + '" text-anchor="middle">' + layerNames[l3] + '</text>');
    }
    svg.innerHTML = parts.join("");
    // nöron tıklama
    var nodes = svg.querySelectorAll(".net-node");
    for (var k = 0; k < nodes.length; k++) {
      nodes[k].addEventListener("click", onNodeClick);
    }
  }

  function onNodeClick(e) {
    var l = +e.target.getAttribute("data-l");
    var n = +e.target.getAttribute("data-n");
    // o anki aktivasyonu yeniden hesapla (bir ortalama örnek üzerinden)
    var sample = ST.data[0];
    if (!sample) return;
    var fwd = ST.net.forward(sample.x);
    var val = fwd.acts[l] ? fwd.acts[l][n] : null;
    var zval = l > 0 && fwd.zs[l - 1] ? fwd.zs[l - 1][n] : null;
    nodeDetail.innerHTML =
      "Katman <b>" + l + "</b> · Nöron <b>" + n + "</b><br>" +
      "Aktivasyon a = <b>" + (val == null ? "—" : val.toFixed(4)) + "</b><br>" +
      (zval != null ? "Ön-aktivasyon z = <b>" + zval.toFixed(4) + "</b><br>" : "") +
      "Örnek girdi [" + sample.x[0].toFixed(2) + ", " + sample.x[1].toFixed(2) + "]";
  }

  // ---------------- Karar Sınırı ----------------
  function drawDecisionBoundary() {
    var W = dbCanvas.width, H = dbCanvas.height;
    var res = 56; // hesap çözünürlüğü (grid)
    var img = dbCtx.createImageData(W, H);
    var d = img.data;
    for (var py = 0; py < H; py++) {
      for (var px = 0; px < W; px++) {
        // canvas → [-1,1] koordinat (x2 ekseni ters)
        var x1 = (px / W) * 2 - 1;
        var x2 = (1 - py / H) * 2 - 1;
        var p = ST.net.predict([x1, x2]);
        // renk: p=0 (sınıf A teal) → p=1 (sınıf B pembe)
        var r = Math.round(94 * (1 - p) + 244 * p);
        var g = Math.round(234 * (1 - p) + 114 * p);
        var b = Math.round(212 * (1 - p) + 182 * p);
        var idx = (py * W + px) * 4;
        d[idx] = r * 0.35; d[idx + 1] = g * 0.35; d[idx + 2] = b * 0.35; d[idx + 3] = 255;
      }
    }
    dbCtx.putImageData(img, 0, 0);

    // veri noktaları
    for (var i = 0; i < ST.data.length; i++) {
      var s = ST.data[i];
      var cx = (s.x[0] + 1) / 2 * W;
      var cy = (1 - (s.x[1] + 1) / 2) * H;
      dbCtx.beginPath();
      dbCtx.arc(cx, cy, 4.2, 0, Math.PI * 2);
      dbCtx.fillStyle = s.y === 1 ? "rgba(244,114,182,.95)" : "rgba(94,234,212,.95)";
      dbCtx.fill();
      dbCtx.lineWidth = 1.4;
      dbCtx.strokeStyle = "rgba(10,14,23,.9)";
      dbCtx.stroke();
    }
  }

  // ---------------- Grafikler ----------------
  function drawChart(ctx, hist, color, fixedMax) {
    var W = ctx.canvas.width, H = ctx.canvas.height;
    var fillCol = ctx.canvas.id === "lossChart" ? "rgba(249,115,115,.12)" : "rgba(94,234,212,.12)";
    ctx.clearRect(0, 0, W, H);
    // ızgara
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    for (var gy = 0; gy <= 4; gy++) {
      var yy = (H * gy / 4);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
    }
    if (hist.length < 2) { return; }
    var maxV = fixedMax != null ? fixedMax : Math.max.apply(null, hist) * 1.15;
    if (maxV <= 0) maxV = 1;
    ctx.beginPath();
    var n = hist.length;
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * W;
      var y = H - clamp(hist[i] / maxV, 0, 1) * (H - 8) - 4;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    // dolgu
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = fillCol;
    ctx.fill();
  }

  // ---------------- UI Güncelleme ----------------
  function updateStats() {
    elEpoch.textContent = ST.epoch;
    elLoss.textContent = ST.lastLoss ? ST.lastLoss.toFixed(4) : "—";
    elAcc.textContent = ST.lastAcc ? (ST.lastAcc * 100).toFixed(1) + "%" : "—";
    elState.textContent = ST.running ? "eğitiliyor…" : (ST.epoch ? "duraklatıldı" : "hazır");
  }

  function refreshAll() {
    renderNet();
    drawDecisionBoundary();
    drawChart(lossCtx, ST.losshist, "rgb(249,115,115)", null);
    drawChart(accCtx, ST.acchist, "rgb(94,234,212)", 1);
    updateStats();
  }

  // ---------------- Eğitim Döngüsü ----------------
  function doEpoch() {
    var r = ST.net.trainEpoch(ST.data);
    ST.epoch++;
    ST.lastLoss = r.loss;
    ST.lastAcc = r.acc;
    ST.losshist.push(r.loss);
    ST.acchist.push(r.acc);
    if (ST.losshist.length > 500) { ST.losshist.shift(); ST.acchist.shift(); }
  }

  var rafId = null;
  function loop() {
    if (!ST.running) return;
    for (var s = 0; s < ST.speed; s++) doEpoch();
    refreshAll();
    rafId = requestAnimationFrame(loop);
  }

  function startTraining() {
    if (ST.running) return;
    ST.running = true;
    btnTrain.textContent = "⏸ Duraklat";
    btnTrain.classList.add("running");
    updateStats();
    rafId = requestAnimationFrame(loop);
  }
  function stopTraining() {
    ST.running = false;
    if (rafId) cancelAnimationFrame(rafId);
    btnTrain.textContent = "▶ Eğit";
    btnTrain.classList.remove("running");
    updateStats();
  }

  // ---------------- Olay Bağlama ----------------
  function bindSeg(id, key, parse, after) {
    var seg = $(id);
    seg.addEventListener("click", function (e) {
      if (e.target.tagName !== "BUTTON") return;
      var btns = seg.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove("on");
      e.target.classList.add("on");
      ST[key] = parse(e.target.getAttribute("data-v"));
      if (after) after();
    });
  }

  bindSeg("segData", "dataType", String, function () { regenData(); refreshAll(); });
  bindSeg("segAct", "actName", String, function () { buildNet(); refreshAll(); });
  bindSeg("segLayers", "layers", Number, function () { buildNet(); refreshAll(); });
  bindSeg("segOpt", "opt", String, function () { if (ST.net) ST.net.opt = ST.opt; });

  $("rHidden").addEventListener("input", function (e) {
    ST.hidden = +e.target.value; elValHidden.textContent = ST.hidden;
  });
  $("rHidden").addEventListener("change", function () { buildNet(); refreshAll(); });

  $("rLr").addEventListener("input", function (e) {
    ST.lr = +e.target.value; elValLr.textContent = ST.lr.toFixed(2);
    if (ST.net) ST.net.lr = ST.lr;
  });

  btnTrain.addEventListener("click", function () {
    if (ST.running) stopTraining(); else startTraining();
  });
  btnStep.addEventListener("click", function () {
    if (ST.running) stopTraining();
    doEpoch(); refreshAll();
  });
  btnReset.addEventListener("click", function () {
    stopTraining(); buildNet(); ST.lastLoss = 0; ST.lastAcc = 0; refreshAll();
  });
  btnNewData.addEventListener("click", function () {
    regenData(); refreshAll();
  });
  var speeds = [1, 4, 16, 64];
  var si = 0;
  btnSpeed.addEventListener("click", function () {
    si = (si + 1) % speeds.length;
    ST.speed = speeds[si];
    btnSpeed.textContent = "⚡ Hız: x" + ST.speed;
  });

  // ---------------- Başlat ----------------
  buildNet();
  regenData();
  refreshAll();

  // gradyan doğrulama (backprop'un gerçekliğini kanıtla)
  try {
    var rel = ST.net.gradCheck(ST.data[0].x, ST.data[0].y);
    if (rel < 1e-3) {
      gradCheckEl.textContent = "Gradyan kontrolü: ✓ geçti (maks rel.hata " + rel.toExponential(1) + ")";
      gradCheckEl.classList.remove("warn");
    } else {
      gradCheckEl.textContent = "Gradyan kontrolü: sapma " + rel.toExponential(1);
      gradCheckEl.classList.add("warn");
    }
  } catch (err) {
    gradCheckEl.textContent = "Gradyan kontrolü: atlandı";
  }

  // dışa aç (test için)
  window.__NEURAL_LAB__ = { ST: ST, doEpoch: doEpoch, refresh: refreshAll };
})();
