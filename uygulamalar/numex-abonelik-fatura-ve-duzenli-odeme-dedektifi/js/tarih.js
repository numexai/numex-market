// tarih.js — Takvim matematiği (saf, DOM'suz)
// Tüm tarihler yerel saat 12:00'a sabitlenir; saat dilimi/DST kayması olmaz.

export function tarihAyikla(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]), ay = Number(m[2]) - 1, g = Number(m[3]);
  if (ay < 0 || ay > 11 || g < 1 || g > 31) return null;
  const d = new Date(y, ay, g, 12, 0, 0, 0);
  if (d.getFullYear() !== y || d.getMonth() !== ay || d.getDate() !== g) return null;
  return d;
}

export function tarihYaz(d) {
  if (!d || isNaN(d)) return '';
  const y = d.getFullYear();
  const a = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${a}-${g}`;
}

export function bugun() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0, 0);
}

export function gunEkle(d, n) {
  const k = new Date(d.getTime());
  k.setDate(k.getDate() + n);
  k.setHours(12, 0, 0, 0);
  return k;
}

export function ayinSonGunu(yil, ay0) {
  return new Date(yil, ay0 + 1, 0, 12, 0, 0, 0).getDate();
}

export function ayinGunu(d) {
  return d.getDate();
}

// 31 Ocak + 1 ay -> 28/29 Şubat (ayın son gününe kırp).
// kaynakGun verilirse (ör. 31) sonraki ayda tekrar o güne döner.
export function ayEkleGuvenli(d, aySayisi, kaynakGun) {
  const hedefGun = kaynakGun || d.getDate();
  const yil = d.getFullYear();
  const ay0 = d.getMonth();
  const toplamAy = yil * 12 + ay0 + aySayisi;
  const yeniYil = Math.floor(toplamAy / 12);
  const yeniAy0 = ((toplamAy % 12) + 12) % 12;
  const sonGun = ayinSonGunu(yeniYil, yeniAy0);
  const gun = Math.min(hedefGun, sonGun);
  return new Date(yeniYil, yeniAy0, gun, 12, 0, 0, 0);
}

export function araliktaMi(d, bas, bit) {
  const t = d.getTime();
  return t >= bas.getTime() && t <= bit.getTime();
}

export function gunFarki(a, b) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate(), 12, 0, 0, 0);
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 12, 0, 0, 0);
  return Math.round((A.getTime() - B.getTime()) / 86400000);
}

export function haftaSerisi(baslangic, bitis) {
  const out = [];
  let t = baslangic;
  let guvenlik = 0;
  while (t.getTime() <= bitis.getTime() && guvenlik < 1000) {
    out.push(t);
    t = gunEkle(t, 7);
    guvenlik++;
  }
  return out;
}

// Abonelik serisini [baslangic, bitis] aralığında üretir (ileri + geri).
export function seriUret(abonelik, baslangic, bitis) {
  const sonuc = [];
  if (!abonelik || abonelik.durum === 'iptal') return sonuc;
  const cikis = tarihAyikla(abonelik.sonOdemeTarihi);
  if (!cikis) return sonuc;
  const siklik = abonelik.siklik || 'aylik';
  const kaynakGun = cikis.getDate();
  const adimGun = siklik === 'haftalik' ? 7 : 0;
  const adimAy = siklik === 'aylik' ? 1 : siklik === '3aylik' ? 3 : siklik === 'yillik' ? 12 : 0;
  const tutar = Number(abonelik.tutar) || 0;

  const ekle = (d) => {
    if (araliktaMi(d, baslangic, bitis)) {
      sonuc.push({ tarih: tarihYaz(d), tutar, tarihObj: d });
    }
  };

  if (siklik === 'haftalik') {
    // Geriye doğru
    let geri = cikis;
    let i = 0;
    while (geri.getTime() >= baslangic.getTime() && i < 600) {
      ekle(geri);
      geri = gunEkle(geri, -7);
      i++;
    }
    // İleriye doğru
    let ileri = gunEkle(cikis, 7);
    i = 0;
    while (ileri.getTime() <= bitis.getTime() && i < 600) {
      ekle(ileri);
      ileri = gunEkle(ileri, 7);
      i++;
    }
  } else if (adimAy > 0) {
    ekle(cikis);
    // Geriye
    let k = 1;
    while (k < 400) {
      const d = ayEkleGuvenli(cikis, -adimAy * k, kaynakGun);
      if (d.getTime() < baslangic.getTime()) break;
      ekle(d);
      k++;
    }
    // İleriye
    k = 1;
    while (k < 400) {
      const d = ayEkleGuvenli(cikis, adimAy * k, kaynakGun);
      if (d.getTime() > bitis.getTime()) break;
      ekle(d);
      k++;
    }
  }

  // Aynı gün/yinelenen kayıtları temizle
  const gorulen = new Set();
  const tekil = [];
  for (const k of sonuc) {
    if (!gorulen.has(k.tarih)) {
      gorulen.add(k.tarih);
      tekil.push(k);
    }
  }
  tekil.sort((a, b) => a.tarihObj - b.tarihObj);
  return tekil;
}

export function takvimAralik(yil, ay0) {
  return {
    bas: new Date(yil, ay0, 1, 12, 0, 0, 0),
    bit: new Date(yil, ay0, ayinSonGunu(yil, ay0), 12, 0, 0, 0)
  };
}
