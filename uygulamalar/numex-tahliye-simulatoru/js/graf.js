// Yol ağı grafiği
export function grafOlustur(sehir) {
  const komsuluk = new Map(), yollar = new Map();
  for (const k of sehir.kavsaklar) komsuluk.set(k.id, []);
  for (const y of sehir.yollar) {
    yollar.set(y.id, y);
    komsuluk.get(y.a).push({ yolId: y.id, hedef: y.b, uzunluk: y.uzunluk, sure: y.sure, kapasite: y.kapasite });
    komsuluk.get(y.b).push({ yolId: y.id, hedef: y.a, uzunluk: y.uzunluk, sure: y.sure, kapasite: y.kapasite });
  }
  return { komsuluk, yollar };
}
export function yolKapat(graf, yolId) {
  const y = graf.yollar.get(yolId); if (!y) return false; y.kapali = true; return true;
}
export function yolAc(graf, yolId) {
  const y = graf.yollar.get(yolId); if (!y) return false; y.kapali = false; return true;
}
export function komsular(graf, kavsakId, { kapaliAtla = true } = {}) {
  const liste = graf.komsuluk.get(kavsakId) || [];
  if (!kapaliAtla) return liste.slice();
  return liste.filter(k => !(graf.yollar.get(k.yolId) || {}).kapali);
}
export function yolGetir(graf, yolId) { return graf.yollar.get(yolId) || null; }
export function kapaliYolSayisi(graf) {
  let s = 0; for (const y of graf.yollar.values()) if (y.kapali) s++; return s;
}
