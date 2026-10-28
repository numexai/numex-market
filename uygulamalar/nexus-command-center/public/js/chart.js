'use strict';

/**
 * Grafik motoru — harici kütüphane YOK, saf Canvas 2D.
 * İki grafik türü:
 *  1) barChart  → proje ilerleme yüzdeleri (yatay çubuklar)
 *  2) donut     → görev durum dağılımı (halka)
 * Yüksek DPI ekranlarda keskin çizim için devicePixelRatio ölçeklenir.
 */

const Chart = (() => {

  function prep(canvas, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
    const h = cssHeight || canvas.clientHeight || 200;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.arcTo(x + w, y, x + w, y + rad, rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
    ctx.lineTo(x + rad, y + h);
    ctx.arcTo(x, y + h, x, y + h - rad, rad);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x, y, x + rad, y, rad);
    ctx.closePath();
  }

  /**
   * Yatay çubuk grafik — proje ilerlemeleri.
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label:string,value:number,color:string,sub?:string}>} items
   */
  function barChart(canvas, items) {
    const rowH = 42;
    const height = Math.max(120, items.length * rowH + 16);
    const { ctx, w, h } = prep(canvas, height);
    if (!items.length) { emptyText(ctx, w, h); return; }

    const labelW = Math.min(180, Math.max(110, w * 0.34));
    const valueW = 46;
    const trackX = labelW + 10;
    const trackW = Math.max(40, w - trackX - valueW);

    const styles = getComputedStyle(document.body);
    const track = styles.getPropertyValue('--track').trim() || '#1e293b';
    const text = styles.getPropertyValue('--text-dim').trim() || '#94a3b8';
    const textStrong = styles.getPropertyValue('--text').trim() || '#e2e8f0';

    ctx.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';

    items.forEach((item, i) => {
      const y = 8 + i * rowH;
      const barY = y + 16;
      const barH = 10;

      // Etiket
      ctx.fillStyle = textStrong;
      ctx.textAlign = 'left';
      const label = truncate(ctx, item.label, labelW - 8);
      ctx.fillText(label, 0, barY + barH / 2 - 7);

      // Alt etiket (görev sayısı)
      if (item.sub) {
        ctx.fillStyle = text;
        ctx.font = '11px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(item.sub, 0, barY + barH / 2 + 9);
        ctx.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
      }

      // Ray
      ctx.fillStyle = track;
      roundRect(ctx, trackX, barY, trackW, barH, 5);
      ctx.fill();

      // Dolgu
      const pct = Math.max(0, Math.min(100, item.value));
      const fillW = Math.max(pct > 0 ? 4 : 0, (pct / 100) * trackW);
      if (fillW > 0) {
        ctx.fillStyle = item.color || '#4f8cff';
        roundRect(ctx, trackX, barY, fillW, barH, 5);
        ctx.fill();
      }

      // Yüzde
      ctx.fillStyle = textStrong;
      ctx.textAlign = 'right';
      ctx.fillText(pct + '%', w - 2, barY + barH / 2);
      ctx.textAlign = 'left';
    });
  }

  /**
   * Halka grafik — görev durum dağılımı.
   * @param {Array<{label:string,value:number,color:string}>} slices
   * @param {{total?:number, centerLabel?:string}} opts
   */
  function donut(canvas, slices, opts = {}) {
    const size = Math.min(canvas.parentElement.clientWidth || 240, 240);
    const { ctx, w, h } = prep(canvas, Math.max(180, Math.min(size, 220)));
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 10;
    const inner = radius * 0.62;

    const total = slices.reduce((s, x) => s + x.value, 0);

    if (total === 0) {
      emptyText(ctx, w, h, 'Henüz görev yok');
      return;
    }

    let angle = -Math.PI / 2;
    slices.forEach((slice) => {
      if (!slice.value) return;
      const sweep = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      angle += sweep;
    });

    // İç boşluk (halka efekti)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Merkez metin
    const styles = getComputedStyle(document.body);
    const textStrong = styles.getPropertyValue('--text').trim() || '#e2e8f0';
    const textDim = styles.getPropertyValue('--text-dim').trim() || '#94a3b8';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textStrong;
    ctx.font = '600 26px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText(String(opts.total !== undefined ? opts.total : total), cx, cy - 6);

    ctx.fillStyle = textDim;
    ctx.font = '11px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText(opts.centerLabel || 'GÖREV', cx, cy + 16);
    ctx.textAlign = 'left';
  }

  function truncate(ctx, str, maxWidth) {
    if (ctx.measureText(str).width <= maxWidth) return str;
    let s = str;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  function emptyText(ctx, w, h, text = 'Görüntülenecek veri yok') {
    const styles = getComputedStyle(document.body);
    ctx.fillStyle = styles.getPropertyValue('--text-dim').trim() || '#94a3b8';
    ctx.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    ctx.textAlign = 'left';
  }

  /** Pencere yeniden boyutlanınca grafikleri tazelemek için kayıtlı çizimler. */
  const registry = new Set();

  function attach(canvas, drawFn) {
    const entry = { canvas, drawFn };
    registry.add(entry);
    drawFn();
    return entry;
  }

  function refreshAll() {
    registry.forEach((entry) => {
      if (entry.canvas.isConnected) entry.drawFn();
      else registry.delete(entry);
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshAll, 120);
  });

  return { barChart, donut, attach, refreshAll };
})();
