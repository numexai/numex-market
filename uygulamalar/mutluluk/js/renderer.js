/* ==========================================================================
   renderer.js — GÖRSEL KATMAN (fizikten tamamen bağımsız)
   --------------------------------------------------------------------------
   Fizik motorunun ürettiği konum/açı değerlerini OKUR, çizer.
   Hiçbir gövdeyi hareket ettirmez, hiçbir hesabı değiştirmez.
   ========================================================================== */
(function (global) {
  'use strict';

  var P = global.NumexPhysics;
  var WW = P.WORLD_W, WH = P.WORLD_H;

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1; this.ox = 0; this.oy = 0;
    this.w = 0; this.h = 0; this.dpr = 1;
    this.t = 0;
    this.resize();
  }

  Renderer.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.scale = Math.min(this.w / WW, this.h / WH);
    this.ox = (this.w - WW * this.scale) / 2;
    this.oy = (this.h - WH * this.scale) / 2;
  };

  Renderer.prototype.toWorld = function (px, py) {
    return { x: (px - this.ox) / this.scale, y: (py - this.oy) / this.scale };
  };

  /* ---------------- ana çizim ---------------- */
  Renderer.prototype.render = function (world, view) {
    var ctx = this.ctx, s = this.scale, d = this.dpr;
    this.t += 1 / 60;
    view = view || {};

    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    this._background(ctx);

    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.scale(s, s);

    // statikler önce, hareketliler sonra
    var statics = [], dyns = [];
    for (var i = 0; i < world.parts.length; i++) {
      (world.parts[i].dynamic ? dyns : statics).push(world.parts[i]);
    }
    var j;
    for (j = 0; j < statics.length; j++) this._part(ctx, statics[j], world, view);
    for (j = 0; j < dyns.length; j++) this._part(ctx, dyns[j], world, view);

    this._impacts(ctx, world);
    this._selection(ctx, world, view);
    ctx.restore();

    this._frame(ctx);
  };

  /* ---------------- zemin ---------------- */
  Renderer.prototype._background = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0a1526');
    g.addColorStop(0.55, '#081120');
    g.addColorStop(1, '#050a12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    // ışık huzmesi
    var rg = ctx.createRadialGradient(this.w * 0.3, this.h * 0.1, 10, this.w * 0.3, this.h * 0.1, this.w * 0.75);
    rg.addColorStop(0, 'rgba(60,150,210,.16)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.scale(this.scale, this.scale);

    // blueprint ızgara
    ctx.lineWidth = 1 / this.scale;
    var step = 50;
    ctx.strokeStyle = 'rgba(102,233,255,.055)';
    ctx.beginPath();
    for (var x = 0; x <= WW; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, WH); }
    for (var y = 0; y <= WH; y += step) { ctx.moveTo(0, y); ctx.lineTo(WW, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(102,233,255,.11)';
    ctx.beginPath();
    for (var x2 = 0; x2 <= WW; x2 += step * 4) { ctx.moveTo(x2, 0); ctx.lineTo(x2, WH); }
    for (var y2 = 0; y2 <= WH; y2 += step * 4) { ctx.moveTo(0, y2); ctx.lineTo(WW, y2); }
    ctx.stroke();

    // zemin platformu
    var fy = WH - 22;
    var fg = ctx.createLinearGradient(0, fy, 0, WH);
    fg.addColorStop(0, 'rgba(102,233,255,.18)');
    fg.addColorStop(0.12, 'rgba(30,60,90,.85)');
    fg.addColorStop(1, 'rgba(8,16,26,.95)');
    ctx.fillStyle = fg;
    ctx.fillRect(-40, fy, WW + 80, 80);
    ctx.strokeStyle = 'rgba(102,233,255,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-40, fy); ctx.lineTo(WW + 40, fy); ctx.stroke();

    // zemin tırtıkları
    ctx.strokeStyle = 'rgba(102,233,255,.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var tx = 0; tx < WW; tx += 40) { ctx.moveTo(tx, fy + 6); ctx.lineTo(tx + 18, fy + 6); }
    ctx.stroke();

    ctx.restore();
// NUMEX-DÜZELTME (2026-11-15): Sahne 16:9 iken panel daha kare olduğunda zemin çizgisi tuvalin ortasında kalıp altında boş koyu alan bırakıyordu; zemini ekran koordinatında tuvalin altına kadar uzatarak görsel boşluğu kaldırdım.

    // zemin bandını kalan dikey boşluğa da uzat (mektup kutusu görünümünü kaldırır)
    var fyScreen = this.oy + (WH - 22) * this.scale;
    if (fyScreen < this.h) {
      var under = ctx.createLinearGradient(0, fyScreen, 0, this.h);
      under.addColorStop(0, '#122234');
      under.addColorStop(0.25, '#0a1420');
      under.addColorStop(1, '#050a12');
      ctx.fillStyle = under;
      ctx.fillRect(0, fyScreen, this.w, this.h - fyScreen);
      ctx.strokeStyle = 'rgba(102,233,255,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, fyScreen); ctx.lineTo(this.w, fyScreen); ctx.stroke();
    }
  };

  /* ---------------- vinyet / çerçeve ---------------- */
  Renderer.prototype._frame = function (ctx) {
    var g = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35,
                                    this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  };

  /* ---------------- parça yönlendirme ---------------- */
  Renderer.prototype._part = function (ctx, part, world, view) {
    for (var i = 0; i < part.bodies.length; i++) {
      var b = part.bodies[i];
      switch (part.type) {
        case 'ball': this._ball(ctx, b, view); break;
        case 'block': this._block(ctx, b); break;
        case 'domino': this._domino(ctx, b, view); break;
        case 'ramp': this._ramp(ctx, b); break;
        case 'lever': this._lever(ctx, b, part); break;
        case 'gear': this._gear(ctx, b); break;
        case 'spring': this._spring(sctx(ctx), b, part, i); break;
        case 'platform': this._platform(ctx, b); break;
        case 'pulley': this._pulley(ctx, b, part, i); break;
        case 'gate': this._gate(ctx, b); break;
        case 'button': this._button(ctx, b); break;
        case 'bell': this._bell(ctx, b, view); break;
      }
    }
  };
  function sctx(c) { return c; }

  /* ---------------- yardımcılar ---------------- */
  function poly(ctx, verts) {
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (var i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
    ctx.closePath();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------------- bilye ---------------- */
  Renderer.prototype._ball = function (ctx, b, view) {
    var r = b.circleRadius || 18;
    var x = b.position.x, y = b.position.y;

    // gölge
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r * 0.95, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.18, '#d8ecff');
    g.addColorStop(0.5, '#7fa6c4');
    g.addColorStop(0.82, '#3d5a75');
    g.addColorStop(1, '#1d2f42');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = 'rgba(160,220,255,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, r - 0.6, 0, Math.PI * 2); ctx.stroke();

    // dönme işareti
    ctx.save();
    ctx.translate(x, y); ctx.rotate(b.angle);
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-r * 0.55, 0); ctx.lineTo(r * 0.55, 0); ctx.stroke();
    ctx.restore();

    // hız izi
    var sp = Math.hypot(b.velocity.x, b.velocity.y);
    if (sp > 4) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.4, sp / 40);
      ctx.strokeStyle = '#8fe8ff';
      ctx.lineWidth = r * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - b.velocity.x * 1.6, y - b.velocity.y * 1.6);
      ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------------- blok ---------------- */
  Renderer.prototype._block = function (ctx, b) {
    ctx.save();
    poly(ctx, b.vertices);
    var c = { x: b.position.x, y: b.position.y };
    var g = ctx.createLinearGradient(c.x - 40, c.y - 40, c.x + 40, c.y + 40);
    g.addColorStop(0, '#c08b52');
    g.addColorStop(0.5, '#9a6b3c');
    g.addColorStop(1, '#6d4a29');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,160,.45)';
    ctx.lineWidth = 2; ctx.stroke();

    // ahşap damarları
    ctx.save(); poly(ctx, b.vertices); ctx.clip();
    ctx.strokeStyle = 'rgba(60,35,15,.35)';
    ctx.lineWidth = 1.4;
    for (var i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x - 40, c.y + i * 13);
      ctx.bezierCurveTo(c.x - 10, c.y + i * 13 - 4, c.x + 10, c.y + i * 13 + 4, c.x + 40, c.y + i * 13);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- domino ---------------- */
  Renderer.prototype._domino = function (ctx, b, view) {
    ctx.save();
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(b.position.x - 20, b.position.y - 40, b.position.x + 20, b.position.y + 40);
    g.addColorStop(0, '#fdfbf3');
    g.addColorStop(0.6, '#e7e2d2');
    g.addColorStop(1, '#c3bda9');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(120,130,140,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    // noktalar (gövde yerel ekseninde)
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    ctx.fillStyle = '#5b6470';
    [[0, -16], [0, 16]].forEach(function (p) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 3.4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(90,100,115,.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
    ctx.restore();
  };

  /* ---------------- rampa ---------------- */
  Renderer.prototype._ramp = function (ctx, b) {
    ctx.save();
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(b.position.x - 150, b.position.y - 10, b.position.x + 150, b.position.y + 10);
    g.addColorStop(0, '#b9c9dc');
    g.addColorStop(0.35, '#8497ae');
    g.addColorStop(1, '#4a5a70');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(180,225,255,.55)'; ctx.lineWidth = 2; ctx.stroke();

    // üst yüz çizgisi + tırtık
    ctx.save(); poly(ctx, b.vertices); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.position.x - 160, b.position.y - 6);
    ctx.lineTo(b.position.x + 160, b.position.y - 6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,50,70,.35)';
    for (var i = -140; i <= 140; i += 22) {
      ctx.beginPath();
      ctx.moveTo(b.position.x + i, b.position.y - 2);
      ctx.lineTo(b.position.x + i + 8, b.position.y + 4);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- kaldıraç ---------------- */
  Renderer.prototype._lever = function (ctx, b, part) {
    // mafsal ayağı
    var ax = part.anchor.x, ay = part.anchor.y;
    ctx.save();
    ctx.fillStyle = 'rgba(255,178,77,.85)';
    ctx.beginPath();
    ctx.moveTo(ax, ay - 26);
    ctx.lineTo(ax + 17, ay + 6);
    ctx.lineTo(ax - 17, ay + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,160,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    ctx.save();
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(b.position.x - 130, b.position.y, b.position.x + 130, b.position.y);
    g.addColorStop(0, '#d98a4a');
    g.addColorStop(0.5, '#b96a32');
    g.addColorStop(1, '#8a4c22');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,150,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // mafsal pimi
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe4b0'; ctx.fill();
  };

  /* ---------------- dişli ---------------- */
  Renderer.prototype._gear = function (ctx, b) {
    var r = b.circleRadius || 46;
    var teeth = 12;
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);

    // gövde
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#8fa6bd');
    g.addColorStop(0.45, '#5b7391');
    g.addColorStop(1, '#2b3c52');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // dişler
    ctx.fillStyle = '#7d93ab';
    for (var i = 0; i < teeth; i++) {
      var a = (i / teeth) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillRect(-6, -r - 7, 12, 10);
      ctx.restore();
    }

    // göbek
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#22303f'; ctx.fill();
    ctx.strokeStyle = 'rgba(150,230,255,.55)'; ctx.lineWidth = 2; ctx.stroke();

    // kollar
    ctx.strokeStyle = 'rgba(200,235,255,.28)'; ctx.lineWidth = 3;
    for (var k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(k * Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(r * 0.3, 0); ctx.lineTo(r * 0.85, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // dönme halkası
    ctx.save();
    ctx.strokeStyle = 'rgba(102,233,255,.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 7]);
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };

  /* ---------------- yay ---------------- */
  Renderer.prototype._spring = function (ctx, b, part, idx) {
    if (b.label === 'ball') { this._ball(ctx, b, {}); return; }
    if (b.label !== 'spring-plunger') return;

    var ax = part.anchor.x, ay = part.anchor.y;
    var bx = b.position.x, by = b.position.y;
    var a = b.angle;
    var dx = Math.sin(a), dy = -Math.cos(a);     // eksen
    var nx = Math.cos(a), ny = Math.sin(a);      // dik

    // taban plakası
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(70,95,120,.95)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-34, -8, 68, 16, 5) : ctx.rect(-34, -8, 68, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,220,255,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    // helezon yay
    var dist = Math.hypot(bx - ax, by - ay);
    var coils = 7;
    ctx.strokeStyle = 'rgba(255,178,77,.9)';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    var steps = coils * 2;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var px = lerp(ax, bx + dx * 8, t);
      var py = lerp(ay, by + dy * 8, t);
      var off = Math.sin(t * Math.PI * 2 * coils) * 13;
      if (i === 0) ctx.moveTo(px + nx * off, py + ny * off);
      else ctx.lineTo(px + nx * off, py + ny * off);
    }
    ctx.stroke();

    // itici plaka
    ctx.save();
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(bx - 40, by - 10, bx + 40, by + 10);
    g.addColorStop(0, '#ffd79b');
    g.addColorStop(1, '#d98a3a');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.75)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // yön oku
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#66e9ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax + dx * 34, ay + dy * 34);
    ctx.lineTo(ax + dx * 52, ay + dy * 52);
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------- platform ---------------- */
  Renderer.prototype._platform = function (ctx, b) {
    ctx.save();
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(b.position.x, b.position.y - 12, b.position.x, b.position.y + 12);
    g.addColorStop(0, '#7fe0c0');
    g.addColorStop(0.5, '#2f8f78');
    g.addColorStop(1, '#175344');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(150,255,220,.6)'; ctx.lineWidth = 2; ctx.stroke();

    // tehlike şeritleri
    ctx.save(); poly(ctx, b.vertices); ctx.clip();
    ctx.strokeStyle = 'rgba(10,30,25,.5)'; ctx.lineWidth = 5;
    for (var i = -110; i < 110; i += 20) {
      ctx.beginPath();
      ctx.moveTo(b.position.x + i, b.position.y + 10);
      ctx.lineTo(b.position.x + i + 14, b.position.y - 10);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    // hareket oku
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#7fe0c0'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.position.x + 92, b.position.y + 22);
    ctx.lineTo(b.position.x + 92, b.position.y + 40);
    ctx.moveTo(b.position.x + 86, b.position.y + 34);
    ctx.lineTo(b.position.x + 92, b.position.y + 40);
    ctx.lineTo(b.position.x + 98, b.position.y + 34);
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------- makara + ip ---------------- */
  Renderer.prototype._pulley = function (ctx, b, part, idx) {
    if (b.label === 'rope') return;   // ip en sonda topluca çizilir
    if (b.label === 'weight') {
      ctx.save();
      ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.circleRadius, 0, Math.PI * 2);
      var g = ctx.createRadialGradient(b.position.x - 5, b.position.y - 5, 2, b.position.x, b.position.y, b.circleRadius);
      g.addColorStop(0, '#ffe3a8');
      g.addColorStop(1, '#8a6320');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,170,.7)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
      return;
    }
    if (b.label !== 'pulley-wheel') return;

    // ip (bağlantı noktalarından sırayla)
    var links = part.bodies.filter(function (x) { return x.label === 'rope'; });
    if (links.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#d8c49a';
      ctx.lineWidth = 3.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(links[0].position.x, links[0].position.y);
      for (var i = 1; i < links.length; i++) {
        var m = links[i - 1].position, n = links[i].position;
        ctx.quadraticCurveTo(m.x, m.y, (m.x + n.x) / 2, (m.y + n.y) / 2);
      }
      var last = links[links.length - 1].position;
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(60,45,25,.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // makara tekerleği
    var r = b.circleRadius;
    ctx.save();
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(b.position.x - r * 0.4, b.position.y - r * 0.4, 4, b.position.x, b.position.y, r);
    g.addColorStop(0, '#c9d8e8');
    g.addColorStop(0.6, '#6d819a');
    g.addColorStop(1, '#33455c');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(170,225,255,.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20,35,50,.75)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#9fd8f5'; ctx.fill();
    ctx.restore();

    // askı çubuğu
    ctx.save();
    ctx.strokeStyle = 'rgba(150,190,220,.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.position.x, b.position.y - r);
    ctx.lineTo(b.position.x, b.position.y - r - 26);
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------- kapı ---------------- */
  Renderer.prototype._gate = function (ctx, b) {
    var open = b.plugin.gate.open ? 1 : 0;
    ctx.save();
    ctx.globalAlpha = open ? 0.18 : 1;
    poly(ctx, b.vertices);
    var g = ctx.createLinearGradient(b.position.x - 10, b.position.y, b.position.x + 10, b.position.y);
    g.addColorStop(0, '#5cf0a8');
    g.addColorStop(1, '#12925c');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(160,255,210,.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    if (!open) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.t * 4) * 0.15;
      ctx.strokeStyle = '#7cf5c0'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, 42, -0.9, 0.9);
      ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------------- düğme ---------------- */
  Renderer.prototype._button = function (ctx, b) {
    var pressed = b.plugin.button.pressed;
    ctx.save();
    // taban
    ctx.fillStyle = 'rgba(40,58,78,.95)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(b.position.x - 46, b.position.y - 10, 92, 20, 6);
    else ctx.rect(b.position.x - 46, b.position.y - 10, 92, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,200,.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // kubbe
    var g = ctx.createRadialGradient(b.position.x - 6, b.position.y - (pressed ? 2 : 8), 2,
                                     b.position.x, b.position.y - 2, 20);
    g.addColorStop(0, pressed ? '#ffd9de' : '#b6ffd8');
    g.addColorStop(1, pressed ? '#c2384a' : '#1f8f55');
    ctx.beginPath();
    ctx.ellipse(b.position.x, b.position.y - (pressed ? 2 : 6), 20, pressed ? 6 : 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  };

  /* ---------------- zil ---------------- */
  Renderer.prototype._bell = function (ctx, b, view) {
    var r = b.circleRadius || 30;
    var x = b.position.x, y = b.position.y;
    var info = b.plugin.bell;

    // hedef halkası
    ctx.save();
    var pulse = 0.5 + Math.sin(this.t * 2.4) * 0.5;
    ctx.strokeStyle = 'rgba(255,178,77,' + (0.18 + pulse * 0.22) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(x, y, r + 16 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // zil gövdesi
    ctx.save();
    var g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, '#fff3cc');
    g.addColorStop(0.35, '#ffce6b');
    g.addColorStop(0.75, '#c98b1e');
    g.addColorStop(1, '#7d5310');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.85, y + r * 0.55);
    ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.75, x, y - r * 0.9);
    ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.75, x + r * 0.85, y + r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,190,.85)'; ctx.lineWidth = 2; ctx.stroke();

    // tokmak
    ctx.beginPath(); ctx.arc(x, y + r * 0.62, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#8a5c12'; ctx.fill();
    ctx.restore();

    // çalma dalgası
    if (info && info.ringT > 0) {
      info.ringT = Math.max(0, info.ringT - 0.012);
      var t = 1 - info.ringT;
      ctx.save();
      ctx.globalAlpha = info.ringT * 0.8;
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 3 * info.ringT + 1;
      ctx.beginPath(); ctx.arc(x, y, r + 10 + t * 90, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r + 10 + t * 55, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = info.ringT;
      ctx.fillStyle = '#ffe9b5';
      ctx.font = 'bold 22px "Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DİNG!', x, y - r - 26 - t * 26);
      ctx.restore();
    }
  };

  /* ---------------- kıvılcımlar ---------------- */
  Renderer.prototype._impacts = function (ctx, world) {
    ctx.save();
    for (var i = world.impacts.length - 1; i >= 0; i--) {
      var im = world.impacts[i];
      im.t += 0.045;
      if (im.t >= 1) { world.impacts.splice(i, 1); continue; }
      var a = 1 - im.t;
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = '#ffe9b0';
      ctx.lineWidth = 2 * a + 0.5;
      var n = 5;
      for (var k = 0; k < n; k++) {
        var ang = (k / n) * Math.PI * 2 + im.t;
        var r0 = 4 + im.t * 10;
        var r1 = r0 + im.mag * 1.4 * a;
        ctx.beginPath();
        ctx.moveTo(im.x + Math.cos(ang) * r0, im.y + Math.sin(ang) * r0);
        ctx.lineTo(im.x + Math.cos(ang) * r1, im.y + Math.sin(ang) * r1);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* ---------------- seçim ---------------- */
  Renderer.prototype._selection = function (ctx, world, view) {
    if (!view.selectedId) return;
    var part = world.getPart(view.selectedId);
    if (!part) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(102,233,255,.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -this.t * 22;
    for (var i = 0; i < part.bodies.length; i++) {
      var b = part.bodies[i];
      if (b.label === 'rope') continue;
      poly(ctx, b.vertices);
      ctx.stroke();
    }
    // döndürme tutamacı
    var b0 = part.bodies[0];
    var bb = b0.bounds;
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(102,233,255,.9)';
    ctx.beginPath();
    ctx.arc(bb.max.x + 16, bb.min.y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06202b'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  };

  global.NumexRenderer = Renderer;
})(window);
