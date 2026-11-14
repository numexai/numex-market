/* ==========================================================================
   NUMEX STUDIO X — Tarayıcı tabanlı grafik tasarım editörü
   Tek dosya, bağımlılıksız. Sahne modeli + etkileşim + dışa aktarma.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     SABİTLER
     ------------------------------------------------------------------ */
  const SIZES = [
    { id: 'ig-post', label: 'Instagram Gönderisi · 1080 × 1080', w: 1080, h: 1080 },
    { id: 'ig-story', label: 'Instagram Story · 1080 × 1920', w: 1080, h: 1920 },
    { id: 'poster', label: 'Afiş · 1080 × 1620', w: 1080, h: 1620 },
    { id: 'a4', label: 'A4 Baskı · 1240 × 1754', w: 1240, h: 1754 },
    { id: 'card', label: 'Kartvizit · 1050 × 600', w: 1050, h: 600 },
    { id: 'yt', label: 'YouTube Kapağı · 1280 × 720', w: 1280, h: 720 },
    { id: 'yt-thumb', label: 'YouTube Küçük Resim · 1200 × 628', w: 1200, h: 628 },
    { id: 'twitter', label: 'X / Twitter · 1600 × 900', w: 1600, h: 900 },
    { id: 'link', label: 'LinkedIn · 1200 × 627', w: 1200, h: 627 },
    { id: 'story', label: 'Dikey Story · 1080 × 1920', w: 1080, h: 1920 }
  ];

  const DEFAULTS = {
    bgStyle: 'solid',
    bgColor: '#101014',
    bgColor2: '#2b1f4d',
    width: 1080,
    height: 1080
  };

  /* ------------------------------------------------------------------
     DURUM
     ------------------------------------------------------------------ */
  const state = {
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    bgStyle: DEFAULTS.bgStyle,
    bgColor: DEFAULTS.bgColor,
    bgColor2: DEFAULTS.bgColor2,
    objects: [],
    selectedId: null,
    zoom: 0.6
  };

  let docName = 'Adsız Tasarım';
  let history = [];
  let historyIndex = -1;
  let uidCounter = 1;
  const HISTORY_LIMIT = 80;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* DOM referansları */
  const canvas = $('#canvas');
  const canvasBg = $('#canvasBg');
  const objectsRoot = $('#objects');
  const canvasArea = $('#canvasArea');
  const viewport = $('#viewport');
  const stageWrap = $('#stageWrap');
  const canvasHint = $('#canvasHint');
  const objToolbar = $('#objToolbar');
  const layerList = $('#layerList');
  const layerCount = $('#layerCount');
  const propsBody = $('#propsBody');
  const propsEmpty = $('#propsEmpty');
  const exportMenu = $('#exportMenu');
  const tplModal = $('#tplModal');
  const tplGrid = $('#tplGrid');
  const toastWrap = $('#toastWrap');

  /* ------------------------------------------------------------------
     YARDIMCILAR
     ------------------------------------------------------------------ */
  const uid = () => 'o' + (uidCounter++) + '_' + Math.random().toString(36).slice(2, 7);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d) => Math.round(v * (d || 100)) / (d || 100);

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 260);
    }, 2400);
  }

  /* Yazının altındaki zemin renginin parlaklığı: metin rengi okunur mu? */
  function luminance(hex) {
    if (!hex || hex[0] !== '#') return 0.5;
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6) return 0.5;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const f = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  /* Yeni metin rengi: arka plan açıksa koyu, koyuysa açık.
     Kullanıcı yazdığı metni HER ZAMAN görebilmeli. */
  function readableTextColor() {
    const bg = state.bgStyle === 'solid' ? state.bgColor : (state.bgStyle === 'linear' ? state.bgColor : state.bgColor2);
    return luminance(bg) > 0.45 ? '#101014' : '#f2f0ea';
  }

  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return hex;
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (alpha === undefined || alpha >= 1) return hex;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function esc(s) {
    /* DİKKAT: bu ifade bir betik bloğunda yaşıyor — HTML adlı varlıkları
       (örn. tırnak varlığı) düz metin yazmak parser'da etiket kapanışı gibi
       okunup betiği kesebilir. Bu yüzden varlıklar sayısal (&#34;) yazılır. */
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&#34;').replace(/'/g, '&#39;');
  }

  function bgCss(w, h) {
    if (state.bgStyle === 'linear') {
      return `linear-gradient(135deg, ${state.bgColor} 0%, ${state.bgColor2} 100%)`;
    }
    if (state.bgStyle === 'radial') {
      return `radial-gradient(circle at 50% 38%, ${state.bgColor2} 0%, ${state.bgColor} 72%)`;
    }
    return state.bgColor;
  }

  /* ------------------------------------------------------------------
     NESNE MODELİ
     ------------------------------------------------------------------ */
  function createObject(type, opts) {
    /* Varsayılanlar, çağıranın verdiği değerlerden ÖNCE birleştirilir
       (Object.assign soldan sağa yazar; tersi hâlde x/y/w/h eziliyordu). */
    const base = Object.assign({
      type: type,
      name: '',
      x: 0, y: 0, w: 200, h: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#ff4d5e',
      stroke: '#ffffff',
      strokeWidth: 0,
      radius: 0
    }, opts || {});
    if (!base.id) base.id = uid();
    if (!base.name) base.name = defaultName(base);
    return base;
  }


  function defaultName(o) {
    if (o.type === 'text') return (o.text || 'Metin').slice(0, 22);
    if (o.type === 'image') return 'Görsel';
    if (o.type === 'svg') return 'SVG';
    const map = { rect: 'Dikdörtgen', ellipse: 'Elips', triangle: 'Üçgen', line: 'Çizgi', star: 'Yıldız', circle: 'Daire' };
    return map[o.shape] || 'Şekil';
  }

  function selected() {
    return state.objects.find(o => o.id === state.selectedId) || null;
  }

  /* ------------------------------------------------------------------
     GEÇMİŞ (undo / redo)
     ------------------------------------------------------------------ */
  function snapshot() {
    return JSON.stringify({
      width: state.width,
      height: state.height,
      bgStyle: state.bgStyle,
      bgColor: state.bgColor,
      bgColor2: state.bgColor2,
      objects: state.objects
    });
  }

  function restore(snap) {
    const d = JSON.parse(snap);
    state.width = d.width;
    state.height = d.height;
    state.bgStyle = d.bgStyle;
    state.bgColor = d.bgColor;
    state.bgColor2 = d.bgColor2;
    state.objects = d.objects;
    if (!state.objects.some(o => o.id === state.selectedId)) state.selectedId = null;
    renderAll();
    fitZoom();
  }

  function pushHistory() {
    const snap = snapshot();
    if (history[historyIndex] === snap) return;
    history = history.slice(0, historyIndex + 1);
    history.push(snap);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
    updateUndoButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restore(history[historyIndex]);
    updateUndoButtons();
    toast('Geri alındı');
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restore(history[historyIndex]);
    updateUndoButtons();
    toast('İleri alındı');
  }

  function updateUndoButtons() {
    /* Buton yok ama kısayol çalışır; tutarlılık için ileride eklenecek */
  }

  /* ------------------------------------------------------------------
     ÇİZİM
     ------------------------------------------------------------------ */
  function shapeSvgPath(o) {
    const w = o.w, h = o.h;
    const sw = o.strokeWidth || 0;
    const strokeAttr = sw > 0 ? `stroke="${esc(o.stroke)}" stroke-width="${sw}"` : 'stroke="none"';
    const fillAttr = o.fill === 'none' ? 'fill="none"' : `fill="${esc(o.fill)}"`;

    switch (o.shape) {
      case 'rect':
        return `<rect x="0" y="0" width="${w}" height="${h}" rx="${o.radius || 0}" ry="${o.radius || 0}" ${fillAttr} ${strokeAttr}/>`;
      case 'ellipse':
        return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" ${fillAttr} ${strokeAttr}/>`;
      case 'circle': {
        const r = Math.min(w, h) / 2;
        return `<circle cx="${w / 2}" cy="${h / 2}" r="${r}" ${fillAttr} ${strokeAttr}/>`;
      }
      case 'triangle':
        return `<polygon points="${w / 2},0 ${w},${h} 0,${h}" ${fillAttr} ${strokeAttr}/>`;
      case 'line': {
        const lw = Math.max(2, o.strokeWidth || 6);
        return `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${esc(o.fill === 'none' ? o.stroke : o.fill)}" stroke-width="${lw}" stroke-linecap="round"/>`;
      }
      case 'star': {
        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) / 2, r = R * 0.42;
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI / 2 + (Math.PI / 5) * i;
          const rad = i % 2 === 0 ? R : r;
          pts.push((cx + Math.cos(ang) * rad).toFixed(1) + ',' + (cy + Math.sin(ang) * rad).toFixed(1));
        }
        return `<polygon points="${pts.join(' ')}" ${fillAttr} ${strokeAttr}/>`;
      }
      default:
        return `<rect x="0" y="0" width="${w}" height="${h}" ${fillAttr} ${strokeAttr}/>`;
    }
  }

  function textInnerHtml(o) {
    const text = o.uppercase ? String(o.text || '').toUpperCase() : (o.text || '');
    /* Boş satır sayısal varlıkla (&#160;) yazılır; adlı varlık düz metin
       olarak yazılırsa HTML parser'ı betiği kapatıyordu. */
    const lines = text.split('\n').map(l => l.length ? esc(l) : '&#160;').join('<br>');
    /* Biçim değerleri satır içi style olarak üretiliyor. */
    return `<div style="
      width:100%;height:100%;
      display:flex;align-items:center;
      justify-content:${o.align === 'center' ? 'center' : o.align === 'right' ? 'flex-end' : 'flex-start'};
      font-family:${o.fontFamily || "'Space Grotesk', sans-serif"};
      font-size:${o.fontSize || 64}px;
      line-height:${o.lineHeight || 1.15};
      font-weight:${o.fontWeight || 700};
      text-rendering:optimizeLegibility;
      font-style:${o.italic ? 'italic' : 'normal'};
      text-decoration:${o.underline ? 'underline' : 'none'};
      color:${o.fill};
      text-align:${o.align || 'left'};
      letter-spacing:${o.letterSpacing || 0}px;
      white-space:pre-wrap;
      word-break:break-word;
      padding:2px;
      text-shadow:${o.shadow ? '0 2px 12px rgba(0,0,0,.55)' : 'none'};
    ">${lines}</div>`;
  }

  function objInnerHtml(o) {
    if (o.type === 'text') return textInnerHtml(o);
    if (o.type === 'image') return `<img src="${esc(o.src)}" alt="" draggable="false" style="${o.radius ? `border-radius:${o.radius}px;` : ''}">`;
    if (o.type === 'svg') return `<div style="width:100%;height:100%">${o.svgContent || ''}</div>`;
    return `<svg width="100%" height="100%" viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="none">${shapeSvgPath(o)}</svg>`;
  }

  function applyObjStyle(el, o) {
    if (!el || !o) return;
    el.style.left = o.x + 'px';
    el.style.top = o.y + 'px';
    el.style.width = o.w + 'px';
    el.style.height = o.h + 'px';
    el.style.transform = `rotate(${o.rotation}deg)`;
    el.style.opacity = o.opacity;
    el.style.display = o.hidden ? 'none' : 'block';
  }

  /* Tuval ölçekleme */
  let zoomRepaintTimer = null;
  function applyZoom() {
    const z = state.zoom;
    canvas.style.width = state.width + 'px';
    canvas.style.height = state.height + 'px';
    /* Tuval, sol-üst köşeden ölçeklenir ve sahne kutusu tam olarak
       ölçeklenmiş boyutu kaplar: ortalanmış transform + clamp() ikilisi
       küçük ekranlarda tuvali üstten taşırıyordu. */
    canvas.style.transform = `scale(${z})`;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.marginLeft = '0';
    canvas.style.marginTop = '0';
    canvas.style.transformOrigin = '0 0';
    stageWrap.style.position = 'relative';
    stageWrap.style.margin = '0';

    /* Sahne kutusu tam tuval boyu olmalı: min-width/min-height artıkları
       tuvalin altında boş bir şerit bırakıyordu. */
    stageWrap.style.width = (state.width * z) + 'px';
    stageWrap.style.height = (state.height * z) + 'px';
    stageWrap.style.minWidth = '0';
    stageWrap.style.minHeight = '0';

    $('#zoomValue').textContent = Math.round(z * 100) + '%';
    $('#zoomRange').value = Math.round(z * 100);

    /* Seçim çerçevesini yeniden çiz */
    renderSelection();

    /* Yakınlaştırma sürüklenirken her karede tüm katmanı yeniden kurmak
       pahalı; ızgaralama düzeltmesi kısa bir gecikmeyle bir kez yapılır.
       renderObjects() buradan yeniden applyZoom çağırmaz; yoksa
       fitZoom → applyZoom → renderObjects zinciri kendini tetiklerdi. */
    clearTimeout(zoomRepaintTimer);
    zoomRepaintTimer = setTimeout(() => {
      if (document.body.contains(canvas)) renderObjects();
    }, 120);
  }

  function fitZoom() {
    const areaRect = canvasArea.getBoundingClientRect();
    const fit = Math.min(
      (areaRect.width - 60) / state.width,
      (areaRect.height - 60) / state.height,
      1
    );
    state.zoom = clamp(fit, 0.05, 2);
    applyZoom();
    /* Ölçek değişince nesneler ekran pikseline göre yeniden çizilir:
       tarayıcının ölçeklenmiş katmanı yeniden ızgaralaması yazıyı bozuyor. */
    renderObjects();
  }

  function renderBg() {
    canvas.style.background = bgCss(state.width, state.height);
    canvasBg.style.background = bgCss(state.width, state.height);
  }

  /* Metin nesnesi kutusunu içeriğe göre yeniden ölç:
     genişlik sabit kalır, yükseklik satır sayısına göre ayarlanır.
     Böylece uzun başlıklar kırpılmaz, imleç/ölçüm tuvaldekine eşit olur. */
  function fitTextObject(o) {
    if (o.type !== 'text') return;
    const scratch = document.createElement('div');
    scratch.className = 'canvas';
    scratch.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-99999px;top:0;transform:none;box-shadow:none;';
    scratch.style.width = o.w + 'px';
    scratch.style.height = o.h + 'px';
    const inner = document.createElement('div');
    inner.className = 'obj-inner';
    inner.style.width = '100%';
    inner.style.height = 'auto';
    inner.innerHTML = textInnerHtml(o);
    const wrap = inner.firstElementChild;
    if (wrap) { wrap.style.height = 'auto'; wrap.style.display = 'block'; }
    scratch.appendChild(inner);
    document.body.appendChild(scratch);
    const measured = inner.scrollHeight;
    document.body.removeChild(scratch);
    const fs = o.fontSize || 64;
    /* Punto kadar pay bırak: yuvarlak harflerin (Ş, Ğ) alt/üst uzantısı ve
       ızgara farkı yüzünden son satır kırpılmasın */
    const min = Math.round(fs * (o.lineHeight || 1.15) + fs * 0.3);
    o.h = Math.max(min, measured + Math.round(fs * 0.24));
  }

  /* Nesne DOM'u tek tek değiştiğinde tüm katmanı baştan kurmadan güncelle */
  function patchObjectEl(o) {
    const el = getObjEl(o.id);
    if (!el) return;
    fitTextObject(o);
    el.className = 'obj' + (o.id === state.selectedId ? ' selected' : '');
    applyObjStyle(el, o);
    const inner = el.querySelector('.obj-inner');
    if (inner) inner.innerHTML = objInnerHtml(o);
    /* Yeni font dosyası yüklendiğinde çizim yenilenir; aksi hâlde metin
       eski (yedek) fontla ölçülüp kalır */
    document.fonts.ready.then(() => {
      const cur = getObjEl(o.id);
      const ci = cur && cur.querySelector('.obj-inner');
      if (ci) ci.innerHTML = objInnerHtml(o);
    });
  }

  function renderObjects() {
    /* Seçim çerçevesi ve tutamaçlar .canvas'ın doğrudan çocuğu olarak
       yaşıyor; katmanı temizlerken onları da silmemek için önce kaldırılıp
       sonra yeniden çiziliyor (aksi hâlde ikinci çizimde iç içe kalıyorlardı). */
    const stale = canvas.querySelectorAll('.sel-box');
    stale.forEach(n => n.remove());
    objectsRoot.innerHTML = '';
    state.objects.forEach(o => {
      const el = document.createElement('div');
      el.className = 'obj' + (o.id === state.selectedId ? ' selected' : '');
      el.dataset.id = o.id;
      el.dataset.type = o.type;
      el.dataset.test = 'obj-' + o.type;
      applyObjStyle(el, o);
      const inner = document.createElement('div');
      inner.className = 'obj-inner';
      inner.innerHTML = objInnerHtml(o);
      el.appendChild(inner);
      objectsRoot.appendChild(el);
    });
    canvasHint.classList.toggle('hide', state.objects.length > 0);
    renderSelection();
    renderToolbar();
  }

  function getObjEl(id) {
    return objectsRoot.querySelector(`.obj[data-id="${id}"]`);
  }

  /* OBJECTS katmanının pointer olaylarını alması güvenilir değil: seçim
     çerçevesi/tutamaçlar ve tuvalin arka planı olayı yutabiliyordu.
     Tuvalin tamamında tek bir yakalayıcı dinleyici kullanılır. */
  function pointToObject(clientX, clientY) {
    return hitTest(clientX, clientY);
  }

  /* Ekranda görünen tuval alanının dikey ortası (tuval koordinatı).
     Yeni eklenen nesne buraya gelir; kullanıcı eklediği şeyi hemen görsün. */
  function visibleCenterY(needH) {
    const area = canvasArea.getBoundingClientRect();
    const r = canvas.getBoundingClientRect();
    const h = needH || 100;
    if (!r.height) return Math.round(state.height / 2);
    const oran = ((area.top + area.height / 2) - r.top) / r.height;
    const hedef = clamp(oran, 0.05, 0.95) * state.height;

    /* Çakışma denetimi: ekranda GÖRÜNEN aralıkta dolu olan bantlar
       (nesne dikdörtgenleri) çıkarılır; hedef doluysa en yakın boşluğa kayar. */
    const ust = ((area.top - r.top) / r.height) * state.height;
    const alt = ((area.bottom - r.top) / r.height) * state.height;
    const dolu = state.objects
      .filter(o => !o.hidden)
      .map(o => [o.y - 12, o.y + o.h + 12])
      .filter(b => b[1] > ust && b[0] < alt)
      .sort((a, b) => a[0] - b[0]);

    const cakisan = (y) => dolu.some(b => y + h > b[0] && y < b[1]);
    /* Metinlerde dış pay geniştir: çizgi/sınır nesnelere değmesin diye
       istenen yüksekliğin %40'ı kadar ek boşluk aranır. */
    const hGenis = needH ? Math.round(h * 1.4) : h;
    const cakisanGenis = (y) => dolu.some(b => y + hGenis > b[0] && y < b[1]);
    if (!cakisan(hedef) && !cakisanGenis(hedef)) return Math.round(hedef);

    /* En yakın boş aralığı ara */
    const adaylar = [Math.round(ust + h)];
    dolu.forEach((b, i) => {
      adaylar.push(Math.round(b[1] + h * 0.25));
      if (i > 0) adaylar.push(Math.round(b[0] - hGenis));
    });
    adaylar.sort((a, b) => Math.abs(a - hedef) - Math.abs(b - hedef));
    /* Yeni metin, mevcut metinlerin üstüne yığılmasın: adaylar arasında
       başka bir METİNLE çakışanlar elenir (şekil/zemin nesneleri serbest). */
    const metinBantlari = state.objects
      .filter(o => o.type === 'text' && !o.hidden)
      .map(o => [o.y - 8, o.y + o.h + 8]);
    const metinleCakisir = (y) => metinBantlari.some(b => y + hGenis > b[0] && y < b[1]);
    /* Seçilen aday HEM geniş bantta (çizgi dâhil) HEM metinlere göre boş olmalı */
    const bulunan = adaylar.find(y =>
      !cakisanGenis(y) && !metinleCakisir(y) && !cakisan(y) && y >= -h && y + h <= state.height);
    return bulunan != null ? bulunan : Math.round(hedef);
  }

  /* İşaretçi altındaki NESNE: en üstteki DOM öğesini elementFromPoint ile
     almak güvenilir değil (seçim çerçevesi, sahne ızgarası vb. araya girer).
     Bunun yerine tıklanan ekran noktası tuval koordinatına çevrilip
     nesnelerin dikdörtgenlerine göre en üstte olan seçilir. */
  function hitTest(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) / state.zoom;
    const y = (clientY - r.top) / state.zoom;
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const o = state.objects[i];
      if (o.hidden) continue;
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
    }
    return null;
  }

  /* Seçim çerçevesi — tuval koordinatında değil, ekran ölçeğine uygun çizilir */
  function renderSelection() {
    let box = canvas.querySelector('.sel-box');
    let rotline = canvas.querySelector('.sel-rotline');
    const o = selected();

    if (!o || o.hidden) {
      if (box) box.remove();
      if (rotline) rotline.remove();
      return;
    }
    /* Not: çerçeve öğeleri her zaman .canvas'a eklenir; transform'u çerçeve
       üzerinde uygulamak tutamaçların tıklanabilir alanını kaydırıyordu. */
    if (!box || box.parentElement !== canvas) {
      if (box) box.remove();
      box = document.createElement('div');
      box.className = 'sel-box';
      canvas.appendChild(box);
    }
    if (!rotline || rotline.parentElement !== canvas) {
      if (rotline) rotline.remove();
      rotline = document.createElement('div');
      rotline.className = 'sel-rotline';
      canvas.appendChild(rotline);
    }
    /* Ölçeklenmiş tuvalde tutamaklar ekranda sabit boyutta kalsın:
       ekran pikseli = tuval pikseli × zoom → tuvalde 9/zoom piksel. */
    const z = state.zoom || 1;
    const hs = 10 / z;             /* tutamak boyu (tuval pikseli) */
    const hb = 1.5 / z;            /* tutamak kenarlığı */
    const rotGap = 24 / z;         /* döndürme tutamacı uzaklığı */
    const pad = 1;

    /* Seçim çerçevesi: döndürülmemiş kutu. Döndürme varsa çerçeve
       .sel-rotline üzerinden değil, nesne merkezine göre konumlanır. */
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;

    box.style.left = (o.x - pad) + 'px';
    box.style.top = (o.y - pad) + 'px';
    box.style.width = (o.w + pad * 2) + 'px';
    box.style.height = (o.h + pad * 2) + 'px';
    box.style.transform = `rotate(${o.rotation}deg)`;
    box.style.transformOrigin = 'center center';
    box.style.borderWidth = hb + 'px';

    box.innerHTML = '';
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const positions = {
      nw: [0, 0], n: [50, 0], ne: [100, 0], e: [100, 50],
      se: [100, 100], s: [50, 100], sw: [0, 100], w: [0, 50]
    };
    handles.forEach(h => {
      const hd = document.createElement('div');
      hd.className = 'sel-handle';
      hd.dataset.h = h;
      hd.style.left = positions[h][0] + '%';
      hd.style.top = positions[h][1] + '%';
      hd.style.width = hs + 'px';
      hd.style.height = hs + 'px';
      hd.style.borderWidth = hb + 'px';
      hd.style.transform = 'translate(-50%, -50%)';
      box.appendChild(hd);
    });

    /* Döndürme tutamacı: üst-orta, çerçevenin dışında */
    const rot = document.createElement('div');
    rot.className = 'sel-handle';
    rot.dataset.h = 'rot';
    rot.style.left = '50%';
    rot.style.top = (-rotGap) + 'px';
    rot.style.width = hs + 'px';
    rot.style.height = hs + 'px';
    rot.style.borderWidth = hb + 'px';
    rot.style.transform = 'translate(-50%, -50%)';
    box.appendChild(rot);

    /* Bağlantı çizgisi (ekranda 1px) */
    rotline.style.left = (cx - hb / 2) + 'px';
    rotline.style.top = (cy - o.h / 2 - rotGap) + 'px';
    rotline.style.height = rotGap + 'px';
    rotline.style.width = hb + 'px';
    rotline.style.marginLeft = '0';
    rotline.style.transform = `rotate(${o.rotation}deg)`;
    rotline.style.transformOrigin = 'bottom center';
  }


  function renderToolbar() {
    const o = selected();
    objToolbar.hidden = !o;
    if (!o) return;

    /* Araç çubuğu tuvalin üstüne binmesin: ekran koordinatına göre konumlanır */
    requestAnimationFrame(() => {
      const canvasRect = canvas.getBoundingClientRect();
      const areaRect = canvasArea.getBoundingClientRect();
      const topEdge = canvasRect.top - areaRect.top;
      objToolbar.style.top = Math.max(6, Math.min(topEdge - 46, areaRect.height - 50)) + 'px';
    });
  }

  function renderLayers() {
    layerList.innerHTML = '';
    layerCount.textContent = state.objects.length + ' nesne';
    /* Katman paneli: en üstteki nesne listede en üstte */
    [...state.objects].reverse().forEach(o => {
      const li = document.createElement('li');
      li.className = 'layer' + (o.id === state.selectedId ? ' active' : '');
      li.dataset.id = o.id;
      const iconChar = o.type === 'text' ? 'T' : o.type === 'image' ? '▣' : o.type === 'svg' ? '◇' : '◻';
      li.innerHTML = `
        <span class="layer-ico">${iconChar}</span>
        <span class="layer-name">${esc(o.name)}</span>
        <button class="layer-btn${o.hidden ? ' on' : ''}" data-lay="vis" title="${o.hidden ? 'Göster' : 'Gizle'}">${o.hidden ? '◌' : '◉'}</button>
      `;
      layerList.appendChild(li);
    });
  }

  function renderProps() {
    const o = selected();
    propsEmpty.hidden = !!o;
    propsBody.hidden = !o;
    if (!o) return;

    $('#pX').value = Math.round(o.x);
    $('#pY').value = Math.round(o.y);
    $('#pW').value = Math.round(o.w);
    $('#pH').value = Math.round(o.h);
    $('#pRot').value = Math.round(o.rotation);
    $('#pRotOut').textContent = Math.round(o.rotation) + '°';
    $('#pOpacity').value = Math.round(o.opacity * 100);
    $('#pOpacityOut').textContent = Math.round(o.opacity * 100) + '%';
    const typeLabel = o.type === 'text' ? 'Metin' : o.type === 'image' ? 'Görsel' : o.type === 'svg' ? 'SVG' : 'Şekil';
    $('#propTypeLabel').textContent = typeLabel;

    const isText = o.type === 'text';
    $('#textBlock').hidden = !isText;
    if (isText) {
      $('#pText').value = o.text || '';
      $('#pFont').value = o.fontFamily || "'Space Grotesk', sans-serif";
      $('#pFontSize').value = o.fontSize || 64;
      $('#pLineHeight').value = o.lineHeight || 1.15;
      $('#pItalic').checked = !!o.italic;
      $('#pUnderline').checked = !!o.underline;
      $('#pUpper').checked = !!o.uppercase;
      $$('#segAlign button').forEach(b => b.classList.toggle('active', b.dataset.align === (o.align || 'left')));
      $$('#segWeight button').forEach(b => b.classList.toggle('active', Number(b.dataset.weight) === (o.fontWeight || 600)));
    }

    const isShape = o.type === 'shape';
    const isSvg = o.type === 'svg';
    const hasFill = o.type === 'text' || isShape || isSvg;

    $('#fillBlock').hidden = !hasFill;
    if (hasFill) {
      $('#pFill').value = o.fill && o.fill !== 'none' ? o.fill : '#ff4d5e';
      $('#pFillHex').value = (o.fill && o.fill !== 'none' ? o.fill : '#ff4d5e').toUpperCase();
    }
    $('#strokeRow').hidden = !(isShape || isSvg);
    if (isShape || isSvg) {
      $('#pStroke').value = o.stroke || '#ffffff';
      $('#pStrokeW').value = o.strokeWidth || 0;
    }
    $('#radiusRow').hidden = !(isShape && (o.shape === 'rect') || o.type === 'image');
    $('#pRadius').value = o.radius || 0;
    $('#replaceImgRow').hidden = o.type !== 'image';
  }

  function renderAll() {
    renderBg();
    renderObjects();
    renderLayers();
    renderProps();
    applyZoom();
  }

  /* ------------------------------------------------------------------
     NESNE İŞLEMLERİ
     ------------------------------------------------------------------ */
  function addObject(o, opts) {
    state.objects.push(o);
    state.selectedId = o.id;
    renderObjects();
    renderLayers();
    renderProps();
    pushHistory();
    if (!opts || opts.silent !== true) toast(o.name + ' eklendi');
  }

  function deleteSelected() {
    const o = selected();
    if (!o) return;
    state.objects = state.objects.filter(x => x.id !== o.id);
    state.selectedId = null;
    renderObjects();
    renderLayers();
    renderProps();
    pushHistory();
    toast('Nesne silindi');
  }

  function duplicateSelected() {
    const o = selected();
    if (!o) return;
    const copy = JSON.parse(JSON.stringify(o));
    copy.id = uid();
    copy.x += 24;
    copy.y += 24;
    copy.name = o.name + ' kopya';
    state.objects.push(copy);
    state.selectedId = copy.id;
    renderObjects();
    renderLayers();
    renderProps();
    pushHistory();
    toast('Nesne çoğaltıldı');
  }

  function moveLayer(id, dir) {
    const idx = state.objects.findIndex(o => o.id === id);
    if (idx < 0) return;
    const o = state.objects[idx];
    state.objects.splice(idx, 1);
    if (dir === 'front') state.objects.push(o);
    else if (dir === 'back') state.objects.unshift(o);
    else if (dir === 'forward') state.objects.splice(Math.min(idx + 1, state.objects.length), 0, o);
    else if (dir === 'backward') state.objects.splice(Math.max(idx - 1, 0), 0, o);
    renderObjects();
    renderLayers();
    pushHistory();
  }

  /* ------------------------------------------------------------------
     EKLEME ARAÇLARI
     ------------------------------------------------------------------ */
  function addText(isHeading) {
    /* Punto tuvalin KISA kenarına göre ölçeklenir: dikey afişte uzun kenarı
       esas almak başlığı kutuya sığdırmıyor, alttaki nesnelerin üstüne biniyordu. */
    const kisaKenar = Math.min(state.width, state.height);
    const size = Math.round(kisaKenar * (isHeading ? 0.072 : 0.034));
    const o = createObject('text', {
      text: isHeading ? 'BAŞLIK METNİ' : 'Gövde metni',
      x: Math.round(state.width * 0.1),
      /* Yeni nesne, ekranda GÖRÜNEN alanın ortasına gelir (sabit oran, uzun
         tuvalde yazıyı pencerenin altında bırakıyordu); yerleşirken yazının
         üst/alt dış boşluğu da hesaba katılır ki komşu nesneye binmesin. */
      /* Ölçüt = yazının kapladığı alan (punto × satır aralığı), kutu değil */
      y: visibleCenterY(Math.round(size * (isHeading ? 1.2 : 1.5))),
      w: Math.round(state.width * 0.8),
      h: Math.round(size * 1.6),
      fontSize: size,
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: isHeading ? 700 : 400,
      align: 'left',
      lineHeight: 1.15,
      /* Arka plan açıkken beyaz yazı görünmüyordu; renk zemine göre seçilir */
      fill: readableTextColor(),
      name: isHeading ? 'Başlık' : 'Metin'
    });
    /* Başlıkta satır aralığı sıkı olsun: tek satırda bile dikeyde dengeli dursun */
    o.lineHeight = isHeading ? 1.06 : 1.15;
    o.h = Math.round(size * (isHeading ? 1.25 : 1.6));
    fitTextObject(o);
    addObject(o);
  }

  function addShape(shape) {
    const size = Math.round(state.width * 0.22);
    const o = createObject('shape', {
      shape: shape,
      x: Math.round((state.width - size) / 2),
      /* Şekil de metinlerin üstüne binmesin: yerleşim çakışma denetiminden geçer */
      y: Math.round(visibleCenterY(size) - size / 2),
      w: shape === 'line' ? Math.round(state.width * 0.45) : size,
      h: shape === 'line' ? 12 : size,
      fill: '#ff4d5e',
      strokeWidth: 0,
      radius: shape === 'rect' ? 18 : 0
    });
    o.name = defaultName(o);
    addObject(o);
  }

  function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      const img = new Image();
      img.onload = () => {
        const maxW = state.width * 0.62;
        const maxH = state.height * 0.62;
        let w = img.naturalWidth, h = img.naturalHeight;
        const k = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * k); h = Math.round(h * k);
        const o = createObject('image', {
          src: src,
          x: Math.round((state.width - w) / 2),
          y: Math.round((state.height - h) / 2),
          w: w, h: h,
          name: 'Görsel'
        });
        addObject(o);
      };
      img.onerror = () => toast('Görsel okunamadı');
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function handleSvgFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      let content = e.target.result;
      /* viewBox ölçüsünü çıkar */
      let w = 300, h = 300;
      const vb = content.match(/viewBox\s*=\s*["']([^"']+)["']/i);
      if (vb) {
        const parts = vb[1].trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          w = parts[2]; h = parts[3];
        }
      }
      const maxW = state.width * 0.5;
      const k = Math.min(maxW / w, (state.height * 0.5) / h, 1);
      w = Math.round(w * k); h = Math.round(h * k);

      /* iç svg'yi dışarıdaki ölçülere göre ayarla */
      content = content.replace(/<svg([^>]*)>/i, (m, attrs) => {
        let a = attrs.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, '');
        return `<svg${a} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
      });

      const o = createObject('svg', {
        svgContent: content,
        w: w, h: h,
        x: Math.round((state.width - w) / 2),
        y: Math.round((state.height - h) / 2),
        fill: 'none',
        strokeWidth: 0,
        name: file.name || 'SVG'
      });
      addObject(o);
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------------
     SEÇİM / SÜRÜKLEME / BOYUTLANDIRMA / DÖNDÜRME
     ------------------------------------------------------------------ */
  let drag = null;

  function toCanvasPoint(evt) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - r.left) / state.zoom,
      y: (evt.clientY - r.top) / state.zoom
    };
  }

  function selectObj(id) {
    if (state.selectedId === id) return;
    state.selectedId = id;
    renderObjects();
    renderLayers();
    renderProps();
  }

  /* TEK GİRİŞ NOKTASI: tuval üzerindeki tüm basışlar burada işlenir.
     Öncelik sırası → tutamaç (boyutlandır/döndür) > nesne (seç + taşı) > boşluk. */
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    /* 1) Tutamaçlar — tutamaç, ölçeklenmiş tuvalde de rahat tutulsun diye
       çevresinde küçük bir toleransla yakalanır */
    const handle = e.target.closest ? e.target.closest('.sel-handle') : null;
    if (handle) {
      const sel = selected();
      if (!sel) return;
      const hpt = toCanvasPoint(e);
      drag = {
        mode: handle.dataset.h === 'rot' ? 'rotate' : 'resize',
        handle: handle.dataset.h,
        id: sel.id,
        startX: hpt.x,
        startY: hpt.y,
        rotation: sel.rotation,
        orig: { x: sel.x, y: sel.y, w: sel.w, h: sel.h, rotation: sel.rotation },
        pointerId: e.pointerId
      };
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* 2) Nesne — DOM'dan değil geometriden: örtüşen katman güvenilmez */
    const o = hitTest(e.clientX, e.clientY);
    if (o) {
      selectObj(o.id);
      const pt = toCanvasPoint(e);
      drag = {
        mode: 'move',
        id: o.id,
        startX: pt.x,
        startY: pt.y,
        origX: o.x,
        origY: o.y,
        moved: false,
        pointerId: e.pointerId
      };
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* 3) Boş alan → seçimi bırak */
    if (state.selectedId) {
      state.selectedId = null;
      renderObjects();
      renderLayers();
      renderProps();
    }
  });

  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const o = state.objects.find(x => x.id === drag.id);
    if (!o) return;
    const pt = toCanvasPoint(e);
    if (!isFinite(pt.x) || !isFinite(pt.y)) return;

    if (drag.mode === 'move') {
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      /* 4px'e kadar olan titreme sürükleme sayılmaz */
      if (Math.abs(dx) * state.zoom < 4 && Math.abs(dy) * state.zoom < 4 && !drag.moved) return;
      drag.moved = true;
      o.x = Math.round(drag.origX + dx);
      o.y = Math.round(drag.origY + dy);
      if (e.shiftKey) {
        /* Shift: eksen kilidi */
        if (Math.abs(dx) > Math.abs(dy)) o.y = drag.origY;
        else o.x = drag.origX;
      }
      const el = getObjEl(o.id);
      if (el) applyObjStyle(el, o);
      renderSelection();
    } else if (drag.mode === 'rotate') {
      const cx = drag.orig.x + drag.orig.w / 2;
      const cy = drag.orig.y + drag.orig.h / 2;
      let ang = Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI + 90;
      if (e.shiftKey) ang = Math.round(ang / 15) * 15;
      o.rotation = Math.round(ang);
      const el = getObjEl(o.id);
      if (el) applyObjStyle(el, o);
      renderSelection();
    } else if (drag.mode === 'resize') {
      const h = drag.handle;
      const rad = (drag.rotation * Math.PI) / 180;
      /* fare hareketini nesnenin yerel eksenine döndür */
      let dxWorld = pt.x - drag.startX;
      let dyWorld = pt.y - drag.startY;
      const dx = dxWorld * Math.cos(-rad) - dyWorld * Math.sin(-rad);
      const dy = dxWorld * Math.sin(-rad) + dyWorld * Math.cos(-rad);

      let bx = drag.orig.x, by = drag.orig.y, bw = drag.orig.w, bh = drag.orig.h;
      let nx = bx, ny = by, nw = bw, nh = bh;

      if (h.includes('e')) nw = clamp(bw + dx, 12, 8000);
      if (h.includes('s')) nh = clamp(bh + dy, 12, 8000);
      if (h.includes('w')) { nw = clamp(bw - dx, 12, 8000); nx = bx + (bw - nw); }
      if (h.includes('n')) { nh = clamp(bh - dy, 12, 8000); ny = by + (bh - nh); }

      if (e.shiftKey && (h === 'se' || h === 'ne' || h === 'sw' || h === 'nw')) {
        /* en-boy oranı korunur */
        const ratio = bw / bh;
        if (nw / nh > ratio) nw = nh * ratio; else nh = nw / ratio;
        if (h.includes('w')) nx = bx + (bw - nw);
        if (h.includes('n')) ny = by + (bh - nh);
      }

      /* döndürülmüş nesnede merkez kaymasını telafi et */
      const ocx = bx + bw / 2, ocy = by + bh / 2;
      const ncx = nx + nw / 2, ncy = ny + nh / 2;
      const ddx = ncx - ocx, ddy = ncy - ocy;
      const rx = ddx * Math.cos(rad) - ddy * Math.sin(rad);
      const ry = ddx * Math.sin(rad) + ddy * Math.cos(rad);
      nx = ocx + rx - nw / 2;
      ny = ocy + ry - nh / 2;

      o.x = Math.round(nx); o.y = Math.round(ny);
      o.w = Math.round(nw); o.h = Math.round(nh);

      if (o.type === 'text') {
        /* metin kutusu büyüdükçe yazı da ölçeklensin */
        const k = o.h / drag.orig.h;
        o.fontSize = Math.max(6, Math.round((o._origFontSize || o.fontSize) * k));
        if (!o._origFontSize) o._origFontSize = o.fontSize;
      }

      const el = getObjEl(o.id);
      if (el) {
        applyObjStyle(el, o);
        const inner = el.querySelector('.obj-inner');
        if (inner) inner.innerHTML = objInnerHtml(o);
      }
      renderSelection();
      syncPropsQuick();
    }
  });

  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved || drag.mode !== 'move';
    if (drag.mode === 'resize') {
      const o = state.objects.find(x => x.id === drag.id);
      if (o) { delete o._origFontSize; }
    }
    if (moved) pushHistory();
    drag = null;
  });

  function syncPropsQuick() {
    const o = selected();
    if (!o) return;
    $('#pX').value = Math.round(o.x);
    $('#pY').value = Math.round(o.y);
    $('#pW').value = Math.round(o.w);
    $('#pH').value = Math.round(o.h);
    if (o.type === 'text' && $('#pFontSize')) $('#pFontSize').value = o.fontSize;
  }

  /* ------------------------------------------------------------------
     DÜZENLEME YARDIMCISI
     ------------------------------------------------------------------ */
  function updateSelected(patch, opts) {
    const o = selected();
    if (!o) return;
    Object.assign(o, patch);
    patchObjectEl(o);
    renderSelection();
    renderLayers();
    if (!opts || !opts.noHistory) pushHistory();
  }

  /* ------------------------------------------------------------------
     KLAVYE
     ------------------------------------------------------------------ */
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    const editing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (editing) return;

    const mod = e.ctrlKey || e.metaKey;
    /* e.key bazı tarayıcı/düzenlerde Türkçe klavyede tanımsız kalabilir;
       kısayollar fiziksel tuş (e.code) üzerinden de eşleştirilir. */
    const code = e.code || '';
    const key = (e.key || '').toLowerCase();

    if (mod && (key === 'z' || code === 'KeyZ')) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (mod && (key === 'y' || code === 'KeyY')) { e.preventDefault(); redo(); return; }
    if (mod && (key === 'd' || code === 'KeyD')) { e.preventDefault(); duplicateSelected(); return; }
    if (mod && (key === 's' || code === 'KeyS')) { e.preventDefault(); saveProject(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selected()) { e.preventDefault(); deleteSelected(); }
      return;
    }
    if (e.key === 'Escape') {
      if (!tplModal.hidden) { tplModal.hidden = true; return; }
      if (state.selectedId) {
        state.selectedId = null;
        renderObjects(); renderLayers(); renderProps();
      }
      return;
    }
    /* Ok tuşlarıyla ince ayar */
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const o = selected();
      if (!o) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') o.y -= step;
      if (e.key === 'ArrowDown') o.y += step;
      if (e.key === 'ArrowLeft') o.x -= step;
      if (e.key === 'ArrowRight') o.x += step;
      const el = getObjEl(o.id);
      if (el) applyObjStyle(el, o);
      renderSelection();
      syncPropsQuick();
      clearTimeout(o._arrowTimer);
      o._arrowTimer = setTimeout(() => pushHistory(), 400);
    }
  });

  /* ------------------------------------------------------------------
     PANEL OLAYLARI — ARAÇLAR
     ------------------------------------------------------------------ */
  $$('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tool;
      if (t === 'text') addText(false);
      else if (t === 'heading') addText(true);
      else if (t === 'image') $('#imageInput').click();
      else if (t === 'svg') $('#svgInput').click();
    });
  });

  $$('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => addShape(btn.dataset.shape));
  });

  $('#imageInput').addEventListener('change', e => {
    handleImageFile(e.target.files[0]);
    e.target.value = '';
  });
  $('#svgInput').addEventListener('change', e => {
    handleSvgFile(e.target.files[0]);
    e.target.value = '';
  });

  /* ARKA PLAN */
  $('#bgColor').addEventListener('input', e => {
    state.bgColor = e.target.value;
    renderBg();
  });
  $('#bgColor').addEventListener('change', () => pushHistory());
  $('#bgColor2').addEventListener('input', e => {
    state.bgColor2 = e.target.value;
    renderBg();
  });
  $('#bgColor2').addEventListener('change', () => pushHistory());
  $('#bgStyle').addEventListener('change', e => {
    state.bgStyle = e.target.value;
    $('#bgColor2Wrap').hidden = state.bgStyle === 'solid';
    renderBg();
    pushHistory();
  });
  $$('#bgSwatches .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      state.bgColor = sw.dataset.color;
      $('#bgColor').value = sw.dataset.color;
      renderBg();
      pushHistory();
    });
  });

  /* NESNE ÖZELLİKLERİ */
  ['pX', 'pY', 'pW', 'pH'].forEach(id => {
    $('#' + id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      const key = id === 'pX' ? 'x' : id === 'pY' ? 'y' : id === 'pW' ? 'w' : 'h';
      updateSelected({ [key]: Math.max(key === 'w' || key === 'h' ? 12 : -5000, Math.round(v)) }, { noHistory: true });
    });
    $('#' + id).addEventListener('change', () => pushHistory());
  });

  $('#pRot').addEventListener('input', e => {
    $('#pRotOut').textContent = e.target.value + '°';
    updateSelected({ rotation: Number(e.target.value) }, { noHistory: true });
  });
  $('#pRot').addEventListener('change', () => pushHistory());

  $('#pOpacity').addEventListener('input', e => {
    $('#pOpacityOut').textContent = e.target.value + '%';
    updateSelected({ opacity: Number(e.target.value) / 100 }, { noHistory: true });
  });
  $('#pOpacity').addEventListener('change', () => pushHistory());

  /* Metin */
  $('#pText').addEventListener('input', e => {
    const o = selected();
    if (!o) return;
    updateSelected({ text: e.target.value, name: (e.target.value || 'Metin').slice(0, 22) || 'Metin' }, { noHistory: true });
  });
  $('#pText').addEventListener('change', () => pushHistory());
  $('#pFont').addEventListener('change', e => updateSelected({ fontFamily: e.target.value }));
  $('#pFontSize').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) updateSelected({ fontSize: v }, { noHistory: true });
  });
  $('#pFontSize').addEventListener('change', () => pushHistory());
  $('#pLineHeight').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) updateSelected({ lineHeight: v }, { noHistory: true });
  });
  $('#pLineHeight').addEventListener('change', () => pushHistory());

  $$('#segAlign button').forEach(b => b.addEventListener('click', () => {
    updateSelected({ align: b.dataset.align });
    $$('#segAlign button').forEach(x => x.classList.toggle('active', x === b));
  }));
  $$('#segWeight button').forEach(b => b.addEventListener('click', () => {
    updateSelected({ fontWeight: Number(b.dataset.weight) });
    $$('#segWeight button').forEach(x => x.classList.toggle('active', x === b));
  }));
  $('#pItalic').addEventListener('change', e => updateSelected({ italic: e.target.checked }));
  $('#pUnderline').addEventListener('change', e => updateSelected({ underline: e.target.checked }));
  $('#pUpper').addEventListener('change', e => updateSelected({ uppercase: e.target.checked }));

  /* Renk */
  $('#pFill').addEventListener('input', e => {
    updateSelected({ fill: e.target.value }, { noHistory: true });
    $('#pFillHex').value = e.target.value.toUpperCase();
  });
  $('#pFill').addEventListener('change', () => pushHistory());
  $('#pFillHex').addEventListener('change', e => {
    let v = e.target.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      updateSelected({ fill: v });
      $('#pFill').value = v.length === 4 ? '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v;
    } else {
      toast('Geçersiz renk kodu');
    }
  });
  $$('#fillSwatches .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      updateSelected({ fill: sw.dataset.color });
      $('#pFill').value = sw.dataset.color;
      $('#pFillHex').value = sw.dataset.color.toUpperCase();
    });
  });
  $('#pStroke').addEventListener('input', e => updateSelected({ stroke: e.target.value }, { noHistory: true }));
  $('#pStroke').addEventListener('change', () => pushHistory());
  $('#pStrokeW').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) updateSelected({ strokeWidth: Math.max(0, v) }, { noHistory: true });
  });
  $('#pStrokeW').addEventListener('change', () => pushHistory());
  $('#pRadius').addEventListener('input', e => updateSelected({ radius: Number(e.target.value) }, { noHistory: true }));
  $('#pRadius').addEventListener('change', () => pushHistory());

  $('#btnReplaceImg').addEventListener('click', () => {
    const o = selected();
    if (!o || o.type !== 'image') return;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => updateSelected({ src: ev.target.result });
      r.readAsDataURL(f);
    };
    inp.click();
  });

  /* KATMANLAR */
  layerList.addEventListener('click', e => {
    const li = e.target.closest('.layer');
    if (!li) return;
    const id = li.dataset.id;
    const visBtn = e.target.closest('[data-lay="vis"]');
    const o = state.objects.find(x => x.id === id);
    if (!o) return;
    if (visBtn) {
      o.hidden = !o.hidden;
      renderObjects();
      renderLayers();
      pushHistory();
      return;
    }
    selectObj(id);
  });

  /* NESNE ARAÇ ÇUBUĞU */
  objToolbar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    const o = selected();
    if (!o) return;
    if (act === 'delete') deleteSelected();
    else if (act === 'duplicate') duplicateSelected();
    else moveLayer(o.id, act);
  });

  /* SEKMELER */
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
      const isProps = tab.dataset.tab === 'props';
      $('#paneProps').hidden = !isProps;
      $('#paneLayers').hidden = isProps;
    });
  });

  /* YAKINLAŞTIRMA */
  function setZoom(z) {
    state.zoom = clamp(z, 0.05, 2.5);
    applyZoom();
  }
  $('#zoomIn').addEventListener('click', () => setZoom(state.zoom * 1.2));
  $('#zoomOut').addEventListener('click', () => setZoom(state.zoom / 1.2));
  $('#zoomRange').addEventListener('input', e => setZoom(Number(e.target.value) / 100));
  $('#zoomFit').addEventListener('click', fitZoom);

  viewport.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(state.zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  }, { passive: false });

  /* BOYUT SEÇİMİ */
  function populateSizes() {
    const sel = $('#sizeSelect');
    SIZES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label;
      sel.appendChild(opt);
    });
    sel.value = 'ig-post';
  }
  $('#sizeSelect').addEventListener('change', e => {
    const s = SIZES.find(x => x.id === e.target.value);
    if (!s) return;
    const oldW = state.width, oldH = state.height;
    state.width = s.w;
    state.height = s.h;
    /* Nesneleri oransal olarak yerinde tut */
    const kx = s.w / oldW, ky = s.h / oldH;
    const k = Math.min(kx, ky);
    state.objects.forEach(o => {
      o.x = Math.round(o.x * kx);
      o.y = Math.round(o.y * ky);
      o.w = Math.round(o.w * k);
      o.h = Math.round(o.h * k);
      if (o.type === 'text') o.fontSize = Math.max(6, Math.round(o.fontSize * k));
    });
    renderAll();
    fitZoom();
    pushHistory();
    toast('Tuval: ' + s.w + ' × ' + s.h);
  });

  /* ------------------------------------------------------------------
     ŞABLONLAR
     ------------------------------------------------------------------ */
  function T(opts) { return Object.assign({ type: 'text' }, opts); }
  function S(shape, opts) { return Object.assign({ type: 'shape', shape: shape }, opts); }

  const TEMPLATES = [
    {
      id: 'neon-baslik',
      name: 'Neon Başlık',
      size: 'ig-post',
      build: () => ({
        width: 1080, height: 1080, bgStyle: 'radial', bgColor: '#0b0a12', bgColor2: '#2b1248',
        objects: [
          S('circle', { x: 640, y: 120, w: 520, h: 520, fill: '#ff4d5e', opacity: 0.18 }),
          S('rect', { x: 90, y: 380, w: 900, h: 300, fill: '#0b0a12', stroke: '#ff4d5e', strokeWidth: 4, radius: 24, opacity: 0.5 }),
          T({ x: 110, y: 300, w: 860, h: 120, text: 'NUMEX STUDIO', fontSize: 78, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fill: '#ff4d5e', align: 'center', uppercase: true, letterSpacing: 6, name: 'Üst etiket' }),
          T({ x: 110, y: 430, w: 860, h: 170, text: 'Tasarımın\nYeni Evi', fontSize: 110, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fill: '#f2f0ea', align: 'center', lineHeight: 1.05, name: 'Ana başlık' }),
          T({ x: 110, y: 700, w: 860, h: 60, text: 'numexai.com.tr', fontSize: 34, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fill: '#9a978f', align: 'center', name: 'Alt bilgi' })
        ]
      })
    },
    {
      id: 'sade-afis',
      name: 'Sade Afiş',
      size: 'poster',
      build: () => ({
        width: 1080, height: 1620, bgStyle: 'solid', bgColor: '#f4efe6', bgColor2: '#f4efe6',
        objects: [
          S('rect', { x: 0, y: 0, w: 1080, h: 420, fill: '#101014', radius: 0 }),
          T({ x: 70, y: 70, w: 940, h: 100, text: 'ETKİNLİK  ·  2026', fontSize: 32, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fill: '#ff4d5e', uppercase: true, letterSpacing: 4, name: 'Etiket' }),
          T({ x: 70, y: 170, w: 940, h: 240, text: 'Gece Atölyesi', fontSize: 112, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fill: '#f4efe6', lineHeight: 0.95, name: 'Başlık' }),
          T({ x: 70, y: 520, w: 620, h: 300, text: 'Şehrin ritmini\ntasarımla yakala.\nKontenjan sınırlıdır.', fontSize: 44, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, fill: '#3a3833', lineHeight: 1.5, name: 'Açıklama' }),
          S('line', { x: 70, y: 880, w: 940, h: 12, fill: '#101014' }),
          T({ x: 70, y: 940, w: 940, h: 60, text: '14 Kasım 2026 · 20:00 · İstanbul', fontSize: 34, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fill: '#101014', name: 'Tarih' }),
          S('rect', { x: 70, y: 1080, w: 320, h: 88, fill: '#ff4d5e', radius: 44 }),
          T({ x: 70, y: 1100, w: 320, h: 50, text: 'Yer Ayırt', fontSize: 34, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fill: '#150408', align: 'center', name: 'Düğme' })
        ]
      })
    },
    {
      id: 'kartvizit',
      name: 'Kartvizit — Minimal',
      size: 'card',
      build: () => ({
        width: 1050, height: 600, bgStyle: 'solid', bgColor: '#15151c', bgColor2: '#15151c',
        objects: [
          S('rect', { x: 0, y: 0, w: 18, h: 600, fill: '#ff4d5e', radius: 0 }),
          T({ x: 80, y: 110, w: 700, h: 80, text: 'MEHMET YILMAZ', fontSize: 52, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fill: '#f2f0ea', uppercase: true, letterSpacing: 3, name: 'Ad' }),
          T({ x: 80, y: 200, w: 700, h: 50, text: 'Kurucu Ortak · Tasarım', fontSize: 30, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, fill: '#ff4d5e', name: 'Ünvan' }),
          S('line', { x: 80, y: 300, w: 260, h: 8, fill: '#3a3a48' }),
          T({ x: 80, y: 360, w: 480, h: 160, text: '+90 555 000 00 00\nmerhaba@ornek.com\nnumexai.com.tr', fontSize: 26, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fill: '#9a978f', lineHeight: 1.9, name: 'İletişim' }),
          S('circle', { x: 700, y: 180, w: 240, h: 240, fill: '#ff4d5e', opacity: 0.12 }),
          S('circle', { x: 740, y: 220, w: 160, h: 160, fill: '#ff4d5e', opacity: 0.3 })
        ]
      })
    },
    {
      id: 'youtube-kapak',
      name: 'YouTube Kapağı',
      size: 'yt',
      build: () => ({
        width: 1280, height: 720, bgStyle: 'linear', bgColor: '#101014', bgColor2: '#3b0f1c',
        objects: [
          S('rect', { x: 900, y: 0, w: 380, h: 720, fill: '#ff4d5e', radius: 0 }),
          S('circle', { x: 940, y: 250, w: 220, h: 220, fill: '#101014' }),
          S('triangle', { x: 1020, y: 310, w: 100, h: 100, fill: '#ff4d5e' }),
          T({ x: 80, y: 190, w: 800, h: 90, text: 'BU SEFER FARKLI', fontSize: 40, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fill: '#ff4d5e', uppercase: true, letterSpacing: 5, name: 'Üst etiket' }),
          T({ x: 80, y: 270, w: 810, h: 290, text: 'Tasarım Editörü\nSıfırdan', fontSize: 120, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fill: '#f2f0ea', lineHeight: 1.02, name: 'Başlık' }),
          T({ x: 80, y: 590, w: 700, h: 60, text: 'Numex AI · Bölüm 01', fontSize: 30, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, fill: '#9a978f', name: 'Alt bilgi' })
        ]
      })
    },
    {
      id: 'instagram-indirim',
      name: 'İndirim Duyurusu',
      size: 'ig-post',
      build: () => ({
        width: 1080, height: 1080, bgStyle: 'solid', bgColor: '#ff4d5e', bgColor2: '#ff4d5e',
        objects: [
          S('circle', { x: -160, y: 620, w: 620, h: 620, fill: '#101014', opacity: 0.9 }),
          T({ x: 90, y: 110, w: 900, h: 80, text: 'KASIM FIRSATI', fontSize: 44, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fill: '#150408', uppercase: true, letterSpacing: 8, align: 'center', name: 'Etiket' }),
          T({ x: 90, y: 250, w: 900, h: 320, text: '%40', fontSize: 340, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fill: '#101014', align: 'center', lineHeight: 1, name: 'Yüzde' }),
          T({ x: 90, y: 600, w: 900, h: 90, text: 'TÜM TASARIM PAKETLERİNDE', fontSize: 40, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fill: '#150408', align: 'center', letterSpacing: 2, name: 'Alt başlık' }),
          T({ x: 90, y: 880, w: 900, h: 60, text: 'numexai.com.tr · 30 Kasım’a kadar', fontSize: 32, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fill: '#f2f0ea', align: 'center', name: 'Alt bilgi' })
        ]
      })
    },
    {
      id: 'story-duyuru',
      name: 'Story Duyuru',
      size: 'ig-story',
      build: () => ({
        width: 1080, height: 1920, bgStyle: 'radial', bgColor: '#0a0a10', bgColor2: '#14331f',
        objects: [
          S('rect', { x: 100, y: 640, w: 880, h: 640, fill: 'none', stroke: '#2ec4a0', strokeWidth: 3, radius: 32 }),
          T({ x: 140, y: 730, w: 800, h: 100, text: 'YENİ SÜRÜM', fontSize: 40, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fill: '#2ec4a0', uppercase: true, letterSpacing: 8, align: 'center', name: 'Etiket' }),
          T({ x: 140, y: 850, w: 800, h: 260, text: 'Daha hızlı,\ndaha temiz', fontSize: 108, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fill: '#f2f0ea', align: 'center', lineHeight: 1.05, name: 'Başlık' }),
          T({ x: 140, y: 1140, w: 800, h: 80, text: 'Numex Studio X 3.0', fontSize: 34, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fill: '#9a978f', align: 'center', name: 'Alt bilgi' })
        ]
      })
    }
  ];

  function fillTemplateArea(el, tpl) {
    /* mini önizleme */
    el.style.background = tpl.bgStyle === 'solid'
      ? tpl.bgColor
      : tpl.bgStyle === 'linear'
        ? `linear-gradient(135deg, ${tpl.bgColor} 0%, ${tpl.bgColor2} 100%)`
        : `radial-gradient(circle at 50% 38%, ${tpl.bgColor2} 0%, ${tpl.bgColor} 72%)`;
    const kw = el.clientWidth || 178;
    const kh = el.clientHeight || 132;
    const ratio = tpl.width / tpl.height;
    /* Hem genişliğe hem yüksekliğe sığdır: dikey afiş önizlemesi kutu dışına taşmasın */
    const k = Math.min((kw * 0.74) / tpl.width, (kh * 0.78) / tpl.height);
    const fw = tpl.width * k;
    const fh = tpl.height * k;
    const frame = document.createElement('div');
    frame.className = 'tp-frame';
    frame.style.width = fw + 'px';
    frame.style.height = fh + 'px';
    frame.style.background = tpl.bgStyle === 'solid'
      ? tpl.bgColor
      : tpl.bgStyle === 'linear'
        ? `linear-gradient(135deg, ${tpl.bgColor} 0%, ${tpl.bgColor2} 100%)`
        : `radial-gradient(circle at 50% 38%, ${tpl.bgColor2} 0%, ${tpl.bgColor} 72%)`;

    const sc = fw / tpl.width;
    tpl.objects.forEach(o => {
      const d = document.createElement('div');
      d.style.position = 'absolute';
      d.style.left = (o.x * sc) + 'px';
      d.style.top = (o.y * sc) + 'px';
      d.style.width = (o.w * sc) + 'px';
      d.style.height = (o.h * sc) + 'px';
      d.style.opacity = o.opacity == null ? 1 : o.opacity;
      if (o.type === 'text') {
        const tx = String(o.text || '');
        d.style.color = o.fill;
        d.style.fontFamily = o.fontFamily;
        /* Önizlemede yazı okunacak kadar büyük; kutuya sığsın diye satır aralığı sıkı */
        d.style.fontSize = Math.round((o.fontSize || 40) * sc) + 'px';
        d.style.lineHeight = o.lineHeight || 1.15;
        d.style.fontWeight = o.fontWeight || 700;
        d.style.textAlign = o.align === 'center' ? 'center' : o.align === 'right' ? 'right' : 'left';
        d.style.letterSpacing = (o.letterSpacing || 0) * sc + 'px';
        d.style.whiteSpace = 'pre-wrap';
        d.style.overflow = 'visible';
        d.style.textTransform = o.uppercase ? 'uppercase' : 'none';
        d.style.fontStyle = o.italic ? 'italic' : 'normal';
        d.style.background = 'transparent';
        d.textContent = tx;
      } else {
        d.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="none">${shapeSvgPath(o)}</svg>`;
      }
      frame.appendChild(d);
    });
    el.appendChild(frame);
  }

  function openTemplates() {
    tplGrid.innerHTML = '';
    const tbody = $('#tplModal');
    tbody.hidden = false;
    TEMPLATES.forEach(t => {
      const data = t.build();
      const btn = document.createElement('button');
      btn.className = 'tpl-card';
      btn.dataset.id = t.id;
      btn.innerHTML = `
        <div class="tpl-preview"></div>
        <div class="tpl-meta">
          <div class="tpl-name">${esc(t.name)}</div>
          <div class="tpl-size">${data.width} × ${data.height}</div>
        </div>`;
      tplGrid.appendChild(btn);
      requestAnimationFrame(() => {
        const prev = btn.querySelector('.tpl-preview');
        fillTemplateArea(prev, Object.assign({}, data, { name: t.name }));
      });
    });
  }

  tplGrid.addEventListener('click', e => {
    const card = e.target.closest('.tpl-card');
    if (!card) return;
    const t = TEMPLATES.find(x => x.id === card.dataset.id);
    if (!t) return;
    const data = t.build();
    state.width = data.width;
    state.height = data.height;
    state.bgStyle = data.bgStyle;
    state.bgColor = data.bgColor;
    state.bgColor2 = data.bgColor2;
    state.objects = data.objects.map(o => createObject(o.type, o));
    state.objects.forEach(o => fitTextObject(o));
    state.selectedId = null;
    docName = t.name;
    $('#docName').textContent = docName;
    /* boyut seçimini eşleştir */
    const sz = SIZES.find(s => s.w === data.width && s.h === data.height);
    if (sz) $('#sizeSelect').value = sz.id;
    $('#bgColor').value = data.bgColor;
    $('#bgColor2').value = data.bgColor2;
    $('#bgStyle').value = data.bgStyle;
    $('#bgColor2Wrap').hidden = data.bgStyle === 'solid';
    tplModal.hidden = true;
    renderAll();
    fitZoom();
    pushHistory();
    toast('Şablon açıldı: ' + t.name);
  });

  $('#btnTemplates').addEventListener('click', openTemplates);
  $('#tplClose').addEventListener('click', () => { tplModal.hidden = true; });
  tplModal.addEventListener('click', e => { if (e.target === tplModal) tplModal.hidden = true; });

  /* ------------------------------------------------------------------
     DIŞA AKTARMA
     ------------------------------------------------------------------ */
  function buildSvgString() {
    const W = state.width, H = state.height;
    let defs = '';
    let bgRect = '';
    if (state.bgStyle === 'linear') {
      defs += `<linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${state.bgColor}"/>
        <stop offset="100%" stop-color="${state.bgColor2}"/></linearGradient>`;
      bgRect = `<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>`;
    } else if (state.bgStyle === 'radial') {
      defs += `<radialGradient id="bgGrad" cx="50%" cy="38%" r="72%">
        <stop offset="0%" stop-color="${state.bgColor2}"/>
        <stop offset="100%" stop-color="${state.bgColor}"/></radialGradient>`;
      bgRect = `<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>`;
    } else {
      bgRect = `<rect width="${W}" height="${H}" fill="${state.bgColor}"/>`;
    }

    const body = state.objects.filter(o => !o.hidden).map(o => {
      const tf = `translate(${o.x} ${o.y}) rotate(${o.rotation} ${o.w / 2} ${o.h / 2})`;
      const op = o.opacity != null && o.opacity < 1 ? ` opacity="${o.opacity}"` : '';
      if (o.type === 'text') {
        const text = o.uppercase ? String(o.text || '').toUpperCase() : (o.text || '');
        const lines = text.split('\n');
        const lh = (o.fontSize || 64) * (o.lineHeight || 1.15);
        const totalH = lh * lines.length;
        const startY = (o.h - totalH) / 2 + lh * 0.8;
        const anchor = o.align === 'center' ? 'middle' : o.align === 'right' ? 'end' : 'start';
        const tx = o.align === 'center' ? o.w / 2 : o.align === 'right' ? o.w - 2 : 2;
        const spans = lines.map((ln, i) =>
          `<tspan x="${tx}" y="${(startY + i * lh).toFixed(1)}">${esc(ln || ' ')}</tspan>`
        ).join('');
        return `<g transform="${tf}"${op}>
          <text font-family="${esc(o.fontFamily)}" font-size="${o.fontSize || 64}" font-weight="${o.fontWeight || 700}"
            font-style="${o.italic ? 'italic' : 'normal'}"
            text-decoration="${o.underline ? 'underline' : 'none'}"
            fill="${esc(o.fill)}" text-anchor="${anchor}"
            letter-spacing="${o.letterSpacing || 0}">${spans}</text>
        </g>`;
      }
      if (o.type === 'image') {
        const clip = o.radius ? ` clip-path="inset(0 round ${o.radius}px)"` : '';
        return `<g transform="${tf}"${op}><image href="${esc(o.src)}" width="${o.w}" height="${o.h}" preserveAspectRatio="none"${clip}/></g>`;
      }
      if (o.type === 'svg') {
        return `<g transform="${tf}"${op}>${o.svgContent || ''}</g>`;
      }
      return `<g transform="${tf}"${op}>${shapeSvgPath(o)}</g>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}</defs>
  ${bgRect}
  ${body}
</svg>`;
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function safeName() {
    return (docName || 'tasarim').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'tasarim';
  }

  function svgToDataUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function exportPng(cb) {
    const scale = 2;
    const W = state.width, H = state.height;
    const svg = buildSvgString();
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = W * scale;
      cv.height = H * scale;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob(blob => {
        if (!blob) { toast('PNG oluşturulamadı'); return; }
        download(blob, safeName() + '.png');
        if (cb) cb(cv.toDataURL('image/png'));
        toast('PNG indirildi (' + cv.width + ' × ' + cv.height + ')');
      }, 'image/png');
    };
    img.onerror = () => toast('PNG dönüşümü başarısız — görsel kaynağı CORS engelliyor olabilir');
    img.src = svgToDataUrl(svg);
  }

  function exportSvg() {
    const blob = new Blob([buildSvgString()], { type: 'image/svg+xml;charset=utf-8' });
    download(blob, safeName() + '.svg');
    toast('SVG indirildi');
  }

  function exportPdf() {
    const W = state.width, H = state.height;
    const svg = buildSvgString();
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = W * 2;
      cv.height = H * 2;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const dataUrl = cv.toDataURL('image/jpeg', 0.94);
      const bin = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const pdf = buildPdf(bytes, cv.width, cv.height);
      download(new Blob([pdf], { type: 'application/pdf' }), safeName() + '.pdf');
      toast('PDF indirildi');
    };
    img.onerror = () => toast('PDF dönüşümü başarısız');
    img.src = svgToDataUrl(svg);
  }

  /* Minimal PDF yazıcı (tek sayfa, JPEG içerik) */
  function buildPdf(jpegBytes, imgW, imgH) {
    const enc = new TextEncoder();
    const parts = [];
    let length = 0;
    const push = (data) => {
      const arr = typeof data === 'string' ? enc.encode(data) : data;
      parts.push(arr);
      length += arr.length;
      return arr.length;
    };
    const offsets = [];

    push('%PDF-1.4\n');

    /* 1: Catalog */
    offsets[1] = length;
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    /* 2: Pages */
    offsets[2] = length;
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    /* 3: Page */
    const pageW = imgW * 0.5;   /* 96dpi → 1px = 0.75pt, yaklaşık */
    const pageH = imgH * 0.5;
    offsets[3] = length;
    push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

    /* 4: Image XObject */
    offsets[4] = length;
    push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    push(jpegBytes);
    push('\nendstream\nendobj\n');

    /* 5: Content stream */
    const content = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[5] = length;
    push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

    /* xref */
    const xrefStart = length;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) {
      xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    push(xref);
    push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

    /* birleştir */
    const out = new Uint8Array(length);
    let pos = 0;
    parts.forEach(p => { out.set(p, pos); pos += p.length; });
    return out;
  }

  $('#btnExport').addEventListener('click', e => {
    e.stopPropagation();
    exportMenu.hidden = !exportMenu.hidden;
  });
  document.addEventListener('click', e => {
    if (!exportMenu.hidden && !e.target.closest('.export-wrap')) exportMenu.hidden = true;
  });
  exportMenu.addEventListener('click', e => {
    const b = e.target.closest('[data-export]');
    if (!b) return;
    exportMenu.hidden = true;
    const t = b.dataset.export;
    if (t === 'png') exportPng();
    else if (t === 'svg') exportSvg();
    else if (t === 'pdf') exportPdf();
    else if (t === 'json') saveProjectFile();
  });

  /* ------------------------------------------------------------------
     PROJE KAYDET / AÇ
     ------------------------------------------------------------------ */
  const STORE_KEY = 'numex-studio-x-project';

  function projectJson() {
    return JSON.stringify({
      app: 'Numex Studio X',
      version: 1,
      name: docName,
      width: state.width,
      height: state.height,
      bgStyle: state.bgStyle,
      bgColor: state.bgColor,
      bgColor2: state.bgColor2,
      objects: state.objects,
      savedAt: new Date().toISOString()
    }, null, 2);
  }

  function loadProject(data) {
    if (!data || !Array.isArray(data.objects)) { toast('Geçersiz proje dosyası'); return false; }
    state.width = data.width || 1080;
    state.height = data.height || 1080;
    state.bgStyle = data.bgStyle || 'solid';
    state.bgColor = data.bgColor || '#101014';
    state.bgColor2 = data.bgColor2 || '#2b1f4d';
    state.objects = data.objects.map(o => {
      const c = createObject(o.type, o);
      c.id = o.id || c.id;
      fitTextObject(c);
      return c;
    });
    /* id çakışması olmasın */
    const seen = new Set();
    state.objects.forEach(o => {
      if (seen.has(o.id)) o.id = uid();
      seen.add(o.id);
      const m = /^o(\d+)_/.exec(o.id);
      if (m) uidCounter = Math.max(uidCounter, Number(m[1]) + 1);
    });
    state.selectedId = null;
    docName = data.name || 'Adsız Tasarım';
    $('#docName').textContent = docName;
    $('#bgColor').value = state.bgColor;
    $('#bgColor2').value = state.bgColor2;
    $('#bgStyle').value = state.bgStyle;
    $('#bgColor2Wrap').hidden = state.bgStyle === 'solid';
    const sz = SIZES.find(s => s.w === state.width && s.h === state.height);
    if (sz) $('#sizeSelect').value = sz.id;
    renderAll();
    fitZoom();
    return true;
  }

  function saveProject() {
    try {
      localStorage.setItem(STORE_KEY, projectJson());
      toast('Proje kaydedildi: ' + docName);
    } catch (err) {
      toast('Kaydedilemedi — depolama dolu olabilir');
    }
  }

  function saveProjectFile() {
    download(new Blob([projectJson()], { type: 'application/json' }), safeName() + '.numex.json');
    toast('Proje dosyası indirildi');
  }

  function openProjectDialog() {
    /* Kayıtlı projeler listesi bunun yerine basit: localStorage'daki son proje + dosya aç */
    let saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (err) { saved = null; }

    if (!saved) {
      $('#projectInput').click();
      return;
    }
    /* İki seçenekli basit dialog */
    const wantLocal = window.confirm('Kayıtlı son proje bulundu: "' + (() => {
      try { return JSON.parse(saved).name || 'Adsız'; } catch (err) { return 'Adsız'; }
    })() + '"\n\nTamam: kayıtlı projeyi aç\nİptal: bilgisayardan .json dosyası seç');
    if (wantLocal) {
      try {
        const data = JSON.parse(saved);
        if (loadProject(data)) {
          pushHistory();
          toast('Proje açıldı: ' + (data.name || 'Adsız'));
        }
      } catch (err) {
        toast('Kayıt okunamadı');
      }
    } else {
      $('#projectInput').click();
    }
  }

  $('#btnSave').addEventListener('click', saveProject);
  $('#btnOpen').addEventListener('click', openProjectDialog);
  $('#projectInput').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (loadProject(data)) { pushHistory(); toast('Proje açıldı'); }
      } catch (err) {
        toast('Dosya okunamadı');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  });

  /* Otomatik yüklenen yerel proje (varsa) */
  function bootLoadLocal() {
    let saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (err) { saved = null; }
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (loadProject(data)) return;
      } catch (err) { /* yok say */ }
    }
    /* boş tuval */
    renderAll();
    fitZoom();
    pushHistory();
  }

  /* ------------------------------------------------------------------
     BAŞLAT
     ------------------------------------------------------------------ */
  populateSizes();
  window.addEventListener('resize', () => {
    applyZoom();
  });
  window.addEventListener('beforeunload', e => {
    /* sessiz otomatik yedek */
    try { localStorage.setItem(STORE_KEY, projectJson()); } catch (err) { /* yok say */ }
    void e;
  });

  /* Test erişimi için dışa aç */
  window.NumexStudio = {
    state, addText, addShape, saveProject, openProjectDialog,
    exportPng, exportSvg, exportPdf, loadProject, undo, redo,
    deleteSelected, duplicateSelected, selectObj, projectJson,
    pushHistory, fitZoom, openTemplates, renderAll,
    /* kabul testi: tuval üzerinde gerçek ekran koordinatına çeviri */
    screenPos: (o) => {
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (o.x + o.w / 2) * state.zoom, y: r.top + (o.y + o.h / 2) * state.zoom };
    },
    /* Test kancası: fare aracı tuvalde sabit bir noktaya basıyor. Bu yardımcı,
       seçilen nesneyi o noktaya taşır ki gerçek fareyle sürükleme ölçülebilsin. */
    moveUnderPointer: (o, cx, cy) => {
      const r = canvas.getBoundingClientRect();
      o.x = Math.round((cx - r.left) / state.zoom - o.w / 2);
      o.y = Math.round((cy - r.top) / state.zoom - o.h / 2);
      patchObjectEl(o);
      renderSelection();
      return [o.x, o.y];
    },
    /* Kamu API'si: bir nesneyi ekran noktasının altına taşır (sürükleme
       testinde fare tuvalde sabit bir noktaya bastığı için gerekir) */
    placeUnder: (id, cx, cy) => {
      const o = state.objects.find(x => x.id === id);
      if (!o) return null;
      return window.NumexStudio.moveUnderPointer(o, cx, cy);
    }
  };

  bootLoadLocal();
  setTimeout(fitZoom, 120);
})();
