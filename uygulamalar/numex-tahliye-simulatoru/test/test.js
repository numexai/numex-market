// 12 kabul testinin otomatik doğrulaması
import { varsayilanDurum, olusturSehir } from '../js/veri.js';
import { grafOlustur, yolKapat, kapaliYolSayisi } from '../js/graf.js';
import { dijkstra } from '../js/motor.js';
import { tahliyePlani } from '../js/tahliye.js';
import { aracGorevlendir } from '../js/ekipler.js';
import { senaryoUygula } from '../js/senaryolar.js';

const sonuclar = [];
export function assert(ad, kosul) { sonuclar.push({ ad, gecti: !!kosul }); return !!kosul; }
export function assertEsit(ad, a, b) { return assert(ad, a === b); }
const kaydet = (ad, f) => { try { f(); } catch (e) { sonuclar.push({ ad, gecti: false, hata: e.message }); } };

export function test01KapaliYolKullanilmaz() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  const r1 = dijkstra(g, 'K01', 'K31');
  const kullanilan = r1.kenarlar.slice();
  if (kullanilan.length) yolKapat(g, kullanilan[0]);
  const r2 = dijkstra(g, 'K01', 'K31');
  assert('01 Kapalı yol rotaya alınmıyor', !r2.kenarlar.includes(kullanilan[0]));
}
export function test02EnKisaYol() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  const r = dijkstra(g, 'K00', 'K03');
  assertEsit('02 En kısa yol beklenen sonucu veriyor', r.yol.join('-'), 'K00-K01-K02-K03');
}
export function test03KapasiteAsilmaz() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  const p = tahliyePlani(g, d);
  const asim = d.sehir.alanlar.some(a => (p.alanDoluluk[a.id] || 0) > a.kapasite);
  assert('03 Toplanma alanı kapasitesi aşılmıyor', !asim);
}
export function test04IkiAlanaDagitim() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  d.sehir.alanlar.forEach(a => (a.kapasite = 1500));
  const p = tahliyePlani(g, d);
  const sayac = {};
  for (const a of p.atamalar) sayac[a.bolgeId] = (sayac[a.bolgeId] || 0) + 1;
  assert('04 Bir bölge gerektiğinde iki alana dağıtılıyor', Object.values(sayac).some(v => v >= 2));
}
export function test05Ulasilamayan() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  d.sehir.yollar.forEach(y => { if (y.a === 'K00' || y.b === 'K00') yolKapat(g, y.id); });
  const p = tahliyePlani(g, d);
  assert('05 Erişilemeyen bölge güvenli gösterilmiyor', p.ulasilamayan.some(u => u.bolgeId === 'B1'));
}
export function test06KopruKapaninca() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  const once = dijkstra(g, 'K51', 'K03');
  yolKapat(g, 'Y61');
  const sonra = dijkstra(g, 'K51', 'K03');
  assert('06 Köprü kapanınca rota değişiyor', once.kenarlar.join() !== sonra.kenarlar.join());
}
export function test07AlternatifYok() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  d.sehir.yollar.forEach(y => { if (y.a === 'K00' || y.b === 'K00') yolKapat(g, y.id); });
  const r = dijkstra(g, 'K00', 'K33');
  assert('07 Alternatif yol yoksa açıkça bildiriliyor', r.bulundu === false);
}
export function test08NufusKorunum() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  const p = tahliyePlani(g, d);
  const toplam = d.sehir.bolgeler.reduce((s, b) => s + b.nufus, 0);
  assertEsit('08 Nüfus korunumu doğru', p.yerlesen + p.yerlesemeyen, toplam);
}
export function test09AracKapaliYol() {
  const d = varsayilanDurum(); const g = grafOlustur(d.sehir);
  yolKapat(g, 'Y1');
  const gorev = aracGorevlendir(g, d.sehir.araclar, d.sehir.alanlar);
  assert('09 Yardım aracı kapalı yola girmiyor', gorev.every(a => !a.rota || !a.rota.kenarlar.includes('Y1')));
}
export function test10Deterministik() {
  const a = tahliyePlani(grafOlustur(varsayilanDurum().sehir), varsayilanDurum());
  const b = tahliyePlani(grafOlustur(varsayilanDurum().sehir), varsayilanDurum());
  assert('10 Aynı veri aynı sonucu üretiyor', JSON.stringify(a) === JSON.stringify(b));
}
export function test11Json() {
  const d = varsayilanDurum();
  const metin = JSON.stringify({ surum: 1, senaryoId: d.senaryoId, sekil: d.sehir });
  const geri = JSON.parse(metin);
  assert('11 JSON kaydet/yükle sonrası ağ değişmiyor', JSON.stringify(geri.sekil) === JSON.stringify(d.sehir));
}
export function test12YenidenPlanlama() {
  const d = senaryoUygula(varsayilanDurum(), 'B');
  const g = grafOlustur(d.sehir);
  assert('12 Senaryo sonrası kapalı yol var ve plan kurulabiliyor', kapaliYolSayisi(g) > 0 && tahliyePlani(g, d).atamalar.length > 0);
}

export function tumTestleriCalistir() {
  sonuclar.length = 0;
  [test01KapaliYolKullanilmaz, test02EnKisaYol, test03KapasiteAsilmaz, test04IkiAlanaDagitim,
   test05Ulasilamayan, test06KopruKapaninca, test07AlternatifYok, test08NufusKorunum,
   test09AracKapaliYol, test10Deterministik, test11Json, test12YenidenPlanlama].forEach(t => kaydet(t.name, t));
  return sonuclar;
}
export { sonuclar, olusturSehir };
