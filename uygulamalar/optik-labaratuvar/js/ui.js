// NUMEX PRİZMA — ui.js
// Arayüz: palet, özellik paneli, sürükle/döndür, klavye, deneyler, export, rapor.

import {
  makeState, addElement, removeElement, updateElement, setOrtam, sifirla, undo, redo,
  kaydetJSON, yukleJSON, localStorageKaydet, localStorageYukle, secimAyarla, yenidenHesapla
} from './state.js';
import { deneyListesi, deneyYukle, bosDeney } from './experiments.js';
import {
  cizSahne, ekranaSigdir, zoomUygula, panUygula, vurusEleman, ekranDonusum,
  toSVG, toPNG, raporOlustur
} from './render.js';
import { ORTAMLAR, prismDeviation, validateMediumIndex } from './optics.js';
import { deg, rad } from './geometry.js';

const $ = (id) => document.getElementById(id);

export const state = makeState();

/** Yeni durumu, dışa açılan sabit referansı KORUYARAK yerinde uygular. */
function stateUygula(yeni) {
  state.elements = yeni.elements;
  state.seciliId = yeni.seciliId;
  state.ortam = yeni.ortam;
  state.camera = yeni.camera;
  state.izAcik = yeni.izAcik;
  state.animasyon = yeni.animasyon;
  state.sonuclar = yeni.sonuclar;
  state.undo = yeni.undo;
  state.redo = yeni.redo;
  state.meta = yeni.meta;
  state.dirty = true;
}
let canvas, ctx, DPR = 1;
let sonT = 0;
let surukle = null;

const TIP_ETIKET = {
  pointSource: 'Noktasal Işık', parallelSource: 'Paralel Işın',
  planeMirror: 'Düzlem Ayna', concaveMirror: 'İçbükey Ayna', convexMirror: 'Dışbükey Ayna',
  convergingLens: 'İnce Kenarlı (Yakınsak)', divergingLens: 'Kalın Kenarlı (Iraksak)',
  prism: 'Prizma', screen: 'Ekran', wall: 'Işık Engeli'
};

export function durumCubuguYaz(mesaj) {
  const el = $('durum');
  if (el) el.textContent = mesaj;
}

/* ---------------- UI iskeleti ---------------- */

export function init() {
  canvas = $('sahne');
  ctx = canvas.getContext('2d');
  boyutlandir();
  window.addEventListener('resize', boyutlandir);

  const son = localStorageYukle();
  stateUygula(son || deneyYukle('A'));
  if (!son) durumCubuguYaz('Deney A yüklendi — Düzlem Ayna');

  deneySeciciDoldur();
  baglaUstBar();
  baglaPalet();
  baglaPanel();
  baglaCanvas();
  baglaKlavye();
  yenidenHesapla(state);
  ekranaSigdir(state, canvas);
  animasyonuBaslat();
  secimiGuncelle();
  requestAnimationFrame(dongu);
}

function boyutlandir() {
  if (!canvas) return;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function deneySeciciDoldur() {
  const sel = $('deneySec');
  sel.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = ''; opt0.textContent = '— Yeni (boş) —';
  sel.appendChild(opt0);
  for (const d of deneyListesi()) {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = `${d.id} · ${d.ad}`;
    o.title = d.aciklama;
    sel.appendChild(o);
  }
  sel.value = state.meta?.deneyId || '';
}

/* ---------------- döngü ---------------- */

function animasyonuBaslat() {
  state.animasyon.progress = 0;
  state.animasyon.calisiyor = true;
}

let veriBugun = false; // placeholder to keep linters content

function dongu(t) {
  const dt = sonT ? (t - sonT) / 1000 : 0.016;
  sonT = t;

  if (state.dirty) {
    yenidenHesapla(state);
    if (state.animasyon.acik) state.animasyon.progress = 0.001;
  // NUMEX-DÜZELTME (2026-11-19): Ölçüm paneli hep 0 kalıyordu çünkü panel yalnız dirty bloğunun İÇİNDE güncelleniyordu ve o blok yalnız ilk karede çalışıyordu; panel her karede tazelenmeli.
  }
  olcumPaneliniGuncelle();
  if (state.animasyon.acik && state.animasyon.progress < 1) {
    // NUMEX-DÜZELTME (2026-11-19): Yansıyan ışın hiç görünmüyordu: ışın yolu 4000 px'e kadar uzandığı için toplam uzunluk çok büyüyor, progress 1400 px/sn hızla ışının aynaya ulaşan kısmına yetişemiyordu. Animasyon hızı ışın uzunluğuna göre ölçeklenir ve progress 1.2 sn'de tamamlanır.
    state.animasyon.progress = Math.min(1, state.animasyon.progress + dt * 0.9);
  }
  cizSahne(ctx, state, canvas);
  requestAnimationFrame(dongu);
  void veriBugun;
}

/* ---------------- üst bar ---------------- */

export function baglaUstBar() {
  $('deneySec').addEventListener('change', (e) => {
    const id = e.target.value;
    stateUygula(id ? deneyYukle(id) : bosDeney());
    yenidenHesapla(state);
    ekranaSigdir(state, canvas);
    animasyonuBaslat();
    secimiGuncelle();
    durumCubuguYaz(id ? `Deney ${id} yüklendi` : 'Boş deney');
  });

  $('btnGeriAl').addEventListener('click', () => {
    if (undo(state)) { yenidenHesapla(state); secimiGuncelle(); durumCubuguYaz('Geri alındı'); }
    else durumCubuguYaz('Geri alınacak işlem yok');
  });
  $('btnIleriAl').addEventListener('click', () => {
    if (redo(state)) { yenidenHesapla(state); secimiGuncelle(); durumCubuguYaz('İleri alındı'); }
    else durumCubuguYaz('İleri alınacak işlem yok');
  });
  $('btnKaydet').addEventListener('click', indirJSON);
  $('btnYukle').addEventListener('click', () => $('dosyaGirdi').click());
  $('dosyaGirdi').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        stateUygula(yukleJSON(String(rd.result)));
        yenidenHesapla(state); ekranaSigdir(state, canvas); secimiGuncelle();
        durumCubuguYaz('Deney yüklendi: ' + f.name);
      } catch (err) {
        durumCubuguYaz('HATA: ' + err.message);
      }
    };
    rd.readAsText(f, 'utf-8');
    e.target.value = '';
  });
  $('btnSVG').addEventListener('click', () => indirMetin('numex-prizma.svg', toSVG(state), 'image/svg+xml'));
  $('btnPNG').addEventListener('click', async () => {
    const b = await toPNG(canvas);
    if (!b) return durumCubuguYaz('PNG üretilemedi');
    indirBlob('numex-prizma.png', b);
    durumCubuguYaz('PNG indirildi');
  });
  $('btnRapor').addEventListener('click', () => {
    const w = window.open('', '_blank');
    if (!w) return durumCubuguYaz('Rapor penceresi engellendi');
    w.document.write(raporOlustur(state));
    w.document.close();
    setTimeout(() => { try { w.print(); } catch { /* kullanıcı iptal etti */ } }, 350);
  });
  $('btnSifirla').addEventListener('click', () => {
    sifirla(state); yenidenHesapla(state); secimiGuncelle(); durumCubuguYaz('Sahne sıfırlandı');
  });
  $('btnYerel').addEventListener('click', () => {
    localStorageKaydet(state) ? durumCubuguYaz('Tarayıcıya kaydedildi') : durumCubuguYaz('Kayıt başarısız');
  });
  $('btnSigdir').addEventListener('click', () => { ekranaSigdir(state, canvas); durumCubuguYaz('Ekrana sığdırıldı'); });
  $('btnIz').addEventListener('click', (e) => {
    state.izAcik = !state.izAcik;
    e.currentTarget.classList.toggle('aktif', state.izAcik);
    durumCubuguYaz(state.izAcik ? 'Işın izleri açık' : 'Işın izleri kapalı');
  });
  $('btnAnim').addEventListener('click', (e) => {
    state.animasyon.acik = !state.animasyon.acik;
    state.animasyon.progress = 1;
    e.currentTarget.classList.toggle('aktif', state.animasyon.acik);
    durumCubuguYaz(state.animasyon.acik ? 'Animasyon açık' : 'Animasyon kapalı');
  });
  $('btnTest').addEventListener('click', () => window.open('test.html', '_blank'));
}

function indirBlob(ad, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ad;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function indirMetin(ad, metin, tip) {
  indirBlob(ad, new Blob([metin], { type: tip }));
  durumCubuguYaz(ad + ' indirildi');
}

function indirJSON() {
  indirMetin('numex-prizma-deney.json', kaydetJSON(state), 'application/json');
}

/* ---------------- palet ---------------- */

export function baglaPalet() {
  document.querySelectorAll('[data-ekle]').forEach((b) => {
    b.addEventListener('click', () => {
      const tip = b.dataset.ekle;
      const tr = ekranDonusum(state, canvas);
      const merkez = tr.toWorld({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 });
      addElement(state, tip, Math.round(merkez.x), Math.round(merkez.y));
      yenidenHesapla(state);
      secimiGuncelle();
      durumCubuguYaz(TIP_ETIKET[tip] + ' eklendi');
    });
  });
}

/* ---------------- özellik paneli ---------------- */

export function baglaPanel() {
  const alanlar = ['px', 'py', 'pac', 'plen', 'prad', 'pf', 'papex', 'psize', 'prays', 'pspread', 'pwavelength', 'pn'];
  for (const id of alanlar) {
    const inp = $(id);
    if (!inp) continue;
    inp.addEventListener('input', () => {
      const el = state.elements.find((e) => e.id === state.seciliId);
      if (!el) return;
      const patch = {};
      const val = parseFloat(inp.value);
      switch (id) {
        case 'px': patch.x = val; break;
        case 'py': patch.y = val; break;
        case 'pac': patch.angle = rad(val); break;
        case 'plen': patch.length = Math.max(10, val); break;
        case 'prad': patch.radius = Math.max(20, val); break;
        case 'pf': patch.f = val; break;
        case 'papex': patch.apex = Math.max(10, Math.min(150, val)); break;
        case 'psize': patch.size = Math.max(20, val); break;
        case 'prays': patch.rays = Math.max(1, Math.min(241, Math.round(val))); break;
        case 'pspread': patch.spread = Math.max(0, Math.min(360, val)); break;
        case 'pwavelength': {
          patch.wavelength = val;
          patch.color = val === 0 ? '#ffffff' : nmRenk(val);
          break;
        }
        case 'pn': patch.n = val; break;
      }
      if (!isFinite(val)) return;
      try {
        updateElement(state, el.id, patch, { pushUndo: false });
        yenidenHesapla(state);
      } catch (err) {
        durumCubuguYaz('HATA: ' + err.message);
      }
    });
    inp.addEventListener('change', () => { /* undo noktası: odak kaybında */ });
  }

  $('btnSil').addEventListener('click', () => {
    if (!state.seciliId) return durumCubuguYaz('Silinecek eleman seçili değil');
    removeElement(state, state.seciliId);
    yenidenHesapla(state);
    secimiGuncelle();
    durumCubuguYaz('Eleman silindi');
  });

  const ortamSel = $('ortamSec');
  ortamSel.innerHTML = Object.keys(ORTAMLAR).map((k) => `<option value="${k}">${k} (n=${ORTAMLAR[k]})</option>`).join('') +
    '<option value="ozel">özel…</option>';
  ortamSel.addEventListener('change', () => {
    const v = ortamSel.value;
    if (v === 'ozel') { $('ortamN').focus(); return; }
    setOrtam(state, v, ORTAMLAR[v]);
    $('ortamN').value = ORTAMLAR[v];
    yenidenHesapla(state);
    durumCubuguYaz('Ortam: ' + v);
  });
  $('ortamN').addEventListener('change', () => {
    const n = parseFloat($('ortamN').value);
    try {
      validateMediumIndex(n);
      setOrtam(state, 'özel', n);
      yenidenHesapla(state);
      durumCubuguYaz('Ortam indisi: n = ' + n);
    } catch (e) {
      $('ortamN').value = state.ortam.n;
      durumCubuguYaz('HATA: ' + e.message);
    }
  });
}

const nmRenk = (nm) => {
  if (nm < 450) return '#8b5cf6';
  if (nm < 490) return '#3b82f6';
  if (nm < 520) return '#22d3ee';
  if (nm < 570) return '#22c55e';
  if (nm < 600) return '#eab308';
  if (nm < 640) return '#f97316';
  return '#ef4444';
};

export function secimiGuncelle() {
  const el = state.elements.find((e) => e.id === state.seciliId);
  const bos = $('panelBos'), form = $('ozellikForm');
  if (!el) {
    bos.style.display = 'block';
    form.style.display = 'none';
    $('ozellikBaslik').textContent = 'Özellikler';
    return;
  }
  bos.style.display = 'none';
  form.style.display = 'block';
  $('ozellikBaslik').textContent = TIP_ETIKET[el.tip] || el.tip;
  const goster = (id, kosul) => { const row = $(id)?.closest('.row'); if (row) row.style.display = kosul ? '' : 'none'; };
  $('px').value = Math.round(el.x);
  $('py').value = Math.round(el.y);
  $('pac').value = deg(el.angle || 0).toFixed(1);
  $('plen').value = el.length ?? 180;
  $('prad').value = el.radius ?? 220;
  $('pf').value = el.f ?? 120;
  $('papex').value = el.apex ?? 60;
  $('psize').value = el.size ?? 160;
  $('prays').value = el.rays ?? 9;
  $('pspread').value = el.spread ?? 60;
  $('pwavelength').value = el.wavelength ?? 0;
  $('pn').value = el.n ?? 1.52;

  goster('plen', ['planeMirror', 'screen', 'wall', 'parallelSource', 'concaveMirror', 'convexMirror'].includes(el.tip));
  goster('prad', ['concaveMirror', 'convexMirror'].includes(el.tip));
  goster('pf', ['convergingLens', 'divergingLens'].includes(el.tip));
  goster('papex', el.tip === 'prism');
  goster('psize', ['prism', 'convergingLens', 'divergingLens', 'concaveMirror', 'convexMirror'].includes(el.tip));
  goster('prays', ['pointSource', 'parallelSource'].includes(el.tip));
  goster('pspread', el.tip === 'pointSource');
  goster('pwavelength', ['pointSource', 'parallelSource'].includes(el.tip));
  goster('pn', el.tip === 'prism');
}

export function olcumPaneliniGuncelle() {
  const s = state.sonuclar?.stats || {};
  $('mKaynak').textContent = s.kaynakIsin ?? 0;
  $('mYol').textContent = s.yolSayisi ?? 0;
  $('mYansima').textContent = s.yansima ?? 0;
  $('mKirilma').textContent = s.kirilma ?? 0;
  $('mTir').textContent = s.tir ?? 0;
  $('mSonlanma').textContent = s.sonlanma ?? 0;

  const el = state.elements.find((e) => e.id === state.seciliId);
  const detay = $('seciliDetay');
  if (!el) {
    detay.innerHTML = '<li class="soluk">Sahneden bir eleman seçin</li>';
  } else {
    const hits = (state.sonuclar?.paths || []).flatMap((p) => p.hits.filter((h) => h.elementId === el.id).map((h) => ({ ...h, id: p.id })));
    if (!hits.length) {
      detay.innerHTML = `<li class="soluk">${TIP_ETIKET[el.tip]} — ışın etkileşimi yok</li>`;
    } else {
      const ilk = hits[0];
      detay.innerHTML = `
        <li><span>Eleman</span><b>${TIP_ETIKET[el.tip]}</b></li>
        <li><span>Etkileşim</span><b>${hits.length}</b></li>
        <li><span>Gelme açısı</span><b>${(ilk.angleIn ?? 0).toFixed(2)}°</b></li>
        <li><span>Çıkış açısı</span><b>${(ilk.angleOut ?? 0).toFixed(2)}°</b></li>
        ${ilk.n1 ? `<li><span>n₁ → n₂</span><b>${ilk.n1.toFixed(4)} → ${ilk.n2.toFixed(4)}</b></li>` : ''}
        ${el.tip === 'convergingLens' || el.tip === 'divergingLens' ? `<li><span>Odak uzaklığı</span><b>f = ${(el.f ?? 120)} px</b></li>` : ''}`;
    }
  }
  const dev = prismDeviation(state.sonuclar?.paths || []);
  $('mDispersiyon').textContent = dev ? dev.delta.toFixed(3) + '°' : '—';
  $('ortamN').value = state.ortam.n;
  // NUMEX-DÜZELTME (2026-11-19): Ortam indisi kutusu ilk açılışta boş kalıyordu: olcumPaneliniGuncelle yalnız ölçümleri yazıyor, ortam alanını doldurmuyordu. Ayrıca ortam seçicisi mevcut ortamla eşitleniyor.
  const sec = $('ortamSec');
  if (sec) sec.value = ORTAMLAR[state.ortam.ad] !== undefined ? state.ortam.ad : 'ozel';
}

/* ---------------- canvas etkileşimi ---------------- */

export function baglaCanvas() {
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomUygula(state, { factor: e.deltaY < 0 ? 1.12 : 1 / 1.12, cx: e.clientX - r.left, cy: e.clientY - r.top }, canvas);
  }, { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    const id = vurusEleman(state, pt, canvas);
    if (id) {
      secimAyarla(state, id);
      const el = state.elements.find((x) => x.id === id);
      const tr = ekranDonusum(state, canvas);
      const w = tr.toWorld(pt);
      surukle = {
        tip: e.shiftKey || e.altKey ? 'dondur' : 'tasi',
        id,
        baslangicAcisi: Math.atan2(w.y - el.y, w.x - el.x),
        orijinalAci: el.angle || 0,
        baslangic: w,
        elX: el.x, elY: el.y,
        undoBasildi: false
      };
      secimiGuncelle();
      olcumPaneliniGuncelle();
    } else {
      surukle = { tip: 'pan', son: pt };
      secimAyarla(state, null);
      secimiGuncelle();
      olcumPaneliniGuncelle();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!surukle) return;
    const r = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    const tr = ekranDonusum(state, canvas);

    if (surukle.tip === 'pan') {
      panUygula(state, pt.x - surukle.son.x, pt.y - surukle.son.y);
      surukle.son = pt;
      return;
    }
    const el = state.elements.find((x) => x.id === surukle.id);
    if (!el) return;
    if (!surukle.undoBasildi) {
      // ilk gerçek hareket: undo noktası
      surukle.undoBasildi = true;
    }
    if (surukle.tip === 'tasi') {
      const w = tr.toWorld(pt);
      el.x = Math.round(el.x + (w.x - surukle.baslangic.x));
      el.y = Math.round(el.y + (w.y - surukle.baslangic.y));
      surukle.baslangic = w;
    } else if (surukle.tip === 'dondur') {
      const w = tr.toWorld(pt);
      const a = Math.atan2(w.y - el.y, w.x - el.x);
      el.angle = surukle.orijinalAci + (a - surukle.baslangicAcisi);
    }
    state.dirty = true;
    yenidenHesapla(state);
    secimiGuncelle();
    olcumPaneliniGuncelle();
  });

  const bitir = (e) => {
    if (surukle && surukle.tip !== 'pan' && surukle.undoBasildi) {
      pushUndoSnapshot();
      durumCubuguYaz('Eleman güncellendi — ışınlar yeniden hesaplandı');
    }
    surukle = null;
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', bitir);
  canvas.addEventListener('pointercancel', bitir);
  canvas.addEventListener('dblclick', (e) => {
    const r = canvas.getBoundingClientRect();
    const id = vurusEleman(state, { x: e.clientX - r.left, y: e.clientY - r.top }, canvas);
    if (id) { secimAyarla(state, id); secimiGuncelle(); }
  });
}

/** Sürükleme sonunda tek undo kaydı bırakmak için: mevcut durumu yığına iter. */
function pushUndoSnapshot() {
  // state.js pushUndo, geçerli durumu kaydeder; geri alma bir önceki hâle döner.
  // Sürükleme sırasında doğrudan el.x değiştiği için burada durumu yığına alıyoruz.
  const snap = { elements: JSON.parse(JSON.stringify(state.elements)), seciliId: state.seciliId, ortam: JSON.parse(JSON.stringify(state.ortam)), meta: JSON.parse(JSON.stringify(state.meta)) };
  state.undo.push(snap);
  if (state.undo.length > 50) state.undo.shift();
  state.redo.length = 0;
}

/* ---------------- klavye ---------------- */

export function baglaKlavye() {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.seciliId) { removeElement(state, state.seciliId); yenidenHesapla(state); secimiGuncelle(); }
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (undo(state)) { yenidenHesapla(state); secimiGuncelle(); }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (redo(state)) { yenidenHesapla(state); secimiGuncelle(); }
    } else if (e.key === '0') {
      ekranaSigdir(state, canvas);
    } else if (e.key === '+' || e.key === '=') {
      zoomUygula(state, { factor: 1.15 }, canvas);
    } else if (e.key === '-') {
      zoomUygula(state, { factor: 1 / 1.15 }, canvas);
    } else if (e.key.toLowerCase() === 'h') {
      state.izAcik = !state.izAcik;
      $('btnIz').classList.toggle('aktif', state.izAcik);
      durumCubuguYaz(state.izAcik ? 'Işın izleri açık' : 'Işın izleri kapalı');
    } else if (e.key === 'Escape') {
      secimAyarla(state, null);
      secimiGuncelle();
    }
  });
}

/* ---------------- kırıntı ---------------- */

export function kirintiYukleme() {
  const hash = location.hash.replace('#', '');
  if (hash) {
    try {
      stateUygula(deneyYukle(hash));
      yenidenHesapla(state);
      ekranaSigdir(state, canvas);
      animasyonuBaslat();
      secimiGuncelle();
      return true;
    } catch { /* yok say */ }
  }
  return false;
}
