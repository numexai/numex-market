/* Numex Atlas — etkileşimli arayüz */
(function () {
  'use strict';

  const NetMod = window.NumexNetwork;
  const Network = NetMod.Network;
  const NODE_LABEL = NetMod.NODE_LABEL;
  const EDGE_LABEL = NetMod.EDGE_LABEL;
  const H = window.NumexHydraulics;
  const RPT = window.NumexReport;
  const SCN = window.NumexScenarios;

  const W = 1400, HGT = 900;

  let net = null;
  let result = null;
  let baseline = null;
  let selected = null;
  let mode = 'select';
  let pendingFrom = null;
  let drag = null;
  let proposal = null;
  let log = [];
  let originJson = null;
  let solveTimer = null;
  let testReport = null;
  let outflowMap = {};

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(v, d) { return (v == null || !isFinite(v)) ? '—' : Number(v).toFixed(d == null ? 2 : d); }
  function setStatus(msg, isErr) {
    const el = $('#status');
    el.textContent = msg;
    el.className = isErr ? 'err' : '';
  }

  /* ---------------- başlangıç ---------------- */
  function init() {
    const sel = $('#scenarioSelect');
    SCN.list.forEach(s => {
      const o = document.createElement('option');
      o.value = s.key; o.textContent = s.name; o.title = s.desc;
      sel.appendChild(o);
    });

    bindChrome();
    bindCanvas();
    bindProps();
    bindTabs();

    loadScenario('s1', true);
    runTests();
  }

  function bindTabs() {
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      $$('.tab-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      $('#panel-' + t.dataset.tab).classList.add('active');
    }));
  }

  function bindChrome() {
    $$('.tool').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    $('#btnLoadScenario').addEventListener('click', () => loadScenario($('#scenarioSelect').value));
    $('#scenarioSelect').addEventListener('change', () => loadScenario($('#scenarioSelect').value));
    $('#btnNew').addEventListener('click', () => {
      net = SCN.empty();
      originJson = JSON.parse(JSON.stringify(net.toJSON()));
      selected = null; pendingFrom = null; baseline = null; proposal = null; log = [];
      refresh(true);
      setStatus('Boş şebeke. Soldan eleman ekleyerek başla.');
    });
    $('#btnSolve').addEventListener('click', () => { refresh(true); setStatus('Şebeke yeniden çözüldü (' + (result ? result.iterations : 0) + ' iterasyon).'); });
    $('#btnReset').addEventListener('click', resetToOrigin);
    $('#btnDelete').addEventListener('click', deleteSelected);

    $('#btnSaveJson').addEventListener('click', () => {
      if (!net) return;
      download(safeName(net.name) + '.json', JSON.stringify(net.toJSON(), null, 2), 'application/json');
      setStatus('JSON kaydedildi.');
    });
    $('#btnLoadJson').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', onFile);
    $('#btnCsv').addEventListener('click', () => {
      if (!result) return;
      download(safeName(net.name) + '-rapor.csv', '\uFEFF' + RPT.csv(net, result), 'text/csv;charset=utf-8');
      setStatus('CSV raporu indirildi.');
    });
    $('#btnSvg').addEventListener('click', () => {
      download(safeName(net.name) + '.svg', RPT.svg(net, result), 'image/svg+xml;charset=utf-8');
      setStatus('SVG çizimi indirildi.');
    });
    $('#btnPrint').addEventListener('click', () => {
      const w = window.open('', '_blank');
      if (!w) { setStatus('Açılır pencere engellendi; tarayıcı iznini kontrol et.', true); return; }
      w.document.open();
      w.document.write(RPT.summaryHtml(net, result, baseline));
      w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350);
    });

    document.addEventListener('keydown', ev => {
      const tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); deleteSelected(); }
      if (ev.key === 'Escape') { pendingFrom = null; setMode('select'); }
    });
  }

  function safeName(s) { return String(s || 'sebeke').replace(/[^\wğüşıöçĞÜŞİÖÇ-]+/g, '-').toLowerCase(); }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function onFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const obj = JSON.parse(String(reader.result));
        const loaded = Network.fromJSON(obj);
        net = loaded;
        originJson = JSON.parse(JSON.stringify(net.toJSON()));
        selected = null; pendingFrom = null; baseline = null; proposal = null; log = [];
        refresh(true);
        setStatus('Şebeke yüklendi: ' + net.name + ' (' + net.nodes.length + ' düğüm)');
      } catch (err) {
        setStatus('JSON yüklenemedi: ' + err.message, true);
      }
    };
    reader.readAsText(file, 'utf-8');
    ev.target.value = '';
  }

  /* ---------------- senaryo ---------------- */
  function loadScenario(key, quiet) {
    net = SCN.create(key);
    originJson = JSON.parse(JSON.stringify(net.toJSON()));
    selected = null; pendingFrom = null; baseline = null; proposal = null; log = [];
    setMode('select');
    refresh(true);
    $('#scenarioSelect').value = key;
    if (!quiet) setStatus('Senaryo yüklendi: ' + net.name + ' — ' + (net.desc || ''));
  }

  function resetToOrigin() {
    if (!originJson) return;
    net = Network.fromJSON(originJson);
    selected = null; pendingFrom = null; baseline = null; proposal = null; log = [];
    refresh(true);
    setStatus('Şebeke başlangıç durumuna döndürüldü.');
  }

  function setMode(m) {
    mode = m || 'select';
    if (mode !== 'connect-pipe' && mode !== 'connect-pump' && mode !== 'connect-valve') pendingFrom = null;
    $$('.tool').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const hints = {
      select: 'Seçim modu · düğümleri sürükle, elemana tıkla',
      'add-reservoir': 'Boş alana tıkla → su deposu eklenir',
      'add-junction': 'Boş alana tıkla → dağıtım düğümü eklenir',
      'add-neighborhood': 'Boş alana tıkla → mahalle eklenir',
      'connect-pipe': 'Boru: sırayla iki düğüme tıkla',
      'connect-pump': 'Pompa: sırayla iki düğüme tıkla (çıkış → basış yönü)',
      'connect-valve': 'Vana: sırayla iki düğüme tıkla'
    };
    $('#modeHint').textContent = hints[mode] || '';
    if (net) renderCanvas();
  }

  /* ---------------- çözüm ---------------- */
  function refresh(alsoProps) {
    let err = null;
    try { result = H.solve(net); }
    catch (e) { console.error(e); err = e; result = null; }
    if (err) setStatus('Hesaplama hatası: ' + err.message, true);
    renderCanvas();
    renderKpis();
    renderResults();
    renderCrisis();
    if (alsoProps) renderProps();
    $('#netTitle').textContent = net.name + '  ·  ' + net.nodes.length + ' düğüm / ' + net.edges.length + ' hat';
    if (result && result.warnings.length && !err) setStatus('Çözüldü · ' + result.warnings[0], result.totals.critical > 0);
  }

  function scheduleSolve() {
    clearTimeout(solveTimer);
    solveTimer = setTimeout(() => refresh(false), 200);
  }

  /* ---------------- canvas ---------------- */
  function bindCanvas() {
    const svg = $('#netSvg');
    svg.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  function worldPoint(ev) {
    const svg = $('#netSvg');
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 100, y: 100 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function onDown(ev) {
    if (!net) return;
    const nodeEl = ev.target.closest('[data-node]');
    const edgeEl = ev.target.closest('[data-edge]');

    if (mode.indexOf('add-') === 0) {
      if (nodeEl || edgeEl) return;
      const p = worldPoint(ev);
      const type = mode.slice(4);
      const created = net.addNode({ type: type, x: Math.round(p.x), y: Math.round(p.y) });
      selected = { kind: 'node', id: created.id };
      setMode('select');
      refresh(true);
      setStatus(created.name + ' eklendi.');
      return;
    }

    if (mode.indexOf('connect-') === 0) {
      if (!nodeEl) { pendingFrom = null; renderCanvas(); return; }
      const id = nodeEl.getAttribute('data-node');
      if (!pendingFrom) {
        pendingFrom = id;
        renderCanvas();
        setStatus('Başlangıç: ' + net.getNode(id).name + ' — ikinci düğüme tıkla.');
        return;
      }
      if (pendingFrom === id) { pendingFrom = null; renderCanvas(); return; }
      const type = mode.slice(8);
      try {
        const ed = net.addEdge({ type: type, from: pendingFrom, to: id });
        selected = { kind: 'edge', id: ed.id };
        setStatus(EDGE_LABEL[type] + ' eklendi: ' + net.edgeTitle(ed));
      } catch (err) { setStatus(err.message, true); }
      pendingFrom = null;
      setMode('select');
      refresh(true);
      return;
    }

    if (nodeEl) {
      const id = nodeEl.getAttribute('data-node');
      selected = { kind: 'node', id: id };
      drag = { id: id, moved: false, sx: ev.clientX, sy: ev.clientY };
      renderCanvas(); renderProps();
      return;
    }
    if (edgeEl) {
      selected = { kind: 'edge', id: edgeEl.getAttribute('data-edge') };
      renderCanvas(); renderProps();
      return;
    }
    selected = null;
    renderCanvas(); renderProps();
  }

  function onMove(ev) {
    if (!drag || !net) return;
    const moved = Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) > 3;
    if (moved) drag.moved = true;
    if (!drag.moved) return;
    const p = worldPoint(ev);
    const nd = net.getNode(drag.id);
    if (!nd) return;
    nd.x = Math.max(60, Math.min(W - 60, Math.round(p.x)));
    nd.y = Math.max(50, Math.min(HGT - 40, Math.round(p.y)));
    renderCanvas();
  }

  function onUp() {
    if (drag && drag.moved) { refresh(false); renderProps(); }
    drag = null;
  }

  function deleteSelected() {
    if (!net || !selected) { setStatus('Silinecek bir şey seçili değil.', true); return; }
    if (selected.kind === 'node') net.removeNode(selected.id);
    else net.removeEdge(selected.id);
    selected = null;
    refresh(true);
    setStatus('Silindi.');
  }

  function computeOutflows() {
    const m = {};
    net.nodes.forEach(n => { if (n.type === 'reservoir') m[n.id] = 0; });
    if (!result) return m;
    net.edges.forEach(e => {
      const q = result.flows.get(e.id) || 0;
      if (m[e.from] !== undefined) m[e.from] += q;
      if (m[e.to] !== undefined) m[e.to] -= q;
    });
    return m;
  }

  function flowColor(mag) {
    if (mag < 0.5) return '#3b5870';
    if (mag < 8) return '#2fa8c9';
    if (mag < 20) return '#20c19a';
    return '#f0b445';
  }

  function renderCanvas() {
    const svg = $('#netSvg');
    if (!net) { svg.innerHTML = ''; return; }
    const em = result ? result.edgeById : {};
    const nm = result ? result.nodeById : {};
    const out = [];
    out.push('<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">' +
      '<path d="M40 0H0V40" fill="none" stroke="#121e29" stroke-width="1"/></pattern></defs>');
    out.push('<rect x="0" y="0" width="' + W + '" height="' + HGT + '" fill="url(#grid)"/>');

    // NUMEX-DÜZELTME (2026-11-19): Depo altındaki 'çıkış 0' metni sabit sıfır basıyordu; gerçek debi gösterilmeli.
    outflowMap = computeOutflows();
    net.edges.forEach(e => out.push(edgeMarkup(e, em[e.id])));
    net.nodes.forEach(n => out.push(nodeMarkup(n, nm[n.id])));

    if (pendingFrom) {
      const n = net.getNode(pendingFrom);
      if (n) out.push('<circle cx="' + n.x + '" cy="' + n.y + '" r="34" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="5 5"/>');
    }
    svg.innerHTML = out.join('');
  }

  function edgeMarkup(e, rr) {
    const a = net.getNode(e.from), b = net.getNode(e.to);
    if (!a || !b) return '';
    const isSel = selected && selected.kind === 'edge' && selected.id === e.id;
    const q = rr ? rr.q : 0;
    const mag = Math.abs(q);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const mx = a.x + dx * 0.5, my = a.y + dy * 0.5;
    const dir = q < 0 ? -1 : 1;

    let color = '#33506a', width = 3, dash = '', label = '';
    if (e.type === 'pipe') {
      if (!e.open) { color = '#3c4d5e'; dash = ' stroke-dasharray="7 6"'; label = 'kapalı'; }
      else { color = flowColor(mag); width = 2.5 + Math.min(7, mag / 6); label = fmt(mag, 1) + ' L/s'; }
    } else if (e.type === 'pump') {
      color = e.open ? '#7dd3fc' : '#3c4d5e';
      label = e.open ? ('+' + fmt(e.pumpHead, 1) + ' m') : 'durduruldu';
      if (!e.open) dash = ' stroke-dasharray="7 6"';
    } else {
      color = e.open ? '#a3e635' : '#3c4d5e';
      label = e.open ? 'açık' : 'kapalı';
      if (!e.open) dash = ' stroke-dasharray="7 6"';
    }

    let s = '<g class="' + (isSel ? 'sel' : '') + '">';
    s += '<line class="shape" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
      '" stroke="' + color + '" stroke-width="' + width.toFixed(1) + '" stroke-linecap="round"' + dash + '/>';

    if (e.open && mag > 0.3) {
      const px = a.x + dx * 0.72, py = a.y + dy * 0.72;
      const ang = Math.atan2(dy * dir, dx * dir) * 180 / Math.PI;
      s += '<polygon points="0,-5.5 11,0 0,5.5" fill="' + color + '" transform="translate(' + px.toFixed(1) + ',' + py.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')"/>';
    }

    if (e.type === 'pump') {
      s += '<circle cx="' + mx + '" cy="' + my + '" r="17" fill="#0c1620" stroke="' + color + '" stroke-width="2"/>';
      s += '<text x="' + mx + '" y="' + (my + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="' + color + '">P</text>';
    } else if (e.type === 'valve') {
      s += '<polygon points="' + mx + ',' + (my - 13) + ' ' + (mx + 13) + ',' + my + ' ' + mx + ',' + (my + 13) + ' ' + (mx - 13) + ',' + my +
        '" fill="#0c1620" stroke="' + color + '" stroke-width="2"/>';
      s += '<text x="' + mx + '" y="' + (my + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + color + '">V</text>';
    }

    const lx = mx - uy * 16, ly = my + ux * 16;
    s += '<text class="e-label" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '">' + esc(label) + '</text>';

    s += '<line class="hit" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" data-edge="' + e.id + '"/>';
    s += '</g>';
    return s;
  }

  function nodeMarkup(nd, r) {
    const isSel = selected && selected.kind === 'node' && selected.id === nd.id;
    const cls = 'node' + (isSel ? ' sel' : '');
    let s = '<g class="' + cls + '" data-node="' + nd.id + '" transform="translate(' + nd.x + ',' + nd.y + ')">';

    if (nd.type === 'reservoir') {
      const lvl = Math.max(6, Math.min(28, 10 + (Number(nd.head) || 0) / 6));
      s += '<rect class="shape" x="-54" y="-30" width="108" height="60" rx="7" fill="#0d2130" stroke="#2b7f9e" stroke-width="2"/>';
      s += '<rect x="-52" y="' + (28 - lvl) + '" width="104" height="' + lvl + '" rx="5" fill="#124a63" opacity="0.9"/>';
      s += '<text class="n-label" y="-38">' + esc(nd.name) + '</text>';
      s += '<text class="n-val" y="4">H=' + fmt(nd.head, 1) + ' m</text>';
      s += '<text class="n-sub" y="20">' + fmt(nd.capacity, 0) + ' m³</text>';
      const outQ = outflowMap[nd.id];
      if (isFinite(outQ)) s += '<text class="n-sub" y="48">çıkış ' + fmt(outQ, 1) + ' L/s</text>';
    } else if (nd.type === 'junction') {
      s += '<circle class="shape" cx="0" cy="0" r="15" fill="#0f2434" stroke="#2f7f9e" stroke-width="2"/>';
      s += '<text class="n-label" y="-23">' + esc(nd.name) + '</text>';
      s += '<text class="n-val" y="32" style="paint-order:stroke;stroke:#08111a;stroke-width:3.5px">' +
        (r && isFinite(r.pressure) ? fmt(r.pressure, 1) + ' m' : '—') + '</text>';
    } else {
      const st = r ? r.status : 'unsupplied';
      const colors = {
        ok: ['#123324', '#37d67a'], low: ['#3a2f10', '#f5b041'],
        negative: ['#3a1414', '#ef5350'], unsupplied: ['#1c2229', '#7b8b99']
      };
      const c = colors[st] || colors.unsupplied;
      s += '<rect class="shape" x="-60" y="-30" width="120" height="60" rx="9" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"' +
        (st === 'unsupplied' ? ' stroke-dasharray="6 5"' : '') + '/>';
      s += '<text class="n-label" y="-11">' + esc(nd.name) + '</text>';
      s += '<text class="n-val" y="9" style="fill:' + c[1] + '">' +
        (r && isFinite(r.pressure) ? fmt(r.pressure, 2) + ' m' : 'beslemesiz') + '</text>';
      s += '<text class="n-sub" y="24">' + (r ? fmt(r.delivered, 1) : '0.0') + ' / ' + fmt(nd.demand, 1) + ' L/s</text>';
    }
    s += '</g>';
    return s;
  }

  /* ---------------- KPI + sonuçlar ---------------- */
  function renderKpis() {
    const el = $('#kpis');
    if (!result) { el.innerHTML = '<div class="kpi"><span>Durum</span><b>—</b></div>'; return; }
    const t = result.totals;
    const nbh = result.nodes.filter(n => n.type === 'neighborhood').length;
    const minCls = !isFinite(t.minPressure) ? 'bad' : (t.minPressure < 20 ? 'warn' : 'ok');
    const items = [
      { l: 'Toplam Talep', v: fmt(t.demand, 1), s: 'L/s', c: '' },
      { l: 'Karşılanan', v: fmt(t.delivered, 1), s: 'L/s', c: 'ok' },
      { l: 'Karşılanamayan', v: fmt(t.unmet, 1), s: 'L/s', c: t.unmet > 0.05 ? 'bad' : 'ok' },
      { l: 'Kritik Mahalle', v: String(t.critical), s: '/ ' + nbh, c: t.critical > 0 ? 'bad' : 'ok' },
      { l: 'En Düşük Basınç', v: fmt(t.minPressure, 1), s: 'm', c: minCls },
      { l: 'Depo Çıkışı', v: fmt(t.outflow, 1), s: 'L/s', c: 'acc' },
      { l: 'Kütle Hatası', v: fmt(t.massError, 3), s: 'L/s', c: Math.abs(t.massError) > 0.05 ? 'warn' : 'ok' }
    ];
    el.innerHTML = items.map(i => '<div class="kpi ' + i.c + '"><span>' + i.l + '</span><b>' + i.v +
      ' <small>' + i.s + '</small></b></div>').join('');
  }

  function stCell(st) {
    const map = { ok: ['st-ok', 'Yeterli'], low: ['st-low', 'Düşük'], negative: ['st-neg', 'Negatif'], unsupplied: ['st-off', 'Beslemesiz'] };
    const m = map[st] || map.unsupplied;
    return '<span class="' + m[0] + '">' + m[1] + '</span>';
  }

  function renderResults() {
    const el = $('#panel-results');
    if (!result) { el.innerHTML = '<p class="empty">Sonuç yok.</p>'; return; }
    const t = result.totals;

    let h = '<div class="sect-title">Mahalle Basınçları</div>';
    h += '<table class="gt"><thead><tr><th>Mahalle</th><th>Kot</th><th>Yük</th><th>Basınç</th><th>Talep</th><th>Karş.</th><th>Durum</th></tr></thead><tbody>';
    result.nodes.filter(n => n.type === 'neighborhood').forEach(n => {
      h += '<tr><td>' + esc(n.name) + '</td><td>' + fmt(n.elevation, 1) + '</td><td>' + fmt(n.head, 1) +
        '</td><td>' + fmt(n.pressure, 2) + '</td><td>' + fmt(n.demand, 1) + '</td><td>' + fmt(n.delivered, 1) +
        '</td><td>' + stCell(n.status) + '</td></tr>';
    });
    h += '</tbody></table>';

    h += '<div class="sect-title">Depolar</div><table class="gt"><thead><tr><th>Depo</th><th>Yük (m)</th><th>Kapasite</th><th>Çıkış (L/s)</th></tr></thead><tbody>';
    result.nodes.filter(n => n.type === 'reservoir').forEach(n => {
      const raw = net.getNode(n.id);
      let out = 0;
      net.edges.forEach(e => {
        const q = result.flows.get(e.id) || 0;
        if (e.from === n.id) out += q;
        if (e.to === n.id) out -= q;
      });
      h += '<tr><td>' + esc(n.name) + '</td><td>' + fmt(n.head, 1) + '</td><td>' + fmt(raw ? raw.capacity : 0, 0) +
        ' m³</td><td>' + fmt(out, 2) + '</td></tr>';
    });
    if (!result.nodes.some(n => n.type === 'reservoir')) h += '<tr><td colspan="4" class="st-neg">Rezervuar yok — sınır koşulu tanımsız</td></tr>';
    h += '</tbody></table>';

    h += '<div class="sect-title">Pompalar</div><table class="gt"><thead><tr><th>Pompa</th><th>Basma (m)</th><th>Debi</th><th>Durum</th></tr></thead><tbody>';
    net.edges.filter(e => e.type === 'pump').forEach(e => {
      const r = result.edgeById[e.id];
      h += '<tr><td>' + esc(net.edgeTitle(e)) + '</td><td>' + fmt(e.pumpHead, 1) + '</td><td>' + fmt(r ? r.q : 0, 2) +
        '</td><td>' + (e.open ? '<span class="st-ok">çalışıyor</span>' : '<span class="st-off">durdu</span>') + '</td></tr>';
    });
    if (!net.edges.some(e => e.type === 'pump')) h += '<tr><td colspan="4">Pompa yok.</td></tr>';
    h += '</tbody></table>';

    h += '<div class="sect-title">Borularda Debi</div><table class="gt"><thead><tr><th>Hat</th><th>Q (L/s)</th><th>Durum</th></tr></thead><tbody>';
    result.edges.filter(e => e.type === 'pipe').forEach(e => {
      h += '<tr><td>' + esc(e.title) + '</td><td>' + fmt(e.q, 2) + '</td><td>' + (e.open ? 'açık' : '<span class="st-off">kapalı</span>') + '</td></tr>';
    });
    h += '</tbody></table>';

    h += '<div class="sect-title">Kütle Dengesi</div><table class="gt"><tbody>' +
      '<tr><td>Depo çıkışı</td><td>' + fmt(t.outflow, 3) + ' L/s</td></tr>' +
      '<tr><td>Toplam tüketim</td><td>' + fmt(t.delivered, 3) + ' L/s</td></tr>' +
      '<tr><td>Hata</td><td class="' + (Math.abs(t.massError) > 0.05 ? 'st-low' : 'st-ok') + '">' + fmt(t.massError, 4) + ' L/s</td></tr>' +
      '<tr><td>İterasyon / yakınsama</td><td>' + result.iterations + ' / ' + (result.converged ? 'evet' : 'hayır') + '</td></tr>' +
      '</tbody></table>';

    if (window.NumexValidator) {
      const v = window.NumexValidator.validate(net, result);
      h += '<div class="sect-title">Bağımsız Doğrulama</div>' +
        (v.ok ? '<p class="st-ok" style="margin:0 0 6px;font-size:11.5px">Tüm denetimler geçti — sonuç çözücüden bağımsız olarak yeniden kontrol edildi.</p>'
              : '<p class="st-neg" style="margin:0 0 6px;font-size:11.5px">Bazı denetimler başarısız.</p>') +
        '<table class="gt"><tbody>' + v.checks.map(c =>
          '<tr><td>' + esc(c.name) + '</td><td class="' + (c.pass ? 't-pass' : 't-fail') + '">' +
          (c.pass ? '✓' : '✕') + ' ' + (c.value === 0 ? '0' : Number(c.value).toExponential(1)) + '</td></tr>').join('') +
        '</tbody></table>';
    }

    if (baseline) {
      h += '<div class="sect-title">Önce / Sonra</div><table class="gt"><thead><tr><th>Ölçüt</th><th>Önce</th><th>Sonra</th></tr></thead><tbody>';
      h += cmpRow('Karşılanan (L/s)', baseline.delivered, t.delivered, 2);
      h += cmpRow('Karşılanamayan (L/s)', baseline.unmet, t.unmet, 2);
      h += cmpRow('Kritik mahalle', baseline.critical, t.critical, 0);
      h += cmpRow('En düşük basınç', baseline.minPressure, t.minPressure, 2);
      h += '</tbody></table>';
    }

    if (result.warnings.length) {
      h += '<div class="sect-title">Uyarılar</div><ul class="log">' + result.warnings.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>';
    }

    h += '<p class="hint">Model: Q = g·(Δh + s). Boru iletkenliği g = 0.005·D<sup>2.5</sup>/(L·k). Gerçek doğrusal olmayan boru yasasının yerini tutmaz; eğitim amaçlıdır.</p>';
    el.innerHTML = h;
  }

  function cmpRow(label, a, b, d) {
    const diff = (isFinite(a) && isFinite(b)) ? (b - a) : NaN;
    const cls = !isFinite(diff) ? '' : (diff > 0.0001 ? 'st-ok' : diff < -0.0001 ? 'st-neg' : '');
    return '<tr><td>' + label + '</td><td>' + fmt(a, d) + '</td><td class="' + cls + '">' + fmt(b, d) +
      '</td></tr>';
  }

  /* ---------------- özellik paneli ---------------- */
  function bindProps() {
    $('#panel-props').addEventListener('input', onPropInput);
    $('#panel-props').addEventListener('change', onPropInput);
  }

  function fieldInput(obj, key, label, step, isCheck) {
    if (isCheck) {
      return '<label class="chk"><input type="checkbox" data-field="' + key + '"' + (obj[key] ? ' checked' : '') + '> ' + label + '</label>';
    }
    return '<div class="field"><label>' + label + '</label><input type="number" step="' + (step || 1) +
      '" data-field="' + key + '" value="' + (isFinite(obj[key]) ? obj[key] : 0) + '"></div>';
  }

  function renderProps() {
    const el = $('#panel-props');
    if (!net || !selected) { el.innerHTML = '<p class="empty">Bir eleman seç: özellikleri burada düzenlenir, her değişiklik şebekeyi yeniden çözer.</p>'; return; }

    if (selected.kind === 'node') {
      const n = net.getNode(selected.id);
      if (!n) { el.innerHTML = '<p class="empty">Eleman bulunamadı.</p>'; return; }
      const r = result ? result.nodeById[n.id] : null;
      let h = '<div class="field"><label>Ad</label><input type="text" data-field="name" value="' + esc(n.name) + '"></div>';
      h += '<span class="pill">' + (NODE_LABEL[n.type] || n.type) + '</span>';
      if (n.type === 'reservoir') {
        h += fieldInput(n, 'head', 'Hidrolik yük (m)', 0.5);
        h += fieldInput(n, 'capacity', 'Kapasite (m³)', 100);
      }
      h += fieldInput(n, 'elevation', 'Kot (m)', 0.5);
      if (n.type === 'neighborhood') {
        h += fieldInput(n, 'demand', 'Talep edilen debi (L/s)', 0.5);
        h += fieldInput(n, 'minPressure', 'Min. gerekli basınç (m)', 0.5);
      }
      h += '<div class="row2">' + fieldInput(n, 'x', 'X', 1) + fieldInput(n, 'y', 'Y', 1) + '</div>';
      if (r) {
        h += '<div class="sect-title">Anlık</div><table class="gt"><tbody>' +
          '<tr><td>Hidrolik yük</td><td>' + fmt(r.head, 2) + ' m</td></tr>' +
          '<tr><td>Basınç</td><td>' + fmt(r.pressure, 2) + ' m</td></tr>' +
          (n.type === 'neighborhood'
            ? '<tr><td>Karşılanan</td><td>' + fmt(r.delivered, 2) + ' / ' + fmt(r.demand, 2) + ' L/s</td></tr>' +
              '<tr><td>Durum</td><td>' + stCell(r.status) + '</td></tr>'
            : '') +
          '</tbody></table>';
      }
      el.innerHTML = h;
      return;
    }

    const e = net.getEdge(selected.id);
    if (!e) { el.innerHTML = '<p class="empty">Eleman bulunamadı.</p>'; return; }
    const rr = result ? result.edgeById[e.id] : null;
    let h = '<span class="pill">' + (EDGE_LABEL[e.type] || e.type) + '</span>';
    h += '<div class="field" style="margin-top:10px"><label>Bağlantı</label><input type="text" value="' + esc(net.edgeTitle(e)) + '" disabled></div>';
    if (e.type === 'pipe') {
      h += fieldInput(e, 'length', 'Uzunluk (m)', 10);
      h += fieldInput(e, 'diameter', 'Çap (mm)', 10);
      h += fieldInput(e, 'coeff', 'Direnç katsayısı k', 0.05);
    }
    if (e.type === 'pump') h += fieldInput(e, 'pumpHead', 'Basma yüksekliği (m)', 0.5);
    h += fieldInput(e, 'open', 'Açık', null, true);
    if (rr) {
      h += '<div class="sect-title">Anlık</div><table class="gt"><tbody>' +
        '<tr><td>Debi</td><td>' + fmt(rr.q, 3) + ' L/s</td></tr>' +
        '<tr><td>Yön</td><td>' + (Math.abs(rr.q) < 0.05 ? '—' : ((rr.q > 0 ? '→ ' + net.getNode(e.to).name : '← ' + net.getNode(e.from).name))) + '</td></tr>' +
        '<tr><td>İletkenlik</td><td>' + fmt(H.conductanceOf(e), 3) + ' L/s·m⁻¹</td></tr>' +
        '</tbody></table>';
    }
    el.innerHTML = h;
  }

  function onPropInput(ev) {
    const inp = ev.target.closest('[data-field]');
    if (!inp || !selected) return;
    const field = inp.getAttribute('data-field');
    const obj = selected.kind === 'node' ? net.getNode(selected.id) : net.getEdge(selected.id);
    if (!obj) return;
    let val;
    if (inp.type === 'checkbox') val = inp.checked;
    else if (inp.type === 'number') { val = Number(inp.value); if (!isFinite(val)) return; }
    else val = inp.value;
    obj[field] = val;
    renderCanvas();
    scheduleSolve();
  }

  /* ---------------- kriz laboratuvarı ---------------- */
  function snapshot(label) {
    if (!result) return null;
    return {
      label: label || 'önce',
      delivered: result.totals.delivered,
      unmet: result.totals.unmet,
      critical: result.totals.critical,
      minPressure: result.totals.minPressure
    };
  }

  function mainPipe() {
    let best = null, bestQ = -1;
    net.edges.forEach(e => {
      if (e.type !== 'pipe' || !e.open) return;
      const q = result && result.edgeById[e.id] ? Math.abs(result.edgeById[e.id].q) : 0;
      if (q > bestQ) { bestQ = q; best = e; }
    });
    return best;
  }

  function doCrisis(kind) {
    if (!net) return;
    if (kind === 'reset') { resetToOrigin(); log = []; renderCrisis(); return; }
    baseline = snapshot('önce');
    const msgs = [];
    if (kind === 'A' || kind === 'D') {
      const p = mainPipe();
      if (p) { p.open = false; msgs.push('Ana hat devre dışı: ' + net.edgeTitle(p)); }
      else msgs.push('Kapatılacak açık boru bulunamadı.');
    }
    if (kind === 'B' || kind === 'D') {
      const pump = net.edges.filter(e => e.type === 'pump' && e.open)[0];
      if (pump) { pump.open = false; msgs.push('Pompa durduruldu: ' + net.edgeTitle(pump)); }
      else msgs.push('Çalışan pompa yok.');
    }
    if (kind === 'C') {
      net.nodes.forEach(n => { if (n.type === 'neighborhood') n.demand = (Number(n.demand) || 0) * 1.6; });
      msgs.push('Tüm mahalle talepleri %60 artırıldı.');
    }
    log.unshift({ k: kind, msg: msgs.join(' ') });
    refresh(false);
    renderCrisis();
    setStatus('Olay ' + kind + ' uygulandı ve şebeke yeniden çözüldü.');
  }

  function renderCrisis() {
    const el = $('#panel-crisis');
    const t = result ? result.totals : null;
    let h = '<div class="sect-title">Olay Tetikle</div><div class="crisis-grid">';
    h += '<button class="crisis-btn danger" data-crisis="A"><b>A — Ana boru patladı</b>En yüksek debili hat devre dışı kalır.</button>';
    h += '<button class="crisis-btn danger" data-crisis="B"><b>B — Pompa durdu</b>Basma yüksekliği kaldırılır.</button>';
    h += '<button class="crisis-btn" data-crisis="C"><b>C — Akşam zirvesi</b>Mahalle talepleri %60 artar.</button>';
    h += '<button class="crisis-btn danger" data-crisis="D"><b>D — İki arıza</b>Bir hat kapanır, bir pompa durur.</button>';
    h += '<button class="crisis-btn wide" id="btnPropose">⚙ Müdahale Öner</button>';
    h += '<button class="crisis-btn wide" data-crisis="reset">↺ Olayları Sıfırla (senaryoyu geri yükle)</button>';
    h += '</div>';

    if (t) {
      h += '<div class="sect-title">Anlık Durum</div><table class="gt"><tbody>' +
        '<tr><td>Kritik mahalle</td><td class="' + (t.critical ? 'st-neg' : 'st-ok') + '">' + t.critical + '</td></tr>' +
        '<tr><td>Beslemesiz mahalle</td><td class="' + (t.unsupplied ? 'st-neg' : 'st-ok') + '">' + t.unsupplied + '</td></tr>' +
        '<tr><td>Karşılanamayan</td><td>' + fmt(t.unmet, 2) + ' L/s</td></tr>' +
        '<tr><td>En düşük basınç</td><td>' + fmt(t.minPressure, 2) + ' m</td></tr>' +
        '</tbody></table>';
    }

    if (log.length) {
      h += '<div class="sect-title">Olay Günlüğü</div><ul class="log">' +
        log.slice(0, 8).map(l => '<li><b>' + l.k + '</b> · ' + esc(l.msg) + '</li>').join('') + '</ul>';
    }

    if (proposal) h += proposalHtml();

    el.innerHTML = h;

    $$('#panel-crisis [data-crisis]').forEach(b => b.addEventListener('click', () => doCrisis(b.dataset.crisis)));
    const bp = $('#btnPropose');
    if (bp) bp.addEventListener('click', doPropose);
    const ap = $('#btnApplyProposal');
    if (ap) ap.addEventListener('click', applyProposal);
  }

  function proposalHtml() {
    const p = proposal;
    let h = '<div class="proposal"><h3>Müdahale Önerisi</h3>';
    if (!p.found) {
      h += '<p>Denenen ' + p.tried + ' kombinasyon içinde ölçülebilir bir iyileşme bulunamadı.</p>';
    } else {
      const gainP = p.bestScore.sumPressure - p.baseScore.sumPressure;
      h += '<p><b>Yeterli mahalle: ' + p.baseScore.served + ' → ' + p.bestScore.served +
        ' (' + (p.bestScore.served - p.baseScore.served >= 0 ? '+' : '') + (p.bestScore.served - p.baseScore.served) + ')</b><br>' +
        'Karşılanan debi: ' + fmt(p.baseScore.delivered, 1) + ' → ' + fmt(p.bestScore.delivered, 1) + ' L/s<br>' +
        'Basınç toplamı kazancı: ' + (gainP >= 0 ? '+' : '') + fmt(gainP, 1) + ' m</p>';
      h += '<ul>' + p.actions.map(a => '<li>' + esc(a.label) + ' → ' + (a.kind === 'valve' ? 'durumu değiştir' : 'aç') + '</li>').join('') + '</ul>';
      h += '<button class="btn btn-accent small" id="btnApplyProposal">Öneriyi Uygula ve Ölç</button>';
    }
    h += '<p class="hint" style="border:0;padding:0;margin-top:8px">' + esc(p.note) + ' Denenen: ' + p.tried + '/' + p.candidates + ' kombinasyon.</p></div>';
    return h;
  }

  function doPropose() {
    if (!result) return;
    proposal = H.proposeIntervention(net, result);
    renderCrisis();
    setStatus(proposal.found ? 'Müdahale önerisi bulundu.' : 'Denenen kombinasyonlarda iyileşme bulunamadı.');
  }

  function applyProposal() {
    if (!proposal || !proposal.found) return;
    baseline = snapshot('önce');
    proposal.actions.forEach(a => {
      const ed = net.getEdge(a.id);
      if (!ed) return;
      if (a.kind === 'valve') ed.open = !ed.open;
      else ed.open = true;
    });
    const applied = proposal.actions.map(a => a.label);
    log.unshift({ k: 'M', msg: 'Müdahale uygulandı: ' + applied.join(', ') });
    proposal = null;
    refresh(true);
    setStatus('Müdahale uygulandı ve sonuç ölçüldü.');
  }

  /* ---------------- testler ---------------- */
  function runTests() {
    try {
      testReport = window.NumexTests.runAll();
      renderTests();
    } catch (e) {
      console.error(e);
      $('#panel-tests').innerHTML = '<p class="empty st-neg">Test motoru çalıştırılamadı: ' + esc(e.message) + '</p>';
    }
  }

  function renderTests() {
    const el = $('#panel-tests');
    if (!testReport) { el.innerHTML = '<p class="empty">Henüz çalıştırılmadı.</p>'; return; }
    const pass = testReport.tests.filter(t => t.pass).length;
    const total = testReport.tests.length;
    let h = '<div class="test-sum">' +
      (pass === total ? '<span class="badge-ok">' + pass + ' / ' + total + ' test geçti</span>'
        : '<span class="badge-bad">' + pass + ' / ' + total + ' test geçti</span>') +
      '<button class="btn small" id="btnRunTests">Yeniden Çalıştır</button></div>';
    h += '<div class="test-list">';
    testReport.tests.forEach(t => {
      h += '<div class="test-item' + (t.pass ? '' : ' bad') + '">' +
        '<div class="test-head"><span class="test-id">' + t.id + '</span>' +
        '<span class="test-name">' + esc(t.name) + '</span>' +
        '<span class="' + (t.pass ? 't-pass' : 't-fail') + '">' + (t.pass ? '✓' : '✕') + '</span></div>' +
        '<div class="test-detail"><span>Beklenen:</span> ' + esc(t.expected) + '</div>' +
        '<div class="test-detail"><span>Ölçülen:</span> ' + esc(t.actual) + '</div>' +
        (t.note ? '<div class="test-detail muted">' + esc(t.note) + '</div>' : '') +
        '</div>';
    });
    h += '</div>';
    h += '<p class="hint">Testler uygulamadan bağımsız kurulan küçük şebekelerde analitik beklenen değerlerle karşılaştırılır (tests.js).</p>';
    el.innerHTML = h;
    const b = $('#btnRunTests');
    if (b) b.addEventListener('click', runTests);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
