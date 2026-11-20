/* Numex Devre — arayüz katmanı. Hesaplama burada değil: devre-motoru.js */
(function () {
  'use strict';

  var M = window.NumexDevre;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var svg = document.getElementById('kanvas');
  var kabloKatmani = document.getElementById('kabloKatmani');
  var bilesenKatmani = document.getElementById('bilesenKatmani');
  var onizlemeKatmani = document.getElementById('onizlemeKatmani');
  var rozet = document.getElementById('rozet');
  var zoomYazi = document.getElementById('zoomYazi');

  var durum = {
    bilesenler: [],
    kablolar: [],
    secili: null,           // {tur:'bilesen'|'kablo', id}
    zoom: 1,
    panx: 0, pany: 0,
    telBaslangic: null,     // {bilesen, pin}
    sayac: { kaynak: 0, direnc: 0, led: 0, anahtar: 0, ampermetre: 0, voltmetre: 0, kablo: 0 },
    sonAnaliz: null
  };

  // ============================================================ yardımcılar
  function el(ad, nitelik) {
    var e = document.createElementNS(SVGNS, ad);
    if (nitelik) for (var k in nitelik) if (nitelik.hasOwnProperty(k)) e.setAttribute(k, nitelik[k]);
    return e;
  }
  function say(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bulBilesen(id) {
    for (var i = 0; i < durum.bilesenler.length; i++) if (durum.bilesenler[i].id === id) return durum.bilesenler[i];
    return null;
  }
  function kimlik(tip) {
    var t = M.TIPLER[tip];
    durum.sayac[tip] = (durum.sayac[tip] || 0) + 1;
    return { id: 'b' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 5)), ad: t.onek + durum.sayac[tip] };
  }

  // ============================================================ görünüm dönüşümü
  function dunyaNoktasi(ev) {
    var pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: (p.x - durum.panx) / durum.zoom, y: (p.y - durum.pany) / durum.zoom };
  }
  function ekranNoktasi(x, y) {
    return { x: x * durum.zoom + durum.panx, y: y * durum.zoom + durum.pany };
  }
  function uygulaDonusum() {
    var t = 'translate(' + durum.panx + ',' + durum.pany + ') scale(' + durum.zoom + ')';
    kabloKatmani.setAttribute('transform', t);
    bilesenKatmani.setAttribute('transform', t);
    onizlemeKatmani.setAttribute('transform', t);
    zoomYazi.textContent = Math.round(durum.zoom * 100) + '%';
  }

  // ============================================================ çizim
  function bilesenSVG(b) {
    var sec = durum.secili && durum.secili.tur === 'bilesen' && durum.secili.id === b.id;
    var g = el('g', {
      'class': 'bilesen' + (sec ? ' secili' : ''),
      'data-bilesen': b.id,
      transform: 'translate(' + b.x + ',' + b.y + ') rotate(' + (b.rot || 0) + ')'
    });
    var analizEl = null;
    if (durum.sonAnaliz) {
      for (var i = 0; i < durum.sonAnaliz.elemanlar.length; i++) {
        if (durum.sonAnaliz.elemanlar[i].id === b.id) { analizEl = durum.sonAnaliz.elemanlar[i]; break; }
      }
    }

    // LED ışıması en altta
    if (b.tip === 'led' && analizEl && analizEl.iletim) {
      var risk = Math.abs(analizEl.akim) > 0.025;
      g.appendChild(el('circle', { 'class': 'led-isik' + (risk ? ' risk' : ''), cx: 0, cy: 0, r: 20 }));
    }

    g.appendChild(el('rect', { 'class': 'govde-kutu', x: -24, y: -17, width: 48, height: 34, rx: 7 }));

    var P = b.params || {};
    var sym = el('g', { 'class': 'symbol' });

    if (b.tip === 'kaynak') {
      sym.appendChild(el('line', { x1: -30, y1: 0, x2: -8, y2: 0 }));
      sym.appendChild(el('line', { x1: 8, y1: 0, x2: 30, y2: 0 }));
      sym.appendChild(el('line', { x1: -8, y1: -15, x2: -8, y2: 15, 'stroke-width': 2.6 }));
      sym.appendChild(el('line', { x1: 8, y1: -8, x2: 8, y2: 8, 'stroke-width': 2.6 }));
      g.appendChild(sym);
      var pp = el('text', { 'class': 'etiket-ana', x: -14, y: -17 });
      pp.textContent = '+'; g.appendChild(pp);

    } else if (b.tip === 'direnc') {
      sym.appendChild(el('line', { x1: -30, y1: 0, x2: -17, y2: 0 }));
      sym.appendChild(el('line', { x1: 17, y1: 0, x2: 30, y2: 0 }));
      g.appendChild(sym);
      g.appendChild(el('rect', { x: -17, y: -7.5, width: 34, height: 15, rx: 2, fill: 'none', 'class': 'symbol' }));

    } else if (b.tip === 'led') {
      sym.appendChild(el('line', { x1: -30, y1: 0, x2: -9, y2: 0 }));
      sym.appendChild(el('line', { x1: 9, y1: 0, x2: 30, y2: 0 }));
      g.appendChild(sym);
      g.appendChild(el('polygon', { points: '-9,-9 -9,9 9,0', 'class': 'symbol-dolu' }));
      g.appendChild(el('line', { 'class': 'symbol', x1: 9, y1: -9, x2: 9, y2: 9 }));
      // ışık okları
      g.appendChild(el('line', { 'class': 'symbol', x1: 1, y1: -12, x2: 8, y2: -19, 'stroke-width': 1.4 }));
      g.appendChild(el('line', { 'class': 'symbol', x1: 8, y1: -13, x2: 12, y2: -18, 'stroke-width': 1.4 }));

    } else if (b.tip === 'anahtar') {
      var kapali = P.kapali !== false;
      sym.appendChild(el('line', { x1: -30, y1: 0, x2: -13, y2: 0 }));
      sym.appendChild(el('line', { x1: 13, y1: 0, x2: 30, y2: 0 }));
      g.appendChild(sym);
      g.appendChild(el('circle', { 'class': 'anahtar-nokta', cx: -13, cy: 0, r: 2.6 }));
      g.appendChild(el('circle', { 'class': 'anahtar-nokta', cx: 13, cy: 0, r: 2.6 }));
      g.appendChild(el('line', { 'class': 'anahtar-kol', x1: -13, y1: 0, x2: kapali ? 13 : 11, y2: kapali ? 0 : -14 }));

    } else if (b.tip === 'ampermetre' || b.tip === 'voltmetre') {
      sym.appendChild(el('line', { x1: -30, y1: 0, x2: -14, y2: 0 }));
      sym.appendChild(el('line', { x1: 14, y1: 0, x2: 30, y2: 0 }));
      g.appendChild(sym);
      g.appendChild(el('circle', { cx: 0, cy: 0, r: 13.5, 'class': 'symbol' }));
      var h = el('text', { 'class': 'etiket-ana', x: 0, y: 4.5 });
      h.textContent = b.tip === 'ampermetre' ? 'A' : 'V';
      g.appendChild(h);
    }

    // ad + değer
    var ad = el('text', { 'class': 'etiket', x: 0, y: -22 });
    ad.textContent = b.ad || b.id;
    g.appendChild(ad);

    var deger = '';
    if (b.tip === 'kaynak') deger = say(P.gerilim, 9) + ' V';
    else if (b.tip === 'direnc') deger = M.fmtDirenc(say(P.direnc, 330));
    else if (b.tip === 'led') deger = 'Vf=' + say(P.vf, 2) + ' V';
    else if (b.tip === 'anahtar') deger = (P.kapali !== false) ? 'kapalı' : 'açık';
    if (deger) {
      var dt = el('text', { 'class': 'etiket', x: 0, y: 30 });
      dt.textContent = deger;
      g.appendChild(dt);
    }

    // canlı ölçüm
    if (analizEl && durum.sonAnaliz) {
      var olc = '';
      if (b.tip === 'direnc' || b.tip === 'led' || b.tip === 'anahtar') olc = M.fmtAkim(analizEl.akim);
      else if (b.tip === 'ampermetre') olc = M.fmtAkim(analizEl.akim);
      else if (b.tip === 'voltmetre') olc = M.fmtGerilim(analizEl.gerilim);
      else if (b.tip === 'kaynak') olc = M.fmtAkim(analizEl.akim);
      if (olc) {
        var ot = el('text', { 'class': 'olcum', x: 0, y: b.tip === 'anahtar' ? 44 : 42 });
        ot.textContent = olc;
        g.appendChild(ot);
      }
    }

    // uç noktalar
    var pinler = M.TIPLER[b.tip].pinler;
    for (var p = 0; p < pinler.length; p++) {
      var aktif = durum.telBaslangic && durum.telBaslangic.bilesen === b.id && durum.telBaslangic.pin === pinler[p].ad;
      var c = el('circle', {
        'class': 'pin' + (aktif ? ' pin-aktif' : ''),
        cx: pinler[p].x, cy: pinler[p].y, r: 4.6,
        'data-bilesen': b.id, 'data-pin': pinler[p].ad
      });
      g.appendChild(c);
    }

    return g;
  }

  function ciz() {
    // analiz önce: ölçümler çizime girecek
    durum.sonAnaliz = M.analiz({ bilesenler: durum.bilesenler, kablolar: durum.kablolar });

    kabloKatmani.innerHTML = '';
    bilesenKatmani.innerHTML = '';
    onizlemeKatmani.innerHTML = '';

    // kablolar
    durum.kablolar.forEach(function (w) {
      var ba = bulBilesen(w.a.bilesen), bb = bulBilesen(w.b.bilesen);
      if (!ba || !bb) return;
      var p1 = M.pinKonum(ba, w.a.pin), p2 = M.pinKonum(bb, w.b.pin);
      var sec = durum.secili && durum.secili.tur === 'kablo' && durum.secili.id === w.id;
      kabloKatmani.appendChild(el('line', {
        'class': 'tel' + (sec ? ' tel-secili' : ''),
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y
      }));
      kabloKatmani.appendChild(el('line', {
        'class': 'tel-isabet', 'data-kablo': w.id,
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y
      }));
    });

    // bileşenler
    durum.bilesenler.forEach(function (b) {
      bilesenKatmani.appendChild(bilesenSVG(b));
    });

    uygulaDonusum();
    guncellePaneller();
  }

  // ============================================================ panel
  function guncellePaneller() {
    guncelleOzellik();
    guncelleAnaliz();
  }

  function guncelleOzellik() {
    var kart = document.getElementById('ozellikKarti');
    if (!durum.secili || durum.secili.tur !== 'bilesen') {
      kart.innerHTML = '<div class="bos">Bir bileşene dokun ve özelliklerini buradan değiştir.</div>';
      return;
    }
    var b = bulBilesen(durum.secili.id);
    if (!b) { kart.innerHTML = '<div class="bos">Seçim yok.</div>'; return; }
    var P = b.params || {};
    var h = '<div class="satir"><label><b>' + esc(b.ad) + '</b> · ' + esc(M.TIPLER[b.tip].ad) + '</label></div>';

    if (b.tip === 'kaynak') {
      h += '<div class="satir"><label>Gerilim (V)</label><input type="number" step="0.1" min="0" data-param="gerilim" value="' + say(P.gerilim, 9) + '"></div>';
    } else if (b.tip === 'direnc') {
      h += '<div class="satir"><label>Direnç (Ω)</label><input type="number" step="1" min="0.001" data-param="direnc" value="' + say(P.direnc, 330) + '"></div>' +
           '<div class="satir"><label>Hızlı seç</label><select class="btn" data-hizli-direnc>' +
           '<option value="">—</option><option value="100">100 Ω</option><option value="220">220 Ω</option>' +
           '<option value="330">330 Ω</option><option value="1000">1 kΩ</option><option value="10000">10 kΩ</option></select></div>';
    } else if (b.tip === 'led') {
      h += '<div class="satir"><label>İleri gerilim Vf (V)</label><input type="number" step="0.1" min="0.1" data-param="vf" value="' + say(P.vf, 2) + '"></div>' +
           '<div class="satir"><label>Seri direnç Rs (Ω)</label><input type="number" step="1" min="0.1" data-param="rs" value="' + say(P.rs, 15) + '"></div>' +
           '<p class="kucuk-not">Basitleştirilmiş model: Vf altında iletmez, üstünde (V−Vf)/Rs akım geçirir. Yaklaşıktır.</p>';
    } else if (b.tip === 'anahtar') {
      h += '<div class="satir"><label>Kapalı</label><input type="checkbox" data-param="kapali" ' + (P.kapali !== false ? 'checked' : '') + '></div>';
    }

    h += '<div class="satir" style="margin-top:8px">' +
         '<button class="btn" data-eylem="cevir">↻ Döndür</button>' +
         '<button class="btn tehlike" data-eylem="sil">🗑 Sil</button></div>';
    kart.innerHTML = h;
  }

  function guncelleAnaliz() {
    var a = durum.sonAnaliz;
    var kart = document.getElementById('analizKarti');
    var olcum = document.getElementById('olcumKarti');
    var dugum = document.getElementById('dugumKarti');

    if (!a || !durum.bilesenler.length) {
      kart.innerHTML = '<div class="bos">Devre kurulunca sonuçlar burada görünür.</div>';
      olcum.innerHTML = '<div class="bos">—</div>';
      dugum.innerHTML = '<div class="bos">—</div>';
      rozet.textContent = 'Tuval boş';
      return;
    }

    // --- özet metrikler
    var h = '';
    var kaynakG = a.kaynaklar.length ? a.kaynaklar[0].gerilim : 0;
    h += '<div class="metrik"><span class="k">Kaynak gerilimi</span><span class="v">' + M.fmtGerilim(kaynakG) + '</span></div>';
    h += '<div class="metrik"><span class="k">Toplam akım</span><span class="v">' + M.fmtAkim(a.toplamAkim) + '</span></div>';
    var ledVar = durum.bilesenler.some(function (b) { return b.tip === 'led'; });
    var rEs = M.fmtDirenc(a.esdegerDirenc);
    if (ledVar && a.esdegerDirenc !== null) rEs = '≈ ' + rEs;
    h += '<div class="metrik"><span class="k">Eşdeğer direnç' + (ledVar && a.esdegerDirenc !== null ? ' (V/I)' : '') + '</span><span class="v">' + rEs + '</span></div>';
    h += '<div class="metrik"><span class="k">Toplam güç</span><span class="v">' +
      M.fmtGuc(a.kaynaklar.reduce(function (t, k) { return t + Math.abs(k.guc); }, 0)) + '</span></div>';

    var uy = '';
    a.hatalar.forEach(function (m) { uy += '<li class="hata">' + esc(m) + '</li>'; });
    a.uyarilar.forEach(function (m) { uy += '<li>' + esc(m) + '</li>'; });
    if (!a.hatalar.length && !a.uyarilar.length) uy = '<li class="bilgi">Sorun yok — çözüm geçerli.</li>';
    h += '<ul class="uyari-liste" style="margin-top:8px">' + uy + '</ul>';
    if (a.not) h += '<p class="kucuk-not">' + esc(a.not) + '</p>';
    kart.innerHTML = h;

    // --- eleman tablosu
    var t = '<table class="olcum-tablo"><thead><tr><th>Eleman</th><th>Gerilim</th><th>Akım</th><th>Güç</th></tr></thead><tbody>';
    a.elemanlar.forEach(function (e) {
      var ek = e.not ? '<br><span style="font-size:10px;opacity:.7">' + esc(e.not) + '</span>' : '';
      t += '<tr><td class="ad">' + esc(e.ad) + ek + '</td><td>' + M.fmtGerilim(e.gerilim) + '</td><td>' + M.fmtAkim(e.akim) + '</td><td>' + M.fmtGuc(e.guc) + '</td></tr>';
    });
    t += '</tbody></table>';
    olcum.innerHTML = t;

    // --- düğümler
    var dg = '<table class="olcum-tablo"><thead><tr><th>Düğüm</th><th>Gerilim</th><th>Uçlar</th></tr></thead><tbody>';
    a.dugumler.forEach(function (d) {
      var pins = d.pinler.slice(0, 4).map(function (p) {
        var q = p.split('|'); var bb = bulBilesen(q[0]);
        return (bb ? bb.ad : q[0]) + '.' + q[1];
      }).join(', ');
      if (d.pinler.length > 4) pins += ' +' + (d.pinler.length - 4);
      dg += '<tr><td class="ad">' + esc(d.ad) + '</td><td>' + M.fmtGerilim(d.gerilim) + '</td><td style="font-size:10px;opacity:.8">' + esc(pins) + '</td></tr>';
    });
    dg += '</tbody></table>';
    dugum.innerHTML = dg;

    rozet.textContent = a.hatalar.length ? ('⛔ ' + a.hatalar.length + ' hata')
      : (a.uyarilar.length ? '⚠ ' + a.uyarilar.length + ' uyarı' : '✔ Çözüm geçerli');
  }

  // ============================================================ etkileşim
  var surukleme = null;

  svg.addEventListener('pointerdown', function (ev) {
    if (ev.button !== undefined && ev.button !== 0 && ev.pointerType === 'mouse') return;
    var pinEl = ev.target.closest ? ev.target.closest('[data-pin]') : null;
    var bEl = ev.target.closest ? ev.target.closest('[data-bilesen]') : null;
    var kEl = ev.target.closest ? ev.target.closest('[data-kablo]') : null;

    if (pinEl) {
      ev.preventDefault();
      var bid = pinEl.getAttribute('data-bilesen'), pid = pinEl.getAttribute('data-pin');
      if (durum.telBaslangic) {
        if (durum.telBaslangic.bilesen === bid && durum.telBaslangic.pin === pid) {
          durum.telBaslangic = null;
        } else {
          durum.sayac.kablo++;
          durum.kablolar.push({
            id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            a: { bilesen: durum.telBaslangic.bilesen, pin: durum.telBaslangic.pin },
            b: { bilesen: bid, pin: pid }
          });
          durum.telBaslangic = null;
        }
      } else {
        durum.telBaslangic = { bilesen: bid, pin: pid };
        durum.secili = { tur: 'bilesen', id: bid };
      }
      ciz();
      return;
    }

    if (bEl) {
      ev.preventDefault();
      var b = bulBilesen(bEl.getAttribute('data-bilesen'));
      if (!b) return;
      durum.secili = { tur: 'bilesen', id: b.id };
      durum.telBaslangic = null;
      var wp = dunyaNoktasi(ev);
      surukleme = { tip: 'bilesen', id: b.id, dx: b.x - wp.x, dy: b.y - wp.y, tasindi: false };
      svg.classList.add('surukle');
      try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
      ciz();
      return;
    }

    if (kEl) {
      ev.preventDefault();
      durum.secili = { tur: 'kablo', id: kEl.getAttribute('data-kablo') };
      durum.telBaslangic = null;
      ciz();
      return;
    }

    // boş alan → kaydırma
    durum.telBaslangic = null;
    durum.secili = null;
    var s = { x: ev.clientX, y: ev.clientY };
    surukleme = { tip: 'pan', sx: s.x, sy: s.y, px: durum.panx, py: durum.pany };
    svg.classList.add('surukle');
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    ciz();
  });

  svg.addEventListener('pointermove', function (ev) {
    if (durum.telBaslangic && !surukleme) {
      var b = bulBilesen(durum.telBaslangic.bilesen);
      if (b) {
        var p1 = M.pinKonum(b, durum.telBaslangic.pin);
        var wp = dunyaNoktasi(ev);
        onizlemeKatmani.innerHTML = '';
        onizlemeKatmani.appendChild(el('line', { 'class': 'onizleme', x1: p1.x, y1: p1.y, x2: wp.x, y2: wp.y }));
      }
      return;
    }
    if (!surukleme) return;
    if (surukleme.tip === 'bilesen') {
      var bb = bulBilesen(surukleme.id);
      if (!bb) return;
      var w = dunyaNoktasi(ev);
      bb.x = Math.round((w.x + surukleme.dx) / 10) * 10;
      bb.y = Math.round((w.y + surukleme.dy) / 10) * 10;
      surukleme.tasindi = true;
      ciz();
    } else if (surukleme.tip === 'pan') {
      durum.panx = surukleme.px + (ev.clientX - surukleme.sx);
      durum.pany = surukleme.py + (ev.clientY - surukleme.sy);
      uygulaDonusum();
    }
  });

  function suruklemeBitir() {
    surukleme = null;
    svg.classList.remove('surukle');
  }
  svg.addEventListener('pointerup', suruklemeBitir);
  svg.addEventListener('pointercancel', suruklemeBitir);

  // yakınlaştırma
  svg.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var olcek = Math.exp(-ev.deltaY * 0.0015);
    var yeni = Math.min(3, Math.max(0.3, durum.zoom * olcek));
    var pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    durum.panx = p.x - ((p.x - durum.panx) / durum.zoom) * yeni;
    durum.pany = p.y - ((p.y - durum.pany) / durum.zoom) * yeni;
    durum.zoom = yeni;
    uygulaDonusum();
  }, { passive: false });

  // klavye
  document.addEventListener('keydown', function (ev) {
    if (ev.target && /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      if (durum.secili) { ev.preventDefault(); secileniSil(); }
    } else if (ev.key === 'Escape') {
      durum.telBaslangic = null; durum.secili = null; ciz();
    } else if (ev.key === 'r' || ev.key === 'R') {
      cevir();
    }
  });

  // panel girdileri
  document.getElementById('ozellikKarti').addEventListener('input', function (ev) {
    var t = ev.target;
    var param = t.getAttribute && t.getAttribute('data-param');
    if (!param || !durum.secili) return;
    var b = bulBilesen(durum.secili.id);
    if (!b) return;
    if (t.type === 'checkbox') b.params[param] = t.checked;
    else {
      var v = Number(t.value);
      if (!isFinite(v)) return;
      b.params[param] = v;
    }
    ciz();
  });
  document.getElementById('ozellikKarti').addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.hasAttribute && t.hasAttribute('data-hizli-direnc') && t.value) {
      var b = bulBilesen(durum.secili.id);
      if (b) { b.params.direnc = Number(t.value); ciz(); guncelleOzellik(); }
    }
  });

  // ============================================================ eylemler
  function secileniSil() {
    if (!durum.secili) return;
    if (durum.secili.tur === 'bilesen') {
      var id = durum.secili.id;
      durum.bilesenler = durum.bilesenler.filter(function (b) { return b.id !== id; });
      durum.kablolar = durum.kablolar.filter(function (w) { return w.a.bilesen !== id && w.b.bilesen !== id; });
    } else {
      var kd = durum.secili.id;
      durum.kablolar = durum.kablolar.filter(function (w) { return w.id !== kd; });
    }
    durum.secili = null;
    ciz();
  }

  function cevir() {
    if (!durum.secili || durum.secili.tur !== 'bilesen') return;
    var b = bulBilesen(durum.secili.id);
    if (!b) return;
    b.rot = ((b.rot || 0) + 90) % 360;
    ciz();
  }

  function bilesenEkle(tip) {
    var orta = { x: (svg.clientWidth / 2 - durum.panx) / durum.zoom, y: (svg.clientHeight / 2 - durum.pany) / durum.zoom };
    var k = kimlik(tip);
    var b = {
      id: k.id, ad: k.ad, tip: tip,
      x: Math.round(orta.x / 10) * 10, y: Math.round(orta.y / 10) * 10,
      rot: 0, params: JSON.parse(JSON.stringify(M.TIPLER[tip].varsayilan))
    };
    durum.bilesenler.push(b);
    durum.secili = { tur: 'bilesen', id: b.id };
    ciz();
  }

  function temizle() {
    if (durum.bilesenler.length && !confirm('Tuvaldeki tüm bileşenler ve kablolar silinsin mi?')) return;
    durum.bilesenler = [];
    durum.kablolar = [];
    durum.secili = null;
    durum.telBaslangic = null;
    durum.sayac = { kaynak: 0, direnc: 0, led: 0, anahtar: 0, ampermetre: 0, voltmetre: 0, kablo: 0 };
    ciz();
  }

  function sigdir() {
    if (!durum.bilesenler.length) { durum.zoom = 1; durum.panx = 60; durum.pany = 60; uygulaDonusum(); return; }
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    durum.bilesenler.forEach(function (b) {
      minX = Math.min(minX, b.x - 45); maxX = Math.max(maxX, b.x + 45);
      minY = Math.min(minY, b.y - 45); maxY = Math.max(maxY, b.y + 45);
    });
    var w = svg.clientWidth, h = svg.clientHeight;
    var olcek = Math.min(w / Math.max(maxX - minX, 1), h / Math.max(maxY - minY, 1));
    durum.zoom = Math.min(2, Math.max(0.3, olcek * 0.85));
    durum.panx = w / 2 - ((minX + maxX) / 2) * durum.zoom;
    durum.pany = h / 2 - ((minY + maxY) / 2) * durum.zoom;
    uygulaDonusum();
  }

  function zoomUygula(kat) {
    var w = svg.clientWidth / 2, h = svg.clientHeight / 2;
    var yeni = Math.min(3, Math.max(0.3, durum.zoom * kat));
    durum.panx = w - ((w - durum.panx) / durum.zoom) * yeni;
    durum.pany = h - ((h - durum.pany) / durum.zoom) * yeni;
    durum.zoom = yeni;
    uygulaDonusum();
  }

  // ============================================================ hazır devreler
  function hazirDevre(no) {
    function B(id, tip, x, y, params) {
      durum.sayac[tip] = (durum.sayac[tip] || 0) + 1;
      return { id: id, ad: M.TIPLER[tip].onek + durum.sayac[tip], tip: tip, x: x, y: y, rot: 0, params: params };
    }
    function K(a, ap, b, bp) {
      return { id: 'w' + (++durum.sayac.kablo) + '_' + Math.random().toString(36).slice(2, 5), a: { bilesen: a, pin: ap }, b: { bilesen: b, pin: bp } };
    }
    var bl = [], kb = [];

    if (no === 1) {
      bl = [B('k1', 'kaynak', 400, 380, { gerilim: 9 }), B('r1', 'direnc', 280, 200, { direnc: 330 }), B('d1', 'led', 520, 200, { vf: 2, rs: 15 })];
      kb = [K('k1', 'art', 'r1', 'a'), K('r1', 'b', 'd1', 'anot'), K('d1', 'katot', 'k1', 'eksi')];
    } else if (no === 2) {
      bl = [B('k1', 'kaynak', 390, 380, { gerilim: 9 }), B('r1', 'direnc', 260, 210, { direnc: 100 }), B('r2', 'direnc', 520, 210, { direnc: 200 })];
      kb = [K('k1', 'art', 'r1', 'a'), K('r1', 'b', 'r2', 'a'), K('r2', 'b', 'k1', 'eksi')];
    } else if (no === 3) {
      bl = [B('k1', 'kaynak', 170, 270, { gerilim: 9 }), B('r1', 'direnc', 400, 190, { direnc: 100 }), B('r2', 'direnc', 400, 340, { direnc: 100 })];
      kb = [K('k1', 'art', 'r1', 'a'), K('k1', 'art', 'r2', 'a'), K('r1', 'b', 'r2', 'b'), K('r2', 'b', 'k1', 'eksi')];
    } else if (no === 4) {
      bl = [B('k1', 'kaynak', 400, 380, { gerilim: 9 }), B('r1', 'direnc', 250, 200, { direnc: 330 }),
            B('s1', 'anahtar', 430, 200, { kapali: false }), B('d1', 'led', 620, 200, { vf: 2, rs: 15 })];
      kb = [K('k1', 'art', 'r1', 'a'), K('r1', 'b', 's1', 'a'), K('s1', 'b', 'd1', 'anot'), K('d1', 'katot', 'k1', 'eksi')];
    } else if (no === 5) {
      bl = [B('k1', 'kaynak', 400, 280, { gerilim: 9 }), B('r1', 'direnc', 620, 280, { direnc: 100 })];
      kb = [K('k1', 'art', 'k1', 'eksi'), K('k1', 'art', 'r1', 'a'), K('r1', 'b', 'k1', 'eksi')];
    }

    durum.bilesenler = bl;
    durum.kablolar = kb;
    durum.secili = null;
    durum.telBaslangic = null;
    rozet.textContent = 'Hazır devre yüklendi';
    ciz();
    sigdir();
  }

  // ============================================================ dışa aktarma
  function indir(adi, icerik, mime) {
    var blob = new Blob([icerik], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = adi;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  }

  function svgIndir() {
    var kopya = svg.cloneNode(true);
    kopya.setAttribute('xmlns', SVGNS);
    if (!durum.bilesenler.length) {
      var mm = { x: 0, y: 0, w: 400, h: 300 };
    }
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    if (durum.bilesenler.length) {
      durum.bilesenler.forEach(function (b) {
        minX = Math.min(minX, b.x - 70); maxX = Math.max(maxX, b.x + 70);
        minY = Math.min(minY, b.y - 60); maxY = Math.max(maxY, b.y + 60);
      });
    } else { minX = 0; minY = 0; maxX = 400; maxY = 300; }
    var pad = 30;
    kopya.setAttribute('viewBox', (minX - pad) + ' ' + (minY - pad) + ' ' + (maxX - minX + pad * 2) + ' ' + (maxY - minY + pad * 2));
    kopya.setAttribute('width', Math.round(maxX - minX + pad * 2));
    kopya.setAttribute('height', Math.round(maxY - minY + pad * 2));

    var stil = document.createElementNS(SVGNS, 'style');
    stil.textContent = [
      '.tel{stroke:#1f6feb;stroke-width:2.5;stroke-linecap:round;fill:none}',
      '.tel-isabet{stroke:transparent;stroke-width:14;fill:none}',
      '.govde-kutu{fill:#ffffff;stroke:#c8d1db;stroke-width:1.2;rx:7}',
      '.symbol{stroke:#16202b;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.symbol-dolu{fill:#16202b}',
      '.etiket{fill:#5c6b7a;font-size:10.5px;text-anchor:middle;font-family:monospace}',
      '.etiket-ana{fill:#16202b;font-size:11px;font-weight:700;text-anchor:middle}',
      '.olcum{fill:#1a7f37;font-size:10px;text-anchor:middle;font-family:monospace}',
      '.pin{fill:#ffffff;stroke:#1f6feb;stroke-width:2}',
      '.anahtar-kol{stroke:#16202b;stroke-width:2.6;stroke-linecap:round}',
      '.anahtar-nokta{fill:#16202b}',
      '.led-isik{fill:#e3b341;opacity:.28}.led-isik.risk{fill:#cf222e;opacity:.32}',
      '.izgara-kucuk{stroke:#dde3ea;stroke-width:1;opacity:.5}.izgara-buyuk{stroke:#cfd7e0;stroke-width:1;opacity:.8}'
    ].join('\n');
    kopya.insertBefore(stil, kopya.firstChild);

    indir('numex-devre-semasi.svg', new XMLSerializer().serializeToString(kopya), 'image/svg+xml;charset=utf-8');
  }

  function csvIndir() {
    var a = durum.sonAnaliz;
    if (!a) { alert('Önce bir devre kur.'); return; }
    var satirlar = [['Eleman', 'Tip', 'Gerilim (V)', 'Akim (A)', 'Guc (W)', 'Not']];
    a.elemanlar.forEach(function (e) {
      satirlar.push([e.ad, e.tipAd, e.gerilim.toFixed(6), e.akim.toFixed(9), e.guc.toFixed(6), e.not || '']);
    });
    satirlar.push([]);
    satirlar.push(['Dugum', 'Gerilim (V)']);
    a.dugumler.forEach(function (d) { satirlar.push([d.ad, d.gerilim.toFixed(6)]); });
    satirlar.push([]);
    satirlar.push(['Toplam akim (A)', a.toplamAkim.toFixed(9)]);
    satirlar.push(['Esdeger direnc (ohm)', a.esdegerDirenc === null ? '' : a.esdegerDirenc.toFixed(6)]);
    var csv = satirlar.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    indir('numex-devre-olcum.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
  }

  function yazdir() {
    var a = durum.sonAnaliz;
    if (!a) { alert('Önce bir devre kur.'); return; }
    var h = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Numex Devre — Analiz Özeti</title>' +
      '<style>body{font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#16202b;padding:26px;max-width:820px;margin:auto}' +
      'h1{font-size:19px;margin:0 0 4px}h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #1a7f37;padding-bottom:4px}' +
      '.alt{color:#5c6b7a;font-size:11.5px;margin-bottom:16px}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th,td{border:1px solid #d3dae3;padding:5px 7px;text-align:left}th{background:#eef1f5}' +
      '.uy{background:#fff4e5;border-left:4px solid #db8b2a;padding:8px 10px;margin:6px 0;font-size:12px}' +
      '.ht{background:#ffe9e8;border-left-color:#f85149;color:#cf222e}' +
      '.ok{background:#e9f7ec;border-left-color:#1a7f37}' +
      'code{font-family:monospace}</style></head><body>';
    h += '<h1>Numex Devre — Analiz Özeti</h1>';
    h += '<div class="alt">' + new Date().toLocaleString('tr-TR') + ' · Yöntem: düğüm gerilimleri (MNA) + Kirchhoff yasaları</div>';
    h += '<h2>Özet</h2><table><tr><th>Kaynak gerilimi</th><td>' + M.fmtGerilim(a.kaynaklar.length ? a.kaynaklar[0].gerilim : 0) + '</td></tr>' +
      '<tr><th>Toplam akım</th><td>' + M.fmtAkim(a.toplamAkim) + '</td></tr>' +
      '<tr><th>Eşdeğer direnç</th><td>' + M.fmtDirenc(a.esdegerDirenc) + '</td></tr></table>';
    h += '<h2>Elemanlar</h2><table><tr><th>Eleman</th><th>Gerilim</th><th>Akım</th><th>Güç</th></tr>';
    a.elemanlar.forEach(function (e) {
      h += '<tr><td>' + esc(e.ad) + ' (' + esc(e.tipAd) + ')</td><td>' + M.fmtGerilim(e.gerilim) + '</td><td>' + M.fmtAkim(e.akim) + '</td><td>' + M.fmtGuc(e.guc) + '</td></tr>';
    });
    h += '</table>';
    h += '<h2>Düğüm Gerilimleri</h2><table><tr><th>Düğüm</th><th>Gerilim</th></tr>';
    a.dugumler.forEach(function (d) { h += '<tr><td>' + esc(d.ad) + '</td><td>' + M.fmtGerilim(d.gerilim) + '</td></tr>'; });
    h += '</table>';
    h += '<h2>Uyarılar</h2>';
    if (!a.hatalar.length && !a.uyarilar.length) h += '<div class="uy ok">Sorun yok.</div>';
    a.hatalar.forEach(function (m) { h += '<div class="uy ht">' + esc(m) + '</div>'; });
    a.uyarilar.forEach(function (m) { h += '<div class="uy">' + esc(m) + '</div>'; });
    h += '<p style="margin-top:20px;font-size:11px;color:#5c6b7a">LED modeli yaklaşıktır. Bu rapor gerçek donanım kontrolü yapmaz ve fiziksel devre için güvenlik garantisi vermez.</p>';
    h += '<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('Açılır pencere engellendi. Lütfen bu site için pop-up izni ver.'); return; }
    w.document.write(h);
    w.document.close();
  }

  // ============================================================ testler
  function testPenceresi() {
    var sonuc = M.testler();
    var gecen = sonuc.filter(function (t) { return t.gecti; }).length;
    var h = '<div class="ozet-kutu">' +
      '<div><b>' + sonuc.length + '</b>test</div>' +
      '<div style="color:var(--vurgu)"><b>' + gecen + '</b>geçti</div>' +
      '<div style="color:var(--kirmizi)"><b>' + (sonuc.length - gecen) + '</b>kaldı</div></div>';
    sonuc.forEach(function (t) {
      h += '<div class="test-satir"><span class="test-durum ' + (t.gecti ? 'gecti">✔' : 'kaldi">✖') + '</span>' +
        '<span>' + esc(t.ad) + '<br><span style="font-size:10.5px;color:var(--soluk)">beklenen: ' + esc(t.beklenen) + '</span></span>' +
        '<span class="test-olcum">ölçülen<br><b>' + esc(t.olculen) + '</b></span></div>';
    });
    document.getElementById('modalBaslik').textContent = 'Bağımsız Kabul Testleri';
    document.getElementById('modalIcerik').innerHTML = h;
    document.getElementById('modalArka').classList.add('acik');
  }

  // ============================================================ bağlama
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-eylem], [data-ekle]') : null;
    if (!t) return;
    var ekle = t.getAttribute('data-ekle');
    if (ekle) { bilesenEkle(ekle); return; }
    var e = t.getAttribute('data-eylem');
    switch (e) {
      case 'sil': secileniSil(); break;
      case 'cevir': cevir(); break;
      case 'temizle': temizle(); break;
      case 'sigdir': sigdir(); break;
      case 'zoomEkle': zoomUygula(1.25); break;
      case 'zoomCikar': zoomUygula(0.8); break;
      case 'kaydet':
        indir('numex-devre.json', M.disaAktar({ bilesenler: durum.bilesenler, kablolar: durum.kablolar }), 'application/json');
        break;
      case 'yukle': document.getElementById('dosyaGirdi').click(); break;
      case 'svg': svgIndir(); break;
      case 'csv': csvIndir(); break;
      case 'yazdir': yazdir(); break;
      case 'testler': testPenceresi(); break;
      case 'modalKapat': document.getElementById('modalArka').classList.remove('acik'); break;
      case 'tema':
        document.body.classList.toggle('acik');
        document.getElementById('temaBtn').textContent = document.body.classList.contains('acik') ? '☀️' : '🌙';
        break;
    }
  });

  document.getElementById('hazirSecim').addEventListener('change', function (ev) {
    var v = ev.target.value;
    ev.target.value = '';
    if (v) hazirDevre(Number(v));
  });

  document.getElementById('dosyaGirdi').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = M.iceAktar(String(rd.result));
        durum.bilesenler = d.bilesenler;
        durum.kablolar = d.kablolar;
        durum.secili = null;
        durum.telBaslangic = null;
        // sayaçları toparla
        d.bilesenler.forEach(function (b) {
          var n = parseInt(String(b.ad).replace(/\D/g, ''), 10);
          if (isFinite(n)) durum.sayac[b.tip] = Math.max(durum.sayac[b.tip] || 0, n);
        });
        ciz();
        sigdir();
        rozet.textContent = 'Proje yüklendi';
      } catch (err) {
        alert('Dosya okunamadı: ' + err.message);
      }
      ev.target.value = '';
    };
    rd.readAsText(f);
  });

  document.getElementById('modalArka').addEventListener('click', function (ev) {
    if (ev.target.id === 'modalArka') ev.target.classList.remove('acik');
  });

  // ============================================================ başlangıç
  durum.panx = 40; durum.pany = 30;
  hazirDevre(1);
  sigdir();

  window.NumexDevreUygulama = { durum: durum, ciz: ciz, hazirDevre: hazirDevre };
})();
