/* ============================================================================
   NUMEX CORE — SKY COMMAND · Arayüz katmanı
   Radar, listeler, telemetri ve operasyon panelleri AYNI durum motorundan
   (window.NUMEX) beslenir. Radar ve 3D konumları ayrı hesaplanmaz.
   ========================================================================== */
(function () {
  'use strict';
  const N = window.NUMEX;
  // NUMEX-DÜZELTME (2026-10-27): Kök neden: app.js başlangıçta NUMEX.flights referansını bir kez alıp sabitliyordu; reset/seedWorld diziyi yeniden atayınca arayüz boş/eski diziyi görüyordu. Getter üzerinden her erişimde güncel dizi okunur.
  const { STATE, AIRPORT, authority, weather, S } = N;
  // flights/alerts canlı getter'lardan okunur (reset sonrası bayat referans olmasın)
  const flights = () => N.flights;
  const alerts = () => N.alerts;

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const num = (v, d = 0) => Number(v).toFixed(d);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let selectedId = null;
  let followId = null;

  /* ---------------------------------------------------------------- toast */
  let toastT = null;
  function toast(msg, err) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'show' + (err ? ' err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.className = err ? 'err' : ''; }, 3200);
  }

  /* ---------------------------------------------------------------- sekmeler */
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      $('view-' + btn.dataset.tab).classList.add('active');
      // durum SIFIRLANMAZ — yalnız render
      if (btn.dataset.tab === 'airport' && window.SKY3D) window.SKY3D.resize();
      if (btn.dataset.tab === 'radar') resizeRadar();
      drawRadar();
    });
  });

  /* ================================================================ RADAR */
  const cv = $('radar');
  const ctx = cv.getContext('2d');
  let radarRange = 50; // km
  let R = { w: 0, h: 0, cx: 0, cy: 0, scale: 1 };
  // Park ızgarası sırası — KALICI (drawRadar içinde tanımlanırsa her karede sıfırlanır ve
  // tüm uçaklar idx=0 alıp tek noktaya çizilir)
  const yerIndex = {};
  let yerIdxCounter = 0;

  function resizeRadar() {
    const wrap = cv.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    cv.width = Math.max(10, Math.floor(w * dpr));
    cv.height = Math.max(10, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R.w = w; R.h = h;
    R.cx = w / 2; R.cy = h / 2;
    R.scale = Math.min(w, h) * 0.46 / radarRange; // px per km
  }
  window.addEventListener('resize', () => { resizeRadar(); if (window.SKY3D) window.SKY3D.resize(); });
  $('radarRange').addEventListener('change', (e) => { radarRange = +e.target.value; resizeRadar(); drawRadar(); });

  function worldToRadar(x, z) {
    return { px: R.cx + x * R.scale, py: R.cy + z * R.scale };
  }

  function drawRadar() {
    if (!R.w) resizeRadar();
    const t = performance.now() / 1000;
    // zemin
    ctx.clearRect(0, 0, R.w, R.h);
    const g = ctx.createRadialGradient(R.cx, R.cy, 8, R.cx, R.cy, Math.min(R.w, R.h) * 0.6);
    g.addColorStop(0, '#08161f');
    g.addColorStop(1, '#03080d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, R.w, R.h);

    // menzil halkaları
    ctx.strokeStyle = 'rgba(79,209,224,0.13)';
    ctx.lineWidth = 1;
    const rings = radarRange <= 15 ? [5, 10, 15] : radarRange <= 30 ? [10, 20, 30] : radarRange <= 50 ? [10, 25, 50] : [20, 40, 80];
    rings.forEach(km => {
      ctx.beginPath();
      ctx.arc(R.cx, R.cy, km * R.scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(109,131,153,.6)';
      ctx.font = '9px monospace';
      ctx.fillText(km + 'km', R.cx + km * R.scale - 26, R.cy - 3);
    });

    // kerteriz çizgileri
    ctx.strokeStyle = 'rgba(79,209,224,.08)';
    for (let a = 0; a < 360; a += 30) {
      const r = a * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(R.cx, R.cy);
      ctx.lineTo(R.cx + Math.sin(r) * radarRange * R.scale, R.cy - Math.cos(r) * radarRange * R.scale);
      ctx.stroke();
    }
    // kerteriz rakamları
    ctx.fillStyle = 'rgba(109,131,153,.65)';
    ctx.font = '10px monospace';
    ['N', 'E', 'S', 'W'].forEach((d, i) => {
      const a = i * 90 * Math.PI / 180;
      const rr = radarRange * R.scale + 12;
      ctx.fillText(d, R.cx + Math.sin(a) * rr - 3, R.cy - Math.cos(a) * rr + 4);
    });

    // sweep (tarama)
    const ang = (t * 1.1) % (Math.PI * 2);
    const grad = ctx.createLinearGradient(R.cx, R.cy, R.cx + Math.sin(ang) * 300, R.cy - Math.cos(ang) * 300);
    grad.addColorStop(0, 'rgba(79,209,224,0.28)');
    grad.addColorStop(1, 'rgba(79,209,224,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(R.cx, R.cy);
    ctx.lineTo(R.cx + Math.sin(ang) * radarRange * R.scale, R.cy - Math.cos(ang) * radarRange * R.scale);
    ctx.stroke();

    // pistler
    AIRPORT.runways.forEach(rw => {
      const p1 = worldToRadar(rw.x, rw.z0), p2 = worldToRadar(rw.x, rw.z1);
      ctx.strokeStyle = rw.closed ? 'rgba(255,77,94,.85)' : 'rgba(200,230,245,.55)';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
      ctx.strokeStyle = rw.closed ? 'rgba(255,77,94,.35)' : 'rgba(79,209,224,.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
      ctx.fillStyle = rw.closed ? '#ff4d5e' : '#9fd8e4';
      ctx.font = '9px monospace';
      ctx.fillText('RWY ' + rw.short, p1.px + 7, p1.py + 3);
      if (rw.closed) {
        ctx.fillStyle = 'rgba(255,77,94,.25)';
        ctx.fillRect(p1.px - 12, p1.py, 24, p2.py - p1.py);
      }
    });

    // NUMEX-DÜZELTME (2026-10-27): Terminal+apron dikdörtgeni park uçaklarının üstüne dolgu ile biniyor ve merkezi okunamaz beyaz bir leke hâline getiriyordu; yalnız ince kontur çizilir.
    // terminal + apron (yalnız ince kontur — uçak sembollerini örtmesin)
    const tc = worldToRadar(AIRPORT.terminal.x, AIRPORT.terminal.z);
    ctx.strokeStyle = 'rgba(79,209,224,.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tc.px - AIRPORT.terminal.w * R.scale / 2, tc.py - AIRPORT.terminal.d * R.scale / 2,
      AIRPORT.terminal.w * R.scale, AIRPORT.terminal.d * R.scale);

    // uçak izleri
    const showTrail = $('showTrail').checked;
    const showLabels = $('showLabels').checked;

    if (showTrail) {
          flights().forEach(f => {
      if (f.state === S.FINISHED) return;
      if (f.track.length < 2) return;
        ctx.beginPath();
        f.track.forEach((p, i) => {
          const q = worldToRadar(p.x, p.z);
          i === 0 ? ctx.moveTo(q.px, q.py) : ctx.lineTo(q.px, q.py);
        });
        ctx.strokeStyle = f.emergency ? 'rgba(255,77,94,.5)' : f.id === selectedId ? 'rgba(255,181,61,.55)' : 'rgba(79,209,224,.22)';
        ctx.lineWidth = f.id === selectedId ? 1.8 : 1;
        ctx.stroke();
      });
    }

    // uçak sembolleri
    // NUMEX-DÜZELTME (2026-10-27): Apronda duran uçaklar aynı noktada üst üste çizilip okunamaz bir yığın oluşturuyordu; radar ölçeğinde park pozisyonları birkaç piksele sığıyor. Yerdeki uçaklar için semboller ölçekle ayrıştırılır (görsel çakışma giderilir, konum hatası uçağın kendi değerinde kalır).
    flights().forEach(f => {
      if (f.state === S.FINISHED) return;
      // NUMEX-DÜZELTME (2026-10-27): Aprondaki uçaklar radar ölçeğinde 3 piksele sığıp tek leke oluyordu (26 uçak okunamıyordu). Yerdeki uçaklar için gösterim çarpanı uygulanır: konumları terminal bölgesinden okunur bir park bloğuna açılır; uçağın GERÇEK konumu telemetride korunur.
      // YERDEKİ uçaklar: apron ölçeği radar menzilinde birkaç piksel kalır → okunur park bloğuna açılır
      let px = f.x, pz = f.z;
      const yerde = f.altitude <= 60;
      if (yerde) {
        // NUMEX-DÜZELTME (2026-10-27): Park noktaları 0,28 km aralıkla duruyordu; 50 km menzilli radarda bu ~3 piksel eder ve 26 uçak tek leke oluyordu. Yerdeki uçaklar aprona okunur aralıkla (0,62 km) yayılır; uçağın gerçek konumu telemetride korunur.
        const idx = yerIndex[f.id] !== undefined ? yerIndex[f.id] : (yerIndex[f.id] = yerIdxCounter++);
        // NUMEX-DÜZELTME (2026-10-27): Park uçakları 50 km menzilde hâlâ tek leke oluyordu (0,62 km ≈ 9 piksel, sembol+etiket 60 piksel). Izgara doğrudan EKRAN pikseli cinsinden kurulur ve dünya→ekran dönüşümü atlanır; böylece 26 uçak da okunur aralıkta durur.
        const perRow = 5;
        // Apron merkezinin EKRAN konumu; ızgara piksel cinsinden (dönüşüm atlanır)
        const apC = worldToRadar(AIRPORT.apron.x, AIRPORT.apron.z);
        const sx = apC.px + ((idx % perRow) - 2) * 62;
        const sy = apC.py + (Math.floor(idx / perRow) - 1) * 46;
        drawSymbol(f, sx, sy, t, showLabels);
        return;
      }
      const p = worldToRadar(px, pz);
      if (p.px < -40 || p.px > R.w + 40 || p.py < -40 || p.py > R.h + 40) return;
      drawSymbol(f, p.px, p.py, t, showLabels);
    });
  }

  /** Uçak sembolünü EKRAN koordinatında çizer (havada/yerde aynı görsel dil). */
  function drawSymbol(f, X, Y, t, showLabels) {
    const air = f.altitude > 60;
    const col = f.emergency ? '#ff4d5e' : air ? '#4fd1e0' : '#8aa4b8';

    ctx.save();
    ctx.translate(X, Y);
    ctx.rotate(f.heading * Math.PI / 180);
    ctx.beginPath();
    if (air) {
      ctx.moveTo(0, -6.5); ctx.lineTo(4.4, 4.5); ctx.lineTo(0, 2.4); ctx.lineTo(-4.4, 4.5);
    } else {
      ctx.rect(-3, -3, 6, 6);
    }
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.restore();

    // yakıt halkası (kritik olanlar)
    if (f.fuel < 25) {
      ctx.beginPath();
      ctx.arc(X, Y, 9, -Math.PI / 2, -Math.PI / 2 + (f.fuel / 100) * Math.PI * 2);
      ctx.strokeStyle = f.fuel < 15 ? '#ff4d5e' : '#ffb53d';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    if (f.emergency) {
      const pr = 8 + (t * 12 % 14);
      ctx.beginPath();
      ctx.arc(X, Y, pr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,77,94,${Math.max(0, 1 - (pr - 8) / 14) * 0.8})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    if (f.id === selectedId) {
      ctx.beginPath();
      ctx.arc(X, Y, 13, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffb53d';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      // hız vektörü
      const vr = 14 + f.speed * 0.06;
      const hr = f.heading * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(X, Y);
      ctx.lineTo(X + Math.sin(hr) * vr, Y - Math.cos(hr) * vr);
      ctx.strokeStyle = 'rgba(255,181,61,.75)';
      ctx.stroke();
    }
    if (showLabels) {
      ctx.fillStyle = f.emergency ? '#ffd7db' : 'rgba(201,216,230,.92)';
      ctx.font = '9.5px monospace';
      ctx.fillText(f.callsign, X + 10, Y - 2);
      ctx.fillStyle = 'rgba(109,131,153,.9)';
      ctx.font = '8.5px monospace';
      ctx.fillText(air ? Math.round(f.altitude / 100) : 'GND', X + 10, Y + 8);
    }
  }

  // radar tıklama → seçim
  cv.addEventListener('click', (e) => {
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let best = null, bd = 1e9;
    flights().forEach(f => {
      if (f.state === S.FINISHED) return;
      const p = worldToRadar(f.x, f.z);
      const d = Math.hypot(p.px - mx, p.py - my);
      if (d < bd) { bd = d; best = f; }
    });
    if (best && bd < 18) selectFlight(best.id);
  });

  /* ================================================================ LİSTE */
  function renderFlightList() {
    const list = $('flightList');
    const q = $('searchFlight').value.trim().toUpperCase();
    const st = $('filterState').value;
    const onlyEmg = $('onlyEmergency').checked;
    const act = flights().filter(f => f.state !== S.FINISHED)
      .slice()
      .sort((a, b) => {
        const pa = a.emergency ? 0 : a.priority === 'HIGH' ? 1 : 2;
        const pb = b.emergency ? 0 : b.priority === 'HIGH' ? 1 : 2;
        return pa - pb || a.callsign.localeCompare(b.callsign);
      });
    $('flightCount').textContent = act.length;

    const rows = act.filter(f =>
      (!q || f.callsign.includes(q)) &&
      (st === 'all' || f.state === st) &&
      (!onlyEmg || f.emergency)
    );

    const frag = document.createDocumentFragment();
    rows.forEach(f => {
      const li = el('li', (f.id === selectedId ? 'sel ' : '') + (f.emergency ? 'emg' : ''));
      li.dataset.id = f.id;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', f.id === selectedId ? 'true' : 'false');
      const fc = f.fuel < 15 ? 'c' : f.fuel < 25 ? 'w' : '';
      li.innerHTML =
        `<span class="cs">${esc(f.callsign)}${f.priority === 'EMERGENCY' ? ' ⚠' : ''}</span>` +
        `<span class="tel">${f.altitude > 60 ? Math.round(f.altitude) + 'ft' : 'GND'} ${Math.round(f.speed)}kt</span>` +
        `<span class="st">${esc(f.state)} · ${esc(f.runway || '—')} · yakıt ${num(f.fuel)}%</span>` +
        `<span class="fuel"><i class="${fc}" style="width:${Math.max(2, f.fuel)}%"></i></span>`;
      li.addEventListener('click', () => selectFlight(f.id));
      frag.appendChild(li);
    });
    list.innerHTML = '';
    list.appendChild(frag);
    if (!rows.length) list.appendChild(el('li', 'empty', 'uçuş yok'));
  }

  function selectFlight(id) {
    selectedId = id;
    renderFlightList();
    renderDetail();
    if (window.SKY3D) window.SKY3D.highlight(id);
  }

  /* ================================================================ DETAY */
  function renderDetail() {
    const f = flights().find(x => x.id === selectedId);
    const box = $('detailBody');
    $('btnFollow').disabled = !f;
    if (!f) { box.innerHTML = '<p class="empty">Radar veya listeden bir uçak seç.</p>'; return; }
    const rw = f.runway ? AIRPORT.runways.find(r => r.short === f.runway) : null;
    const fc = f.fuel < 15 ? 'c' : f.fuel < 25 ? 'w' : '';
    const advisories = alerts().filter(a => a.flightIds && a.flightIds.includes(f.id));

    box.innerHTML = `
      <div class="plane-title">
        <b>${esc(f.callsign)}</b>
        <span>${esc(f.airline)} · ${esc(f.acType)}</span>
        ${f.emergency ? '<span class="pill emg">ACİL 7700</span>' : f.priority === 'HIGH' ? '<span class="pill hi">ÖNCELİKLİ</span>' : '<span class="pill">NORMAL</span>'}
      </div>
      <dl class="dl">
        <dt>DURUM</dt><dd class="em">${esc(f.state)}</dd>
        <dt>KONUM</dt><dd>${num(f.x, 2)} / ${num(f.z, 2)} km</dd>
        <dt>YÖN</dt><dd>${Math.round(f.heading)}° (${compass(f.heading)})</dd>
        <dt>İRTİFA</dt><dd>${Math.round(f.altitude)} ft</dd>
        <dt>HIZ</dt><dd>${Math.round(f.speed)} kt</dd>
        <dt>PİST</dt><dd>${esc(f.runway || '—')}${rw ? (rw.closed ? ' · <span style="color:#ff4d5e">KAPALI</span>' : ' · müsait') : ''}</dd>
        <dt>GÜZERGÂH</dt><dd>${esc(f.kind === 'arr' ? f.origin + ' → LTNX' : 'LTNX → ' + f.dest)}</dd>
        <dt>DURUM YAŞI</dt><dd>${Math.round(N.stateAge ? N.stateAge(f) : 0)} sn</dd>
      </dl>
      <div class="tiny dim">YAKIT ${num(f.fuel, 1)}%</div>
      <div class="bar"><i class="${fc}" style="width:${Math.max(1, f.fuel)}%"></i></div>

      <div class="sec">UÇUŞ PLANI</div>
      <div class="planbox">${esc((f.plan && f.plan.aktarma) || '—')}</div>

      <div class="sec">MÜDAHALE</div>
      <div class="actions">
        <button class="mini" data-act="priority" data-id="${f.id}">Öncelik Yükselt</button>
        <button class="mini" data-act="reroute" data-id="${f.id}">Alternatif Pist</button>
        <button class="mini" data-act="hold" data-id="${f.id}">Beklet</button>
        <button class="mini" data-act="climb" data-id="${f.id}">Tırman +1500</button>
        <button class="mini" data-act="descend" data-id="${f.id}">Alçal −1500</button>
        <button class="mini" data-act="emergency" data-id="${f.id}">Acil İlan Et</button>
      </div>

      <div class="sec">BU UÇAĞIN UYARILARI (${advisories.length})</div>
      ${advisories.length ? advisories.map(a =>
        `<div class="alert ${a.severity}" style="margin-bottom:5px">
           <div class="type">${esc(a.type)}</div>
           <div class="ah"><b>${esc(a.title)}</b><span class="sev">${a.severity}</span></div>
         </div>`).join('') : '<p class="tiny dim">Bu uçuşa ait aktif uyarı yok.</p>'}
    `;
    box.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', () => {
        const id = +b.dataset.id;
        const act = b.dataset.act;
        const r = N.doAction(flights().find(x => x.id === id), act, 'OPERATOR');
        toast(r.msg || r.why || 'işlem', !r.ok);
        renderAll();
      });
    });
  }

  function compass(h) {
    const d = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
    return d[Math.round(((h % 360) / 22.5)) % 16];
  }

  $('btnFollow').addEventListener('click', () => {
    if (!selectedId) return;
    followId = selectedId;
    const f = flights().find(x => x.id === selectedId);
    $('followName').textContent = f ? f.callsign : '—';
    document.querySelector('.tab[data-tab="airport"]').click();
    if (window.SKY3D) window.SKY3D.follow(followId);
    toast('3D kamerada takip: ' + (f ? f.callsign : '—'));
  });
  $('btnUnfollow').addEventListener('click', () => {
    followId = null;
    $('followName').textContent = '—';
    if (window.SKY3D) window.SKY3D.follow(null);
  });

  /* ================================================================ KPI */
  function renderKpis() {
    const k = N.kpis();
    const items = [
      { v: k.total, l: 'TOPLAM UÇUŞ', c: '' },
      { v: k.active, l: 'AKTİF', c: '' },
      { v: k.airborne, l: 'HAVADA', c: '' },
      { v: k.landed, l: 'TAMAMLANDI', c: 'k-ok' },
      { v: k.emergencies, l: 'ACİL DURUM', c: k.emergencies ? 'k-crit' : 'k-ok' },
      { v: k.alerts, l: 'AKTİF UYARI', c: k.alerts ? 'k-warn' : 'k-ok' },
      { v: k.critical, l: 'KRİTİK', c: k.critical ? 'k-crit' : 'k-ok' },
      { v: k.ops + '/' + AIRPORT.runways.length, l: 'AÇIK PİST', c: k.closedRunways ? 'k-crit' : 'k-ok' },
      { v: num(k.avgFuel) + '%', l: 'ORT. YAKIT', c: '' },
    ];
    $('kpis').innerHTML = items.map(i => `<div class="kpi ${i.c}"><div class="v">${i.v}</div><div class="l">${i.l}</div></div>`).join('');
  }

  /* ================================================================ UYARILAR */
  function renderAlerts() {
    const list = N.analyze();
    // canlı uyarı defterini güncelle (id atanmış örnekler)
    const al = alerts();
    al.length = 0; list.forEach(a => al.push(a));
    $('alertSummary').textContent = list.length;
    $('alertSummary').className = 'badge ' + (list.length ? 'warn' : '');

    const box = $('alertList');
    if (!list.length) {
      box.innerHTML = '<p class="noalert">✓ Aktif uyarı yok — operasyon normal.</p>';
      return;
    }
    box.innerHTML = list.map(a => {
      const fid = a.target;
      return `<div class="alert ${a.severity}" data-alert="${a.id}">
        <div class="type">${esc(a.type)}</div>
        <div class="ah"><b>${esc(a.title)}</b><span class="sev">${a.severity}</span></div>
        <ol>
          <li><b>Sorun:</b> ${esc(a.title)}</li>
          <li><b>Etkilenen:</b> ${esc((a.flights || []).join(', ') || '—')}</li>
          <li><b>Veri:</b> ${esc(a.data)}</li>
          <li><b>Öneri:</b> ${esc(a.action)}</li>
          <li><b>Beklenen sonuç:</b> ${esc(a.expected)}</li>
        </ol>
        <div class="dec">
          ${fid ? `<button class="mini" data-dec="${fid}" data-kind="${esc(a.kind)}">Öneriyi Uygula</button>
                   <button class="mini" data-goto="${fid}">Uçağa Git</button>` : ''}
        </div>
      </div>`;
    }).join('');

    box.querySelectorAll('[data-dec]').forEach(b => {
      b.addEventListener('click', () => {
        const fid = +b.dataset.dec;
        const kind = b.dataset.kind;
        const map = { separation: 'climb', fuel_crit: 'priority', fuel_warn: 'priority', bad_rwy: 'reroute', rwy_conflict: 'hold', emergency: 'emergency', wx_rwy: 'reroute', delay: 'hold' };
        const action = map[kind] || 'priority';
        const r = N.applyDecision({ flightId: fid, type: kind === 'bad_rwy' || kind === 'wx_rwy' ? 'runway' : kind === 'emergency' ? 'emergency' : kind === 'fuel_crit' || kind === 'fuel_warn' ? 'fuel' : 'other', action, reason: kind }, 'OPERATOR');
        toast(r.ok ? (r.msg || 'Karar uygulandı.') : (r.why || r.msg || 'Uygulanamadı'), !r.ok);
        renderAll();
      });
    });
    box.querySelectorAll('[data-goto]').forEach(b => {
      b.addEventListener('click', () => {
        selectFlight(+b.dataset.goto);
        document.querySelector('.tab[data-tab="radar"]').click();
      });
    });
  }

  /* ================================================================ OLAY KAYDI */
  function renderEvents() {
    const box = $('eventLog');
    const f = $('eventFilter').value;
    const evs = N.events.slice(0, 200).filter(e => f === 'all' || e.kind === f);
    box.innerHTML = evs.map(e =>
      `<div class="ev"><span class="t">${e.clock}</span><span class="k ${e.kind}">${e.kind}</span>
        <span class="f">${esc(e.flight)}</span>
        <span class="m">${esc(e.msg)}${e.reason ? ` <em>— ${esc(e.reason)}</em>` : ''}</span></div>`
    ).join('');
    if ($('autoScroll').checked) box.scrollTop = 0;
  }

  /* ================================================================ HAVA */
  function renderWeather() {
    const w = weather;
    $('wxPanel').innerHTML = `
      <div><span>GÖRÜŞ</span>${w.visKm} km</div>
      <div><span>RÜZGÂR</span>${String(w.windDir).padStart(3, '0')}° / ${w.windKt} kt</div>
      <div><span>TAVAN</span>${w.ceilingFt} ft</div>
      <div><span>DURUM</span><b style="color:${w.visKm < 3 ? '#ff4d5e' : '#43d17a'}">${w.condition}</b></div>
      ${AIRPORT.runways.map(r => `<div><span>PİST ${r.short}</span>${r.closed ? '<b style="color:#ff4d5e">KAPALI</b>' : (r.assigned || 'müsait')}</div>`).join('')}
    `;
    $('radarWx').textContent = `LTFM · ${w.condition} · ${w.visKm}km · ${w.windDir}°/${w.windKt}kt`;
    if (w.night) document.body.classList.add('night');
  }

  function renderStrip() {
    const k = N.kpis();
    $('radarStrip').innerHTML =
      `<span>AKTİF <b>${k.active}</b></span>` +
      `<span>HAVADA <b>${k.airborne}</b></span>` +
      `<span>ACİL <b>${k.emergencies}</b></span>` +
      `<span>KRİTİK UYARI <b>${k.critical}</b></span>` +
      `<span>AÇIK PİST <b>${k.ops}/${AIRPORT.runways.length}</b></span>` +
      `<span>MOD <b>${authority.mode}</b></span>` +
      `<span>REDDEDİLEN MÜDAHALE <b>${authority.denied}</b></span>`;
    $('denyCount').textContent = authority.denied;
  }

  /* ================================================================ KONTROLLER */
  $('btnPlay').addEventListener('click', () => {
    STATE.running = !STATE.running;
    $('btnPlay').textContent = STATE.running ? '❚❚ DURAKLAT' : '▶ DEVAM ET';
  });
  $('speed').addEventListener('change', e => { STATE.timeScale = +e.target.value; });
  $('btnReset').addEventListener('click', () => {
    N.reset();
    selectedId = null; followId = null;
    $('followName').textContent = '—';
    if (window.SKY3D) { window.SKY3D.follow(null); window.SKY3D.rebuild(); }
    toast('Simülasyon sıfırlandı — 25 kurgusal uçuş yeniden yüklendi.');
    renderAll();
  });
  $('btnAdvance').addEventListener('click', () => {
    for (let i = 0; i < 240; i++) N.tick(250); // 60 sn
    toast('Simülasyon 60 sn ilerletildi.');
    renderAll();
  });
  $('searchFlight').addEventListener('input', renderFlightList);
  $('filterState').addEventListener('change', renderFlightList);
  $('onlyEmergency').addEventListener('change', renderFlightList);
  $('eventFilter').addEventListener('change', renderEvents);
  $('showLabels').addEventListener('change', drawRadar);
  $('showTrail').addEventListener('change', drawRadar);

  document.querySelectorAll('.scn').forEach(b => {
    b.addEventListener('click', () => {
      const r = N.scenario(b.dataset.scn);
      toast(r.msg, !r.ok);
      renderAll();
    });
  });

  document.querySelectorAll('.mode').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.mode').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      authority.mode = b.dataset.mode;
      $('authDesc').textContent = authority.mode === 'ONERI'
        ? 'Motor yalnızca öneri sunar. Uçuş durumunu kullanıcı onayı olmadan değiştiremez.'
        : 'Motor, tanımlı sınırlar içinde kurgusal uçuş durumlarını kendisi değiştirebilir.';
      $('autoLimits').style.opacity = authority.mode === 'OTOMATIK' ? '1' : '.5';
      toast('Mod: ' + (authority.mode === 'ONERI' ? 'Öneri' : 'Otomatik simülasyon'));
      renderStrip();
    });
  });
  $('limFuel').addEventListener('input', e => {
    authority.limits.maxFuelForAuto = +e.target.value;
    $('limFuelVal').textContent = e.target.value + '%';
  });
  $('limRwy').addEventListener('change', e => { authority.limits.allowRunwayChange = e.target.checked; });
  $('limEmg').addEventListener('change', e => { authority.limits.allowEmergencyPriority = e.target.checked; });

  /* ================================================================ DÖNGÜ */
  const STEP = 1 / 10;        // sabit simülasyon adımı (saniye) — 10 Hz, gerçek zamanla 1:1
  let simAcc = 0;             // birikmiş simülasyon zamanı (saniye)
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(120, now - last);
    last = now;
          // Sabit adım (60 Hz) — kare hızından bağımsız, deterministik
      simAcc += (dt * STATE.timeScale) / 1000;
      while (simAcc >= STEP) {
        N.tick(STEP);
        simAcc -= STEP;
      }
    if (window.SKY3D) window.SKY3D.update();
    requestAnimationFrame(loop);
  }

  // arayüz render döngüsü (daha seyrek — 6 Hz)
  let uiAcc = 0, uiLast = performance.now();
  setInterval(() => {
    $('simClock').textContent = N.clockStr();
    if (selectedId) renderDetail();
  }, 250);

  function renderAll() {
    renderKpis();
    renderFlightList();
    renderDetail();
    renderAlerts();
    renderEvents();
    renderWeather();
    renderStrip();
  }

  // radar her karede çizilir (akıcı sweep)
  function radarLoop() {
    if ($('view-radar').classList.contains('active')) drawRadar();
    requestAnimationFrame(radarLoop);
  }

  window.addEventListener('load', () => {
    N.seedWorld();
    resizeRadar();
    renderAll();
    requestAnimationFrame(loop);
    requestAnimationFrame(radarLoop);
    // 6 Hz hafif yenileme
    setInterval(() => { renderFlightList(); renderKpis(); renderStrip(); }, 900);
    // uyarı motoru 1.5 sn'de bir
    setInterval(() => { renderAlerts(); }, 1500);
    setInterval(() => { renderEvents(); renderWeather(); }, 1200);
    // dışa aç (testler için)
    window.NUMEX_UI = { selectFlight, renderAll, get selectedId() { return selectedId; } };
    console.log('[SKY COMMAND] hazır — 25 kurgusal uçuş, ortak durum motoru aktif.');
  });
})();
