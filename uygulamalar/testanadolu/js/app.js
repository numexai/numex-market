/* Anadolu Atölyesi — editör çekirdeği
   Belge modeli, vektör çizimi, simetri/karo düzeni, seçim, taşıma, geçmiş. */

(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const D = window.Desen;
  const ORNEKLER = window.Ornekler;
  const SVGNS = 'http://www.w3.org/2000/svg';

  let sayac = 0;
  const yeniId = () => 'k' + (++sayac);

  function bosBelge() {
    return {
      surum: 1,
      ad: 'Adsız kompozisyon',
      w: 1000, h: 1000,
      arka: '#f6f3ea',
      palet: 'iznik',
      simetri: { mod: 'radyal', n: 8, aci: 0 },
      karo: { kol: 3, sat: 3 },
      katmanlar: []
    };
  }

  function yeniKatman(tip, ek) {
    const m = D.MOTIFLER[tip];
    const palet = D.PALETLER[belge.palet].renkler;
    return Object.assign({
      id: yeniId(),
      tip: tip,
      ad: m.ad,
      x: belge.w / 2,
      y: belge.h / 2,
      r: m.varsayilanR,
      olcek: 1,
      aci: 0,
      cizgi: 3,
      bosluk: 8,
      dolgu: palet[1],
      cizgiRenk: palet[4],
      gorunur: true
    }, ek || {});
  }

  let belge = bosBelge();
  let seciliId = null;
  let zoom = 1;
  const gecmis = [];
  const gelecek = [];

  const els = {};
  function dom() {
    els.stage = $('#stage');
    els.artwork = $('#artwork');
    els.overlay = $('#overlay');
    els.bg = $('#bgRect');
    els.hint = $('#canvasHint');
    els.status = $('#status');
    els.zoomLabel = $('#zoomLabel');
    els.title = $('#docTitle');
    els.meta = $('#stageMeta');
    els.panelBody = $('#panelBody');
    els.holder = $('#canvasHolder');
    els.btnUndo = $('#btnUndo');
    els.btnRedo = $('#btnRedo');
  }

  const kopya = (o) => JSON.parse(JSON.stringify(o));

  function durum(mesaj, uyari) {
    if (!els.status) return;
    els.status.textContent = mesaj;
    els.status.classList.toggle('warn', !!uyari);
  }

  function guncelleButonlar() {
    els.btnUndo.disabled = gecmis.length === 0;
    els.btnRedo.disabled = gelecek.length === 0;
  }

  function itele() {
    gecmis.push(kopya(belge));
    if (gecmis.length > 80) gecmis.shift();
    gelecek.length = 0;
  }

  function geriAl() {
    if (!gecmis.length) return;
    gelecek.push(kopya(belge));
    belge = gecmis.pop();
    if (!belge.katmanlar.some((k) => k.id === seciliId)) seciliId = null;
    ciz(); panelCiz(); guncelleButonlar();
    durum('Geri alındı.');
  }

  function yinele() {
    if (!gelecek.length) return;
    gecmis.push(kopya(belge));
    belge = gelecek.pop();
    if (!belge.katmanlar.some((k) => k.id === seciliId)) seciliId = null;
    ciz(); panelCiz(); guncelleButonlar();
    durum('Yinelendi.');
  }

  function secili() {
    return belge.katmanlar.find((k) => k.id === seciliId) || null;
  }

  function govde(k) {
    const m = D.MOTIFLER[k.tip];
    if (!m) return '';
    return m.uret({ r: k.r, cizgi: k.cizgi, bosluk: k.bosluk, dolgu: k.dolgu, cizgiRenk: k.cizgiRenk });
  }

  function katmanGrubu(k) {
    return '<g class="layer" data-id="' + k.id + '" transform="translate(' + k.x + ' ' + k.y + ') rotate(' + k.aci + ') scale(' + k.olcek + ')">' + govde(k) + '</g>';
  }

  /* --- Sahne çizimi: radyal / karo / tek --- */
  function ciz() {
    const s = belge;
    els.stage.setAttribute('viewBox', viewBoxDegeri());
    els.bg.setAttribute('width', s.w);
    els.bg.setAttribute('height', s.h);
    els.bg.setAttribute('fill', s.arka);

    const ic = s.katmanlar.filter((k) => k.gorunur).map(katmanGrubu).join('');
    let cikti = '';

    if (s.simetri.mod === 'radyal') {
      const n = Math.max(1, s.simetri.n | 0), cx = s.w / 2, cy = s.h / 2;
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + (s.simetri.aci || 0);
        cikti += '<g class="sim" data-kopya="' + i + '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')">' + ic + '</g>';
      }
    } else if (s.simetri.mod === 'karo') {
      const kol = Math.max(1, s.karo.kol | 0), sat = Math.max(1, s.karo.sat | 0);
      const cw = s.w / kol, ch = s.h / sat;
      for (let i = 0; i < kol; i++) {
        for (let j = 0; j < sat; j++) {
          cikti += '<g class="tile" transform="translate(' + i * cw + ' ' + j * ch + ') scale(' + (1 / kol) + ' ' + (1 / sat) + ')">' + ic + '</g>';
        }
      }
    } else {
      cikti = ic;
    }

    els.artwork.innerHTML = cikti;
    cizSecim();
    if (els.hint) els.hint.hidden = s.katmanlar.length > 0;
  }

  /* --- Seçim çerçevesi: seçili katmanın gerçek sınırları --- */
  function cizSecim() {
    els.overlay.innerHTML = '';
    const k = secili();
    if (!k) return;
    const aday = els.artwork.querySelector('[data-id="' + k.id + '"]');
    let kutu = null;
    if (aday) {
      try {
        const b = aday.getBBox();
        kutu = { x: b.x, y: b.y, w: b.width, h: b.height, don: 0 };
        const ust = aday.parentNode;
        if (ust && ust.getAttribute('transform') && ust.getAttribute('transform').indexOf('rotate') === 0) {
          kutu.don = 1;
        }
      } catch (e) { kutu = null; }
    }
    if (!kutu) {
      kutu = { x: k.x - k.r, y: k.y - k.r, w: k.r * 2, h: k.r * 2, don: 0 };
    }
    const pad = 6;
    const r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('x', kutu.x - pad);
    r.setAttribute('y', kutu.y - pad);
    r.setAttribute('width', Math.max(kutu.w, 2) + pad * 2);
    r.setAttribute('height', Math.max(kutu.h, 2) + pad * 2);
    r.setAttribute('fill', 'none');
    r.setAttribute('stroke', '#2fb6b0');
    r.setAttribute('stroke-width', 2);
    r.setAttribute('stroke-dasharray', '7 5');
    r.setAttribute('vector-effect', 'non-scaling-stroke');
    // Sınır kutusu katmanın yerel koordinatındadır; çerçeve aynı dönüşümle taşınır.
    const cerceve = document.createElementNS(SVGNS, 'g');
    const ustG = aday ? aday.parentNode : null;
    let tr = aday ? (aday.getAttribute('transform') || '') : '';
    if (ustG && ustG.classList && ustG.classList.contains('sim')) {
      tr = (ustG.getAttribute('transform') || '') + ' ' + tr;
    }
    cerceve.setAttribute('transform', tr.trim());
    cerceve.appendChild(r);
    els.overlay.appendChild(cerceve);
  }

  function viewBoxDegeri() {
    const s = belge, vw = s.w / zoom, vh = s.h / zoom;
    return '0 0 ' + s.w + ' ' + s.h;
  }

  function uygulaZoom() {
    const s = belge, vw = s.w / zoom, vh = s.h / zoom;
    els.stage.setAttribute('viewBox', (s.w - vw) / 2 + ' ' + (s.h - vh) / 2 + ' ' + vw + ' ' + vh);
    els.zoomLabel.textContent = '%' + Math.round(zoom * 100);
    cizSecim();
  }

  /* --- Ekran koordinatından tuval koordinatına --- */
  function tuvalNoktasi(ev) {
    const pt = els.stage.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const m = els.stage.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  /* ---------- Panel arayüzü ---------- */
  let aktifSekme = 'desen';

  const sayi = (v) => (Math.round(v * 100) / 100);

  function kaydirici(etiket, bag, deger, min, max, adim, birim) {
    return '<div class="field"><label>' + etiket + ' <b>' + sayi(deger) + (birim || '') + '</b></label>' +
      '<input type="range" data-bag="' + bag + '" min="' + min + '" max="' + max + '" step="' + adim + '" value="' + deger + '"></div>';
  }

  function desenSekmesi() {
    const s = belge, k = secili();
    let h = '';

    h += '<div class="section"><h2>Simetri</h2>';
    h += '<div class="field"><label>Düzen</label><div class="seg" data-act="mod">';
    [['radyal', 'Radyal'], ['karo', 'Karo'], ['tek', 'Tekil']].forEach(function (m) {
      h += '<button type="button" class="' + (s.simetri.mod === m[0] ? 'is-active' : '') + '" data-deger="' + m[0] + '">' + m[1] + '</button>';
    });
    h += '</div></div>';

    if (s.simetri.mod === 'radyal') {
      h += '<div class="field"><label>Kat sayısı</label><div class="seg" data-act="n">';
      [4, 6, 8, 12].forEach(function (n) {
        h += '<button type="button" class="' + (s.simetri.n === n ? 'is-active' : '') + '" data-deger="' + n + '">' + n + '</button>';
      });
      h += '</div></div>';
    }

    if (s.simetri.mod === 'karo') {
      h += '<div class="field"><label>Tekrar (kolon × satır)</label><div class="seg">' +
        '<input type="number" min="1" max="6" data-bag="karo.kol" value="' + s.karo.kol + '" aria-label="Kolon sayısı">' +
        '<input type="number" min="1" max="6" data-bag="karo.sat" value="' + s.karo.sat + '" aria-label="Satır sayısı">' +
        '</div></div>';
    }

    h += kaydirici('Kompozisyon açısı', 'simetri.aci', s.simetri.aci, 0, 90, 1, '°');
    h += '</div>';

    h += '<div class="section"><h2>Motif ekle</h2><div class="chip-row">';
    Object.keys(D.MOTIFLER).forEach(function (tip) {
      h += '<button type="button" class="chip" data-act="ekle" data-tip="' + tip + '" title="' + D.MOTIFLER[tip].not + '">+ ' + D.MOTIFLER[tip].ad + '</button>';
    });
    h += '</div><p class="help">Her motif, tuvalin merkezine eklenir ve tek tek düzenlenebilir bir katman olur.</p></div>';

    h += '<div class="section"><h2>Seçili katman</h2>';
    if (!k) {
      h += '<p class="empty-note">Tuvalden bir motif seçin veya yukarıdan yeni bir motif ekleyin.</p>';
    } else {
      h += '<div class="field"><label>Katman adı</label><input type="text" data-bag="sec.ad" value="' + k.ad.replace(/"/g, '&quot;') + '"></div>';
      h += kaydirici('Ölçek', 'sec.olcek', k.olcek, 0.15, 3, 0.05, '×');
      h += kaydirici('Döndürme', 'sec.aci', k.aci, 0, 360, 1, '°');
      h += kaydirici('Çizgi kalınlığı', 'sec.cizgi', k.cizgi, 0.4, 12, 0.2, ' px');
      h += kaydirici('Motif boşluğu', 'sec.bosluk', k.bosluk, 0, 40, 0.5, ' px');
      h += kaydirici('Boyut', 'sec.r', k.r, 20, 460, 1, ' px');
      h += '<div class="field"><label>Dolgu rengi</label><div class="swatches" data-act="renk" data-hedef="dolgu">' +
        D.PALETLER[s.palet].renkler.map(function (c) {
          return '<button type="button" class="swatch" style="background:' + c + '" data-renk="' + c + '" aria-label="Dolgu ' + c + '" aria-pressed="' + (k.dolgu === c) + '"></button>';
        }).join('') + '</div></div>';
      h += '<div class="field"><label>Çizgi rengi</label><div class="swatches" data-act="renk" data-hedef="cizgiRenk">' +
        D.PALETLER[s.palet].renkler.map(function (c) {
          return '<button type="button" class="swatch" style="background:' + c + '" data-renk="' + c + '" aria-label="Çizgi ' + c + '" aria-pressed="' + (k.cizgiRenk === c) + '"></button>';
        }).join('') + '</div></div>';
      h += '<div class="chip-row"><button type="button" class="chip" data-act="oneAl">Öne al</button>' +
        '<button type="button" class="chip" data-act="arkaAl">Arkaya al</button>' +
        '<button type="button" class="chip" data-act="kopyala">Çoğalt</button>' +
        '<button type="button" class="chip" data-act="sil">Sil</button></div>';
    }
    h += '</div>';

    h += '<div class="section"><h2>Renk paleti</h2><div class="seg" data-act="palet">';
    Object.keys(D.PALETLER).forEach(function (p) {
      h += '<button type="button" class="' + (s.palet === p ? 'is-active' : '') + '" data-deger="' + p + '">' + D.PALETLER[p].ad + '</button>';
    });
    h += '</div><div class="palette-row" style="margin-top:8px">' +
      '<button type="button" class="btn" data-act="paletUygula">Paleti katmanlara dağıt</button></div>' +
      '<p class="help">Palet değişimi yeni renk seçeneklerini getirir; dağıtma işlemi katman renklerini sırayla yeniler.</p></div>';

    return h;
  }

  function katmanSekmesi() {
    const liste = belge.katmanlar.slice().reverse();
    let h = '<div class="section"><h2>Katmanlar (' + belge.katmanlar.length + ')</h2>';
    if (!liste.length) {
      h += '<p class="empty-note">Henüz katman yok. "Desen" sekmesinden motif ekleyin.</p>';
    } else {
      h += '<ul class="layer-list">';
      liste.forEach(function (k) {
        h += '<li class="layer-item ' + (k.id === seciliId ? 'is-selected ' : '') + (k.gorunur ? '' : 'is-hidden') + '" data-sec="' + k.id + '">' +
          '<span class="dot" style="background:' + k.dolgu + '"></span>' +
          '<span class="name">' + k.ad + '</span>' +
          '<span class="type">' + (D.MOTIFLER[k.tip] ? D.MOTIFLER[k.tip].ad.split(' ')[0] : k.tip) + '</span>' +
          '<button type="button" class="mini" data-act="gorunur" data-id="' + k.id + '" title="Göster/gizle" aria-label="Göster veya gizle">' + (k.gorunur ? '◉' : '○') + '</button>' +
          '<button type="button" class="mini" data-act="yukari" data-id="' + k.id + '" title="Bir üste taşı" aria-label="Bir üste">▲</button>' +
          '<button type="button" class="mini" data-act="asagi" data-id="' + k.id + '" title="Bir alta taşı" aria-label="Bir alta">▼</button>' +
          '<button type="button" class="mini" data-act="silId" data-id="' + k.id + '" title="Katmanı sil" aria-label="Sil">✕</button>' +
          '</li>';
      });
      h += '</ul><p class="help">Liste en üstteki katmanı en başta gösterir. Satıra dokunmak katmanı seçer.</p>';
    }
    h += '</div>';
    return h;
  }

  function belgeSekmesi() {
    const s = belge;
    let h = '<div class="section"><h2>Tuval</h2>';
    h += '<div class="field"><label>Ölçü</label><div class="seg" data-act="olcu">';
    [['1000x1000', 'Kare'], ['1000x1400', 'Dikey'], ['1400x1000', 'Yatay']].forEach(function (o) {
      const aktif = s.w + 'x' + s.h === o[0];
      h += '<button type="button" class="' + (aktif ? 'is-active' : '') + '" data-deger="' + o[0] + '">' + o[1] + '</button>';
    });
    h += '</div></div>';
    h += '<div class="field"><label>Arka plan</label><div class="swatches" data-act="arka">' +
      ['#f6f3ea', '#f2e7d8', '#eef2f6', '#0f2237', '#132234', '#fbf9f3'].map(function (c) {
        return '<button type="button" class="swatch" style="background:' + c + '" data-renk="' + c + '" aria-label="Arka plan ' + c + '" aria-pressed="' + (s.arka === c) + '"></button>';
      }).join('') + '</div></div>';
    h += '</div>';

    h += '<div class="section"><h2>Belge işlemleri</h2><div class="chip-row">' +
      '<button type="button" class="chip" data-act="ornekler">Hazır örnekler</button>' +
      '<button type="button" class="chip" data-act="kaydet">Projeyi kaydet (JSON)</button>' +
      '<button type="button" class="chip" data-act="ac">Proje aç</button>' +
      '<button type="button" class="chip" data-act="temizle">Tuvali boşalt</button>' +
      '</div></div>';

    h += '<div class="section"><h2>Kısayollar</h2><p class="help">' +
      '<b>Ctrl+Z</b> geri al · <b>Ctrl+Y</b> yinele · <b>Delete</b> seçili katmanı sil · ' +
      '<b>Ok tuşları</b> katmanı 2 px kaydır · <b>Ctrl+D</b> çoğalt · <b>Esc</b> seçimi bırak.</p></div>';

    h += '<div class="section"><h2>Not</h2><p class="help">Motif adları geleneğe gönderme yapar; geometrik kurguların tamamı bu atölye için özgün üretilmiştir ve tarihsel bir eserin kopyası olarak sunulmaz. ' +
      'Tüm çıktılar gerçek vektördür: yakınlaştırıldığında pikselleşmez.</p></div>';
    return h;
  }

  function panelCiz() {
    if (!els.panelBody) return;
    els.panelBody.innerHTML = aktifSekme === 'desen' ? desenSekmesi() : aktifSekme === 'katman' ? katmanSekmesi() : belgeSekmesi();
    $$('.tab').forEach(function (t) {
      const sec = t.id === 'tabBtn-' + aktifSekme;
      t.classList.toggle('is-active', sec);
      t.setAttribute('aria-selected', sec ? 'true' : 'false');
    });
    if (els.title.textContent !== belge.ad) els.title.textContent = belge.ad;
    els.meta.textContent = belge.w + ' × ' + belge.h;
  }

  /* ---------- Katman işlemleri ---------- */
  function silKatman(id) {
    const i = belge.katmanlar.findIndex(function (k) { return k.id === id; });
    if (i < 0) return;
    itele();
    belge.katmanlar.splice(i, 1);
    if (seciliId === id) seciliId = null;
    ciz(); panelCiz(); guncelleButonlar();
    durum('Katman silindi.');
  }

  function kopyalaKatman(id) {
    const k = belge.katmanlar.find(function (x) { return x.id === id; });
    if (!k) return;
    itele();
    const yeni = kopya(k);
    yeni.id = yeniId();
    yeni.ad = k.ad + ' kopya';
    yeni.x = Math.min(k.x + 30, belge.w);
    yeni.y = Math.min(k.y + 30, belge.h);
    belge.katmanlar.push(yeni);
    seciliId = yeni.id;
    ciz(); panelCiz(); guncelleButonlar();
    durum('Katman çoğaltıldı.');
  }

  function tasi(id, yon) {
    const i = belge.katmanlar.findIndex(function (k) { return k.id === id; });
    const j = i + yon;
    if (i < 0 || j < 0 || j >= belge.katmanlar.length) return;
    itele();
    const gecici = belge.katmanlar[i];
    belge.katmanlar[i] = belge.katmanlar[j];
    belge.katmanlar[j] = gecici;
    ciz(); panelCiz(); guncelleButonlar();
  }

  function degistir(fn) {
    itele();
    fn();
    ciz(); panelCiz(); guncelleButonlar();
  }

  /* ---------- Panel olayları ---------- */
  function panelOlaylari() {
    els.panelBody.addEventListener('input', function (ev) {
      const el = ev.target;
      if (!el.dataset || !el.dataset.bag) return;
      itele();
      const ham = el.type === 'range' || el.type === 'number' ? parseFloat(el.value) : el.value;
      const h = hedefNesne(el.dataset.bag);
      if (!h) return;
      h.nesne[h.anahtar] = isNaN(ham) ? 0 : ham;
      ciz(); guncelleButonlar();
    });

    els.panelBody.addEventListener('change', function (ev) {
      if (ev.target.dataset && ev.target.dataset.bag) panelCiz();
    });

    els.panelBody.addEventListener('click', function (ev) {
      const act = ev.target.closest('[data-act]');
      const satir = ev.target.closest('[data-sec]');
      if (satir && !act) {
        seciliId = satir.dataset.sec;
        ciz(); panelCiz();
        return;
      }
      if (!act) return;
      // Değer ve renk, tıklanan alt düğmede taşınır; kapsayıcıdan okunmaz.
      const degerEl = ev.target.closest('[data-deger]');
      const deger = degerEl ? degerEl.dataset.deger : null;
      const renkEl = ev.target.closest('[data-renk]');
      const renk = renkEl ? renkEl.dataset.renk : null;
      const eylem = act.dataset.act;

      if (eylem === 'mod') degistir(function () { belge.simetri.mod = deger; });
      else if (eylem === 'n') degistir(function () { belge.simetri.n = parseInt(deger, 10); });
      else if (eylem === 'palet') degistir(function () { belge.palet = deger; });
      else if (eylem === 'ekle') {
        degistir(function () {
          const yeni = yeniKatman(act.dataset.tip);
          belge.katmanlar.push(yeni);
          seciliId = yeni.id;
        });
        durum('Motif eklendi: ' + D.MOTIFLER[act.dataset.tip].ad);
      } else if (eylem === 'sil') { if (seciliId) silKatman(seciliId); }
      else if (eylem === 'silId') silKatman(act.dataset.id);
      else if (eylem === 'kopyala') { if (seciliId) kopyalaKatman(seciliId); }
      else if (eylem === 'oneAl') { if (seciliId) tasi(seciliId, 1); }
      else if (eylem === 'arkaAl') { if (seciliId) tasi(seciliId, -1); }
      else if (eylem === 'yukari') tasi(act.dataset.id, 1);
      else if (eylem === 'asagi') tasi(act.dataset.id, -1);
      else if (eylem === 'gorunur') {
        const k = belge.katmanlar.find(function (x) { return x.id === act.dataset.id; });
        if (k) degistir(function () { k.gorunur = !k.gorunur; });
      } else if (eylem === 'renk') {
        const k = secili();
        if (!k || !renk) return;
        degistir(function () { k[act.dataset.hedef] = renk; });
      } else if (eylem === 'arka') {
        if (!renk) return;
        degistir(function () { belge.arka = renk; });
      } else if (eylem === 'olcu') {
        const p = String(deger).split('x');
        degistir(function () {
          const eskiW = belge.w, eskiH = belge.h;
          belge.w = parseInt(p[0], 10); belge.h = parseInt(p[1], 10);
          if (eskiW !== belge.w || eskiH !== belge.h) {
            belge.katmanlar.forEach(function (k) {
              k.x = Math.min(k.x, belge.w); k.y = Math.min(k.y, belge.h);
            });
          }
        });
        uygulaZoom();
      } else if (eylem === 'paletUygula') {
        degistir(function () {
          const renkler = D.PALETLER[belge.palet].renkler;
          belge.katmanlar.forEach(function (k, i) {
            k.dolgu = renkler[(i + 1) % renkler.length];
            k.cizgiRenk = renkler[(i + 4) % renkler.length];
          });
        });
        durum('Palet uygulandı.');
      } else if (eylem === 'temizle') {
        if (!belge.katmanlar.length) return;
        degistir(function () { belge.katmanlar = []; seciliId = null; });
        durum('Tuval boşaltıldı.');
      } else if (eylem === 'ornekler') acOrnekler();
      else if (eylem === 'kaydet') exportJson();
      else if (eylem === 'ac') $('#fileInput').click();
    });
  }

  function hedefNesne(yol) {
    const parca = yol.split('.');
    let h = belge;
    for (let i = 0; i < parca.length - 1; i++) {
      if (parca[i] === 'sec') { h = secili(); if (!h) return null; }
      else { h = h[parca[i]]; if (!h) return null; }
    }
    return { nesne: h, anahtar: parca[parca.length - 1] };
  }

  /* ---------- Dışa aktarma ---------- */
  function dosyaAdi(uzanti) {
    const harf = { 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c', 'İ': 'i' };
    const temel = (belge.ad || 'kompozisyon')
      .replace(/[ışğüöçİ]/g, function (h) { return harf[h] || h; })
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (temel || 'kompozisyon') + '.' + uzanti;
  }

  function indir(blob, ad) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function svgMetni() {
    const s = belge;
    const kok = document.createElementNS(SVGNS, 'svg');
    kok.setAttribute('xmlns', SVGNS);
    kok.setAttribute('width', String(s.w));
    kok.setAttribute('height', String(s.h));
    kok.setAttribute('viewBox', '0 0 ' + s.w + ' ' + s.h);
    const bg = document.createElementNS(SVGNS, 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', String(s.w)); bg.setAttribute('height', String(s.h));
    bg.setAttribute('fill', s.arka);
    kok.appendChild(bg);
    const klon = els.artwork.cloneNode(true);
    klon.removeAttribute('class');
    Array.from(klon.querySelectorAll('[data-id]')).forEach(function (n) { n.removeAttribute('data-id'); });
    Array.from(klon.querySelectorAll('.layer')).forEach(function (n) { n.removeAttribute('class'); });
    kok.appendChild(klon);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(kok);
  }

  function exportSvg() {
    if (!belge.katmanlar.length) { durum('Dışa aktarmak için en az bir katman gerekli.', true); return; }
    indir(new Blob([svgMetni()], { type: 'image/svg+xml;charset=utf-8' }), dosyaAdi('svg'));
    durum('SVG indirildi: ' + dosyaAdi('svg'));
  }

  function pngUret(kenar) {
    return new Promise(function (resolve, reject) {
      const blob = new Blob([svgMetni()], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = function () {
        const olcek = kenar / Math.max(belge.w, belge.h);
        const c = document.createElement('canvas');
        c.width = Math.round(belge.w * olcek);
        c.height = Math.round(belge.h * olcek);
        const ctx = c.getContext('2d');
        ctx.fillStyle = belge.arka;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (b) resolve({ blob: b, genislik: c.width, yukseklik: c.height });
          else reject(new Error('PNG kodlanamadı'));
        }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('SVG görüntüye çevrilemedi')); };
      img.src = url;
    });
  }

  function exportPng() {
    if (!belge.katmanlar.length) { durum('Dışa aktarmak için en az bir katman gerekli.', true); return; }
    durum('PNG hazırlanıyor (2048 px)...');
    pngUret(2048).then(function (sonuc) {
      indir(sonuc.blob, dosyaAdi('png'));
      durum('PNG indirildi: ' + sonuc.genislik + ' × ' + sonuc.yukseklik + ' px');
    }).catch(function (hata) {
      durum('PNG üretilemedi: ' + hata.message, true);
    });
  }

  function exportJson() {
    indir(new Blob([JSON.stringify(belge, null, 2)], { type: 'application/json' }), dosyaAdi('json'));
    durum('Proje dosyası indirildi: ' + dosyaAdi('json'));
  }

  function belgeDogrula(o) {
    if (!o || typeof o !== 'object') return 'Dosya bir proje belgesi değil.';
    if (!Array.isArray(o.katmanlar)) return 'Katman listesi bulunamadı.';
    if (!o.simetri || ['radyal', 'karo', 'tek'].indexOf(o.simetri.mod) < 0) return 'Simetri bilgisi geçersiz.';
    for (let i = 0; i < o.katmanlar.length; i++) {
      const k = o.katmanlar[i];
      if (!k || !D.MOTIFLER[k.tip]) return 'Tanınmayan motif tipi: ' + (k && k.tip);
    }
    return null;
  }

  function belgeYukle(ham, kaynak) {
    const hata = belgeDogrula(ham);
    if (hata) { durum('Açılamadı: ' + hata, true); return false; }
    itele();
    const b = bosBelge();
    b.ad = typeof ham.ad === 'string' ? ham.ad : 'Adsız kompozisyon';
    b.w = [1000, 1400].indexOf(ham.w) >= 0 ? ham.w : 1000;
    b.h = [1000, 1400].indexOf(ham.h) >= 0 ? ham.h : 1000;
    b.arka = typeof ham.arka === 'string' ? ham.arka : '#f6f3ea';
    b.palet = D.PALETLER[ham.palet] ? ham.palet : 'iznik';
    b.simetri = Object.assign({ mod: 'radyal', n: 8, aci: 0 }, ham.simetri);
    if ([4, 6, 8, 12].indexOf(b.simetri.n) < 0) b.simetri.n = 8;
    b.karo = Object.assign({ kol: 3, sat: 3 }, ham.karo);
    b.katmanlar = ham.katmanlar.map(function (k) {
      const varsayilan = yeniKatman(k.tip);
      const birlesik = Object.assign(varsayilan, k);
      birlesik.id = yeniId();
      birlesik.gorunur = k.gorunur !== false;
      return birlesik;
    });
    belge = b;
    seciliId = null;
    zoom = 1;
    ciz(); panelCiz(); uygulaZoom(); guncelleButonlar();
    durum(kaynak + ' açıldı: ' + b.ad);
    return true;
  }

  /* ---------- Örnek galerisi ---------- */
  function miniSvg(ornek) {
    const b = ornek.belge;
    const sm = Object.assign({ mod: 'radyal', n: 8, aci: 0 }, b.simetri || {});
    const ic = ornek.katmanlar.map(function (k) {
      return '<g transform="translate(' + k.x + ' ' + k.y + ') rotate(' + (k.aci || 0) + ') scale(' + (k.olcek || 1) + ')">' +
        D.MOTIFLER[k.tip].uret({ r: k.r, cizgi: k.cizgi, bosluk: k.bosluk, dolgu: k.dolgu, cizgiRenk: k.cizgiRenk }) + '</g>';
    }).join('');
    let govde = '';
    if (sm.mod === 'radyal') {
      for (let i = 0; i < sm.n; i++) govde += '<g transform="rotate(' + (360 / sm.n * i + (sm.aci || 0)) + ' 500 500)">' + ic + '</g>';
    } else if (sm.mod === 'karo') {
      const kol = (b.karo && b.karo.kol) || 3, sat = (b.karo && b.karo.sat) || 3;
      for (let i = 0; i < kol; i++) {
        for (let j = 0; j < sat; j++) {
          govde += '<g transform="translate(' + (i * 1000 / kol) + ' ' + (j * 1000 / sat) + ') scale(' + (1 / kol) + ' ' + (1 / sat) + ')">' + ic + '</g>';
        }
      }
    } else { govde = ic; }
    return '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="1000" height="1000" fill="' + (b.arka || '#f6f3ea') + '"/>' + govde + '</svg>';
  }

  let modal = null;
  function modalKur() {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ornekModal';
    modal.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Hazır kompozisyonlar">' +
      '<div class="modal-head"><h2>Hazır kompozisyonlar</h2><button type="button" class="btn" id="modalKapat">Kapat</button></div>' +
      '<div class="modal-body"><div class="sample-grid" id="ornekListe"></div>' +
      '<p class="help">Her örnek, katman katman düzenlenebilir gerçek bir belge olarak açılır. Motif adları geleneğe gönderme yapar; kurgular özgündür.</p></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal || ev.target.id === 'modalKapat') modal.classList.remove('is-open');
      const kart = ev.target.closest('[data-ornek]');
      if (kart) { ornekYukle(kart.dataset.ornek); modal.classList.remove('is-open'); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal.classList.contains('is-open')) modal.classList.remove('is-open');
    });
  }

  function acOrnekler() {
    const liste = modal.querySelector('#ornekListe');
    if (!liste.children.length) {
      liste.innerHTML = ORNEKLER.map(function (o) {
        return '<button type="button" class="sample-card" data-ornek="' + o.id + '">' + miniSvg(o) +
          '<strong>' + o.ad + '</strong><span>' + o.aciklama + '</span></button>';
      }).join('');
    }
    modal.classList.add('is-open');
  }

  function ornekYukle(id) {
    const o = ORNEKLER.find(function (x) { return x.id === id; });
    if (!o) return;
    itele();
    const b = bosBelge();
    b.ad = o.belge.ad || o.ad;
    b.arka = o.belge.arka || '#f6f3ea';
    b.palet = o.belge.palet || 'iznik';
    b.simetri = Object.assign({ mod: 'radyal', n: 8, aci: 0 }, o.belge.simetri);
    b.karo = Object.assign({ kol: 3, sat: 3 }, o.belge.karo);
    b.katmanlar = o.katmanlar.map(function (k) {
      return Object.assign({}, yeniKatman(k.tip), k, { id: yeniId() });
    });
    belge = b;
    seciliId = null;
    ciz(); panelCiz(); uygulaZoom(); guncelleButonlar();
    durum('Örnek yüklendi: ' + b.ad);
  }

  /* ---------- Tuvalde seçim ve taşıma ---------- */
  let surukle = null;
  function tuvalOlaylari() {
    els.stage.addEventListener('pointerdown', function (ev) {
      const grup = ev.target.closest ? ev.target.closest('.layer') : null;
      if (!grup) {
        if (seciliId) { seciliId = null; ciz(); panelCiz(); }
        return;
      }
      const id = grup.getAttribute('data-id');
      if (seciliId !== id) { seciliId = id; ciz(); panelCiz(); }
      const k = secili();
      if (!k) return;
      const nokta = tuvalNoktasi(ev);
      let don = 0;
      const ust = grup.parentNode;
      if (ust && ust.classList && ust.classList.contains('sim')) {
        const m = /rotate\(([-\d.]+)/.exec(ust.getAttribute('transform') || '');
        if (m) don = parseFloat(m[1]);
      }
      const karo = belge.simetri.mod === 'karo';
      surukle = {
        k: k,
        x0: k.x, y0: k.y,
        bas: nokta,
        don: don * Math.PI / 180,
        olcekX: karo ? belge.karo.kol : 1,
        olcekY: karo ? belge.karo.sat : 1
      };
      itele();
      els.stage.classList.add('is-grabbing');
      try { els.stage.setPointerCapture(ev.pointerId); } catch (e) { /* yok say */ }
      ev.preventDefault();
    });

    els.stage.addEventListener('pointermove', function (ev) {
      if (!surukle) return;
      const p = tuvalNoktasi(ev);
      let dx = (p.x - surukle.bas.x) * surukle.olcekX;
      let dy = (p.y - surukle.bas.y) * surukle.olcekY;
      const c = Math.cos(-surukle.don), s = Math.sin(-surukle.don);
      const rx = dx * c - dy * s;
      const ry = dx * s + dy * c;
      surukle.k.x = Math.round(surukle.x0 + rx);
      surukle.k.y = Math.round(surukle.y0 + ry);
      ciz();
    });

    function birak() {
      if (!surukle) return;
      surukle = null;
      els.stage.classList.remove('is-grabbing');
      panelCiz();
    }
    els.stage.addEventListener('pointerup', birak);
    els.stage.addEventListener('pointercancel', birak);
  }

  function kisayollar() {
    document.addEventListener('keydown', function (ev) {
      const hedef = ev.target;
      const etiket = (hedef.tagName || '').toLowerCase();
      const yaziyor = etiket === 'input' || etiket === 'textarea' || etiket === 'select' || hedef.isContentEditable;
      const ctrl = ev.ctrlKey || ev.metaKey;
      const tus = (ev.key || '').toLowerCase();

      if (ctrl && tus === 'z') { ev.preventDefault(); geriAl(); return; }
      if (ctrl && tus === 'y') { ev.preventDefault(); yinele(); return; }
      if (yaziyor) return;
      if (ctrl && tus === 'd') { ev.preventDefault(); if (seciliId) kopyalaKatman(seciliId); return; }
      if (ev.key === 'Delete' || ev.key === 'Backspace') { if (seciliId) { ev.preventDefault(); silKatman(seciliId); } return; }
      if (ev.key === 'Escape') { seciliId = null; ciz(); panelCiz(); return; }
      const yon = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (yon && seciliId) {
        const k = secili();
        if (!k) return;
        ev.preventDefault();
        itele();
        k.x += yon[0] * 2; k.y += yon[1] * 2;
        ciz(); guncelleButonlar();
      }
    });
  }

  /* ---------- Başlatma ---------- */
  function olaylar() {
    $('#btnUndo').addEventListener('click', geriAl);
    $('#btnRedo').addEventListener('click', yinele);
    $('#btnReset').addEventListener('click', function () {
      itele();
      belge = bosBelge();
      seciliId = null;
      zoom = 1;
      ciz(); panelCiz(); uygulaZoom(); guncelleButonlar();
      durum('Yeni boş belge açıldı.');
    });
    $('#btnSamples').addEventListener('click', acOrnekler);
    $('#btnOpen').addEventListener('click', function () { $('#fileInput').click(); });
    $('#btnSave').addEventListener('click', exportJson);
    $('#btnExportSvg').addEventListener('click', exportSvg);
    $('#btnExportPng').addEventListener('click', exportPng);
    $('#btnExportJson').addEventListener('click', exportJson);

    $('#btnZoomIn').addEventListener('click', function () { zoom = Math.min(zoom * 1.25, 8); uygulaZoom(); });
    $('#btnZoomOut').addEventListener('click', function () { zoom = Math.max(zoom / 1.25, 0.5); uygulaZoom(); });
    $('#btnZoomFit').addEventListener('click', function () { zoom = 1; uygulaZoom(); });

    $('#fileInput').addEventListener('change', function (ev) {
      const dosya = ev.target.files && ev.target.files[0];
      if (!dosya) return;
      const okuyucu = new FileReader();
      okuyucu.onload = function () {
        try {
          belgeYukle(JSON.parse(String(okuyucu.result)), dosya.name);
        } catch (hata) {
          durum('Dosya okunamadı: geçerli JSON değil.', true);
        }
      };
      okuyucu.readAsText(dosya);
      ev.target.value = '';
    });

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        aktifSekme = t.id.replace('tabBtn-', '');
        panelCiz();
      });
    });

    const baslik = $('#docTitle');
    baslik.addEventListener('blur', function () {
      const yeni = (baslik.textContent || '').trim() || 'Adsız kompozisyon';
      if (yeni !== belge.ad) { itele(); belge.ad = yeni; guncelleButonlar(); }
      baslik.textContent = yeni;
    });
    baslik.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); baslik.blur(); }
    });

    window.addEventListener('resize', function () { cizSecim(); });
    panelOlaylari();
    tuvalOlaylari();
    kisayollar();
  }

  function baslat() {
    dom();
    modalKur();
    olaylar();
    belge = bosBelge();
    ciz(); panelCiz(); uygulaZoom(); guncelleButonlar();
    durum('Hazır. "Örnekler" ile başlayın veya panelden motif ekleyin.');
  }

  // Denetim kancası — doğrulama betiklerinin belge durumuna ve dışa aktarmaya erişimi
  window.__atolye = {
    belge: function () { return belge; },
    sec: function (id) { seciliId = id; ciz(); panelCiz(); },
    svgMetni: svgMetni,
    pngUret: pngUret,
    ciz: function () { ciz(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
