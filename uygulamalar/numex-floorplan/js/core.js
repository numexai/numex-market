/* NUMEX FLOORPLAN — çekirdek
 * Tek merkezi koordinat sistemi: metre, x sağa, y aşağı (plan düzlemi).
 * 2D ve 3D aynı veriyi okur; bağımsız sahte veri yoktur.
 */
(function (global) {
  'use strict';

  /* ---------------- katalog: gerçek ölçüler (metre) ---------------- */
  const CATALOG = [
    { type: 'sofa',      name: 'Koltuk',           w: 2.10, d: 0.90, h: 0.80, color: '#7b6b5c' },
    { type: 'bed',       name: 'Yatak',            w: 1.60, d: 2.00, h: 0.55, color: '#8fa9c4' },
    { type: 'table',     name: 'Masa',             w: 1.20, d: 0.80, h: 0.75, color: '#b08a5e' },
    { type: 'chair',     name: 'Sandalye',         w: 0.45, d: 0.45, h: 0.90, color: '#9a7c58' },
    { type: 'wardrobe',  name: 'Dolap',            w: 1.20, d: 0.60, h: 2.00, color: '#a9885f' },
    { type: 'counter',   name: 'Mutfak Tezgâhı',   w: 1.80, d: 0.60, h: 0.90, color: '#c9cdd3' },
    { type: 'sink',      name: 'Lavabo',           w: 0.60, d: 0.45, h: 0.85, color: '#dfe6ec' },
    { type: 'toilet',    name: 'Klozet',           w: 0.40, d: 0.65, h: 0.75, color: '#eef2f6' },
    { type: 'shower',    name: 'Duş',              w: 0.90, d: 0.90, h: 2.00, color: '#a9cdd8' },
    { type: 'tv',        name: 'TV Ünitesi',       w: 1.60, d: 0.40, h: 0.55, color: '#565f6b' },
    { type: 'bookshelf', name: 'Kitaplık',         w: 1.00, d: 0.35, h: 1.90, color: '#8d6f4f' },
    { type: 'dining',    name: 'Yemek Masası',     w: 1.60, d: 0.90, h: 0.75, color: '#a9805a' }
  ];
  const CAT = {};
  CATALOG.forEach(c => { CAT[c.type] = c; });

  const DEFAULTS = {
    wallThickness: 0.20,
    wallHeight: 2.80,
    doorWidth: 0.90,
    doorHeight: 2.10,
    windowWidth: 1.20,
    windowHeight: 1.20,
    windowSill: 0.90
  };

  let seq = 0;
  function uid(p) { seq += 1; return p + seq.toString(36) + Math.floor(Math.random() * 1296).toString(36); }

  /* ---------------- geometri ---------------- */
  const G = {
    len(w) { return Math.hypot(w.bx - w.ax, w.by - w.ay); },
    angle(w) { return Math.atan2(w.by - w.ay, w.bx - w.ax); },
    pointAt(w, d) {
      const L = G.len(w) || 1e-6, t = d / L;
      return { x: w.ax + (w.bx - w.ax) * t, y: w.ay + (w.by - w.ay) * t };
    },
    closest(w, p) {
      const dx = w.bx - w.ax, dy = w.by - w.ay;
      const L2 = dx * dx + dy * dy || 1e-9;
      let t = ((p.x - w.ax) * dx + (p.y - w.ay) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      const x = w.ax + dx * t, y = w.ay + dy * t;
      return { d: t * Math.sqrt(L2), dist: Math.hypot(p.x - x, p.y - y), x, y };
    },
    polyArea(poly) {
      let s = 0;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        s += a.x * b.y - b.x * a.y;
      }
      return s / 2;
    },
    polyCentroid(poly) {
      let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length];
        const cr = p.x * q.y - q.x * p.y;
        a += cr; cx += (p.x + q.x) * cr; cy += (p.y + q.y) * cr;
      }
      if (Math.abs(a) < 1e-9) {
        let mx = 0, my = 0;
        poly.forEach(p => { mx += p.x; my += p.y; });
        return { x: mx / poly.length, y: my / poly.length };
      }
      a *= 0.5;
      return { x: cx / (6 * a), y: cy / (6 * a) };
    },
    clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  };

  /* ---------------- oda algılama: duvarların kapalı yüzleri ----------------
   * Duvar uçları düğüm, duvarlar kenardır. T-kavşaklarında duvar bölünür.
   * Her yönlü kenardan yüz dolaşılır; pozitif işaretli alan = kapalı oda.
   */
  function rooms(project) {
    const walls = project.walls || [];
    if (walls.length < 3) return [];
    const R = 1000; // mm hassasiyetinde düğüm anahtarı
    const key = (x, y) => Math.round(x * R) + ',' + Math.round(y * R);
    const nodes = new Map();

    function node(x, y) {
      const k = key(x, y);
      let n = nodes.get(k);
      if (!n) { n = { x: Math.round(x * R) / R, y: Math.round(y * R) / R, out: [] }; nodes.set(k, n); }
      return n;
    }

    const endpoints = [];
    for (const w of walls) { endpoints.push(node(w.ax, w.ay), node(w.bx, w.by)); }

    // duvarları araya giren uç noktalarından böl
    const segs = [];
    for (const w of walls) {
      const dx = w.bx - w.ax, dy = w.by - w.ay;
      const L = Math.hypot(dx, dy);
      if (L < 0.02) continue;
      const ux = dx / L, uy = dy / L;
      const cuts = [0, L];
      for (const p of endpoints) {
        const t = (p.x - w.ax) * ux + (p.y - w.ay) * uy;
        if (t > 0.02 && t < L - 0.02) {
          const px = w.ax + ux * t, py = w.ay + uy * t;
          if (Math.hypot(p.x - px, p.y - py) < 0.03) cuts.push(t);
        }
      }
      cuts.sort((a, b) => a - b);
      for (let i = 0; i < cuts.length - 1; i++) {
        if (cuts[i + 1] - cuts[i] < 0.02) continue;
        segs.push({
          ax: w.ax + ux * cuts[i], ay: w.ay + uy * cuts[i],
          bx: w.ax + ux * cuts[i + 1], by: w.ay + uy * cuts[i + 1], wall: w
        });
      }
    }

    const edges = [];
    for (const s of segs) {
      const a = nodes.get(key(s.ax, s.ay)), b = nodes.get(key(s.bx, s.by));
      if (!a || !b || a === b) continue;
      const e1 = { from: a, to: b, wall: s.wall, ang: Math.atan2(b.y - a.y, b.x - a.x) };
      const e2 = { from: b, to: a, wall: s.wall, ang: Math.atan2(a.y - b.y, a.x - b.x) };
      e1.rev = e2; e2.rev = e1;
      a.out.push(e1); b.out.push(e2);
      edges.push(e1, e2);
    }
    for (const n of nodes.values()) n.out.sort((m, k) => m.ang - k.ang);

    const seen = new Set(), faces = [];
    for (const e0 of edges) {
      if (seen.has(e0)) continue;
      const poly = [];
      let cur = e0, guard = 0;
      while (cur && !seen.has(cur) && guard++ <= edges.length + 4) {
        seen.add(cur);
        poly.push({ x: cur.from.x, y: cur.from.y });
        const list = cur.to.out;
        const idx = list.indexOf(cur.rev);
        if (idx < 0) { cur = null; break; }
        cur = list[(idx - 1 + list.length) % list.length];
      }
      if (poly.length >= 3) {
        const a = G.polyArea(poly);
        if (a > 0.2) faces.push({ poly, area: a });
      }
    }

    faces.sort((a, b) => b.area - a.area);
    return faces.map((f, i) => {
      const c = G.polyCentroid(f.poly);
      return { id: 'room' + (i + 1), name: 'Oda ' + (i + 1), poly: f.poly, area: f.area, cx: c.x, cy: c.y };
    });
  }

  function totalArea(project) {
    return rooms(project).reduce((s, r) => s + r.area, 0);
  }

  /* ---------------- model yardımcıları ---------------- */
  function newProject(name) {
    return {
      app: 'numex-floorplan', version: 1,
      name: name || 'Yeni Proje',
      wallHeight: DEFAULTS.wallHeight,
      grid: 0.50,
      walls: [], openings: [], furniture: []
    };
  }

  function addWall(project, a, b, thickness) {
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.10) return null;
    const w = {
      id: uid('w'),
      ax: +a.x.toFixed(3), ay: +a.y.toFixed(3),
      bx: +b.x.toFixed(3), by: +b.y.toFixed(3),
      t: thickness || DEFAULTS.wallThickness
    };
    project.walls.push(w);
    return w;
  }

  function openingsOf(project, wallId) {
    return (project.openings || [])
      .filter(o => o.wallId === wallId)
      .sort((a, b) => a.d - b.d);
  }

  function addOpening(project, wall, d, type) {
    const L = G.len(wall);
    const w = type === 'door' ? DEFAULTS.doorWidth : DEFAULTS.windowWidth;
    if (L < w + 0.10) return null;
    // aynı duvarda çakışma varsa en yakın boş konuma kaydır
    let center = G.clamp(d, w / 2 + 0.02, L - w / 2 - 0.02);
    const others = openingsOf(project, wall.id);
    for (let pass = 0; pass < 8; pass++) {
      const hit = others.find(o => Math.abs(o.d - center) < (o.w + w) / 2 + 0.03);
      if (!hit) break;
      center = hit.d + (center >= hit.d ? 1 : -1) * ((hit.w + w) / 2 + 0.05);
      center = G.clamp(center, w / 2 + 0.02, L - w / 2 - 0.02);
    }
    const op = {
      id: uid('o'), type, wallId: wall.id, d: +center.toFixed(3), w,
      h: type === 'door' ? DEFAULTS.doorHeight : DEFAULTS.windowHeight,
      sill: type === 'door' ? 0 : DEFAULTS.windowSill
    };
    project.openings.push(op);
    return op;
  }

  function addFurniture(project, type, x, y, rot) {
    const c = CAT[type] || CATALOG[0];
    const f = {
      id: uid('f'), type: c.type,
      x: +x.toFixed(3), y: +y.toFixed(3),
      w: c.w, d: c.d, rot: rot || 0
    };
    project.furniture.push(f);
    return f;
  }

  function removeById(project, id) {
    if (!id) return false;
    const before = project.walls.length + project.openings.length + project.furniture.length;
    project.furniture = project.furniture.filter(f => f.id !== id);
    project.openings = project.openings.filter(o => o.id !== id);
    const gone = project.walls.filter(w => w.id === id).map(w => w.id);
    if (gone.length) {
      project.walls = project.walls.filter(w => w.id !== id);
      project.openings = project.openings.filter(o => gone.indexOf(o.wallId) < 0);
    }
    return (project.walls.length + project.openings.length + project.furniture.length) < before;
  }

  function findById(project, id) {
    let o = project.walls.find(w => w.id === id); if (o) return { kind: 'wall', obj: o };
    o = project.openings.find(x => x.id === id); if (o) return { kind: 'opening', obj: o };
    o = project.furniture.find(x => x.id === id); if (o) return { kind: 'furniture', obj: o };
    return null;
  }

  function bounds(project) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const put = (x, y, m) => {
      minX = Math.min(minX, x - m); minY = Math.min(minY, y - m);
      maxX = Math.max(maxX, x + m); maxY = Math.max(maxY, y + m);
    };
    (project.walls || []).forEach(w => {
      put(w.ax, w.ay, (w.t || 0.2) / 2); put(w.bx, w.by, (w.t || 0.2) / 2);
    });
    (project.furniture || []).forEach(f => {
      const r = Math.hypot(f.w, f.d) / 2;
      put(f.x, f.y, r);
    });
    if (!isFinite(minX)) return { x: 0, y: 0, w: 8, h: 6, empty: true };
    return { x: minX, y: minY, w: Math.max(maxX - minX, 1), h: Math.max(maxY - minY, 1), empty: false };
  }

  /* ---------------- hazır projeler ---------------- */
  function w(project, ax, ay, bx, by, t) { return addWall(project, { x: ax, y: ay }, { x: bx, y: by }, t || 0.2); }

  function rect(project, x, y, wd, ht, t) {
    w(project, x, y, x + wd, y, t);
    w(project, x + wd, y, x + wd, y + ht, t);
    w(project, x + wd, y + ht, x, y + ht, t);
    w(project, x, y + ht, x, y, t);
  }

  function wallBetween(project, ax, ay, bx, by) {
    const near = (a, b) => Math.abs(a - b) < 0.02;
    return project.walls.find(wl =>
      ((near(wl.ax, ax) && near(wl.ay, ay) && near(wl.bx, bx) && near(wl.by, by)) ||
       (near(wl.ax, bx) && near(wl.ay, by) && near(wl.bx, ax) && near(wl.by, ay))));
  }

  function openingAt(project, ax, ay, bx, by, d, type) {
    const wl = wallBetween(project, ax, ay, bx, by);
    if (wl) addOpening(project, wl, d, type);
  }

  function furn(project, type, x, y, rot) { return addFurniture(project, type, x, y, rot || 0); }

  function sampleOnePlusOne() {
    const p = newProject('1+1 Küçük Daire');
    rect(p, 0, 0, 6.0, 7.0, 0.20);
    w(p, 2.6, 0, 2.6, 2.6, 0.15);          // banyo sağ duvarı
    w(p, 2.6, 2.6, 0, 2.6, 0.15);          // banyo alt duvarı
    w(p, 0, 4.4, 6, 4.4, 0.15);            // yatak odası duvarı

    openingAt(p, 0, 0, 6, 0, 4.6, 'door');           // giriş kapısı (üst duvar)
    openingAt(p, 2.6, 2.6, 0, 2.6, 1.6, 'door');     // banyo kapısı
    openingAt(p, 0, 4.4, 6, 4.4, 1.4, 'door');       // yatak odası kapısı
    openingAt(p, 6, 7, 0, 7, 2.0, 'window');         // salon penceresi
    openingAt(p, 6, 0, 6, 7, 5.2, 'window');         // yatak odası penceresi

    furn(p, 'bed', 4.7, 5.7, 0);                     // yatak odası
    furn(p, 'wardrobe', 0.55, 5.9, Math.PI / 2);
    furn(p, 'sofa', 4.8, 3.3, Math.PI);
    furn(p, 'tv', 4.85, 4.05, Math.PI);
    furn(p, 'dining', 2.6, 3.4, 0);
    furn(p, 'chair', 2.6, 2.85, 0);
    furn(p, 'chair', 2.6, 3.95, Math.PI);
    furn(p, 'counter', 3.0, 0.42, 0);
    furn(p, 'sink', 3.9, 0.42, 0);
    furn(p, 'toilet', 0.55, 0.55, 0);
    furn(p, 'shower', 1.6, 0.6, 0);
    return p;
  }

  function sampleFamily() {
    const p = newProject('2+1 Aile Dairesi');
    rect(p, 0, 0, 9.0, 10.0, 0.20);
    w(p, 4.6, 0, 4.6, 4.2, 0.15);           // yatak odası 1
    w(p, 0, 4.2, 4.6, 4.2, 0.15);
    w(p, 4.6, 6.0, 4.6, 10, 0.15);          // yatak odası 2
    w(p, 4.6, 6.0, 9, 6.0, 0.15);
    w(p, 6.6, 0, 6.6, 3.4, 0.15);           // mutfak
    w(p, 6.6, 3.4, 9, 3.4, 0.15);
    w(p, 0, 8.2, 2.4, 8.2, 0.15);           // banyo
    w(p, 2.4, 8.2, 2.4, 10, 0.15);

    openingAt(p, 0, 0, 9, 0, 1.2, 'window');           // yatak odası 1 penceresi
    openingAt(p, 9, 0, 9, 10, 1.8, 'window');
    openingAt(p, 0, 10, 9, 10, 3.2, 'door');           // giriş
    openingAt(p, 9, 3.4, 6.6, 3.4, 1.2, 'door');       // mutfak kapısı
    openingAt(p, 0, 4.2, 4.6, 4.2, 2.2, 'door');       // yatak odası 1 kapısı
    openingAt(p, 4.6, 6.0, 9, 6.0, 2.6, 'door');       // yatak odası 2 kapısı
    openingAt(p, 0, 8.2, 2.4, 8.2, 1.6, 'door');       // banyo kapısı
    openingAt(p, 0, 10, 0, 0, 7.4, 'window');
    openingAt(p, 9, 10, 0, 10, 5.6, 'window');

    furn(p, 'bed', 2.1, 1.6, 0);
    furn(p, 'wardrobe', 0.5, 3.1, Math.PI / 2);
    furn(p, 'bed', 6.9, 8.2, 0);
    furn(p, 'wardrobe', 8.4, 6.7, 0);
    furn(p, 'sofa', 4.0, 6.7, 0);
    furn(p, 'sofa', 7.6, 4.9, Math.PI / 2);
    furn(p, 'tv', 1.0, 6.5, 0);
    furn(p, 'dining', 2.6, 5.2, 0);
    furn(p, 'chair', 2.6, 4.7, 0);
    furn(p, 'chair', 2.6, 5.75, Math.PI);
    furn(p, 'counter', 8.2, 0.45, 0);
    furn(p, 'sink', 7.0, 0.45, 0);
    furn(p, 'toilet', 0.6, 9.1, 0);
    furn(p, 'shower', 1.85, 9.2, 0);
    furn(p, 'sink', 2.05, 8.45, 0);
    furn(p, 'bookshelf', 4.4, 4.9, 0);
    return p;
  }

  function sampleStudio() {
    const p = newProject('Stüdyo Ofis');
    rect(p, 0, 0, 8.0, 6.0, 0.20);
    w(p, 2.4, 4.4, 2.4, 6, 0.15);           // wc
    w(p, 0, 4.4, 2.4, 4.4, 0.15);

    openingAt(p, 0, 6, 8, 6, 4.0, 'door');             // giriş
    openingAt(p, 0, 4.4, 2.4, 4.4, 1.7, 'door');       // wc kapısı
    openingAt(p, 8, 0, 8, 6, 3.0, 'window');
    openingAt(p, 0, 0, 8, 0, 2.6, 'window');
    openingAt(p, 0, 0, 8, 0, 5.6, 'window');
    openingAt(p, 0, 0, 0, 6, 2.4, 'window');

    furn(p, 'dining', 4.4, 1.6, 0);                    // toplantı masası
    furn(p, 'chair', 4.4, 0.95, 0);
    furn(p, 'chair', 4.4, 2.25, Math.PI);
    furn(p, 'chair', 3.6, 1.6, Math.PI / 2);
    furn(p, 'chair', 5.2, 1.6, -Math.PI / 2);
    furn(p, 'table', 1.2, 2.2, 0);                     // çalışma masaları
    furn(p, 'chair', 1.2, 2.85, Math.PI);
    furn(p, 'table', 2.9, 2.2, 0);
    furn(p, 'chair', 2.9, 2.85, Math.PI);
    furn(p, 'bookshelf', 0.25, 1.6, 0);
    furn(p, 'bookshelf', 0.25, 2.8, 0);
    furn(p, 'sofa', 6.9, 4.9, Math.PI);
    furn(p, 'tv', 6.9, 5.5, Math.PI);
    furn(p, 'counter', 7.6, 3.0, Math.PI / 2);         // mutfak nişi
    furn(p, 'sink', 7.55, 4.4, Math.PI / 2);
    furn(p, 'toilet', 0.6, 5.5, 0);
    furn(p, 'sink', 1.9, 5.6, 0);
    return p;
  }

  /* ---------------- durum, geçmiş, otomatik kayıt ---------------- */
  const STORE_KEY = 'numex.floorplan.project.v1';
  const THEME_KEY = 'numex.floorplan.theme';

  const NF = {
    project: newProject('Yeni Proje'),
    sel: null,          // { kind:'wall'|'opening'|'furniture', id }
    tool: 'select',
    mode: '2d',
    grid: 0.5,
    snapStep: 0.05,
    _hist: [], _hi: -1, _limit: 100,
    _listeners: {},
    _saveTimer: null,

    on(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    emit(ev, data) { (this._listeners[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); },

    snapshot() { return JSON.stringify(this.project); },

    reset(project) {
      this.project = project;
      this.sel = null;
      this._hist = [this.snapshot()];
      this._hi = 0;
      this.emit('model', { reset: true });
      this.emit('change');
    },

    /** modele dokunan her değişiklikten SONRA çağrılır: geçmişe yazar, yayınlar, otomatik kaydeder */
    commit() {
      const s = this.snapshot();
      if (this._hist[this._hi] !== s) {
        this._hist = this._hist.slice(0, this._hi + 1);
        this._hist.push(s);
        if (this._hist.length > this._limit) this._hist.shift();
        this._hi = this._hist.length - 1;
      }
      this.emit('change');
      this.emit('history');
      this.autosave();
    },

    /** seçim gibi model dışı değişiklikler */
    touch() { this.emit('change'); },

    undo() {
      if (this._hi <= 0) return false;
      this._hi -= 1;
      this.project = JSON.parse(this._hist[this._hi]);
      this.sel = null;
      this.emit('model', { restored: true });
      this.emit('change'); this.emit('history'); this.autosave();
      return true;
    },
    redo() {
      if (this._hi >= this._hist.length - 1) return false;
      this._hi += 1;
      this.project = JSON.parse(this._hist[this._hi]);
      this.sel = null;
      this.emit('model', { restored: true });
      this.emit('change'); this.emit('history'); this.autosave();
      return true;
    },
    get canUndo() { return this._hi > 0; },
    get canRedo() { return this._hi < this._hist.length - 1; },

    autosave() {
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORE_KEY, this.snapshot());
          this.emit('saved', { at: Date.now() });
        } catch (e) {
          this.emit('saved', { error: true });
        }
      }, 260);
    },

    loadLocal() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (!p || !Array.isArray(p.walls)) return null;
        return p;
      } catch (e) { return null; }
    },

    saveTheme(t) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} },
    loadTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  };

  global.NF = NF;
  global.NF.CATALOG = CATALOG;
  global.NF.CAT = CAT;
  global.NF.DEFAULTS = DEFAULTS;
  global.NF.G = G;
  global.NF.rooms = rooms;
  global.NF.totalArea = totalArea;
  global.NF.newProject = newProject;
  global.NF.addWall = addWall;
  global.NF.addOpening = addOpening;
  global.NF.addFurniture = addFurniture;
  global.NF.openingsOf = openingsOf;
  global.NF.removeById = removeById;
  global.NF.findById = findById;
  global.NF.bounds = bounds;
  global.NF.uid = uid;
  global.NF.SAMPLES = [
    { id: 'oneplusone', label: '1+1 Küçük Daire', make: sampleOnePlusOne },
    { id: 'family', label: '2+1 Aile Dairesi', make: sampleFamily },
    { id: 'studio', label: 'Stüdyo Ofis', make: sampleStudio }
  ];
})(window);
