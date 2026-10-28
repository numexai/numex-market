/* =========================================================
   PulseBoard — Sözleşme (contract) testi
   Her modülü GERÇEKTEN import eder; istenen isimli export'un
   varlığını runtime'da doğrular. Döngüsel bağımlılığı da kontrol eder.
   Çalıştırma: node sozlesme-testi.mjs
   ========================================================= */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const KOK = process.cwd();
let hataSayisi = 0;
let kontrolSayisi = 0;

/** Dosyadaki static import/export ... from ifadelerini çıkarır */
function bagimliliklariCikar(dosya) {
  const kod = readFileSync(dosya, "utf8");
  const liste = [];
  const re = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(kod))) {
    const govde = m[1].trim();
    const kaynak = m[2];
    const adlar = [];
    const susl = govde.match(/^\{([\s\S]*)\}$/);
    if (susl) {
      for (const parca of susl[1].split(",")) {
        const p = parca.trim();
        if (!p) continue;
        const asli = p.split(/\s+as\s+/)[0].trim();
        if (asli) adlar.push(asli);
      }
    } else if (/^[A-Za-z_$][\w$]*$/.test(govde) || /^[A-Za-z_$][\w$]*\s*,/.test(govde) || govde.includes("* as")) {
      // default import ya da namespace
      if (!susl) adlar.push("__default__");
    }
    liste.push({ adlar, kaynak, govde });
  }
  return liste;
}

const dosyalar = [
  "js/utils.js",
  "js/store.js",
  "js/toast.js",
  "js/modal.js",
  "js/charts.js",
  "js/tasks.js",
  "js/views/dashboard.js",
  "js/views/tasks.js",
  "js/views/habits.js",
  "js/views/stats.js",
  "js/views/settings.js",
  "js/app.js",
];

/* --- Statik analiz: dosya var mı? çözülüyor mu? --- */
console.log("=== 1) STATİK IMPORT ÇÖZÜMLEME ===");
for (const rel of dosyalar) {
  const abs = resolve(KOK, rel);
  if (!existsSync(abs)) {
    console.log(`  [YOK] ${rel} diskte bulunamadı`);
    hataSayisi++;
    continue;
  }
  for (const b of bagimliliklariCikar(abs)) {
    if (!b.kaynak.startsWith(".")) continue; // paket importu (yok, sıfır bağımlılık)
    kontrolSayisi++;
    const hedef = resolve(dirname(abs), b.kaynak);
    if (!existsSync(hedef)) {
      console.log(`  [KIRIK YOL] ${rel} -> ${b.kaynak}`);
      hataSayisi++;
    }
  }
}
console.log(`  ${kontrolSayisi} yerel import yolu kontrol edildi.`);

/* --- Dinamik: gerçek import + isimli export doğrulaması --- */
// base: tarayıcı global'lerini (document vb.) taklit et — saf modüller yüklenebilsin
const sahteKok = () => ({
  id: "", className: "", hidden: false, textContent: "", innerHTML: "",
  dataset: {}, style: {}, children: [], classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, removeChild() {}, remove() {}, setAttribute() {}, getAttribute: () => null,
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  focus() {}, click() {}, closest: () => null, insertAdjacentHTML() {}, animate: () => ({ finished: Promise.resolve() }),
  offsetWidth: 0, offsetHeight: 0, getBoundingClientRect: () => ({ width: 0, height: 0, top: 0, left: 0 }),
  cloneNode: () => sahteKok(), replaceWith() {}, removeAttribute() {}, hasAttribute: () => false,
});
globalThis.document = {
  querySelector: () => sahteKok(),
  querySelectorAll: () => [],
  createElement: () => sahteKok(),
  addEventListener() {}, removeEventListener() {},
  body: sahteKok(), documentElement: sahteKok(), head: sahteKok(),
};
const sahteLocation = { hash: "#/genel-bakis", pathname: "/", href: "http://localhost/", search: "", replace() {}, assign() {} };
globalThis.location = sahteLocation;
globalThis.window = {
  addEventListener() {}, removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: sahteLocation,
  localStorage: null,
  innerWidth: 1280, innerHeight: 800,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "", width: "0px", height: "0px" });
globalThis.CSS = { escape: (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "-") };
function sahteDepo() {
  return {
    _d: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    clear() { this._d = {}; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
  };
}
globalThis.localStorage = sahteDepo();
globalThis.sessionStorage = sahteDepo();
const _yedekDepo = sahteDepo();
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.matchMedia = globalThis.window.matchMedia;

console.log("\n=== 2) RUNTIME EXPORT DOĞRULAMASI ===");
const beklenen = {
  "js/utils.js": ["kacis", "bugunISO", "normalize", "uzunTarih", "kisaTarih", "gunKisa", "gunBasHarf", "buHafta", "sonNGun", "yuzde", "kisalt", "gunFarki", "VARSAYILAN_KATEGORILER", "ONCELIKLER", "ALISKANLIK_EMOJILERI", "ALISKANLIK_RENKLERI", "oncelikBilgi", "teslimEtiketi", "el", "html", "geciktir", "benzersizId", "kimlik", "isoToDate", "gunEkle", "tarihISO"],
  "js/store.js": ["store"],
  "js/toast.js": ["toast", "bildir", "default"],
  "js/modal.js": ["modalAc", "modalKapat", "onayIste"],
  "js/charts.js": ["sutunGrafik", "alanGrafik", "sparkline", "yuzdeHalkasi", "dagilimCubuklari", "isiHaritasi"],
  "js/tasks.js": ["gorevSatiri", "kompaktGorevSatiri", "gorevFormAc", "gorevEylemleriniBagla", "gorevSilOnayli", "gorevTumunuTemizleOnayli", "oncelikChip", "kategoriChip", "teslimChip"],
  "js/views/dashboard.js": ["render", "bagla"],
  "js/views/tasks.js": ["render", "bagla", "durumSifirla"],
  "js/views/habits.js": ["render", "bagla", "aliskanlikFormAc", "seriEtiketi"],
  "js/views/stats.js": ["render", "bagla"],
  "js/views/settings.js": ["render", "bagla"],
  "js/app.js": ["init", "router", "yenidenCiz", "selamlamaUret", "tarihBasligiGuncelle", "gunlukIlerlemeGuncelle", "temaToggle", "mobilDrawerToggle", "globalKisayolHandler"],
};

for (const [rel, adlar] of Object.entries(beklenen)) {
  let mod;
  try {
    mod = await import("./" + rel);
  } catch (hata) {
    console.log(`  [RUNTIME HATA] ${rel} yüklenemedi: ${hata.message}`);
    hataSayisi++;
    continue;
  }
  for (const ad of adlar) {
    kontrolSayisi++;
    const varMi = ad === "default" ? mod.default !== undefined : typeof mod[ad] !== "undefined";
    if (!varMi) {
      console.log(`  [EKSİK EXPORT] ${rel} -> '${ad}' yok`);
      hataSayisi++;
    }
  }
  const adet = Object.keys(mod).length;
  console.log(`  [OK] ${rel} - ${adet} export dogrulandi`);
}

/* --- 3) Döngüsel bağımlılık --- */
console.log("\n=== 3) DÖNGÜSEL BAĞIMLILIK ===");
const graf = new Map();
for (const rel of dosyalar) {
  const abs = resolve(KOK, rel);
  if (!existsSync(abs)) continue;
  const kenarlar = bagimliliklariCikar(abs)
    .filter((b) => b.kaynak.startsWith("."))
    .map((b) => resolve(dirname(abs), b.kaynak))
    .map((p) => p.replace(/\\/g, "/"));
  graf.set(abs.replace(/\\/g, "/"), kenarlar);
}
let dongu = false;
const durum = new Map(); // 0=ziyaret edilmedi 1=yolda 2=bitti
function gez(dugum, yol) {
  const s = durum.get(dugum) || 0;
  if (s === 2) return;
  if (s === 1) {
    dongu = true;
    console.log(`  [DÖNGÜ] ${[...yol, dugum].join(" -> ")}`);
    hataSayisi++;
    return;
  }
  durum.set(dugum, 1);
  for (const k of graf.get(dugum) || []) gez(k, [...yol, dugum]);
  durum.set(dugum, 2);
}
for (const d of graf.keys()) gez(d, []);
if (!dongu) console.log("  Döngüsel bağımlılık yok.");

/* --- Sonuç --- */
console.log("\n=== SONUÇ ===");
console.log(`Kontrol edilen sözleşme sayısı: ${kontrolSayisi}`);
console.log(`Hata sayısı: ${hataSayisi}`);
if (hataSayisi === 0) {
  console.log("SONUC: GECTI");
  process.exit(0);
} else {
  console.log("SONUC: KALDI");
  process.exit(1);
}
