/* =========================================================
   NUMEX CORE — Flow Engine
   Uygulama: editör, kalıcılık, süreli bağlantı, geçmiş, olaylar
   ========================================================= */

import { DUGUM_TIPLERI, ISLEMLER, OPLAR, jsonDene } from "./dugumler.js";
import { Motor, grafiDogrula, baglantiDurumu, baglantiSinifi, UYARI_ESIGI_MS } from "./motor.js";

/* ---------- DURUM ---------- */
const DEPO_ANAHTAR = "numex_flow_akis";
const DEPO_GECMIS = "numex_flow_gecmis";
const GECMIS_LIMIT = 30;

let graf = yukleVeyaOrnek();
let seciliId = null;
let seciliBaglantiId = null;
let motor = new Motor();
let sonCalisma = null;
let panX = 0, panY = 0, zoom = 1;
let aktifDugumler = new Set();
let saatZamani = null; // geri sayım tik'i

/* ---------- ÖRNEK AKIŞ ---------- */
function ornekGraf() {
  return {
    id: "ornek",
    ad: "Numex Örnek Akış",
    dugumler: [
      { id: "n1", tip: "baslat", ad: "Başlat", x: 40, y: 260, ayar: { metin: "" } },
      { id: "n2", tip: "json", ad: "JSON", x: 288, y: 260, ayar: { json: '{\n  "customer": "Numex",\n  "amount": 2500,\n  "status": "paid"\n}' } },
      { id: "n3", tip: "filtre", ad: "Filtre", x: 536, y: 260, ayar: { hepsi: true, kosullar: [{ alan: "status", op: "=", deger: "paid" }] } },
      { id: "n4", tip: "donustur", ad: "Dönüştür", x: 784, y: 260, ayar: { islemler: [{ hedef: "total", islem: "yuzdeEkle", deger: 20, kaynak: "amount" }] } },
      { id: "n5", tip: "sonuc", ad: "Sonuç", x: 1032, y: 260, ayar: { bicim: "json" } }
    ],
    baglantilar: [
      { id: "b1", kaynak: "n1", hedef: "n2" },
      { id: "b2", kaynak: "n2", hedef: "n3" },
      { id: "b3", kaynak: "n3", hedef: "n4" },
      { id: "b4", kaynak: "n4", hedef: "n5" }
    ]
  };
}

/* ---------- SÜRELİ BAĞLANTI YARDIMCILARI ---------- */
/** Bağlantının türünü uygular: sure = saniye | "kalici" */
function baglantiSuresiAyarla(b, saniyeVeyaKalici) {
  if (saniyeVeyaKalici === "kalici" || saniyeVeyaKalici === null || saniyeVeyaKalici === undefined) {
    delete b.sure;
    delete b.bitis;
    return;
  }
  const sn = Number(saniyeVeyaKalici);
  if (!Number.isFinite(sn) || sn <= 0) return;
  const simdi = Date.now();
  b.sure = sn;
  b.bitis = simdi + sn * 1000; // bitiş zamanı epoch ms olarak SAKLANIR
}

function kalanSaniye(b, simdi = Date.now()) {
  const d = baglantiDurumu(b, simdi);
  if (d.kalanMs === null) return null;
  return Math.max(0, d.kalanMs / 1000);
}

function kalanMetni(ms) {
  if (ms <= 0) return "süre doldu";
  if (ms < 10000) return (ms / 1000).toFixed(1) + " sn";
  return Math.ceil(ms / 1000) + " sn";
}

/* ---------- YARDIMCILAR ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const benzersizId = p => p + "_" + Math.random().toString(36).slice(2, 8);
const yeniId = () => "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function yukleVeyaOrnek() {
  try {
    const ham = localStorage.getItem(DEPO_ANAHTAR);
    if (ham) {
      const g = JSON.parse(ham);
      if (g && Array.isArray(g.dugumler) && Array.isArray(g.baglantilar)) {
        // Süreli bağlantılar: bitiş zamanı diskte tutulduğu için kalan süre kendiliğinden doğru;
        // süresi dolmuş olanlar yüklendiğinde geçersiz doğar, aktif hâle gelmez.
        return g;
      }
    }
  } catch {}
  return ornekGraf();
}

function kaydet(sessiz = false) {
  try {
    localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(graf));
    $("kayitDurum").textContent = "Kaydedildi";
    $("kayitDurum").classList.remove("kirli");
    if (!sessiz) toast("Akış kaydedildi", "basari");
  } catch {
    $("kayitDurum").textContent = "Kaydedilemedi";
    toast("Kaydedilemedi: depolama sınırı?", "hata");
  }
}

function kirli() {
  $("kayitDurum").textContent = "Kayıt bekliyor";
  $("kayitDurum").classList.add("kirli");
}

function toast(mesaj, tip = "") {
  const t = $("toast");
  t.textContent = mesaj;
  t.className = "toast gorunur " + tip;
  clearTimeout(t._z);
  t._z = setTimeout(() => t.classList.remove("gorunur"), 2800);
}

/* =========================================================
   PALET
   ========================================================= */
function paletCiz() {
  const p = $("palet");
  p.innerHTML = "";
  for (const [tip, tanim] of Object.entries(DUGUM_TIPLERI)) {
    const div = document.createElement("div");
    div.className = "palet-oge";
    div.dataset.tip = tip;
    div.draggable = true;
    div.innerHTML = `
      <div class="palet-ikon" style="background:${tanim.renk}20;color:${tanim.renk};border:1px solid ${tanim.renk}40">${esc(tanim.ikon)}</div>
      <div style="flex:1">
        <div class="palet-ad">${esc(tanim.ad)}</div>
        <div class="palet-aciklama">${esc(tanim.aciklama)}</div>
      </div>`;
    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/dugum-tip", tip);
      e.dataTransfer.effectAllowed = "copy";
    });
    div.addEventListener("dblclick", () => {
      const kutu = $("tuvalKap").getBoundingClientRect();
      const { x, y } = ekrandanTuvala(kutu.left + kutu.width / 2, kutu.top + kutu.height / 2);
      dugumEkle(tip, x - 104, y - 40);
    });
    p.appendChild(div);
  }
}

/* =========================================================
   TUVAL: KOORDİNAT, PAN, ZOOM
   ========================================================= */
function ekrandanTuvala(ex, ey) {
  const k = $("tuvalKap").getBoundingClientRect();
  return { x: (ex - k.left - panX) / zoom, y: (ey - k.top - panY) / zoom };
}

function tuvaliUygula() {
  $("tuval").style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  $("izgara").style.backgroundSize = `${22 * zoom}px ${22 * zoom}px`;
  $("izgara").style.backgroundPosition = `${panX}px ${panY}px`;
  $("zoomYuzde").textContent = Math.round(zoom * 100) + "%";
}

function sigdir() {
  if (!graf.dugumler.length) { panX = 0; panY = 0; zoom = 1; tuvaliUygula(); return; }
  const k = $("tuvalKap").getBoundingClientRect();
  const KART_G = 208, KART_Y = 88;
  const pay = 48;
  const minX = Math.min(...graf.dugumler.map(d => d.x)) - pay;
  const maxX = Math.max(...graf.dugumler.map(d => d.x + KART_G)) + pay;
  const minY = Math.min(...graf.dugumler.map(d => d.y)) - pay;
  const maxY = Math.max(...graf.dugumler.map(d => d.y + KART_Y)) + pay;
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const yeniZoom = Math.min(k.width / w, k.height / h, 1);
  zoom = Math.max(0.35, Math.min(1, yeniZoom));
  panX = (k.width - w * zoom) / 2 - minX * zoom;
  panY = (k.height - h * zoom) / 2 - minY * zoom;
  tuvaliUygula();
}

/* =========================================================
   DÜĞÜM EKLEME / SİLME
   ========================================================= */
function dugumEkle(tip, x, y, ayarOverride) {
  const tanim = DUGUM_TIPLERI[tip];
  if (!tanim) return;
  const id = yeniId();
  const dugum = {
    id, tip,
    ad: tanim.ad,
    x: Math.round(x), y: Math.round(y),
    ayar: JSON.parse(JSON.stringify(ayarOverride ?? tanim.varsayilan ?? {}))
  };
  graf.dugumler.push(dugum);
  seciliId = id;
  seciliBaglantiId = null;
  ciz();
  kirli();
  return dugum;
}

function dugumSil(id) {
  graf.dugumler = graf.dugumler.filter(d => d.id !== id);
  graf.baglantilar = graf.baglantilar.filter(b => b.kaynak !== id && b.hedef !== id);
  if (seciliId === id) seciliId = null;
  ciz();
  kirli();
}

function baglantiSil(id) {
  graf.baglantilar = graf.baglantilar.filter(b => b.id !== id);
  if (seciliBaglantiId === id) seciliBaglantiId = null;
  ciz();
  kirli();
}

/* =========================================================
   DÜĞÜM KARTLARI
   ========================================================= */
function dugumOzet(dugum) {
  const tanim = DUGUM_TIPLERI[dugum.tip];
  try { return tanim.ozet(dugum.ayar || {}); } catch { return ""; }
}

function kartCiz(dugum) {
  const tanim = DUGUM_TIPLERI[dugum.tip];
  const el = document.createElement("div");
  el.className = "dugum";
  el.dataset.id = dugum.id;
  el.style.left = dugum.x + "px";
  el.style.top = dugum.y + "px";
  if (seciliId === dugum.id) el.classList.add("secili");

  const durum = dugum._durum;
  if (durum) el.classList.add(durum);
  if (aktifDugumler.has(dugum.id)) el.classList.add("calisiyor");

  const ozet = dugumOzet(dugum);
  let icerik = `
    <div class="dugum-ust">
      <div class="dugum-ikon" style="background:${tanim.renk}1f;color:${tanim.renk};border:1px solid ${tanim.renk}40">${esc(tanim.ikon)}</div>
      <div class="dugum-ad">${esc(dugum.ad || tanim.ad)}</div>
      <div class="dugum-durum ${durum || ""}"></div>
    </div>
    <div class="dugum-govde">
      <div class="dugum-ozet">${esc(ozet || tanim.aciklama)}</div>`;

  if (dugum.tip === "sonuc" && dugum._cikti !== undefined) {
    const c = dugum._cikti;
    if (c && typeof c === "object" && !Array.isArray(c)) {
      const satirlar = Object.entries(c).slice(0, 4).map(([k, v]) =>
        `<div class="dugum-sonuc-satir"><span>${esc(k)}</span><span>${esc(typeof v === "object" ? JSON.stringify(v) : String(v))}</span></div>`
      ).join("");
      icerik += `<div style="margin-top:6px">${satirlar}</div>`;
    } else {
      icerik += `<div class="kod-kutu" style="margin-top:6px;max-height:70px;font-size:10.5px">${esc(typeof c === "object" ? JSON.stringify(c, null, 2) : String(c ?? "—"))}</div>`;
    }
  }

  if (durum === "basarili" && dugum._sure !== undefined) {
    icerik += `<div class="dugum-gecikme"><span class="rozet">${dugum._sure} ms</span>${dugum._gecti === false ? '<span class="rozet ret">engellendi</span>' : ""}</div>`;
  } else if (durum === "atlandi") {
    icerik += `<div class="dugum-gecikme"><span class="rozet atla">atlandı</span></div>`;
  }
  icerik += `</div>`;

  if (dugum.tip !== "baslat") icerik += `<div class="nokta nokta-giris" data-nokta="giris" data-id="${dugum.id}" title="Giriş"></div>`;
  icerik += `<div class="nokta nokta-cikis" data-nokta="cikis" data-id="${dugum.id}" title="Çıkış"></div>`;

  if (durum === "hatali" && dugum._hata) {
    icerik += `<div class="dugum-uyari" title="${esc(dugum._hata)}">!</div>`;
  }

  el.innerHTML = icerik;

  el.addEventListener("mousedown", e => {
    if (e.target.classList.contains("nokta")) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    seciliId = dugum.id;
    seciliBaglantiId = null;
    secimGuncelle();

    const baslaX = e.clientX, baslaY = e.clientY;
    const ox = dugum.x, oy = dugum.y;
    let tasindi = false;
    el.classList.add("surukleniyor");

    const hareket = ev => {
      const dx = (ev.clientX - baslaX) / zoom;
      const dy = (ev.clientY - baslaY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 2) tasindi = true;
      dugum.x = Math.round(ox + dx);
      dugum.y = Math.round(oy + dy);
      el.style.left = dugum.x + "px";
      el.style.top = dugum.y + "px";
      baglantilariCiz();
    };
    const birak = () => {
      document.removeEventListener("mousemove", hareket);
      document.removeEventListener("mouseup", birak);
      el.classList.remove("surukleniyor");
      if (tasindi) kirli();
    };
    document.addEventListener("mousemove", hareket);
    document.addEventListener("mouseup", birak);
  });

  return el;
}

function kartlariCiz() {
  const kat = $("dugumKatman");
  kat.innerHTML = "";
  for (const d of graf.dugumler) kat.appendChild(kartCiz(d));
  sayaclariGuncelle();
}

function sayaclariGuncelle() {
  const sureli = graf.baglantilar.filter(b => b.sure !== undefined).length;
  $("sayacMetin").textContent = `${graf.dugumler.length} düğüm · ${graf.baglantilar.length} bağlantı${sureli ? ` (${sureli} süreli)` : ""}`;
}

/* =========================================================
   BAĞLANTILAR
   ========================================================= */
const DUGUM_W = 208;

function dugumNokta(dugum, tur) {
  const y = dugum.y + 50;
  const x = tur === "cikis" ? dugum.x + DUGUM_W : dugum.x;
  return { x, y };
}

function bezier(x1, y1, x2, y2) {
  const dx = Math.max(50, Math.abs(x2 - x1) * 0.55);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** Bezier eğrisinin orta noktası (etiket yerleşimi için) */
function egriOrta(x1, y1, x2, y2) {
  const dx = Math.max(50, Math.abs(x2 - x1) * 0.55);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Kabaca orta: kontrol noktaları yatay olduğu için eğri ortası dikeyde iki uç ortalamasıdır
  void dx;
  return { x: mx, y: my };
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Bağlantının ANLIK görsel durumu (kalan süreye göre) */
function hatGorselDurumu(b, simdi) {
  const d = baglantiDurumu(b, simdi);
  if (!d.sureli) return { sinif: "kalici", etiket: null, kalanMs: null };
  const sinif = baglantiSinifi(d.kalanMs);
  return { sinif, etiket: kalanMetni(d.kalanMs), kalanMs: d.kalanMs };
}

function baglantilariCiz() {
  const g = $("baglantilar");
  const ge = $("baglantiEtiketler");
  g.innerHTML = "";
  ge.innerHTML = "";
  const harita = new Map(graf.dugumler.map(d => [d.id, d]));
  const simdi = Date.now();

  for (const b of graf.baglantilar) {
    const k = harita.get(b.kaynak);
    const h = harita.get(b.hedef);
    if (!k || !h) continue;
    const p1 = dugumNokta(k, "cikis");
    const p2 = dugumNokta(h, "giris");
    const d = bezier(p1.x, p1.y, p2.x, p2.y);
    const gorsel = hatGorselDurumu(b, simdi);

    // Görünmez kalın tıklama çizgisi
    const vurus = document.createElementNS(SVG_NS, "path");
    vurus.setAttribute("d", d);
    vurus.setAttribute("class", "baglanti-genis");
    vurus.dataset.bid = b.id;
    vurus.addEventListener("mousedown", e => { e.stopPropagation(); });
    vurus.addEventListener("click", e => {
      e.stopPropagation();
      seciliBaglantiId = b.id;
      seciliId = null;
      ciz();
    });
    vurus.addEventListener("dblclick", e => {
      e.stopPropagation();
      baglantiSil(b.id);
      toast("Bağlantı silindi", "uyari");
    });

    const yol = document.createElementNS(SVG_NS, "path");
    yol.setAttribute("d", d);
    yol.setAttribute("class", "baglanti");
    yol.dataset.bid = b.id;

    // Öncelik: süreli bağlantının canlı rengi (turkuaz → sarı → kırmızı)
    if (gorsel.sinif === "aktif") {
      yol.classList.add("aktif");
      yol.setAttribute("marker-end", "url(#okUcuAktif)");
    } else if (gorsel.sinif === "uyari") {
      yol.classList.add("uyari");
      yol.setAttribute("marker-end", "url(#okUcuUyari)");
    } else if (gorsel.sinif === "doldu") {
      // NUMEX-DÜZELTME (2026-11-14): Süreli ve dolmuş hatta aynı anda 'doldu' + 'hata' sınıfı ekleniyordu; çizgi hem kırmızı-kesikli hem kırmızı-noktalı iki stille çizilip ok ucu iki kez biniyordu (ekranda çift ok, üst üste etiket). Süre durumu kesinleşince çalışma işaretleri temizleniyor.
      // NUMEX: süreli hattın rengi süre durumundan gelir; çalışma sonrası _hata işareti
      // ekran üzerine eklenirse aynı hatta iki ok ucu (doldu+ret) binip çizgi çiftleniyordu.
      // Bu yüzden süreli durum belirlendikten sonra _hata/_aktif sınıfları UYGULANMAZ.
      yol.classList.add("doldu");
      yol.setAttribute("marker-end", "url(#okUcuDoldu)");
      delete b._aktif;
      delete b._hata;
    } else {
      // Kalıcı bağlantı: çalışma durumuna göre
      yol.setAttribute("marker-end", "url(#okUcu)");
      if (b._aktif) { yol.classList.add("aktif"); yol.setAttribute("marker-end", "url(#okUcuAktif)"); }
      if (b._hata) { yol.classList.add("hata"); yol.setAttribute("marker-end", "url(#okUcuRet)"); }
    }
    if (seciliBaglantiId === b.id) yol.classList.add("secili");

    g.appendChild(vurus);
    g.appendChild(yol);

    // Kalan süre etiketi
    if (gorsel.etiket !== null) {
      const orta = egriOrta(p1.x, p1.y, p2.x, p2.y);
      const grup = document.createElementNS(SVG_NS, "g");
      grup.setAttribute("class", "hat-etiket");

      const genislik = Math.max(46, gorsel.etiket.length * 6.4 + 14);
      const dikdortgen = document.createElementNS(SVG_NS, "rect");
      dikdortgen.setAttribute("x", orta.x - genislik / 2);
      dikdortgen.setAttribute("y", orta.y - 9);
      dikdortgen.setAttribute("width", genislik);
      dikdortgen.setAttribute("height", 18);
      dikdortgen.setAttribute("fill", gorsel.sinif === "doldu" ? "rgba(229,72,77,.18)" : gorsel.sinif === "uyari" ? "rgba(255,209,102,.16)" : "rgba(45,212,191,.16)");
      dikdortgen.setAttribute("stroke", gorsel.sinif === "doldu" ? "#e5484d" : gorsel.sinif === "uyari" ? "#ffd166" : "#2dd4bf");
      dikdortgen.setAttribute("stroke-width", "1");

      const yazi = document.createElementNS(SVG_NS, "text");
      yazi.setAttribute("x", orta.x);
      yazi.setAttribute("y", orta.y + 0.5);
      yazi.setAttribute("fill", gorsel.sinif === "doldu" ? "#ff9a9c" : gorsel.sinif === "uyari" ? "#ffd166" : "#7ff0e2");
      yazi.textContent = gorsel.etiket;

      grup.appendChild(dikdortgen);
      grup.appendChild(yazi);
      ge.appendChild(grup);
    }
  }
}

/* ---------- GERİ SAYIM ---------- */
function saatDongusuBaslat() {
  if (saatZamani) return;
  saatZamani = setInterval(() => {
    if (!document.hidden) baglantilariCiz();
  }, 200);
}

/* =========================================================
   SEÇİM & SAĞ PANEL
   ========================================================= */
function secimGuncelle() {
  document.querySelectorAll(".dugum").forEach(el => {
    el.classList.toggle("secili", el.dataset.id === seciliId);
  });
  ayarPaneliCiz();
  baglantilariCiz();
}

function ayarPaneliCiz() {
  const k = $("ayarIcerik");
  const alt = $("ayarAlt");

  const d = graf.dugumler.find(x => x.id === seciliId);
  if (!d) {
    if (seciliBaglantiId) {
      const b = graf.baglantilar.find(x => x.id === seciliBaglantiId);
      if (!b) { seciliBaglantiId = null; }
      const kaynak = graf.dugumler.find(x => x.id === b?.kaynak);
      const hedef = graf.dugumler.find(x => x.id === b?.hedef);
      const durum = hatGorselDurumu(b || {}, Date.now());
      k.innerHTML = `
        <div class="ayar-baslik-satir">
          <div class="palet-ikon" style="background:#5b8cff20;color:#5b8cff;border:1px solid #5b8cff40">→</div>
          <div class="ayar-baslik-metin"><h3>Bağlantı</h3><small>${esc(kaynak?.ad || "?")} → ${esc(hedef?.ad || "?")}</small></div>
        </div>
        <div class="alan">
          <label>Bağlantı Türü</label>
          <select id="baglantiTurSecim">
            <option value="kalici" ${!b?.sure ? "selected" : ""}>Kalıcı bağlantı</option>
            <option value="10" ${b?.sure === 10 ? "selected" : ""}>10 saniyelik bağlantı</option>
            <option value="30" ${b?.sure === 30 ? "selected" : ""}>30 saniyelik bağlantı</option>
            <option value="60" ${b?.sure === 60 ? "selected" : ""}>60 saniyelik bağlantı</option>
            <option value="ozel" ${b?.sure && ![10, 30, 60].includes(b.sure) ? "selected" : ""}>Özel süre…</option>
          </select>
        </div>
        <div class="alan" id="ozelSureAlan" ${b?.sure && ![10, 30, 60].includes(b.sure) ? "" : "hidden"}>
          <label>Süre (saniye)</label>
          <input type="number" id="baglantiOzelSure" min="1" max="86400" value="${b?.sure && ![10, 30, 60].includes(b.sure) ? b.sure : 15}">
        </div>
        <div class="alan">
          <label>Durum</label>
          <div style="font-size:12px;color:${durum.sinif === "doldu" ? "#ff9a9c" : durum.sinif === "uyari" ? "#ffd166" : "#7ff0e2"}">
            ${!b?.sure ? "Kalıcı — süre sınırı yok" :
              durum.sinif === "doldu" ? "Süresi doldu — bu hattan veri geçmez" :
              `Kalan süre: ${durum.etiket}`}
          </div>
          <div class="yardim">${b?.bitis ? "Bitiş: " + new Date(b.bitis).toLocaleString("tr-TR") : ""}</div>
        </div>
        <p class="yardim" style="font-size:11.5px">Süreli bağlantı kurulduğu andan itibaren geri sayar. Süresi dolan bağlantı kırmızıya döner ve veri taşımaz.</p>`;
      alt.hidden = false;
      $("btnDugumSil").textContent = "Bağlantıyı Sil";
      $("btnDugumSil").onclick = () => { baglantiSil(seciliBaglantiId); };

      if (b) {
        const secim = $("baglantiTurSecim");
        const ozelKap = $("ozelSureAlan");
        secim.addEventListener("change", () => {
          const v = secim.value;
          if (v === "ozel") { ozelKap.hidden = false; return; }
          ozelKap.hidden = true;
          baglantiSuresiAyarla(b, v === "kalici" ? "kalici" : Number(v));
          kirli();
          ayarPaneliCiz();
          baglantilariCiz();
          toast(v === "kalici" ? "Bağlantı kalıcı yapıldı" : `Bağlantı ${v} saniyelik yapıldı`, "basari");
        });
        $("baglantiOzelSure").addEventListener("change", e => {
          const sn = Math.max(1, Math.min(86400, Number(e.target.value) || 1));
          baglantiSuresiAyarla(b, sn);
          kirli();
          ayarPaneliCiz();
          baglantilariCiz();
          toast(`Bağlantı ${sn} saniyelik yapıldı`, "basari");
        });
      }
      return;
    }
    k.innerHTML = `<div class="bos-ayar"><div class="bos-ikon">◫</div><p>Bir düğüm seçin</p><small>Ayarları burada düzenlenir.</small></div>`;
    alt.hidden = true;
    return;
  }

  const tanim = DUGUM_TIPLERI[d.tip];
  k.innerHTML = `
    <div class="ayar-baslik-satir">
      <div class="palet-ikon" style="background:${tanim.renk}20;color:${tanim.renk};border:1px solid ${tanim.renk}40">${esc(tanim.ikon)}</div>
      <div class="ayar-baslik-metin"><h3>${esc(d.ad || tanim.ad)}</h3><small>Tip: ${esc(tanim.ad)}</small></div>
    </div>`;

  alanMetin(k, "Düğüm Adı", d.ad || tanim.ad, v => { d.ad = v; kartYenile(d.id); kirli(); }, "", false);

  for (const a of tanim.ayarlar || []) {
    if (a.tip === "metin" || a.tip === "text") {
      alanMetin(k, a.etiket, d.ayar[a.anahtar] ?? "", v => { d.ayar[a.anahtar] = v; kartYenile(d.id); kirli(); }, a.yardim);
    } else if (a.tip === "textarea" || a.tip === "json") {
      alanMetin(k, a.etiket, d.ayar[a.anahtar] ?? "", v => { d.ayar[a.anahtar] = v; kartYenile(d.id); kirli(); }, a.yardim, true, a.tip === "json");
    } else if (a.tip === "number") {
      alanSayi(k, a.etiket, d.ayar[a.anahtar] ?? 0, v => { d.ayar[a.anahtar] = v; kartYenile(d.id); kirli(); }, a.min, a.max, a.yardim);
    } else if (a.tip === "select") {
      alanSecim(k, a.etiket, d.ayar[a.anahtar], a.secenekler, v => { d.ayar[a.anahtar] = v; kartYenile(d.id); kirli(); }, a.yardim);
    } else if (a.tip === "kosullar") {
      alanKosullar(k, d);
    } else if (a.tip === "islemler") {
      alanIslemler(k, d);
    }
  }

  if (d._cikti !== undefined || d._hata || d._girdi !== undefined) {
    const on = document.createElement("div");
    on.className = "onizleme";
    let ic = `<h4>Son Çalışma</h4>`;
    if (d._girdi !== undefined && d.tip !== "baslat") {
      ic += `<div class="kutu-etiket">Giriş</div><pre class="kod-kutu">${esc(kisaDeger(d._girdi))}</pre>`;
    }
    if (d._cikti !== undefined) {
      ic += `<div class="kutu-etiket">Çıkış</div><pre class="kod-kutu">${esc(kisaDeger(d._cikti, d.ayar?.bicim))}</pre>`;
    }
    if (d._hata) ic += `<div class="kutu-etiket">Hata</div><pre class="kod-kutu hata">${esc(d._hata)}</pre>`;
    if (d._not) ic += `<div class="kutu-etiket">Not</div><div style="font-size:11.5px;color:var(--metin-soluk)">${esc(d._not)}</div>`;
    if (d._sure !== undefined) ic += `<div style="font-size:11px;color:var(--metin-soluk-2);margin-top:8px">Süre: ${d._sure} ms</div>`;
    on.innerHTML = ic;
    k.appendChild(on);
  }

  alt.hidden = false;
  $("btnDugumSil").textContent = "Düğümü Sil";
  $("btnDugumSil").onclick = () => { dugumSil(d.id); toast("Düğüm silindi", "uyari"); };
}

function kisaDeger(v, bicim = "kod") {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "string") return v;
  if (bicim === "metin") return (typeof v === "object") ? JSON.stringify(v, null, 2) : String(v);
  return JSON.stringify(v, null, 2);
}

function alanMetin(kap, etiket, deger, degisince, yardim, cokSatir = true, jsonKontrol = false) {
  const alan = document.createElement("div");
  alan.className = "alan";
  alan.innerHTML = `<label>${esc(etiket)}</label>
    ${cokSatir ? `<textarea rows="3">${esc(deger)}</textarea>` : `<input type="text" value="${esc(deger)}">`}
    ${yardim ? `<div class="yardim">${esc(yardim)}</div>` : ""}`;
  const giris = alan.querySelector("textarea, input");
  giris.addEventListener("input", () => {
    const v = giris.value;
    if (jsonKontrol) {
      const r = jsonDene(v);
      giris.classList.toggle("hata", !!r.hata);
    }
    degisince(v);
  });
  kap.appendChild(alan);
}

function alanSayi(kap, etiket, deger, degisince, min, max, yardim) {
  const alan = document.createElement("div");
  alan.className = "alan";
  alan.innerHTML = `<label>${esc(etiket)}</label>
    <input type="number" value="${esc(deger)}" ${min !== undefined ? `min="${min}"` : ""} ${max !== undefined ? `max="${max}"` : ""}>
    ${yardim ? `<div class="yardim">${esc(yardim)}</div>` : ""}`;
  const giris = alan.querySelector("input");
  giris.addEventListener("input", () => {
    let v = Number(giris.value);
    if (isNaN(v)) v = 0;
    degisince(v);
  });
  kap.appendChild(alan);
}

function alanSecim(kap, etiket, deger, secenekler, degisince, yardim) {
  const alan = document.createElement("div");
  alan.className = "alan";
  const opts = secenekler.map(s => {
    const d2 = typeof s === "object" ? s.deger : s;
    const y = typeof s === "object" ? s.yazi : s;
    return `<option value="${esc(d2)}" ${String(deger) === String(d2) ? "selected" : ""}>${esc(y)}</option>`;
  }).join("");
  alan.innerHTML = `<label>${esc(etiket)}</label><select>${opts}</select>
    ${yardim ? `<div class="yardim">${esc(yardim)}</div>` : ""}`;
  const s = alan.querySelector("select");
  s.addEventListener("change", () => {
    let v = s.value;
    if (v === "true") v = true;
    if (v === "false") v = false;
    if (secenekler.some(o => typeof o === "object" && typeof o.deger === "number")) {
      const sayi = Number(s.value);
      if (!isNaN(sayi)) v = sayi;
    }
    degisince(v);
  });
  kap.appendChild(alan);
}

/* ---------- KOŞULLAR ---------- */
function alanKosullar(kap, dugum) {
  const alan = document.createElement("div");
  alan.className = "alan";
  alan.innerHTML = `<label>Koşullar</label>`;
  const liste = document.createElement("div");

  const ciz = () => {
    liste.innerHTML = "";
    (dugum.ayar.kosullar || []).forEach((k, i) => {
      const satir = document.createElement("div");
      satir.className = "kosul-satiri";
      satir.innerHTML = `
        <input type="text" value="${esc(k.alan ?? "")}" placeholder="alan (ör. status)">
        <select>
          ${Object.entries(OPLAR).map(([op, o]) => `<option value="${esc(op)}" ${k.op === op ? "selected" : ""}>${esc(o.ad)}</option>`).join("")}
        </select>
        <input type="text" value="${esc(k.deger ?? "")}" placeholder="değer">
        <button class="kosul-sil" title="Sil" style="grid-column:1/-1;justify-self:end">×</button>`;
      const [iAlan, iOp, iDeger] = satir.querySelectorAll("input, select");
      iAlan.addEventListener("input", () => { k.alan = iAlan.value; kartYenile(dugum.id); kirli(); });
      iOp.addEventListener("change", () => { k.op = iOp.value; kartYenile(dugum.id); kirli(); });
      iDeger.addEventListener("input", () => { k.deger = iDeger.value; kartYenile(dugum.id); kirli(); });
      satir.querySelector(".kosul-sil").addEventListener("click", () => {
        dugum.ayar.kosullar.splice(i, 1);
        ciz(); kartYenile(dugum.id); kirli();
      });
      liste.appendChild(satir);
    });

    const ekle = document.createElement("button");
    ekle.className = "ekle-satir";
    ekle.textContent = "+ Koşul Ekle";
    ekle.addEventListener("click", () => {
      dugum.ayar.kosullar = dugum.ayar.kosullar || [];
      dugum.ayar.kosullar.push({ alan: "", op: "=", deger: "" });
      ciz(); kartYenile(dugum.id); kirli();
    });
    liste.appendChild(ekle);
  };
  ciz();
  alan.appendChild(liste);
  kap.appendChild(alan);
}

/* ---------- İŞLEMLER ---------- */
function alanIslemler(kap, dugum) {
  const alan = document.createElement("div");
  alan.className = "alan";
  alan.innerHTML = `<label>Veri İşlemleri</label>`;
  const liste = document.createElement("div");

  const ciz = () => {
    liste.innerHTML = "";
    const islemListesi = dugum.ayar.islemler || [];
    islemListesi.forEach((i, idx) => {
      const satir = document.createElement("div");
      satir.className = "kosul-satiri";
      satir.style.gridTemplateColumns = "1fr 1fr 70px";
      satir.innerHTML = `
        <input type="text" value="${esc(i.hedef ?? "")}" placeholder="alan (ör. total)">
        <select>
          ${Object.entries(ISLEMLER).map(([k, o]) => `<option value="${esc(k)}" ${i.islem === k ? "selected" : ""}>${esc(o.ad)}</option>`).join("")}
        </select>
        <input type="text" value="${esc(i.deger ?? "")}" placeholder="değer">
        <button class="kosul-sil" title="Sil" style="grid-column:1/-1;justify-self:end">×</button>`;
      const [pHedef, sIslem, pDeger] = satir.querySelectorAll("input, select");
      pHedef.addEventListener("input", () => { i.hedef = pHedef.value; kartYenile(dugum.id); kirli(); });
      sIslem.addEventListener("change", () => { i.islem = sIslem.value; kartYenile(dugum.id); kirli(); });
      pDeger.addEventListener("input", () => { i.deger = pDeger.value; kartYenile(dugum.id); kirli(); });
      satir.querySelector(".kosul-sil").addEventListener("click", () => {
        islemListesi.splice(idx, 1);
        ciz(); kartYenile(dugum.id); kirli();
      });
      liste.appendChild(satir);
    });

    const ekle = document.createElement("button");
    ekle.className = "ekle-satir";
    ekle.textContent = "+ İşlem Ekle";
    ekle.addEventListener("click", () => {
      dugum.ayar.islemler = dugum.ayar.islemler || [];
      dugum.ayar.islemler.push({ hedef: "", islem: "sabit", deger: "" });
      ciz(); kartYenile(dugum.id); kirli();
    });
    liste.appendChild(ekle);
  };
  ciz();
  alan.appendChild(liste);
  kap.appendChild(alan);
}

function kartYenile(id) {
  const d = graf.dugumler.find(x => x.id === id);
  if (!d) return;
  const eski = document.querySelector(`.dugum[data-id="${id}"]`);
  if (!eski) return;
  eski.replaceWith(kartCiz(d));
  baglantilariCiz();
}

/* =========================================================
   ANA ÇİZİM
   ========================================================= */
function ciz() {
  kartlariCiz();
  baglantilariCiz();
  ayarPaneliCiz();
  secimGuncelle();
  tuvaliUygula();
  sayaclariGuncelle();
}

/* =========================================================
   ÇALIŞTIRMA
   ========================================================= */
function dugumDurumlariniTemizle() {
  for (const d of graf.dugumler) {
    delete d._durum; delete d._hata; delete d._cikti; delete d._girdi; delete d._not; delete d._sure; delete d._gecti;
  }
  aktifDugumler.clear();
  for (const b of graf.baglantilar) { delete b._aktif; delete b._hata; }
}

function durumMetni(durum) {
  return { basarili: "Başarılı", kismen: "Kısmen başarılı", basarisiz: "Başarısız", iptal: "Durduruldu" }[durum] || durum;
}

async function calistir() {
  if (motor.calisiyor) { toast("Zaten çalışan bir akış var", "uyari"); return; }

  const dogrulama = grafiDogrula(graf);
  if (!dogrulama.gecerli) {
    dugumDurumlariniTemizle();
    for (const h of dogrulama.hatalar) {
      if (h.dugumler) for (const id of h.dugumler) {
        const d = graf.dugumler.find(x => x.id === id);
        if (d) d._durum = "hatali";
      }
      if (h.baglantiId) {
        const b = graf.baglantilar.find(x => x.id === h.baglantiId);
        if (b) b._hata = true;
      }
    }
    ciz();
    $("durumMetin").textContent = "Graf doğrulama hatası";
    $("durumNokta").className = "durum-nokta hatali";
    $("akistaDurum").textContent = dogrulama.hatalar[0]?.mesaj || "Graf hatası";
    toast(dogrulama.hatalar[0]?.mesaj || "Akış çalıştırılamaz", "hata");
    return;
  }

  dugumDurumlariniTemizle();
  ciz();

  $("btnCalistir").disabled = true;
  $("btnDurdur").disabled = false;
  $("durumMetin").textContent = "Çalışıyor…";
  $("durumNokta").className = "durum-nokta calisiyor";
  $("akistaDurum").textContent = "Çalışıyor…";

  const km = new Map(graf.dugumler.map(d => [d.id, d]));

  try {
    const sonuc = await motor.calistir(
      { dugumler: graf.dugumler, baglantilar: graf.baglantilar },
      {
        dugumBasliyor(id, girdi) {
          const d = km.get(id);
          if (!d) return;
          d._durum = "calisiyor";
          d._girdi = girdi;
          aktifDugumler.add(id);
          kartYenile(id);
          baglantilariCiz();
          $("durumMetin").textContent = `${d.ad || DUGUM_TIPLERI[d.tip].ad} çalışıyor…`;
        },
        dugumBitti(id, sonucD, ms) {
          const d = km.get(id);
          if (!d) return;
          d._durum = "basarili";
          d._cikti = sonucD.deger;
          d._not = sonucD.not;
          d._gecti = sonucD.gecti;
          d._sure = ms;
          aktifDugumler.delete(id);
          kartYenile(id);
          baglantilariCiz();
        },
        dugumAtlandi(id, neden) {
          const d = km.get(id);
          if (!d) return;
          d._durum = "atlandi";
          d._not = neden;
          aktifDugumler.delete(id);
          kartYenile(id);
          baglantilariCiz();
        },
        dugumHata(id, mesaj) {
          const d = km.get(id);
          if (!d) return;
          d._durum = "hatali";
          d._hata = mesaj;
          aktifDugumler.delete(id);
          kartYenile(id);
          baglantilariCiz();
        },
        baglantiSuresiDoldu(hat) {
          toast(`Bağlantı süresi doldu — ${hat.id} üzerinden veri geçmedi`, "uyari");
        }
      }
    );

    sonCalisma = sonuc;
    durumBilgisi(sonuc);
    gecmiseEkle(sonuc);

    const dolanSayisi = (sonuc.suresiDolanBaglantilar || []).length;
    toast(
      dolanSayisi
        ? `${durumMetni(sonuc.durum)} · ${dolanSayisi} süresi dolmuş bağlantı engellendi`
        : sonuc.hatalar.length ? `${durumMetni(sonuc.durum)} · ${sonuc.hatalar.length} hata` : `${durumMetni(sonuc.durum)} · ${sonuc.toplamMs} ms`,
      dolanSayisi || sonuc.hatalar.length ? "uyari" : "basari"
    );
    $("durumMetin").textContent = `${durumMetni(sonuc.durum)} · ${sonuc.toplamMs} ms`;
    $("durumNokta").className = "durum-nokta " + (sonuc.hatalar.length ? "hatali" : "basarili");
    $("akistaDurum").textContent = dolanSayisi
      ? `Süresi dolmuş ${dolanSayisi} bağlantı veri taşımadı`
      : sonuc.hatalar.length
        ? `Hata: ${sonuc.hatalar[0].mesaj}`
        : `${sonuc.dugumler.filter(d => d.durum === "basarili").length} düğüm başarılı · ${sonuc.toplamMs} ms`;
  } catch (e) {
    $("durumMetin").textContent = "Hata: " + e.message;
    $("durumNokta").className = "durum-nokta hatali";
    $("akistaDurum").textContent = "Motor hatası";
    toast("Motor hatası: " + e.message, "hata");
  } finally {
    $("btnCalistir").disabled = false;
    $("btnDurdur").disabled = true;
    ayarPaneliCiz();
    baglantilariCiz();
  }
}

function durumBilgisi(sonuc) {
  const durumHarita = new Map(sonuc.dugumler.map(x => [x.id, x]));
  for (const b of graf.baglantilar) {
    const hedefR = durumHarita.get(b.hedef);
    const kaynakR = durumHarita.get(b.kaynak);
    if (hedefR && hedefR.durum === "basarili" && kaynakR && kaynakR.durum === "basarili") {
      b._aktif = true; delete b._hata;
    } else if (hedefR && (hedefR.durum === "hatali" || hedefR.durum === "atlandi")) {
      b._hata = true; delete b._aktif;
    } else {
      delete b._aktif; delete b._hata;
    }
  }
  for (const d of graf.dugumler) {
    const r = durumHarita.get(d.id);
    if (r) d._durum = r.durum;
    if (r?.hata) d._hata = r.hata;
    if (r?.sureMs !== undefined) d._sure = r.sureMs;
  }
  baglantilariCiz();
}

/* =========================================================
   GEÇMİŞ
   ========================================================= */
function gecmisOku() {
  try { return JSON.parse(localStorage.getItem(DEPO_GECMIS) || "[]"); } catch { return []; }
}

function gecmisYaz(liste) {
  try { localStorage.setItem(DEPO_GECMIS, JSON.stringify(liste.slice(0, GECMIS_LIMIT))); } catch {}
}

function gecmiseEkle(sonuc) {
  const liste = gecmisOku();
  const kayit = {
    id: benzersizId("c"),
    tarih: new Date().toISOString(),
    durum: sonuc.durum,
    toplamMs: sonuc.toplamMs,
    dugumSayisi: sonuc.dugumler.length,
    hataSayisi: sonuc.hatalar.length,
    adimlar: sonuc.dugumler.map(r => {
      const d = graf.dugumler.find(x => x.id === r.id);
      return { id: r.id, ad: d ? (d.ad || DUGUM_TIPLERI[d.tip].ad) : r.id, tip: d?.tip, durum: r.durum, sureMs: r.sureMs, hata: r.hata || r.not };
    })
  };
  liste.unshift(kayit);
  gecmisYaz(liste);
  gecmisCiz();
}

function gecmisCiz() {
  const liste = gecmisOku();
  const kap = $("gecmisListe");
  $("gecmisDetay").hidden = true;
  if (!liste.length) {
    kap.innerHTML = `<div class="gecmis-bos">Henüz çalışma geçmişi yok.</div>`;
    return;
  }
  kap.innerHTML = "";
  liste.forEach((k, i) => {
    const el = document.createElement("div");
    el.className = "gecmis-oge";
    el.dataset.i = i;
    const saat = new Date(k.tarih).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const renk = k.hataSayisi ? "hatali" : "basarili";
    el.innerHTML = `
      <div class="gecmis-satir1">
        <span class="dugum-durum ${renk}"></span>
        <span style="flex:1">${saat} · ${durumMetni(k.durum)}</span>
      </div>
      <div class="gecmis-satir2">
        <span>${k.dugumSayisi} düğüm</span>
        <span>${k.toplamMs} ms</span>
        ${k.hataSayisi ? `<span style="color:#ff9a9c">${k.hataSayisi} hata</span>` : ""}
      </div>`;
    el.addEventListener("click", () => {
      kap.querySelectorAll(".gecmis-oge").forEach(x => x.classList.remove("secili"));
      el.classList.add("secili");
      gecmisDetay(k);
    });
    kap.appendChild(el);
  });
}

function gecmisDetay(k) {
  const detay = $("gecmisDetay");
  detay.hidden = false;
  detay.innerHTML = `
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--metin-soluk-2);margin-bottom:10px">Adımlar</div>
    ${k.adimlar.map(a => `
      <div class="gecmis-adim ${esc(a.durum)}">
        <div class="gecmis-adim-ad">
          <span>${esc(a.ad)}</span>
          <small>${a.sureMs ?? 0} ms</small>
        </div>
        ${a.hata ? `<div style="color:#ff9a9c;font-size:11px;margin-top:2px">${esc(a.hata)}</div>` : ""}
      </div>`).join("")}`;
}

/* =========================================================
   OLAYLAR
   ========================================================= */
function seciliBaglantiTuru() {
  const v = $("baglantiTuru").value;
  if (v === "kalici") return "kalici";
  if (v === "ozel") {
    const sn = Math.max(1, Math.min(86400, Number($("ozelSure").value) || 1));
    return sn;
  }
  return Number(v);
}

function olaylariBagla() {
  const kap = $("tuvalKap");

  // Bağlantı türü seçici
  $("baglantiTuru").addEventListener("change", () => {
    $("ozelSureKap").hidden = $("baglantiTuru").value !== "ozel";
  });

  // Pan
  kap.addEventListener("mousedown", e => {
    if (e.target !== kap && e.target.id !== "izgara" && e.target.id !== "tuval" && e.target.tagName !== "svg") return;
    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      seciliId = null; seciliBaglantiId = null; secimGuncelle();
      kap.classList.add("pan-tutuyor");
      const bx = e.clientX, by = e.clientY;
      const opx = panX, opy = panY;
      const hareket = ev => {
        panX = opx + (ev.clientX - bx);
        panY = opy + (ev.clientY - by);
        tuvaliUygula();
      };
      const birak = () => {
        document.removeEventListener("mousemove", hareket);
        document.removeEventListener("mouseup", birak);
        kap.classList.remove("pan-tutuyor");
      };
      document.addEventListener("mousemove", hareket);
      document.addEventListener("mouseup", birak);
    }
  });

  // Zoom
  kap.addEventListener("wheel", e => {
    e.preventDefault();
    const k = kap.getBoundingClientRect();
    const mx = e.clientX - k.left, my = e.clientY - k.top;
    const eskiZoom = zoom;
    const carpan = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const yeniZoom = Math.max(0.15, Math.min(2.5, eskiZoom * carpan));
    const tuvalX = (mx - panX) / eskiZoom;
    const tuvalY = (my - panY) / eskiZoom;
    panX = mx - tuvalX * yeniZoom;
    panY = my - tuvalY * yeniZoom;
    zoom = yeniZoom;
    tuvaliUygula();
  }, { passive: false });

  // Paletden bırakma
  kap.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
  kap.addEventListener("drop", e => {
    e.preventDefault();
    const tip = e.dataTransfer.getData("text/dugum-tip");
    if (!tip) return;
    const p = ekrandanTuvala(e.clientX, e.clientY);
    dugumEkle(tip, p.x - 104, p.y - 50);
    toast(`${DUGUM_TIPLERI[tip].ad} eklendi`, "basari");
  });

  // Bağlantı çizme (çıkış noktasından giriş noktasına)
  kap.addEventListener("mousedown", e => {
    const n = e.target.closest(".nokta");
    if (!n || n.dataset.nokta !== "cikis") return;
    e.preventDefault(); e.stopPropagation();
    const id = n.dataset.id;
    const d = graf.dugumler.find(x => x.id === id);
    if (!d) return;
    const p1 = dugumNokta(d, "cikis");
    const p = ekrandanTuvala(e.clientX, e.clientY);
    kap.classList.add("baglaniyor");
    const gecici = $("geciciCizgi");
    gecici.setAttribute("d", bezier(p1.x, p1.y, p.x, p.y));

    const hareket = ev => {
      const pp = ekrandanTuvala(ev.clientX, ev.clientY);
      gecici.setAttribute("d", bezier(p1.x, p1.y, pp.x, pp.y));
      document.querySelectorAll(".nokta").forEach(x => x.classList.remove("hedef"));
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const hedefNokta = el?.closest(".nokta");
      if (hedefNokta && hedefNokta.dataset.nokta === "giris" && hedefNokta.dataset.id !== id) hedefNokta.classList.add("hedef");
    };
    const birak = ev => {
      document.removeEventListener("mousemove", hareket);
      document.removeEventListener("mouseup", birak);
      kap.classList.remove("baglaniyor");
      gecici.setAttribute("d", "");
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const hedefNokta = el?.closest(".nokta");
      document.querySelectorAll(".nokta").forEach(x => x.classList.remove("hedef"));

      if (hedefNokta && hedefNokta.dataset.nokta === "giris") {
        const hedefId = hedefNokta.dataset.id;
        if (hedefId === id) { toast("Düğüm kendine bağlanamaz", "hata"); return; }
        if (graf.baglantilar.some(b => b.kaynak === id && b.hedef === hedefId)) {
          toast("Bu bağlantı zaten var", "uyari"); return;
        }
        const test = { dugumler: graf.dugumler, baglantilar: [...graf.baglantilar, { id: "test", kaynak: id, hedef: hedefId }] };
        const v = grafiDogrula(test);
        if (!v.gecerli) { toast("Döngü oluşur — bağlantı reddedildi", "hata"); return; }

        const tur = seciliBaglantiTuru();
        const yeniBaglanti = { id: benzersizId("b"), kaynak: id, hedef: hedefId };
        baglantiSuresiAyarla(yeniBaglanti, tur);
        graf.baglantilar.push(yeniBaglanti);
        ciz(); kirli();
        toast(
          yeniBaglanti.sure ? `Süreli bağlantı oluşturuldu — ${yeniBaglanti.sure} sn geri sayım başladı` : "Kalıcı bağlantı oluşturuldu",
          "basari"
        );
      }
    };
    document.addEventListener("mousemove", hareket);
    document.addEventListener("mouseup", birak);
  });

  // Klavye
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $("baglamMenu").hidden = true;
      seciliId = null; seciliBaglantiId = null; secimGuncelle();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (document.activeElement?.matches("input, textarea, select")) return;
      if (seciliBaglantiId) { baglantiSil(seciliBaglantiId); toast("Bağlantı silindi", "uyari"); }
      else if (seciliId) { dugumSil(seciliId); toast("Düğüm silindi", "uyari"); }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); calistir(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); kaydet(); }
  });

  // Sağ tık menüsü
  let baglamKonum = { x: 0, y: 0 };
  kap.addEventListener("contextmenu", e => {
    e.preventDefault();
    const k = kap.getBoundingClientRect();
    baglamKonum = ekrandanTuvala(e.clientX, e.clientY);
    const menu = $("baglamMenu");
    menu.hidden = false;
    menu.style.left = Math.min(e.clientX - k.left, k.width - 210) + "px";
    menu.style.top = Math.min(e.clientY - k.top, k.height - 330) + "px";
    const liste = $("baglamListe");
    liste.innerHTML = "";
    for (const [tip, t] of Object.entries(DUGUM_TIPLERI)) {
      const o = document.createElement("div");
      o.className = "baglam-oge";
      o.innerHTML = `<span class="nokta-renk" style="background:${t.renk}"></span><span>${esc(t.ad)}</span>`;
      o.addEventListener("click", () => {
        dugumEkle(tip, baglamKonum.x, baglamKonum.y);
        menu.hidden = true;
        toast(`${t.ad} eklendi`, "basari");
      });
      liste.appendChild(o);
    }
  });
  document.addEventListener("mousedown", e => {
    if (!e.target.closest(".baglam-menu")) $("baglamMenu").hidden = true;
  });

  // Araç çubuğu
  $("btnCalistir").addEventListener("click", calistir);
  $("btnDurdur").addEventListener("click", () => { motor.durdur(); toast("Durdurma isteği gönderildi", "uyari"); });
  $("btnKaydet").addEventListener("click", () => kaydet());
  $("btnOrnek").addEventListener("click", () => {
    if (!confirm("Hazır örnek akış yüklenecek ve mevcut akışın yerine geçecek. Devam?")) return;
    graf = ornekGraf();
    seciliId = null; seciliBaglantiId = null;
    dugumDurumlariniTemizle();
    ciz(); kaydet(true); sigdir();
    toast("Örnek akış yüklendi", "basari");
  });
  $("btnTemizle").addEventListener("click", () => {
    if (!confirm("Tuval temizlenecek. Emin misin?")) return;
    graf = { id: "bos", ad: "Boş Akış", dugumler: [], baglantilar: [] };
    seciliId = null; seciliBaglantiId = null;
    ciz(); kaydet(true);
    toast("Tuval temizlendi", "uyari");
  });
  $("btnDisari").addEventListener("click", disariAktar);
  $("btnIceri").addEventListener("click", () => $("dosyaGirdi").click());
  $("dosyaGirdi").addEventListener("change", e => iceriAktar(e));

  $("btnYakinlastir").addEventListener("click", () => { zoom = Math.min(2.5, zoom * 1.2); tuvaliUygula(); });
  $("btnUzaklastir").addEventListener("click", () => { zoom = Math.max(0.15, zoom / 1.2); tuvaliUygula(); });
  $("btnSigdir").addEventListener("click", sigdir);
  $("btnCerceve").addEventListener("click", sigdir);

  // Sekmeler
  document.querySelectorAll(".sekme").forEach(s => {
    s.addEventListener("click", () => {
      document.querySelectorAll(".sekme").forEach(x => x.classList.remove("aktif"));
      s.classList.add("aktif");
      const ad = s.dataset.sekme;
      $("sekmeAyarlar").hidden = ad !== "ayarlar";
      $("sekmeGecmis").hidden = ad !== "gecmis";
      if (ad === "gecmis") gecmisCiz();
    });
  });
  $("btnGecmisTemizle").addEventListener("click", () => {
    if (!confirm("Tüm çalışma geçmişi silinsin mi?")) return;
    gecmisYaz([]); gecmisCiz();
    toast("Geçmiş temizlendi", "uyari");
  });
}

/* =========================================================
   DIŞA / İÇE AKTARMA
   ========================================================= */
function disariAktar() {
  const veri = {
    surum: 2,
    olusturma: new Date().toISOString(),
    ad: graf.ad || "Numex Akışı",
    dugumler: graf.dugumler.map(d => ({ id: d.id, tip: d.tip, ad: d.ad, x: d.x, y: d.y, ayar: d.ayar })),
    // bitiş zamanı da dışa aktarılır: başka tarayıcıda açıldığında kalan süre doğru hesaplanır
    baglantilar: graf.baglantilar.map(b => ({
      id: b.id, kaynak: b.kaynak, hedef: b.hedef,
      ...(b.sure !== undefined ? { sure: b.sure, bitis: b.bitis } : {})
    }))
  };
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `numex-akis-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Akış JSON olarak dışa aktarıldı", "basari");
}

function iceriAktar(e) {
  const dosya = e.target.files?.[0];
  e.target.value = "";
  if (!dosya) return;
  const okuyucu = new FileReader();
  okuyucu.onload = ev => {
    try {
      const v = JSON.parse(ev.target.result);
      const hata = iceriDogrula(v);
      if (hata) { toast("İçe aktarma hatası: " + hata, "hata"); return; }
      graf = {
        id: v.id || "ice",
        ad: v.ad || "İçe Aktarılan Akış",
        dugumler: v.dugumler.map(d => ({
          id: String(d.id), tip: d.tip,
          ad: d.ad || DUGUM_TIPLERI[d.tip]?.ad || d.tip,
          x: Number(d.x) || 0, y: Number(d.y) || 0,
          ayar: d.ayar || {}
        })),
        baglantilar: v.baglantilar.map(b => {
          const yeni = { id: String(b.id) || benzersizId("b"), kaynak: String(b.kaynak), hedef: String(b.hedef) };
          if (b.sure !== undefined && Number.isFinite(Number(b.bitis))) {
            yeni.sure = Number(b.sure);
            yeni.bitis = Number(b.bitis);
          }
          return yeni;
        })
      };
      seciliId = null; seciliBaglantiId = null;
      dugumDurumlariniTemizle();
      ciz(); sigdir(); kaydet(true);
      toast(`${graf.dugumler.length} düğüm içe aktarıldı`, "basari");
    } catch (err) {
      toast("Geçersiz JSON dosyası: " + err.message, "hata");
    }
  };
  okuyucu.readAsText(dosya);
}

function iceriDogrula(v) {
  if (!v || typeof v !== "object") return "kök bir nesne değil";
  if (!Array.isArray(v.dugumler)) return "'dugumler' dizisi eksik";
  if (!Array.isArray(v.baglantilar)) return "'baglantilar' dizisi eksik";
  for (const d of v.dugumler) {
    if (!d.id || !d.tip) return "bir düğümde 'id' veya 'tip' eksik";
    if (!DUGUM_TIPLERI[d.tip]) return `bilinmeyen düğüm tipi: ${d.tip}`;
  }
  for (const b of v.baglantilar) {
    if (!b.kaynak || !b.hedef) return "bir bağlantıda 'kaynak' veya 'hedef' eksik";
  }
  return null;
}

/* =========================================================
   BAŞLAT
   ========================================================= */
function baslat() {
  paletCiz();
  olaylariBagla();
  ciz();
  gecmisCiz();
  setTimeout(sigdir, 60);
  saatDongusuBaslat();
}

baslat();

// Test için modül seviyesinde erişilebilir API
window.__numex = {
  graf: () => graf,
  dugumEkle,
  dugumSil,
  baglantiSil,
  calistir,
  kaydet,
  disariAktar,
  ornekGraf,
  ayarlaDugum: (id, ayar) => { const d = graf.dugumler.find(x => x.id === id); if (d) { Object.assign(d.ayar, ayar); ciz(); kirli(); } },
  grafiDogrula,
  sec: id => { seciliId = id; secimGuncelle(); },
  secBaglanti: id => { seciliBaglantiId = id; seciliId = null; secimGuncelle(); },
  kaydetLocal: () => kaydet(true),
  durum: () => ({ graf, sonCalisma }),
  baglantiDurumu,
  baglantiSuresiAyarla,
  panX: () => panX, panY: () => panY, zoom: () => zoom,
  setPanZoom: (x, y, z) => { panX = x; panY = y; zoom = z; tuvaliUygula(); }
};
