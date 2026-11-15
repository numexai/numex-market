'use strict';
/* Numex Living Neighborhood — kamera, giriş ve ana döngü */

const DEG = Math.PI / 180;

function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vcross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vnorm(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function vlerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------------ */
/*  Kamera                                                            */
/* ------------------------------------------------------------------ */
const Cam = {
  mode: 'orbit',
  yaw: 0.72, pitch: 0.58, dist: 150,
  focus: [0, 0, 0],
  walkPos: [0, 1.68, 92],
  walkYaw: Math.PI, walkPitch: -0.02,
  eye: [0, 90, 90],
  target: [0, 0, 0],
  fov: 55 * DEG,
  aspect: 1,
  fly: null,

  orbitEye() {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    return [
      this.focus[0] + this.dist * cp * Math.sin(this.yaw),
      this.focus[1] + this.dist * sp,
      this.focus[2] + this.dist * cp * Math.cos(this.yaw),
    ];
  },

  update(dt) {
    this.aspect = window.innerWidth / Math.max(1, window.innerHeight);

    if (this.mode === 'orbit') {
      this.eye = this.orbitEye();
      this.target = [this.focus[0], this.focus[1] + 1.5, this.focus[2]];
    } else if (this.mode === 'walk') {
      this.eye = this.walkPos.slice();
      const cp = Math.cos(this.walkPitch);
      this.target = [
        this.eye[0] + Math.sin(this.walkYaw) * cp,
        this.eye[1] + Math.sin(this.walkPitch),
        this.eye[2] + Math.cos(this.walkYaw) * cp,
      ];
    } else if (this.mode === 'interior') {
      const ry = this.inYaw || 0, rp = this.inPitch || 0;
      this.eye = [0, 1.62, 2.05];
      this.target = [
        Math.sin(ry) * Math.cos(rp),
        1.5 + Math.sin(rp) * 2,
        -3.2 + Math.cos(ry) * Math.cos(rp) * 2 - 2,
      ];
    }

    if (this.fly) {
      this.fly.t += dt;
      const k = Math.min(1, this.fly.t / this.fly.dur);
      const e = k * k * (3 - 2 * k);
      this.eye = vlerp(this.fly.from, this.fly.to, e);
      this.target = vlerp(this.fly.fromT, this.fly.toT, e);
      if (k >= 1) {
        const cb = this.fly.done;
        this.fly = null;
        if (cb) cb();
      }
    }
  },

  view() {
    return { eye: this.eye, target: this.target, fov: this.fov, aspect: this.aspect };
  },

  overview() {
    this.mode = 'orbit';
    this.yaw = 0.72;
    this.pitch = 1.02;
    this.dist = 205;
    this.focus = [0, 0, 0];
  },

  street() {
    this.mode = 'orbit';
    this.yaw = 0.9;
    this.pitch = 0.28;
    this.dist = 46;
    this.focus = [0, 0, 30];
  },
};

/* ------------------------------------------------------------------ */
/*  giriş: fare, tekerlek, dokunma, klavye                            */
/* ------------------------------------------------------------------ */
const Input = {
  down: false,
  moved: 0,
  lastX: 0, lastY: 0,
  mx: 0, my: 0,
  keys: {},
  dragButton: 0,

  init(canvas, onClick) {
    this.canvas = canvas;
    this.onClick = onClick;

    canvas.addEventListener('mousedown', (e) => {
      this.down = true;
      this.moved = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dragButton = e.button;
      canvas.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      this.mx = e.clientX; this.my = e.clientY;
      if (!this.down) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.drag(dx, dy);
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.down) return;
      this.down = false;
      canvas.classList.remove('is-dragging');
      if (this.moved < 6) this.onClick(e.clientX, e.clientY);
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.0012);
      Cam.dist = clamp(Cam.dist * f, 6, 340);
      if (Cam.mode === 'walk') Cam.walkPos[1] = clamp(Cam.walkPos[1], 1.6, 1.8);
    }, { passive: false });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // dokunma
    let tPrev = null;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.down = true; this.moved = 0;
        this.lastX = t.clientX; this.lastY = t.clientY;
        tPrev = { x: t.clientX, y: t.clientY, d: 0 };
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && tPrev) {
        const t = e.touches[0];
        const dx = t.clientX - this.lastX;
        const dy = t.clientY - this.lastY;
        this.lastX = t.clientX; this.lastY = t.clientY;
        this.moved += Math.abs(dx) + Math.abs(dy);
        tPrev.d += Math.abs(dx) + Math.abs(dy);
        this.drag(dx, dy);
      } else if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (tPrev) Cam.dist = clamp(Cam.dist * (1.02 - (d - tPrev.d) * 0.004), 6, 340);
        tPrev.d = d;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      this.down = false;
      if (tPrev && tPrev.d < 6) this.onClick(this.lastX, this.lastY);
      tPrev = null;
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (Cam.mode === 'orbit') Cam.overview(); else Cam.street();
      }
      if (e.key === 'Escape' && Cam.mode === 'interior') App.exit();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  },

  drag(dx, dy) {
    if (Cam.mode === 'orbit') {
      if (this.dragButton === 2 || this.keys['shift']) {
        // kaydır
        const s = Cam.dist * 0.0016;
        const cy = Math.cos(Cam.yaw), sy = Math.sin(Cam.yaw);
        Cam.focus[0] -= (dx * cy - dy * sy) * s;
        Cam.focus[2] += (dx * sy + dy * cy) * s;
      } else {
        Cam.yaw -= dx * 0.0055;
        Cam.pitch = clamp(Cam.pitch + dy * 0.0045, 0.08, 1.45);
      }
    } else if (Cam.mode === 'walk') {
      Cam.walkYaw -= dx * 0.0042;
      Cam.walkPitch = clamp(Cam.walkPitch - dy * 0.0035, -1.1, 1.1);
    } else if (Cam.mode === 'interior') {
      Cam.inYaw = clamp((Cam.inYaw || 0) - dx * 0.0022, -0.55, 0.55);
      Cam.inPitch = clamp((Cam.inPitch || 0) - dy * 0.0016, -0.35, 0.35);
    }
  },
};

/* ------------------------------------------------------------------ */
/*  yürüyüş                                                           */
/* ------------------------------------------------------------------ */
function walkMove(dt) {
  const k = Input.keys;
  let f = 0, s = 0;
  if (k['w'] || k['arrowup']) f += 1;
  if (k['s'] || k['arrowdown']) f -= 1;
  if (k['a'] || k['arrowleft']) s -= 1;
  if (k['d'] || k['arrowright']) s += 1;
  if (!f && !s) return;

  const spd = (k['shift'] ? 9 : 4.2) * dt;
  const cy = Math.cos(Cam.walkYaw), sy = Math.sin(Cam.walkYaw);
  let nx = Cam.walkPos[0] + (sy * f + cy * s) * spd;
  let nz = Cam.walkPos[2] + (cy * f - sy * s) * spd;

  // bina çarpışması
  const pad = 0.45;
  for (const b of Town.buildings) {
    if (nx > b.bx0 - pad && nx < b.bx1 + pad && nz > b.bz0 - pad && nz < b.bz1 + pad) {
      const dLeft = nx - (b.bx0 - pad);
      const dRight = (b.bx1 + pad) - nx;
      const dTop = nz - (b.bz0 - pad);
      const dBot = (b.bz1 + pad) - nz;
      const m = Math.min(dLeft, dRight, dTop, dBot);
      if (m === dLeft) nx = b.bx0 - pad;
      else if (m === dRight) nx = b.bx1 + pad;
      else if (m === dTop) nz = b.bz0 - pad;
      else nz = b.bz1 + pad;
    }
  }

  Cam.walkPos[0] = clamp(nx, T.X[0] - 20, T.X[1] + 20);
  Cam.walkPos[2] = clamp(nz, T.Z[0] - 20, T.Z[1] + 20);
}

/* ------------------------------------------------------------------ */
/*  ekran ışını                                                       */
/* ------------------------------------------------------------------ */
function screenRay(mx, my, view) {
  const nx = (mx / window.innerWidth) * 2 - 1;
  const ny = 1 - (my / window.innerHeight) * 2;
  const f = vnorm(vsub(view.target, view.eye));
  const r = vnorm(vcross(f, [0, 1, 0]));
  const u = vcross(r, f);
  const tf = Math.tan(view.fov / 2);
  return vnorm([
    f[0] + r[0] * nx * tf * view.aspect + u[0] * ny * tf,
    f[1] + r[1] * nx * tf * view.aspect + u[1] * ny * tf,
    f[2] + r[2] * nx * tf * view.aspect + u[2] * ny * tf,
  ]);
}

/* ------------------------------------------------------------------ */
/*  uygulama                                                          */
/* ------------------------------------------------------------------ */
const App = {
  last: 0,
  hoverT: 0,
  fxDrops: null,
  fxCtx: null,
  building: null,

  boot() {
    const canvas = document.querySelector('#scene');
    if (!GL.init(canvas)) {
      document.querySelector('#loader').innerHTML =
        '<div class="loader-box"><p>Bu tarayıcı WebGL desteklemiyor.<br>Mahalle açılamadı.</p></div>';
      return;
    }

    GL.resize();
    Town.init();
    Life.init();
    Scene.build();
    Scene.prepareActors();
    Scene.makeDoor();
    Scene.makeDoorGlow();

    const fx = document.querySelector('#fx');
    if (fx) {
      this.fxCtx = fx.getContext('2d');
      this.resizeFx();
    }

    UI.init({
      setHour: (h) => Life.setHour(h),
      setWeather: (w) => Life.setWeather(w),
      setSpeed: (v) => Life.setSpeed(v),
      overview: () => { Cam.overview(); UI.interior(false); Scene.activeDoor = null; },
      street: () => {
        Cam.mode = 'walk';
        Cam.walkPos = [0, 1.68, 70];
        Cam.walkYaw = Math.PI;
        Cam.walkPitch = -0.02;
        UI.interior(false);
        Scene.activeDoor = null;
      },
      exit: () => this.exit(),
    });

    Input.init(canvas, (x, y) => this.click(x, y));
    window.addEventListener('resize', () => { GL.resize(); this.resizeFx(); });

    Cam.overview();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    setTimeout(() => UI.loaderDone(), 500);
  },

  resizeFx() {
    const fx = document.querySelector('#fx');
    if (!fx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = Math.floor(window.innerWidth * dpr);
    fx.height = Math.floor(window.innerHeight * dpr);
  },

  click(mx, my) {
    if (Cam.mode === 'interior' || Cam.fly) return;
    const view = Cam.view();
    const ray = screenRay(mx, my, view);
    const hit = Town.rayPick(view.eye, ray, 500);
    if (!hit) return;
    this.enter(hit.b);
  },

  enter(b) {
    const door = b.door;
    const ryBase = FACE_RY[b.face];
    const tx = Math.cos(ryBase), tz = -Math.sin(ryBase);
    const hingeX = door.x - tx * 0.62;
    const hingeZ = door.z - tz * 0.62;

    Scene.activeDoor = {
      b: b, open: 0,
      ox: hingeX, oz: hingeZ,
      nx: door.nx, nz: door.nz,
    };

    const approach = [door.ox + door.nx * 2.2, 1.66, door.oz + door.nz * 2.2];
    Cam.fly = {
      t: 0, dur: 1.25,
      from: Cam.eye.slice(),
      to: approach,
      fromT: Cam.target.slice(),
      toT: [door.x, 1.55, door.z],
      done: () => this.enterInterior(b),
    };
    UI.interior(false);
  },

  enterInterior(b) {
    Scene.buildRoom(b);
    Cam.mode = 'interior';
    Cam.inYaw = 0;
    Cam.inPitch = 0;
    this.building = b;
    UI.interior(true, b.name);
  },

  exit() {
    const b = this.building;
    Scene.activeDoor = null;
    UI.interior(false);
    Cam.mode = 'orbit';
    if (b) {
      const d = b.door;
      Cam.focus = [d.ox, 1.5, d.oz];
      Cam.yaw = Math.atan2(d.nx, d.nz);
      Cam.pitch = 0.28;
      Cam.dist = 22;
    } else {
      Cam.overview();
    }
  },

  frame(ts) {
    const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
    this.last = ts;

    Life.update(dt);
    if (Cam.mode === 'walk') walkMove(dt);
    Cam.update(dt);

    // kapı kanadı yumuşak açılır
    if (Scene.activeDoor) {
      Scene.activeDoor.open += (1 - Scene.activeDoor.open) * Math.min(1, dt * 7);
    }

    const L = Life.lighting();
    if (Cam.mode === 'interior') Scene.drawInterior(Cam.view(), L);
    else Scene.draw(Cam.view(), L);

    // fare altındaki bina adı
    this.hoverT += dt;
    if (this.hoverT > 0.16 && !Input.down && Cam.mode === 'orbit') {
      this.hoverT = 0;
      const v = Cam.view();
      const ray = screenRay(Input.mx, Input.my, v);
      const hit = Town.rayPick(v.eye, ray, 500);
      UI.tip(hit ? hit.b.name : null, Input.mx, Input.my);
    }
    if (Cam.mode !== 'orbit') UI.tip(null);

    UI.tick(Life, dt);
    this.drawFx(dt);
    requestAnimationFrame((t) => this.frame(t));
  },

  /* hava: ekran üstü 2B katman */
  drawFx(dt) {
    const ctx = this.fxCtx;
    if (!ctx) return;
    const fx = ctx.canvas;
    const dpr = fx.width / Math.max(1, window.innerWidth);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const L = Life;
    if (L.wet < 0.02) return;

    if (L.weather === 'rain') {
      if (!this.fxDrops) {
        this.fxDrops = [];
        for (let i = 0; i < 260; i++) {
          this.fxDrops.push({ x: Math.random() * w, y: Math.random() * h, l: 10 + Math.random() * 22, s: 0.6 + Math.random() * 0.8 });
        }
      }
      ctx.strokeStyle = 'rgba(200,225,245,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of this.fxDrops) {
        d.y += 1100 * d.s * dt;
        d.x += 260 * dt;
        if (d.y > h) { d.y = -20; d.x = Math.random() * w; }
        if (d.x > w) d.x -= w;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 5, d.y + d.l);
      }
      ctx.stroke();
    } else if (L.weather === 'snow') {
      if (!this.fxDrops) {
        this.fxDrops = [];
        for (let i = 0; i < 180; i++) {
          this.fxDrops.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.4, s: 0.15 + Math.random() * 0.35, ph: Math.random() * 6.28 });
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const d of this.fxDrops) {
        d.y += 90 * d.s * dt * 6;
        d.ph += dt * 2;
        d.x += Math.sin(d.ph) * 18 * dt;
        if (d.y > h) { d.y = -8; d.x = Math.random() * w; }
        if (d.x < -8) d.x = w + 8;
        if (d.x > w + 8) d.x = -8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, 6.283);
        ctx.fill();
      }
    } else if (L.weather === 'fog') {
      ctx.fillStyle = 'rgba(214,219,224,' + (0.16 * L.wet).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  },
};

window.addEventListener('DOMContentLoaded', () => App.boot());
