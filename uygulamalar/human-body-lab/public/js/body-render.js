/**
 * body-render.js — Canvas Render Katmani
 * ---------------------------------------------------------------
 * Sadece OKUR (state, anatomy, particles) ve CIZER.
 * Hicbir fizyoloji hesabi burada yapilmaz.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const A = root.NumexAnatomy;
  const P = root.NumexParticles;

  const COLORS = {
    bg: '#05070d',
    grid: 'rgba(56, 189, 248, 0.055)',
    bodyFill: 'rgba(30, 41, 59, 0.55)',
    bodyStroke: 'rgba(94, 234, 212, 0.55)',
    organFill: 'rgba(148, 163, 184, 0.20)',
    organStroke: 'rgba(94, 234, 212, 0.65)',
    artery: 'rgba(239, 68, 68, 0.30)',
    vein: 'rgba(59, 130, 246, 0.30)',
    nerve: 'rgba(168, 85, 247, 0.32)',
    motor: '#f59e0b',
    sensory: '#22d3ee',
    bloodO2: '#ef4444',
    bloodDeO2: '#3b82f6',
    text: '#e2e8f0',
    dim: 'rgba(226, 232, 240, 0.45)'
  };

  /** t'nin renkli SpO2 gostergesi (dusukse morarir/donuklasir). */
  function bloodTint(spo2, isArtery) {
    // SpO2 98 → parlak kirmizi; 80 → koyu kizil/morumsu
    const health = Math.min(1, Math.max(0, (spo2 - 70) / 28));
    if (isArtery) {
      const r = Math.round(120 + 135 * health);
      const g = Math.round(20 + 48 * health);
      const b = Math.round(40 + 30 * health);
      return `rgb(${r},${g},${b})`;
    }
    // Ven: dusuk oksijende koyu mavi → cok dusukse mora kayar
    const r = Math.round(30 + 60 * (1 - health));
    const g = Math.round(80 + 50 * health);
    const b = Math.round(160 + 60 * health);
    return `rgb(${r},${g},${b})`;
  }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const R = {
      canvas, ctx,
      w: 0, h: 0, dpr: 1,
      pad: 24,

      /** Canvas boyutunu ayarla (high-DPI). */
      resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        R.dpr = dpr;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        R.w = rect.width;
        R.h = rect.height;
      },

      /** Normalize (0..1) → ekran pikseli. Vucut dikey sigdirilir. */
      sx(nx) {
        const scale = R.drawH / 1.0;
        const cx = R.w / 2;
        return cx + (nx - 0.5) * scale;
      },
      sy(ny) { return R.pad + ny * R.drawH; },

      /** Cizim olcegi: yukseklige gore. */
      computeScale() {
        R.drawH = R.h - R.pad * 2;
        R.drawScale = R.drawH;
      },

      clear() {
        const g = ctx.createLinearGradient(0, 0, 0, R.h);
        g.addColorStop(0, '#05070d');
        g.addColorStop(0.5, '#070b14');
        g.addColorStop(1, '#05070d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, R.w, R.h);
        R.drawGrid();
      },

      drawGrid() {
        ctx.save();
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < R.w; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, R.h); ctx.stroke();
        }
        for (let y = 0; y < R.h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(R.w, y); ctx.stroke();
        }
        ctx.restore();
      },

      /** Govde silueti. */
      drawBody() {
        ctx.save();
        ctx.beginPath();
        A.BODY_OUTLINE.forEach((p, i) => {
          const x = R.sx(p[0]), y = R.sy(p[1]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();

        const g = ctx.createLinearGradient(0, R.pad, 0, R.h - R.pad);
        g.addColorStop(0, 'rgba(30, 41, 59, 0.65)');
        g.addColorStop(0.5, 'rgba(21, 30, 45, 0.75)');
        g.addColorStop(1, 'rgba(30, 41, 59, 0.65)');
        ctx.fillStyle = g;
        ctx.fill();

        ctx.strokeStyle = COLORS.bodyStroke;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = 'rgba(94, 234, 212, 0.35)';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      },

      /** Damarlar (arka plan cizgileri). */
      drawVessels() {
        ctx.save();
        A.VESSELS.forEach(v => {
          ctx.beginPath();
          v.pts.forEach((p, i) => {
            const x = R.sx(p[0]), y = R.sy(p[1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = v.type === 'artery' ? COLORS.artery : COLORS.vein;
          ctx.lineWidth = Math.max(1.2, v.calibre * R.drawScale / 620);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        });
        ctx.restore();
      },

      /** Sinir yollari (arka plan). */
      drawNerves(state) {
        ctx.save();
        A.NERVES.forEach(n => {
          const active = state.lastTarget === n.target;
          ctx.beginPath();
          n.pts.forEach((p, i) => {
            const x = R.sx(p[0]), y = R.sy(p[1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = active
            ? (n.type === 'motor' ? COLORS.motor : COLORS.sensory)
            : COLORS.nerve;
          ctx.lineWidth = active ? 2.2 : 1.4;
          if (active) {
            ctx.shadowColor = n.type === 'motor' ? COLORS.motor : COLORS.sensory;
            ctx.shadowBlur = 12;
          }
          ctx.setLineDash(active ? [] : [4, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        });
        ctx.restore();
      },

      /** Organlar. Kalp kasilma fazina gore buyur/kucukler. */
      drawOrgans(state) {
        const o = A.ORGANS;

        // --- Akcigerler (solunum fazina gore sisip iner) ---
        const breath = Math.sin(state.respPhase * Math.PI * 2);
        const expand = 1 + breath * 0.07;
        [o.lungL, o.lungR].forEach(lung => {
          const rx = lung.rx * R.drawScale * (0.5 + 0.5 * expand - 0.5 + 0.5);
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            R.sx(lung.cx), R.sy(lung.cy),
            lung.rx * R.drawScale, lung.ry * R.drawScale * expand,
            0, 0, Math.PI * 2
          );
          const g = ctx.createRadialGradient(
            R.sx(lung.cx), R.sy(lung.cy), 2,
            R.sx(lung.cx), R.sy(lung.cy), lung.rx * R.drawScale
          );
          const o2 = Math.min(1, (state.spo2 - 60) / 40);
          g.addColorStop(0, `rgba(148, 163, 184, ${0.30 + 0.25 * o2})`);
          g.addColorStop(1, 'rgba(71, 85, 105, 0.18)');
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = 'rgba(94, 234, 212, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        });

        // --- Diyafram ---
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          R.sx(o.diaphragm.cx), R.sy(o.diaphragm.cy + breath * 0.012),
          o.diaphragm.rx * R.drawScale, o.diaphragm.ry * R.drawScale,
          0, 0, Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(94, 234, 212, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        // --- Omurilik ---
        ctx.save();
        const sc = o.spinalCord;
        ctx.beginPath();
        ctx.moveTo(R.sx(sc.x), R.sy(sc.y1));
        ctx.lineTo(R.sx(sc.x), R.sy(sc.y2));
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
        ctx.lineWidth = 2.4 + state.spinalLoad * 3.5;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
        ctx.shadowBlur = 6 + state.spinalLoad * 18;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // --- Beyin ---
        ctx.save();
        const br = o.brain;
        ctx.beginPath();
        ctx.ellipse(
          R.sx(br.cx), R.sy(br.cy),
          br.rx * R.drawScale, br.ry * R.drawScale, 0, 0, Math.PI * 2
        );
        const bg = ctx.createRadialGradient(
          R.sx(br.cx), R.sy(br.cy), 1,
          R.sx(br.cx), R.sy(br.cy), br.rx * R.drawScale
        );
        const brainGlow = 0.25 + state.spinalLoad * 0.5;
        bg.addColorStop(0, `rgba(168, 85, 247, ${0.35 + brainGlow * 0.4})`);
        bg.addColorStop(1, 'rgba(88, 28, 135, 0.25)');
        ctx.fillStyle = bg;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
        ctx.shadowBlur = 8 + state.spinalLoad * 20;
        ctx.fill();
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // beyin kirisik dokusu
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.28)';
        ctx.lineWidth = 0.9;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.ellipse(R.sx(br.cx), R.sy(br.cy + i * 0.012),
            br.rx * R.drawScale * (0.7 - Math.abs(i) * 0.15),
            br.ry * R.drawScale * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // --- Kalp (kasilma ile buyur) ---
        ctx.save();
        const h = o.heart;
        const c = state.contract; // 0..1
        const rBase = h.r * R.drawScale;
        const r = rBase * (1 - c * 0.16);          // sistolde kuculur
        const hx = R.sx(h.cx), hy = R.sy(h.cy);

        // kasilma halo
        if (c > 0.02) {
          ctx.beginPath();
          ctx.arc(hx, hy, rBase * (1.5 + c * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${c * 0.14})`;
          ctx.fill();
        }

        ctx.beginPath();
        // kalp sekli: iki daire + konik ucta birlestirme
        ctx.arc(hx - r * 0.34, hy - r * 0.22, r * 0.62, 0, Math.PI * 2);
        ctx.arc(hx + r * 0.34, hy - r * 0.22, r * 0.62, 0, Math.PI * 2);
        ctx.moveTo(hx - r * 0.94, hy - r * 0.14);
        ctx.lineTo(hx, hy + r * 1.25);
        ctx.lineTo(hx + r * 0.94, hy - r * 0.14);
        ctx.closePath();

        const hg = ctx.createRadialGradient(hx, hy, 1, hx, hy, r * 1.5);
        const heat = Math.min(1, state.hr / 180);
        hg.addColorStop(0, `rgba(${220 + 35 * heat}, ${60 + 30 * (1 - heat)}, ${70}, 0.85)`);
        hg.addColorStop(1, 'rgba(120, 20, 35, 0.55)');
        ctx.fillStyle = hg;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
        ctx.shadowBlur = 10 + c * 30;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(254, 202, 202, ${0.5 + c * 0.5})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // EKG cizgisi kalp uzerine bindirme
        ctx.beginPath();
        const ecgW = rBase * 2.2;
        const ecgX = hx - ecgW / 2, ecgY = hy + rBase * 1.75;
        ctx.moveTo(ecgX, ecgY);
        for (let i = 0; i <= 40; i++) {
          const p = i / 40;
          const x = ecgX + ecgW * p;
          let v = 0;
          // QRS dalgasi: beatPhase ile senkron
          const d = p - state.beatPhase;
          if (d > -0.06 && d < 0.06) v = Math.sin((d + 0.06) * 26) * 12;
          else if (d > 0.10 && d < 0.22) v = Math.sin((d - 0.10) * 26) * 4;
          ctx.lineTo(x, ecgY - v);
        }
        ctx.strokeStyle = `rgba(74, 222, 128, ${0.4 + c * 0.5})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
      },

      /** Kan parcaciklari. */
      drawBlood(blood, state) {
        ctx.save();
        const arteryColor = bloodTint(state.spo2, true);
        const veinColor = bloodTint(state.spo2, false);

        for (let i = 0; i < blood.particles.length; i++) {
          const p = blood.particles[i];
          const v = blood.vesselMap[p.vesselId];
          if (!v) continue;
          const pt = P.pointAt(v.pts, p.t);
          const x = R.sx(pt.x + p.jitter);
          const y = R.sy(pt.y);

          const rad = Math.max(1.1, p.size * (v.calibre / 2.2) * (R.drawScale / 420));

          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = p.type === 'artery' ? arteryColor : veinColor;
          ctx.globalAlpha = p.alpha;
          ctx.shadowColor = p.type === 'artery' ? '#ef4444' : '#3b82f6';
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      },

      /** Nabiz dalgalari. */
      drawPulses(pulses) {
        ctx.save();
        pulses.forEach(w => {
          const v = A.VESSELS.find(x => x.id === w.vesselId);
          if (!v) return;
          ctx.beginPath();
          v.pts.forEach((p, i) => {
            const x = R.sx(p[0]), y = R.sy(p[1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = `rgba(254, 240, 138, ${Math.max(0, 0.5 - w.life * 0.4)})`;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        });
        ctx.restore();
      },

      /** Sinir sinyal paketleri. */
      drawSignals(signals) {
        ctx.save();
        signals.forEach(s => {
          const n = A.NERVES.find(x => x.id === s.nerveId);
          if (!n) return;
          const pt = P.pointAt(n.pts, s.t);
          const x = R.sx(pt.x), y = R.sy(pt.y);
          const color = s.type === 'motor' ? COLORS.motor : COLORS.sensory;
          const fade = s.done ? Math.max(0, 1 - s.life / 0.55) : 1;

          // hale
          const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
          g.addColorStop(0, color);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.55 * fade;
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();

          // cekirdek
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.arc(x, y, s.done ? 6 : 4.2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fill();

          // hedefe varinca halka
          if (s.done) {
            ctx.beginPath();
            ctx.arc(x, y, 8 + s.life * 40, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.globalAlpha = fade * 0.7;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;
        ctx.restore();
      },

      /** Tiklanabilir bolge vurgusu (hover). */
      drawHover(zone, label) {
        if (!zone) return;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          R.sx(zone.cx), R.sy(zone.cy),
          zone.rx * R.drawScale, zone.ry * R.drawScale,
          0, 0, Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.10)';
        ctx.fill();

        if (label) {
          const x = R.sx(zone.cx), y = R.sy(zone.cy) - zone.ry * R.drawScale - 12;
          ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
          const w = ctx.measureText(label).width + 14;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
          roundRect(ctx, x - w / 2, y - 14, w, 20, 5);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fde68a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x, y - 4);
        }
        ctx.restore();
      },

      /** Olcek cubugu + bilgi. */
      drawHud(state) {
        ctx.save();
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`t = ${state.t.toFixed(1)}s`, 12, 10);
        ctx.fillText(`atış #${state.beatCount}`, 12, 26);
        ctx.restore();
      }
    };

    return R;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const api = { createRenderer, COLORS, bloodTint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumexBodyRender = api;
})(typeof window !== 'undefined' ? window : globalThis);
