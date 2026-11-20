/* =====================================================================
   NUMEX ÇİZGİ — arayüz katmanı
   Motor (js/core.js) saf ve deterministik; burada sadece görüntüleme,
   giriş ve dışa aktarma var. Hesaplama her zaman motorda yapılır.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.CIZGI;
  if (!S) { document.body.innerHTML = '<pre style="color:#f88;padding:20px">Motor yüklenemedi (js/core.js).</pre>'; return; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LS = 'numex-cizgi-v1';

  var state = {
    stock: { material: 'MDF', width: 2440, height: 1220, qty: 4, cost: 850, kerf: 3, margin: 10 },
    parts: [], strategy: 'auto', result: null, runs: [],
    sheet: 0, zoom: 1, showKerf: true, selected: null, nextId: 1
  };

  var SEBEP = {
    'too-big': 'levhaya sığmıyor',
    'no-sheet': 'stok bitti',
    'material': 'malzeme uyuşmuyor',
    'invalid': 'ölçü geçersiz'
  };

  /* ---------------- biçimlendirme ---------------- */
  function n0(n) { return (Math.round(n) || 0).toLocaleString('tr-TR'); }
  function n2(n) { return (Math.round(n * 10) / 10).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function tl(n) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'; }
  function html(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------------- stok ---------------- */
  function readStock() {
    state.stock = {
      material: $('#st-material').value,
      width: +$('#st-width').value || 0,
      height: +$('#st-height').value || 0,
      qty: Math.max(0, Math.floor(+$('#st-qty').value || 0)),
      cost: Math.max(0, +$('#st-cost').value || 0),
      kerf: Math.max(0, +$('#st-kerf').value || 0),
      margin: Math.max(0, +$('#st-margin').value || 0)
    };
  }
  function writeStock() {
    $('#st-material').value = state.stock.material;
    $('#st-width').value = state.stock.width;
    $('#st-height').value = state.stock.height;
    $('#st-qty').value = state.stock.qty;
    $('#st-cost').value = state.stock.cost;
    $('#st-kerf').value = state.stock.kerf;
    $('#st-margin').value = state.stock.margin;
  }

  /* ---------------- parçalar ---------------- */
  function partRow(p, i) {
    return '<tr data-id="' + html(p.id) + '">' +
      '<td class="num">' + (i + 1) + '</td>' +
      '<td><input data-field="name" value="' + html(p.name) + '" placeholder="Parça adı"></td>' +
      '<td><input type="number" min="0" step="1" class="sm" data-field="w" value="' + p.w + '"></td>' +
      '<td><input type="number" min="0" step="1" class="sm" data-field="h" value="' + p.h + '"></td>' +
      '<td><input type="number" min="0" step="1" class="sm" data-field="qty" value="' + p.qty + '"></td>' +
      '<td class="c"><input type="checkbox" data-field="rotatable"' + (p.rotatable ? ' checked' : '') + '></td>' +
      '<td><input class="sm" data-field="material" value="' + html(p.material) + '"></td>' +
      '<td class="c"><button class="icon" data-del="1" title="Parçayı sil">✕</button></td>' +
      '</tr>';
  }
  function renderParts() {
    $('#parts-body').innerHTML = state.parts.map(partRow).join('') ||
      '<tr><td colspan="8" style="color:#93a7bd;padding:12px;text-align:center">Parça yok. “+ Parça” ile ekle.</td></tr>';
    $$('#parts-body tr[data-id]').forEach(function (tr) {
      tr.title = 'Çift tık: satırı kopyala';
      tr.addEventListener('dblclick', function () {
        var p = findPart(tr.getAttribute('data-id'));
        if (!p) return;
        var kopya = { id: 'p' + (state.nextId++), name: p.name, w: p.w, h: p.h, qty: p.qty, rotatable: p.rotatable, material: p.material };
        state.parts.push(kopya);
        renderParts(); schedule();
      });
    });
  }
  function findPart(id) {
    for (var i = 0; i < state.parts.length; i++) if (state.parts[i].id === id) return state.parts[i];
    return null;
  }
  function addPart(over) {
    var p = {
      id: 'p' + (state.nextId++), name: '', w: 100, h: 100, qty: 1, rotatable: true,
      material: state.stock.material
    };
    if (over) for (var k in over) if (over.hasOwnProperty(k)) p[k] = over[k];
    state.parts.push(p);
    return p;
  }

  /* ---------------- hesaplama ---------------- */
  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; optimize(); }, 180);
  }

  function optimize() {
    var all = S.pack(state.stock, state.parts, 'auto');
    state.runs = all.runs;
    var sec = null;
    if (state.strategy !== 'auto') {
      for (var i = 0; i < all.runs.length; i++) if (all.runs[i].strategy === state.strategy) sec = all.runs[i];
    }
    state.result = sec || { strategy: all.strategy, sheets: all.sheets, unplaced: all.unplaced, stats: all.stats, violations: all.violations, stock: all.stock, total: all.total };
    state.result.bestStrategy = all.bestStrategy;
    state.result.runs = all.runs;
    if (state.sheet >= state.result.sheets.length) state.sheet = 0;
    render();
    try { localStorage.setItem(LS, JSON.stringify({ stock: state.stock, parts: state.parts, strategy: state.strategy })); } catch (e) { }
  }

  /* ---------------- görüntüleme ---------------- */
  function render() {
    renderStats();
    renderWarnings();
    renderSheetTabs();
    renderPlan();
    renderUnplaced();
    renderFill();
    renderCompare();
  }

  function renderStats() {
    var st = state.result.stats;
    $('#sum-sheets').textContent = st.sheets + ' / ' + st.totalSheets;
    var wEl = $('#sum-waste');
    wEl.textContent = n2(st.wastePct) + ' %';
    wEl.parentNode.className = 'stat ' + (st.wastePct > 45 ? 'bad' : st.wastePct < 25 ? 'good' : '');
    $('#sum-cost').textContent = tl(st.cost);
    var pl = $('#sum-placed');
    pl.textContent = st.placed + ' / ' + st.total;
    pl.parentNode.className = 'stat ' + (st.unplaced > 0 ? 'bad' : 'good');
    $('#sum-partsarea').textContent = n0(st.partsArea) + ' mm²';
    $('#sum-stockarea').textContent = n0(st.stockArea) + ' mm²';
  }

  function renderWarnings() {
    var r = state.result, st = r.stats, out = [];

    if (r.violations && r.violations.length) {
      out.push('<div class="alert bad"><b>Doğrulayıcı hata buldu:</b>&nbsp;' + html(r.violations[0].msg) +
        (r.violations.length > 1 ? ' (+' + (r.violations.length - 1) + ')' : '') + '</div>');
    }
    if (st.totalSheets === 0) {
      out.push('<div class="alert bad"><b>Stok adedi 0.</b> Levha eklemeden yerleşim yapılamaz.</div>');
    }
    if (st.unplaced > 0) {
      var say = {};
      r.unplaced.forEach(function (u) { say[u.reason] = (say[u.reason] || 0) + 1; });
      var d = [];
      for (var k in say) if (say.hasOwnProperty(k)) d.push(say[k] + ' × ' + (SEBEP[k] || k));
      out.push('<div class="alert warn"><b>' + st.unplaced + ' parça yerleşmedi.</b>&nbsp;(' + d.join(' · ') +
        ') ' + (say['no-sheet'] ? 'Stok adedini artırmayı dene. ' : '') +
        (say['too-big'] ? 'Levhadan büyük parçalar hiçbir ayarla sığmaz. ' : '') + '</div>');
    }
    if (st.unplaced === 0 && st.placed > 0) {
      out.push('<div class="alert ok"><b>Tüm parçalar yerleşti.</b>&nbsp;' + st.sheets + ' levha, fire %' +
        n2(st.wastePct) + ', maliyet ' + tl(st.cost) + '.</div>');
    }
    $('#warnings').innerHTML = out.join('');
  }

  function renderSheetTabs() {
    var n = state.result.sheets.length, el = $('#sheet-tabs');
    if (!n) { el.innerHTML = '<span class="hint" style="margin:0">Levha yok</span>'; return; }
    var h = [];
    for (var i = 0; i < n; i++) h.push('<button data-sheet="' + i + '"' + (i === state.sheet ? ' class="active"' : '') + '>Levha ' + (i + 1) + '</button>');
    el.innerHTML = h.join('');
  }

  function renderPlan() {
    var r = state.result, holder = $('#svg-holder');
    if (!r.sheets.length) {
      holder.innerHTML = '<div class="hint" style="margin:auto;text-align:center;padding:40px">Yerleşim yok.<br>Stok ve parça tanımla, sonuç burada çizilir.</div>';
      return;
    }
    holder.innerHTML = S.renderSheetSVG(r, state.sheet, { showKerf: state.showKerf });
    fitSvg();
    if (state.selected) markSelected();
  }

  function fitSvg() {
    var holder = $('#svg-holder'), svg = holder.querySelector('svg');
    if (!svg) return;
    var st = state.result.stock;
    var pad = Math.max(st.width, st.height) * 0.02;
    var availW = Math.max(240, holder.clientWidth - 22);
    var scale = Math.min(availW / (st.width + 2 * pad), 620 / (st.height + 2 * pad));
    svg.style.width = ((st.width + 2 * pad) * scale * state.zoom) + 'px';
    svg.style.height = ((st.height + 2 * pad) * scale * state.zoom) + 'px';
  }

  function markSelected() {
    $$('#svg-holder rect.part').forEach(function (rc) {
      rc.classList.toggle('secili', rc.getAttribute('data-iid') === state.selected);
    });
  }

  function renderUnplaced() {
    var r = state.result, el = $('#unplaced');
    $('#unplaced-count').textContent = r.unplaced.length;
    $('#unplaced-count').className = 'pill' + (r.unplaced.length ? ' bad' : ' ok');
    if (!r.unplaced.length) { el.innerHTML = '<p class="hint" style="margin:2px 0">Yerleşmeyen parça yok. 🎯</p>'; return; }
    var h = ['<ul class="upl">'];
    r.unplaced.forEach(function (u) {
      h.push('<li><div><div class="nm">' + html(u.name) + '</div><div class="dm">' +
        n0(u.w) + ' × ' + n0(u.h) + ' mm · ' + html(u.material || '—') + (u.rotatable ? ' · dönebilir' : ' · sabit yön') +
        '</div></div><div class="rz">' + html(SEBEP[u.reason] || u.reason) + '</div></li>');
    });
    h.push('</ul>');
    el.innerHTML = h.join('');
  }

  function renderFill() {
    var r = state.result, el = $('#sheet-fill');
    if (!r.sheets.length) { el.innerHTML = '<p class="hint" style="margin:2px 0">—</p>'; return; }
    var h = ['<div class="fill">'];
    r.sheets.forEach(function (sh, i) {
      h.push('<div class="row"><span>L' + (i + 1) + '</span><span class="bar"><i style="width:' +
        Math.min(100, sh.fillPct).toFixed(1) + '%"></i></span><b>' + n2(sh.fillPct) + '%</b></div>');
    });
    h.push('</div>');
    el.innerHTML = h.join('');
  }

  function renderCompare() {
    var runs = state.runs || [], body = $('#cmp-body');
    var en = null;
    runs.forEach(function (run) {
      if (!en) { en = run; return; }
      if (run.unplaced.length < en.unplaced.length ||
        (run.unplaced.length === en.unplaced.length && run.sheets.length < en.sheets.length) ||
        (run.unplaced.length === en.unplaced.length && run.sheets.length === en.sheets.length && run.stats.wastePct < en.stats.wastePct)) en = run;
    });
    body.innerHTML = runs.map(function (run) {
      var st = run.stats, best = run === en;
      return '<tr class="' + (best ? 'is-best' : '') + '">' +
        '<td>' + html(strategyName(run.strategy)) + (best ? ' <span class="pill ok">en iyi</span>' : '') + '</td>' +
        '<td>' + st.sheets + '</td>' +
        '<td>' + st.placed + '</td>' +
        '<td class="' + (st.unplaced ? 'best' : '') + '">' + st.unplaced + '</td>' +
        '<td>' + n2(st.wastePct) + '</td>' +
        '<td>' + n2(st.utilization) + '</td>' +
        '<td>' + tl(st.cost) + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="hint">—</td></tr>';

    if (runs.length > 1) {
      var levhaFark = runs.map(function (r) { return r.sheets.length; });
      var azami = Math.max.apply(null, levhaFark), asgari = Math.min.apply(null, levhaFark);
      var enIyiAd = runs.filter(function (r) { return r.sheets.length === asgari; })
        .map(function (r) { return strategyName(r.strategy); }).join(', ');
      $('#cmp-note').innerHTML = 'Levha sayısı ' + asgari + (azami !== asgari ? '–' + azami : '') +
        ' arasında değişiyor. En az levhayı kullanan: <b>' + html(enIyiAd) + '</b>. ' +
        'Aktif görünüm: <b>' + html(state.strategy === 'auto' ? 'otomatik (en iyi)' : strategyName(state.strategy)) + '</b>.';
    }
  }

  function strategyName(id) {
    for (var i = 0; i < S.STRATEGIES.length; i++) if (S.STRATEGIES[i].id === id) return S.STRATEGIES[i].name;
    return id;
  }

  function renderDetail(p) {
    var el = $('#detail');
    if (!p) { el.innerHTML = '<p class="hint">Parçaya tıklayınca ayrıntıları burada görünür.</p>'; return; }
    var hue = (function (id) { var h = 0, s = String(id || 'x'); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; })(p.partId);
    el.innerHTML =
      '<div class="swatch" style="background:hsl(' + hue + ',62%,58%)"></div>' +
      '<h3>' + html(p.name) + '</h3>' +
      '<dl>' +
      '<dt>Levha</dt><dd>' + p.sheet + ' / ' + state.result.sheets.length + '</dd>' +
      '<dt>Ölçü</dt><dd>' + n0(p.w) + ' × ' + n0(p.h) + ' mm</dd>' +
      '<dt>Ham ölçü</dt><dd>' + n0(p.origW) + ' × ' + n0(p.origH) + '</dd>' +
      '<dt>Yön</dt><dd>' + (p.rotated ? 'döndürülmüş ↻' : 'orijinal') + '</dd>' +
      '<dt>Konum</dt><dd>X ' + n0(p.x) + ' · Y ' + n0(p.y) + '</dd>' +
      '<dt>Sağ/alt</dt><dd>' + n0(p.x + p.w) + ' · ' + n0(p.y + p.h) + '</dd>' +
      '<dt>Alan</dt><dd>' + n0(p.w * p.h) + ' mm²</dd>' +
      '<dt>Malzeme</dt><dd>' + html(p.material || '—') + '</dd>' +
      '</dl>';
  }

  /* ---------------- testler ---------------- */
  function runTests() {
    var el = $('#test-list'), sum = $('#test-summary');
    el.innerHTML = '<p class="hint">Çalışıyor…</p>';
    setTimeout(function () {
      var res = S.runTests();
      var gecen = res.filter(function (t) { return t.pass; }).length;
      sum.textContent = gecen + ' / ' + res.length + ' geçti';
      sum.className = 'pill ' + (gecen === res.length ? 'ok' : 'bad');
      el.innerHTML = res.map(function (t) {
        return '<div class="test ' + (t.pass ? 'pass' : 'fail') + '">' +
          '<div class="ic">' + (t.pass ? '✅' : '❌') + '</div>' +
          '<div><div class="nm">' + t.id + ' · ' + html(t.name) + '</div>' +
          '<div class="dt">' + html(t.detail) + '</div></div></div>';
      }).join('');
    }, 30);
  }

  /* ---------------- dışa aktarma ---------------- */
  function indir(adi, icerik, tip) {
    var b = new Blob([icerik], { type: tip || 'text/plain;charset=utf-8' });
    var u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = adi; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 200);
  }

  function svgAll() {
    var r = state.result, st = r.stock;
    if (!r.sheets.length) return null;
    var gap = Math.max(st.width, st.height) * 0.09;
    var lab = Math.max(st.width, st.height) * 0.055;
    var y = 0, parcalar = [];
    r.sheets.forEach(function (sh, i) {
      parcalar.push('<text x="0" y="' + (y + lab * 0.72) + '" font-size="' + (lab * 0.55) +
        '" fill="#0b131c" font-family="Segoe UI,Arial,sans-serif">Levha ' + (i + 1) + ' / ' + r.sheets.length +
        ' — ' + html(st.material) + ' ' + n0(st.width) + '×' + n0(st.height) + ' mm · doluluk %' + n2(sh.fillPct) + '</text>');
      var inner = S.renderSheetSVG(r, i, { showKerf: state.showKerf })
        .replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg x="0" y="' + (y + lab) + '" width="' + st.width + '" height="' + st.height + '"');
      parcalar.push(inner);
      y += st.height + lab + gap;
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + st.width + '" height="' + Math.round(y) +
      '" viewBox="0 0 ' + st.width + ' ' + y + '" style="background:#fff">' + parcalar.join('') + '</svg>';
  }

  function csvText() {
    var r = state.result, st = r.stock, L = [];
    L.push(['Levha', 'Parça', 'Genişlik_mm', 'Yükseklik_mm', 'X_mm', 'Y_mm', 'Döndürülmüş', 'Malzeme', 'Alan_mm2'].join(';'));
    r.sheets.forEach(function (sh) {
      sh.placements.forEach(function (p) {
        L.push([sh.index, p.name, p.w, p.h, p.x, p.y, p.rotated ? 'E' : 'H', p.material, p.w * p.h].join(';'));
      });
    });
    L.push('');
    L.push(['# Stok', st.material, st.width + 'x' + st.height, 'adet ' + st.qty, 'kerf ' + st.kerf, 'kenar ' + st.margin].join(';'));
    L.push(['# Kullanılan levha', r.stats.sheets, 'Fire %', n2(r.stats.wastePct), 'Maliyet', r.stats.cost].join(';'));
    L.push(['# Yerleşmeyen', r.stats.unplaced].join(';'));
    return '\ufeff' + L.join('\r\n');
  }

  function yazdir() {
    var r = state.result;
    var h = ['<h1>Numex Çizgi — Kesim Planı</h1>',
      '<p>' + html(r.stock.material) + ' · levha ' + n0(r.stock.width) + '×' + n0(r.stock.height) +
      ' mm · kerf ' + n0(r.stock.kerf) + ' mm · kenar boşluğu ' + n0(r.stock.margin) + ' mm</p>',
      '<p>Kullanılan levha: ' + r.stats.sheets + ' / ' + r.stats.totalSheets +
      ' · Fire: %' + n2(r.stats.wastePct) + ' · Maliyet: ' + tl(r.stats.cost) +
      ' · Yerleşen: ' + r.stats.placed + '/' + r.stats.total + '</p>'];
    r.sheets.forEach(function (sh, i) {
      h.push('<section class="print-sheet"><h2>Levha ' + (i + 1) + ' — doluluk %' + n2(sh.fillPct) + '</h2>' +
        S.renderSheetSVG(r, i, { showKerf: state.showKerf }) + '</section>');
    });
    if (r.unplaced.length) {
      h.push('<h2>Yerleşmeyen parçalar</h2><p>' + r.unplaced.map(function (u) {
        return html(u.name) + ' (' + n0(u.w) + '×' + n0(u.h) + ' — ' + (SEBEP[u.reason] || u.reason) + ')';
      }).join(' · ') + '</p>');
    }
    $('#print-area').innerHTML = h.join('');
    window.print();
  }

  /* ---------------- olaylar ---------------- */
  function wire() {
    ['#st-material', '#st-width', '#st-height', '#st-qty', '#st-cost', '#st-kerf', '#st-margin'].forEach(function (sel) {
      $(sel).addEventListener('input', function () { readStock(); schedule(); });
    });

    $('#parts-body').addEventListener('input', function (e) {
      var el = e.target, tr = el.closest('tr'), f = el.getAttribute('data-field');
      if (!tr || !f) return;
      var p = findPart(tr.getAttribute('data-id'));
      if (!p) return;
      if (f === 'rotatable') p.rotatable = el.checked;
      else if (f === 'w' || f === 'h' || f === 'qty') p[f] = Math.max(0, +el.value || 0);
      else p[f] = el.value;
      schedule();
    });

    $('#parts-body').addEventListener('click', function (e) {
      if (!e.target.getAttribute('data-del')) return;
      var tr = e.target.closest('tr'), id = tr.getAttribute('data-id');
      state.parts = state.parts.filter(function (p) { return p.id !== id; });
      renderParts(); optimize();
    });

    $('#btn-add-part').addEventListener('click', function () {
      addPart({ name: 'Parça ' + (state.parts.length + 1) });
      renderParts();
      var rows = $$('#parts-body tr');
      var son = rows[rows.length - 1];
      if (son) { var inp = son.querySelector('input[data-field="name"]'); if (inp) { inp.focus(); inp.select(); } }
      schedule();
    });

    $('#btn-bulk').addEventListener('click', function () {
      var lines = ($('#bulk-text').value || '').split(/\r?\n/), eklenen = 0;
      lines.forEach(function (ln) {
        ln = ln.trim();
        if (!ln) return;
        var p = ln.split(/[;\t]/).map(function (s) { return s.trim(); });
        var w = +p[1], h = +p[2], q = p[3] ? +p[3] : 1;
        if (!(w > 0) || !(h > 0)) return;
        addPart({ name: p[0] || ('Parça ' + (state.parts.length + 1)), w: w, h: h, qty: q > 0 ? q : 1, rotatable: p[4] !== '0' });
        eklenen++;
      });
      if (eklenen) { $('#bulk-text').value = ''; renderParts(); optimize(); }
    });

    $('#strategy').addEventListener('change', function () {
      state.strategy = this.value; optimize();
    });
    $('#btn-run').addEventListener('click', function () { readStock(); optimize(); });

    $$('.scn-btn').forEach(function (b) {
      b.addEventListener('click', function () { loadScenario(b.getAttribute('data-scn')); });
    });
    $('#btn-reset').addEventListener('click', function () {
      state.parts = [];
      state.stock = { material: 'MDF', width: 2440, height: 1220, qty: 4, cost: 850, kerf: 3, margin: 10 };
      state.nextId = 1;
      writeStock(); renderParts(); optimize();
    });

    $('#sheet-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sheet]');
      if (!b) return;
      state.sheet = +b.getAttribute('data-sheet');
      state.selected = null; renderDetail(null);
      renderSheetTabs(); renderPlan();
    });
    $('#btn-prev').addEventListener('click', function () { navSheet(-1); });
    $('#btn-next').addEventListener('click', function () { navSheet(1); });
    function navSheet(d) {
      var n = state.result.sheets.length; if (!n) return;
      state.sheet = (state.sheet + d + n) % n;
      state.selected = null; renderDetail(null);
      renderSheetTabs(); renderPlan();
    }

    $('#zoom').addEventListener('input', function () { state.zoom = +this.value; fitSvg(); });
    $('#chk-kerf').addEventListener('change', function () { state.showKerf = this.checked; renderPlan(); });

    $('#svg-holder').addEventListener('click', function (e) {
      var rc = e.target.closest ? e.target.closest('rect.part') : null;
      if (!rc) return;
      var iid = rc.getAttribute('data-iid');
      var p = null;
      state.result.sheets.forEach(function (sh) {
        sh.placements.forEach(function (q) { if (q.iid === iid) p = q; });
      });
      state.selected = iid;
      markSelected();
      renderDetail(p);
    });

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active'); });
        $$('.pane').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        $('#pane-' + t.getAttribute('data-tab')).classList.add('active');
        if (t.getAttribute('data-tab') === 'plan') fitSvg();
      });
    });

    $('#btn-tests').addEventListener('click', runTests);

    $('#x-svg').addEventListener('click', function () {
      var s = svgAll();
      if (s) indir('numex-cizgi-kesim-plani.svg', s, 'image/svg+xml;charset=utf-8');
      else alert('Önce bir yerleşim hesapla.');
    });
    $('#x-csv').addEventListener('click', function () {
      if (!state.result.sheets.length) return alert('Önce bir yerleşim hesapla.');
      indir('numex-cizgi-kesim-listesi.csv', csvText(), 'text/csv;charset=utf-8');
    });
    $('#x-json').addEventListener('click', function () {
      var veri = { format: 'numex-cizgi', version: S.version, savedAt: new Date().toISOString(), strategy: state.strategy, stock: state.stock, parts: state.parts };
      indir('numex-cizgi-proje.json', JSON.stringify(veri, null, 2), 'application/json;charset=utf-8');
    });
    $('#file-json').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var d = JSON.parse(rd.result);
          if (!d || !d.stock || !Array.isArray(d.parts)) throw new Error('Geçersiz dosya: stock/parts yok.');
          state.stock = S.normalizeStock(d.stock);
          state.parts = d.parts.map(function (p, i) { return S.normalizePart(p, i); });
          state.nextId = state.parts.length + 1;
          state.strategy = d.strategy || 'auto'; $('#strategy').value = state.strategy;
          writeStock(); renderParts(); optimize();
        } catch (err) { alert('JSON yüklenemedi: ' + err.message); }
        e.target.value = '';
      };
      rd.readAsText(f, 'utf-8');
    });
    $('#x-print').addEventListener('click', yazdir);

    var rz;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(fitSvg, 120); });
  }

  /* ---------------- senaryo / açılış ---------------- */
  function loadScenario(k) {
    var s = S.scenarios[k]();
    state.stock = S.normalizeStock(s.stock);
    state.parts = s.parts.map(function (p, i) { return S.normalizePart(p, i); });
    state.nextId = state.parts.length + 1;
    state.sheet = 0; state.selected = null;
    writeStock(); renderParts(); renderDetail(null); optimize();
  }

  function boot() {
    var yuklendi = false;
    try {
      var ham = localStorage.getItem(LS);
      if (ham) {
        var d = JSON.parse(ham);
        if (d && d.stock && Array.isArray(d.parts) && d.parts.length) {
          state.stock = S.normalizeStock(d.stock);
          state.parts = d.parts.map(function (p, i) { return S.normalizePart(p, i); });
          state.strategy = d.strategy || 'auto';
          state.nextId = state.parts.length + 1;
          yuklendi = true;
        }
      }
    } catch (e) { }
    if (!yuklendi) {
      var s = S.scenarios.A();
      state.stock = S.normalizeStock(s.stock);
      state.parts = s.parts.map(function (p, i) { return S.normalizePart(p, i); });
      state.nextId = state.parts.length + 1;
    }
    $('#strategy').value = state.strategy;
    writeStock(); renderParts(); wire(); optimize();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
