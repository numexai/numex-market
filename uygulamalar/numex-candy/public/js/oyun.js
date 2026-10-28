/**
 * Numex Candy — Oyun arayüzü denetleyicisi (main controller)
 * --------------------------------------------------------------------------
 * Sunucudan bölüm verisini çeker, motor modüllerini kullanarak oyunu
 * yürütür ve DOM'u günceller.
 *
 * Akış:
 *   fetch /api/levels/:id → seviye + tahta düzeni
 *   buildBoard()          → DOM ızgarasını kur
 *   onCellClick / drag    → takas dene → motor → animasyon → skor
 *   checkLevelEnd()       → hedefe göre bölümü bitir
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

import {
  tahtaOlustur,
  tahtaKopyala,
  tahtayiDoldur,
  takasEt,
  eslesmeVarMi,
  hamleVarMi,
  sekerVar,
  TIP_SAYISI,
} from '/engine/board.js';
import { eslesmeleriBul, patlamaYayilimi } from '/engine/match.js';
import { zincirlemeCalistir, yerCekimiUygula } from '/engine/cascade.js';
import {
  puanHesapla,
  yildizHesapla,
  sonrakiEsik,
  boosterPaketi,
  hedefDurumu,
  bolumDegerlendir,
} from '/engine/score.js';

// ==========================================================================
// DURUM
// ==========================================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const S = {
  /** Motor tahtası — { tip, ozel?, yeni? } | 'block' | null */
  tahta: [],
  /** Bölüm meta bilgisi */
  level: null,
  /** Kırılacak jel hücreleri ("r:c") — Set */
  jel: new Set(),
  /** Toplanan şeker sayacı — { tipId: adet } */
  sayac: {},
  /** Anlık puan */
  skor: 0,
  /** Kalan hamle */
  hamle: 0,
  /** Kalan güçlendiriciler */
  booster: { cekir: 0, karistir: 0, bomba: 0 },
  /** Seçili güçlendirici */
  aktifBooster: null,
  /** Seçili hücre [r, c] */
  secili: null,
  /** Girdi kilidi — animasyon sürerken hamle yapılamaz */
  kilitli: false,
  /** Bölüm bitti mi */
  bitti: false,
  /** Ses açık mı */
  ses: true,
  /** İlerleme kaydı */
  kayit: { acikBolum: 1, yildizlar: {}, enIyi: {} },
  /** Kombo sayacı — zincir göstergesi */
  kombo: 0,
  /** Aktif sürükleme oturumu — { aktif, r, c, kilit, baslaX, baslaY, el } */
  surukle: null,
};

const DEPO_ANAHTAR = 'numex-candy-kayit-v1';

// ==========================================================================
// KAYIT / İLERLEME
// ==========================================================================

function kayitYukle() {
  try {
    const ham = localStorage.getItem(DEPO_ANAHTAR);
    if (ham) {
      const veri = JSON.parse(ham);
      S.kayit = {
        acikBolum: veri.acikBolum || 1,
        yildizlar: veri.yildizlar || {},
        enIyi: veri.enIyi || {},
      };
    }
  } catch (e) {
    // bozuk kayıt — sıfırdan başla, oyunu kilitleme
    S.kayit = { acikBolum: 1, yildizlar: {}, enIyi: {} };
  }
}

function kayitSakla() {
  try {
    localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(S.kayit));
  } catch (e) {
    /* localStorage kapalı olabilir — sessizce devam */
  }
}

function toplamYildiz() {
  return Object.values(S.kayit.yildizlar).reduce((a, b) => a + b, 0);
}

function enIyiPuan() {
  const degerler = Object.values(S.kayit.enIyi);
  return degerler.length ? Math.max(...degerler) : 0;
}

// ==========================================================================
// SES (WebAudio ile sentez — harici dosya yok)
// ==========================================================================

let sesCtx = null;

function sesCal(tur) {
  if (!S.ses) return;
  try {
    if (!sesCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      sesCtx = new AC();
    }
    if (sesCtx.state === 'suspended') sesCtx.resume();

    const now = sesCtx.currentTime;
    const osc = sesCtx.createOscillator();
    const gain = sesCtx.createGain();

    const ayarlar = {
      sec:      { f: 480, t: 'sine',     d: 0.06, v: 0.07 },
      takas:    { f: 620, t: 'triangle', d: 0.08, v: 0.06 },
      patlama:  { f: 320, t: 'square',   d: 0.09, v: 0.05 },
      kombo:    { f: 880, t: 'sine',     d: 0.16, v: 0.08 },
      kazan:    { f: 740, t: 'sine',     d: 0.4,  v: 0.1 },
      kaybet:   { f: 180, t: 'sawtooth', d: 0.4,  v: 0.08 },
      booster:  { f: 1040, t: 'triangle', d: 0.12, v: 0.08 },
    }[tur] || { f: 500, t: 'sine', d: 0.06, v: 0.05 };

    osc.type = ayarlar.t;
    osc.frequency.setValueAtTime(ayarlar.f, now);
    if (tur === 'kombo') osc.frequency.exponentialRampToValueAtTime(ayarlar.f * 1.9, now + ayarlar.d);
    if (tur === 'kaybet') osc.frequency.exponentialRampToValueAtTime(90, now + ayarlar.d);

    gain.gain.setValueAtTime(ayarlar.v, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + ayarlar.d);

    osc.connect(gain);
    gain.connect(sesCtx.destination);
    osc.start(now);
    osc.stop(now + ayarlar.d + 0.02);
  } catch (e) {
    /* ses başarısız olsa da oyun devam eder */
  }
}

// ==========================================================================
// API
// ==========================================================================

async function bolumGetir(id) {
  const yanit = await fetch(`/api/levels/${id}`);
  if (!yanit.ok) throw new Error('Bölüm yüklenemedi: ' + yanit.status);
  return yanit.json();
}

async function skorGonder(levelId, isim, skor, yildiz) {
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId, isim, skor, yildiz }),
    });
  } catch (e) {
    /* çevrimdışı ise skor gönderilemez — oyunu etkilemesin */
  }
}

async function skorTablosuGetir(levelId) {
  try {
    const yanit = await fetch(`/api/leaderboard/${levelId}`);
    if (!yanit.ok) return [];
    const veri = await yanit.json();
    return veri.kayitlar || [];
  } catch (e) {
    return [];
  }
}
// ==========================================================================
// TAHTA ÇİZİMİ
// ==========================================================================

/** Şeker tipine göre CSS sınıfı üretir. */
function sekerSinifi(tip, ozel) {
  const sekiller = ['kare', 'daire', 'baklava', 'kare', 'daire', 'baklava'];
  const sekil = sekiller[tip % sekiller.length];
  let sinif = `candy c-t${tip} s-${sekil}`;
  if (ozel) sinif += ` ozel-${ozel}`;
  return sinif;
}

/** Tahta boyutuna göre ızgara sütunlarını ayarlar. */
function izgaraAyarla(sutun) {
  const board = $('#board');
  board.style.gridTemplateColumns = `repeat(${sutun}, minmax(0, 1fr))`;
  board.style.gridTemplateRows = `repeat(${S.tahta.length}, minmax(0, 1fr))`;
}

/**
 * Tek bir hücrenin DOM içeriğini tahtadaki duruma göre günceller.
 *
 * AKICI SÜRÜM: Şeker elementi artık her çizimde yok edilip yeniden
 * yaratılmaz. Aynı tip/özel durum korunuyorsa mevcut element yerinde
 * bırakılır — böylece CSS geçişleri (patlama, düşme, jel) kesintisiz akar.
 * Candy Crush'ın "yerleşik şeker" hissi buradan gelir.
 */
function hucreGuncelle(r, c) {
  const hucre = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  if (!hucre) return;

  const deger = S.tahta[r][c];
  const jelVar = S.jel.has(`${r}:${c}`);
  const sekerMi = sekerVar(S.tahta, r, c);

  hucre.classList.toggle('jelly', jelVar);
  hucre.classList.toggle('playable', deger !== 'block');
  hucre.classList.toggle('block', deger === 'block');

  const mevcut = hucre.querySelector('.candy');

  // --- hiç şeker yoksa ---
  if (!sekerMi) {
    if (mevcut) mevcut.remove();
    hucre.classList.remove('dusuyor', 'selected');
    return;
  }

  const yeniSinif = sekerSinifi(deger.tip, deger.ozel);

  // --- aynı tipte şeker duruyorsa: sadece sınıfı tazele, elementi koru ---
  if (mevcut && mevcut.className === yeniSinif) {
    delete deger.yeni;
  } else {
    // --- farklı şeker: eskiyi (varsa) değiştir ---
    if (mevcut) mevcut.remove();
    const el = document.createElement('span');
    el.className = yeniSinif;
    el.dataset.tip = String(deger.tip);
    hucre.appendChild(el);
    delete deger.yeni;
  }

  // --- seçim vurgusu ---
  hucre.classList.toggle(
    'selected',
    !!S.secili && S.secili[0] === r && S.secili[1] === c
  );
}

/**
 * Tüm tahtayı çizer.
 *
 * AKICI SÜRÜM: elementleri tek tek gezmek yerine yalnızca gerçekten
 * değişen hücrelere dokunur. 8x8 tahtada her turda 64 DOM düğümü
 * yok edilip yeniden yaratılmaz — oyun "zıplamaz", akar.
 */
function tahtayiCiz() {
  for (let r = 0; r < S.tahta.length; r++) {
    for (let c = 0; c < S.tahta[0].length; c++) {
      hucreGuncelle(r, c);
    }
  }
}

/**
 * Yerçekimi sonrası düşme animasyonunu oynatır.
 *
 * FLIP yaklaşımı: önce her hücrenin şekerine "nereye düştüğü" bilgisi
 * verilir (satır farkına göre translateY başlangıcı), bir sonraki karede
 * sıfıra çekilir. Böylece şeker yukarıdan akarak yerine oturur ve düşme
 * mesafesi arttıkça animasyon da uzar — gerçek yerçekimi hissi.
 */
function dusmeAnimasyonu(oncekiSatirlar) {
  const board = $('#board');
  if (!board) return;

  const hareketli = [];
  for (let r = 0; r < S.tahta.length; r++) {
    for (let c = 0; c < S.tahta[0].length; c++) {
      const oncekiR = oncekiSatirlar[r]?.[c];
      if (oncekiR === undefined || oncekiR === r) continue;
      const hucre = board.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      const seker = hucre && hucre.querySelector('.candy');
      if (!seker) continue;
      hareketli.push({ seker, mesafe: r - oncekiR });
    }
  }

  if (hareketli.length === 0) return;

  // 1) başlangıç konumları (animasyonsuz)
  for (const { seker, mesafe } of hareketli) {
    seker.style.transition = 'none';
    seker.style.transform = `translateY(${-mesafe * 100}%)`;
    seker.style.opacity = mesafe > 1 ? '0' : '0.75';
  }

  // 2) bir sonraki karede hedefe süzülme (mesafeye göre süre)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const { seker, mesafe } of hareketli) {
        const sure = Math.min(420, 120 + mesafe * 70);
        seker.style.transition = `transform ${sure}ms cubic-bezier(.34,.02,.62,.99), opacity ${sure * 0.6}ms ease`;
        seker.style.transform = 'translateY(0)';
        seker.style.opacity = '1';
      }
    });
  });

  return Math.min(430, 130 + Math.max(...hareketli.map((h) => h.mesafe)) * 70);
}


/**
 * Tahta DOM ızgarasını kurar ve olay dinleyicilerini bağlar.
 * Hem fare (sürükle) hem dokunma desteklenir.
 */
function tahtaKur() {
  const board = $('#board');
  S.surukle = null; // tahta yeniden kurulurken yarım kalan sürükleme sıfırlanır
  board.innerHTML = '';
  izgaraAyarla(S.tahta[0].length);

  for (let r = 0; r < S.tahta.length; r++) {
    for (let c = 0; c < S.tahta[0].length; c++) {
      const hucre = document.createElement('div');
      hucre.className = 'cell';
      hucre.dataset.r = r;
      hucre.dataset.c = c;

      // NOT: Girdi olayları tahta (board) üzerinde TEK merkezi dinleyiciyle
      // yönetilir — aşağıdaki `girdiyiBagla()`. Böylece parmak bir hücreden
      // diğerine kaydığında olay kaybolmaz (pointer capture).

      board.appendChild(hucre);
    }
  }

  girdiyiBagla();
  tahtayiCiz();
}

// ==========================================================================
// GİRDİ MOTORU — dokunma + fare uyumlu sürükle-bırak
// ==========================================================================

/** Sürüklemenin başlaması için gereken en küçük parmak/fare mesafesi (px). */
const SURUKLEME_ESIGI = 6;

/** Koordinattan hücrenin [r, c] konumunu bulur (tahta içinde değilse null). */
function hucreKonumuBul(x, y) {
  const hucre = document.elementFromPoint(x, y);
  const hedef = hucre && hucre.classList.contains('cell') ? hucre : hucre && hucre.closest('.cell');
  if (!hedef) return null;
  const r = Number(hedef.dataset.r);
  const c = Number(hedef.dataset.c);
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
  return [r, c];
}

/**
 * Tahtanın tüm işaretçi girdilerini tek noktadan yönetir.
 *
 * Klasik "pointerup'ı hücreye bağla" yaklaşımı mobilde bozulur: parmak
 * başka hücreye kayınca yukarı kaldırma olayı başlangıç hücresine
 * ulaşmaz. Bu yüzden sürükleme, pointer capture ile tahta üzerinde
 * baştan sona takip edilir ve yön ANINDA (bırakmadan) belirlenir.
 */
function girdiyiBagla() {
  const board = $('#board');

  // ---- eşzamanlı çoklu dokunuşu engelle (tek aktif sürükleme) ----
  board.addEventListener('pointerdown', (ev) => {
    if (S.kilitli || S.bitti) return;
    if (S.surukle) return; // ikinci parmak yok sayılır
    if (ev.button !== undefined && ev.button !== 0 && ev.pointerType === 'mouse') return;

    const konum = hucreKonumuBul(ev.clientX, ev.clientY);
    if (!konum) return;
    const [r, c] = konum;
    if (S.tahta[r][c] === 'block') return;

    // ---- güçlendirici modu: sürükleme yok, tıklama yeter ----
    if (S.aktifBooster) {
      hucreTikla(r, c);
      return;
    }
    if (!sekerVar(S.tahta, r, c)) return;

    ev.preventDefault();
    try {
      board.setPointerCapture(ev.pointerId);
    } catch {
      /* capture desteklenmiyorsa pointerup yine de board'a düşer */
    }

    S.surukle = {
      r,
      c,
      kilit: null, // [nr, nc] — yön bir kez belirlenir
      baslaX: ev.clientX,
      baslaY: ev.clientY,
      pointerId: ev.pointerId,
    };

    // NOT: Seçim vurgusu burada YAPILMAZ. Seçimi yalnızca hucreTikla()
    // yönetir; aksi halde pointerdown'da set edilen seçim, hemen ardından
    // gelen pointerup → hucreTikla() tarafından "aynı hücreye tekrar
    // tıklandı" sanılıp iptal ediliyor ve TAKAS HİÇ GERÇEKLEŞMİYORDU
    // (hamle düşmüyor, eşleşme/puan oluşmuyordu). Bu yüzden burada
    // yalnızca sürükleme durumu kurulur.
  });

  // ---- parmak/fare hareketi: yön belirle ve canlı önizleme ----
  board.addEventListener('pointermove', (ev) => {
    const sur = S.surukle;
    if (!sur || sur.pointerId !== ev.pointerId) return;

    // zaten kilitlendiyse ekstra iş yapma
    if (sur.kilit) return;

    const dx = ev.clientX - sur.baslaX;
    const dy = ev.clientY - sur.baslaY;

    if (Math.hypot(dx, dy) < SURUKLEME_ESIGI) return; // titreme — henüz sürükleme değil

    // baskın eksene göre komşu hücreyi seç
    let nr = sur.r;
    let nc = sur.c;
    if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1;
    else nr += dy > 0 ? 1 : -1;

    // hedef geçerli mi? (tahta dışı / blok / boş → sürüklemeyi iptal et)
    if (
      nr < 0 ||
      nc < 0 ||
      nr >= S.tahta.length ||
      nc >= S.tahta[0].length ||
      S.tahta[nr][nc] === 'block' ||
      !sekerVar(S.tahta, nr, nc)
    ) {
      return;
    }

    sur.kilit = [nr, nc];
    onizlemeGuncelle(sur.r, sur.c, nr, nc);
  });

  // ---- bırakma: hamleyi uygula ----
  const birak = async (ev) => {
    const sur = S.surukle;
    if (!sur || sur.pointerId !== ev.pointerId) return;
    S.surukle = null;
    try {
      board.releasePointerCapture(ev.pointerId);
    } catch {
      /* yoksay */
    }
    onizlemeTemizle();

    const dx = ev.clientX - sur.baslaX;
    const dy = ev.clientY - sur.baslaY;

    // hiç sürüklenmediyse → normal tıklama akışı
    if (!sur.kilit && Math.hypot(dx, dy) < SURUKLEME_ESIGI) {
      await hucreTikla(sur.r, sur.c);
      return;
    }

    // bırakma anında yön henüz kilitlenmemişse burada çöz
    let hedef = sur.kilit;
    if (!hedef) {
      let nr = sur.r;
      let nc = sur.c;
      if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1;
      else nr += dy > 0 ? 1 : -1;
      hedef = [nr, nc];
    }

    const [nr, nc] = hedef;
    if (
      nr < 0 ||
      nc < 0 ||
      nr >= S.tahta.length ||
      nc >= S.tahta[0].length ||
      S.tahta[nr][nc] === 'block' ||
      !sekerVar(S.tahta, nr, nc)
    ) {
      S.secili = null;
      tahtayiCiz();
      return;
    }

    S.secili = null;
    await takasDene(sur.r, sur.c, nr, nc);
  };

  board.addEventListener('pointerup', birak);
  board.addEventListener('pointercancel', (ev) => {
    if (!S.surukle || S.surukle.pointerId !== ev.pointerId) return;
    S.surukle = null;
    onizlemeTemizle();
    S.secili = null;
    tahtayiCiz();
  });

  // ---- tarayıcı varsayılan sürükleme / kaydırmayı kapat ----
  board.addEventListener('dragstart', (ev) => ev.preventDefault());
  board.addEventListener('contextmenu', (ev) => ev.preventDefault());
}

/** Sürükleme sırasında kaynak/hedef hücreyi vurgular. */
function onizlemeGuncelle(r, c, nr, nc) {
  onizlemeTemizle();
  const kaynak = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  const hedef = document.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`);
  if (kaynak) kaynak.classList.add('surukleniyor');
  if (hedef) hedef.classList.add('hedef');
}

/** Sürükleme önizleme vurgularını kaldırır. */
function onizlemeTemizle() {
  $$('.cell.surukleniyor, .cell.hedef').forEach((el) => {
    el.classList.remove('surukleniyor', 'hedef');
  });
}

// ==========================================================================
// HUD / PANEL ÇİZİMİ
// ==========================================================================

function hudGuncelle() {
  $('#hudLevel').textContent = S.level.id;
  $('#hudScore').textContent = S.skor.toLocaleString('tr-TR');
  $('#hudMoves').textContent = S.hamle;
  $('.hud-moves')?.classList.toggle('danger', S.hamle <= 3);
}

function hedefleriCiz() {
  const kap = $('#goals');
  kap.innerHTML = '';

  const jelSayisi = S.jel.size;
  const durumlar = hedefDurumu(S.level, S.skor, S.sayac, jelSayisi);

  for (const d of durumlar) {
    const el = document.createElement('div');
    el.className = 'goal' + (d.tamam ? ' done' : '');

    let chipHtml = '';
    if (d.tip === 'collect' && d.renk !== undefined) {
      const sekiller = ['kare', 'daire', 'baklava', 'kare', 'daire', 'baklava'];
      chipHtml = `<span class="goal-chip ${sekiller[d.renk % 6]}" style="background:var(--t${d.renk})"></span>`;
    }

    el.innerHTML = `
      <div class="goal-top">
        ${chipHtml}
        <span class="goal-text">${d.etiket}</span>
        <span>${d.tamam ? '✓' : ''}</span>
      </div>
      <div class="goal-bar"><i style="width:${Math.round((d.ilerleme || 0) * 100)}%"></i></div>
    `;
    kap.appendChild(el);
  }
}

function boosterleriCiz() {
  const kap = $('#boosters');
  kap.innerHTML = '';

  const tanimlar = [
    { id: 'cekir', ikon: '🔨', ad: 'Çekiç' },
    { id: 'karistir', ikon: '🔀', ad: 'Karıştır' },
    { id: 'bomba', ikon: '💥', ad: 'Bomba' },
  ];

  for (const t of tanimlar) {
    const btn = document.createElement('button');
    btn.className = 'booster' + (S.aktifBooster === t.id ? ' active' : '');
    btn.disabled = S.booster[t.id] <= 0 || S.bitti;
    btn.innerHTML = `
      <span class="booster-icon">${t.ikon}</span>
      <span class="booster-name">${t.ad}</span>
      <span class="booster-count">${S.booster[t.id]}</span>
    `;
    btn.addEventListener('click', () => boosterSec(t.id));
    kap.appendChild(btn);
  }
}

function yildizCubuguGuncelle() {
  const yildizlar = S.level.yildizlar;
  const kazanilan = yildizHesapla(S.skor, yildizlar);

  $$('#starsTrack .star').forEach((el, i) => {
    el.classList.toggle('on', i < kazanilan);
  });

  // ilerleme çubuğu: 0 → 1. yıldız arası, sonra sonraki eşiklere göre
  const oncekiEsik = kazanilan === 0 ? 0 : yildizlar[kazanilan - 1];
  const sonrakiEsik = kazanilan >= 3 ? null : yildizlar[kazanilan];
  let oran = 1;
  if (sonrakiEsik !== null) {
    oran = (S.skor - oncekiEsik) / (sonrakiEsik - oncekiEsik);
  }
  $('#starsBar').style.width = Math.max(0, Math.min(1, oran)) * 100 + '%';

  const sonraki = sonrakiEsik;
  $('#starsNext').textContent =
    sonraki === null ? '3 yıldız! Maksimum.' : `Sonraki yıldız: ${sonraki.toLocaleString('tr-TR')}`;
}

function komboGoster(metin) {
  const el = $('#comboBanner');
  el.textContent = metin;
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth; // reflow — animasyonu yeniden başlat
  el.style.animation = '';
  setTimeout(() => {
    el.hidden = true;
  }, 900);
}

function puanUcusu(r, c, puan) {
  const hucre = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  if (!hucre) return;
  const kutu = hucre.getBoundingClientRect();

  const el = document.createElement('div');
  el.className = 'puan-ucusu';
  el.textContent = '+' + puan;
  el.style.left = kutu.left + kutu.width / 2 - 14 + 'px';
  el.style.top = kutu.top + 'px';
  el.style.position = 'fixed';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 820);
}

// ==========================================================================
// OYUN MANTIĞI — HAMLE
// ==========================================================================

/**
 * Hücre tıklamasını işler.
 * İki mod var:
 *   1) Güçlendirici aktifse → hedefe uygula
 *   2) Aksi halde → şeker seç / komşuyla takas et
 */
async function hucreTikla(r, c, zorlananKomsu = null) {
  if (S.kilitli || S.bitti) return;
  if (S.tahta[r][c] === 'block') return;

  // ---- güçlendirici modu ----
  if (S.aktifBooster) {
    await boosterUygula(S.aktifBooster, r, c);
    return;
  }

  if (!sekerVar(S.tahta, r, c)) return;

  // ---- sürükleme ile zorlanan komşu ----
  if (zorlananKomsu) {
    const [nr, nc] = zorlananKomsu;
    await takasDene(r, c, nr, nc);
    return;
  }

  // ---- tıklama akışı ----
  if (!S.secili) {
    S.secili = [r, c];
    sesCal('sec');
    tahtayiCiz();
    return;
  }

  const [sr, sc] = S.secili;

  // aynı hücreye tekrar tıklandı → seçimi kaldır
  if (sr === r && sc === c) {
    S.secili = null;
    tahtayiCiz();
    return;
  }

  // komşu mu?
  const komsu = Math.abs(sr - r) + Math.abs(sc - c) === 1;
  if (!komsu) {
    S.secili = [r, c];
    sesCal('sec');
    tahtayiCiz();
    return;
  }

  S.secili = null;
  await takasDene(sr, sc, r, c);
}

/**
 * İki komşu hücreyi takas etmeyi dener.
 * Eşleşme oluşmazsa takası geri alır (ceza yok — hamle harcanmaz).
 */
async function takasDene(r1, c1, r2, c2) {
  if (S.kilitli || S.bitti) return;

  const h1 = S.tahta[r1][c1];
  const h2 = S.tahta[r2][c2];
  if (h1 === 'block' || h2 === 'block' || !h1 || !h2) return;

  S.kilitli = true;

  // takası uygula
  takasEt(S.tahta, r1, c1, r2, c2);
  tahtayiCiz();
  // takasAnimasyonu kendi süresini bekler — ekstra bekle() ÇAĞIRMA (çakışma/takılma önlenir).
  await takasAnimasyonu(r1, c1, r2, c2);
  sesCal('takas');

  if (!eslesmeVarMi(S.tahta)) {
    // geçersiz hamle — şekerler yerine süzülerek geri döner (kısa nefes payı)
    await bekle(20);
    takasEt(S.tahta, r1, c1, r2, c2);
    tahtayiCiz();
    await takasAnimasyonu(r1, c1, r2, c2);
    sesCal('gecersiz');
    S.kilitli = false;
    return;
  }

  // geçerli hamle: hamle harca
  S.hamle--;
  hudGuncelle();

  await patlamaDongusu();

  // tahta tıkandıysa karıştır
  if (!hamleVarMi(S.tahta)) {
    await tahtayiKaristir();
  }

  S.kilitli = false;
  await bolumSonuKontrol();
}

/** Takas animasyonunun süresi (ms) — akıcı ama bekletmeyen tempo. */
const TAKAS_MS = 165;

/**
 * İki komşu hücrenin şekerlerini birbirine doğru KAYDIRARAK gösterir.
 *
 * Neden gerekli: `tahtayiCiz()` tahtayı anında günceller, ama kullanıcı
 * takası "kayarak yer değiştirme" olarak görmelidir. Burada iki şeker
 * ters yöne translate edilir, sonra sıfırlanır — böylece akış kesintisiz
 * ve "elle tutulur" hissi verir (Candy Crush takas hissi).
 */
async function takasAnimasyonu(r1, c1, r2, c2) {
  const board = $('#board');
  if (!board) return;

  const h1 = board.querySelector(`.cell[data-r="${r1}"][data-c="${c1}"] .candy`);
  const h2 = board.querySelector(`.cell[data-r="${r2}"][data-c="${c2}"] .candy`);
  if (!h1 && !h2) return;

  const dikey = r1 !== r2;
  const yon = dikey ? 1 : 0;
  const adim = dikey ? (r2 - r1) : (c2 - c1);
  const eksen = dikey ? 'Y' : 'X';

  // başlangıç: geriye doğru (henüz eski konumda gibi)
  for (const [el, kat] of [[h1, -adim], [h2, adim]]) {
    if (!el) continue;
    el.style.transition = 'none';
    el.style.transform = `translate${eksen}(${kat * 100}%)`;
    el.style.zIndex = '5';
  }

  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));

  for (const [el, kat] of [[h1, -adim], [h2, adim]]) {
    if (!el) continue;
    el.style.transition = `transform ${TAKAS_MS}ms cubic-bezier(.3,1.4,.6,1)`;
    el.style.transform = `translate${eksen}(0)`;
  }

  // KRİTİK: animasyonun FİİLEN bitmesini burada bekle. Aksi halde çağıran
  // taraf ayrıca bekle(TAKAS_MS) yapınca süreler çakışır ve takas "takılır".
  await bekle(TAKAS_MS);

  // süren elemanların geçişini temizle (bir sonraki tahtayiCiz ile çakışmasın)
  for (const [el] of [[h1], [h2]]) {
    if (!el) continue;
    el.style.zIndex = '';
  }

  void yon;
}

/**
 * Zincirleme patlama döngüsü — motor hesaplar, arayüz animasyonla oynatır.
 */
async function patlamaDongusu() {
  let tur = 0;
  const MAX_TUR = 25;

  while (tur < MAX_TUR) {
    const gruplar = eslesmeleriBul(S.tahta);
    if (gruplar.length === 0) break;

    // patlayacak tüm hücreler (özel şeker yayılımı dahil)
    const tumSet = new Set();
    for (const g of gruplar) {
      for (const [r, c] of g.hucreler) tumSet.add(`${r}:${c}`);
    }
    const yayilmis = patlamaYayilimi(
      S.tahta,
      [...tumSet].map((k) => k.split(':').map(Number))
    );
    yayilmis.forEach(([r, c]) => tumSet.add(`${r}:${c}`));

    const patlayanlar = [...tumSet].map((k) => k.split(':').map(Number));

    // --- patlama animasyonu (BAĞIMSIZ FX KATMANI) ---
    // Kök neden: daha önce patlayan şeker doğrudan hücrede animasyona
    // sokuluyor, ardından gelen tahtayiCiz() DOM'u sıfırlayıp animasyonu
    // YARIDA kesiyordu — oyun "takılıyor", efekt "anıt gibi" donuyordu.
    // Çözüm: patlayan şekerin bir KLONU fx katmanına taşınır; klon kendi
    // başına 300ms boyunca akıcı oynar, JS tahtayı istediği an çizebilir.
    patlayanlar.forEach(([r, c], i) => {
      const hucre = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      const seker = hucre?.querySelector('.candy');
      if (!seker) return;
      const gecikme = Math.min(i * 12, 90);

      const kutu = hucre.getBoundingClientRect();
      const boardKutu = board.getBoundingClientRect();

      // 1) klonu fx katmanına taşı — hücre çizimi artık onu etkilemez
      const klon = seker.cloneNode(true);
      klon.classList.remove('patliyor');
      klon.classList.add('fx-patliyor');
      klon.style.left = `${kutu.left - boardKutu.left}px`;
      klon.style.top = `${kutu.top - boardKutu.top}px`;
      klon.style.width = `${kutu.width}px`;
      klon.style.height = `${kutu.height}px`;
      klon.style.animationDelay = `${gecikme}ms`;
      fxKatmani().appendChild(klon);
      setTimeout(() => klon.remove(), PATLAMA_MS + gecikme + 60);

      // 2) halka efektini de fx katmanında bağımsız oynat
      const halka = document.createElement('span');
      halka.className = 'fx-ring';
      const pay = kutu.width * 0.12;
      halka.style.left = `${kutu.left - boardKutu.left + pay}px`;
      halka.style.top = `${kutu.top - boardKutu.top + pay}px`;
      halka.style.width = `${kutu.width - pay * 2}px`;
      halka.style.height = `${kutu.height - pay * 2}px`;
      halka.style.animationDelay = `${gecikme}ms`;
      fxKatmani().appendChild(halka);
      setTimeout(() => halka.remove(), 480 + gecikme + 60);

      // 3) gerçek şeker anında gizlenir (klon görsel görevi devralır)
      seker.style.visibility = 'hidden';
    });
    sesCal('patlama');
    // animasyonun GÖRSEL ritmi sürerken puan mantığı da ilerlesin:
    // PATLAMA_MS ile patla animasyonu (300ms) birebir hizalı.
    await bekle(PATLAMA_MS);

    // --- puan + sayaç + jel ---
    let turPuani = 0;
    const ozelDogacak = gruplar.filter((g) => g.ozel);

    for (const [r, c] of patlayanlar) {
      if (!sekerVar(S.tahta, r, c)) continue;
      const tip = S.tahta[r][c].tip;
      S.sayac[tip] = (S.sayac[tip] || 0) + 1;
      turPuani += 60;

      const k = `${r}:${c}`;
      if (S.jel.has(k)) S.jel.delete(k);

      S.tahta[r][c] = null;
    }

    // grup bonusları
    for (const g of gruplar) {
      if (g.yon === 'kare') {
        // KARE 4'lü: normal 4'lüden değerli. Anında patlar, tahtada kalmaz.
        turPuani += 500;
        continue;
      }
      if (g.uzunluk === 4) turPuani += 300;
      else if (g.uzunluk >= 5) turPuani += 600;
      if (g.yon === 'L') turPuani += 450;
    }

    // özel şekerleri yerleştir (patlamasın)
    // NOT: 'kare' özel şekeri ANINDA patlar (kullanıcı isteği) — yerleştirilmez.
    for (const g of ozelDogacak) {
      if (g.ozel === 'kare') continue;
      const [mr, mc] = g.merkez;
      if (!sekerVar(S.tahta, mr, mc)) continue;
      if (g.ozel === 'renkli') {
        S.tahta[mr][mc] = { tip: g.tip, ozel: 'renkli', hedefTip: g.tip };
      } else {
        S.tahta[mr][mc] = { tip: g.tip, ozel: g.ozel };
      }
    }

    // --- yerçekimi + yeni şeker ---
    // Düşme animasyonu için yerçekimi ÖNCESİ satır konumları saklanır.
    const oncekiSatirlar = sekerSatirlariniKaydet();
    yerCekimiUygula(S.tahta, () => Math.floor(Math.random() * TIP_SAYISI));

    // --- zincir çarpanı ---
    if (tur > 0) {
      const carpan = tur === 1 ? 1.5 : tur === 2 ? 2 : 2.5;
      turPuani = Math.round(turPuani * carpan);
      komboGoster(`ZİNCİR x${carpan}!`);
      sesCal('kombo');
    }

    S.skor += turPuani;
    if (patlayanlar.length > 0) {
      const [pr, pc] = patlayanlar[0];
      puanUcusu(pr, pc, turPuani);
    }

    hudGuncelle();
    hedefleriCiz();
    yildizCubuguGuncelle();
    tahtayiCiz();

    // --- gerçek düşme animasyonu (FLIP) ---
    const dusmeSuresi = dusmeAnimasyonu(oncekiSatirlar);
    await bekle(dusmeSuresi || DUSME_MS);

    tur++;
    await bekle(ZINCIR_ARASI_MS);
  }
}

/**
 * Patlama animasyonunun tamamlanması için beklenecek süre (ms).
 * CSS `.candy.patliyor` animasyonu (patla) 300ms — ikisi BİREBİR hizalı ki
 * DOM yeniden çizildiğinde animasyon YARIDA KESİLMESİN.
 */
const PATLAMA_MS = 300;

/**
 * Zincir turu arası ritim (ms).
 * "Anıtlar kalmış" geri bildiriminin kökü: tur başına 90ms ölü bekleme,
 * 5-6 turluk bir zincirde 500ms+ hissi veriyordu. 45ms'e çekildi —
 * cascade hâlâ okunabilir, akış kesintisiz.
 */
const ZINCIR_ARASI_MS = 45;

/** Düşme animasyonu için varsayılan süre (ms). */
const DUSME_MS = 200;

/** Yerçekimi öncesi her hücredeki şekerin satır konumunu saklar (FLIP için). */
function sekerSatirlariniKaydet() {
  const harita = [];
  for (let r = 0; r < S.tahta.length; r++) {
    harita[r] = [];
    for (let c = 0; c < S.tahta[0].length; c++) {
      harita[r][c] = sekerVar(S.tahta, r, c) ? r : undefined;
    }
  }
  return harita;
}

/**
 * Basit bekleme yardımcısı (kısa gecikmeler için).
 */
function bekle(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Tahtayı karıştırır ve eşleşme olmadığından emin olur. */
async function tahtayiKaristir() {
  komboGoster('KARIŞTIRILDI!');
  sesCal('booster');

  for (let r = 0; r < S.tahta.length; r++) {
    for (let c = 0; c < S.tahta[0].length; c++) {
      if (S.tahta[r][c] === 'block') continue;
      S.tahta[r][c] = null;
    }
  }
  tahtayiDoldur(S.tahta);
  tahtayiCiz();
  await bekle(320);
}

// ==========================================================================
// GÜÇLENDİRİCİLER
// ==========================================================================

function boosterSec(id) {
  if (S.kilitli || S.bitti) return;
  if (S.booster[id] <= 0) return;

  S.aktifBooster = S.aktifBooster === id ? null : id;
  S.secili = null;
  boosterleriCiz();
  tahtayiCiz();

  if (S.aktifBooster === 'cekir') komboGoster('ÇEKİÇ: şeker seç');
  if (S.aktifBooster === 'bomba') komboGoster('BOMBA: merkez seç');
}

async function boosterUygula(id, r, c) {
  if (S.kilitli || S.bitti) return;
  if (S.booster[id] <= 0) return;
  if (S.tahta[r][c] === 'block') return;

  S.kilitli = true;

  if (id === 'karistir') {
    S.booster.karistir--;
    S.aktifBooster = null;
    boosterleriCiz();
    await tahtayiKaristir();
    S.kilitli = false;
    return;
  }

  if (!sekerVar(S.tahta, r, c)) {
    S.kilitli = false;
    return;
  }

  // temizlenecek hücreleri belirle
  let hedefler = [];
  if (id === 'cekir') {
    hedefler = [[r, c]];
  } else if (id === 'bomba') {
    for (let rr = r - 1; rr <= r + 1; rr++) {
      for (let cc = c - 1; cc <= c + 1; cc++) {
        if (rr >= 0 && cc >= 0 && rr < S.tahta.length && cc < S.tahta[0].length) {
          if (sekerVar(S.tahta, rr, cc)) hedefler.push([rr, cc]);
        }
      }
    }
  }

  // patlama yayılımı (zincirleme özel şekerler)
  hedefler = patlamaYayilimi(S.tahta, hedefler);

  for (const [rr, cc] of hedefler) {
    const el = document.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"] .candy`);
    if (el) el.classList.add('patliyor');
  }
  sesCal('booster');
  await bekle(220);

  let puan = 0;
  for (const [rr, cc] of hedefler) {
    if (!sekerVar(S.tahta, rr, cc)) continue;
    const tip = S.tahta[rr][cc].tip;
    S.sayac[tip] = (S.sayac[tip] || 0) + 1;
    puan += 60;
    S.jel.delete(`${rr}:${cc}`);
    S.tahta[rr][cc] = null;
  }

  S.skor += puan;
  S.booster[id]--;
  S.aktifBooster = null;

  hudGuncelle();
  boosterleriCiz();
  hedefleriCiz();
  yildizCubuguGuncelle();

  yerCekimiUygula(S.tahta, () => Math.floor(Math.random() * TIP_SAYISI));
  tahtayiCiz();
  await bekle(160);

  await patlamaDongusu();
  if (!hamleVarMi(S.tahta)) await tahtayiKaristir();
  S.kilitli = false;

  await bolumSonuKontrol();
}

// ==========================================================================
// BÖLÜM AKIŞI
// ==========================================================================

/** Hedeflerin tamamı sağlandı mı? */
function hedeflerTamam() {
  const jelSayisi = S.jel.size;
  const durumlar = hedefDurumu(S.level, S.skor, S.sayac, jelSayisi);
  return durumlar.every((d) => d.tamam);
}

/** Bölüm bitip bitmediğini kontrol eder; bittiyse sonucu gösterir. */
async function bolumSonuKontrol() {
  if (S.bitti) return;

  const kazandi = hedeflerTamam();
  const hamleBitti = S.hamle <= 0;

  if (kazandi) {
    await bolumuBitir(true);
  } else if (hamleBitti) {
    await bolumuBitir(false);
  }
}

async function bolumuBitir(basarili) {
  S.bitti = true;
  S.kilitli = true;

  const yildiz = basarili ? yildizHesapla(S.skor, S.level.yildizlar) : 0;

  // ---- kaydı güncelle ----
  if (basarili) {
    const mevcut = S.kayit.yildizlar[S.level.id] || 0;
    if (yildiz > mevcut) S.kayit.yildizlar[S.level.id] = yildiz;

    const enIyi = S.kayit.enIyi[S.level.id] || 0;
    if (S.skor > enIyi) S.kayit.enIyi[S.level.id] = S.skor;

    // sonraki bölümü aç
    if (S.level.id + 1 > S.kayit.acikBolum && S.level.id < 20) {
      S.kayit.acikBolum = S.level.id + 1;
    }
    kayitSakla();
  }

  // ---- sunucuya skor gönder ----
  await skorGonder(S.level.id, 'Sen', S.skor, yildiz);

  sesCal(basarili ? 'kazan' : 'kaybet');

  // ---- sonuç modalı ----
  const yildizKap = $('#resultStars');
  yildizKap.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const sp = document.createElement('span');
    sp.textContent = '★';
    if (i <= yildiz) sp.className = 'on';
    yildizKap.appendChild(sp);
  }

  $('#resultTitle').textContent = basarili
    ? yildiz === 3
      ? 'Muhteşem! 🎉'
      : 'Bölüm Tamam!'
    : 'Hamleler Bitti';
  $('#resultScore').textContent = S.skor.toLocaleString('tr-TR');

  const btnNext = $('#btnNextLevel');
  const sonBolum = S.level.id >= 20;
  btnNext.hidden = !basarili || sonBolum;
  btnNext.textContent = 'Sonraki Bölüm →';

  $('#modalResult').hidden = false;
}

/** Bölümü yükler ve oyunu başlatır. */
async function bolumBaslat(id) {
  try {
    const veri = await bolumGetir(id);
    S.level = veri;

    // motor tahtasını kur: blok hücreleri koru, gerisini şekerle doldur
    S.tahta = tahtaOlustur(veri.satir, veri.sutun);
    for (let r = 0; r < veri.satir; r++) {
      for (let c = 0; c < veri.sutun; c++) {
        S.tahta[r][c] = veri.tahtaDuzeni?.[r]?.[c] === 'block' ? 'block' : null;
      }
    }
    tahtayiDoldur(S.tahta);

    // Başlangıçta hazır eşleşme olmasın.
    // DİKKAT: Burada tahtayiKaristir() KULLANILMAZ — o fonksiyon ses çalar,
    // "KARIŞTIRILDI!" bandı gösterir ve 320ms bekler. Bölüm açılışında bu
    // gereksizdir; döngü 30 tura kadar çıkınca oyun saniyelerce boş kalıyordu.
    // Burada DOM'a dokunmayan, sessiz bir yeniden doldurma yapılır;
    // tahta zaten tek seferde tahtaKur() ile çizilir.
    let guvenlik = 0;
    while (eslesmeVarMi(S.tahta) && guvenlik++ < 40) {
      for (let r = 0; r < S.tahta.length; r++) {
        for (let c = 0; c < S.tahta[0].length; c++) {
          if (S.tahta[r][c] === 'block') continue;
          S.tahta[r][c] = null;
        }
      }
      tahtayiDoldur(S.tahta);
    }

    // durum sıfırla
    S.jel = new Set(veri.jel || []);
    S.sayac = {};
    S.skor = 0;
    S.hamle = veri.hamle;
    S.secili = null;
    S.aktifBooster = null;
    S.bitti = false;
    S.kilitli = false;
    S.kombo = 0;
    S.booster = boosterPaketi(veri.id);

    ekranGoster('game');
    $('#btnHome').hidden = false;

    tahtaKur();
    hudGuncelle();
    hedefleriCiz();
    boosterleriCiz();
    yildizCubuguGuncelle();
  } catch (hata) {
    // alert() headless/otomasyon ortamlarında JS'i kilitler; hatayı logla + ekranda göster
    console.error('[NumexCandy] Bolum yuklenemedi:', hata);
    const kutu = document.getElementById('baslatHata');
    if (kutu) {
      kutu.hidden = false;
      kutu.textContent = 'Bölüm yüklenemedi: ' + hata.message;
    }
  }
}

// ==========================================================================
// EKRAN / MENÜ
// ==========================================================================

function ekranGoster(ad) {
  $$('.screen').forEach((el) => el.classList.remove('active'));
  const hedef = { menu: '#screenMenu', levels: '#screenLevels', game: '#screenGame' }[ad];
  $(hedef)?.classList.add('active');

  $('#hud').hidden = ad !== 'game';
  $('#btnHome').hidden = ad === 'menu';
  $('#modalResult').hidden = true;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function menuyuGuncelle() {
  $('#statStars').textContent = toplamYildiz();
  $('#statLevel').textContent = S.kayit.acikBolum;
  $('#statBest').textContent = enIyiPuan().toLocaleString('tr-TR');
}

function bolumleriCiz() {
  const kap = $('#levelsGrid');
  kap.innerHTML = '';

  let tamamlanan = 0;

  for (let i = 1; i <= 20; i++) {
    const acik = i <= S.kayit.acikBolum;
    const yildiz = S.kayit.yildizlar[i] || 0;
    if (yildiz > 0) tamamlanan++;

    const kart = document.createElement('button');
    kart.className = 'level-card' + (acik ? '' : ' locked') + (yildiz > 0 ? ' completed' : '');
    kart.disabled = !acik;

    let yildizHtml = '';
    if (acik) {
      yildizHtml = '<span class="level-stars">';
      for (let s = 1; s <= 3; s++) {
        yildizHtml += s <= yildiz ? '★' : '<span class="off">★</span>';
      }
      yildizHtml += '</span>';
    }

    kart.innerHTML = acik
      ? `<span class="level-num">${i}</span>${yildizHtml}`
      : `<span class="level-lock">🔒</span>`;

    kart.title = acik ? `Bölüm ${i}` : 'Kilitli — önceki bölümü bitir';
    kart.addEventListener('click', () => bolumBaslat(i));
    kap.appendChild(kart);
  }

  $('#levelsProgress').textContent = `${tamamlanan} / 20 tamamlandı`;
}

/** Skor tablosu modalını açar. */
async function skorTablosuAc() {
  const kayitlar = await skorTablosuGetir(S.level.id);
  const kap = $('#leaderboardList');
  kap.innerHTML = '';

  if (kayitlar.length === 0) {
    kap.innerHTML = '<li class="bos">Henüz skor kaydı yok.</li>';
  } else {
    kayitlar.forEach((k, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${k.isim}</span>
        <span class="lb-score">${k.skor.toLocaleString('tr-TR')}</span>
      `;
      kap.appendChild(li);
    });
  }

  $('#modalBoard').hidden = false;
}

// ==========================================================================
// OLAY BAĞLAMA + BAŞLATMA
// ==========================================================================

function olaylariBagla() {
  // ana menü
  $('#btnPlay').addEventListener('click', () => {
    const id = S.kayit.acikBolum;
    bolumBaslat(id);
  });
  $('#btnLevels').addEventListener('click', () => {
    bolumleriCiz();
    ekranGoster('levels');
  });
  $('#btnLevelsBack').addEventListener('click', () => {
    menuyuGuncelle();
    ekranGoster('menu');
  });

  // üst bar
  $('#btnHome').addEventListener('click', () => {
    if (S.kilitli && !S.bitti) return;
    menuyuGuncelle();
    ekranGoster('menu');
  });

  $('#btnSound').addEventListener('click', (ev) => {
    S.ses = !S.ses;
    ev.currentTarget.classList.toggle('off', !S.ses);
    ev.currentTarget.textContent = S.ses ? '🔊' : '🔇';
    if (S.ses) sesCal('sec');
  });

  // oyun içi
  $('#btnRestart').addEventListener('click', () => {
    if (S.level) {
      $('#modalResult').hidden = true;
      bolumBaslat(S.level.id);
    }
  });

  $('#btnQuit').addEventListener('click', () => {
    menuyuGuncelle();
    ekranGoster('menu');
  });

  // sonuç modalı
  $('#btnNextLevel').addEventListener('click', () => {
    const sonraki = Math.min(20, S.level.id + 1);
    $('#modalResult').hidden = true;
    bolumBaslat(sonraki);
  });

  $('#btnRetry').addEventListener('click', () => {
    $('#modalResult').hidden = true;
    bolumBaslat(S.level.id);
  });

  $('#btnResultMenu').addEventListener('click', () => {
    $('#modalResult').hidden = true;
    menuyuGuncelle();
    ekranGoster('menu');
  });

  $('#btnCloseBoard').addEventListener('click', () => {
    $('#modalBoard').hidden = true;
  });

  // klavye kısayolları
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      S.secili = null;
      S.aktifBooster = null;
      boosterleriCiz();
      if (S.tahta.length) tahtayiCiz();
    }
    if (ev.key === 'r' && ev.ctrlKey && S.level) {
      ev.preventDefault();
      bolumBaslat(S.level.id);
    }
  });

  // pencere yeniden boyutlanınca tahtayı koru (oransal olduğu için sadece çiz)
  window.addEventListener('resize', () => {
    if (S.level && !$('#screenGame').hidden) tahtayiCiz();
  });
}

/** Uygulamayı başlatır. */
function baslat() {
  kayitYukle();
  olaylariBagla();
  menuyuGuncelle();
  ekranGoster('menu');
}

baslat();