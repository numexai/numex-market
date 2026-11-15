/* ==========================================================================
   physics.js — SAF FİZİK KATMANI
   --------------------------------------------------------------------------
   Bu dosya DOM, canvas, renk, arayüz bilmez. Yalnızca:
     · parça fabrikaları (gövde + kısıt üretimi)
     · sabit adımlı simülasyon çekirdeği
     · serileştirme / geri yükleme
     · sensör ve hedef olayları
   Görsel katman: js/renderer.js  (yalnızca gövde dönüşümlerini OKUR)
   Motor: matter.js 0.20.0 — MIT lisansı
   ========================================================================== */
(function (global) {
  'use strict';

  var M = global.Matter;
  var Engine = M.Engine, World = M.World, Bodies = M.Bodies, Body = M.Body,
      Composite = M.Composite, Constraint = M.Constraint, Events = M.Events,
      Vector = M.Vector, Query = M.Query;

  var WORLD_W = 1600, WORLD_H = 900;
  var FIXED_DT = 1000 / 60;      // ms — sabit fizik adımı
  var MAX_SUBSTEPS = 5;

  /* ---------------------------------------------------------------------
     Parça kataloğu (arayüz bunu okur)
     --------------------------------------------------------------------- */
  var PART_DEFS = {
    ball:     { ad: 'Bilye',           grup: 'Hareketli', ikon: '⬤', ipucu: 'Çelik bilye — yuvarlanır' },
    block:    { ad: 'Blok',            grup: 'Hareketli', ikon: '▢', ipucu: 'Ahşap kutu — köprü/basamak' },
    domino:   { ad: 'Domino',          grup: 'Hareketli', ikon: '▯', ipucu: 'Devrilip yanındakini iter' },
    ramp:     { ad: 'Rampa',           grup: 'Statik',    ikon: '◢', ipucu: 'Eğik metal yol (⟳ döndür)' },
    lever:    { ad: 'Kaldıraç',        grup: 'Mekanizma', ikon: '⚖', ipucu: 'Mafsallı tahterevalli' },
    gear:     { ad: 'Dişli',           grup: 'Mekanizma', ikon: '⚙', ipucu: 'Motorlu çark, komşusunu çevirir' },
    spring:   { ad: 'Yay Fırlatıcı',   grup: 'Mekanizma', ikon: '⌇', ipucu: 'Sıkışmış yay topu fırlatır' },
    platform: { ad: 'H. Platform',     grup: 'Mekanizma', ikon: '▬', ipucu: 'Yukarı-aşağı gider, taşır' },
    pulley:   { ad: 'Makara + İp',     grup: 'Mekanizma', ikon: '⛓', ipucu: 'İp makaradan geçer, ağırlık sallanır' },
    gate:     { ad: 'Başlat Kapısı',   grup: 'Tetik',     ikon: '▮', ipucu: 'Başlatınca açılır, bilyeyi tutar' },
    button:   { ad: 'Tetik Düğmesi',   grup: 'Tetik',     ikon: '◉', ipucu: 'Bir cisim basınca kapılar açılır' },
    bell:     { ad: 'Hedef Zili',      grup: 'Hedef',     ikon: '🔔', ipucu: 'Vurulursa bölüm tamamlanır' }
  };

  /* ---------------------------------------------------------------------
     Parça fabrikası: gövde(ler) + kısıt(lar) üretir
     Dönen: { bodies, constraints, anchor, dynamic, props }
     --------------------------------------------------------------------- */
  function buildPart(type, x, y, angle, props) {
    props = props || {};
    var a = angle || 0;
    var bodies = [], constraints = [], anchor = { x: x, y: y }, dynamic = true;

    function add(b) { bodies.push(b); return b; }

    switch (type) {

      case 'ball':
        add(Bodies.circle(x, y, 18, {
          label: 'ball', density: 0.012, friction: 0.06, frictionStatic: 0.15,
          frictionAir: 0.00018, restitution: 0.42
        }));
        break;

      case 'block':
        add(Bodies.rectangle(x, y, 64, 64, {
          label: 'block', angle: a, density: 0.0022, friction: 0.62,
          frictionStatic: 0.9, restitution: 0.12
        }));
        break;

      case 'domino':
        add(Bodies.rectangle(x, y, 34, 74, {
          label: 'domino', angle: a, density: 0.0006, friction: 0.2,
          frictionStatic: 0.28, restitution: 0.06
        }));
        break;

      case 'ramp':
        dynamic = false;
        add(Bodies.rectangle(x, y, 300, 20, {
          label: 'ramp', isStatic: true, angle: a, friction: 0.36, restitution: 0.16
        }));
        break;

      case 'lever': {
        var beam = add(Bodies.rectangle(x, y, 260, 16, {
          label: 'lever', angle: a, density: 0.0026, friction: 0.5, restitution: 0.08
        }));
        // mafsal: gövde merkezi dünyaya sabitlenir → gerçek tahterevalli
        constraints.push(Constraint.create({
          pointA: { x: x, y: y }, bodyB: beam, pointB: { x: 0, y: 0 },
          stiffness: 0.95, damping: 0.12, length: 0
        }));
        break;
      }

      case 'gear': {
        var gr = 46;
        var gb = add(Bodies.circle(x, y, gr, {
          label: 'gear', angle: a, density: 0.006, friction: 0.92,
          frictionStatic: 1, restitution: 0.04
        }));
        constraints.push(Constraint.create({
          pointA: { x: x, y: y }, bodyB: gb, pointB: { x: 0, y: 0 },
          stiffness: 1, damping: 0.1, length: 0
        }));
        gb.plugin.motor = { speed: props.speed != null ? props.speed : 0.12, dir: props.dir != null ? props.dir : 1 };
        break;
      }

      case 'spring': {
        var dir = { x: Math.sin(a), y: -Math.cos(a) };   // fırlatma yönü (a=0 → yukarı)
        var nrm = { x: Math.cos(a), y: Math.sin(a) };    // yay eksenine dik
        var compress = 46;                                // sıkışma mesafesi (px)
        var px = x - dir.x * compress, py = y - dir.y * compress;
        var plunger = add(Bodies.rectangle(px, py, 76, 20, {
          label: 'spring-plunger', angle: a, density: 0.014, friction: 0.7,
          frictionStatic: 0.9, restitution: 0.02
        }));
        // iki noktadan bağ → plaka dönmez, düz fırlatır
        [-1, 1].forEach(function (s) {
          constraints.push(Constraint.create({
            pointA: { x: x + nrm.x * 26 * s, y: y + nrm.y * 26 * s },
            bodyB: plunger, pointB: { x: 26 * s, y: 0 },
            stiffness: 0.07, damping: 0.02, length: 0
          }));
        });
        // yayın üstündeki top
        add(Bodies.circle(px + dir.x * 26, py + dir.y * 26, 16, {
          label: 'ball', density: 0.004, friction: 0.5, frictionStatic: 0.6,
          frictionAir: 0.0006, restitution: 0.3
        }));
        dynamic = true;
        break;
      }

      case 'platform': {
        dynamic = false;
        var pb = add(Bodies.rectangle(x, y, 210, 20, {
          label: 'platform', isStatic: true, friction: 0.62, restitution: 0.08
        }));
        pb.plugin.platform = {
          baseY: y, amp: props.amp != null ? props.amp : 95,
          speed: props.speed != null ? props.speed : 0.55
        };
        break;
      }

      case 'pulley': {
        dynamic = false;
        var r = 34, spacing = 15, drop = 168;
        add(Bodies.circle(x, y, r, {
          label: 'pulley-wheel', isStatic: true, friction: 0.06, restitution: 0.08
        }));
        var pts = [], i, k, N = Math.round(drop / spacing);
        for (i = N; i >= 0; i--) pts.push({ x: x - r, y: y + i * spacing });
        for (k = 1; k <= 6; k++) {
          var th = Math.PI - (Math.PI * k / 6);
          pts.push({ x: x + Math.cos(th) * r, y: y - Math.sin(th) * r });
        }
        for (i = 1; i <= N; i++) pts.push({ x: x + r, y: y + i * spacing });

        var group = -Math.abs(Math.round(x * 13 + y));  // ip kendi kendine çarpışmasın
        var links = pts.map(function (p) {
          return add(Bodies.circle(p.x, p.y, 6, {
            label: 'rope', density: 0.0009, friction: 0.04, frictionAir: 0.004,
            restitution: 0, collisionFilter: { group: group }
          }));
        });
        for (i = 1; i < links.length; i++) {
          constraints.push(Constraint.create({
            bodyA: links[i - 1], bodyB: links[i],
            pointA: { x: 0, y: 0 }, pointB: { x: 0, y: 0 },
            stiffness: 0.62, damping: 0.16, length: spacing
          }));
        }
        // sol uçta ağırlık
        var wgt = add(Bodies.circle(pts[0].x, pts[0].y + 14, 13, {
          label: 'weight', density: 0.02, friction: 0.7, restitution: 0.05,
          collisionFilter: { group: group }
        }));
        constraints.push(Constraint.create({
          bodyA: links[0], bodyB: wgt, pointA: { x: 0, y: 0 }, pointB: { x: 0, y: 0 },
          stiffness: 0.9, damping: 0.2, length: 14
        }));
        break;
      }

      case 'gate': {
        dynamic = false;
        var g = add(Bodies.rectangle(x, y, 18, 132, {
          label: 'gate', isStatic: true, angle: a, friction: 0.2, restitution: 0.05
        }));
        g.plugin.gate = { open: false, anim: 0 };
        break;
      }

      case 'button': {
        dynamic = false;
        var bt = add(Bodies.rectangle(x, y, 78, 16, {
          label: 'button', isStatic: true, friction: 0.75, restitution: 0
        }));
        bt.plugin.button = { pressed: false, anim: 0 };
        break;
      }

      case 'bell': {
        dynamic = false;
        var be = add(Bodies.circle(x, y, 30, {
          label: 'bell', isStatic: true, isSensor: true, restitution: 0.5, friction: 0.4
        }));
        be.plugin.bell = { rung: false, ringT: 0, hits: 0 };
        break;
      }

      default:
        throw new Error('Bilinmeyen parça türü: ' + type);
    }

    bodies.forEach(function (b) { b.plugin = b.plugin || {}; b.plugin.partType = type; });
    return { bodies: bodies, constraints: constraints, anchor: anchor, dynamic: dynamic, props: props };
  }

  /* ---------------------------------------------------------------------
     Dünya
     --------------------------------------------------------------------- */
  function Contraption(opts) {
    opts = opts || {};
    var self = this;
    this.engine = Engine.create({ enableSleeping: false });
    this.engine.gravity.y = 0.95;
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 6;
    this.engine.constraintIterations = 4;
    this.world = this.engine.world;

    this.parts = [];
    this.seq = 1;
    this.running = false;
    this.started = false;
    this.timeScale = 1;
    this.simTime = 0;      // ms
    this.acc = 0;
    this.impacts = [];     // render için görsel kıvılcım kayıtları (fizik değil)
    this.stats = { hits: 0, dominoToppled: 0, bells: 0 };
    this.hooks = { bell: null, stall: null, rest: null, collide: null };
    this.stallTimer = 0;
    this.declared = false;

    this.bounds = this._makeBounds();

    Events.on(this.engine, 'collisionStart', function (ev) {
      self._onCollisionStart(ev);
    });
  }

  Contraption.prototype._makeBounds = function () {
    var t = 60;
    var floor = Bodies.rectangle(WORLD_W / 2, WORLD_H + t / 2 - 22, WORLD_W + 400, t, {
      isStatic: true, friction: 0.7, restitution: 0.15, label: 'floor'
    });
    var left = Bodies.rectangle(-t / 2 - 6, WORLD_H / 2, t, WORLD_H * 2, { isStatic: true, label: 'wall-l' });
    var right = Bodies.rectangle(WORLD_W + t / 2 + 6, WORLD_H / 2, t, WORLD_H * 2, { isStatic: true, label: 'wall-r' });
    Composite.add(this.world, [floor, left, right]);
    return { floor: floor, left: left, right: right };
  };

  /* --- parça ekleme --- */
  Contraption.prototype.addPart = function (type, x, y, angle, props, locked) {
    var built = buildPart(type, x, y, angle || 0, props || {});
    var id = 'p' + (this.seq++);
    for (var i = 0; i < built.bodies.length; i++) built.bodies[i].plugin.partId = id;
    Composite.add(this.world, built.bodies);
    if (built.constraints.length) Composite.add(this.world, built.constraints);

    var part = {
      id: id, type: type, x: x, y: y, angle: angle || 0,
      props: built.props, bodies: built.bodies, constraints: built.constraints,
      anchor: built.anchor, dynamic: built.dynamic, locked: !!locked,
      def: PART_DEFS[type]
    };
    this.parts.push(part);
    return part;
  };

  Contraption.prototype.getPart = function (id) {
    for (var i = 0; i < this.parts.length; i++) if (this.parts[i].id === id) return this.parts[i];
    return null;
  };

  Contraption.prototype.getPartByBody = function (body) {
    if (!body || !body.plugin || !body.plugin.partId) return null;
    return this.getPart(body.plugin.partId);
  };

  Contraption.prototype.removePart = function (part) {
    if (!part) return false;
    Composite.remove(this.world, part.bodies);
    if (part.constraints.length) Composite.remove(this.world, part.constraints);
    var i = this.parts.indexOf(part);
    if (i >= 0) this.parts.splice(i, 1);
    return true;
  };

  Contraption.prototype.clearParts = function (keepLocked) {
    var list = this.parts.slice();
    for (var i = 0; i < list.length; i++) {
      if (keepLocked && list[i].locked) continue;
      this.removePart(list[i]);
    }
  };

  Contraption.prototype.rebuildPart = function (part, changes) {
    var x = changes && changes.x != null ? changes.x : part.x;
    var y = changes && changes.y != null ? changes.y : part.y;
    var a = changes && changes.angle != null ? changes.angle : part.angle;
    var pr = changes && changes.props ? changes.props : part.props;
    var locked = part.locked;
    this.removePart(part);
    return this.addPart(part.type, x, y, a, pr, locked);
  };

  /* --- taşıma: gövdeleri + dünya mafsallarını kaydır --- */
  Contraption.prototype.movePart = function (part, dx, dy) {
    for (var i = 0; i < part.bodies.length; i++) {
      Body.translate(part.bodies[i], { x: dx, y: dy });
    }
    for (var j = 0; j < part.constraints.length; j++) {
      var c = part.constraints[j];
      if (!c.bodyA && c.pointA) { c.pointA.x += dx; c.pointA.y += dy; }
    }
    part.x += dx; part.y += dy;
    part.anchor.x += dx; part.anchor.y += dy;
    for (var k = 0; k < part.bodies.length; k++) {
      var pl = part.bodies[k].plugin.platform;
      if (pl) pl.baseY += dy;
    }
  };

  /* --- çalıştırma --- */
  Contraption.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.started = true;
    this.declared = false;
    this.stallTimer = 0;
    this.acc = 0;
  };

  Contraption.prototype.pause = function () {
    this.running = false;
  };

  Contraption.prototype.setSlowMotion = function (on) {
    this.timeScale = on ? 0.32 : 1;
  };

  /* --- çekirdek adım (sabit dt) --- */
  Contraption.prototype.step = function (realDt) {
    if (!this.running) return 0;
    this.acc += Math.min(realDt, 80) * this.timeScale;
    var n = 0;
    while (this.acc >= FIXED_DT && n < MAX_SUBSTEPS) {
      this._advance();
      this.acc -= FIXED_DT;
      n++;
    }
    return n;
  };

  Contraption.prototype._advance = function () {
    this.simTime += FIXED_DT;
    var t = this.simTime / 1000;

    for (var i = 0; i < this.parts.length; i++) {
      var bodies = this.parts[i].bodies;
      for (var j = 0; j < bodies.length; j++) {
        var b = bodies[j];

        // motorlu dişli: sabit açısal hız (motor) — komşusuna torku çarpışmayla geçer
        if (b.plugin && b.plugin.motor) {
          Body.setAngularVelocity(b, b.plugin.motor.speed * b.plugin.motor.dir);
        }
        // hareketli platform: kinematik salınım (konum + hız birlikte)
        if (b.plugin && b.plugin.platform) {
          var pl = b.plugin.platform;
          var ny = pl.baseY + Math.sin(t * pl.speed * Math.PI * 2) * pl.amp;
          Body.setVelocity(b, { x: 0, y: (ny - b.position.y) * 60 / 1000 * 16.6667 });
          Body.setPosition(b, { x: b.position.x, y: ny });
        }
      }
    }

    Engine.update(this.engine, FIXED_DT);

    this._checkButtons();
    this._checkGates();
    this._checkDominoes();
    this._checkRest();
    this._prune();
  };

  Contraption.prototype._checkButtons = function () {
    var dyn = [];
    for (var i = 0; i < this.parts.length; i++) {
      var bs = this.parts[i].bodies;
      for (var j = 0; j < bs.length; j++) {
        if (!bs[j].isStatic) dyn.push(bs[j]);
      }
    }
    for (var p = 0; p < this.parts.length; p++) {
      var part = this.parts[p];
      for (var k = 0; k < part.bodies.length; k++) {
        var b = part.bodies[k];
        if (!b.plugin || !b.plugin.button || b.plugin.button.pressed) continue;
        for (var d = 0; d < dyn.length; d++) {
          var o = dyn[d];
          if (o.plugin && o.plugin.partId === part.id) continue;
          if (Query.region([o], b.bounds).length > 0) {
            b.plugin.button.pressed = true;
            b.plugin.button.anim = 1;
            this.openAllGates();
            if (this.hooks.collide) this.hooks.collide({ type: 'button', part: part });
            break;
          }
        }
      }
    }
  };

  Contraption.prototype.openAllGates = function () {
    var any = false;
    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      for (var j = 0; j < part.bodies.length; j++) {
        var b = part.bodies[j];
        if (!b.plugin || !b.plugin.gate || b.plugin.gate.open) continue;
        b.plugin.gate.open = true;
        b.collisionFilter.mask = 0;   // temassız: kapı açıldı
        any = true;
      }
    }
    return any;
  };

  /** Başlat kapıları: simülasyon başlayınca kendiliğinden açılır. */
  Contraption.prototype._checkGates = function () {
    if (!this.started) return;
    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      for (var j = 0; j < part.bodies.length; j++) {
        var b = part.bodies[j];
        if (b.plugin && b.plugin.gate && !b.plugin.gate.open && this.simTime > 260) {
          b.plugin.gate.open = true;
          b.collisionFilter.mask = 0;
        }
      }
    }
  };

  Contraption.prototype._checkDominoes = function () {
    var n = 0;
    for (var i = 0; i < this.parts.length; i++) {
      var bs = this.parts[i].bodies;
      for (var j = 0; j < bs.length; j++) {
        var b = bs[j];
        if (b.label !== 'domino') continue;
        var tilt = Math.abs(normalizeAngle(b.angle));
        if (tilt > Math.PI / 4) n++;
      }
    }
    this.stats.dominoToppled = n;
  };

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  /** Makine durdu mu? (hedefe ulaşmadan hareketsizlik = başarısız) */
  Contraption.prototype._checkRest = function () {
    var maxSpeed = 0;
    for (var i = 0; i < this.parts.length; i++) {
      var bs = this.parts[i].bodies;
      for (var j = 0; j < bs.length; j++) {
        var b = bs[j];
        if (b.isStatic) continue;
        var s = Math.hypot(b.velocity.x, b.velocity.y) + Math.abs(b.angularVelocity) * 12;
        if (s > maxSpeed) maxSpeed = s;
      }
    }
    var hasMotor = false;
    for (var p = 0; p < this.parts.length; p++) {
      for (var q = 0; q < this.parts[p].bodies.length; q++) {
        if (this.parts[p].bodies[q].plugin &&
            (this.parts[p].bodies[q].plugin.motor || this.parts[p].bodies[q].plugin.platform)) hasMotor = true;
      }
    }
    if (maxSpeed < 0.22 && !hasMotor) {
      this.stallTimer += FIXED_DT;
      if (this.stallTimer > 1600 && this.hooks.stall && !this.declared) {
        this.declared = true;
        this.hooks.stall();
      }
    } else {
      this.stallTimer = 0;
    }
  };

  Contraption.prototype._prune = function () {
    for (var i = this.parts.length - 1; i >= 0; i--) {
      var part = this.parts[i];
      if (part.type === 'bell' || part.type === 'pulley' || part.type === 'ramp') continue;
      var allOut = true;
      for (var j = 0; j < part.bodies.length; j++) {
        var b = part.bodies[j];
        if (!b.isStatic && b.position.y < WORLD_H + 320 && b.position.x > -300 && b.position.x < WORLD_W + 300) {
          allOut = false;
        }
      }
      if (allOut && !part.locked) this.removePart(part);
    }
  };

  /* --- çarpışma olayları --- */
  Contraption.prototype._onCollisionStart = function (ev) {
    for (var i = 0; i < ev.pairs.length; i++) {
      var p = ev.pairs[i], a = p.bodyA, b = p.bodyB;
      var rel = Vector.sub(a.velocity || { x: 0, y: 0 }, b.velocity || { x: 0, y: 0 });
      var mag = Math.hypot(rel.x, rel.y);

      if (mag > 1.4) {
        this.stats.hits++;
        var pt = p.collision && p.collision.supports && p.collision.supports[0]
          ? p.collision.supports[0]
          : { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
        this.impacts.push({ x: pt.x, y: pt.y, mag: Math.min(mag, 14), t: 0 });
        if (this.impacts.length > 60) this.impacts.shift();
        if (this.hooks.collide) this.hooks.collide({ type: 'impact', x: pt.x, y: pt.y, mag: mag });
      }

      var bellBody = (a.plugin && a.plugin.bell) ? a : ((b.plugin && b.plugin.bell) ? b : null);
      if (bellBody) {
        var other = bellBody === a ? b : a;
        if (other.isStatic) continue;
        bellBody.plugin.bell.rung = true;
        bellBody.plugin.bell.ringT = 1;
        bellBody.plugin.bell.hits++;
        this.stats.bells++;
        var hitPart = this.getPartByBody(other);
        if (this.hooks.bell) {
          this.hooks.bell({
            part: this.getPartByBody(bellBody),
            bodyLabel: other.label,
            hitPartType: hitPart ? hitPart.type : null,
            speed: mag
          });
        }
      }
    }
  };

  /* --- serileştirme --- */
  Contraption.prototype.serialize = function () {
    return {
      app: 'numex-contraption-lab',
      version: 1,
      savedAt: new Date().toISOString(),
      parts: this.parts.filter(function (p) { return !p.locked; }).map(function (p) {
        return {
          type: p.type,
          x: Math.round(p.x * 10) / 10,
          y: Math.round(p.y * 10) / 10,
          a: Math.round(p.angle * 1000) / 1000,
          props: p.props || {}
        };
      })
    };
  };

  /** data.parts → sahneye yükle (kilitli temel parçalar korunur) */
  Contraption.prototype.load = function (data, keepLocked) {
    if (!data || !Array.isArray(data.parts)) throw new Error('Geçersiz makine dosyası');
    if (keepLocked !== true) this.clearParts(false);
    else this.clearParts(true);
    for (var i = 0; i < data.parts.length; i++) {
      var p = data.parts[i];
      if (!PART_DEFS[p.type]) continue;
      this.addPart(p.type, p.x, p.y, p.a || 0, p.props || {});
    }
    this.simTime = 0;
    this.stats = { hits: 0, dominoToppled: 0, bells: 0 };
    this.impacts.length = 0;
    this.started = false;
    this.declared = false;
    this.stallTimer = 0;
  };

  Contraption.prototype.userPartCount = function () {
    var n = 0;
    for (var i = 0; i < this.parts.length; i++) if (!this.parts[i].locked) n++;
    return n;
  };

  Contraption.prototype.distinctUserTypes = function () {
    var set = {};
    for (var i = 0; i < this.parts.length; i++) if (!this.parts[i].locked) set[this.parts[i].type] = 1;
    return Object.keys(set);
  };

  /* dışa aktarım */
  global.NumexPhysics = {
    M: M,
    WORLD_W: WORLD_W,
    WORLD_H: WORLD_H,
    PART_DEFS: PART_DEFS,
    Contraption: Contraption,
    buildPart: buildPart
  };
})(window);
