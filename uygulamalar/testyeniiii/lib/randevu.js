// Randevu alanı (domain) — sunucudan bağımsız saf mantık; testler bunu doğrudan kullanır.
// Zaman modeli: bir gün 09:00–19:00 arası 15 dakikalık dilimlere bölünür (slot = o günün başlangıcından itibaren dakika).
// Bir hizmet N dilim sürer; çakışma kontrolü yalnızca başlangıç saatine değil, kapladığı TÜM dilimlere bakar
// (ör. 40 dakikalık boya, 45 dakikalık sonraki randevuyla kesişemez).

export const GUN_BASLANGIC = 9 * 60; // 09:00
export const GUN_BITIS = 19 * 60; // 19:00
export const DILIM = 15;

export const HIZMETLER = [
  { id: "sac-kesimi", ad: "Saç Kesimi", dakika: 30, fiyat: 400 },
  { id: "boya", ad: "Boya", dakika: 90, fiyat: 1200 },
  { id: "fon", ad: "Fön", dakika: 45, fiyat: 250 },
];

export const CALISANLAR = [
  { id: "ayse", ad: "Ayşe" },
  { id: "mehmet", ad: "Mehmet" },
  { id: "zeynep", ad: "Zeynep" },
];

export function hizmetBul(id) {
  return HIZMETLER.find((h) => h.id === id) || null;
}

export function calisanBul(id) {
  return CALISANLAR.find((c) => c.id === id) || null;
}

/** Dilim numarası → "HH:MM" */
export function saatYaz(dakika) {
  const s = String(Math.floor(dakika / 60)).padStart(2, "0");
  const d = String(dakika % 60).padStart(2, "0");
  return `${s}:${d}`;
}

/** "HH:MM" → dakika */
export function dakikaOku(metin) {
  if (typeof metin !== "string" || !/^\d{1,2}:\d{2}$/.test(metin)) return null;
  const [s, d] = metin.split(":").map(Number);
  if (d > 59 || d % DILIM !== 0) return null;
  return s * 60 + d;
}

/**
 * YYYY-MM-DD biçimini ve gerçek bir tarih olup olmadığını denetler.
 * Takvim günü kullanıcının yerel günüdür; bu yüzden tarih yerel saatle kurulur
 * (UTC kurulumu Türkiye'de gece 00:00–03:00 arası bir önceki güne kayardı).
 */
export function tarihGecerliMi(tarih) {
  if (typeof tarih !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return false;
  const [y, m, g] = tarih.split("-").map(Number);
  const t = new Date(y, m - 1, g);
  return (
    t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === g
  );
}

/** Yerel tarihi YYYY-MM-DD olarak verir */
export function bugunYerel() {
  const t = new Date();
  const s = String(t.getFullYear());
  const a = String(t.getMonth() + 1).padStart(2, "0");
  const g = String(t.getDate()).padStart(2, "0");
  return `${s}-${a}-${g}`;
}

const DUN = new Set([0]); // Pazar kapalı

/** O günün tüm başlangıç dilimleri */
export function gunDilimleri(tarih) {
  if (!tarihGecerliMi(tarih)) return [];
  const [y, m, g] = tarih.split("-").map(Number);
  const gun = new Date(y, m - 1, g).getDay();
  if (DUN.has(gun)) return [];
  const liste = [];
  for (let d = GUN_BASLANGIC; d + DILIM <= GUN_BITIS; d += DILIM) liste.push(d);
  return liste;
}

/** Hizmetin süresiyle gün sonuna sığmayan başlangıç saatleri geçersizdir */
export function baslangicSigiyorMu(baslangic, sure) {
  return baslangic >= GUN_BASLANGIC && baslangic + sure <= GUN_BITIS;
}

function ayniCalisan(randevu, calisanId, tarih) {
  return randevu.calisan === calisanId && randevu.tarih === tarih && !randevu.iptal;
}

/** Belli çalışan+tarihte dolu olan aralıklar [bas, bit) */
export function doluAraliklar(randevular, calisanId, tarih) {
  return randevular
    .filter((r) => ayniCalisan(r, calisanId, tarih))
    .map((r) => {
      const sure = r.sure ?? hizmetBul(r.hizmet)?.dakika ?? DILIM;
      const bas = dakikaOku(r.saat);
      return { bas, bit: bas + sure };
    })
    .sort((a, b) => a.bas - b.bas);
}

/** Verilen başlangıç saati, hizmet süresiyle birlikte çalışıyor mu? */
export function cakismaVarMi(randevular, { calisan, tarih, saat, hizmet, haricId }) {
  const bas = dakikaOku(saat);
  const sure = hizmetBul(hizmet)?.dakika ?? DILIM;
  const aday = { bas, bit: bas + sure };
  return randevular.some((r) => {
    if (r.iptal) return false;
    if (haricId && r.id === haricId) return false;
    if (!ayniCalisan(r, calisan, tarih)) return false;
    const rBas = dakikaOku(r.saat);
    const rBit = rBas + (r.sure ?? hizmetBul(r.hizmet)?.dakika ?? DILIM);
    return aday.bas < rBit && rBas < aday.bit;
  });
}

/** Boş başlangıç saatleri listesi */
export function bosSaatler(randevular, { calisan, tarih, hizmet }) {
  const sure = hizmetBul(hizmet)?.dakika ?? DILIM;
  return gunDilimleri(tarih)
    .filter((d) => baslangicSigiyorMu(d, sure))
    .filter((d) => !cakismaVarMi(randevular, { calisan, tarih, saat: saatYaz(d), hizmet }))
    .map(saatYaz);
}

/**
 * Randevu oluşturur. Başarısızsa { hata, kod } döner.
 * kurallar: çalışan/hizmet var olmalı, tarih geçmiş olamaz, gün açık olmalı,
 * saat 15'in katı olmalı, hizmet gün sonuna sığmalı, çakışma olmamalı.
 */
export function randevuOlustur(randevular, veri, { bugun, yeniId }) {
  const { musteri, telefon = "", calisan, tarih, saat, hizmet } = veri || {};

  if (typeof musteri !== "string" || musteri.trim().length < 2) {
    return { hata: "Müşteri adı en az 2 karakter olmalı.", kod: "MUSTERI" };
  }
  if (!calisanBul(calisan)) return { hata: "Geçersiz çalışan seçimi.", kod: "CALISAN" };
  if (!hizmetBul(hizmet)) return { hata: "Geçersiz hizmet seçimi.", kod: "HIZMET" };
  if (!tarihGecerliMi(tarih)) return { hata: "Geçersiz tarih.", kod: "TARIH" };
  if (bugun && tarih < bugun) return { hata: "Geçmiş bir tarihe randevu alınamaz.", kod: "GECMIS_TARIH" };

  const bas = dakikaOku(saat);
  if (bas === null) return { hata: "Saat 15 dakikalık dilimlere uygun değil.", kod: "SAAT" };
  if (!gunDilimleri(tarih).length) return { hata: "O gün kapalıyız (Pazar).", kod: "KAPALI" };

  const sure = hizmetBul(hizmet).dakika;
  if (!baslangicSigiyorMu(bas, sure)) {
    return { hata: "Bu saatte işlem gün sonuna sığmıyor, daha erken bir saat seçin.", kod: "SIgMIYOR" };
  }

  if (cakismaVarMi(randevular, { calisan, tarih, saat, hizmet })) {
    return { hata: "Bu saat bu çalışanda dolu, başka bir saat seçin.", kod: "CAKISMA" };
  }

  const randevu = {
    id: yeniId ? yeniId() : `r-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    musteri: musteri.trim(),
    telefon: String(telefon).trim(),
    calisan,
    tarih,
    saat: saatYaz(bas),
    hizmet,
    sure,
    iptal: false,
    olusturma: new Date().toISOString(),
  };
  return { randevu };
}

/** Günün randevuları saat sırasıyla (iptal edilenler hariç) */
export function gunRandevulari(randevular, tarih) {
  return randevular
    .filter((r) => r.tarih === tarih && !r.iptal)
    .sort((a, b) => dakikaOku(a.saat) - dakikaOku(b.saat));
}
