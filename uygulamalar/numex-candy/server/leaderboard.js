/**
 * Numex Candy — Skor tablosu (bellek içi)
 * ------------------------------------------------------------
 * Bu basit sürümde skorlar süreç belleğinde tutulur.
 * Kalıcı depolama (SQLite/Postgres) için `depo.js` arayüzü genişletilebilir.
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

const skorlar = new Map(); // levelId -> [{ isim, skor, yildiz, tarih }]
const MAX_KAYIT = 10;

/** Bir bölüme skor kaydeder, güncel tabloyu döner. */
export function skorKaydet(levelId, isim, skor, yildiz) {
  const anahtar = Number(levelId);
  if (!skorlar.has(anahtar)) skorlar.set(anahtar, []);

  const liste = skorlar.get(anahtar);
  const temizIsim = String(isim || 'Gizli Şeker').slice(0, 20).trim() || 'Gizli Şeker';

  liste.push({
    isim: temizIsim,
    skor: Number(skor) || 0,
    yildiz: Number(yildiz) || 0,
    tarih: new Date().toISOString(),
  });

  liste.sort((a, b) => b.skor - a.skor);
  if (liste.length > MAX_KAYIT) liste.length = MAX_KAYIT;

  return liste;
}

/** Bir bölümün skor tablosunu döner. */
export function skorTablosu(levelId) {
  return skorlar.get(Number(levelId)) || [];
}

/** Oyuncunun bir bölümdeki en iyi yıldızını döner. */
export function enIyiYildiz(levelId, isim) {
  const liste = skorlar.get(Number(levelId)) || [];
  const oyuncu = liste.filter((s) => s.isim === isim);
  if (oyuncu.length === 0) return 0;
  return Math.max(...oyuncu.map((s) => s.yildiz));
}

/** Test/temizlik için tüm tabloyu sıfırlar. */
export function tabloyuSifirla() {
  skorlar.clear();
}
