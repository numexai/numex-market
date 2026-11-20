// Dijkstra rota motoru — ikili yığın (binary heap) öncelik kuyruğu
import { komsular } from './graf.js';

class MinYigin {
  constructor() { this.d = []; }
  get boyut() { return this.d.length; }
  ekle(dugum, oncelik) { this.d.push({ dugum, oncelik }); this._yukari(this.d.length - 1); }
  al() {
    const ust = this.d[0], son = this.d.pop();
    if (this.d.length) { this.d[0] = son; this._asagi(0); }
    return ust;
  }
  _yukari(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.d[p].oncelik <= this.d[i].oncelik) break;
      [this.d[p], this.d[i]] = [this.d[i], this.d[p]]; i = p;
    }
  }
  _asagi(i) {
    const n = this.d.length;
    for (;;) {
      let s = i; const l = 2 * i + 1, r = l + 1;
      if (l < n && this.d[l].oncelik < this.d[s].oncelik) s = l;
      if (r < n && this.d[r].oncelik < this.d[s].oncelik) s = r;
      if (s === i) break;
      [this.d[s], this.d[i]] = [this.d[i], this.d[s]]; i = s;
    }
  }
}

export function agirlikHesapla(yol, tip = 'sure') {
  if (tip === 'uzunluk') return yol.uzunluk;
  if (tip === 'kapasite') return yol.sure * (1 + 200 / Math.max(1, yol.kapasite));
  return yol.sure;
}

export function dijkstra(graf, baslangicId, hedefId, { agirlik = 'sure', kapaliAtla = true } = {}) {
  if (!graf.komsuluk.has(baslangicId) || !graf.komsuluk.has(hedefId)) {
    return { mesafe: Infinity, sure: Infinity, yol: [], kenarlar: [], bulundu: false };
  }
  const mesafe = new Map(), onceki = new Map(), oncekiYol = new Map();
  for (const id of graf.komsuluk.keys()) mesafe.set(id, Infinity);
  mesafe.set(baslangicId, 0);
  const yigin = new MinYigin(); yigin.ekle(baslangicId, 0);
  const kapali = new Set();
  while (yigin.boyut) {
    const { dugum } = yigin.al();
    if (kapali.has(dugum)) continue;
    kapali.add(dugum);
    if (dugum === hedefId) break;
    for (const k of komsular(graf, dugum, { kapaliAtla })) {
      const yol = graf.yollar.get(k.yolId);
      if (!yol || (kapaliAtla && yol.kapali)) continue;
      const yeni = mesafe.get(dugum) + agirlikHesapla(yol, agirlik);
      if (yeni < mesafe.get(k.hedef)) {
        mesafe.set(k.hedef, yeni); onceki.set(k.hedef, dugum); oncekiYol.set(k.hedef, k.yolId);
        yigin.ekle(k.hedef, yeni);
      }
    }
  }
  if (!isFinite(mesafe.get(hedefId))) {
    return { mesafe: Infinity, sure: Infinity, yol: [], kenarlar: [], bulundu: false };
  }
  const yol = [], kenarlar = [];
  let d = hedefId;
  while (d !== baslangicId) { yol.unshift(d); kenarlar.unshift(oncekiYol.get(d)); d = onceki.get(d); }
  yol.unshift(baslangicId);
  const maliyet = rotaMaliyeti(graf, kenarlar);
  return { mesafe: mesafe.get(hedefId), sure: maliyet.sure, uzunluk: maliyet.uzunluk, yol, kenarlar, bulundu: true };
}

export function rotaMaliyeti(graf, kenarlar) {
  let uzunluk = 0, sure = 0;
  for (const id of kenarlar) { const y = graf.yollar.get(id); if (y) { uzunluk += y.uzunluk; sure += y.sure; } }
  return { uzunluk, sure };
}

export function tumHedeflereEnKisa(graf, baslangicId, hedefler, secenekler = {}) {
  const sonuc = new Map();
  for (const h of hedefler) sonuc.set(h, dijkstra(graf, baslangicId, h, secenekler));
  return sonuc;
}
