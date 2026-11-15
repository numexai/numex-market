'use strict';
/* Numex Living Neighborhood — yaşam simülasyonu
   Yaya, araç, çocuk, saat ve hava. Hepsi yerel kural; hiçbir servis çağrılmıyor. */

const Life = {
  hour: 7.2,
  speed: 2,
  weather: 'clear',
  wet: 0,          // 0 kuru → 1 tam yağış (yumuşak geçiş)
  walkers: [],
  cars: [],
  kids: [],
  drops: [],
  flakes: [],
  elapsed: 0,

  /* ---------------- kurulum ---------------- */
  init() {
    this.hour = 7.2;
    this.wet = 0;
    this.elapsed = 0;

    // yayalar: her yürüyüş halkasına birkaç kişi
    this.walkers = [];
    for (const L of Town.walkLoops) {
      const n = Math.max(1, Math.round(L.len / 62));
      for (let i = 0; i < n; i++) {
        this.walkers.push(this.makeWalker(L, (L.len * i) / n + rr(-6, 6)));
      }
    }

    // araçlar
    this.cars = [];
    for (const lane of Town.lanes) {
      const n = ri(2, 4);
      for (let i = 0; i < n; i++) {
        this.cars.push({
          lane: lane,
          p: rr(-150, 150) * (lane.axis === 'x' ? 1 : 0.75),
          spd: rr(5.5, 9.5),
          color: hex(pick(PAL.car)),
          len: rr(3.6, 4.8),
          bob: rr(0, 6.28),
        });
      }
    }

    // parkta çocuklar
    this.kids = [];
    if (Special.play) {
      for (let i = 0; i < 7; i++) {
        this.kids.push(this.makeKid(Special.play.x + rr(-6, 6), Special.play.z + rr(-6, 6)));
      }
    }

    this.initWeather();
    return this;
  },

  makeWalker(L, s) {
    return {
      L: L,
      s: ((s % L.len) + L.len) % L.len,
      dir: R() < 0.5 ? 1 : -1,
      spd: rr(0.85, 1.55),
      x: 0, z: 0, rot: 0, bob: rr(0, 6.28),
      skin: hex(pick(PAL.skin)),
      shirt: hex(pick(PAL.shirt)),
      pants: hex(pick(['#3c4450', '#4a4038', '#2f3a44', '#5b5348'])),
      hat: R() < 0.18,
      child: R() < 0.22,
      // evine gidiş saati: akşam bazıları eve döner
      homeAt: rr(19, 23),
    };
  },

  makeKid(x, z) {
    return {
      x: x, z: z, vx: rr(-1, 1), vz: rr(-1, 1),
      spd: rr(1.6, 3.1), phase: rr(0, 6.28),
      skin: hex(pick(PAL.skin)),
      shirt: hex(pick(['#e05a3f', '#3f8ee0', '#e0b03f', '#66c07a', '#c07ae0'])),
      pants: hex(pick(['#3c4450', '#4a4038', '#2f3a44', '#5b5348'])),
      home: { x: x, z: z },
      jump: rr(0, 6.28),
      timer: rr(3, 9),
    };
  },

  /* ---------------- ayarlar ---------------- */
  setHour(h) { this.hour = ((h % 24) + 24) % 24; },
  setWeather(w) { this.weather = w; },
  setSpeed(v) { this.speed = v; },

  phaseName() {
    const h = this.hour;
    if (h < 5) return 'Gece';
    if (h < 7.5) return 'Şafak';
    if (h < 11) return 'Sabah';
    if (h < 15) return 'Öğle';
    if (h < 18) return 'İkindi';
    if (h < 20) return 'Akşam';
    if (h < 22.5) return 'Gece Çökerken';
    return 'Gece';
  },

  /** Güneş yüksekliği −1..1 */
  sunHeight() {
    return Math.sin(((this.hour - 6) / 12.6) * Math.PI);
  },

  /** 0 = gündüz, 1 = tam gece */
  darkness() {
    const s = this.sunHeight();
    return Math.max(0, Math.min(1, (0.22 - s) / 0.5));
  },

  /** Işıkların yanma oranı 0..1 */
  lightsOn() {
    return Math.max(0, Math.min(1, (this.darkness() - 0.12) / 0.42));
  },

  /* ---------------- güncelleme ---------------- */
  update(dt) {
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;

    // saat akışı: 1× hızda bir oyun günü 240 saniye
    this.hour += dt * (0.1 * this.speed);
    if (this.hour >= 24) this.hour -= 24;

    const night = this.darkness();
    const rain = this.weather === 'rain';
    const snow = this.weather === 'snow';

    // hava geçişi
    const target = (rain || snow) ? 1 : 0;
    this.wet += (target - this.wet) * Math.min(1, dt * 0.9);

    // --- yayalar ---
    for (const w of this.walkers) {
      // hava yağışlıysa ve gece ise daha yavaş
      let spd = w.spd * (1 - night * 0.35) * (1 - this.wet * 0.2);
      w.s += w.dir * spd * dt;
      if (w.s > w.L.len) w.s -= w.L.len;
      if (w.s < 0) w.s += w.L.len;
      // ara sıra yön değiştir
      if (R() < dt * 0.06) w.dir *= -1;

      const p = loopPoint(w.L, w.s);
      w.x = p.x; w.z = p.z;
      w.rot = Math.atan2(p.dx, p.dz);
      w.bob += dt * spd * 5.2;
    }

    // --- araçlar ---
    const carNight = 0.55 + night * 0.2;
    for (const c of this.cars) {
      c.p += c.spd * c.lane.dir * dt * (1 - this.wet * 0.22);
      c.bob += dt * 4;
      if (c.lane.axis === 'x') {
        if (c.p > 165) c.p = -165;
        if (c.p < -165) c.p = 165;
        c.x = c.p; c.z = c.lane.fixed;
        c.rot = c.lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        if (c.p > 130) c.p = -130;
        if (c.p < -130) c.p = 130;
        c.x = c.lane.fixed; c.z = c.p;
        c.rot = c.lane.dir > 0 ? 0 : Math.PI;
      }
    }

    // --- çocuklar ---
    const dayTime = this.hour > 6.5 && this.hour < 20.5;
    for (const k of this.kids) {
      k.timer -= dt;
      if (k.timer <= 0) {
        k.timer = rr(3, 9);
        const ang = rr(0, 6.28);
        k.vx = Math.cos(ang); k.vz = Math.sin(ang);
      }
      if (!dayTime) {
        // akşam evlerine dönerler
        const dx = k.home.x - k.x, dz = k.home.z - k.z;
        const d = Math.hypot(dx, dz) || 1;
        k.x += (dx / d) * k.spd * 0.4 * dt;
        k.z += (dz / d) * k.spd * 0.4 * dt;
        continue;
      }
      k.phase += dt * 3;
      k.x += k.vx * k.spd * dt;
      k.z += k.vz * k.spd * dt;
      k.jump += dt * 6;

      // park sınırları
      const P = Special.park;
      if (P) {
        if (k.x < P.x0 + 3) { k.x = P.x0 + 3; k.vx = Math.abs(k.vx); }
        if (k.x > P.x1 - 3) { k.x = P.x1 - 3; k.vx = -Math.abs(k.vx); }
        if (k.z < P.z0 + 3) { k.z = P.z0 + 3; k.vz = Math.abs(k.vz); }
        if (k.z > P.z1 - 3) { k.z = P.z1 - 3; k.vz = -Math.abs(k.vz); }
      }
      // oyun grubunun çevresinde dönsünler
      const pl = Special.play;
      if (pl && R() < dt * 0.25) {
        const ang = rr(0, 6.28);
        k.vx = Math.cos(ang); k.vz = Math.sin(ang);
      }
    }
  },

  /* kişi ve araç sayısı */
  counts() {
    return { people: this.walkers.length + this.kids.length, cars: this.cars.length + Town.parked.length };
  },

  /* ---------------- hava parçacıkları ---------------- */
  initWeather() {
    this.drops = [];
    this.flakes = [];
    for (let i = 0; i < 520; i++) {
      this.drops.push({ x: rr(-38, 38), y: rr(-2, 24), z: rr(-38, 38), len: rr(0.5, 1.1) });
    }
    for (let i = 0; i < 340; i++) {
      this.flakes.push({ x: rr(-38, 38), y: rr(-2, 24), z: rr(-38, 38), s: rr(0.06, 0.14), ph: rr(0, 6.28) });
    }
  },

  /** Parçacıkları kameranın çevresinde tut. */
  updateWeather(dt, cam) {
    if (this.wet < 0.02) return;
    const RR = 38, SPAN = RR * 2;
    const isSnow = this.weather === 'snow';
    const wind = isSnow ? 1.1 : 3.2;

    if (isSnow) {
      for (const f of this.flakes) {
        f.y -= 1.7 * dt;
        f.ph += dt * 1.8;
        f.x += Math.sin(f.ph) * 0.55 * dt + wind * dt * 0.25;
        if (f.y < -2) { f.y = 24; f.x = cam[0] + rr(-RR, RR); f.z = cam[2] + rr(-RR, RR); }
        if (f.x < cam[0] - RR) f.x += SPAN;
        if (f.x > cam[0] + RR) f.x -= SPAN;
        if (f.z < cam[2] - RR) f.z += SPAN;
        if (f.z > cam[2] + RR) f.z -= SPAN;
      }
    } else {
      for (const d of this.drops) {
        d.y -= 27 * dt;
        d.x += wind * dt;
        if (d.y < -2) { d.y = 24; d.x = cam[0] + rr(-RR, RR); d.z = cam[2] + rr(-RR, RR); }
        if (d.x < cam[0] - RR) d.x += SPAN;
        if (d.x > cam[0] + RR) d.x -= SPAN;
        if (d.z < cam[2] - RR) d.z += SPAN;
        if (d.z > cam[2] + RR) d.z -= SPAN;
      }
    }
  },

  /* ---------------- gökyüzü ve ışık ---------------- */
  sky() {
    const kf = [
      { h: 0.0, top: [0.035, 0.055, 0.115], bot: [0.075, 0.095, 0.175] },
      { h: 4.4, top: [0.055, 0.080, 0.160], bot: [0.170, 0.180, 0.290] },
      { h: 5.8, top: [0.240, 0.330, 0.520], bot: [0.780, 0.520, 0.380] },
      { h: 6.8, top: [0.420, 0.640, 0.860], bot: [0.900, 0.780, 0.660] },
      { h: 8.5, top: [0.330, 0.590, 0.880], bot: [0.720, 0.850, 0.950] },
      { h: 13.0, top: [0.290, 0.560, 0.880], bot: [0.700, 0.840, 0.960] },
      { h: 17.2, top: [0.350, 0.540, 0.790], bot: [0.830, 0.790, 0.680] },
      { h: 18.6, top: [0.230, 0.290, 0.520], bot: [0.880, 0.480, 0.270] },
      { h: 19.8, top: [0.100, 0.130, 0.260], bot: [0.330, 0.250, 0.310] },
      { h: 21.5, top: [0.045, 0.065, 0.140], bot: [0.110, 0.120, 0.210] },
      { h: 24.0, top: [0.035, 0.055, 0.115], bot: [0.075, 0.095, 0.175] },
    ];
    const h = this.hour;
    let a = kf[0], b = kf[kf.length - 1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (h >= kf[i].h && h <= kf[i + 1].h) { a = kf[i]; b = kf[i + 1]; break; }
    }
    const t = (h - a.h) / Math.max(b.h - a.h, 0.001);
    let top = mixc(a.top, b.top, t);
    let bot = mixc(a.bot, b.bot, t);

    // hava durumu gökyüzünü soldurur
    const gray = this.wet * 0.72;
    const overcast = [0.42, 0.45, 0.50];
    top = mixc(top, overcast, Math.min(gray, 0.85));
    bot = mixc(bot, mixc(overcast, [0.72, 0.74, 0.78], 0.35), Math.min(gray, 0.85));

    if (this.weather === 'fog') {
      top = mixc(top, [0.78, 0.79, 0.80], 0.35);
      bot = mixc(bot, [0.86, 0.87, 0.88], 0.4);
    }
    return { top: top, bot: bot };
  },

  /** Çizim için tüm ışık parametreleri. */
  lighting() {
    const s = this.sunHeight();
    const dayF = Math.max(0, Math.min(1, (s + 0.10) / 0.42));
    const dark = this.darkness();
    const sky = this.sky();

    // gün batımı sıcaklığı
    let dusk = 1 - Math.min(1, Math.abs(this.hour - 18.4) / 1.7);
    dusk = Math.max(0, dusk) * (1 - this.wet * 0.7);

    // güneş yönü: doğudan doğar, batıdan batar
    const az = ((this.hour - 6) / 12.6) * Math.PI;
    const sx = Math.cos(az) * 0.85;
    const sy = Math.max(0.14, Math.abs(Math.sin(az)) * 0.95);
    const sz = 0.38;
    const ln = Math.hypot(sx, sy, sz);
    const lightDir = [sx / ln, sy / ln, sz / ln];

    const sunColor = mixc([0.26, 0.30, 0.46], [1.06, 1.02, 0.92], dayF);
    const ambient = mixc([0.135, 0.155, 0.245], [0.345, 0.365, 0.405], dayF);
    let tint = mixc([0.72, 0.80, 1.0], [1, 1, 1], dayF);
    tint = mixc(tint, [1.16, 0.86, 0.64], dusk * 0.55);
    tint = mixc(tint, [0.72, 0.75, 0.80], this.wet * 0.35);

    const fogColor = mixc(sky.bot, [0.62, 0.65, 0.70], this.wet * 0.5);
    let fogAmount = 0.35 + this.wet * 0.35 + dark * 0.12;
    let fogFar = 320 - this.wet * 120;
    if (this.weather === 'fog') { fogAmount = 0.92; fogFar = 150; }

    return {
      lightDir: lightDir,
      sunColor: sunColor,
      ambient: ambient,
      tint: tint,
      fogColor: mixc(fogColor, sky.bot, 0.35),
      fogNear: 40,
      fogFar: fogFar,
      fogAmount: Math.min(fogAmount, 0.95),
      dayF: dayF,
      dusk: dusk,
      lights: this.lightsOn(),
      sky: sky,
    };
  },
};
