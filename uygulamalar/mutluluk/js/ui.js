/* ==========================================================================
   ui.js — atölye arayüzü, etkileşim, bölüm mantığı
   Fizik: NumexPhysics · Görsel: NumexRenderer · Veri: NumexLevels
   ========================================================================== */
(function (global) {
  'use strict';

  var P = global.NumexPhysics, R = global.NumexRenderer, L = global.NumexLevels;
  var M = P.M;

  var canvas, renderer, world;
  var state = {
    chapter: L.SANDBOX,       // aktif bölüm / örnek / serbest
    selectedId: null,
    running: false,
    slow: false,
    verdictShown: false,
    lastChapterKey: 'free'
  };
  var SAVE_KEY = 'numex.contraption.saves.v1';

  /* ---------------- kısayollar ---------------- */
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  /* ---------------- başlat ---------------- */
  function boot() {
    canvas = $('scene');
    renderer = new R(canvas);
    world = new P.Contraption();

    buildPalette();
    bindTop();
    bindControls();
    bindCanvas();
    bindKeys();
    bindHooks();

    loadChapter(L.LEVELS[0], 'level');

    window.addEventListener('resize', function () { renderer.resize(); });
    if (window.ResizeObserver) new ResizeObserver(function () { renderer.resize(); }).observe(canvas);

    requestAnimationFrame(loop);
  }

  /* ---------------- palet ---------------- */
  function buildPalette() {
    var list = $('paletteList');
    list.innerHTML = '';
    Object.keys(P.PART_DEFS).forEach(function (type) {
      var d = P.PART_DEFS[type];
      var btn = document.createElement('button');
      btn.className = 'part-btn';
      btn.dataset.type = type;
      btn.dataset.group = d.grup;
      btn.type = 'button';
      btn.innerHTML =
        '<span class="part-ico">' + d.ikon + '</span>' +
        '<span class="part-txt"><b>' + d.ad + '</b><span>' + d.ipucu + '</span></span>';
      bindPaletteDrag(btn, type);
      list.appendChild(btn);
    });
  }

  function bindPaletteDrag(btn, type) {
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var startX = e.clientX, startY = e.clientY, moved = false;
      var ghost = document.createElement('div');
      ghost.className = 'ghost';
      ghost.textContent = P.PART_DEFS[type].ikon;
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
      document.body.appendChild(ghost);
      document.body.classList.add('dragging');
      btn.classList.add('dragging');

      function onMove(ev) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
      }
      function onUp(ev) {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        ghost.remove();
        document.body.classList.remove('dragging');
        btn.classList.remove('dragging');

        if (state.running) { toast('Simülasyon çalışırken parça eklenmez — önce durdur.'); return; }
        var rect = canvas.getBoundingClientRect();
        var inside = ev.clientX >= rect.left && ev.clientX <= rect.right &&
                     ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        var pos;
        if (inside && moved) {
          pos = renderer.toWorld(ev.clientX - rect.left, ev.clientY - rect.top);
        } else if (!moved) {
          pos = { x: 800 + (Math.random() * 60 - 30), y: 420 };
        } else {
          return; // sahne dışına bırakıldı
        }
        spawnPart(type, pos.x, pos.y);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  }

  function spawnPart(type, x, y) {
    x = clamp(x, 40, P.WORLD_W - 40);
    y = clamp(y, 40, P.WORLD_H - 60);
    var part = world.addPart(type, x, y, defaultAngle(type), {});
    select(part.id);
    if (type === 'ball') part.bodies[0].restitution = 0.42;
    toast(PART_DEFS_NAME(type) + ' eklendi');
  }
  function PART_DEFS_NAME(t) { return P.PART_DEFS[t] ? P.PART_DEFS[t].ad : t; }
  function defaultAngle(type) { return type === 'ramp' ? 0.28 : 0; }

  /* ---------------- üst bar ---------------- */
  function bindTop() {
    $('btnLevels').onclick = showLevels;
    $('btnExamples').onclick = showExamples;
    $('btnSave').onclick = saveMachine;
    $('btnLoad').onclick = showSaves;
    $('btnExport').onclick = exportJson;
    $('btnImport').onclick = function () { $('fileImport').click(); };
    $('fileImport').onchange = importJson;
    $('modalX').onclick = closeModal;
    $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };
  }

  /* ---------------- kontroller ---------------- */
  function bindControls() {
    $('btnPlay').onclick = togglePlay;
    $('btnStop').onclick = function () { pauseSim(); toast('Durduruldu'); };
    $('btnReset').onclick = resetSim;
    $('btnSlow').onclick = toggleSlow;
    $('btnRotate').onclick = function () { rotateSelected(Math.PI / 12); };
    $('btnClone').onclick = cloneSelected;
    $('btnDelete').onclick = deleteSelected;
    $('selRotL').onclick = function () { rotateSelected(-Math.PI / 12); };
    $('selRotR').onclick = function () { rotateSelected(Math.PI / 12); };
    $('selClone').onclick = cloneSelected;
    $('selDelete').onclick = deleteSelected;
    $('verdictRetry').onclick = function () { hideVerdict(); resetSim(); };
    $('verdictNext').onclick = function () {
      hideVerdict();
      var i = L.LEVELS.indexOf(state.chapter);
      if (i >= 0 && i + 1 < L.LEVELS.length) loadChapter(L.LEVELS[i + 1], 'level');
      else { loadChapter(L.SANDBOX, 'free'); toast('Serbest atölye'); }
    };
  }

  function togglePlay() {
    if (state.running) { pauseSim(); return; }
    startSim();
  }

  function startSim() {
    if (state.running) return;
    state.running = true;
    state.verdictShown = false;
    hideVerdict();
    world.started = true;
    world.declared = false;
    world.stallTimer = 0;
    world.start();
    select(null);
    $('btnPlay').classList.add('playing');
    $('playIco').textContent = '❚❚';
    $('playTxt').textContent = 'Durdur';
    toast('Makine çalışıyor');
  }

  function pauseSim() {
    state.running = false;
    world.pause();
    $('btnPlay').classList.remove('playing');
    $('playIco').textContent = '▶';
    $('playTxt').textContent = 'Devam';
  }

  function resetSim() {
    state.running = false;
    world.pause();
    $('btnPlay').classList.remove('playing');
    $('playIco').textContent = '▶';
    $('playTxt').textContent = 'Başlat';
    state.verdictShown = false;
    hideVerdict();

    var data = { parts: [] };
    for (var i = 0; i < world.parts.length; i++) {
      var p = world.parts[i];
      if (p.locked) continue;
      data.parts.push({ type: p.type, x: p.x, y: p.y, a: p.angle, props: p.props });
    }
    world.load({ parts: data.parts }, true);
    select(null);
    refreshStats();
    toast('Sahne sıfırlandı');
  }

  function toggleSlow() {
    state.slow = !state.slow;
    world.setSlowMotion(state.slow);
    $('btnSlow').classList.toggle('on', state.slow);
    $('slowTxt').textContent = state.slow ? '0.32×' : '1×';
    toast(state.slow ? 'Yavaş çekim: 0.32×' : 'Normal hız');
  }

  /* ---------------- bölüm yükleme ---------------- */
  function loadChapter(chapter, kind) {
    state.chapter = chapter;
    state.chapterKind = kind || 'level';
    state.running = false;
    world.pause();
    world.clearParts(false);
    world.simTime = 0;
    world.stats = { hits: 0, dominoToppled: 0, bells: 0 };
    world.impacts.length = 0;
    world.started = false;
    world.declared = false;
    world.load({ parts: chapter.parts || [] }, false);
    // bölümün kendi parçaları kilitli (silinemez/taşınamaz)
    world.parts.forEach(function (p) { p.locked = true; });
    select(null);
    hideVerdict();
    $('btnPlay').classList.remove('playing');
    $('playIco').textContent = '▶';
    $('playTxt').textContent = 'Başlat';

    $('hudKicker').textContent = chapter.kicker || 'ATÖLYE';
    $('hudTitle').textContent = chapter.name;
    $('hudGoal').textContent = (chapter.goals && chapter.goals[0]) || '';
    $('missionName').textContent = chapter.name;
    $('missionDesc').textContent = chapter.desc || '';
    renderGoals(chapter, false);
    refreshStats();
    closeModal();
  }

  function renderGoals(chapter, ok) {
    var ul = $('missionGoals');
    ul.innerHTML = '';
    (chapter.goals || []).forEach(function (g, i) {
      var li = document.createElement('li');
      li.textContent = g;
      if (ok && i === 0) li.classList.add('ok');
      ul.appendChild(li);
    });
  }

  /* ---------------- sahne etkileşimi ---------------- */
  function bindCanvas() {
    var dragging = null, last = null;

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var rect = canvas.getBoundingClientRect();
      var p = renderer.toWorld(e.clientX - rect.left, e.clientY - rect.top);

      var bodies = [];
      for (var i = 0; i < world.parts.length; i++) {
        for (var j = 0; j < world.parts[i].bodies.length; j++) {
          var b = world.parts[i].bodies[j];
          if (b.label === 'rope') continue;
          bodies.push(b);
        }
      }
      var hits = M.Query.point(bodies, p);
      if (!hits.length) { select(null); return; }
      var part = world.getPartByBody(hits[0]);
      if (!part) { select(null); return; }
      select(part.id);
      if (part.locked) { toast('Bu parça bölümün sabit parçası'); return; }
      if (state.running) { toast('Çalışırken taşıma kapalı — durdur ya da sıfırla'); return; }

      dragging = { part: part, last: p };
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      var p = renderer.toWorld(e.clientX - rect.left, e.clientY - rect.top);
      var dx = p.x - dragging.last.x, dy = p.y - dragging.last.y;
      if (!dx && !dy) return;
      world.movePart(dragging.part, dx, dy);
      dragging.last = p;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = null;
      canvas.releasePointerCapture && e.pointerId != null &&
        canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId) &&
        canvas.releasePointerCapture(e.pointerId);
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function select(id) {
    state.selectedId = id;
    var box = $('selBox'), empty = $('selEmpty');
    if (!id) { box.hidden = true; empty.hidden = false; return; }
    var part = world.getPart(id);
    if (!part) { state.selectedId = null; box.hidden = true; empty.hidden = false; return; }
    box.hidden = false;
    empty.hidden = true;
    $('selName').textContent = part.def.ad + (part.locked ? ' (sabit)' : '');
  }

  function rotateSelected(delta) {
    var part = world.getPart(state.selectedId);
    if (!part) { toast('Önce bir parça seç'); return; }
    if (part.locked) { toast('Sabit parça döndürülemez'); return; }
    if (state.running) { toast('Çalışırken döndürme kapalı'); return; }
    var np = world.rebuildPart(part, { angle: part.angle + delta });
    select(np.id);
  }

  function cloneSelected() {
    var part = world.getPart(state.selectedId);
    if (!part) { toast('Önce bir parça seç'); return; }
    if (state.running) { toast('Çalışırken çoğaltma kapalı'); return; }
    var np = world.addPart(part.type, clamp(part.x + 42, 40, P.WORLD_W - 40),
                           clamp(part.y - 42, 40, P.WORLD_H - 60), part.angle, part.props);
    select(np.id);
    toast(part.def.ad + ' çoğaltıldı');
  }

  function deleteSelected() {
    var part = world.getPart(state.selectedId);
    if (!part) { toast('Önce bir parça seç'); return; }
    if (part.locked) { toast('Sabit parça silinemez'); return; }
    if (state.running) { toast('Çalışırken silme kapalı'); return; }
    var ad = part.def.ad;
    world.removePart(part);
    select(null);
    refreshStats();
    toast(ad + ' silindi');
  }

  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'r' || e.key === 'R') { rotateSelected(e.shiftKey ? -Math.PI / 12 : Math.PI / 12); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); cloneSelected(); }
      else if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------------- fizik olayları ---------------- */
  function bindHooks() {
    world.hooks.bell = function (ev) { onBell(ev); };
    world.hooks.stall = function () { onStall(); };
    world.hooks.collide = function () { /* görsel katman impacts dizisini kendi okur */ };
  }

  function onBell(ev) {
    if (state.verdictShown) return;
    var rules = state.chapter.rules || {};
    world.pause();
    state.running = false;
    $('btnPlay').classList.remove('playing');
    $('playIco').textContent = '▶';
    $('playTxt').textContent = 'Başlat';

    var userParts = world.userPartCount();
    var dominoes = world.stats.dominoToppled;

    if (rules.minDominoes && dominoes < rules.minDominoes) {
      showVerdict(false, 'Zil çaldı ama domino şartı eksik',
        'Devrilen domino: ' + dominoes + ' / ' + rules.minDominoes + '. Taşları sıklaştırıp tekrar dene.');
      return;
    }
    if (rules.minUserParts && userParts < rules.minUserParts) {
      showVerdict(false, 'Zil çaldı ama parça sayısı eksik',
        'Yerleştirdiğin parça: ' + userParts + ' / ' + rules.minUserParts + '. En az ' + rules.minUserParts + ' parçalık zincir kur.');
      return;
    }
    if (rules.bellByLabel && !rules.anyLabelAccepted && ev.bodyLabel !== rules.bellByLabel) {
      toast('Zili bu kez ' + (ev.bodyLabel || 'bir cisim') + ' çaldı — hedef ' + rules.bellByLabel);
      return;
    }

    renderGoals(state.chapter, true);
    var extra = ' · ' + userParts + ' parça · ' + dominoes + ' domino · ' + world.stats.hits + ' çarpışma';
    showVerdict(true, 'Bölüm tamamlandı!', 'Zil çaldı' + extra + '. Makine gerçekten çalıştı.');
  }

  function onStall() {
    if (state.verdictShown) return;
    var parts = world.userPartCount();
    world.pause();
    state.running = false;
    $('btnPlay').classList.remove('playing');
    $('playIco').textContent = '▶';
    $('playTxt').textContent = 'Başlat';
    showVerdict(false, 'Makine durdu — hedefe ulaşmadı',
      'Tüm parçalar hareketsiz kaldı, zil çalmadı. ' + (parts ? '' : 'Sahne boş görünüyor. ') +
      'Eğimi/konumu değiştirip yeniden dene.');
  }

  function showVerdict(ok, title, text) {
    state.verdictShown = true;
    var v = $('verdict');
    v.hidden = false;
    v.classList.toggle('fail', !ok);
    $('verdictIcon').textContent = ok ? '✓' : '!';
    $('verdictTitle').textContent = title;
    $('verdictText').textContent = text;
  }
  function hideVerdict() { $('verdict').hidden = true; state.verdictShown = false; }

  /* ---------------- ölçüm paneli ---------------- */
  function refreshStats() {
    $('stParts').textContent = world.userPartCount();
    $('stDomino').textContent = world.stats ? world.stats.dominoToppled : 0;
    $('stHits').textContent = world.stats ? world.stats.hits : 0;
    $('stTime').textContent = ((world.simTime || 0) / 1000).toFixed(1) + ' s';
  }

  /* ---------------- kaydet / yükle ---------------- */
  function readSaves() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeSaves(list) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); return true; }
    catch (e) { toast('Depolama dolu — JSON indirmeyi dene'); return false; }
  }

  function saveMachine() {
    openModal('Makineyi Kaydet',
      '<input class="modal-input" id="saveName" placeholder="Makine adı" value="' +
        (state.chapter.name || 'Makine') + ' ' + new Date().toLocaleDateString('tr-TR') + '">' +
      '<p class="modal-note">Kayıt tarayıcının yerel deposuna yazılır. JSON İndir ile dosya olarak da paylaşabilirsin.</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="saveCancel">Vazgeç</button>' +
      '<button class="btn btn-primary" id="saveOk">Kaydet</button></div>');
    $('saveCancel').onclick = closeModal;
    $('saveOk').onclick = function () {
      var name = ($('saveName').value || 'Makine').trim();
      var data = world.serialize();
      data.name = name;
      var list = readSaves();
      list.unshift({ name: name, data: data, at: new Date().toISOString() });
      if (list.length > 30) list.length = 30;
      if (writeSaves(list)) { toast('Kaydedildi: ' + name); closeModal(); }
    };
  }

  function showSaves() {
    var list = readSaves();
    if (!list.length) {
      openModal('Kayıtlı Makineler', '<p class="modal-note">Henüz kayıt yok. Sahneyi kurup “Kaydet”e bas.</p>');
      return;
    }
    var html = '';
    list.forEach(function (s, i) {
      html += '<button class="card-row" data-save="' + i + '">' +
        '<span class="card-num">' + (i + 1) + '</span>' +
        '<span class="card-txt"><b>' + escapeHtml(s.name) + '</b><span>' +
        (s.data.parts ? s.data.parts.length : 0) + ' parça · ' +
        new Date(s.at).toLocaleString('tr-TR') + '</span></span>' +
        '<span class="card-tag">Yükle</span></button>';
    });
    html += '<p class="modal-note">Yükleme, o anki bölümün sabit parçalarını korur ve üzerine senin parçalarını koyar.</p>';
    openModal('Kayıtlı Makineler', html);
    Array.prototype.forEach.call($('modalBody').querySelectorAll('[data-save]'), function (btn) {
      btn.onclick = function () {
        var s = list[+btn.dataset.save];
        try {
          world.clearParts(true);
          world.load(s.data, true);
          world.parts.forEach(function (p) { if (p.locked === undefined) p.locked = false; });
          // yalnızca bölümün sabitleri kilitli kalsın
          select(null);
          hideVerdict();
          state.running = false;
          world.pause();
          refreshStats();
          closeModal();
          toast('Yüklendi: ' + s.name);
        } catch (err) { toast('Yükleme hatası: ' + err.message); }
      };
    });
  }

  function exportJson() {
    var data = world.serialize();
    data.name = state.chapter.name || 'Makine';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'numex-makine-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('JSON indirildi (' + data.parts.length + ' parça)');
  }

  function importJson(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!data || !Array.isArray(data.parts)) throw new Error('parts dizisi yok');
        if (data.app && data.app !== 'numex-contraption-lab') throw new Error('farklı uygulama dosyası');
        world.clearParts(true);
        world.load(data, true);
        hideVerdict();
        state.running = false;
        world.pause();
        refreshStats();
        toast('Makine yüklendi: ' + (data.name || 'isimsiz') + ' · ' + data.parts.length + ' parça');
      } catch (err) {
        toast('Dosya okunamadı: ' + err.message);
      }
      $('fileImport').value = '';
    };
    reader.readAsText(f);
  }

  /* ---------------- bölüm / örnek listeleri ---------------- */
  function showLevels() {
    var html = '';
    L.LEVELS.forEach(function (lv, i) {
      html += '<button class="card-row" data-lv="' + i + '">' +
        '<span class="card-num">' + (i + 1) + '</span>' +
        '<span class="card-txt"><b>' + lv.name + '</b><span>' + lv.desc + '</span></span>' +
        '<span class="card-tag">Oyna</span></button>';
    });
    html += '<button class="card-row" data-lv="free">' +
      '<span class="card-num">∞</span>' +
      '<span class="card-txt"><b>Serbest Atölye</b><span>Kural yok, sadece fizik.</span></span>' +
      '<span class="card-tag">Aç</span></button>';
    openModal('Bölümler', html);
    Array.prototype.forEach.call($('modalBody').querySelectorAll('[data-lv]'), function (btn) {
      btn.onclick = function () {
        var v = btn.dataset.lv;
        if (v === 'free') loadChapter(L.SANDBOX, 'free');
        else loadChapter(L.LEVELS[+v], 'level');
      };
    });
  }

  function showExamples() {
    var html = '';
    L.EXAMPLES.forEach(function (ex, i) {
      html += '<button class="card-row" data-ex="' + i + '">' +
        '<span class="card-num">' + (i + 1) + '</span>' +
        '<span class="card-txt"><b>' + ex.name + '</b><span>' + ex.desc + '</span></span>' +
        '<span class="card-tag">Yükle</span></button>';
    });
    html += '<p class="modal-note">Hazır makineler yüklenince bütün parçalar düzenlenebilir; istediğin gibi değiştir.</p>';
    openModal('Hazır Makineler', html);
    Array.prototype.forEach.call($('modalBody').querySelectorAll('[data-ex]'), function (btn) {
      btn.onclick = function () {
        var ex = L.EXAMPLES[+btn.dataset.ex];
        loadChapter({
          id: ex.id, kicker: 'HAZIR MAKİNE', name: ex.name, desc: ex.desc,
          goals: ['Zili çaldır'], rules: ex.rules, parts: ex.parts
        }, 'example');
        // örneklerde parçalar düzenlenebilir
        world.parts.forEach(function (p) { p.locked = false; });
        closeModal();
        toast(ex.name + ' yüklendi — düzenleyebilirsin');
      };
    });
  }

  /* ---------------- modal ---------------- */
  function openModal(title, bodyHtml) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = bodyHtml;
    $('modal').hidden = false;
  }
  function closeModal() { $('modal').hidden = true; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ---------------- döngü ---------------- */
  var lastT = 0, fpsAcc = 0, fpsFrames = 0, statAcc = 0;

  function loop(t) {
    var dt = lastT ? t - lastT : 16.7;
    lastT = t;
    if (dt > 100) dt = 100;

    world.step(dt);
    renderer.render(world, { selectedId: state.selectedId });

    // istatistik
    statAcc += dt;
    if (statAcc > 120) {
      statAcc = 0;
      refreshStats();
    }
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc > 500) {
      $('fps').textContent = Math.round(fpsFrames / (fpsAcc / 1000)) + ' fps';
      fpsAcc = 0; fpsFrames = 0;
    }
    requestAnimationFrame(loop);
  }

  /* ---------------- açılış ---------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* test/otomasyon için küçük kapı */
  global.NumexLab = {
    getWorld: function () { return world; },
    getState: function () { return state; },
    start: startSim, pause: pauseSim, reset: resetSim,
    load: function (c) { loadChapter(c, 'level'); },
    spawn: function (t, x, y, a) { var p = world.addPart(t, x, y, a || 0, {}); return p; }
  };
})(window);
