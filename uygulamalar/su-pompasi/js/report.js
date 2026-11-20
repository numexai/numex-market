/* Numex Atlas — dışa aktarma: CSV, SVG, mühendislik özeti
   Buradaki sayılar hidrolik sonucun aynısıdır; bağımsız yeniden hesap yok. */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function f(v, d) { return (v == null || !isFinite(v)) ? '—' : Number(v).toFixed(d == null ? 2 : d); }

  const ST_TEXT = {
    ok: 'Yeterli', low: 'Düşük basınç', negative: 'Negatif basınç', unsupplied: 'Beslemesiz'
  };

  function csv(net, result) {
    if (!result) return '';
    const rows = [];
    rows.push('Numex Atlas - Mahalle Basinç ve Debi Raporu');
    rows.push('Şebeke;' + net.name + ';Tarih;' + new Date().toLocaleString('tr-TR'));
    rows.push('Model;Q = g * (dH + s) dogrusal iletkenlik yaklasimi; egitim prototipi');
    rows.push('');
    rows.push('Mahalle;Kot (m);Hidrolik Yük (m);Basınç (m);Min Basınç (m);Talep (L/s);Karşılanan (L/s);Karşılanamayan (L/s);Durum');
    result.nodes.filter(n => n.type === 'neighborhood').forEach(n => {
      rows.push([
        n.name, f(n.elevation, 2), f(n.head, 3), f(n.pressure, 3), f(n.minPressure, 2),
        f(n.demand, 3), f(n.delivered, 3), f(Math.max(0, n.demand - n.delivered), 3),
        ST_TEXT[n.status] || n.status
      ].join(';'));
    });
    rows.push('');
    rows.push('Hat;Boru Tipi;Debi (L/s);Durum');
    result.edges.forEach(e => {
      rows.push([e.title, e.type, f(e.q, 3), e.open ? 'açık' : 'kapalı'].join(';'));
    });
    rows.push('');
    rows.push('Kütle Dengesi');
    rows.push('Depo çıkışı (L/s);' + f(result.totals.outflow, 3));
    rows.push('Toplam tüketim (L/s);' + f(result.totals.delivered, 3));
    rows.push('Hata (L/s);' + f(result.totals.massError, 4));
    rows.push('Toplam talep (L/s);' + f(result.totals.demand, 3));
    rows.push('Karşılanamayan (L/s);' + f(result.totals.unmet, 3));
    rows.push('Kritik mahalle;' + result.totals.critical);
    return rows.join('\r\n');
  }

  function flowColor(mag) {
    if (mag < 0.5) return '#5b768c';
    if (mag < 10) return '#2fa8c9';
    if (mag < 25) return '#1fb98d';
    return '#e0a63a';
  }

  function svg(net, result) {
    const W = 1400, H = 900;
    const em = result ? result.edgeById : {};
    const out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">');
    out.push('<style>text{font-family:Segoe UI,Arial,sans-serif}.lbl{font-size:13px;font-weight:600;fill:#132029;text-anchor:middle}.val{font-size:12px;fill:#20495c;text-anchor:middle;font-family:Consolas,monospace}</style>');
    out.push('<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>');
    out.push('<text x="24" y="34" style="font-size:18px;font-weight:700;fill:#0d2a36">Numex Atlas — ' + esc(net.name) + '</text>');
    out.push('<text x="24" y="56" style="font-size:12px;fill:#5a7280">' + esc(new Date().toLocaleString('tr-TR')) + ' · Q = g·Δh doğrusal model · hidrolik yük (m) ve basınç (m) değerleri hesaplanmıştır</text>');

    net.edges.forEach(e => {
      const a = net.getNode(e.from), b = net.getNode(e.to);
      if (!a || !b) return;
      const r = em[e.id];
      const q = r ? r.q : 0, mag = Math.abs(q);
      const dir = q >= 0 ? 1 : -1;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      let color = e.open ? flowColor(mag) : '#9aa8b2';
      let w = e.open ? (2 + Math.min(7, mag / 6)) : 2.5;
      const dash = e.open ? '' : ' stroke-dasharray="8 6"';
      out.push('<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + color + '" stroke-width="' + w.toFixed(1) + '" stroke-linecap="round"' + dash + '/>');
      const px = a.x + dx * 0.5 - uy * 13, py = a.y + dy * 0.5 + ux * 13;
      out.push('<text class="val" x="' + px.toFixed(1) + '" y="' + py.toFixed(1) + '">' + (e.open ? (f(mag, 1) + ' L/s') : 'kapalı') + '</text>');
      if (e.open && mag > 0.2) {
        const ax = a.x + dx * 0.68, ay = a.y + dy * 0.68;
        const ang = Math.atan2(dy * dir, dx * dir) * 180 / Math.PI;
        out.push('<polygon points="0,-5 10,0 0,5" fill="' + color + '" transform="translate(' + ax.toFixed(1) + ',' + ay.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')"/>');
      }
      if (e.type === 'pump') {
        out.push('<circle cx="' + (a.x + dx * 0.5) + '" cy="' + (a.y + dy * 0.5) + '" r="14" fill="#eef7fb" stroke="' + (e.open ? '#1f7fa0' : '#9aa8b2') + '" stroke-width="2"/>');
        out.push('<text x="' + (a.x + dx * 0.5) + '" y="' + (a.y + dy * 0.5 + 5) + '" class="lbl" style="font-size:12px">P</text>');
      }
      if (e.type === 'valve') {
        const mx = a.x + dx * 0.5, my = a.y + dy * 0.5;
        out.push('<polygon points="' + mx + ',' + (my - 11) + ' ' + (mx + 11) + ',' + my + ' ' + mx + ',' + (my + 11) + ' ' + (mx - 11) + ',' + my + '" fill="' + (e.open ? '#e6f8d8' : '#eef1f3') + '" stroke="' + (e.open ? '#4f9d1f' : '#9aa8b2') + '" stroke-width="2"/>');
      }
    });

    net.nodes.forEach(nd => {
      const r = result ? result.nodeById[nd.id] : null;
      if (nd.type === 'reservoir') {
        out.push('<rect x="' + (nd.x - 52) + '" y="' + (nd.y - 30) + '" width="104" height="60" rx="6" fill="#e8f6fb" stroke="#1f7fa0" stroke-width="2"/>');
        out.push('<rect x="' + (nd.x - 52) + '" y="' + (nd.y + 2) + '" width="104" height="28" rx="4" fill="#b9e4f2"/>');
        out.push('<text class="lbl" x="' + nd.x + '" y="' + (nd.y - 38) + '">' + esc(nd.name) + '</text>');
        out.push('<text class="val" x="' + nd.x + '" y="' + (nd.y + 2) + '">H=' + f(nd.head, 1) + ' m</text>');
        out.push('<text class="val" x="' + nd.x + '" y="' + (nd.y + 48) + '">debinin yönü oklarla</text>');
      } else if (nd.type === 'junction') {
        out.push('<circle class="shape" cx="' + nd.x + '" cy="' + nd.y + '" r="15" fill="#e8f1f7" stroke="#2b6b86" stroke-width="2"/>');
        out.push('<text class="lbl" x="' + nd.x + '" y="' + (nd.y - 23) + '">' + esc(nd.name) + '</text>');
        out.push('<text class="val" x="' + nd.x + '" y="' + (nd.y + 4) + '">' + (r && isFinite(r.pressure) ? f(r.pressure, 1) + ' m' : '—') + '</text>');
      } else {
        const st = r ? r.status : 'unsupplied';
        const fill = st === 'ok' ? '#e3f8ea' : st === 'low' ? '#fdf1d8' : st === 'negative' ? '#fde3e2' : '#e9edf1';
        const stroke = st === 'ok' ? '#2f9e57' : st === 'low' ? '#c98515' : st === 'negative' ? '#c0392b' : '#8b97a1';
        out.push('<rect x="' + (nd.x - 58) + '" y="' + (nd.y - 30) + '" width="116" height="60" rx="9" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>');
        out.push('<text class="lbl" x="' + nd.x + '" y="' + (nd.y - 11) + '">' + esc(nd.name) + '</text>');
        out.push('<text class="val" x="' + nd.x + '" y="' + (nd.y + 8) + '">' + (r && isFinite(r.pressure) ? f(r.pressure, 2) + ' m' : 'beslemesiz') + '</text>');
        out.push('<text class="val" x="' + nd.x + '" y="' + (nd.y + 24) + '">' + (r ? f(r.delivered, 1) : '0.0') + ' / ' + f(nd.demand, 1) + ' L/s</text>');
      }
    });

    out.push('</svg>');
    return out.join('\n');
  }

  function summaryHtml(net, result, baseline) {
    if (!result) return '<h1>Sonuç yok</h1>';
    const t = result.totals;
    const rowsN = result.nodes.filter(n => n.type === 'neighborhood').map(n =>
      '<tr><td>' + esc(n.name) + '</td><td>' + f(n.elevation, 1) + '</td><td>' + f(n.head, 2) + '</td><td>' +
      f(n.pressure, 2) + '</td><td>' + f(n.minPressure, 1) + '</td><td>' + f(n.demand, 2) + '</td><td>' +
      f(n.delivered, 2) + '</td><td>' + (ST_TEXT[n.status] || n.status) + '</td></tr>').join('');
    const rowsE = result.edges.map(e =>
      '<tr><td>' + esc(e.title) + '</td><td>' + e.type + '</td><td>' + f(e.q, 2) + '</td><td>' + (e.open ? 'açık' : 'kapalı') + '</td></tr>').join('');
    let cmp = '';
    if (baseline) {
      cmp = '<h2>Önce / Sonra</h2><table><tr><th>Ölçüt</th><th>Önce</th><th>Sonra</th><th>Fark</th></tr>' +
        cmpRow('Karşılanan debi (L/s)', baseline.delivered, t.delivered, 2) +
        cmpRow('Karşılanamayan (L/s)', baseline.unmet, t.unmet, 2) +
        cmpRow('Kritik mahalle', baseline.critical, t.critical, 0) +
        cmpRow('En düşük basınç (m)', baseline.minPressure, t.minPressure, 2) + '</table>';
    }
    return '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Numex Atlas — Mühendislik Özeti</title>' +
      '<style>body{font-family:"Segoe UI",Arial,sans-serif;color:#12212b;margin:28px;font-size:13px}' +
      'h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:22px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}' +
      '.meta{color:#5b7280;font-size:12px;margin-bottom:14px}table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th,td{border:1px solid #d3dde3;padding:5px 7px;text-align:right}th{background:#eef4f7;font-weight:600}' +
      'td:first-child,th:first-child{text-align:left}ul{margin:6px 0 0 18px;padding:0}li{margin:2px 0}' +
      '.kpi{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}.kpi div{border:1px solid #d3dde3;border-radius:8px;padding:8px 12px;min-width:130px}' +
      '.kpi b{display:block;font-size:17px;margin-top:3px}.note{color:#7a8b96;font-size:11px;margin-top:6px}' +
      '@media print{body{margin:12mm}}</style></head><body>' +
      '<h1>Numex Atlas — Mühendislik Özeti</h1>' +
      '<div class="meta">Şebeke: <b>' + esc(net.name) + '</b> · ' + esc(new Date().toLocaleString('tr-TR')) +
      ' · Model: Q = g·(Δh + s), doğrusal iletkenlik yaklaşımı</div>' +
      '<div class="kpi"><div>Toplam talep<b>' + f(t.demand, 1) + ' L/s</b></div>' +
      '<div>Karşılanan<b>' + f(t.delivered, 1) + ' L/s</b></div>' +
      '<div>Karşılanamayan<b>' + f(t.unmet, 1) + ' L/s</b></div>' +
      '<div>Kritik mahalle<b>' + t.critical + '</b></div>' +
      '<div>Kütle dengesi hatası<b>' + f(t.massError, 4) + ' L/s</b></div>' +
      '<div>En düşük basınç<b>' + f(t.minPressure, 2) + ' m</b></div></div>' +
      cmp +
      '<h2>Mahalle Basınç ve Debi Tablosu</h2><table><tr><th>Mahalle</th><th>Kot (m)</th><th>Hidrolik yük (m)</th><th>Basınç (m)</th><th>Min (m)</th><th>Talep (L/s)</th><th>Karşılanan (L/s)</th><th>Durum</th></tr>' + rowsN + '</table>' +
      '<h2>Hat Debileri</h2><table><tr><th>Hat</th><th>Tip</th><th>Debi (L/s)</th><th>Durum</th></tr>' + rowsE + '</table>' +
      '<h2>Uyarılar</h2><ul>' + (result.warnings.length ? result.warnings.map(w => '<li>' + esc(w) + '</li>').join('') : '<li>Uyarı yok.</li>') + '</ul>' +
      '<p class="note">Bu rapor Numex Atlas eğitim prototipinin lineer hidrolik çözücüsüyle üretilmiştir. Gerçek su şebekelerinin doğrusal olmayan davranışını birebir temsil etmez; yatırım veya işletme kararı için mühendislik yazılımı yerine geçmez.</p>' +
      '</body></html>';
  }

  function cmpRow(label, a, b, d) {
    const diff = (isFinite(a) && isFinite(b)) ? (b - a) : NaN;
    return '<tr><td>' + label + '</td><td>' + f(a, d) + '</td><td>' + f(b, d) + '</td><td>' + (isFinite(diff) ? (diff > 0 ? '+' : '') + diff.toFixed(d) : '—') + '</td></tr>';
  }

  global.NumexReport = { csv: csv, svg: svg, summaryHtml: summaryHtml, statusText: ST_TEXT };
})(window);
