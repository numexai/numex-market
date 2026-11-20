// Yardım ekipleri — görev atama, en yakın erişilebilir hedef, hareket
import { dijkstra } from './motor.js';

export function enYakinErisilebilirHedef(graf, aracKonum, hedefler) {
  let enIyi = null;
  for (const h of hedefler) {
    const id = h.kavsakId || h.id;
    const r = dijkstra(graf, aracKonum, id, { agirlik: 'sure' });
    if (!r.bulundu) continue;
    if (!enIyi || r.sure < enIyi.rota.sure || (r.sure === enIyi.rota.sure && h.id < enIyi.hedefId)) {
      enIyi = { hedefId: h.id, rota: r };
    }
  }
  return enIyi;
}

export function aracGorevlendir(graf, araclar, hedefler) {
  return araclar.map(a => {
    const uygun = enYakinErisilebilirHedef(graf, a.kavsakId, hedefler);
    if (!uygun) return { aracId: a.id, aracAd: a.ad, hedefId: null, rota: null, mesafe: Infinity };
    return { aracId: a.id, aracAd: a.ad, hedefId: uygun.hedefId, rota: uygun.rota, mesafe: uygun.rota.sure };
  });
}

export function aracAdimi(arac, rota, ilerleme) {
  if (!rota || !rota.yol || rota.yol.length < 2) return null;
  const noktalar = rota.yol;
  const t = Math.max(0, Math.min(1, ilerleme)) * (noktalar.length - 1);
  const i = Math.min(noktalar.length - 2, Math.floor(t));
  return { a: noktalar[i], b: noktalar[i + 1], kesir: t - i };
}
