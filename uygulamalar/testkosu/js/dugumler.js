/* =========================================================
   NUMEX CORE — Flow Engine
   Düğüm tanımları ve düğümlerin GERÇEK çalıştırıcıları.
   Her düğüm: (girdi, ayarlar, baglam) => Promise<sonuc>
   sonuc = { deger, gecti?, not? }
   ========================================================= */

import { guvenliIstek, hedefDogrula } from "./guvenlik.js";

export const DUGUM_TIPLERI = {
  baslat: {
    ad: "Başlat",
    ikon: "▶",
    renk: "#4fd1c5",
    aciklama: "Akışı başlatır",
    girisYok: true,
    varsayilan: { metin: "" },
    ozet: (a) => a.metin ? `Başlangıç: ${a.metin}` : "Akış başlangıcı",
    ayarlar: [
      { anahtar: "metin", tip: "metin", etiket: "Başlangıç Değeri (opsiyonel)", yardim: "Boş bırakılırsa aşağıdaki düğüm girdisiz çalışır." }
    ]
  },

  metin: {
    ad: "Metin",
    ikon: "T",
    renk: "#5b8cff",
    aciklama: "Metin üretir",
    varsayilan: { metin: "Merhaba Numex" },
    ozet: (a) => a.metin || "(boş metin)",
    ayarlar: [
      { anahtar: "metin", tip: "textarea", etiket: "Metin", yardim: "Önceki düğümün çıktısını metne eklemek için {{girdi}} yaz." }
    ]
  },

  json: {
    ad: "JSON",
    ikon: "{}",
    renk: "#a477ff",
    aciklama: "Yapılandırılmış veri",
    varsayilan: { json: '{\n  "customer": "Numex",\n  "amount": 2500,\n  "status": "paid"\n}' },
    ozet: (a) => {
      const j = jsonDene(a.json);
      return j.hata ? "Geçersiz JSON" : compact(JSON.stringify(j.deger));
    },
    ayarlar: [
      { anahtar: "json", tip: "json", etiket: "JSON İçeriği", yardim: "Geçerli JSON olmalı." }
    ]
  },

  filtre: {
    ad: "Filtre",
    ikon: "⌛",
    renk: "#ffa94d",
    aciklama: "Koşula göre geçirir",
    varsayilan: { hepsi: true, kosullar: [{ alan: "status", op: "=", deger: "paid" }] },
    ozet: (a) => {
      if (!a.kosullar || !a.kosullar.length) return "Koşul yok";
      const ilk = a.kosullar[0];
      return `${ilk.alan} ${ilk.op} ${ilk.deger}${a.kosullar.length > 1 ? ` (+${a.kosullar.length - 1})` : ""}`;
    },
    ayarlar: [
      { anahtar: "hepsi", tip: "select", etiket: "Koşul Birleştirme", secenekler: [{ deger: true, yazi: "Tümü sağlanmalı (VE)" }, { deger: false, yazi: "En az biri (VEYA)" }] },
      { anahtar: "kosullar", tip: "kosullar", etiket: "Koşullar" }
    ]
  },

  donustur: {
    ad: "Dönüştür",
    ikon: "⇄",
    renk: "#3ddc97",
    aciklama: "Alanları değiştirir",
    varsayilan: { islemler: [{ hedef: "total", islem: "yuzdeEkle", deger: 20, kaynak: "amount" }] },
    ozet: (a) => {
      const n = (a.islemler || []).length;
      if (!n) return "İşlem yok";
      const i = a.islemler[0];
      return `${i.hedef} = ${islemEtiket(i.islem)}(${i.deger})${n > 1 ? ` +${n - 1}` : ""}`;
    },
    ayarlar: [
      { anahtar: "islemler", tip: "islemler", etiket: "Veri İşlemleri" }
    ]
  },

  gecikme: {
    ad: "Gecikme",
    ikon: "⏱",
    renk: "#ffd166",
    aciklama: "Belirtilen süre bekler",
    varsayilan: { ms: 1000 },
    ozet: (a) => `${a.ms} ms bekle`,
    ayarlar: [
      { anahtar: "ms", tip: "number", etiket: "Bekleme (ms)", min: 0, max: 60000, yardim: "0–60000 ms arası." }
    ]
  },

  http: {
    ad: "HTTP İsteği",
    ikon: "↗",
    renk: "#ff7a8a",
    aciklama: "Gerçek HTTP isteği yapar",
    varsayilan: {
      method: "GET",
      url: "https://api.github.com/repos/microsoft/vscode",
      headers: "{\n  \"Accept\": \"application/json\"\n}",
      body: "",
      timeout: 8000,
      maxBoyut: 262144
    },
    ozet: (a) => `${a.method || "GET"} ${kisalt(a.url || "", 42)}`,
    ayarlar: [
      { anahtar: "method", tip: "select", etiket: "Yöntem", secenekler: ["GET", "POST", "PUT", "PATCH", "DELETE"].map(x => ({ deger: x, yazi: x })) },
      { anahtar: "url", tip: "text", etiket: "URL", yardim: "Sadece http/https. Özel ağ adresleri engellenir." },
      { anahtar: "headers", tip: "json", etiket: "Başlıklar (JSON)" },
      { anahtar: "body", tip: "textarea", etiket: "Gövde" },
      { anahtar: "timeout", tip: "number", etiket: "Zaman Aşımı (ms)", min: 1000, max: 30000 },
      { anahtar: "maxBoyut", tip: "number", etiket: "Maks. Yanıt Boyutu (bayt)", min: 1024, max: 5242880 }
    ]
  },

  sonuc: {
    ad: "Sonuç",
    ikon: "◎",
    renk: "#79e0ff",
    aciklama: "Çıktıyı gösterir",
    varsayilan: { bicim: "json" },
    ozet: (a) => `Çıktı: ${a.bicim || "json"}`,
    ayarlar: [
      { anahtar: "bicim", tip: "select", etiket: "Gösterim", secenekler: [{ deger: "json", yazi: "JSON (girintili)" }, { deger: "metin", yazi: "Düz metin" }, { deger: "tablo", yazi: "Tablo (düz nesne)" }] }
    ]
  }
};

export const ISLEMLER = {
  yuzdeEkle: { ad: "% Ekle", uygula: (v, d) => +((Number(v) || 0) * (1 + Number(d) / 100)).toFixed(6) },
  yuzdeCikar: { ad: "% Çıkar", uygula: (v, d) => +((Number(v) || 0) * (1 - Number(d) / 100)).toFixed(6) },
  carp: { ad: "Çarp", uygula: (v, d) => (Number(v) || 0) * Number(d) },
  topla: { ad: "Topla", uygula: (v, d) => (Number(v) || 0) + Number(d) },
  cikar: { ad: "Çıkar", uygula: (v, d) => (Number(v) || 0) - Number(d) },
  bol: { ad: "Böl", uygula: (v, d) => { if (Number(d) === 0) throw new Error("Sıfıra bölme"); return (Number(v) || 0) / Number(d); } },
  buyuk: { ad: "BÜYÜK HARF", uygula: (v) => String(v ?? "").toLocaleUpperCase("tr-TR") },
  kucuk: { ad: "küçük harf", uygula: (v) => String(v ?? "").toLocaleLowerCase("tr-TR") },
  trim: { ad: "Kırp", uygula: (v) => String(v ?? "").trim() },
  tarih: { ad: "Tarih (ISO)", uygula: () => new Date().toISOString() },
  sabit: { ad: "Sabit Değer", uygula: (v, d) => d },
  sil: { ad: "Alanı Sil", uygula: () => undefined },
  uzunluk: { ad: "Uzunluk", uygula: (v) => Array.isArray(v) ? v.length : String(v ?? "").length }
};

export const OPLAR = {
  "=": { ad: "eşit", uygula: (a, b) => esit(a, b) },
  "!=": { ad: "eşit değil", uygula: (a, b) => !esit(a, b) },
  ">": { ad: "büyük", uygula: (a, b) => Number(a) > Number(b) },
  ">=": { ad: "büyük/eşit", uygula: (a, b) => Number(a) >= Number(b) },
  "<": { ad: "küçük", uygula: (a, b) => Number(a) < Number(b) },
  "<=": { ad: "küçük/eşit", uygula: (a, b) => Number(a) <= Number(b) },
  "ic": { ad: "içerir", uygula: (a, b) => String(a ?? "").toLocaleLowerCase("tr-TR").includes(String(b ?? "").toLocaleLowerCase("tr-TR")) },
  "yok": { ad: "boş", uygula: (a) => a === null || a === undefined || a === "" },
  "var": { ad: "dolu", uygula: (a) => !(a === null || a === undefined || a === "") }
};
const SAYISAL_OPLAR = new Set([">", ">=", "<", "<="]);

/* ---------- yardımcılar ---------- */
export function yolOku(nesne, yol) {
  if (yol === "" || yol === undefined || yol === null) return nesne;
  return String(yol).split(".").reduce((acc, p) => (acc === null || acc === undefined ? undefined : acc[p]), nesne);
}

function esit(a, b) {
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  return String(a ?? "") === String(b ?? "");
}

function karsilastir(hamBeklenen) {
  if (hamBeklenen === "true") return true;
  if (hamBeklenen === "false") return false;
  if (hamBeklenen === "null") return null;
  const s = String(hamBeklenen).trim();
  if (s !== "" && !isNaN(Number(s)) && String(Number(s)) === s) return Number(s);
  return hamBeklenen;
}

export function jsonDene(metin) {
  try {
    const temiz = String(metin ?? "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/,(\s*[}\]])/g, "$1")
      .trim();
    if (temiz === "") return { deger: null };
    return { deger: JSON.parse(temiz) };
  } catch (e) {
    return { hata: e.message };
  }
}

function compact(s) { return s.length > 46 ? s.slice(0, 44) + "…" : s; }
function kisalt(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function islemEtiket(islem) { return (ISLEMLER[islem] || { ad: islem }).ad; }

/* =========================================================
   ÇALIŞTIRICILAR
   ========================================================= */

export const CALISTIRICILAR = {

  async baslat(girdi, ayar) {
    if (ayar.metin && String(ayar.metin).trim() !== "") {
      return { deger: ayar.metin, not: "Başlangıç değeri yüklendi" };
    }
    return { deger: null, not: "Akış başlatıldı" };
  },

  async metin(girdi, ayar) {
    const taslak = String(ayar.metin ?? "");
    const cikti = taslak.replace(/\{\{\s*girdi\s*\}\}/g, () => {
      if (girdi === null || girdi === undefined) return "";
      return typeof girdi === "object" ? JSON.stringify(girdi) : String(girdi);
    });
    return { deger: cikti };
  },

  async json(girdi, ayar) {
    const r = jsonDene(ayar.json);
    if (r.hata) throw new Error("Geçersiz JSON: " + r.hata);
    return { deger: r.deger };
  },

  async filtre(girdi, ayar) {
    const kosullar = (ayar.kosullar || []).filter(k => k && k.alan !== undefined && k.alan !== "");
    if (!kosullar.length) return { deger: girdi, gecti: true, not: "Koşul tanımlı değil" };

    const sonuclar = kosullar.map(k => {
      const hamDeger = yolOku(girdi, k.alan);
      const op = OPLAR[k.op] || OPLAR["="];
      if (SAYISAL_OPLAR.has(k.op)) {
        const s1 = Number(hamDeger), s2 = Number(k.deger);
        return !isNaN(s1) && !isNaN(s2) && op.uygula(s1, s2);
      }
      if (k.op === "yok" || k.op === "var") return op.uygula(hamDeger);
      return op.uygula(hamDeger, karsilastir(String(k.deger ?? "")));
    });

    const hepsi = ayar.hepsi !== false;
    const gecti = hepsi ? sonuclar.every(Boolean) : sonuclar.some(Boolean);
    return {
      deger: girdi,
      gecti,
      not: gecti ? "Kayıt koşulu sağladı" : "Kayıt koşulu sağlamadı — engellendi"
    };
  },

  async donustur(girdi, ayar) {
    const islemler = (ayar.islemler || []).filter(i => i && i.hedef);
    if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) {
      throw new Error("Dönüştür düğümü nesne (JSON) girdisi bekler");
    }
    const cikti = JSON.parse(JSON.stringify(girdi));
    const yapilanlar = [];
    for (const i of islemler) {
      const islem = ISLEMLER[i.islem];
      if (!islem) throw new Error(`Bilinmeyen işlem: ${i.islem}`);
      const okumaAlani = (i.kaynak !== undefined && i.kaynak !== "") ? i.kaynak : i.hedef;
      const mevcut = yolOku(cikti, okumaAlani);
      const sonuc = islem.uygula(mevcut, i.deger);
      const parcalar = String(i.hedef).split(".");
      let hedef = cikti;
      for (let p = 0; p < parcalar.length - 1; p++) {
        if (!hedef[parcalar[p]] || typeof hedef[parcalar[p]] !== "object") hedef[parcalar[p]] = {};
        hedef = hedef[parcalar[p]];
      }
      const sonAnahtar = parcalar[parcalar.length - 1];
      if (sonuc === undefined && i.islem === "sil") delete hedef[sonAnahtar];
      else hedef[sonAnahtar] = sonuc;
      yapilanlar.push(`${i.hedef}=${i.islem === "sil" ? "(silindi)" : JSON.stringify(sonuc)}`);
    }
    return { deger: cikti, not: yapilanlar.length ? yapilanlar.join(", ") : "Değişiklik yok" };
  },

  async gecikme(girdi, ayar, baglam) {
    const ms = Number(ayar.ms ?? 0);
    if (!Number.isFinite(ms) || ms < 0) throw new Error("Geçersiz bekleme süresi");
    if (ms > 60000) throw new Error("Bekleme süresi en fazla 60000 ms olabilir");
    await bekle(ms, baglam?.sinyal);
    return { deger: girdi, not: `${ms} ms beklendi` };
  },

  async http(girdi, ayar) {
    const url = String(ayar.url || "").trim();
    if (!url) throw new Error("URL boş");

    await hedefDogrula(url);

    let basliklar = {};
    if (ayar.headers && String(ayar.headers).trim()) {
      const h = jsonDene(ayar.headers);
      if (h.hata) throw new Error("Başlıklar geçersiz JSON: " + h.hata);
      if (h.deger && typeof h.deger === "object" && !Array.isArray(h.deger)) basliklar = h.deger;
      else if (h.deger !== null) throw new Error("Başlıklar bir JSON nesnesi olmalı");
    }

    const yontem = (ayar.method || "GET").toUpperCase();
    const govde = ["POST", "PUT", "PATCH"].includes(yontem) && String(ayar.body || "").trim() !== ""
      ? String(ayar.body)
      : undefined;

    const sonuc = await guvenliIstek({
      url,
      method: yontem,
      headers: basliklar,
      body: govde,
      timeout: Math.min(Math.max(Number(ayar.timeout) || 8000, 1000), 30000),
      maxBoyut: Math.min(Math.max(Number(ayar.maxBoyut) || 262144, 1024), 5242880)
    });

    return {
      deger: {
        durum: sonuc.durum,
        url: sonuc.sonUrl,
        icerikTuru: sonuc.icerikTuru,
        boyut: sonuc.boyut,
        veri: sonuc.veri
      },
      not: `HTTP ${sonuc.durum} · ${sonuc.boyut} bayt`
    };
  },

  async sonuc(girdi, ayar) {
    return { deger: girdi, not: "Sonuç alındı" };
  }
};

function bekle(ms, sinyal) {
  return new Promise((res, rej) => {
    if (sinyal?.aborted) return rej(new Error("Çalışma durduruldu"));
    const iptal = () => { clearTimeout(t); rej(new Error("Çalışma durduruldu")); };
    const t = setTimeout(() => { sinyal?.removeEventListener("abort", iptal); res(); }, ms);
    sinyal?.addEventListener("abort", iptal, { once: true });
  });
}
