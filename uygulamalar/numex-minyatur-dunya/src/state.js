// Durum katmanı: sahnenin VERİSİ. Görsel nesneler bundan ayrı üretilir.
// Kaydetme / yükleme / JSON / şablonlar burada.

export const SURUM = 1;
export const KAYIT_ANAHTARI = 'numex-minyatur-dunya/v1';
const PI = Math.PI;

export function bosSahne() {
  return { surum: SURUM, atmosfer: 'gunduz', tren: true, idSayac: 1, nesneler: [] };
}

export function nesneEkle(sahne, tur, x, z, rotY = 0, olcek = 1, ek = {}) {
  const o = {
    id: 'n' + (sahne.idSayac || 1),
    tur, x: +x.toFixed(3), z: +z.toFixed(3),
    rotY: +rotY.toFixed(4), olcek: +olcek.toFixed(3),
    ...ek,
  };
  sahne.idSayac = (sahne.idSayac || 1) + 1;
  sahne.nesneler.push(o);
  return o;
}

export function nesneSil(sahne, id) {
  const i = sahne.nesneler.findIndex(o => o.id === id);
  if (i >= 0) sahne.nesneler.splice(i, 1);
}

export function kopyala(sahne, id) {
  const o = sahne.nesneler.find(n => n.id === id);
  if (!o) return null;
  return nesneEkle(sahne, o.tur, o.x + 0.5, o.z + 0.5, o.rotY, o.olcek, o.rayOfset != null ? { rayOfset: o.rayOfset } : {});
}

/* ---------------- şablonlar ---------------- */
function rayDongusu(s, cx = 0, cz = 0) {
  // 6x6 kapalı döngü: 12 parça, köşeler tam birleşir
  for (const x of [-2, 0, 2]) { nesneEkle(s, 'ray', cx + x, cz - 3, PI / 2); }
  for (const x of [-2, 0, 2]) { nesneEkle(s, 'ray', cx + x, cz + 3, PI / 2); }
  for (const z of [-2, 0, 2]) { nesneEkle(s, 'ray', cx - 3, cz + z, 0); }
  for (const z of [-2, 0, 2]) { nesneEkle(s, 'ray', cx + 3, cz + z, 0); }
}

export const SABLONLAR = [
  {
    id: 'kir',
    ad: 'Kır Kasabası',
    ikon: '🏡',
    aciklama: 'Tren döngüsü, evler, kafe ve ağaçlar. Başlamak için ideal.',
    kur() {
      const s = bosSahne();
      rayDongusu(s);
      nesneEkle(s, 'lokomotif', 0, -3, 0, 1, { rayOfset: 0 });
      nesneEkle(s, 'vagon', 0, -3, 0, 1, { rayOfset: 1.35 });
      nesneEkle(s, 'vagon', 0, -3, 0, 1, { rayOfset: 2.5 });

      nesneEkle(s, 'ev', -1.35, 1.45, 0.22);
      nesneEkle(s, 'kafe', 1.5, 1.55, -0.12);
      nesneEkle(s, 'tabela', 2.2, 0.2, -0.5);
      nesneEkle(s, 'lamba', 0.15, 0.25, 0);
      nesneEkle(s, 'bank', -0.35, -1.75, 0.06);
      nesneEkle(s, 'fiskiye', 0.05, -0.9, 0);
      nesneEkle(s, 'insan', 1.1, -0.35, 2.1);
      nesneEkle(s, 'insan', -1.9, -0.7, 0.6);
      nesneEkle(s, 'kopek', -0.55, 0.0, -1.1);
      nesneEkle(s, 'cicek', 2.1, -1.25, 0);
      nesneEkle(s, 'cicek', -2.1, -1.1, 0);
      nesneEkle(s, 'cali', 2.25, -2.0, 0);
      nesneEkle(s, 'agac', -2.15, 2.3, 0);
      nesneEkle(s, 'kus', 0, 0, 0);
      nesneEkle(s, 'kus', 1.4, 2.2, 0);

      nesneEkle(s, 'kulube', -3.95, -2.2, 0.4);
      nesneEkle(s, 'cam', 3.95, -2.4, 0);
      nesneEkle(s, 'cam', -3.95, 1.6, 0);
      nesneEkle(s, 'agac', 3.9, 1.9, 0);
      nesneEkle(s, 'tas', 3.6, 3.6, 0.6);
      nesneEkle(s, 'cit', 1.0, 4.05, 0);
      nesneEkle(s, 'lamba', -3.9, 3.7, 0);
      nesneEkle(s, 'yeldegirmeni', -2.6, -3.9, 0.5);
      return s;
    },
  },
  {
    id: 'gol',
    ad: 'Göl Kenarı',
    ikon: '🏞️',
    aciklama: 'Gölet, şelale, köprü ve kayık. Su animasyonları canlı.',
    kur() {
      const s = bosSahne();
      s.atmosfer = 'gunbatimi';
      nesneEkle(s, 'golet', 1.05, 0.1, 0, 1.25);
      nesneEkle(s, 'kayik', 1.05, 0.1, 0.6);
      nesneEkle(s, 'selale', -2.9, -2.6, 0.5);
      nesneEkle(s, 'kopru', -1.9, 0.35, 1.57);
      nesneEkle(s, 'kulube', -3.3, 2.1, 0.35);
      nesneEkle(s, 'agac', -0.9, 2.9, 0);
      nesneEkle(s, 'agac', 3.4, 2.7, 0);
      nesneEkle(s, 'cam', -3.6, -0.9, 0);
      nesneEkle(s, 'cam', -1.2, -3.6, 0);
      nesneEkle(s, 'cali', 2.9, -2.2, 0);
      nesneEkle(s, 'cicek', 2.6, 2.0, 0);
      nesneEkle(s, 'cicek', 0.3, 2.6, 0);
      nesneEkle(s, 'tas', 3.5, -0.3, 0.3);
      nesneEkle(s, 'tas', -0.4, -1.6, 1.1);
      nesneEkle(s, 'lamba', 2.9, -3.4, 0);
      nesneEkle(s, 'bank', 2.3, -1.0, -1.2);
      nesneEkle(s, 'insan', 1.6, -1.9, 2.4);
      nesneEkle(s, 'kedi', -0.5, 1.4, 1.0);
      nesneEkle(s, 'kus', 0, 0, 0);
      return s;
    },
  },
  {
    id: 'kar',
    ad: 'Kar İstasyonu',
    ikon: '❄️',
    aciklama: 'Karlı akşam, sıcak lambalar ve çamlar arasında tren.',
    kur() {
      const s = bosSahne();
      s.atmosfer = 'kar';
      rayDongusu(s, 0, 0);
      nesneEkle(s, 'lokomotif', 0, -3, 0, 1, { rayOfset: 0 });
      nesneEkle(s, 'vagon', 0, -3, 0, 1, { rayOfset: 1.35 });
      nesneEkle(s, 'kulube', -1.2, 1.1, 0.1);
      nesneEkle(s, 'kulube', 1.5, 1.9, -0.3);
      nesneEkle(s, 'cam', -2.2, 2.4, 0);
      nesneEkle(s, 'cam', 2.3, 0.6, 0);
      nesneEkle(s, 'cam', -2.4, 0.0, 0);
      nesneEkle(s, 'cam', -3.9, -2.6, 0);
      nesneEkle(s, 'cam', 3.9, 2.9, 0);
      nesneEkle(s, 'cam', -3.9, 2.9, 0);
      nesneEkle(s, 'cam', 3.9, -3.4, 0);
      nesneEkle(s, 'lamba', 0.2, 0.4, 0);
      nesneEkle(s, 'lamba', -2.8, -3.6, 0);
      nesneEkle(s, 'bank', 0.6, -1.6, 3.14);
      nesneEkle(s, 'insan', -0.4, 0.2, 1.2);
      nesneEkle(s, 'kopek', 0.9, -0.6, 2.0);
      nesneEkle(s, 'cit', 2.6, 4.0, 0);
      nesneEkle(s, 'tas', -3.5, 3.7, 0);
      nesneEkle(s, 'kus', 0.5, 0.5, 0);
      return s;
    },
  },
];

/* ---------------- kayıt ---------------- */
export function kaydet(sahne) {
  try {
    localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(sahne));
    return true;
  } catch (e) { return false; }
}

export function yukle() {
  try {
    const ham = localStorage.getItem(KAYIT_ANAHTARI);
    if (!ham) return null;
    return dogrula(JSON.parse(ham));
  } catch (e) { return null; }
}

export function kayitVarMi() {
  try { return !!localStorage.getItem(KAYIT_ANAHTARI); } catch (e) { return false; }
}

/** Dışarıdan gelen JSON'u güvenli biçime çevirir. */
export function dogrula(veri) {
  if (!veri || typeof veri !== 'object' || !Array.isArray(veri.nesneler)) throw new Error('Geçersiz sahne dosyası');
  const s = bosSahne();
  s.atmosfer = veri.atmosfer || 'gunduz';
  s.tren = veri.tren !== false;
  s.idSayac = 1;
  for (const n of veri.nesneler.slice(0, 400)) {
    if (!n || typeof n.tur !== 'string') continue;
    nesneEkle(s, n.tur,
      Number.isFinite(+n.x) ? +n.x : 0,
      Number.isFinite(+n.z) ? +n.z : 0,
      Number.isFinite(+n.rotY) ? +n.rotY : 0,
      Number.isFinite(+n.olcek) ? Math.min(4, Math.max(0.2, +n.olcek)) : 1,
      n.rayOfset != null ? { rayOfset: +n.rayOfset } : {});
  }
  return s;
}
