/* =========================================================
   PulseBoard — Yardımcı fonksiyonlar
   Saf, yan etkisiz araçlar. DOM'a dokunmaz.
   ========================================================= */

/* --- Tarih --- */

/**
 * Yerel tarihi YYYY-MM-DD olarak döndürür.
 * toISOString() UTC'ye kaydırdığı için KULLANILMAZ.
 */
export function tarihISO(tarih = new Date()) {
  const y = tarih.getFullYear();
  const a = String(tarih.getMonth() + 1).padStart(2, "0");
  const g = String(tarih.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

/** Bugünün yerel ISO tarihi */
export function bugunISO() {
  return tarihISO(new Date());
}

/** ISO metni geçerli mi? */
export function gecerliISO(iso) {
  return Boolean(isoToDate(iso));
}

/** n gün önceki/sonraki ISO (bugünden) */
export function bugundenGun(ofset) {
  return gunEkle(bugunISO(), ofset);
}

/** ISO (YYYY-MM-DD) metnini yerel Date'e çevirir (saat 00:00) */
export function isoToDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [y, a, g] = iso.split("-").map(Number);
  if (!y || !a || !g) return null;
  return new Date(y, a - 1, g);
}

/** ISO tarihine gün ekler/çıkarır */
export function gunEkle(iso, gunSayisi) {
  const d = isoToDate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + gunSayisi);
  return tarihISO(d);
}

/** İki ISO tarih arasındaki gün farkı (b - a) */
export function gunFarki(aIso, bIso) {
  const a = isoToDate(aIso);
  const b = isoToDate(bIso);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

/** Bugünden geriye doğru n günlük ISO listesi (eskiden yeniye) */
export function sonNGun(n) {
  const liste = [];
  const bugun = bugunISO();
  for (let i = n - 1; i >= 0; i--) liste.push(gunEkle(bugun, -i));
  return liste;
}

const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** "12 Mart 2026, Perşembe" biçiminde uzun tarih */
export function uzunTarih(tarih = new Date()) {
  return `${tarih.getDate()} ${AY_ADLARI[tarih.getMonth()]} ${tarih.getFullYear()}, ${GUN_ADLARI[tarih.getDay()]}`;
}

/** "12 Mar" kısa tarih (ISO veya Date) */
export function kisaTarih(girdi) {
  const d = typeof girdi === "string" ? isoToDate(girdi) : girdi;
  if (!d) return "—";
  const ay = AY_ADLARI[d.getMonth()].slice(0, 3);
  return `${d.getDate()} ${ay}`;
}

/** ISO tarihin kısa gün adı: "Pzt" */
export function gunKisa(iso) {
  const d = typeof iso === "string" ? isoToDate(iso) : iso;
  if (!d) return "";
  return GUN_KISA[d.getDay()];
}

/** ISO tarihin tek harfli gün baş harfi: "P" (haftalık şerit için) */
export function gunBasHarf(iso) {
  const d = typeof iso === "string" ? isoToDate(iso) : iso;
  if (!d) return "";
  return GUN_KISA[d.getDay()].charAt(0);
}

/**
 * Bugün / Yarın / Günü geçti / "12 Mar" biçiminde akıllı teslim etiketi.
 * Dönen: { metin, durum } durum: 'gecikti' | 'bugun' | 'yakin' | 'normal'
 */
export function teslimEtiketi(iso) {
  if (!iso) return { metin: "Tarih yok", durum: "normal" };
  const bugun = bugunISO();
  const fark = gunFarki(bugun, iso);
  if (fark < 0) {
    const gecen = Math.abs(fark);
    return { metin: gecen === 1 ? "Dün" : `${gecen} gün gecikti`, durum: "gecikti" };
  }
  if (fark === 0) return { metin: "Bugün", durum: "bugun" };
  if (fark === 1) return { metin: "Yarın", durum: "yakin" };
  if (fark <= 6) return { metin: `${fark} gün sonra`, durum: "yakin" };
  return { metin: kisaTarih(iso), durum: "normal" };
}

/* --- Metin --- */

/** HTML kaçışı — kullanıcı girdisi her zaman buradan geçer */
export function kacis(metin) {
  return String(metin ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Uzun metni keser */
export function kisalt(metin, uzunluk = 90) {
  const s = String(metin ?? "");
  return s.length <= uzunluk ? s : `${s.slice(0, uzunluk - 1).trimEnd()}…`;
}

/** Türkçe uyumlu arama normalizasyonu (büyük/küçük + aksan) */
export function normalize(metin) {
  return String(metin ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/\s+/g, " ")
    .trim();
}

/* --- Sayı / yüzde --- */

export function yuzde(parca, toplam) {
  if (!toplam || toplam <= 0) return 0;
  return Math.round((parca / toplam) * 100);
}

export function sayiBicimlendir(n) {
  return new Intl.NumberFormat("tr-TR").format(Number(n) || 0);
}

/* --- Kimlik / dizi --- */

export function kimlik(onek = "id") {
  const rastgele = Math.random().toString(36).slice(2, 9);
  return `${onek}_${Date.now().toString(36)}${rastgele}`;
}

export function benzersizId(liste, onek = "id") {
  let yeni = kimlik(onek);
  const kumesi = new Set(liste.map((o) => o && o.id));
  while (kumesi.has(yeni)) yeni = kimlik(onek);
  return yeni;
}

export function idIle(liste, id) {
  return (liste || []).find((o) => o && o.id === id) || null;
}

/** Diziyi verilen alana göre gruplar */
export function grupla(liste, anahtarFn) {
  return (liste || []).reduce((acc, oge) => {
    const k = anahtarFn(oge);
    (acc[k] = acc[k] || []).push(oge);
    return acc;
  }, {});
}

/** Güvenli sıralama */
export function sirala(liste, karsilastir) {
  return [...(liste || [])].sort(karsilastir);
}

export function topla(liste, secici) {
  return (liste || []).reduce((t, o) => t + (Number(secici(o)) || 0), 0);
}

/* --- DOM --- */

export function el(secici, kok = document) {
  return kok.querySelector(secici);
}

export function tumEl(secici, kok = document) {
  return Array.from(kok.querySelectorAll(secici));
}

/** Güvenli HTML enjeksiyonu (kaçışlı metin kullanın) */
export function html(metin) {
  const s = document.createElement("div");
  s.innerHTML = metin.trim();
  return s.firstElementChild;
}

/** Debounce */
export function geciktir(fn, ms = 220) {
  let zaman;
  return (...args) => {
    clearTimeout(zaman);
    zaman = setTimeout(() => fn(...args), ms);
  };
}

/* --- Sabitler --- */

export const ONCELIKLER = [
  { id: "dusuk", ad: "Düşük", chip: "chip-dusuk", agirlik: 1 },
  { id: "orta", ad: "Orta", chip: "chip-orta", agirlik: 2 },
  { id: "yuksek", ad: "Yüksek", chip: "chip-yuksek", agirlik: 3 },
];

export const VARSAYILAN_KATEGORILER = [
  { id: "genel", ad: "Genel", renk: "#38bdf8" },
  { id: "is", ad: "İş", renk: "#2dd4bf" },
  { id: "kisisel", ad: "Kişisel", renk: "#a855f7" },
  { id: "egitim", ad: "Eğitim", renk: "#fbbf24" },
  { id: "saglik", ad: "Sağlık", renk: "#34d399" },
];

export const ALISKANLIK_EMOJILERI = [
  "💧", "📚", "🏃", "🧘", "💪", "🥗", "😴", "🧠",
  "✍️", "🎯", "🎸", "🎨", "☀️", "🚭", "🧹", "💰",
  "📵", "🌙", "🦷", "🚶", "🍎", "🧴", "🙏", "📝",
];

export const ALISKANLIK_RENKLERI = [
  "#2dd4bf", "#38bdf8", "#a855f7", "#34d399",
  "#fbbf24", "#fb923c", "#f87171", "#818cf8",
];

/** Öncelik tanımını id ile bulur */
export function oncelikBilgi(id) {
  return ONCELIKLER.find((o) => o.id === id) || ONCELIKLER[1];
}

/** Haftanın ilk günü Pazartesi olacak şekilde bugünün haftalık ISO listesi */
export function buHafta() {
  const bugun = new Date();
  const gun = bugun.getDay(); // 0=Pazar
  const pazartesiOfset = gun === 0 ? -6 : 1 - gun;
  const pazartesi = new Date(bugun);
  pazartesi.setDate(bugun.getDate() + pazartesiOfset);
  const gunler = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(pazartesi);
    d.setDate(pazartesi.getDate() + i);
    gunler.push(tarihISO(d));
  }
  return gunler;
}
