/* NUMEX RESCUE — simülasyon çekirdeği (tarayıcı + Node uyumlu, saf mantık) */
(function (global) {
  'use strict';

  var WORLD = { w: 1200, h: 800 };
  var CELL = 20, COLS = 60, ROWS = 40;

  var PRIORITY = {
    red:    { key: 'red',    label: 'KRİTİK', weight: 3.0, color: '#ff3b5c', min: 2, max: 4 },
    orange: { key: 'orange', label: 'ACİL',   weight: 2.0, color: '#ff9f1c', min: 1, max: 3 },
    yellow: { key: 'yellow', label: 'DESTEK', weight: 1.2, color: '#ffd93d', min: 1, max: 2 }
  };

  var CFG = {
    drainPerPx: 0.009,
    idleDrain: 0.02,
    chargeRate: 8,
    rescueTime: 2.5,
    reserve: 12,
    callInterval: 10,
    step: 0.1,
    maxFailures: 2
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------- şehir üretimi ---------- */

  function generateCity(rng) {
    var xs = [], ys = [], x, y, i, j;
    for (x = 120; x < WORLD.w - 100; x += 148) xs.push(x + (rng() - 0.5) * 26);
    for (y = 105; y < WORLD.h - 95; y += 148) ys.push(y + (rng() - 0.5) * 26);

    var roads = [];
    for (i = 0; i < xs.length; i++) roads.push({ x1: xs[i], y1: 0, x2: xs[i], y2: WORLD.h });
    for (j = 0; j < ys.length; j++) roads.push({ x1: 0, y1: ys[j], x2: WORLD.w, y2: ys[j] });

    var buildings = [];
    var bx0 = [0].concat(xs, [WORLD.w]);
    var by0 = [0].concat(ys, [WORLD.h]);
    /* Her ada 2×2'ye kadar parsel: şehir seyrek bloklar değil, dolu bir doku olsun. */
    for (i = 0; i < bx0.length - 1; i++) {
      for (j = 0; j < by0.length - 1; j++) {
        var ax0 = bx0[i] + 14, ax1 = bx0[i + 1] - 14;
        var ay0 = by0[j] + 14, ay1 = by0[j + 1] - 14;
        if (ax1 - ax0 < 30 || ay1 - ay0 < 26) continue;
        var pcols = (ax1 - ax0) > 76 ? 2 : 1;
        var prows = (ay1 - ay0) > 66 ? 2 : 1;
        var cw = (ax1 - ax0) / pcols, ch = (ay1 - ay0) / prows;
        for (var pc = 0; pc < pcols; pc++) {
          for (var pr2 = 0; pr2 < prows; pr2++) {
            var bw = cw * (0.42 + rng() * 0.34);
            var bh = ch * (0.42 + rng() * 0.34);
            buildings.push({
              x: ax0 + pc * cw + cw * 0.12 + rng() * Math.max(1, cw - bw - cw * 0.24),
              y: ay0 + pr2 * ch + ch * 0.12 + rng() * Math.max(1, ch - bh - ch * 0.24),
              w: bw, h: bh, tone: rng()
            });
          }
        }
      }
    }

    var stations = [
      { id: 'S1', x: xs[0], y: ys[ys.length - 1] },
      { id: 'S2', x: xs[xs.length - 1], y: ys[0] }
    ];

    var hospitals = [
      { id: 'H1', x: xs[1], y: ys[1] },
      { id: 'H2', x: xs[xs.length - 2], y: ys[ys.length - 2] },
      { id: 'H3', x: xs[Math.floor(xs.length / 2)], y: ys[1] }
    ];

    var debris = [];
    for (i = 0; i < 9; i++) {
      var tries = 0, px = 0, py = 0, ok = false;
      while (tries++ < 60 && !ok) {
        px = 70 + rng() * (WORLD.w - 140);
        py = 70 + rng() * (WORLD.h - 140);
        ok = true;
        for (j = 0; j < stations.length; j++) if (dist(px, py, stations[j].x, stations[j].y) < 110) ok = false;
      }
      debris.push({ x: px, y: py, r: 26 + rng() * 34, seed: Math.floor(rng() * 1000) });
    }

    var nfz = [];
    for (i = 0; i < 3; i++) {
      nfz.push({ x: 150 + rng() * (WORLD.w - 300), y: 120 + rng() * (WORLD.h - 240), r: 55 + rng() * 45, born: 0 });
    }

    return { roads: roads, buildings: buildings, stations: stations, hospitals: hospitals, debris: debris, nfz: nfz };
  }

  function buildBlocked(nfz) {
    var b = new Uint8Array(COLS * ROWS);
    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        var x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
        for (var i = 0; i < nfz.length; i++) {
          if (dist(x, y, nfz[i].x, nfz[i].y) <= nfz[i].r + 4) { b[cy * COLS + cx] = 1; break; }
        }
      }
    }
    return b;
  }

  /* ---------- A* yol bulma (uçuşa yasak hücreler kapalı) ---------- */

  function isBlocked(blocked, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true;
    return blocked[cy * COLS + cx] === 1;
  }

  function nearestFree(blocked, cx, cy) {
    for (var r = 1; r <= 10; r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          var nx = cx + dx, ny = cy + dy;
          if (!isBlocked(blocked, nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return null;
  }

  function MinHeap() { this.a = []; }
  MinHeap.prototype.push = function (n) {
    var a = this.a; a.push(n); var i = a.length - 1;
    while (i > 0) { var p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; var t = a[p]; a[p] = a[i]; a[i] = t; i = p; }
  };
  MinHeap.prototype.pop = function () {
    var a = this.a; if (!a.length) return null;
    var top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, s = i;
        if (l < a.length && a[l].f < a[s].f) s = l;
        if (r < a.length && a[r].f < a[s].f) s = r;
        if (s === i) break;
        var t = a[s]; a[s] = a[i]; a[i] = t; i = s;
      }
    }
    return top;
  };
  Object.defineProperty(MinHeap.prototype, 'size', { get: function () { return this.a.length; } });

  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function losClear(blocked, ax, ay, bx, by) {
    var d = dist(ax, ay, bx, by);
    var steps = Math.max(1, Math.ceil(d / (CELL * 0.45)));
    for (var i = 1; i <= steps; i++) {
      var t = i / steps;
      var x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      if (isBlocked(blocked, Math.floor(x / CELL), Math.floor(y / CELL))) return false;
    }
    return true;
  }

  function findPath(blocked, sx, sy, tx, ty) {
    var scx = clamp(Math.floor(sx / CELL), 0, COLS - 1), scy = clamp(Math.floor(sy / CELL), 0, ROWS - 1);
    var gcx = clamp(Math.floor(tx / CELL), 0, COLS - 1), gcy = clamp(Math.floor(ty / CELL), 0, ROWS - 1);

    if (isBlocked(blocked, gcx, gcy)) {
      var nf = nearestFree(blocked, gcx, gcy);
      if (!nf) return null;
      gcx = nf.x; gcy = nf.y;
    }

    var N = COLS * ROWS;
    var g = new Float32Array(N); g.fill(Infinity);
    var came = new Int32Array(N); came.fill(-1);
    var closed = new Uint8Array(N);
    var si = scy * COLS + scx, gi = gcy * COLS + gcx;
    g[si] = 0;

    function h(x, y) {
      var dx = Math.abs(x - gcx), dy = Math.abs(y - gcy);
      return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    }

    var open = new MinHeap();
    open.push({ i: si, x: scx, y: scy, f: h(scx, scy) });
    var found = false;

    while (open.size) {
      var cur = open.pop();
      if (closed[cur.i]) continue;
      if (cur.i === gi) { found = true; break; }
      closed[cur.i] = 1;
      for (var k = 0; k < 8; k++) {
        var nx = cur.x + DIRS[k][0], ny = cur.y + DIRS[k][1];
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        var ni = ny * COLS + nx;
        if (closed[ni]) continue;
        if (isBlocked(blocked, nx, ny) && ni !== si) continue;
        var stepCost = (DIRS[k][0] !== 0 && DIRS[k][1] !== 0) ? Math.SQRT2 : 1;
        var ng = g[cur.i] + stepCost;
        if (ng < g[ni]) { g[ni] = ng; came[ni] = cur.i; open.push({ i: ni, x: nx, y: ny, f: ng + h(nx, ny) }); }
      }
    }

    if (!found && gi !== si) return null;

    var cells = [], cur2 = gi;
    while (cur2 !== -1) {
      cells.push({ x: (cur2 % COLS) * CELL + CELL / 2, y: Math.floor(cur2 / COLS) * CELL + CELL / 2 });
      if (cur2 === si) break;
      cur2 = came[cur2];
    }
    cells.reverse();
    cells[0] = { x: sx, y: sy };

    var lastBlocked = isBlocked(blocked, Math.floor(tx / CELL), Math.floor(ty / CELL));
    if (lastBlocked) cells[cells.length - 1] = { x: tx, y: ty };
    else cells.push({ x: tx, y: ty });

    /* düzleştirme: görüş açık olan noktaları atla */
    var pts = [cells[0]], i = 0;
    while (i < cells.length - 1) {
      var j = cells.length - 1;
      while (j > i + 1 && !losClear(blocked, cells[i].x, cells[i].y, cells[j].x, cells[j].y)) j--;
      pts.push(cells[j]); i = j;
    }

    var len = 0;
    for (var m = 1; m < pts.length; m++) len += dist(pts[m - 1].x, pts[m - 1].y, pts[m].x, pts[m].y);
    return { points: pts, length: len };
  }

  /* ---------- drone üretimi ---------- */

  function createDrones(city, rng) {
    var drones = [], n = 0;
    for (var s = 0; s < city.stations.length; s++) {
      var st = city.stations[s];
      for (var k = 0; k < 3; k++) {
        n++;
        /* Her drone'un kendi park yeri var: aynı üsten dönüşte üst üste binmesinler. */
        var parkX = st.x + Math.cos(k * 2.1 + s) * 34;
        var parkY = st.y + Math.sin(k * 2.1 + s) * 26;
        drones.push({
          id: 'DR-' + (n < 10 ? '0' + n : '' + n),
          x: parkX,
          y: parkY,
          home: { x: parkX, y: parkY },
          base: { x: st.x, y: st.y },
          stationId: st.id,
          speed: 95 + Math.round(rng() * 38),
          battery: 82 + Math.round(rng() * 18),
          state: 'idle',
          missionId: null,
          path: null, pathIdx: 0, timer: 0,
          heading: -Math.PI / 2,
          faults: 0
        });
      }
    }
    return drones;
  }

  /* ---------- simülasyon ---------- */

  function Sim(seed) { this.reset(seed); }

  Sim.prototype.reset = function (seed) {
    this.seed = (seed === undefined || seed === null || isNaN(seed)) ? 20261114 : (seed >>> 0);
    this.rng = mulberry32(this.seed);
    this.t = 0; this.acc = 0; this.paused = false;
    this.assignTimer = 0;
    this.callSeq = 0; this.eventSeq = 0; this.faultCount = 0;
    this.city = generateCity(this.rng);
    this.blocked = buildBlocked(this.city.nfz);
    this.drones = createDrones(this.city, this.rng);
    this.calls = [];
    this.events = [];
    this.stats = { rescued: 0, callsSpawned: 0, callsDone: 0, assigned: 0, faults: 0, reassigned: 0, aborted: 0 };
    this.nextCallAt = 5;
    this.nextNfzAt = 34 + this.rng() * 16;
    this.nextFaultAt = 40 + this.rng() * 20;
    this.log('sys', 'Simülasyon çevrimiçi · seed ' + this.seed + ' · 6 drone hazır');
  };

  Sim.prototype.log = function (kind, text) {
    this.eventSeq++;
    this.events.push({ id: this.eventSeq, t: this.t, kind: kind, text: text });
    if (this.events.length > 240) this.events.shift();
  };

  Sim.prototype.callById = function (id) {
    for (var i = 0; i < this.calls.length; i++) if (this.calls[i].id === id) return this.calls[i];
    return null;
  };

  Sim.prototype.droneById = function (id) {
    for (var i = 0; i < this.drones.length; i++) if (this.drones[i].id === id) return this.drones[i];
    return null;
  };

  Sim.prototype.pickPriority = function () {
    var r = this.rng();
    if (r < 0.28) return 'red';
    if (r < 0.62) return 'orange';
    return 'yellow';
  };

  Sim.prototype.freePointNear = function (x, y, spread) {
    for (var i = 0; i < 40; i++) {
      var px = clamp(x + (this.rng() - 0.5) * (spread || 90), 30, WORLD.w - 30);
      var py = clamp(y + (this.rng() - 0.5) * (spread || 90), 30, WORLD.h - 30);
      if (!isBlocked(this.blocked, Math.floor(px / CELL), Math.floor(py / CELL))) return { x: px, y: py };
    }
    return { x: clamp(x, 30, WORLD.w - 30), y: clamp(y, 30, WORLD.h - 30) };
  };

  Sim.prototype.spawnCall = function (x, y, priorityKey) {
    var key = priorityKey || this.pickPriority();
    var p = PRIORITY[key] || PRIORITY.yellow;
    var pos;
    if (x === undefined || y === undefined) {
      var z = this.city.debris[Math.floor(this.rng() * this.city.debris.length)];
      pos = this.freePointNear(z.x, z.y, 110);
    } else {
      pos = this.freePointNear(x, y, 10);
    }
    this.callSeq++;
    var call = {
      id: 'C-' + (this.callSeq < 100 ? ('00' + this.callSeq).slice(-3) : this.callSeq),
      x: pos.x, y: pos.y,
      priority: p.key,
      people: p.min + Math.floor(this.rng() * (p.max - p.min + 1)),
      createdAt: this.t,
      status: 'pending',
      droneId: null
    };
    this.calls.push(call);
    this.stats.callsSpawned++;
    this.log('call', call.id + ' · ' + p.label + ' yardım çağrısı · ' + call.people + ' kişi');
    return call;
  };

  Sim.prototype.addNfz = function () {
    if (this.city.nfz.length >= 5) return null;
    for (var tries = 0; tries < 50; tries++) {
      var x = 140 + this.rng() * (WORLD.w - 280);
      var y = 110 + this.rng() * (WORLD.h - 220);
      var r = 55 + this.rng() * 45;
      var ok = true, i;
      for (i = 0; i < this.city.nfz.length; i++) if (dist(x, y, this.city.nfz[i].x, this.city.nfz[i].y) < this.city.nfz[i].r + r + 50) ok = false;
      for (i = 0; i < this.city.stations.length; i++) if (dist(x, y, this.city.stations[i].x, this.city.stations[i].y) < r + 70) ok = false;
      if (!ok) continue;
      var zone = { x: x, y: y, r: r, born: this.t };
      this.city.nfz.push(zone);
      this.blocked = buildBlocked(this.city.nfz);
      this.log('nfz', 'YENİ UÇUŞA YASAK BÖLGE · rotalar yeniden hesaplanıyor');
      this.repathAll();
      return zone;
    }
    return null;
  };

  Sim.prototype.repathAll = function () {
    for (var i = 0; i < this.drones.length; i++) {
      var d = this.drones[i];
      if (d.state !== 'enroute' && d.state !== 'returning') continue;
      var target = null;
      if (d.state === 'enroute') {
        var c = this.callById(d.missionId);
        if (c) target = { x: c.x, y: c.y };
        else target = d.home;
      } else target = d.home;
      var p = findPath(this.blocked, d.x, d.y, target.x, target.y);
      if (p) { d.path = p.points; d.pathIdx = 1; }
      else if (d.state === 'enroute') this.abortMission(d, 'rota kapandı');
    }
  };

  Sim.prototype.bestDroneFor = function (call) {
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.drones.length; i++) {
      var d = this.drones[i];
      if (d.state !== 'idle') continue;
      if (d.missionId) continue;
      var p = findPath(this.blocked, d.x, d.y, call.x, call.y);
      if (!p) continue;
      var needOut = p.length * CFG.drainPerPx;
      var backDist = dist(call.x, call.y, d.home.x, d.home.y) * 1.3;
      var needBack = backDist * CFG.drainPerPx;
      if (d.battery - needOut - needBack < CFG.reserve) continue;
      var w = PRIORITY[call.priority].weight;
      var score = (p.length / d.speed) / w + (100 - d.battery) * 0.02;
      if (score < bestScore) { bestScore = score; best = { drone: d, path: p }; }
    }
    return best;
  };

  Sim.prototype.dispatch = function () {
    var order = { red: 0, orange: 1, yellow: 2 };
    var pending = this.calls.filter(function (c) { return c.status === 'pending' && !c.droneId; });
    pending.sort(function (a, b) {
      var oa = order[a.priority], ob = order[b.priority];
      if (oa !== ob) return oa - ob;
      return a.createdAt - b.createdAt;
    });
    for (var i = 0; i < pending.length; i++) {
      var call = pending[i];
      var pick = this.bestDroneFor(call);
      if (!pick) continue;
      var d = pick.drone;
      d.state = 'enroute';
      d.path = pick.path.points;
      d.pathIdx = 1;
      d.missionId = call.id;
      call.droneId = d.id;
      call.status = 'assigned';
      this.stats.assigned++;
      this.log('assign', d.id + ' → ' + call.id + ' (' + PRIORITY[call.priority].label + ') · ' + Math.round(pick.path.length) + ' px rota');
    }
  };

  Sim.prototype.abortMission = function (d, reason) {
    var call = this.callById(d.missionId);
    if (call && call.status !== 'done') {
      call.droneId = null;
      call.status = 'pending';
      this.stats.aborted++;
      this.log('abort', d.id + ' görevden çekildi (' + reason + ') · ' + call.id + ' yeniden kuyrukta');
    }
    d.missionId = null;
    d.state = 'returning';
    var p = findPath(this.blocked, d.x, d.y, d.home.x, d.home.y);
    d.path = p ? p.points : [{ x: d.home.x, y: d.home.y }];
    d.pathIdx = 1;
  };

  Sim.prototype.failDrone = function (d, reason) {
    var call = this.callById(d.missionId);
    if (call && (call.status === 'assigned' || call.status === 'rescuing')) {
      call.droneId = null;
      call.status = 'pending';
      this.stats.reassigned++;
      this.log('fault', d.id + ' ARIZA (' + (reason || 'motor') + ') · ' + call.id + ' başka drone\'a devredilecek');
    } else {
      this.log('fault', d.id + ' ARIZA (' + (reason || 'motor') + ') · görev yok');
    }
    d.state = 'failed';
    d.missionId = null;
    d.path = null;
    d.pathIdx = 0;
    d.faults++;
    d.battery = Math.max(0, d.battery - 4);
    this.stats.faults++;
    this.faultCount++;
  };

  Sim.prototype.forceFault = function (droneId) { 
    var d = this.droneById(droneId);
    if (!d || d.state === 'failed') return false;
    this.failDrone(d, 'test');
    return true;
  };

  Sim.prototype.randomFault = function () {
    var candidates = this.drones.filter(function (d) { return d.state !== 'failed' && d.state !== 'idle'; });
    if (!candidates.length) return false;
    var d = candidates[Math.floor(this.rng() * candidates.length)];
    this.failDrone(d, 'türbülans');
    return true;
  };

  Sim.prototype.completeRescue = function (d) {
    var call = this.callById(d.missionId);
    if (call && call.status !== 'done') {
      call.status = 'done';
      call.doneAt = this.t;
      this.stats.rescued += call.people;
      this.stats.callsDone++;
      this.log('done', call.id + ' TAMAMLANDI · ' + call.people + ' kişi kurtarıldı (bölge temiz)');
    }
    d.missionId = null;
    d.state = 'returning';
    var p = findPath(this.blocked, d.x, d.y, d.home.x, d.home.y);
    d.path = p ? p.points : [{ x: d.home.x, y: d.home.y }];
    d.pathIdx = 1;
  };

  Sim.prototype.follow = function (d, h) {
    if (!d.path || d.pathIdx >= d.path.length) return true;
    var target = d.path[d.pathIdx];
    var dx = target.x - d.x, dy = target.y - d.y;
    var len = Math.hypot(dx, dy);
    var stepLen = d.speed * h;
    if (len <= stepLen || len < 0.0001) {
      d.x = target.x; d.y = target.y; d.pathIdx++;
      return d.pathIdx >= d.path.length;
    }
    d.x += (dx / len) * stepLen;
    d.y += (dy / len) * stepLen;
    d.heading = Math.atan2(dy, dx);
    d.battery = Math.max(0, d.battery - CFG.drainPerPx * stepLen);
    return false;
  };

  Sim.prototype.updateDrone = function (d, h) {
    if (d.state === 'failed') return;

    if (d.state === 'charging') {
      d.battery = Math.min(100, d.battery + CFG.chargeRate * h);
      if (d.battery >= 99.5) { d.battery = 100; d.state = 'idle'; this.log('charge', d.id + ' şarj tamam · göreve hazır'); }
      return;
    }

    if (d.state === 'idle') {
      d.battery = Math.max(0, d.battery - CFG.idleDrain * h);
      if (d.battery < 40) {
        d.state = 'charging';
        this.log('charge', d.id + ' rezerv düşük · istasyonda şarja alındı');
      }
      return;
    }

    if (d.state === 'rescuing') {
      d.timer -= h;
      d.battery = Math.max(0, d.battery - CFG.idleDrain * 0.4 * h);
      if (d.timer <= 0) this.completeRescue(d);
      return;
    }

    if (d.state === 'enroute') {
      var needHome = dist(d.x, d.y, d.home.x, d.home.y) * 1.35 * CFG.drainPerPx + CFG.reserve;
      if (d.battery < needHome) { this.abortMission(d, 'batarya rezervi'); return; }
    }

    var arrived = this.follow(d, h);

    if (d.battery <= 0) {
      d.state = 'failed';
      this.faultCount++;
      this.log('fault', d.id + ' batarya tükendi · acil iniş');
      return;
    }

    if (arrived) {
      if (d.state === 'enroute') {
        var call = this.callById(d.missionId);
        if (call) {
          call.status = 'rescuing';
          this.log('resc', d.id + ' olay yerinde · ' + call.id + ' kurtarma başladı (' + call.people + ' kişi)');
        }
        d.state = 'rescuing';
        d.timer = CFG.rescueTime;
        d.path = null; d.pathIdx = 0;
      } else if (d.state === 'returning') {
        d.state = 'charging';
        d.path = null; d.pathIdx = 0;
        this.log('charge', d.id + ' istasyona döndü · şarj ediliyor');
      }
    }
  };

  Sim.prototype.step = function (h) {
    this.t += h;

    /* 0.1'lik adımların birikimli kayan nokta hatası eşikleri kaçırmasın (epsilon). */
    while (this.t + 1e-9 >= this.nextCallAt) {
      this.spawnCall();
      this.nextCallAt += CFG.callInterval;
    }

    if (this.t + 1e-9 >= this.nextNfzAt && this.city.nfz.length < 5) {
      this.addNfz();
      this.nextNfzAt = this.t + 40 + this.rng() * 20;
    }

    if (this.t >= this.nextFaultAt && this.faultCount < CFG.maxFailures) {
      this.randomFault();
      this.nextFaultAt = this.t + 45 + this.rng() * 30;
    } else if (this.t >= this.nextFaultAt) {
      this.nextFaultAt = this.t + 40;
    }

    this.assignTimer += h;
    while (this.assignTimer >= 0.5) { this.assignTimer -= 0.5; this.dispatch(); }

    for (var i = 0; i < this.drones.length; i++) this.updateDrone(this.drones[i], h);
  };

  Sim.prototype.update = function (dt) {
    if (this.paused) return;
    this.acc += dt;
    /* Kayan nokta hatası 0.1'lik adımı düşürmesin: adım sayısı epsilonla hesaplanır. */
    var steps = Math.floor(this.acc / CFG.step + 1e-9);
    if (steps > 6000) steps = 6000;
    for (var i = 0; i < steps; i++) this.step(CFG.step);
    this.acc -= steps * CFG.step;
    if (this.acc < 0 || steps === 6000) this.acc = 0;
  };

  Sim.prototype.metrics = function () {
    var pending = 0, active = 0, failed = 0;
    for (var i = 0; i < this.calls.length; i++) if (this.calls[i].status === 'pending') pending++;
    for (var j = 0; j < this.drones.length; j++) {
      var s = this.drones[j].state;
      if (s === 'enroute' || s === 'rescuing' || s === 'returning') active++;
      if (s === 'failed') failed++;
    }
    return {
      rescued: this.stats.rescued, pending: pending, active: active, failed: failed,
      calls: this.calls.length, nfz: this.city.nfz.length, time: this.t,
      drones: this.drones.length, done: this.stats.callsDone
    };
  };

  var R = {
    Sim: Sim, WORLD: WORLD, PRIORITY: PRIORITY, CFG: CFG, CELL: CELL, COLS: COLS, ROWS: ROWS,
    findPath: findPath, isBlocked: isBlocked, buildBlocked: buildBlocked, losClear: losClear,
    mulberry32: mulberry32, generateCity: generateCity
  };

  global.RescueSim = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
