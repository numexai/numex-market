// NUMEX SMART CITY — simülasyon çekirdeği
// DOM'a dokunmaz: aynı dosya hem tarayıcıda hem Node testlerinde çalışır.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const VEHICLE_TYPES = {
  car: { speed: 60, long: 12, wide: 6.5, color: '#7fd3ff' },
  bus: { speed: 44, long: 21, wide: 8, color: '#ffd166' },
  ambulance: { speed: 112, long: 17, wide: 8, color: '#ff4d4d' },
};

const MIN_GREEN = 3.2;
const MAX_GREEN = 14;

export class SmartCity {
  constructor(opts = {}) {
    this.rand = mulberry32(opts.seed === undefined ? 20261115 : opts.seed);
    this.cols = opts.cols || 7;
    this.rows = opts.rows || 5;
    this.padX = 90;
    this.padY = 95;
    this.gapX = 152;
    this.gapY = 142;
    this.world = {
      w: this.padX * 2 + (this.cols - 1) * this.gapX,
      h: this.padY * 2 + (this.rows - 1) * this.gapY,
    };
    this.nodes = [];
    this.edges = [];
    this.edgeMap = new Map();
    this._build();

    this.vehicles = [];
    this.ambulances = [];
    this.accidents = [];
    this.accidentLog = [];
    this.priority = new Map();
    this.entriesThisTick = [];
    this.events = [];
    this.history = [];

    this.time = 0;
    this.dayTime = opts.startHour === undefined ? 7.5 : opts.startHour;
    this.daySpeed = 24 / 150; // 150 sn'de tam bir gün
    this.carTarget = opts.vehicles === undefined ? 120 : opts.vehicles;
    this.civCount = 0;
    this.vehSeq = 0;
    this.accSeq = 0;
    this.stats = { accidents: 0, resolved: 0, dispatched: 0 };
    this.metrics = null;
    this.nextSample = 0;

    this.maintainFleet();
    this.sample();
  }

  /* ---------------------------------------------------------------- ağ */

  _build() {
    const { cols, rows, padX, padY, gapX, gapY } = this;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        this.nodes.push({
          id,
          r,
          c,
          x: padX + c * gapX,
          y: padY + r * gapY,
          edges: [],
          phase: (r + c) % 2 === 0 ? 'EW' : 'NS',
          phaseTimer: 0,
          forced: 0,
          switches: 0,
          queueEW: 0,
          queueNS: 0,
          demandEW: 0,
          demandNS: 0,
        });
      }
    }
    const link = (a, b) => {
      const A = this.nodes[a];
      const B = this.nodes[b];
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const e = {
        id: `${lo}-${hi}`,
        a: lo,
        b: hi,
        len: Math.hypot(A.x - B.x, A.y - B.y),
        axis: A.r === B.r ? 'EW' : 'NS',
        closed: false,
        closedBy: null,
        accident: null,
        count: 0,
        congestion: 0,
      };
      this.edges.push(e);
      this.edgeMap.set(e.id, e);
      this.nodes[a].edges.push(e.id);
      this.nodes[b].edges.push(e.id);
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        if (c < cols - 1) link(id, id + 1);
        if (r < rows - 1) link(id, id + cols);
      }
    }
  }

  getEdge(a, b) {
    return this.edgeMap.get(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }

  openNeighbors(nodeId) {
    const out = [];
    for (const eid of this.nodes[nodeId].edges) {
      const e = this.edgeMap.get(eid);
      if (e.closed) continue;
      out.push({ node: e.a === nodeId ? e.b : e.a, edge: e });
    }
    return out;
  }

  findPath(from, to, opts = {}) {
    if (from === to) return [from];
    const n = this.nodes.length;
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const done = new Array(n).fill(false);
    dist[from] = 0;
    for (;;) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u === -1 || u === to) break;
      done[u] = true;
      for (const eid of this.nodes[u].edges) {
        const e = this.edgeMap.get(eid);
        if (e.closed) continue;
        const w = e.len * (opts.congestion ? 1 + e.congestion * 2.5 : 1);
        const v = e.a === u ? e.b : e.a;
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      }
    }
    if (dist[to] === Infinity) return null;
    const path = [];
    let cur = to;
    while (cur !== -1) {
      path.push(cur);
      if (cur === from) break;
      cur = prev[cur];
    }
    return path.reverse();
  }

  /* ------------------------------------------------------------- araçlar */

  spawnVehicle(type) {
    const r = this.rand;
    let kind = type;
    if (!kind) kind = r() < 0.12 ? 'bus' : 'car';
    const cur = Math.floor(r() * this.nodes.length);
    const nb = this.openNeighbors(cur);
    if (!nb.length) return null;
    const spec = VEHICLE_TYPES[kind];
    const v = {
      id: 'v' + (++this.vehSeq),
      type: kind,
      cur,
      next: nb[Math.floor(r() * nb.length)].node,
      t: 0,
      speed: spec.speed * (0.88 + r() * 0.28),
      color: kind === 'car'
        ? `hsl(${Math.floor(185 + r() * 105)}, 82%, ${54 + Math.floor(r() * 14)}%)`
        : spec.color,
      wait: false,
      waitTime: 0,
      dist: 0,
      route: [],
      prev: null,
      halo: r() * 6.28,
    };
    this.vehicles.push(v);
    if (kind !== 'ambulance') this.civCount++;
    return v;
  }

  maintainFleet() {
    let guard = 0;
    while (this.civCount < this.carTarget && guard++ < 400) {
      if (!this.spawnVehicle()) break;
    }
  }

  setDensity(n) {
    this.carTarget = Math.max(20, Math.min(400, n));
    this.maintainFleet();
    this.pushEvent(`Trafik yoğunluğu hedefi ${this.carTarget} araca ayarlandı.`);
  }

  /* --------------------------------------------------------------- adım */

  step(dt) {
    if (!(dt > 0)) return;
    if (dt > 0.1) dt = 0.1;
    this.time += dt;
    this.dayTime = (this.dayTime + dt * this.daySpeed) % 24;
    this.entriesThisTick.length = 0;

    this.updateDensity();
    this.updatePriorities(dt);
    this.updateLights(dt);
    this.updateAccidents(dt);

    const amb = [];
    const civ = [];
    for (const v of this.vehicles) (v.type === 'ambulance' ? amb : civ).push(v);
    for (const v of amb) this.stepVehicle(v, dt);
    for (const v of civ) this.stepVehicle(v, dt);
    this.postVehicles();

    this.maintainFleet();
    if (this.time >= this.nextSample) {
      this.sample();
      this.nextSample = this.time + 0.5;
    }
  }

  postVehicles() {
    let dead = false;
    for (const v of this.vehicles) if (v.remove) dead = true;
    if (!dead) return;
    this.vehicles = this.vehicles.filter((v) => !v.remove);
    this.ambulances = this.ambulances.filter((v) => !v.remove);
  }

  stepVehicle(v, dt) {
    if (v.remove) return;
    if (v.type === 'ambulance') {
      if (v.state === 'onScene') {
        v.timer -= dt;
        if (v.timer <= 0) {
          const acc = this.accidents.find((a) => a.id === v.accidentId);
          if (acc) this.resolveAccident(acc, 'ambulans müdahalesi tamamlandı');
          v.state = 'done';
          v.remove = true;
        }
        return;
      }
      if (v.state === 'done') { v.remove = true; return; }
    }

    const e = this.getEdge(v.cur, v.next);
    if (!e || e.closed) { this.reroute(v); return; }

    if (v.t === 0) {
      if (!this.canDepart(v, e)) {
        v.wait = true;
        v.waitTime += dt;
        return;
      }
      v.wait = false;
      v.t = 1e-7;
      this.entriesThisTick.push({ node: v.cur, axis: e.axis, id: v.id, type: v.type });
    }

    v.t += (v.speed * dt) / e.len;
    v.dist += v.speed * dt;
    if (v.t >= 1) this.arrive(v);
  }

  canDepart(v, e) {
    if (e.closed) return false;
    const node = this.nodes[v.cur];

    if (v.type === 'ambulance') {
      // Geçiş önceliği: ışığı kendi eksenine zorla
      if (node.phase !== e.axis) {
        node.phase = e.axis;
        node.phaseTimer = 0;
      }
      node.forced = Math.max(node.forced, 0.9);
      this.priority.set(v.cur, { axis: e.axis, ttl: 1.2 });
      return true;
    }

    const prio = this.priority.get(v.cur);
    if (prio && prio.axis !== e.axis) return false; // ambulansa yol ver
    if (node.phase !== e.axis) return false; // kırmızı
    const cap = Math.max(3, Math.ceil(e.len / 40));
    if (e.count >= cap) return false; // hat dolu
    return true;
  }

  arrive(v) {
    v.prev = v.cur;
    v.cur = v.next;
    v.t = 0;
    v.wait = false;

    if (v.type === 'ambulance') {
      if (v.state === 'toScene' && v.cur === v.targetNode) {
        v.state = 'onScene';
        v.timer = 5.5;
        const acc = this.accidents.find((a) => a.id === v.accidentId);
        if (acc) acc.onScene = true;
        return;
      }
      const nx = this.chooseNext(v);
      v.next = nx === null ? v.cur : nx;
      return;
    }

    const nx = this.chooseNext(v);
    v.next = nx === null ? (this.prev || v.cur) : nx;
    if (nx === null) v.next = v.prev === null ? v.cur : v.prev;
  }

  chooseNext(v) {
    const nb = this.openNeighbors(v.cur);
    if (!nb.length) return v.prev;

    if (v.type === 'ambulance') {
      if (v.route.length) {
        const want = v.route[0];
        if (nb.some((x) => x.node === want)) { v.route.shift(); return want; }
      }
      const path = this.findPath(v.cur, v.targetNode, {});
      if (path && path.length > 1) {
        v.route = path.slice(2);
        return path[1];
      }
      return v.prev;
    }

    if (v.route.length) {
      const want = v.route[0];
      if (nb.some((x) => x.node === want)) { v.route.shift(); return want; }
      const target = v.route[v.route.length - 1];
      const path = this.findPath(v.cur, target, { congestion: true });
      if (path && path.length > 1) {
        v.route = path.slice(2);
        return path[1];
      }
      v.route = [];
    }

    const cands = nb.filter((x) => x.node !== v.prev);
    const pool = cands.length ? cands : nb;
    let total = 0;
    const weights = pool.map((x) => {
      const e = this.getEdge(v.cur, x.node);
      const w = 1 + (1 - e.congestion) * 2.5;
      total += w;
      return w;
    });
    let pick = this.rand() * total;
    let chosen = pool[pool.length - 1].node;
    for (let i = 0; i < pool.length; i++) {
      pick -= weights[i];
      if (pick <= 0) { chosen = pool[i].node; break; }
    }
    return chosen;
  }

  reroute(v) {
    const e = this.getEdge(v.cur, v.next);
    if (e && !e.closed) return;
    const stay = v.t >= 0.5 ? v.next : v.cur;
    v.cur = stay;
    v.t = 0;
    v.route = [];
    v.wait = false;
    if (v.type === 'ambulance') {
      const path = this.findPath(v.cur, v.targetNode, {});
      if (path && path.length > 1) {
        v.route = path.slice(2);
        v.next = path[1];
        return;
      }
      v.next = v.cur;
      return;
    }
    const nx = this.chooseNext(v);
    v.next = nx === null ? v.cur : nx;
  }

  /* ---------------------------------------------------------- yoğunluk */

  updateDensity() {
    for (const e of this.edges) e.count = 0;
    for (const n of this.nodes) { n.queueEW = 0; n.queueNS = 0; }

    for (const v of this.vehicles) {
      if (v.remove) continue;
      const e = this.getEdge(v.cur, v.next);
      if (!e) continue;
      if (v.t > 0) {
        e.count++;
      } else {
        const node = this.nodes[v.cur];
        if (e.axis === 'EW') node.queueEW++; else node.queueNS++;
      }
    }

    for (const e of this.edges) {
      e.congestion = Math.min(1, e.count / Math.max(2, Math.ceil(e.len / 42)));
    }

    for (const n of this.nodes) {
      let pEW = 0;
      let pNS = 0;
      for (const eid of n.edges) {
        const e = this.edgeMap.get(eid);
        if (e.closed) continue;
        if (e.axis === 'EW') pEW += e.congestion; else pNS += e.congestion;
      }
      n.demandEW = n.queueEW + pEW;
      n.demandNS = n.queueNS + pNS;
    }
  }

  /* ------------------------------------------------------------- ışıklar */

  updatePriorities(dt) {
    for (const [node, p] of this.priority) {
      p.ttl -= dt;
      if (p.ttl <= 0) this.priority.delete(node);
    }
  }

  updateLights(dt) {
    for (const n of this.nodes) {
      n.phaseTimer += dt;
      if (n.forced > 0) { n.forced -= dt; continue; }
      const curD = n.phase === 'EW' ? n.demandEW : n.demandNS;
      const oppD = n.phase === 'EW' ? n.demandNS : n.demandEW;
      let flip = false;
      if (n.phaseTimer >= MIN_GREEN) {
        if (oppD >= curD + 2) flip = true;
        else if (n.phaseTimer >= MAX_GREEN && oppD > 0) flip = true;
        else if (n.phaseTimer >= MAX_GREEN * 2) flip = true;
      }
      if (flip) {
        n.phase = n.phase === 'EW' ? 'NS' : 'EW';
        n.phaseTimer = 0;
        n.switches++;
      }
    }
  }

  /* ------------------------------------------------------------ kazalar */

  createAccident(edgeId, opts = {}) {
    const e = this.edgeMap.get(edgeId);
    if (!e) return null;
    if (e.accident) return null;
    const acc = {
      id: 'K' + (++this.accSeq),
      edgeId: e.id,
      x: (this.nodes[e.a].x + this.nodes[e.b].x) / 2,
      y: (this.nodes[e.a].y + this.nodes[e.b].y) / 2,
      t: 0,
      life: opts.life || 90,
      resolved: false,
      onScene: false,
      severity: 0.4 + this.rand() * 0.6,
      ambulanceId: null,
      auto: !!opts.auto,
    };
    e.accident = acc.id;
    e.closed = true;
    e.closedBy = 'accident';
    this.accidents.push(acc);
    this.stats.accidents++;
    this.evictEdge(e);
    this.pushEvent(`${acc.id}: ${e.id} hattında kaza. Hat trafiğe kapatıldı.`);
    if (opts.dispatch !== false) this.dispatchAmbulance(acc);
    this.updateDensity();
    return acc;
  }

  evictEdge(e) {
    for (const v of this.vehicles) {
      if (v.remove) continue;
      const ve = this.getEdge(v.cur, v.next);
      if (!ve || ve.id !== e.id) continue;
      const stay = v.t < 0.5 ? v.cur : v.next;
      v.cur = stay;
      v.t = 0;
      v.route = [];
      v.wait = false;
      if (v.type === 'ambulance') {
        const path = this.findPath(v.cur, v.targetNode, {});
        if (path && path.length > 1) { v.route = path.slice(2); v.next = path[1]; }
        else v.next = v.cur;
        continue;
      }
      const nx = this.chooseNext(v);
      v.next = nx === null ? v.cur : nx;
    }
  }

  dispatchAmbulance(acc) {
    const e = this.edgeMap.get(acc.edgeId);
    if (!e) return null;
    const targetNode = e.a;
    let launch = null;
    for (let i = 0; i < 40; i++) {
      const cand = Math.floor(this.rand() * this.nodes.length);
      if (cand === targetNode) continue;
      const path = this.findPath(cand, targetNode, {});
      if (path && path.length >= 3) { launch = { from: cand, path }; break; }
    }
    if (!launch) return null;
    const path = launch.path;
    const v = {
      id: 'a' + (++this.vehSeq),
      type: 'ambulance',
      cur: launch.from,
      next: path[1],
      t: 0,
      speed: VEHICLE_TYPES.ambulance.speed,
      color: VEHICLE_TYPES.ambulance.color,
      route: path.slice(2),
      prev: null,
      wait: false,
      waitTime: 0,
      dist: 0,
      halo: 0,
      targetNode,
      accidentId: acc.id,
      state: 'toScene',
      timer: 0,
    };
    this.vehicles.push(v);
    this.ambulances.push(v);
    acc.ambulanceId = v.id;
    this.stats.dispatched++;
    this.pushEvent(`${v.id} ambulansı ${acc.id} için görevlendirildi (${launch.from} → ${targetNode}).`);
    return v;
  }

  updateAccidents(dt) {
    for (const acc of this.accidents) {
      if (acc.resolved) continue;
      acc.t += dt;
      if (acc.t > acc.life) this.resolveAccident(acc, 'süre aşımı, hat yeniden açıldı');
    }
  }

  resolveAccident(acc, reason) {
    if (!acc || acc.resolved) return;
    acc.resolved = true;
    acc.reason = reason;
    const e = this.edgeMap.get(acc.edgeId);
    if (e) {
      e.accident = null;
      if (e.closedBy === 'accident') { e.closed = false; e.closedBy = null; }
    }
    this.accidents = this.accidents.filter((a) => a.id !== acc.id);
    this.accidentLog.push(acc);
    this.stats.resolved++;
    this.pushEvent(`${acc.id} kapandı: ${reason}. Hat normale döndü.`);
  }

  activeAccidents() {
    return this.accidents.filter((a) => !a.resolved);
  }

  toggleRoad(edgeId) {
    const e = this.edgeMap.get(edgeId);
    if (!e) return null;
    if (e.accident) return null;
    e.closed = !e.closed;
    e.closedBy = e.closed ? 'user' : null;
    if (e.closed) {
      this.evictEdge(e);
      this.pushEvent(`${e.id} hattı kullanıcı tarafından kapatıldı.`);
    } else {
      this.pushEvent(`${e.id} hattı yeniden açıldı.`);
    }
    return e;
  }

  nearestEdge(x, y, maxDist = 70) {
    let best = null;
    let bestD = maxDist;
    for (const e of this.edges) {
      const A = this.nodes[e.a];
      const B = this.nodes[e.b];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const l2 = dx * dx + dy * dy;
      let t = ((x - A.x) * dx + (y - A.y) * dy) / l2;
      t = Math.max(0, Math.min(1, t));
      const px = A.x + t * dx;
      const py = A.y + t * dy;
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  randomEdge(preferFree = true) {
    const pool = preferFree
      ? this.edges.filter((e) => !e.closed)
      : this.edges.slice();
    if (!pool.length) return null;
    return pool[Math.floor(this.rand() * pool.length)];
  }

  /* ------------------------------------------------------------ ölçümler */

  sample() {
    let moving = 0;
    let civ = 0;
    let speedSum = 0;
    let waitSum = 0;
    for (const v of this.vehicles) {
      if (v.type === 'ambulance') continue;
      civ++;
      if (v.t > 0) { moving++; speedSum += v.speed; }
      waitSum += v.waitTime;
    }
    let cong = 0;
    let open = 0;
    let closed = 0;
    for (const e of this.edges) {
      if (e.closed) { closed++; continue; }
      open++;
      cong += e.congestion;
    }
    const m = {
      t: this.time,
      hour: this.dayTime,
      vehicles: civ,
      moving,
      waiting: civ - moving,
      avgWait: civ ? waitSum / civ : 0,
      avgSpeed: moving ? speedSum / moving : 0,
      congestion: open ? cong / open : 0,
      closed,
      accidents: this.accidents.length,
      ambulances: this.ambulances.length,
      resolved: this.stats.resolved,
    };
    this.metrics = m;
    this.history.push(m);
    if (this.history.length > 240) this.history.shift();
    return m;
  }

  pushEvent(text) {
    this.events.push({ t: this.time, text });
    if (this.events.length > 200) this.events.shift();
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }
}
