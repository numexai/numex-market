/* NUMEX FLOORPLAN — 2D editör
 * Tuval çizimi, fare etkileşimi, hizalama, ölçülendirme, SVG/PNG dışa aktarma.
 * Tüm geometri metre cinsinden tek koordinat sisteminden gelir (NF.project).
 */
(function (global) {
  'use strict';
  const NF = global.NF;
  const G = NF.G;

  const PAL = {
    dark: {
      bg: '#0f141b', gridMinor: '#171f29', gridMajor: '#212c39', axis: '#31404f',
      wall: '#e3ebf5', wallEdge: '#0b1016',
      roomFill: 'rgba(57,211,163,0.075)', roomEdge: 'rgba(57,211,163,0.30)', roomTxt: '#8ce9cd', roomSub: '#7c8fa1',
      furn: '#39485a', furnEdge: '#61748a', furnTxt: '#dbe6f2', furnTop: '#4a5c70',
      sel: '#39d3a3', dimBg: 'rgba(15,20,27,0.86)', dimTxt: '#a8b8c9',
      door: '#f3b354', window: '#4aa3ff', handle: '#39d3a3'
    },
    light: {
      bg: '#fbfaf6', gridMinor: '#eeeae0', gridMajor: '#e2ddd0', axis: '#cfc8b8',
      wall: '#39424f', wallEdge: '#20262e',
      roomFill: 'rgba(18,163,124,0.08)', roomEdge: 'rgba(18,163,124,0.35)', roomTxt: '#0d8a68', roomSub: '#7b8794',
      furn: '#cfd6df', furnEdge: '#8b98a8', furnTxt: '#2a3441', furnTop: '#dde4ec',
      sel: '#12a37c', dimBg: 'rgba(255,255,255,0.92)', dimTxt: '#4a5765',
      door: '#c98a1e', window: '#2c7fd1', handle: '#12a37c'
    }
  };

  const ED = {
    canvas: null, ctx: null, dpr: 1, w: 0, h: 0,
    view: { scale: 70, ox: 60, oy: 60 },
    ptr: { sx: 0, sy: 0, x: 0, y: 0 },
    snap: { label: 'ızgaraya hizalı' },
    hover: null,
    drawStart: null, drawEnd: null, downPt: null, moved: false,
    drag: null, pan: null,
    theme: 'dark',
    exam: null, examFocus: null, examShowPaths: true,   /* bina sınavı katmanı (SCENARIO sonucu) */
    insetRight: 0,                                       /* sınav paneli açıkken sağda ayrılan piksel */
    _raf: null,
    _space: false,

    /* ---------- koordinat ---------- */
    toScreen(x, y) { return { x: this.view.ox + x * this.view.scale, y: this.view.oy + y * this.view.scale }; },
    toWorld(sx, sy) { return { x: (sx - this.view.ox) / this.view.scale, y: (sy - this.view.oy) / this.view.scale }; },

    /* ---------- kurulum ---------- */
    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
      if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      window.addEventListener('resize', () => this.resize());

      canvas.addEventListener('pointerdown', e => this.onDown(e));
      canvas.addEventListener('pointermove', e => this.onMove(e));
      canvas.addEventListener('pointerup', e => this.onUp(e));
      canvas.addEventListener('pointercancel', e => this.onUp(e));
      canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
      canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (this.drawStart) { this.drawStart = null; this.drawEnd = null; this.invalidate(); }
      });
      canvas.addEventListener('pointerleave', () => { this.hover = null; if (!this.drag) { this.drawEnd = null; } this.invalidate(); });
    },

    resize() {
      const parent = this.canvas.parentElement;
      const r = parent.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, Math.round(r.width));
      this.h = Math.max(1, Math.round(r.height));
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.invalidate();
    },

    invalidate() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; this.render(); });
    },

    fit() {
      const b = NF.bounds(NF.project);
      const pad = 70;
      /* sınav paneli açıkken plan onun altında kalmasın: sağda ayrılan şerit */
      const right = this.insetRight || 0;
      const availW = Math.max(160, this.w - pad * 2 - right);
      const s = Math.min(availW / b.w, (this.h - pad * 2) / b.h);
      this.view.scale = G.clamp(s, 6, 500);
      this.view.ox = (this.w - right) / 2 - (b.x + b.w / 2) * this.view.scale;
      this.view.oy = this.h / 2 - (b.y + b.h / 2) * this.view.scale;
      this.invalidate();
      NF.emit('view');
    },

    centerOn(x, y) {
      this.view.ox = this.w / 2 - x * this.view.scale;
      this.view.oy = this.h / 2 - y * this.view.scale;
      this.invalidate();
      NF.emit('view');
    },

    zoomAt(factor, cx, cy) {
      const before = this.toWorld(cx === undefined ? this.w / 2 : cx, cy === undefined ? this.h / 2 : cy);
      this.view.scale = G.clamp(this.view.scale * factor, 5, 600);
      const after = this.toWorld(cx === undefined ? this.w / 2 : cx, cy === undefined ? this.h / 2 : cy);
      this.view.ox += (after.x - before.x) * this.view.scale;
      this.view.oy += (after.y - before.y) * this.view.scale;
      this.invalidate();
      NF.emit('view');
    },

    /* ---------- çizim ---------- */
    render() { this.paint(this.ctx, this.view, this.w, this.h, { dpr: this.dpr }); },

    paint(ctx, view, W, H, opts) {
      const pal = PAL[this.theme] || PAL.dark;
      const dpr = (opts && opts.dpr) || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);

      const S = (x, y) => ({ x: view.ox + x * view.scale, y: view.oy + y * view.scale });
      this._S = S;

      /* ızgara */
      const steps = [0.10, 0.25, 0.50, 1, 2, 5, 10, 25];
      let step = steps[steps.length - 1];
      for (const s of steps) { if (s * view.scale >= 14) { step = s; break; } }
      const minor = step / 5;
      const x0 = (0 - view.ox) / view.scale, x1 = (W - view.ox) / view.scale;
      const y0 = (0 - view.oy) / view.scale, y1 = (H - view.oy) / view.scale;

      if (minor * view.scale >= 7) {
        ctx.strokeStyle = pal.gridMinor; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = Math.ceil(x0 / minor) * minor; x < x1; x += minor) {
          const p = S(x, 0); ctx.moveTo(Math.round(p.x) + 0.5, 0); ctx.lineTo(Math.round(p.x) + 0.5, H);
        }
        for (let y = Math.ceil(y0 / minor) * minor; y < y1; y += minor) {
          const p = S(0, y); ctx.moveTo(0, Math.round(p.y) + 0.5); ctx.lineTo(W, Math.round(p.y) + 0.5);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = pal.gridMajor; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) {
        const p = S(x, 0); ctx.moveTo(Math.round(p.x) + 0.5, 0); ctx.lineTo(Math.round(p.x) + 0.5, H);
      }
      for (let y = Math.ceil(y0 / step) * step; y < y1; y += step) {
        const p = S(0, y); ctx.moveTo(0, Math.round(p.y) + 0.5); ctx.lineTo(W, Math.round(p.y) + 0.5);
      }
      ctx.stroke();

      /* eksen */
      ctx.strokeStyle = pal.axis; ctx.lineWidth = 1.4;
      const o = S(0, 0);
      ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y); ctx.stroke();

      const project = NF.project;
      const roomList = NF.rooms(project);

      /* odalar */
      roomList.forEach(r => {
        ctx.beginPath();
        r.poly.forEach((p, i) => { const s = S(p.x, p.y); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); });
        ctx.closePath();
        ctx.fillStyle = pal.roomFill; ctx.fill();
        ctx.strokeStyle = pal.roomEdge; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      });

      /* duvarlar */
      const sel = NF.sel;
      project.walls.forEach(wl => {
        const a = S(wl.ax, wl.ay), b = S(wl.bx, wl.by);
        const isSel = sel && sel.kind === 'wall' && sel.id === wl.id;
        const isHover = this.hover && this.hover.kind === 'wall' && this.hover.id === wl.id;
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2.5, wl.t * view.scale);
        ctx.strokeStyle = isSel ? pal.sel : (isHover ? pal.dimTxt : pal.wall);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });

      /* boşluklar (kapı / pencere) */
      project.openings.forEach(op => {
        const wl = project.walls.find(x => x.id === op.wallId);
        if (!wl) return;
        const L = G.len(wl); if (L < 0.01) return;
        const ang = G.angle(wl);
        const pt = G.pointAt(wl, G.clamp(op.d, 0, L));
        const sp = S(pt.x, pt.y);
        const wp = Math.max(3, op.w * view.scale), tp = Math.max(3, wl.t * view.scale);
        const isSel = sel && sel.kind === 'opening' && sel.id === op.id;
        ctx.save();
        ctx.translate(sp.x, sp.y); ctx.rotate(ang);
        // duvarı kes
        ctx.fillStyle = pal.bg;
        ctx.fillRect(-wp / 2, -tp / 2 - 1, wp, tp + 2);
        ctx.strokeStyle = isSel ? pal.sel : (op.type === 'door' ? pal.door : pal.window);
        ctx.lineWidth = isSel ? 2 : 1.5;
        if (op.type === 'door') {
          ctx.beginPath(); ctx.moveTo(-wp / 2, 0); ctx.lineTo(-wp / 2, -wp); ctx.stroke();
          ctx.beginPath(); ctx.arc(-wp / 2, 0, wp, -Math.PI / 2, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-wp / 2, -tp / 2); ctx.lineTo(-wp / 2, tp / 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(wp / 2, -tp / 2); ctx.lineTo(wp / 2, tp / 2); ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-wp / 2, -tp / 3); ctx.lineTo(wp / 2, -tp / 3);
          ctx.moveTo(-wp / 2, tp / 3); ctx.lineTo(wp / 2, tp / 3);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-wp / 2, -tp / 2); ctx.lineTo(-wp / 2, tp / 2);
          ctx.moveTo(wp / 2, -tp / 2); ctx.lineTo(wp / 2, tp / 2); ctx.stroke();
        }
        ctx.restore();
      });

      /* mobilya */
      project.furniture.forEach(f => {
        const c = S(f.x, f.y);
        const isSel = sel && sel.kind === 'furniture' && sel.id === f.id;
        const isHover = this.hover && this.hover.kind === 'furniture' && this.hover.id === f.id;
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(f.rot);
        const pw = f.w * view.scale, pd = f.d * view.scale;
        const r = Math.min(4, Math.min(pw, pd) * 0.12);
        roundRect(ctx, -pw / 2, -pd / 2, pw, pd, r);
        ctx.fillStyle = pal.furn; ctx.fill();
        ctx.strokeStyle = isSel ? pal.sel : (isHover ? pal.sel : pal.furnEdge);
        ctx.lineWidth = isSel ? 2 : 1.2; ctx.stroke();
        // ön kenar işareti
        ctx.beginPath(); ctx.moveTo(-pw / 2 + 3, pd / 2 - 3); ctx.lineTo(pw / 2 - 3, pd / 2 - 3);
        ctx.strokeStyle = pal.furnTop; ctx.lineWidth = 2; ctx.stroke();
        if (pw > 34 && pd > 20) {
          ctx.fillStyle = pal.furnTxt;
          ctx.font = '9.5px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.rotate(-f.rot);
          const nm = (NF.CAT[f.type] || {}).name || f.type;
          if (pw > nm.length * 4.6) ctx.fillText(nm, 0, 0);
        }
        ctx.restore();
      });

      /* oda etiketleri */
      roomList.forEach(r => {
        const c = S(r.cx, r.cy);
        const areaTxt = r.area.toFixed(2).replace('.', ',') + ' m²';
        // etiket, mobilyanın üstünde okunur kalsın diye zemin kartıyla çizilir
        ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
        const w1 = ctx.measureText(areaTxt).width;
        ctx.font = '9.5px "Segoe UI", system-ui, sans-serif';
        const w2 = ctx.measureText(r.name).width;
        const bw = Math.max(w1, w2) + 16;
        ctx.fillStyle = pal.dimBg;
        roundRect(ctx, c.x - bw / 2, c.y - 20, bw, 36, 6);
        ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = pal.roomTxt;
        ctx.fillText(areaTxt, c.x, c.y - 8);
        ctx.font = '9.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = pal.roomSub;
        ctx.fillText(r.name, c.x, c.y + 7);
      });

      /* duvar ölçüleri */
      if (view.scale > 30) {
        project.walls.forEach(wl => {
          const L = G.len(wl);
          const isSel = sel && sel.kind === 'wall' && sel.id === wl.id;
          const isHover = this.hover && this.hover.kind === 'wall' && this.hover.id === wl.id;
          if (!isSel && !isHover && L < 0.9) return;
          const m = S((wl.ax + wl.bx) / 2, (wl.ay + wl.by) / 2);
          let ang = G.angle(wl);
          if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
          ctx.save();
          ctx.translate(m.x, m.y); ctx.rotate(ang);
          const txt = L.toFixed(2).replace('.', ',') + ' m';
          ctx.font = (isSel ? '600 ' : '') + '10px "Segoe UI", system-ui, sans-serif';
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = pal.dimBg;
          roundRect(ctx, -tw / 2 - 4, -(wl.t * view.scale) / 2 - 16, tw + 8, 13, 4);
          ctx.fill();
          ctx.fillStyle = isSel ? pal.sel : pal.dimTxt;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, 0, -(wl.t * view.scale) / 2 - 9.5);
          ctx.restore();
        });
      }

      /* seçim tutamaçları */
      if (sel && sel.kind === 'wall') {
        const wl = project.walls.find(w => w.id === sel.id);
        if (wl) {
          const pts = [S(wl.ax, wl.ay), S(wl.bx, wl.by)];
          pts.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = pal.bg; ctx.fill();
            ctx.strokeStyle = pal.handle; ctx.lineWidth = 2; ctx.stroke();
          });
          // başlangıç/bitiş ölçüsü
          const m = S((wl.ax + wl.bx) / 2, (wl.ay + wl.by) / 2);
          const ang = G.angle(wl);
          ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(ang);
          const txt = 'Δ ' + Math.abs(wl.bx - wl.ax).toFixed(2).replace('.', ',') + ' · ' + Math.abs(wl.by - wl.ay).toFixed(2).replace('.', ',') + ' m';
          ctx.font = '10px "Segoe UI", system-ui, sans-serif';
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = pal.dimBg;
          roundRect(ctx, -tw / 2 - 4, (wl.t * view.scale) / 2 + 5, tw + 8, 13, 4); ctx.fill();
          ctx.fillStyle = pal.sel; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, 0, (wl.t * view.scale) / 2 + 11.5);
          ctx.restore();
        }
      }
      if (sel && sel.kind === 'furniture') {
        const f = project.furniture.find(x => x.id === sel.id);
        if (f) {
          const c = S(f.x, f.y);
          ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(f.rot);
          ctx.setLineDash([4, 4]); ctx.strokeStyle = pal.sel; ctx.lineWidth = 1;
          ctx.strokeRect(-f.w * view.scale / 2 - 4, -f.d * view.scale / 2 - 4, f.w * view.scale + 8, f.d * view.scale + 8);
          ctx.setLineDash([]);
          ctx.restore();
          const txt = (f.w * 100).toFixed(0) + ' × ' + (f.d * 100).toFixed(0) + ' cm';
          ctx.font = '10px "Segoe UI", system-ui, sans-serif';
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = pal.dimBg;
          roundRect(ctx, c.x - tw / 2 - 4, c.y + f.d * view.scale / 2 + 8, tw + 8, 14, 4); ctx.fill();
          ctx.fillStyle = pal.sel; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, c.x, c.y + f.d * view.scale / 2 + 15);
        }
      }

      /* çizim önizleme */
      if (this.drawStart && this.drawEnd) {
        const a = S(this.drawStart.x, this.drawStart.y), b = S(this.drawEnd.x, this.drawEnd.y);
        ctx.strokeStyle = pal.sel; ctx.lineWidth = Math.max(2.5, NF.DEFAULTS.wallThickness * view.scale);
        ctx.globalAlpha = 0.55; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 1;
        const L = Math.hypot(this.drawEnd.x - this.drawStart.x, this.drawEnd.y - this.drawStart.y);
        const txt = L.toFixed(2).replace('.', ',') + ' m';
        ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
        const tw = ctx.measureText(txt).width;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.fillStyle = pal.dimBg; roundRect(ctx, mx - tw / 2 - 6, my - 24, tw + 12, 17, 5); ctx.fill();
        ctx.fillStyle = pal.sel; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, mx, my - 15.5);
        // bitiş noktası
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = pal.bg; ctx.fill(); ctx.strokeStyle = pal.sel; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI * 2); ctx.fillStyle = pal.sel; ctx.fill();
      }

      /* bina sınavı katmanı: tahliye yolları + numaralı bulgu işaretleri */
      drawExamLayer(this, ctx, S, pal);

      /* ölçek çubuğu */
      drawScaleBar(ctx, view, W, H, pal);

      if (opts && opts.export) {
        // dışa aktarmada arayüz öğeleri yok
      }
    },

    /* ---------- hizalama ---------- */
    snapPoint(p, opts) {
      opts = opts || {};
      const tol = 14 / this.view.scale;
      let best = null, bestD = tol;
      for (const wl of NF.project.walls) {
        const cands = [{ x: wl.ax, y: wl.ay }, { x: wl.bx, y: wl.by }];
        if (opts.midpoints) cands.push({ x: (wl.ax + wl.bx) / 2, y: (wl.ay + wl.by) / 2 });
        for (const c of cands) {
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (d < bestD) { bestD = d; best = { x: c.x, y: c.y, label: opts.midpoints ? 'duvar noktasına hizalı' : 'duvar ucuna hizalı' }; }
        }
      }
      if (best) return best;

      const step = opts.step || NF.snapStep;
      const gx = Math.round(p.x / step) * step, gy = Math.round(p.y / step) * step;
      if (Math.hypot(p.x - gx, p.y - gy) < 16 / this.view.scale) {
        return { x: +gx.toFixed(3), y: +gy.toFixed(3), label: 'ızgaraya hizalı (' + step + ' m)' };
      }
      return { x: p.x, y: p.y, label: 'serbest' };
    },

    axisLock(p, start, force) {
      if (!start) return p;
      const dx = Math.abs(p.x - start.x), dy = Math.abs(p.y - start.y);
      const th = 0.18;
      if (force) {
        return dx >= dy ? { x: p.x, y: start.y } : { x: start.x, y: p.y };
      }
      if (dx < th && dy > 0.02) return { x: start.x, y: p.y };
      if (dy < th && dx > 0.02) return { x: p.x, y: start.y };
      return p;
    },

    /* ---------- isabet ---------- */
    hitTest(world) {
      const tol = 9 / this.view.scale;
      const p = NF.project;
      for (let i = p.furniture.length - 1; i >= 0; i--) {
        const f = p.furniture[i];
        const dx = world.x - f.x, dy = world.y - f.y;
        const c = Math.cos(f.rot), s = Math.sin(f.rot);
        const lx = dx * c + dy * s, ly = -dx * s + dy * c;
        if (Math.abs(lx) <= f.w / 2 && Math.abs(ly) <= f.d / 2) return { kind: 'furniture', id: f.id, obj: f };
      }
      for (const op of p.openings) {
        const wl = p.walls.find(w => w.id === op.wallId);
        if (!wl) continue;
        const pt = G.pointAt(wl, G.clamp(op.d, 0, G.len(wl)));
        if (Math.hypot(pt.x - world.x, pt.y - world.y) < Math.max(tol, op.w / 2)) return { kind: 'opening', id: op.id, obj: op };
      }
      let bestWall = null, bd = 1e9;
      for (const wl of p.walls) {
        const c = G.closest(wl, world);
        const lim = Math.max(wl.t / 2 + tol, 0.10);
        if (c.dist < lim && c.dist < bd) { bd = c.dist; bestWall = { kind: 'wall', id: wl.id, obj: wl, at: c }; }
      }
      return bestWall;
    },

    examHit(world) {
      if (!this.exam || !this.exam.issues) return null;
      const tol = 13 / this.view.scale;
      let best = null, bd = tol;
      this.exam.issues.forEach((is, i) => {
        if (!is.at) return;
        const d = Math.hypot(is.at.x - world.x, is.at.y - world.y);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    },

    hitHandle(world) {
      const sel = NF.sel;
      if (!sel || sel.kind !== 'wall') return null;
      const wl = NF.project.walls.find(w => w.id === sel.id);
      if (!wl) return null;
      const tol = 10 / this.view.scale;
      if (Math.hypot(wl.ax - world.x, wl.ay - world.y) < tol) return 'a';
      if (Math.hypot(wl.bx - world.x, wl.by - world.y) < tol) return 'b';
      return null;
    },

    /* ---------- olaylar ---------- */
    evWorld(e) {
      const r = this.canvas.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      const w = this.toWorld(sx, sy);
      return { sx, sy, x: w.x, y: w.y };
    },

    onDown(e) {
      this.canvas.setPointerCapture(e.pointerId);
      const p = this.evWorld(e);
      this.ptr = p;
      this.moved = false;
      this.downPt = { x: p.x, y: p.y, sx: p.sx, sy: p.sy };

      if (e.button === 1 || e.button === 2) {
        this.pan = { sx: p.sx, sy: p.sy, ox: this.view.ox, oy: this.view.oy };
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;

      const tool = NF.tool;

      if (tool === 'wall') {
        const s = this.snapPoint(p, { midpoints: true });
        if (!this.drawStart) { this.drawStart = { x: s.x, y: s.y }; this.drawEnd = { x: s.x, y: s.y }; }
        else {
          const end = this.axisLock({ x: s.x, y: s.y }, this.drawStart, e.shiftKey);
          if (Math.hypot(end.x - this.drawStart.x, end.y - this.drawStart.y) >= 0.10) {
            NF.addWall(NF.project, this.drawStart, end);
            NF.commit();
            this.drawStart = { x: end.x, y: end.y };
            this.drawEnd = { x: end.x, y: end.y };
          }
        }
        this.downPt = { x: p.x, y: p.y, sx: p.sx, sy: p.sy };
        this.invalidate();
        return;
      }

      if (tool === 'door' || tool === 'window') {
        const hit = this.hitTest(p);
        if (hit && hit.kind === 'wall') {
          const wl = hit.obj;
          const c = G.closest(wl, p);
          const op = NF.addOpening(NF.project, wl, c.d, tool);
          if (op) {
            NF.sel = { kind: 'opening', id: op.id };
            NF.commit();
          } else NF.emit('toast', { text: 'Bu duvar ' + tool + ' için çok kısa.', error: true });
        } else {
          NF.emit('toast', { text: 'Kapı/pencere için bir duvara tıklayın.', error: true });
        }
        this.invalidate();
        return;
      }

      if (tool.indexOf('place:') === 0) {
        const type = tool.slice(6);
        const s = this.snapPoint(p, {});
        const f = NF.addFurniture(NF.project, type, s.x, s.y, 0);
        NF.sel = { kind: 'furniture', id: f.id };
        NF.tool = 'select';
        NF.commit();
        NF.emit('tool');
        this.invalidate();
        return;
      }

      /* haritadaki sınav işareti: panelde o bulguya odaklan */
      const ex = this.examHit(p);
      if (ex !== null) {
        this.examFocus = ex;
        NF.emit('examFocus', { index: ex });
        this.invalidate();
        return;
      }

      /* seçim aracı */
      const h = this.hitHandle(p);
      if (h) {
        const wl = NF.project.walls.find(w => w.id === NF.sel.id);
        this.drag = { kind: 'wallEnd', handle: h, id: wl.id, snap: JSON.stringify(wl) };
        return;
      }
      const hit = this.hitTest(p);
      if (hit) {
        NF.sel = { kind: hit.kind, id: hit.id };
        NF.emit('select');
        if (hit.kind === 'furniture') {
          this.drag = { kind: 'furniture', id: hit.id, off: { x: hit.obj.x - p.x, y: hit.obj.y - p.y }, start: JSON.stringify(hit.obj) };
        } else if (hit.kind === 'wall') {
          this.drag = { kind: 'wallMove', id: hit.id, start: JSON.stringify(hit.obj), from: { x: p.x, y: p.y } };
        } else if (hit.kind === 'opening') {
          this.drag = { kind: 'opening', id: hit.id, start: JSON.stringify(hit.obj) };
        }
        this.invalidate();
        return;
      }

      // boş alan: seçimi bırak, sürükleyince kaydır
      NF.sel = null;
      NF.emit('select');
      this.pan = { sx: p.sx, sy: p.sy, ox: this.view.ox, oy: this.view.oy };
      this.invalidate();
    },

    onMove(e) {
      const p = this.evWorld(e);
      this.ptr = p;
      if (this.downPt && Math.hypot(p.sx - this.downPt.sx, p.sy - this.downPt.sy) > 3) this.moved = true;

      if (this.pan) {
        this.view.ox = this.pan.ox + (p.sx - this.pan.sx);
        this.view.oy = this.pan.oy + (p.sy - this.pan.sy);
        this.invalidate(); NF.emit('view');
        return;
      }

      if (NF.tool === 'wall' && this.drawStart) {
        const s = this.snapPoint(p, { midpoints: true });
        const end = this.axisLock({ x: s.x, y: s.y }, this.drawStart, e.shiftKey);
        this.drawEnd = end;
        this.snap = { label: s.label };
        NF.emit('pointer', { x: end.x, y: end.y, snap: s.label });
        this.invalidate();
        return;
      }

      if (this.drag) {
        if (this.drag.kind === 'furniture') {
          const f = NF.project.furniture.find(x => x.id === this.drag.id);
          if (f) {
            const s = this.snapPoint({ x: p.x + this.drag.off.x, y: p.y + this.drag.off.y }, {});
            f.x = +s.x.toFixed(3); f.y = +s.y.toFixed(3);
            NF.emit('pointer', { x: f.x, y: f.y, snap: s.label });
          }
        } else if (this.drag.kind === 'wallEnd') {
          const wl = NF.project.walls.find(w => w.id === this.drag.id);
          if (wl) {
            const s = this.snapPoint(p, { midpoints: true });
            if (this.drag.handle === 'a') { wl.ax = +s.x.toFixed(3); wl.ay = +s.y.toFixed(3); }
            else { wl.bx = +s.x.toFixed(3); wl.by = +s.y.toFixed(3); }
            this.fixOpenings(wl);
            NF.emit('pointer', { x: s.x, y: s.y, snap: s.label });
          }
        } else if (this.drag.kind === 'wallMove') {
          const wl = NF.project.walls.find(w => w.id === this.drag.id);
          if (wl) {
            const s0 = JSON.parse(this.drag.start);
            const s = this.snapPoint({ x: p.x, y: p.y }, {});
            const dx = s.x - this.drag.from.x, dy = s.y - this.drag.from.y;
            wl.ax = +(s0.ax + dx).toFixed(3); wl.ay = +(s0.ay + dy).toFixed(3);
            wl.bx = +(s0.bx + dx).toFixed(3); wl.by = +(s0.by + dy).toFixed(3);
            this.fixOpenings(wl);
          }
        } else if (this.drag.kind === 'opening') {
          const op = NF.project.openings.find(o => o.id === this.drag.id);
          const wl = op && NF.project.walls.find(w => w.id === op.wallId);
          if (op && wl) {
            const c = G.closest(wl, p);
            op.d = +G.clamp(c.d, op.w / 2 + 0.02, G.len(wl) - op.w / 2 - 0.02).toFixed(3);
          }
        }
        this.invalidate();
        return;
      }

      /* hover */
      const hit = this.hitTest(p);
      const hh = this.hitHandle(p);
      const nh = hh ? { kind: 'wallEnd', id: NF.sel.id } : (hit ? { kind: hit.kind, id: hit.id } : null);
      const changed = JSON.stringify(nh) !== JSON.stringify(this.hover);
      this.hover = nh;
      this.snap = { label: 'hazır' };
      NF.emit('pointer', { x: p.x, y: p.y, snap: hh ? 'duvar ucu tutamacı' : (hit ? hit.kind : '') });
      this.canvas.style.cursor =
        NF.tool === 'wall' ? 'crosshair' :
        NF.tool === 'door' || NF.tool === 'window' ? 'copy' :
        NF.tool.indexOf('place:') === 0 ? 'copy' :
        (hh ? 'nwse-resize' : (hit ? (hit.kind === 'furniture' ? 'move' : 'pointer') : 'default'));
      if (changed || true) this.invalidate();
    },

    onUp(e) {
      if (this.pan) { this.pan = null; return; }
      if (NF.tool === 'wall' && this.drawStart) {
        const p = this.evWorld(e);
        const s = this.snapPoint(p, { midpoints: true });
        const end = this.axisLock({ x: s.x, y: s.y }, this.drawStart, e.shiftKey);
        if (Math.hypot(end.x - this.drawStart.x, end.y - this.drawStart.y) >= 0.10 &&
            this.downPt && Math.hypot(p.sx - this.downPt.sx, p.sy - this.downPt.sy) > 4) {
          NF.addWall(NF.project, this.drawStart, end);
          NF.commit();
          this.drawStart = { x: end.x, y: end.y };
          this.drawEnd = { x: end.x, y: end.y };
        }
        this.invalidate();
        return;
      }
      if (this.drag) {
        const before = this.drag.start;
        const kind = this.drag.kind, id = this.drag.id;
        this.drag = null;
        let changed = false;
        if (kind === 'furniture') {
          const f = NF.project.furniture.find(x => x.id === id);
          changed = f && JSON.stringify(f) !== before;
        } else if (kind === 'wallEnd' || kind === 'wallMove') {
          const wl = NF.project.walls.find(w => w.id === id);
          changed = wl && JSON.stringify(wl) !== before;
        } else if (kind === 'opening') {
          const op = NF.project.openings.find(o => o.id === id);
          changed = op && JSON.stringify(op) !== before;
        }
        if (changed) NF.commit(); else this.invalidate();
      }
      this.downPt = null;
    },

    onWheel(e) {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoomAt(f, e.clientX - r.left, e.clientY - r.top);
    },

    fixOpenings(wl) {
      const L = G.len(wl);
      NF.project.openings.filter(o => o.wallId === wl.id).forEach(o => {
        o.d = G.clamp(o.d, o.w / 2 + 0.02, Math.max(o.w / 2 + 0.02, L - o.w / 2 - 0.02));
      });
    },

    /* ---------- dışa aktarma ---------- */
    exportPNG(scalePx) {
      const b = NF.bounds(NF.project);
      const pad = 60;
      const targetW = 1800;
      const s = G.clamp((targetW - pad * 2) / b.w, 20, 400);
      const W = Math.round(b.w * s + pad * 2);
      const H = Math.round(b.h * s + pad * 2);
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const view = { scale: s, ox: pad - b.x * s, oy: pad - b.y * s };
      const sel = NF.sel; NF.sel = null;
      this.paint(ctx, view, W, H, { dpr: 1, export: true });
      NF.sel = sel;
      return cv.toDataURL('image/png');
    },

    exportSVG() {
      const p = NF.project;
      const b = NF.bounds(p);
      const pad = 50;
      const s = G.clamp((1400 - pad * 2) / b.w, 20, 260);
      const W = Math.round(b.w * s + pad * 2);
      const H = Math.round(b.h * s + pad * 2);
      const X = x => +(pad + (x - b.x) * s).toFixed(2);
      const Y = y => +(pad + (y - b.y) * s).toFixed(2);
      const n = v => (+v).toFixed(2);
      const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const out = [];
      out.push('<?xml version="1.0" encoding="UTF-8"?>');
      out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">');
      out.push('<title>' + esc(p.name) + ' — Numex Floorplan</title>');
      out.push('<rect width="' + W + '" height="' + H + '" fill="#fbfaf6"/>');

      // odalar
      NF.rooms(p).forEach(r => {
        const pts = r.poly.map(q => X(q.x) + ',' + Y(q.y)).join(' ');
        out.push('<polygon points="' + pts + '" fill="#e9f6f0" stroke="#7fc9b4" stroke-width="1" stroke-dasharray="6 5"/>');
        out.push('<text x="' + X(r.cx) + '" y="' + (Y(r.cy) - 3) + '" font-family="Segoe UI, Arial" font-size="13" font-weight="600" fill="#0d8a68" text-anchor="middle">' + r.area.toFixed(2).replace('.', ',') + ' m²</text>');
        out.push('<text x="' + X(r.cx) + '" y="' + (Y(r.cy) + 12) + '" font-family="Segoe UI, Arial" font-size="10" fill="#6b7b8c" text-anchor="middle">' + esc(r.name) + '</text>');
      });

      // duvarlar
      p.walls.forEach(wl => {
        out.push('<line x1="' + X(wl.ax) + '" y1="' + Y(wl.ay) + '" x2="' + X(wl.bx) + '" y2="' + Y(wl.by) + '" stroke="#39424f" stroke-width="' + n(wl.t * s) + '" stroke-linecap="round"/>');
      });

      // boşluklar
      p.openings.forEach(op => {
        const wl = p.walls.find(w => w.id === op.wallId);
        if (!wl) return;
        const pt = G.pointAt(wl, op.d);
        const ang = G.angle(wl) * 180 / Math.PI;
        const wp = op.w * s, tp = wl.t * s;
        out.push('<g transform="translate(' + X(pt.x) + ',' + Y(pt.y) + ') rotate(' + ang.toFixed(2) + ')">');
        out.push('<rect x="' + n(-wp / 2) + '" y="' + n(-tp / 2 - 1) + '" width="' + n(wp) + '" height="' + n(tp + 2) + '" fill="#fbfaf6"/>');
        if (op.type === 'door') {
          out.push('<path d="M ' + n(-wp / 2) + ' 0 L ' + n(-wp / 2) + ' ' + n(-wp) + '" stroke="#c98a1e" stroke-width="1.6" fill="none"/>');
          out.push('<path d="M ' + n(-wp / 2 + wp) + ' 0 A ' + n(wp) + ' ' + n(wp) + ' 0 0 0 ' + n(-wp / 2) + ' ' + n(-wp) + '" stroke="#c98a1e" stroke-width="1" fill="none" stroke-dasharray="4 3"/>');
          out.push('<line x1="' + n(-wp / 2) + '" y1="' + n(-tp / 2) + '" x2="' + n(-wp / 2) + '" y2="' + n(tp / 2) + '" stroke="#c98a1e" stroke-width="1.6"/>');
          out.push('<line x1="' + n(wp / 2) + '" y1="' + n(-tp / 2) + '" x2="' + n(wp / 2) + '" y2="' + n(tp / 2) + '" stroke="#c98a1e" stroke-width="1.6"/>');
        } else {
          out.push('<line x1="' + n(-wp / 2) + '" y1="' + n(-tp / 3) + '" x2="' + n(wp / 2) + '" y2="' + n(-tp / 3) + '" stroke="#2c7fd1" stroke-width="1.6"/>');
          out.push('<line x1="' + n(-wp / 2) + '" y1="' + n(tp / 3) + '" x2="' + n(wp / 2) + '" y2="' + n(tp / 3) + '" stroke="#2c7fd1" stroke-width="1.6"/>');
        }
        out.push('</g>');
      });

      // mobilya
      p.furniture.forEach(f => {
        const c = NF.CAT[f.type] || { name: f.type };
        const ang = (f.rot * 180 / Math.PI).toFixed(2);
        const pw = f.w * s, pd = f.d * s;
        out.push('<g transform="translate(' + X(f.x) + ',' + Y(f.y) + ') rotate(' + ang + ')">');
        out.push('<rect x="' + n(-pw / 2) + '" y="' + n(-pd / 2) + '" width="' + n(pw) + '" height="' + n(pd) + '" rx="4" fill="#dde4ec" stroke="#8b98a8" stroke-width="1.4"/>');
        out.push('<line x1="' + n(-pw / 2 + 3) + '" y1="' + n(pd / 2 - 3) + '" x2="' + n(pw / 2 - 3) + '" y2="' + n(pd / 2 - 3) + '" stroke="#aab6c4" stroke-width="2"/>');
        if (pw > 40 && pd > 22) {
          out.push('<text x="0" y="4" font-family="Segoe UI, Arial" font-size="9.5" fill="#2a3441" text-anchor="middle">' + esc(c.name) + '</text>');
        }
        out.push('</g>');
      });

      // duvar ölçüleri
      p.walls.forEach(wl => {
        const L = G.len(wl);
        if (L < 0.8) return;
        let ang = G.angle(wl) * 180 / Math.PI;
        if (ang > 90 || ang < -90) ang += 180;
        const mx = (wl.ax + wl.bx) / 2, my = (wl.ay + wl.by) / 2;
        out.push('<g transform="translate(' + X(mx) + ',' + Y(my) + ') rotate(' + ang.toFixed(2) + ')">');
        out.push('<text x="0" y="' + n(-(wl.t * s) / 2 - 6) + '" font-family="Segoe UI, Arial" font-size="10" fill="#4a5765" text-anchor="middle">' + L.toFixed(2).replace('.', ',') + ' m</text>');
        out.push('</g>');
      });

      out.push('<text x="' + pad + '" y="' + (H - 14) + '" font-family="Segoe UI, Arial" font-size="10" fill="#8b97a8">' + esc(p.name) + ' · Numex Floorplan · toplam ' + NF.totalArea(p).toFixed(2).replace('.', ',') + ' m²</text>');
      out.push('</svg>');
      return out.join('\n');
    }
  };

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  const EXAM_COL = { 'kritik': '#ef5d6b', 'uyarı': '#f3b354', 'bilgi': '#4aa3ff' };

  /** Etiket kutusunu, daha önce yerleşenlerle çakışmayacak yüksekliğe indirir. */
  function placeLabel(placed, w, h, x, y) {
    let yy = y;
    for (let t = 0; t < 6; t++) {
      const b = { x: x - w / 2, y: yy, w: w, h: h };
      const cakisti = placed.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
      if (!cakisti) { placed.push(b); return yy; }
      yy -= h + 3;
    }
    placed.push({ x: x - w / 2, y: yy, w: w, h: h });
    return yy;
  }

  /** Sınav sonucunu 2D haritanın üstüne çizer: tahliye yolları, mesafe etiketleri, numaralı bulgular. */
  function drawExamLayer(ed, ctx, S, pal) {
    const res = ed.exam;
    if (!res) return;
    const placed = [];   // yerleşen etiket kutuları (üst üste yazı olmasın)

    if (ed.examShowPaths !== false && res.evac) {
      res.evac.forEach(e => {
        const pts = e.pts || [];
        if (pts.length < 2) return;
        const bad = e.worst === null || e.worst > 20;
        const warm = !bad && e.worst > 14;
        const col = bad ? EXAM_COL.kritik : (warm ? EXAM_COL['uyarı'] : pal.roomTxt);
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = bad ? 2.4 : 1.7;
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        pts.forEach((p, i) => { const s = S(p.x, p.y); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); });
        ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;

        const a = S(pts[0].x, pts[0].y), b = S(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.beginPath(); ctx.arc(a.x, a.y, 3.4, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, 4.8, 0, Math.PI * 2); ctx.lineWidth = 1.8; ctx.strokeStyle = col; ctx.stroke();

        /* etiket odanın en uzak köşesine (yolun başı) yakın durur: oda alan etiketiyle çakışmasın */
        const txt = (e.worst === null ? 'çıkış yok' : e.worst.toFixed(2).replace('.', ',') + ' m');
        ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
        const tw = ctx.measureText(txt).width;
        const bw = tw + 10, bh = 15;
        const lp = S(pts[0].x, pts[0].y);
        const ly = placeLabel(placed, bw, bh, lp.x, lp.y - 30);
        ctx.fillStyle = pal.dimBg;
        roundRect(ctx, lp.x - bw / 2, ly, bw, bh, 5); ctx.fill();
        ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, lp.x, ly + bh / 2);
        ctx.restore();
      });
    }

    (res.issues || []).forEach((is, i) => {
      if (!is.at) return;
      const c = S(is.at.x, is.at.y);
      const col = EXAM_COL[is.level] || EXAM_COL.bilgi;
      const focus = ed.examFocus === i;
      const r = focus ? 13 : 10;
      ctx.save();
      ctx.globalAlpha = focus ? 0.96 : 0.82;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = 1;
      if (focus) { ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
      ctx.fillStyle = '#0b1016';
      ctx.font = '700 ' + (focus ? 12 : 10.5) + 'px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), c.x, c.y + 0.5);
      ctx.restore();
    });
  }

  function drawScaleBar(ctx, view, W, H, pal) {
    const steps = [0.5, 1, 2, 5, 10, 20];
    let m = steps[steps.length - 1];
    for (const s of steps) { if (s * view.scale >= 70) { m = s; break; } }
    const px = m * view.scale;
    const x = 16, y = H - 22;
    ctx.save();
    ctx.strokeStyle = pal.dimTxt; ctx.fillStyle = pal.dimTxt; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + px, y);
    ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
    ctx.moveTo(x + px, y - 4); ctx.lineTo(x + px, y + 4);
    ctx.stroke();
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(m + ' m', x + px + 7, y + 3.5);
    ctx.restore();
  }

  global.ED = ED;
})(window);
