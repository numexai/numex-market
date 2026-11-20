/* ===================================================================
   NUMEX NÖBET — Arayüz katmanı
   =================================================================== */
(function () {
  'use strict';

  var P = window.NumexPlan, V = window.NumexValidator, SEN = window.NumexSenaryolar, TEST = window.NumexTestler;
  var DEPO = 'numex-nobet-v1';

  var S = {
    jobs: [], machines: [], algo: 'priority',
    result: null, onceki: null,
    scale: null, secili: null, hayalet: false, senaryo: 'A'
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var PALET = ['#4f8cff', '#35c2a8', '#f2b544', '#b07af7', '#ef7b45', '#59c1e8', '#8ec94f', '#e56ea8'];
  function turRengi(t) {
    var h = 0, s = String(t || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALET[h % PALET.length];
  }
  function isAdi(id) { var j = S.jobs.filter(function (x) { return x.id === id; })[0]; return j ? j.name : id; }
  function makineAdi(id) { var m = S.machines.filter(function (x) { return x.id === id; })[0]; return m ? m.name : id; }

  function tost(mesaj, tur) {
    var el = $('#tost');
    el.textContent = mesaj;
    el.className = 'tost ' + (tur || '');
    el.classList.add('gorunur');
    clearTimeout(tost._t);
    tost._t = setTimeout(function () { el.classList.remove('gorunur'); }, 3200);
  }

  /* ---------------- plan ---------------- */
  function planla(opt) {
    opt = opt || {};
    var eski = S.result;
    var eskiAdlar = {};
    S.machines.forEach(function (m) { eskiAdlar[m.id] = m.name; });

    var sonuc = P.planla(S.jobs, S.machines, { algo: S.algo, horizonDays: 3 });
    sonuc.dogrulama = V.dogrula(S.jobs, S.machines, sonuc);

    if (opt.karsilastir && eski) { S.onceki = eski; } else if (!opt.karsilastir) { S.onceki = null; }
    S.result = sonuc;

    // döngü uyarısı
    if (sonuc.cycles && sonuc.cycles.inCycle.length) {
      tost('Döngüsel bağımlılık: ' + (sonuc.cycles.path || sonuc.cycles.inCycle).join(' → '), 'hata');
    }
    kaydet();
    ciz();
  }

  function kaydet() {
    try {
      localStorage.setItem(DEPO, JSON.stringify({ jobs: S.jobs, machines: S.machines, algo: S.algo, senaryo: S.senaryo }));
    } catch (e) { /* yoksay */ }
  }

  function ciz() {
    renderIsler(); renderMakineler(); renderGantt(); renderSonuclar(); renderKarsilastirma(); renderYazdirma(); renderEtiket();
  }

  /* ---------------- iş listesi / form ---------------- */
  function renderIsler() {
    var turler = [];
    S.machines.forEach(function (m) { (m.types || []).forEach(function (t) { if (turler.indexOf(t) < 0) turler.push(t); }); });
    $('#turListesi').innerHTML = turler.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('');

    $('#isMakineSec').innerHTML = S.machines.map(function (m) {
      return '<label class="chip"><input type="checkbox" value="' + esc(m.id) + '"> ' + esc(m.name) + '</label>';
    }).join('');

    var secim = $('#isOnkosul');
    var mevcut = S.secili;
    secim.innerHTML = S.jobs.map(function (j) {
      return '<option value="' + esc(j.id) + '">' + esc(j.name) + '</option>';
    }).join('');

    var host = $('#isListesi');
    if (!S.jobs.length) host.innerHTML = '<div class="empty">Henüz iş yok. Yukarıdan ekle.</div>';
    else {
      host.innerHTML = S.jobs.map(function (j) {
        var mk = (j.machines && j.machines.length) ? j.machines.map(makineAdi).join(', ') : 'tüm uygun makineler';
        var dep = (j.deps || []).length ? j.deps.map(isAdi).join(', ') : '—';
        return '<div class="job-item ' + (S.secili === j.id ? 'secili' : '') + '" data-id="' + esc(j.id) + '">' +
          '<div class="ji-top"><strong>' + esc(j.name) + '</strong>' +
          '<span class="pill" style="--c:' + turRengi(j.type) + '">' + esc(j.type) + '</span></div>' +
          '<div class="ji-meta">' + j.duration + ' dk · öncelik ' + j.priority + ' · teslim ' + P.fmtClock(j.due) + '</div>' +
          '<div class="ji-meta">makine: ' + esc(mk) + ' · ön koşul: ' + esc(dep) + '</div>' +
          '<div class="ji-actions"><button class="mini" data-act="duzenle" data-id="' + esc(j.id) + '">Düzenle</button>' +
          '<button class="mini danger" data-act="sil" data-id="' + esc(j.id) + '">Sil</button></div>' +
          '</div>';
      }).join('');
    }
  }

  function formDoldur(j) {
    S.secili = j ? j.id : null;
    $('#isId').value = j ? j.id : '';
    $('#isAd').value = j ? j.name : '';
    $('#isTur').value = j ? j.type : '';
    $('#isSure').value = j ? j.duration : 30;
    $('#isOncelik').value = j ? (j.priority || 3) : 3;
    $('#isTeslim').value = j && j.due != null ? P.fmtClock(j.due) : '12:00';
    $$('#isMakineSec input').forEach(function (cb) {
      cb.checked = !!(j && j.machines && j.machines.indexOf(cb.value) >= 0);
    });
    $$('#isOnkosul option').forEach(function (o) {
      o.selected = !!(j && j.deps && j.deps.indexOf(o.value) >= 0);
    });
    renderIsler();
  }

  function isKaydet(e) {
    e.preventDefault();
    var ad = $('#isAd').value.trim();
    var tur = $('#isTur').value.trim();
    var sure = parseInt($('#isSure').value, 10);
    if (!ad) { tost('İş adı boş olamaz.', 'hata'); return; }
    if (!tur) { tost('İşlem türü yaz.', 'hata'); return; }
    if (!(sure > 0)) { tost('Süre pozitif bir sayı olmalı.', 'hata'); return; }

    var seciliMakineler = $$('#isMakineSec input:checked').map(function (c) { return c.value; });
    var seciliDeps = Array.prototype.slice.call($('#isOnkosul').selectedOptions).map(function (o) { return o.value; });
    var id = $('#isId').value;
    var due = P.parseHHMM($('#isTeslim').value);
    var kayit = {
      id: id || ('I' + Date.now().toString(36)),
      name: ad, type: tur, duration: sure,
      priority: parseInt($('#isOncelik').value, 10) || 3,
      due: due, machines: seciliMakineler, deps: seciliDeps
    };

    if (id) {
      var idx = S.jobs.findIndex(function (j) { return j.id === id; });
      if (idx >= 0) S.jobs[idx] = kayit;
    } else {
      S.jobs.push(kayit);
    }
    formDoldur(null);
    planla();
    tost('İş kaydedildi ve plan yenilendi.', 'iyi');
  }

  /* ---------------- makineler ---------------- */
  function renderMakineler() {
    var host = $('#makineListesi');
    host.innerHTML = S.machines.map(function (m) {
      var bakim = (m.maintenance || []).map(function (b, i) {
        return '<div class="bakim-satir"><span>' + P.fmtWhen(b.start) + ' – ' + P.fmtClock(b.end) + ' · ' + esc(b.reason || 'Bakım') + '</span>' +
          '<button class="mini danger" data-act="bakim-sil" data-m="' + esc(m.id) + '" data-i="' + i + '">×</button></div>';
      }).join('') || '<div class="muted small">Bakım/arıza kaydı yok</div>';

      return '<div class="machine-card">' +
        '<div class="mc-head"><input class="mc-name" data-m="' + esc(m.id) + '" value="' + esc(m.name) + '">' +
        '<label class="chk"><input type="checkbox" class="mc-avail" data-m="' + esc(m.id) + '" ' + (m.available === false ? '' : 'checked') + '> açık</label></div>' +
        '<label class="mc-line">Türler <input class="mc-types" data-m="' + esc(m.id) + '" value="' + esc((m.types || []).join(', ')) + '"></label>' +
        '<div class="mc-line">Vardiya <input type="time" class="mc-start" data-m="' + esc(m.id) + '" value="' + P.fmtClock(m.start) + '">' +
        '– <input type="time" class="mc-end" data-m="' + esc(m.id) + '" value="' + P.fmtClock(m.end) + '"></div>' +
        '<div class="mc-bakim">' + bakim + '</div>' +
        '<div class="mc-line"><input type="time" class="bakim-bas" data-m="' + esc(m.id) + '" value="10:00">' +
        '– <input type="time" class="bakim-bit" data-m="' + esc(m.id) + '" value="12:00">' +
        '<button class="mini" data-act="bakim-ekle" data-m="' + esc(m.id) + '">+ Bakım</button></div>' +
        '</div>';
    }).join('');
  }

  /* ---------------- Gantt ---------------- */
  function renderGantt() {
    var host = $('#gantt');
    var sonuc = S.result;
    if (!sonuc || !sonuc.blocks.length) {
      host.innerHTML = '<div class="empty">Planlanmış iş yok. Soldan iş ekleyip <b>Planla</b>’ya bas.</div>';
      return;
    }
    var LW = 158, ROW = 48;
    var probe = P.yerlesim(S.jobs, S.machines, sonuc, { scale: 1, labelWidth: LW, rowHeight: ROW });
    var genislik = Math.max(340, host.clientWidth - 8);
    var oto = Math.min(2.4, Math.max(0.08, (genislik - LW - 30) / probe.span));
    var scale = S.scale || oto;
    var L = P.yerlesim(S.jobs, S.machines, sonuc, { scale: scale, labelWidth: LW, rowHeight: ROW });
    $('#zoomRange').value = Math.round(scale * 100);

    var jm = new Map(S.jobs.map(function (j) { return [j.id, j]; }));
    var addimlar = [15, 30, 60, 120, 180, 240, 360, 720];
    var adim = 720;
    for (var a = 0; a < addimlar.length; a++) { if (addimlar[a] * scale >= 70) { adim = addimlar[a]; break; } }

    var ticks = '', cizgiler = '';
    for (var t = L.base; t <= L.end; t += adim) {
      // NUMEX-DÜZELTME (2026-11-19): Zaman ekseni çentikleri .g-ticks kutusunun içinde konumlanıyor; bu kutu etiket kolonundan (158px) sonra başlıyor. left değerine LW'yi tekrar ekleyince tüm eksen 158px sağa kayıyordu. Çentik left'i offset'e göre, ızgara çizgileri ise tam içerik koordinatına göre hesaplanmalı.
      // eksen etiketleri .g-ticks içinde akar (etiket kolonu zaten dışarıda),
      // şeritler ise tüm içerik koordinatında → LW eklenir
      // NUMEX-DÜZELTME (2026-11-19): Çentik kutuları 1 px genişliğinde olduğu için saat etiketi kapsayıcıdan ~29 px taşıyordu. Çentiğe bir sonraki çentiğe kadar gerçek genişlik verildi; sığmayan son çentikte etiket sağa yaslanıyor.
      var kalanPx = L.width - (LW + (t - L.base) * scale);
      var gen = Math.max(2, Math.min(adim * scale, kalanPx));
      ticks += '<div class="tick" style="left:' + ((t - L.base) * scale) + 'px;width:' + gen + 'px">' +
        // NUMEX-DÜZELTME (2026-11-19): Son çentikte kalan genişlik etikete yetmiyor ve etiket kapsayıcıdan sola 5 px taşıyordu. Sığmayan çentikte etiket basılmayıp yalnız çizgi bırakıldı; saat bilgisi bir önceki çentikte zaten okunuyor.
        (gen < 40 ? '' : '<span>' + P.fmtClock(t) + '</span>') + '</div>';
      cizgiler += '<div class="g-line" style="left:' + (LW + (t - L.base) * scale) + 'px"></div>';
    }

    var rowsHtml = '';
    S.machines.forEach(function (m, i) {
      rowsHtml += '<div class="g-row" style="height:' + ROW + 'px">' +
        '<div class="g-label" style="width:' + LW + 'px"><span>' + esc(m.name) + '</span>' +
        '<small>' + P.fmtClock(m.start) + '–' + P.fmtClock(m.end) + (m.available === false ? ' · KAPALI' : '') + '</small></div>';
      (m.maintenance || []).forEach(function (b) {
        var left = LW + (b.start - L.base) * scale;
        var w = Math.max(2, (b.end - b.start) * scale);
        rowsHtml += '<div class="g-maint" style="left:' + left + 'px;width:' + w + 'px" title="' + esc(b.reason || 'Bakım') + '">' +
          (w > 60 ? '<span>bakım</span>' : '') + '</div>';
      });
      rowsHtml += '</div>';
    });

    var barsHtml = '', links = '';
    var barMap = new Map();
    L.bars.forEach(function (bar) {
      barMap.set(bar.jobId, bar);
      var j = jm.get(bar.jobId);
      if (!j) return;
      var gec = j.due != null && bar.end > j.due;
      barsHtml += '<div class="g-bar' + (gec ? ' late' : '') + '" data-job="' + esc(bar.jobId) + '" ' +
        'style="left:' + bar.left + 'px;top:' + bar.top + 'px;width:' + bar.width + 'px;height:' + bar.height + 'px;background:' + turRengi(j.type) + '" ' +
        'title="' + esc(j.name) + ' · ' + P.fmtClock(bar.start) + '–' + P.fmtClock(bar.end) + '">' +
        // NUMEX-DÜZELTME (2026-11-19): Blok 46-72 px aralığındayken etiket sığmıyor ve 50 px kadar kırpılıyordu (ölçüm: 'Sandalye — kesim' 55 px kırpık). Etiket yalnız sığdığında basılsın; dar bloklarda renk + ipucu (title) + tıklayınca açılan ayrıntı paneli yeterli.
        (bar.width > 72 ? '<span>' + esc(j.name.length > 18 ? j.name.slice(0, 17) + '…' : j.name) + '</span>' : '') +
        (gec ? '<b class="uyari">!</b>' : '') +
        '</div>';
    });
    L.bars.forEach(function (bar) {
      var j = jm.get(bar.jobId);
      if (!j) return;
      (j.deps || []).forEach(function (d) {
        var db = barMap.get(d);
        if (!db) return;
        var x1 = db.left + db.width, y1 = db.top + db.height / 2;
        var x2 = bar.left, y2 = bar.top + bar.height / 2;
        var mx = Math.max(18, (x2 - x1) / 2);
        links += '<path d="M' + x1 + ',' + y1 + ' C' + (x1 + mx) + ',' + y1 + ' ' + (x2 - mx) + ',' + y2 + ' ' + x2 + ',' + y2 + '" />';
      });
    });

    var hayalet = '';
    if (S.hayalet && S.onceki && S.onceki.blocks) {
      S.onceki.blocks.forEach(function (b) {
        var left = LW + (b.start - L.base) * scale;
        var w = Math.max(2, (b.end - b.start) * scale);
        var row = L.rows.filter(function (r) { return r.machineId === b.machineId; })[0];
        if (!row) return;
        hayalet += '<div class="g-ghost" style="left:' + left + 'px;top:' + (row.top + 10) + 'px;width:' + w + 'px;height:' + (ROW - 20) + 'px" title="önceki plan: ' + esc(isAdi(b.jobId)) + '"></div>';
      });
    }

    host.innerHTML = '<div class="g-inner" style="width:' + L.width + 'px">' +
      '<div class="g-axis" style="height:30px"><div class="g-axis-label" style="width:' + LW + 'px">Makine / Zaman</div>' +
      '<div class="g-ticks">' + ticks + '</div></div>' +
      '<div class="g-rows">' + rowsHtml + '</div>' +
      '<div class="g-layer" style="top:30px;height:' + L.height + 'px">' +
      cizgiler + hayalet + barsHtml +
      '<svg class="g-links" width="' + L.width + '" height="' + L.height + '">' + links + '</svg>' +
      '</div></div>';
  }

  /* ---------------- sonuç paneli ---------------- */
  function renderSonuclar() {
    var s = S.result;
    if (!s) return;
    var m = s.metrics;
    var dg = s.dogrulama || { gecti: true, hatalar: [] };
    var kartlar = [
      ['Toplam iş', S.jobs.length, ''],
      ['Planlanan', m.planlanan, 'iyi'],
      ['Planlanamayan', m.planlanamayan, m.planlanamayan ? 'kotu' : ''],
      ['Tamamlanma', P.fmtClock(m.makespan), ''],
      ['Geç kalan', m.gecikenSayisi, m.gecikenSayisi ? 'kotu' : 'iyi'],
      ['Ortalama gecikme', Math.round(m.ortalamaGecikme) + ' dk', m.ortalamaGecikme ? 'uyari' : '']
    ];
    var kartHtml = kartlar.map(function (k) {
      return '<div class="kart ' + k[2] + '"><span>' + k[0] + '</span><strong>' + k[1] + '</strong></div>';
    }).join('');

    var kul = m.kullanim.map(function (k) {
      var yuzde = Math.round(k.oran * 100);
      return '<div class="kul-satir"><span>' + esc(k.ad) + '</span>' +
        '<div class="bar"><i style="width:' + Math.min(100, yuzde) + '%"></i></div>' +
        '<b>' + yuzde + '%</b><small>' + k.isSayisi + ' iş</small></div>';
    }).join('');

    var gecikenler = m.geciken.length
      ? '<ul class="liste">' + m.geciken.map(function (g) {
        return '<li><b>' + esc(isAdi(g.jobId)) + '</b> — ' + g.gecikme + ' dk gecikme</li>';
      }).join('') + '</ul>'
      : '<div class="muted small">Geciken iş yok. </div>';

    var planlanamayan = s.unscheduled.length
      ? '<ul class="liste hatali">' + s.unscheduled.map(function (u) {
        return '<li><b>' + esc(isAdi(u.jobId)) + '</b> — ' + esc(u.sebep) + '</li>';
      }).join('') + '</ul>'
      : '<div class="muted small">Tüm işler planlandı.</div>';

    var dogrulama = dg.gecti
      ? '<span class="rozet iyi">✔ Kısıt doğrulayıcı: GEÇTİ</span>'
      : '<span class="rozet kotu">✖ Doğrulayıcı: ' + dg.hatalar.length + ' hata</span>';

    $('#sonuclar').innerHTML =
      '<div class="kartlar">' + kartHtml + '</div>' +
      '<div class="iki-sutun">' +
      '<div class="blok"><h4>Makine kullanım oranları</h4>' + kul + '</div>' +
      '<div class="blok"><h4>Planlanamayan işler</h4>' + planlanamayan +
      '<h4 style="margin-top:14px">Geciken işler</h4>' + gecikenler + '</div>' +
      '</div>';

    $('#durumRozet').innerHTML = dogrulama + ' <span class="rozet">' + (s.algo === 'priority' ? 'Algoritma A · Öncelik' : 'Algoritma B · Erken Bitirme') + '</span>';

    if (!dg.gecti) {
      $('#durumRozet').innerHTML += ' <span class="rozet kotu" title="' + esc(dg.hatalar.slice(0, 5).map(function (h) { return h.mesaj; }).join(' | ')) + '">ilk hata: ' + esc(dg.hatalar[0].mesaj) + '</span>';
    }
  }

  /* ---------------- karşılaştırma ---------------- */
  function renderKarsilastirma() {
    var host = $('#karsIcerik');
    if (!S.onceki) {
      host.innerHTML = '<div class="empty">Henüz karşılaştırma yok.<br>Üstten <b>Makine Arızası</b> ya da <b>Acil İş</b> uygula; eski plan silinmeden önce/sonra farkı burada görünür.</div>';
      return;
    }
    var k = P.karsilastir(S.onceki, S.result);
    var mo = S.onceki.metrics, my = S.result.metrics;
    var artis = k.makespanFark > 0;
    var html = '<div class="kartlar">' +
      '<div class="kart"><span>Yer değiştiren iş</span><strong>' + k.yerDegistiren.length + '</strong></div>' +
      '<div class="kart ' + (artis ? 'kotu' : 'iyi') + '"><span>Bitiş farkı</span><strong>' + (artis ? '+' : '') + k.makespanFark + ' dk</strong></div>' +
      '<div class="kart ' + (k.gecikenFark > 0 ? 'kotu' : 'iyi') + '"><span>Geciken farkı</span><strong>' + (k.gecikenFark > 0 ? '+' : '') + k.gecikenFark + '</strong></div>' +
      '<div class="kart"><span>Makine değiştiren</span><strong>' + k.makineDegisen.length + '</strong></div>' +
      '</div>' +
      '<table class="tablo"><thead><tr><th>Ölçüt</th><th>Önceki plan</th><th>Yeni plan</th><th>Fark</th></tr></thead><tbody>' +
      satir('Toplam bitiş', P.fmtClock(mo.makespan), P.fmtClock(my.makespan), (my.makespan - mo.makespan) + ' dk') +
      satir('Planlanan iş', mo.planlanan, my.planlanan, my.planlanan - mo.planlanan) +
      satir('Planlanamayan', mo.planlanamayan, my.planlanamayan, my.planlanamayan - mo.planlanamayan) +
      satir('Geciken iş', mo.gecikenSayisi, my.gecikenSayisi, my.gecikenSayisi - mo.gecikenSayisi) +
      satir('Ortalama gecikme', Math.round(mo.ortalamaGecikme) + ' dk', Math.round(my.ortalamaGecikme) + ' dk', Math.round(my.ortalamaGecikme - mo.ortalamaGecikme) + ' dk') +
      '</tbody></table>';

    if (k.makineDegisen.length) {
      html += '<div class="blok"><h4>Başka makineye taşınan işler</h4><ul class="liste">' +
        k.makineDegisen.map(function (x) {
          return '<li><b>' + esc(isAdi(x.jobId)) + '</b>: ' + esc(makineAdi(x.eski)) + ' → ' + esc(makineAdi(x.yeni)) + '</li>';
        }).join('') + '</ul></div>';
    }
    if (k.dusenler.length) {
      html += '<div class="blok"><h4>Yeni planda yer bulamayan işler</h4><ul class="liste hatali">' +
        k.dusenler.map(function (id) { return '<li><b>' + esc(isAdi(id)) + '</b></li>'; }).join('') + '</ul></div>';
    }
    html += '<div class="not">Mevcut plan silinmedi — Gantt sekmesindeki <b>“Önceki planı hayalet göster”</b> ile eski blokları kesikli çerçeve olarak görebilirsin.</div>';
    host.innerHTML = html;

    function satir(ad, a, b, f) { return '<tr><td>' + ad + '</td><td>' + a + '</td><td>' + b + '</td><td>' + f + '</td></tr>'; }
  }

  /* ---------------- yazdırma ---------------- */
  function renderYazdirma() {
    var s = S.result;
    if (!s) return;
    var rows = s.blocks.map(function (b) {
      var j = S.jobs.filter(function (x) { return x.id === b.jobId; })[0] || {};
      var gec = j.due != null && b.end > j.due;
      return '<tr><td>' + esc(makineAdi(b.machineId)) + '</td><td>' + esc(j.name) + '</td><td>' + esc(j.type) + '</td>' +
        '<td>' + P.fmtClock(b.start) + '</td><td>' + P.fmtClock(b.end) + '</td><td>' + esc(j.duration) + ' dk</td>' +
        '<td>' + (j.due != null ? P.fmtClock(j.due) : '—') + '</td><td>' + (gec ? 'GECİKTİ' : 'zamanında') + '</td></tr>';
    }).join('');
    $('#yazdirma').innerHTML = '<h2>NUMEX NÖBET — Üretim Planı</h2>' +
      '<p>Senaryo: ' + esc(S.senaryo) + ' · Algoritma: ' + (s.algo === 'priority' ? 'Öncelik tabanlı' : 'Erken bitirme odaklı') +
      ' · Toplam bitiş: ' + P.fmtClock(s.metrics.makespan) + ' · Tarih: ' + new Date().toLocaleString('tr-TR') + '</p>' +
      '<table class="tablo"><thead><tr><th>Makine</th><th>İş</th><th>Tür</th><th>Başlangıç</th><th>Bitiş</th><th>Süre</th><th>Teslim</th><th>Durum</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (s.unscheduled.length ? '<h3>Planlanamayan işler</h3><ul>' + s.unscheduled.map(function (u) { return '<li>' + esc(isAdi(u.jobId)) + ' — ' + esc(u.sebep) + '</li>'; }).join('') + '</ul>' : '');
  }

  function renderEtiket() {
    $('#planEtiket').textContent = 'Senaryo ' + S.senaryo + ' · ' + S.jobs.length + ' iş · ' + S.machines.length + ' makine';
  }

  /* ---------------- testler ---------------- */
  function testleriCiz() {
    var sonuc;
    try { sonuc = TEST.calistir(); }
    catch (e) { $('#testler').innerHTML = '<div class="empty">Testler çalıştırılamadı: ' + esc(e.message) + '</div>'; return; }
    var gecen = sonuc.filter(function (t) { return t.gecti; }).length;
    var html = '<div class="test-ozet ' + (gecen === sonuc.length ? 'iyi' : 'kotu') + '">' +
      gecen + ' / ' + sonuc.length + ' test geçti</div>';
    html += sonuc.map(function (t) {
      return '<div class="test-satir ' + (t.gecti ? 'gecti' : 'kaldi') + '">' +
        '<span class="no">' + t.no + '</span>' +
        '<span class="ad">' + esc(t.ad) + '</span>' +
        '<span class="isaret">' + (t.gecti ? '✔' : '✖') + '</span>' +
        '<div class="detay">' + esc(t.detay) + '</div></div>';
    }).join('');
    $('#testler').innerHTML = html;
  }

  /* ---------------- detay paneli ---------------- */
  function detayGoster(jobId) {
    var j = S.jobs.filter(function (x) { return x.id === jobId; })[0];
    if (!j) return;
    var b = (S.result.blocks || []).filter(function (x) { return x.jobId === jobId; })[0];
    var el = $('#detay');
    if (!b) {
      var u = (S.result.unscheduled || []).filter(function (x) { return x.jobId === jobId; })[0];
      el.innerHTML = '<button class="detay-kapat" data-act="detay-kapat">×</button><h3>' + esc(j.name) + '</h3>' +
        '<p class="kotu">Planlanamadı: ' + esc(u ? u.sebep : 'sebep yok') + '</p>';
    } else {
      var gec = j.due != null && b.end > j.due;
      el.innerHTML = '<button class="detay-kapat" data-act="detay-kapat">×</button>' +
        '<h3>' + esc(j.name) + '</h3>' +
        '<div class="detay-satir"><span>Tür</span><b>' + esc(j.type) + '</b></div>' +
        '<div class="detay-satir"><span>Makine</span><b>' + esc(makineAdi(b.machineId)) + '</b></div>' +
        '<div class="detay-satir"><span>Zaman</span><b>' + P.fmtWhen(b.start) + ' → ' + P.fmtClock(b.end) + '</b></div>' +
        '<div class="detay-satir"><span>Süre</span><b>' + j.duration + ' dk</b></div>' +
        '<div class="detay-satir"><span>Teslim</span><b>' + (j.due != null ? P.fmtClock(j.due) : '—') + '</b></div>' +
        '<div class="detay-satir"><span>Öncelik</span><b>' + j.priority + '</b></div>' +
        '<div class="detay-satir"><span>Ön koşul</span><b>' + ((j.deps || []).map(isAdi).join(', ') || '—') + '</b></div>' +
        '<div class="detay-satir"><span>Durum</span><b class="' + (gec ? 'kotu' : 'iyi') + '">' + (gec ? 'GECİKTİ (' + (b.end - j.due) + ' dk)' : 'zamanında') + '</b></div>';
    }
    el.classList.remove('gizli');
  }

  /* ---------------- veri işlemleri ---------------- */
  function indir(ad, icerik, tip) {
    var blob = new Blob([icerik], { type: tip || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ad;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  function jsonKaydet() {
    var veri = { jobs: S.jobs, machines: S.machines, algo: S.algo, senaryo: S.senaryo, olusturma: new Date().toISOString() };
    indir('numex-nobet-plan.json', JSON.stringify(veri, null, 2), 'application/json');
    tost('JSON indirildi.', 'iyi');
  }

  function jsonYukle(dosya) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        var jobs = d.jobs || d.isler, mak = d.machines || d.makineler;
        if (!Array.isArray(jobs) || !Array.isArray(mak)) throw new Error('Beklenen alanlar yok (jobs/machines)');
        S.jobs = jobs; S.machines = mak; S.algo = d.algo || 'priority';
        S.onceki = null; S.secili = null;
        planla();
        tost('JSON yüklendi: ' + jobs.length + ' iş.', 'iyi');
      } catch (e) { tost('JSON okunamadı: ' + e.message, 'hata'); }
    };
    fr.readAsText(dosya);
  }

  function csvIndir() {
    var basliklar = ['id', 'ad', 'islem_turu', 'sure_dk', 'oncelik', 'teslim', 'makineler', 'on_kosullar'];
    var satirlar = S.jobs.map(function (j) {
      return [j.id, j.name, j.type, j.duration, j.priority, P.fmtClock(j.due),
        (j.machines || []).join('|'), (j.deps || []).join('|')]
        .map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(';');
    });
    indir('numex-nobet-isler.csv', '\uFEFF' + basliklar.join(';') + '\n' + satirlar.join('\n'), 'text/csv;charset=utf-8');
    tost('CSV indirildi.', 'iyi');
  }

  function svgIndir() {
    if (!S.result || !S.result.blocks.length) { tost('Önce plan oluştur.', 'hata'); return; }
    var LW = 170, ROW = 46, scale = 0.7;
    var L = P.yerlesim(S.jobs, S.machines, S.result, { scale: scale, labelWidth: LW, rowHeight: ROW });
    var jm = new Map(S.jobs.map(function (j) { return [j.id, j]; }));
    var parca = '';
    parca += '<svg xmlns="http://www.w3.org/2000/svg" width="' + L.width + '" height="' + (L.height + 46) + '" font-family="Segoe UI,Arial">';
    parca += '<rect width="100%" height="100%" fill="#0d1524"/>';
    parca += '<text x="14" y="20" fill="#f2b544" font-size="14" font-weight="700">NUMEX NÖBET — Üretim Planı</text>';
    L.rows.forEach(function (r) {
      parca += '<rect x="0" y="' + (r.top + 34) + '" width="' + L.width + '" height="' + r.height + '" fill="' + (r.top % 96 === 0 ? '#121c2e' : '#0f1828') + '"/>';
      parca += '<text x="12" y="' + (r.top + 34 + r.height / 2 + 4) + '" fill="#cfe0f5" font-size="12">' + esc(r.ad) + '</text>';
    });
    L.bars.forEach(function (b) {
      var j = jm.get(b.jobId) || {};
      var gec = j.due != null && b.end > j.due;
      parca += '<rect x="' + b.left + '" y="' + (b.top + 34) + '" width="' + b.width + '" height="' + b.height + '" rx="4" fill="' + turRengi(j.type) + '" stroke="' + (gec ? '#ef5b64' : 'none') + '" stroke-width="2"/>';
      if (b.width > 50) parca += '<text x="' + (b.left + 5) + '" y="' + (b.top + 34 + b.height / 2 + 4) + '" fill="#08111f" font-size="10">' + esc(String(j.name || '').slice(0, 16)) + '</text>';
    });
    parca += '</svg>';
    indir('numex-nobet-gantt.svg', parca, 'image/svg+xml');
    tost('SVG Gantt indirildi.', 'iyi');
  }

  /* ---------------- senaryo / arıza ---------------- */
  function senaryoYukle(id, sessiz) {
    var d = SEN[id]();
    S.senaryo = id;
    S.jobs = JSON.parse(JSON.stringify(d.jobs));
    S.machines = JSON.parse(JSON.stringify(d.machines));
    S.onceki = null; S.secili = null;
    $('#senaryoSec').value = id;
    if (!sessiz) tost('Senaryo yüklendi: ' + d.ad, 'iyi');
    planla();
  }

  function arizaUygula() {
    var mid = $('#arizaMakine').value;
    var gun = parseInt($('#arizaGun').value, 10) || 1;
    var bas = P.parseHHMM($('#arizaBas').value);
    var bit = P.parseHHMM($('#arizaBit').value);
    var sebep = $('#arizaSebep').value.trim() || 'Arıza';
    if (bas == null || bit == null || bit <= bas) { tost('Saat aralığı geçersiz.', 'hata'); return; }
    var m = S.machines.filter(function (x) { return x.id === mid; })[0];
    if (!m) { tost('Makine seç.', 'hata'); return; }
    m.maintenance = m.maintenance || [];
    m.maintenance.push({ start: (gun - 1) * P.DAY + bas, end: (gun - 1) * P.DAY + bit, reason: sebep });
    $('#modal').classList.add('gizli');
    planla({ karsilastir: true });
    gosterTab('kars');
    tost('Makine arızası işlendi ve plan yeniden hesaplandı.', 'uyari');
  }

  function acilIs() {
    var turler = [];
    S.machines.forEach(function (m) { (m.types || []).forEach(function (t) { if (turler.indexOf(t) < 0) turler.push(t); }); });
    var n = S.jobs.filter(function (j) { return /^ACİL/.test(j.name); }).length + 1;
    var tur = turler[0] || 'Genel';
    S.jobs.push({
      id: 'ACIL' + n, name: 'ACİL #' + n + ' — ' + tur, type: tur, duration: 45,
      priority: 5, due: 600 + n * 45, machines: [], deps: []
    });
    planla({ karsilastir: true });
    gosterTab('kars');
    tost('Acil iş eklendi, plan yenilendi.', 'uyari');
  }

  function gosterTab(ad) {
    $$('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === ad); });
    $$('.tab-pane').forEach(function (p) { p.classList.toggle('gizli', p.id !== 'pane-' + ad); });
    if (ad === 'gantt') renderGantt();
  }

  /* ---------------- olaylar ---------------- */
  function bagla() {
    $('#isForm').addEventListener('submit', isKaydet);
    $('#isTemizle').addEventListener('click', function () { formDoldur(null); });

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.dataset.act;

      if (act === 'duzenle') {
        var j = S.jobs.filter(function (x) { return x.id === t.dataset.id; })[0];
        if (j) formDoldur(JSON.parse(JSON.stringify(j)));
      }
      if (act === 'sil') {
        S.jobs = S.jobs.filter(function (x) { return x.id !== t.dataset.id; });
        // bağımlılıkları temizle
        S.jobs.forEach(function (j) { j.deps = (j.deps || []).filter(function (d) { return d !== t.dataset.id; }); });
        if (S.secili === t.dataset.id) formDoldur(null);
        planla();
        tost('İş silindi.', '');
      }
      if (act === 'bakim-ekle') {
        var mid = t.dataset.m;
        var kart = t.closest('.machine-card');
        var bas = P.parseHHMM(kart.querySelector('.bakim-bas').value);
        var bit = P.parseHHMM(kart.querySelector('.bakim-bit').value);
        if (bas == null || bit == null || bit <= bas) { tost('Bakım saat aralığı geçersiz.', 'hata'); return; }
        var m = S.machines.filter(function (x) { return x.id === mid; })[0];
        m.maintenance = m.maintenance || [];
        m.maintenance.push({ start: bas, end: bit, reason: 'Bakım' });
        planla({ karsilastir: true });
        tost('Bakım eklendi.', 'uyari');
      }
      if (act === 'bakim-sil') {
        var mm = S.machines.filter(function (x) { return x.id === t.dataset.m; })[0];
        if (mm) { mm.maintenance.splice(parseInt(t.dataset.i, 10), 1); planla({ karsilastir: true }); }
      }
      if (act === 'detay-kapat') $('#detay').classList.add('gizli');
    });

    $('#gantt').addEventListener('click', function (e) {
      var bar = e.target.closest('.g-bar');
      if (bar) detayGoster(bar.dataset.job);
    });

    document.addEventListener('change', function (e) {
      var el = e.target;
      var mid = el.dataset.m;
      if (!mid) return;
      var m = S.machines.filter(function (x) { return x.id === mid; })[0];
      if (!m) return;
      if (el.classList.contains('mc-name')) m.name = el.value.trim() || m.name;
      if (el.classList.contains('mc-types')) m.types = el.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (el.classList.contains('mc-avail')) m.available = el.checked;
      if (el.classList.contains('mc-start')) { var s = P.parseHHMM(el.value); if (s != null) m.start = s; }
      if (el.classList.contains('mc-end')) { var en = P.parseHHMM(el.value); if (en != null) m.end = en; }
      planla();
    });

    $$('.tab-btn').forEach(function (b) { b.addEventListener('click', function () { gosterTab(b.dataset.tab); }); });
    $$('.side-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.side-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        $('#sideIsler').classList.toggle('gizli', b.dataset.side !== 'isler');
        $('#sideMakine').classList.toggle('gizli', b.dataset.side !== 'makine');
      });
    });

    $('#btnPlanla').addEventListener('click', function () { planla(); tost('Plan yeniden hesaplandı.', 'iyi'); });
    $('#btnSenaryoYukle').addEventListener('click', function () { senaryoYukle($('#senaryoSec').value); });
    $('#btnAriza').addEventListener('click', function () {
      $('#arizaMakine').innerHTML = S.machines.map(function (m, i) {
        return '<option value="' + esc(m.id) + '"' + (i === 1 ? ' selected' : '') + '>' + esc(m.name) + '</option>';
      }).join('');
      $('#modal').classList.remove('gizli');
    });
    $('#arizaIptal').addEventListener('click', function () { $('#modal').classList.add('gizli'); });
    $('#arizaUygula').addEventListener('click', arizaUygula);
    $('#btnAcil').addEventListener('click', acilIs);

    $$('input[name="algo"]').forEach(function (r) {
      r.addEventListener('change', function () { S.algo = r.value; planla(); });
    });

    $('#zoomIn').addEventListener('click', function () { S.scale = Math.min(4, (S.scale || 0.6) * 1.35); renderGantt(); });
    $('#zoomOut').addEventListener('click', function () { S.scale = Math.max(0.05, (S.scale || 0.6) / 1.35); renderGantt(); });
    $('#zoomRange').addEventListener('input', function () { S.scale = Math.max(0.05, (+this.value) / 100); renderGantt(); });
    $('#hayaletChk').addEventListener('change', function () { S.hayalet = this.checked; renderGantt(); });

    $('#btnTest').addEventListener('click', testleriCiz);
    $('#btnJsonKaydet').addEventListener('click', jsonKaydet);
    $('#btnJsonYukle').addEventListener('click', function () { $('#dosyaGirdi').click(); });
    $('#dosyaGirdi').addEventListener('change', function (e) { if (e.target.files[0]) jsonYukle(e.target.files[0]); });
    $('#btnCsv').addEventListener('click', csvIndir);
    $('#btnSvg').addEventListener('click', svgIndir);
    $('#btnYazdir').addEventListener('click', function () { window.print(); });
    $('#btnSifirla').addEventListener('click', function () {
      localStorage.removeItem(DEPO);
      senaryoYukle(S.senaryo);
      tost('Yerel kayıt temizlendi, senaryo yeniden yüklendi.', '');
    });
    window.addEventListener('resize', function () { if (!$('#pane-gantt').classList.contains('gizli')) renderGantt(); });
  }

  /* ---------------- başlat ---------------- */
  function baslat() {
    var kayit = null;
    try { kayit = JSON.parse(localStorage.getItem(DEPO) || 'null'); } catch (e) { kayit = null; }
    if (kayit && Array.isArray(kayit.jobs) && kayit.jobs.length) {
      S.jobs = kayit.jobs; S.machines = kayit.machines; S.algo = kayit.algo || 'priority'; S.senaryo = kayit.senaryo || 'A';
      $('#senaryoSec').value = S.senaryo;
      $$('input[name="algo"]').forEach(function (r) { r.checked = (r.value === S.algo); });
      planla();
    } else {
      senaryoYukle('A', true);
    }
    bagla();
    if (!S.result) planla();
    testleriCiz();
  }

  document.addEventListener('DOMContentLoaded', baslat);
})();
