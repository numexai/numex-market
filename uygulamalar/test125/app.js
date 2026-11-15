/* NUMEX RESCUE — operasyon merkezi arayüzü (canvas render + DOM telemetri) */
(function () {
  'use strict';

  var R = window.RescueSim;
  var FX = window.RescueFX;
  if (!R || !FX) return;
  var WORLD = R.WORLD, PRI = R.PRIORITY;

  var stage = document.getElementById('stage');
  var canvas = document.getElementById('map');
  var ctx = canvas.getContext('2d');

  var sim = new R.Sim(20261114);
  var speed = 1;
  var selectedPriority = 'orange';
  var view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  var trails = {};
  var lastEventId = 0;
  var hover = null;

  /* Sahne çizimi fx.js'teki Renderer'a devredildi. */
  var renderer = new FX.Renderer(ctx, canvas, sim, view);

  /* ---------- yardımcılar ---------- */

  function fmtTime(t) {
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }
  function pr(seed, i) {
    var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function stateColor(state) {
    if (state === 'enroute') return '#38e1ff';
    if (state === 'rescuing') return '#ffd93d';
    if (state === 'returning') return '#7c8da9';
    if (state === 'charging') return '#79c7e0';
    if (state === 'failed') return '#ff3b5c';
    return '#35e08a';
  }

  /* ---------- boyutlandırma ---------- */

  function resize() {
    var rect = stage.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    view.dpr = dpr;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    var s = Math.min(rect.width / WORLD.w, rect.height / WORLD.h);
    view.scale = s;
    view.ox = (rect.width - WORLD.w * s) / 2;
    view.oy = (rect.height - WORLD.h * s) / 2;
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);

  /* ---------- çizim ----------
     Sahne çizimi fx.js'teki Renderer'da; burada yalnız ince bir köprü var. */

  function draw(dt) {
    renderer.draw(dt, hover, sim.paused);
  }

  /* ---------- DOM telemetri ---------- */

  function setText(id, v) {
    var el = document.getElementById(id);
    if (el && el.textContent !== String(v)) el.textContent = v;
  }

  function flash(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('flash');
    setTimeout(function () { el.classList.remove('flash'); }, 420);
  }

  var lastRescued = 0;

  function updateUI() {
    var m = sim.metrics();

    var rEl = document.getElementById('m-rescued');
    if (rEl) rEl.innerHTML = m.rescued + '<span class="u">kişi</span>';
    if (m.rescued !== lastRescued) { flash('m-rescued-card'); lastRescued = m.rescued; }
    setText('m-pending', m.pending);
    var aEl = document.getElementById('m-active');
    if (aEl) aEl.innerHTML = m.active + '<span class="u">/ 6</span>';
    setText('m-done', m.done);
    setText('m-nfz', m.nfz);
    setText('m-fault', m.failed);
    setText('sim-time', fmtTime(m.time));
    setText('tick-label', 't=' + m.time.toFixed(1) + 's');
    setText('tag-nfz', 'Uçuşa Yasak: ' + m.nfz);
    var openCalls = 0;
    for (var ci = 0; ci < sim.calls.length; ci++) if (sim.calls[ci].status !== 'done') openCalls++;
    setText('call-count', openCalls + ' açık · ' + m.pending + ' bekleyen');
    setText('seed-view', sim.seed);
    setText('sb-seed', sim.seed);

    var load = Math.min(100, Math.round((m.pending + m.active) / 8 * 100));
    var loadBar = document.getElementById('load-bar');
    if (loadBar) {
      loadBar.style.width = load + '%';
      loadBar.style.background = load > 72 ? 'linear-gradient(90deg,#ff9f1c,#ff3b5c)'
        : (load > 40 ? 'linear-gradient(90deg,#38e1ff,#ff9f1c)' : 'linear-gradient(90deg,#35e08a,#38e1ff)');
    }
    setText('load-val', load + '%');

    setText('sb-drones', m.active + ' havada');
    setText('sb-calls', m.calls + ' çağrı');
    setText('sb-nfz', m.nfz + ' yasak bölge');
    setText('sb-rescued', m.rescued + ' kurtarılan');

    var pendCard = document.getElementById('m-pending-card');
    if (pendCard) {
      pendCard.classList.toggle('danger', m.pending >= 4);
      pendCard.classList.toggle('warn', m.pending > 0 && m.pending < 4);
    }

    /* filo */
    var fleet = document.getElementById('fleet');
    var labels = { idle: 'Hazır', enroute: 'Yolda', rescuing: 'Kurtarma', returning: 'Dönüş', charging: 'Şarj', failed: 'Arıza' };
    var html = '';
    sim.drones.forEach(function (d) {
      var col = d.battery > 45 ? '#35e08a' : (d.battery > 20 ? '#ff9f1c' : '#ff3b5c');
      var mission = d.missionId ? d.missionId : (d.state === 'charging' ? 'şarj' : '—');
      html += '<div class="drone ' + d.state + '">' +
        '<div class="row"><span class="id">' + d.id + '</span>' +
        '<span class="st ' + d.state + '">' + (labels[d.state] || d.state) + '</span></div>' +
        '<div class="bar"><i style="width:' + Math.max(0, d.battery).toFixed(0) + '%;background:' + col + '"></i></div>' +
        '<div class="meta"><span>' + d.battery.toFixed(0) + '% · ' + d.speed + ' px/s</span><span>' + mission + '</span></div>' +
        '</div>';
    });
    if (fleet && fleet.dataset.sig !== html) { fleet.innerHTML = html; fleet.dataset.sig = html; }

    /* çağrı kuyruğu */
    var callsEl = document.getElementById('calls');
    var active = sim.calls.filter(function (c) { return c.status !== 'done'; })
      .sort(function (a, b) {
        var o = { red: 0, orange: 1, yellow: 2 };
        return (o[a.priority] - o[b.priority]) || (a.createdAt - b.createdAt);
      }).slice(0, 20);
    var cHtml = '';
    if (!active.length) cHtml = '<div class="empty">Bekleyen çağrı yok · bölge sakin</div>';
    active.forEach(function (c) {
      var p = PRI[c.priority];
      var age = Math.floor(sim.t - c.createdAt);
      cHtml += '<div class="call ' + (c.status === 'pending' ? '' : c.status) + '" style="--c:' + p.color + '">' +
        '<span class="pdot"></span>' +
        '<span class="cid">' + c.id + '</span>' +
        '<span class="ppl">' + c.people + ' kişi</span>' +
        '<span class="age">' + age + 's</span>' +
        '<span class="who">' + (c.droneId ? c.droneId : 'atanmadı') + '</span></div>';
    });
    if (callsEl && callsEl.dataset.sig !== cHtml) { callsEl.innerHTML = cHtml; callsEl.dataset.sig = cHtml; }

    /* olay akışı */
    var logEl = document.getElementById('log');
    var fresh = sim.events.filter(function (e) { return e.id > lastEventId; });
    if (fresh.length) {
      fresh.forEach(function (e) { logEl.insertAdjacentHTML('afterbegin', eventHtml(e)); });
      lastEventId = fresh[fresh.length - 1].id;
      while (logEl.children.length > 70) logEl.removeChild(logEl.lastElementChild);
    }
  }

  function eventHtml(e) {
    var d = Math.floor(e.t / 60), s = Math.floor(e.t % 60);
    var t = (d < 10 ? '0' + d : d) + ':' + (s < 10 ? '0' + s : s);
    return '<div class="ev ' + e.kind + '"><span class="t">' + t + '</span><span class="x">' + e.text + '</span></div>';
  }

  /* ---------- etkileşim ---------- */

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  function worldFromEvent(ev) {
    var rect = canvas.getBoundingClientRect();
    var x = (ev.clientX - rect.left - view.ox) / view.scale;
    var y = (ev.clientY - rect.top - view.oy) / view.scale;
    if (x < 0 || y < 0 || x > WORLD.w || y > WORLD.h) return null;
    return { x: x, y: y };
  }

  canvas.addEventListener('click', function (ev) {
    var p = worldFromEvent(ev);
    if (!p) return;
    var call = sim.spawnCall(p.x, p.y, selectedPriority);
    renderer.burst(p.x, p.y, PRI[call.priority].color, 16);
    toast('Yeni çağrı: ' + call.id + ' · ' + PRI[call.priority].label + ' · ' + call.people + ' kişi');
    updateUI();
  });

  canvas.addEventListener('mousemove', function (ev) {
    hover = worldFromEvent(ev);
  });
  canvas.addEventListener('mouseleave', function () { hover = null; });

  document.querySelectorAll('.prio').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.prio').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      selectedPriority = b.dataset.p;
    });
  });

  var btnPause = document.getElementById('btn-pause');
  btnPause.addEventListener('click', function () {
    sim.paused = !sim.paused;
    btnPause.textContent = sim.paused ? 'Devam Et' : 'Duraklat';
    var dot = document.getElementById('status-dot');
    dot.classList.toggle('paused', sim.paused);
    setText('status-text', sim.paused ? 'Duraklatıldı' : 'Çevrimiçi');
    setText('sb-state', sim.paused ? 'DURAKLATILDI' : 'CANLI');
  });

  function doReset(seed) {
    sim.reset(seed);
    trails = {};
    renderer.reset();
    lastEventId = 0;
    lastRescued = 0;
    document.getElementById('log').innerHTML = '';
    document.getElementById('seed').value = sim.seed;
    document.getElementById('btn-pause').textContent = 'Duraklat';
    document.getElementById('status-dot').classList.remove('paused');
    setText('status-text', 'Çevrimiçi');
    setText('sb-state', 'CANLI');
    updateUI();
    toast('Simülasyon sıfırlandı · seed ' + sim.seed);
  }

  document.getElementById('btn-reset').addEventListener('click', function () { doReset(sim.seed); });
  document.getElementById('btn-seed').addEventListener('click', function () {
    var v = parseInt(document.getElementById('seed').value, 10);
    doReset(isNaN(v) ? 20261114 : v);
  });
  document.getElementById('speed').addEventListener('change', function (e) {
    speed = parseFloat(e.target.value) || 1;
    setText('sb-speed', speed + '×');
  });

  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); btnPause.click(); }
    if (e.key === 'r' || e.key === 'R') doReset(sim.seed);
  });

  /* ---------- döngü ---------- */

  var last = performance.now();
  var uiAcc = 0;

  function loop(now) {
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.5) dt = 0.5;

    sim.update(dt * speed);
    draw(dt);

    uiAcc += dt;
    if (uiAcc > 0.12) { uiAcc = 0; updateUI(); }

    requestAnimationFrame(loop);
  }

  resize();
  updateUI();
  requestAnimationFrame(loop);
})();
