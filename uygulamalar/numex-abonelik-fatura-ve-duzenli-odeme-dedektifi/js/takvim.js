// Numex — ödeme takvimi üretimi
import { seriUret, bugun as bugunFn, gunEkle, tarihYaz, tarihAyikla, ayinSonGunu } from './tarih.js';
import { GUNLER } from './bicim.js';

// Tüm ödeme kalemleri (senaryo 'iptal' olanlar hariç — takvim gerçeği gösterir,
// ancak senaryo önizlemesi senaryo.js'te ayrı üretilir)
export function tumOdemeler(durum, bas, bit) {
  const out = [];
  for (const a of durum.abonelikler || []) {
    if (a.durum === 'iptal') continue;
    const odemeler = a.odemeler || {};
    for (const o of seriUret(a, bas, bit)) {
      out.push({
        abonelikId: a.id,
        hizmetAdi: a.hizmetAdi,
        kategori: a.kategori,
        paraBirimi: a.paraBirimi,
        tarih: o.tarih,
        tutar: o.tutar,
        odendi: odemeler[o.tarih] === true,
        zorunlu: a.zorunlu,
        otomatikYenileme: a.otomatikYenileme
      });
    }
  }
  out.sort((x, y) => (x.tarih < y.tarih ? -1 : x.tarih > y.tarih ? 1 : x.hizmetAdi.localeCompare(y.hizmetAdi, 'tr')));
  return out;
}

export function odemeDurumu(kalem, bugunT = bugunFn()) {
  if (kalem.odendi) return 'odendi';
  const d = tarihAyikla(kalem.tarih);
  if (d && d < bugunT) return 'gecikmis';
  return 'bekliyor';
}

export function yaklasanOdemeler(durum, bugunT = bugunFn(), gunSayisi = 30) {
  return tumOdemeler(durum, bugunT, gunEkle(bugunT, gunSayisi))
    .filter(k => k.tarih >= tarihYaz(bugunT));
}

// Gecikmiş = SON 30 gün içinde vadesi geçmiş VE ödenmemiş kalemler.
// Her abonelik için EN YENİ vadesi geçmiş tek kalem gösterilir (aynı abonelik
// arka arkaya 5 kez "gecikmiş" görünüp listeyi şişirmesin).
export function gecikmisler(durum, bugunT = bugunFn()) {
  const hepsi = tumOdemeler(durum, gunEkle(bugunT, -30), gunEkle(bugunT, -1))
    .filter(k => !k.odendi);
  const son = new Map();
  for (const k of hepsi) {
    const varOlan = son.get(k.abonelikId);
    if (!varOlan || k.tarih > varOlan.tarih) son.set(k.abonelikId, k);
  }
  return [...son.values()].sort((a, b) => (a.tarih < b.tarih ? -1 : 1));
}

// Aylık ızgara: hafta dizisi (Pazartesi başlangıç), her gün hücresi + o günün ödemeleri
export function aylikIzgara(yil, ay0, durum) {
  const ilk = new Date(yil, ay0, 1, 12);
  const sonGun = ayinSonGunu(yil, ay0);
  const son = new Date(yil, ay0, sonGun, 12);
  const kalemler = tumOdemeler(durum, ilk, son);

  const gunler = {};
  for (const k of kalemler) (gunler[k.tarih] = gunler[k.tarih] || []).push(k);

  // Pazartesi = 0
  const kaydirma = (ilk.getDay() + 6) % 7;
  const hucreler = [];
  for (let i = 0; i < kaydirma; i++) hucreler.push(null);
  for (let g = 1; g <= sonGun; g++) {
    const d = new Date(yil, ay0, g, 12);
    const iso = tarihYaz(d);
    hucreler.push({ gun: g, iso, odemeler: gunler[iso] || [] });
  }
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  const haftalar = [];
  for (let i = 0; i < hucreler.length; i += 7) haftalar.push(hucreler.slice(i, i + 7));
  return { haftalar, baslikGunler: GUNLER, kalemler };
}

export { seriUret };
