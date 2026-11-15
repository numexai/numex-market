// NUMEX SMART CITY — görselleştirme katmanı (Canvas 2D)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function hex2rgb(h) {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mix(a, b, t) {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const f = clamp(t, 0, 1);
  const r = Math.round(A[0] + (B[0] - A[0]) * f);
  const g = Math.round(A[1] + (B[1] - A[1]) * f);
  const bl = Math.round(A[2] + (B[2] - A[2]) * f);
  return `rgb(${r},${g},${bl})`;
}
function sunFactor(h) {
  const t = (h - 6) / 12;
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

export class CityRenderer {
  constructor(canvas, city) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.city = city;
    this.dpr = 1;
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(360, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(260, Math.floor(rect.height * dpr));
    this.dpr = dpr;
    this.cw = this.canvas.width;
    this.ch = this.canvas.height;
    const pad = 28 * dpr;
    this.scale = Math.min(
      (this.cw - pad * 2) / this.city.world.w,
      (this.ch - pad * 2) / this.city.world.h
    );
    this.ox = (this.cw - this.city.world.w * this.scale) / 2;
    this.oy = (this.ch - this.city.world.h * this.scale) / 2;
  }

  toWorld(sx, sy) {
    return [(sx - this.ox) / this.scale, (sy - this.oy) / this.scale];
  }
  toScreen(wx, wy) {
    return [this.ox + wx * this.scale, this.oy + wy * this.scale];
  }

  congestionColor(c) {
    if (c >= 0.72) return '#ff4d4d';
    if (c >= 0.44) return '#ffa733';
    if (c >= 0.18) return '#ffe066';
    return '#35d69a';
  }

  draw(now) {
    const { ctx, city, scale: s } = this;
    const day = sunFactor(city.dayTime);
    const tSec = now / 1000;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = mix('#060a12', '#0e1723', day);
    ctx.fillRect(0, 0, this.cw, this.ch);

    // zemin dokusu (şehir bloğu)
    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.scale(s, s);

    const gw = city.world.w;
    const gh = city.world.h;
    ctx.fillStyle = mix('#0a1220', '#16202d', day);
    this.roundRect(ctx, -30, -30, gw + 60, gh + 60, 26);
    ctx.fill();

    // blok arka planları (binalar hissi)
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = mix('#111d2c', '#1d2a38', day);
    for (let r = 0; r < city.rows - 1; r++) {
      for (let c = 0; c < city.cols - 1; c++) {
        const A = city.nodes[r * city.cols + c];
        const B = city.nodes[(r + 1) * city.cols + c + 1];
        const x0 = A.x + 26;
        const y0 = A.y + 26;
        const w = B.x - A.x - 52;
        const h = B.y - A.y - 52;
        if (w > 10 && h > 10) this.roundRect(ctx, x0, y0, w, h, 8), ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // yollar
    for (const e of city.edges) {
      const A = city.nodes[e.a];
      const B = city.nodes[e.b];
      ctx.lineCap = 'round';
      ctx.strokeStyle = mix('#1b2532', '#2b3847', day);
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      if (e.closed) {
        ctx.strokeStyle = e.accident ? '#ff5252' : '#c46a2a';
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const col = this.congestionColor(e.congestion);
        ctx.globalAlpha = 0.18 + e.congestion * 0.62;
        ctx.strokeStyle = col;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // gece sokak lambası
    if (day < 0.55) {
      const gl = (1 - day / 0.55) * 0.5;
      for (const n of city.nodes) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 46);
        g.addColorStop(0, `rgba(255,214,140,${0.18 * gl})`);
        g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 46, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // kavşaklar ve ışıklar
    for (const n of city.nodes) {
      ctx.fillStyle = '#0b1420';
      ctx.strokeStyle = '#43536a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const ewGreen = n.phase === 'EW';
      const amb = city.priority.get(n.id);
      // yatay şerit
      ctx.fillStyle = ewGreen ? '#3ddc84' : '#7a2b34';
      this.roundRect(ctx, n.x - 7, n.y - 2.4, 14, 3.2, 1.6);
      ctx.fill();
      // dikey şerit
      ctx.fillStyle = !ewGreen ? '#3ddc84' : '#7a2b34';
      this.roundRect(ctx, n.x - 1.6, n.y - 7, 3.2, 14, 1.6);
      ctx.fill();

      if (amb) {
        ctx.strokeStyle = 'rgba(120, 210, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 13 + Math.sin(tSec * 8) * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // araçlar
    for (const v of city.vehicles) {
      if (v.remove) continue;
      const A = city.nodes[v.cur];
      const B = city.nodes[v.next];
      if (!A || !B) continue;
      if (A.id === B.id) continue;
      const x = A.x + (B.x - A.x) * v.t;
      const y = A.y + (B.y - A.y) * v.t;
      const ang = Math.atan2(B.y - A.y, B.x - A.x);
      const spec = v.type === 'car'
        ? { long: 12, wide: 6.4 }
        : v.type === 'bus'
          ? { long: 21, wide: 8 }
          : { long: 17, wide: 8 };

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      if (v.type === 'ambulance') {
        const pulse = 0.5 + 0.5 * Math.sin(tSec * 14 + v.halo);
        ctx.fillStyle = pulse > 0.5 ? 'rgba(255,70,70,0.30)' : 'rgba(80,170,255,0.30)';
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = v.color;
      this.roundRect(ctx, -spec.long / 2, -spec.wide / 2, spec.long, spec.wide, 2.4);
      ctx.fill();
      if (v.type === 'ambulance') {
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, -2, -1.5, 4, 3, 1);
        ctx.fill();
      }
      ctx.restore();

      if (v.wait && v.waitTime > 3 && v.type !== 'ambulance') {
        ctx.fillStyle = `rgba(255,120,120,${Math.min(0.8, 0.15 + v.waitTime / 30)})`;
        ctx.beginPath();
        ctx.arc(x, y - 10, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // kazalar
    for (const acc of city.accidents) {
      if (acc.resolved) continue;
      const pulse = 1 + Math.sin(tSec * 6) * 0.12;
      ctx.save();
      ctx.translate(acc.x, acc.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(255,60,60,0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#14060a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 2);
      ctx.restore();
    }

    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
