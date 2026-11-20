// Senaryo uygulayıcıları
export function senaryoUygula(durum, senaryoId) {
  const s = durum.senaryolar[senaryoId];
  if (!s) return durum;
  const yeni = structuredClone(durum);
  yeni.senaryoId = senaryoId;
  for (const y of yeni.sehir.yollar) y.kapali = s.kapaliYollar.includes(y.id);
  for (const a of yeni.sehir.alanlar) {
    if (s.alanKapasiteleri[a.id] !== undefined) a.kapasite = s.alanKapasiteleri[a.id];
  }
  for (const b of yeni.sehir.bolgeler) {
    if (s.bolgeNufuslari[b.id] !== undefined) b.nufus = s.bolgeNufuslari[b.id];
  }
  return yeni;
}
export const senaryoA = d => senaryoUygula(d, 'A');
export const senaryoB = d => senaryoUygula(d, 'B');
export const senaryoC = d => senaryoUygula(d, 'C');
export const senaryoD = d => senaryoUygula(d, 'D');
