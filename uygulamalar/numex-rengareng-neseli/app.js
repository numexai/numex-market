'use strict';
/* Numex Paper World — editör motoru
   Durum (state) tek kaynaktır: nesneler burada tutulur, DOM ondan üretilir,
   dışa aktarma (JSON / PNG / SVG) aynı veriden beslenir. */

var DUNYA = { w: 1600, h: 1000 };
var DEPO = 'numex-paper-world-v1';

var state = {
  ad: 'Bahar Bahçesi',
  atmosfer: 'bahar',
  arkaplan: { gok1: '#c9e9ff', gok2: '#f2fbff', zemin: '#a9e2a0' },
  nesneler: []
};

var view = { x: 0, y: 0, k: 0.6 };
var seciliId = null;
var gecmis = [];
var gelecek = [];
var surukle = null;
var panelle = null;
var otomatikZaman = null;
var sliderKilit = {};

/* ---------------- kısayollar ---------------- */
function $(s) { return document.querySelector(s); }
function el(s) { return document.getElementById(s); }
function yeniId() { return 'n' + Math.random().toString(36).slice(2, 8); }
function kirp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function bildir(mesaj) {
  var b = el('bildirim');
  b.textContent = mesaj;
  b.classList.add('goster');
  clearTimeout(bildir._t);
  bildir._t = setTimeout(function () { b.classList.remove('goster'); }, 1900);
}

/* ---------------- geçmiş ---------------- */
function anlik() {
  return JSON.stringify({ ad: state.ad, atmosfer: state.atmosfer, arkaplan: state.arkaplan, nesneler: state.nesneler });
}
function itme() {
  gecmis.push(anlik());
  if (gecmis.length > 80) gecmis.shift();
  gelecek.length = 0;
  dugmeDurumu();
}
function geriAl() {
  if (!gecmis.length) { bildir('Geri alınacak adım kalmadı'); return; }
  gelecek.push(anlik());
  uygula(JSON.parse(gecmis.pop()));
  dugmeDurumu();
}
function yinele() {
  if (!gelecek.length) { bildir('Yinelenecek adım kalmadı'); return; }
  gecmis.push(anlik());
  uygula(JSON.parse(gelecek.pop()));
  dugmeDurumu();
}
function uygula(veri) {
  state.ad = veri.ad || 'Proje';
  state.atmosfer = veri.atmosfer || '';
  state.arkaplan = veri.arkaplan || state.arkaplan;
  state.nesneler = Array.isArray(veri.nesneler) ? veri.nesneler : [];
  if (seciliId && !state.nesneler.some(function (n) { return n.id === seciliId; })) seciliId = null;
  arkaplanUygula();
  sahnayiCiz();
  panelGuncelle();
  otomatikKaydet();
}
function dugmeDurumu() {
  el('btn-geri').disabled = gecmis.length === 0;
  el('btn-yinele').disabled = gelecek.length === 0;
}

/* ---------------- arka plan ---------------- */
function arkaplanUygula() {
  var d = el('dunya');
  d.style.setProperty('--gok1', state.arkaplan.gok1);
  d.style.setProperty('--gok2', state.arkaplan.gok2);
  d.style.setProperty('--zemin-renk', state.arkaplan.zemin);
  var sahneKutu = el('sahne-alani');
  if (sahneKutu) sahneKutu.style.background = 'linear-gradient(180deg,' + state.arkaplan.gok1 + ' 0%,' + state.arkaplan.gok2 + ' 78%)';
  el('gok1').value = state.arkaplan.gok1;
  el('gok2').value = state.arkaplan.gok2;
  el('zemin-renk').value = state.arkaplan.zemin;
  dekorCiz();
}

function dekorCiz() {
  var kutu = el('dekor');
  var z = tonlar(state.arkaplan.zemin);
  var g = tonlar(state.arkaplan.gok2);
  kutu.innerHTML =
    '<svg class="dekor-katman" data-derinlik="14" viewBox="0 0 1600 1000" preserveAspectRatio="none">' +
    '<path d="M0 700C180 620 340 660 520 620 720 576 880 640 1080 600 1260 564 1440 620 1600 590V1000H0Z" fill="' + g.c + '" opacity=".55"/>' +
    '</svg>' +
    '<svg class="dekor-katman" data-derinlik="26" viewBox="0 0 1600 1000" preserveAspectRatio="none">' +
    '<path d="M0 790C220 700 420 760 640 706 860 652 1080 740 1300 690 1420 662 1540 690 1600 676V1000H0Z" fill="' + z.c + '" opacity=".6"/>' +
    '</svg>';
}

function paralaks(x, y) {
  var katmanlar = document.querySelectorAll('.dekor-katman');
  for (var i = 0; i < katmanlar.length; i++) {
    var d = parseFloat(katmanlar[i].dataset.derinlik || 10);
    katmanlar[i].style.transform = 'translate(' + (-x * d).toFixed(1) + 'px,' + (-y * d * 0.55).toFixed(1) + 'px)';
  }
}

/* ---------------- sahne ---------------- */
function nesneElemani(n) {
  var tip = KAGITLAR[n.tip];
  if (!tip) return null;
  var c = tonlar(n.renk);
  var b = tipBoyut(tip);
  var div = document.createElement('div');
  div.className = 'obj' + (n.id === seciliId ? ' secili' : '');
  div.dataset.id = n.id;
  div.dataset.tip = n.tip;
  div.style.width = b[0] + 'px';
  div.style.height = b[1] + 'px';
  var gecikme = -((parseInt(n.id.slice(2, 4), 36) % 70) / 10);
  div.innerHTML =
    '<div class="obj-ic anim-' + (tip.anim || 'yok') + '" style="animation-delay:' + gecikme + 's">' + tamSvg(tip, c) + '</div>' +
    '<div class="secim"><span class="tut tut-dondur" data-tut="dondur"></span><span class="tut tut-olcek" data-tut="olcek"></span></div>';
  div.style.zIndex = String(10 + state.nesneler.indexOf(n));
  div.style.transform = transformMetni(n);
  return div;
}

function transformMetni(n) {
  return 'translate(' + n.x + 'px,' + n.y + 'px) rotate(' + n.rot + 'deg) scale(' +
    (n.ayna ? -n.s : n.s) + ',' + n.s + ') translate(-50%,-50%)';
}

function sahnayiCiz() {
  var kat = el('kat-nesneler');
  kat.innerHTML = '';
  for (var i = 0; i < state.nesneler.length; i++) {
    var e = nesneElemani(state.nesneler[i]);
    if (e) kat.appendChild(e);
  }
  el('durum-nesne').textContent = state.nesneler.length + ' nesne';
}

function elemaniTazele(n) {
  var e = el('kat-nesneler').querySelector('[data-id="' + n.id + '"]');
  if (!e) return;
  var tip = KAGITLAR[n.tip];
  var b = tipBoyut(tip);
  e.style.width = b[0] + 'px';
  e.style.height = b[1] + 'px';
  e.style.zIndex = String(10 + state.nesneler.indexOf(n));
  e.style.transform = transformMetni(n);
  e.classList.toggle('secili', n.id === seciliId);
}

function renkTazele(n) {
  var e = el('kat-nesneler').querySelector('[data-id="' + n.id + '"]');
  if (!e) return;
  var ic = e.querySelector('.obj-ic');
  if (ic) ic.innerHTML = tamSvg(KAGITLAR[n.tip], tonlar(n.renk));
}

/* ---------------- ekleme / seçim ---------------- */
function nesneEkle(tip, x, y) {
  if (!KAGITLAR[tip]) return null;
  var merkez = ekranMerkezi();
  itme();
  var n = {
    id: yeniId(),
    tip: tip,
    x: (x === undefined ? merkez.x : x),
    y: (y === undefined ? merkez.y : y),
    rot: 0,
    s: 1,
    renk: KAGITLAR[tip].renk,
    ayna: false
  };
  n.s = 1;
  state.nesneler.push(n);
  seciliId = n.id;
  sahnayiCiz();
  panelGuncelle();
  otomatikKaydet();
  bildir(KAGITLAR[tip].ad + ' eklendi');
  return n;
}

function sec(id) {
  seciliId = id;
  var hepsi = document.querySelectorAll('.obj');
  for (var i = 0; i < hepsi.length; i++) hepsi[i].classList.toggle('secili', hepsi[i].dataset.id === id);
  panelGuncelle();
}

function seciliNesne() {
  for (var i = 0; i < state.nesneler.length; i++) if (state.nesneler[i].id === seciliId) return state.nesneler[i];
  return null;
}

function duzenle(fn) {
  var n = seciliNesne();
  if (!n) return;
  itme();
  fn(n);
  elemaniTazele(n);
  panelGuncelle();
  otomatikKaydet();
}

function cogalt() {
  var n = seciliNesne();
  if (!n) return;
  itme();
  var yeni = JSON.parse(JSON.stringify(n));
  yeni.id = yeniId();
  yeni.x += 34;
  yeni.y += 26;
  state.nesneler.push(yeni);
  seciliId = yeni.id;
  sahnayiCiz();
  panelGuncelle();
  otomatikKaydet();
  bildir('Nesne çoğaltıldı');
}

function silNesne() {
  var n = seciliNesne();
  if (!n) return;
  itme();
  var ad = KAGITLAR[n.tip] ? KAGITLAR[n.tip].ad : 'Nesne';
  state.nesneler = state.nesneler.filter(function (k) { return k.id !== n.id; });
  seciliId = null;
  sahnayiCiz();
  panelGuncelle();
  otomatikKaydet();
  bildir(ad + ' silindi');
}

function katman(dogru) {
  var n = seciliNesne();
  if (!n) return;
  itme();
  var i = state.nesneler.indexOf(n);
  state.nesneler.splice(i, 1);
  if (dogru === 'one') state.nesneler.splice(Math.min(i + 1, state.nesneler.length), 0, n);
  else if (dogru === 'arkaya') state.nesneler.splice(Math.max(i - 1, 0), 0, n);
  else if (dogru === 'ust') state.nesneler.push(n);
  else state.nesneler.unshift(n);
  sahnayiCiz();
  otomatikKaydet();
  bildir(dogru === 'one' ? 'Bir katman öne alındı' : dogru === 'arkaya' ? 'Bir katman arkaya gönderildi' : 'En üste alındı');
}

/* ---------------- koordinatlar ---------------- */
function ekranMerkezi() {
  var s = el('sahne-alani').getBoundingClientRect();
  return ekranToDunya(s.left + s.width / 2, s.top + s.height / 2);
}
function ekranToDunya(cx, cy) {
  var s = el('sahne-alani').getBoundingClientRect();
  return { x: (cx - s.left - view.x) / view.k, y: (cy - s.top - view.y) / view.k };
}

/* ---------------- görünüm ---------------- */
function gorunumUygula() {
  el('dunya').style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')';
  el('zoom-yuzde').textContent = Math.round(view.k * 100) + '%';
}
function sigdir() {
  var s = el('sahne-alani').getBoundingClientRect();
  // dar ekranda sahneyi kapla (cover): boş gökyüzü yerine dolu bir dünya görünsün
  var k = window.innerWidth <= 900
    ? Math.max(s.width / DUNYA.w, s.height / DUNYA.h) * 1.04
    : Math.min(s.width / DUNYA.w, s.height / DUNYA.h) * 0.96;
  view.k = kirp(k, 0.15, 3);
  view.x = (s.width - DUNYA.w * view.k) / 2;
  view.y = (s.height - DUNYA.h * view.k) / 2;
  gorunumUygula();
}
function zoomYap(faktor, px, py) {
  var s = el('sahne-alani').getBoundingClientRect();
  var cx = px === undefined ? s.width / 2 : px - s.left;
  var cy = py === undefined ? s.height / 2 : py - s.top;
  var once = view.k;
  view.k = kirp(view.k * faktor, 0.15, 3.5);
  var oran = view.k / once;
  view.x = cx - (cx - view.x) * oran;
  view.y = cy - (cy - view.y) * oran;
  gorunumUygula();
}

/* ---------------- sürükleme ---------------- */
function suruklemeBaslat(e) {
  var tut = e.target.closest('[data-tut]');
  var hedef = e.target.closest('.obj');

  if (tut && hedef) {
    e.preventDefault();
    e.stopPropagation();
    var n = state.nesneler.filter(function (k) { return k.id === hedef.dataset.id; })[0];
    if (!n) return;
    var kutu = hedef.getBoundingClientRect();
    var mx = kutu.left + kutu.width / 2;
    var my = kutu.top + kutu.height / 2;
    itme();
    surukle = {
      tur: tut.dataset.tut,
      id: n.id,
      mx: mx, my: my,
      basAci: Math.atan2(e.clientY - my, e.clientX - mx) * 180 / Math.PI,
      basRot: n.rot,
      basUzaklik: Math.max(12, Math.hypot(e.clientX - mx, e.clientY - my)),
      basScale: n.s,
      el: hedef
    };
    return;
  }

  if (hedef) {
    e.preventDefault();
    var m = state.nesneler.filter(function (k) { return k.id === hedef.dataset.id; })[0];
    if (!m) return;
    sec(m.id);
    itme();
    surukle = { tur: 'tasi', id: m.id, sx: e.clientX, sy: e.clientY, bx: m.x, by: m.y, el: hedef, tasindi: false };
    return;
  }

  // boş alan → sahne kaydırma
  panelle = { sx: e.clientX, sy: e.clientY, bx: view.x, by: view.y };
  el('sahne-alani').classList.add('surukleniyor');
}

function suruklemeHareket(e) {
  if (surukle) {
    var n = state.nesneler.filter(function (k) { return k.id === surukle.id; })[0];
    if (!n) return;
    if (surukle.tur === 'tasi') {
      var dx = (e.clientX - surukle.sx) / view.k;
      var dy = (e.clientY - surukle.sy) / view.k;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) surukle.tasindi = true;
      n.x = Math.round(surukle.bx + dx);
      n.y = Math.round(surukle.by + dy);
      el('secili-konum').textContent = n.x + ', ' + n.y;
    } else if (surukle.tur === 'dondur') {
      var a = Math.atan2(e.clientY - surukle.my, e.clientX - surukle.mx) * 180 / Math.PI;
      n.rot = Math.round(surukle.basRot + (a - surukle.basAci));
      if (e.shiftKey) n.rot = Math.round(n.rot / 15) * 15;
      el('nesne-aci').value = kirp(n.rot, -180, 180);
      el('deger-aci').textContent = n.rot + '°';
    } else if (surukle.tur === 'olcek') {
      var uz = Math.max(12, Math.hypot(e.clientX - surukle.mx, e.clientY - surukle.my));
      n.s = Math.round(kirp(surukle.basScale * (uz / surukle.basUzaklik), 0.25, 3) * 100) / 100;
      el('nesne-boyut').value = n.s;
      el('deger-boyut').textContent = n.s.toFixed(2) + '×';
    }
    surukle.el.style.transform = transformMetni(n);
    return;
  }
  if (panelle) {
    view.x = panelle.bx + (e.clientX - panelle.sx);
    view.y = panelle.by + (e.clientY - panelle.sy);
    gorunumUygula();
  }
}

function suruklemeBitir() {
  if (surukle) {
    if (surukle.tur === 'tasi' && !surukle.tasindi) gecmis.pop();
    otomatikKaydet();
    panelGuncelle();
    surukle = null;
  }
  if (panelle) {
    panelle = null;
    el('sahne-alani').classList.remove('surukleniyor');
  }
}

/* ---------------- panel ---------------- */
function panelGuncelle() {
  var n = seciliNesne();
  el('sahne-ayarlari').hidden = !!n;
  el('nesne-ayarlari').hidden = !n;
  el('ozellik-baslik').textContent = n ? (KAGITLAR[n.tip] ? KAGITLAR[n.tip].ad : 'Nesne') : 'Sahne';
  el('ozellik-rozet').textContent = n ? 'seçili' : 'ayar';

  if (!n) return;
  var tip = KAGITLAR[n.tip];
  el('secili-onizleme').innerHTML = tamSvg(tip, tonlar(n.renk));
  el('secili-ad').textContent = tip.ad;
  el('secili-konum').textContent = n.x + ', ' + n.y;
  el('nesne-renk').value = n.renk;
  el('nesne-boyut').value = n.s;
  el('deger-boyut').textContent = n.s.toFixed(2) + '×';
  el('nesne-aci').value = kirp(n.rot, -180, 180);
  el('deger-aci').textContent = n.rot + '°';
  el('durum-metin').textContent = tip.ad + ' seçili';
  swatchDoldur('nesne-swatch', n.renk, function (renk) {
    duzenle(function (k) { k.renk = renk; });
    renkTazele(n);
  });
}

function swatchDoldur(kapId, aktif, tikla) {
  var kap = el(kapId);
  kap.innerHTML = '';
  PALET_RENKLERI.forEach(function (renk) {
    var b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = renk;
    b.title = renk;
    b.dataset.renk = renk;
    if (renk.toLowerCase() === String(aktif).toLowerCase()) {
      b.style.boxShadow = '0 0 0 2px #4a90d9 inset, 0 0 0 1px rgba(90,110,135,.16) inset';
    }
    b.addEventListener('click', function () { tikla(renk); });
    kap.appendChild(b);
  });
}

/* ---------------- palet ---------------- */
function paletKur() {
  var kategoriler = ['Tümü'];
  Object.keys(KAGITLAR).forEach(function (k) {
    var kat = KAGITLAR[k].kat;
    if (kategoriler.indexOf(kat) === -1) kategoriler.push(kat);
  });
  var filtre = el('palet-filtre');
  filtre.innerHTML = '';
  kategoriler.forEach(function (kat, i) {
    var b = document.createElement('button');
    b.className = 'filtre-btn' + (i === 0 ? ' aktif' : '');
    b.textContent = kat;
    b.addEventListener('click', function () {
      var hepsi = filtre.querySelectorAll('.filtre-btn');
      for (var j = 0; j < hepsi.length; j++) hepsi[j].classList.remove('aktif');
      b.classList.add('aktif');
      paletListele(kat === 'Tümü' ? null : kat);
    });
    filtre.appendChild(b);
  });

  var izgara = el('palet-izgara');
  izgara.innerHTML = '';
  Object.keys(KAGITLAR).forEach(function (k) {
    var tip = KAGITLAR[k];
    var kart = document.createElement('button');
    kart.className = 'palet-kart';
    kart.dataset.kat = tip.kat;
    kart.dataset.tip = k;
    kart.title = tip.ad + ' ekle';
    kart.innerHTML = '<span class="onizleme">' + tamSvg(tip, tonlar(tip.renk)) + '</span><span>' + tip.ad + '</span>';
    kart.addEventListener('click', function () { nesneEkle(k); });
    izgara.appendChild(kart);
  });
  el('palet-sayaci').textContent = Object.keys(KAGITLAR).length;
}

function paletListele(kat) {
  var kartlar = document.querySelectorAll('.palet-kart');
  for (var i = 0; i < kartlar.length; i++) {
    kartlar[i].style.display = (!kat || kartlar[i].dataset.kat === kat) ? '' : 'none';
  }
}

/* ---------------- atmosferler ---------------- */
var ATMOSFERLER = {
  bahar: {
    ad: 'Bahar Bahçesi', renk: '#9adfa0',
    arkaplan: { gok1: '#c9e9ff', gok2: '#f2fbff', zemin: '#a9e2a0' },
    nesneler: [
      { tip: 'gunes', x: 1340, y: 160, s: 0.9 },
      { tip: 'bulut', x: 260, y: 150, s: 1.1 },
      { tip: 'bulut', x: 720, y: 110, s: 0.85 },
      { tip: 'bulut', x: 1080, y: 230, s: 0.7 },
      { tip: 'kus', x: 900, y: 240, s: 1 },
      { tip: 'kus', x: 1010, y: 300, s: 0.8 },
      { tip: 'tepe', x: 300, y: 830, s: 1 },
      { tip: 'tepe', x: 900, y: 790, s: 1.15 },
      { tip: 'tepe', x: 1450, y: 860, s: 0.95 },
      { tip: 'agac', x: 170, y: 720, s: 1.1 },
      { tip: 'agac', x: 430, y: 780, s: 0.85 },
      { tip: 'agac', x: 1480, y: 730, s: 1 },
      { tip: 'ev', x: 780, y: 720, s: 1 },
      { tip: 'cali', x: 70, y: 880, s: 0.9 },
      { tip: 'cali', x: 1520, y: 900, s: 0.8 },
      { tip: 'cicek', x: 600, y: 905, s: 1 },
      { tip: 'cicek', x: 960, y: 890, s: 0.85 },
      { tip: 'cicek', x: 1120, y: 930, s: 1.1 },
      { tip: 'cicek', x: 300, y: 930, s: 0.9 },
      { tip: 'kelebek', x: 620, y: 600, s: 1 },
      { tip: 'kelebek', x: 1180, y: 520, s: 0.8 },
      { tip: 'tavsan', x: 480, y: 900, s: 0.9 },
      { tip: 'kedi', x: 1270, y: 900, s: 0.9 }
    ]
  },
  kasaba: {
    ad: 'Şeker Renkli Kasaba', renk: '#ffb3d9',
    arkaplan: { gok1: '#ffd9ee', gok2: '#eef7ff', zemin: '#ffc9dc' },
    nesneler: [
      { tip: 'gunes', x: 1440, y: 170, s: 0.8 },
      { tip: 'bulut', x: 620, y: 170, s: 1 },
      { tip: 'bulut', x: 1120, y: 150, s: 0.8 },
      { tip: 'balon', x: 300, y: 320, s: 1 },
      { tip: 'balon', x: 1260, y: 340, s: 0.85 },
      { tip: 'seker', x: 520, y: 560, s: 1 },
      { tip: 'seker', x: 1500, y: 540, s: 0.9 },
      { tip: 'bina', x: 250, y: 660, s: 1.1 },
      { tip: 'bina', x: 1330, y: 640, s: 1.2 },
      { tip: 'ev', x: 420, y: 720, s: 1 },
      { tip: 'ev', x: 680, y: 750, s: 0.9 },
      { tip: 'ev', x: 940, y: 700, s: 1.05 },
      { tip: 'ev', x: 1180, y: 750, s: 0.95 },
      { tip: 'agac', x: 90, y: 760, s: 0.9 },
      { tip: 'agac', x: 1560, y: 720, s: 1 },
      { tip: 'cit', x: 700, y: 890, s: 0.8 },
      { tip: 'cit', x: 1040, y: 910, s: 0.7 },
      { tip: 'kopek', x: 850, y: 900, s: 0.9 },
      { tip: 'kelebek', x: 700, y: 560, s: 0.9 }
    ]
  },
  orman: {
    ad: 'Masal Ormanı', renk: '#c9a7ff',
    arkaplan: { gok1: '#d9dcff', gok2: '#eaf9ff', zemin: '#8fd3b4' },
    nesneler: [
      { tip: 'ay', x: 1360, y: 150, s: 0.9 },
      { tip: 'yildiz', x: 1120, y: 110, s: 0.7 },
      { tip: 'yildiz', x: 560, y: 90, s: 0.55 },
      { tip: 'yildiz', x: 900, y: 160, s: 0.6 },
      { tip: 'gokkusagi', x: 420, y: 320, s: 0.9 },
      { tip: 'kus', x: 1200, y: 300, s: 0.9 },
      { tip: 'agac', x: 200, y: 700, s: 1.2 },
      { tip: 'agac', x: 400, y: 650, s: 1 },
      { tip: 'agac', x: 620, y: 730, s: 1.15 },
      { tip: 'agac', x: 1420, y: 700, s: 1.1 },
      { tip: 'agac', x: 1560, y: 780, s: 0.95 },
      { tip: 'cali', x: 300, y: 880, s: 0.9 },
      { tip: 'mantar', x: 720, y: 900, s: 1.1 },
      { tip: 'mantar', x: 900, y: 880, s: 0.9 },
      { tip: 'mantar', x: 1120, y: 910, s: 1.2 },
      { tip: 'kopru', x: 800, y: 840, s: 0.85 },
      { tip: 'gol', x: 1220, y: 950, s: 0.9 },
      { tip: 'tekne', x: 1240, y: 920, s: 0.8 },
      { tip: 'kedi', x: 340, y: 930, s: 0.85 },
      { tip: 'kelebek', x: 980, y: 620, s: 0.85 }
    ]
  }
};

function atmosferYukle(anahtar) {
  var a = ATMOSFERLER[anahtar];
  if (!a) return;
  itme();
  state.ad = a.ad;
  state.atmosfer = anahtar;
  state.arkaplan = JSON.parse(JSON.stringify(a.arkaplan));
  state.nesneler = a.nesneler.map(function (n, i) {
    return {
      id: yeniId(),
      tip: n.tip,
      x: n.x, y: n.y,
      rot: n.rot || 0,
      s: n.s || 1,
      renk: KAGITLAR[n.tip] ? KAGITLAR[n.tip].renk : '#ff9ec4',
      ayna: !!n.ayna
    };
  });
  seciliId = null;
  arkaplanUygula();
  sahnayiCiz();
  panelGuncelle();
  otomatikKaydet();
  atmosferDugmeleri();
  bildir(a.ad + ' açıldı');
}

function atmosferDugmeleri() {
  var kap = el('atmosferler');
  kap.innerHTML = '';
  Object.keys(ATMOSFERLER).forEach(function (k) {
    var a = ATMOSFERLER[k];
    var b = document.createElement('button');
    b.className = 'atmosfer-btn' + (state.atmosfer === k ? ' aktif' : '');
    b.innerHTML = '<span class="nokta-renk" style="background:' + a.renk + '"></span>' + a.ad;
    b.addEventListener('click', function () { atmosferYukle(k); });
    kap.appendChild(b);
  });
}

/* ---------------- kaydet / yükle ---------------- */
function otomatikKaydet() {
  clearTimeout(otomatikZaman);
  otomatikZaman = setTimeout(function () {
    try {
      localStorage.setItem(DEPO, JSON.stringify({
        surum: 1, ad: state.ad, atmosfer: state.atmosfer, arkaplan: state.arkaplan, nesneler: state.nesneler
      }));
      el('durum-metin').textContent = 'Otomatik kaydedildi';
    } catch (e) { /* kota dolu olabilir */ }
  }, 350);
}

function projeVerisi() {
  return { surum: 1, ad: state.ad, atmosfer: state.atmosfer, arkaplan: state.arkaplan, nesneler: state.nesneler };
}

function jsonKaydet() {
  var metin = JSON.stringify(projeVerisi(), null, 2);
  indir(new Blob([metin], { type: 'application/json' }), 'numex-paper-world-' + Date.now() + '.json');
  bildir('JSON kaydedildi');
}

function jsonYukle(dosya) {
  var okuyucu = new FileReader();
  okuyucu.onload = function () {
    try {
      var veri = JSON.parse(String(okuyucu.result));
      if (!veri || !Array.isArray(veri.nesneler)) throw new Error('gecersiz');
      itme();
      uygula(veri);
      atmosferDugmeleri();
      bildir('Proje yüklendi: ' + (veri.ad || 'adsız'));
    } catch (e) {
      bildir('Dosya okunamadı — geçerli bir JSON proje değil');
    }
  };
  okuyucu.readAsText(dosya);
}

function indir(blob, ad) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
}

/* ---------------- PNG ---------------- */
function svgUri(tip, c) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(tamSvg(tip, c));
}

function resimYukle(uri) {
  return new Promise(function (coz) {
    var img = new Image();
    img.onload = function () { coz(img); };
    img.onerror = function () { coz(null); };
    img.src = uri;
  });
}

function pngUret(olcek) {
  olcek = olcek || 2;
  var W = DUNYA.w, H = DUNYA.h;
  var cv = document.createElement('canvas');
  cv.width = W * olcek;
  cv.height = H * olcek;
  var ctx = cv.getContext('2d');
  ctx.setTransform(olcek, 0, 0, olcek, 0, 0);

  var gok = ctx.createLinearGradient(0, 0, 0, H);
  gok.addColorStop(0, state.arkaplan.gok1);
  gok.addColorStop(0.78, state.arkaplan.gok2);
  ctx.fillStyle = gok;
  ctx.fillRect(0, 0, W, H);

  var z = state.arkaplan.zemin;
  ctx.fillStyle = tonlar(z).c;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-100, H);
  ctx.quadraticCurveTo(800, 560, 1700, H);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = z;
  ctx.beginPath();
  ctx.moveTo(-100, H);
  ctx.quadraticCurveTo(800, 606, 1700, H);
  ctx.closePath();
  ctx.fill();

  var isler = state.nesneler.map(function (n) {
    var tip = KAGITLAR[n.tip];
    if (!tip) return Promise.resolve();
    return resimYukle(svgUri(tip, tonlar(n.renk))).then(function (img) {
      if (!img) return;
      var b = tipBoyut(tip);
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rot * Math.PI / 180);
      ctx.scale(n.ayna ? -n.s : n.s, n.s);
      ctx.shadowColor = 'rgba(64,82,108,0.18)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(img, -b[0] / 2, -b[1] / 2, b[0], b[1]);
      ctx.restore();
    });
  });

  return Promise.all(isler).then(function () { return cv; });
}

function pngIndir() {
  bildir('PNG hazırlanıyor…');
  pngUret(2).then(function (cv) {
    cv.toBlob(function (blob) {
      indir(blob, 'numex-paper-world-' + Date.now() + '.png');
      bildir('PNG indirildi (3200 × 2000)');
    }, 'image/png');
  }).catch(function () { bildir('PNG oluşturulamadı'); });
}

/* ---------------- SVG ---------------- */
function svgUret() {
  var parcalar = state.nesneler.map(function (n) {
    var tip = KAGITLAR[n.tip];
    if (!tip) return '';
    var c = tonlar(n.renk);
    var b = tipBoyut(tip);
    var olcek = n.s * (n.ayna ? -1 : 1);
    return '<g transform="translate(' + n.x + ' ' + n.y + ') rotate(' + n.rot + ') scale(' + olcek + ')">' +
      '<svg x="' + (-b[0] / 2) + '" y="' + (-b[1] / 2) + '" width="' + b[0] + '" height="' + b[1] +
      '" viewBox="0 0 ' + tip.vb[0] + ' ' + tip.vb[1] + '" overflow="visible">' + tip.ic(c) + '</svg></g>';
  }).join('\n');

  return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">' +
    '<defs><linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + state.arkaplan.gok1 + '"/>' +
    '<stop offset="0.78" stop-color="' + state.arkaplan.gok2 + '"/></linearGradient></defs>' +
    '<rect width="1600" height="1000" fill="url(#gok)"/>' +
    '<path d="M-100 1000Q800 606 1700 1000Z" fill="' + state.arkaplan.zemin + '"/>' +
    parcalar + '</svg>';
}

function svgIndir() {
  indir(new Blob([svgUret()], { type: 'image/svg+xml;charset=utf-8' }), 'numex-paper-world-' + Date.now() + '.svg');
  bildir('SVG indirildi');
}

/* ---------------- olaylar ---------------- */
function olaylariBagla() {
  var sahne = el('sahne-alani');
  sahne.addEventListener('pointerdown', suruklemeBaslat);
  window.addEventListener('pointermove', suruklemeHareket);
  window.addEventListener('pointerup', suruklemeBitir);
  window.addEventListener('pointercancel', suruklemeBitir);

  sahne.addEventListener('mousemove', function (e) {
    if (panelle) return;
    var s = sahne.getBoundingClientRect();
    paralaks((e.clientX - s.left) / s.width - 0.5, (e.clientY - s.top) / s.height - 0.5);
  });

  sahne.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomYap(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
  }, { passive: false });

  el('zoom-ekle').addEventListener('click', function () { zoomYap(1.18); });
  el('zoom-cikar').addEventListener('click', function () { zoomYap(0.85); });
  el('zoom-sigdir').addEventListener('click', sigdir);

  el('btn-geri').addEventListener('click', geriAl);
  el('btn-yinele').addEventListener('click', yinele);
  el('btn-kaydet').addEventListener('click', jsonKaydet);
  el('btn-yukle').addEventListener('click', function () { el('dosya-girdi').click(); });
  el('dosya-girdi').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) jsonYukle(e.target.files[0]);
    e.target.value = '';
  });
  el('btn-png').addEventListener('click', pngIndir);
  el('btn-svg').addEventListener('click', svgIndir);

  el('nesne-renk').addEventListener('input', function (e) {
    var n = seciliNesne();
    if (!n) return;
    if (!sliderKilit.renk) { itme(); sliderKilit.renk = true; }
    n.renk = e.target.value;
    renkTazele(n);
    panelGuncelle();
    otomatikKaydet();
  });
  el('nesne-renk').addEventListener('change', function () { sliderKilit.renk = false; });

  el('nesne-boyut').addEventListener('input', function (e) {
    var n = seciliNesne();
    if (!n) return;
    if (!sliderKilit.boyut) { itme(); sliderKilit.boyut = true; }
    n.s = parseFloat(e.target.value);
    el('deger-boyut').textContent = n.s.toFixed(2) + '×';
    elemaniTazele(n);
    otomatikKaydet();
  });
  el('nesne-boyut').addEventListener('change', function () { sliderKilit.boyut = false; });

  el('nesne-aci').addEventListener('input', function (e) {
    var n = seciliNesne();
    if (!n) return;
    if (!sliderKilit.aci) { itme(); sliderKilit.aci = true; }
    n.rot = parseInt(e.target.value, 10);
    el('deger-aci').textContent = n.rot + '°';
    elemaniTazele(n);
    otomatikKaydet();
  });
  el('nesne-aci').addEventListener('change', function () { sliderKilit.aci = false; });

  el('btn-one').addEventListener('click', function () { katman('one'); });
  el('btn-arkaya').addEventListener('click', function () { katman('arkaya'); });
  el('btn-orta').addEventListener('click', function () { katman('ust'); });
  el('btn-cogalt').addEventListener('click', cogalt);
  el('btn-sil').addEventListener('click', silNesne);
  el('btn-aynala').addEventListener('click', function () {
    duzenle(function (n) { n.ayna = !n.ayna; });
  });
  el('btn-ortala').addEventListener('click', function () {
    var m = ekranMerkezi();
    duzenle(function (n) { n.x = Math.round(m.x); n.y = Math.round(m.y); });
  });

  ['gok1', 'gok2', 'zemin-renk'].forEach(function (id) {
    el(id).addEventListener('input', function (e) {
      var anahtar = id === 'gok1' ? 'gok1' : id === 'gok2' ? 'gok2' : 'zemin';
      state.arkaplan[anahtar] = e.target.value;
      arkaplanUygula();
      otomatikKaydet();
    });
    el(id).addEventListener('change', function () { itme(); });
  });

  el('btn-temizle').addEventListener('click', function () {
    itme();
    state.nesneler = [];
    seciliId = null;
    sahnayiCiz();
    panelGuncelle();
    otomatikKaydet();
    bildir('Sahne boşaltıldı');
  });
  el('btn-sifirla').addEventListener('click', function () {
    atmosferYukle(state.atmosfer && ATMOSFERLER[state.atmosfer] ? state.atmosfer : 'bahar');
  });

  // mobil sekmeler
  document.querySelectorAll('.mobil-sekme [data-hedef]').forEach(function (b) {
    b.addEventListener('click', function () {
      var hedef = el(b.dataset.hedef);
      var acik = hedef.classList.contains('acik');
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('acik'); });
      if (!acik) hedef.classList.add('acik');
    });
  });
  var kapat = el('mobil-kapat');
  if (kapat) kapat.addEventListener('click', function () {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('acik'); });
  });

  window.addEventListener('keydown', function (e) {
    var etiket = (e.target.tagName || '').toLowerCase();
    if (etiket === 'input' || etiket === 'textarea') return;
    var n = seciliNesne();

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) yinele(); else geriAl();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); yinele(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); cogalt(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { if (n) { e.preventDefault(); silNesne(); } return; }

    if (n && e.key.indexOf('Arrow') === 0) {
      e.preventDefault();
      var adim = e.shiftKey ? 10 : 1;
      duzenle(function (k) {
        if (e.key === 'ArrowLeft') k.x -= adim;
        if (e.key === 'ArrowRight') k.x += adim;
        if (e.key === 'ArrowUp') k.y -= adim;
        if (e.key === 'ArrowDown') k.y += adim;
      });
    }
  });

  window.addEventListener('resize', function () { gorunumUygula(); });
}

/* ---------------- açılış ---------------- */
function baslat() {
  paletKur();
  olaylariBagla();
  atmosferDugmeleri();

  var kayit = null;
  try { kayit = JSON.parse(localStorage.getItem(DEPO) || 'null'); } catch (err) { kayit = null; }

  if (kayit && Array.isArray(kayit.nesneler) && kayit.nesneler.length) {
    state.ad = kayit.ad || 'Proje';
    state.atmosfer = kayit.atmosfer || 'bahar';
    state.arkaplan = kayit.arkaplan || state.arkaplan;
    state.nesneler = kayit.nesneler.map(function (n) {
      return {
        id: n.id || yeniId(),
        tip: KAGITLAR[n.tip] ? n.tip : 'bulut',
        x: Number(n.x) || 800, y: Number(n.y) || 500,
        rot: Number(n.rot) || 0, s: Number(n.s) || 1,
        renk: n.renk || (KAGITLAR[n.tip] ? KAGITLAR[n.tip].renk : '#ff9ec4'),
        ayna: !!n.ayna
      };
    });
    arkaplanUygula();
    sahnayiCiz();
    panelGuncelle();
    atmosferDugmeleri();
    bildir('Son çalışman geri yüklendi');
  } else {
    atmosferYukle('bahar');
  }

  swatchDoldur('sahne-swatch', state.arkaplan.zemin, function (renk) {
    state.arkaplan.zemin = renk;
    arkaplanUygula();
    otomatikKaydet();
    itme();
  });

  sigdir();
  gorunumUygula();
  dugmeDurumu();
}

document.addEventListener('DOMContentLoaded', baslat);

/* test / hata ayıklama köprüsü */
window.NPW = {
  state: state,
  nesneEkle: nesneEkle,
  sec: sec,
  secili: seciliNesne,
  katman: katman,
  cogalt: cogalt,
  sil: silNesne,
  geriAl: geriAl,
  yinele: yinele,
  atmosferYukle: atmosferYukle,
  svgUret: svgUret,
  pngUret: pngUret,
  jsonVerisi: projeVerisi,
  uygula: uygula,
  sigdir: sigdir,
  view: view,
  nesneSayisi: function () { return state.nesneler.length; }
};
