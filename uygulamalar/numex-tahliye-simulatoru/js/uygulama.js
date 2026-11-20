// Uygulama denetleyicisi
import { varsayilanDurum } from './veri.js';
import { grafOlustur, yolKapat, yolAc } from './graf.js';
import { tahliyePlani } from './tahliye.js';
import { aracGorevlendir, aracAdimi } from './ekipler.js';
import { senaryoUygula } from './senaryolar.js';
import * as harita from './harita.js';
import * as panel from './panel.js';
import * as disa from './disaaktar.js';

let durum = varsayilanDurum();
let graf = grafOlustur(durum.sehir);
let svg, sonKare = 0, rafId = null;

export function planla() {
  durum.plan = tahliyePlani(graf, durum);
  durum.yenidenPlanlamaSayisi++;
  const gorevler = aracGorevlendir(graf, durum.sehir.araclar, durum.sehir.alanlar);
  durum.gorevler = gorevler;
  for (const a of durum.sehir.araclar) {
    const g = gorevler.find(x => x.aracId === a.id);
    a.aktifRota = g && g.rota ? g.rota : null;
    if (!a.ilerleme || a.ilerleme >= 1) a.ilerleme = 0;
  }
  ciz();
}

function ciz() {
  svg.__durum = durum;
  harita.haritaCiz(svg, durum, durum.plan);
  panel.kpiGuncelle(durum, durum.plan);
  panel.tabloDoldur(durum.plan);
  const yol = durum.seciliYol ? durum.sehir.yollar.find(y => y.id === durum.seciliYol) : null;
  panel.detayGoster(yol);
}

function yolDegistir(yolId) {
  const y = durum.sehir.yollar.find(x => x.id === yolId);
  if (!y) return;
  y.kapali ? yolAc(graf, yolId) : yolKapat(graf, yolId);
  planla();
}

function secimYap(yolId) {
  durum.seciliYol = durum.seciliYol === yolId ? null : yolId;
  ciz();
}

function senaryoSec(id) {
  durum = senaryoUygula(durum, id);
  graf = grafOlustur(durum.sehir);
  durum.seciliYol = null;
  planla();
}

function nufusAyarla(bolgeId, deger) {
  const b = durum.sehir.bolgeler.find(x => x.id === bolgeId);
  if (b) { b.nufus = Math.max(0, deger); planla(); }
}
function kapasiteAyarla(alanId, deger) {
  const a = durum.sehir.alanlar.find(x => x.id === alanId);
  if (a) { a.kapasite = Math.max(0, deger); planla(); }
}
function hizAyarla(h) { durum.simule.hiz = h; }

export function simulasyonBaslat() {
  durum.simule.calisiyor = true;
  sonKare = performance.now();
  if (!rafId) rafId = requestAnimationFrame(dongu);
}
export function simulasyonDurdur() {
  durum.simule.calisiyor = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
export function dongu(zaman) {
  if (!durum.simule.calisiyor) { rafId = null; return; }
  const dt = Math.min(100, zaman - sonKare); sonKare = zaman;
  for (const a of durum.sehir.araclar) {
    if (!a.aktifRota) continue;
    a.ilerleme += (dt / 1000) * 0.12 * durum.simule.hiz;
    if (a.ilerleme > 1) a.ilerleme = 1;
    const adim = aracAdimi(a, a.aktifRota, a.ilerleme);
    if (adim) {
      const pa = durum.sehir.kavsaklar.find(k => k.id === adim.a);
      const pb = durum.sehir.kavsaklar.find(k => k.id === adim.b);
      if (pa && pb) a.konum = { x: pa.x + (pb.x - pa.x) * adim.kesir, y: pa.y + (pb.y - pa.y) * adim.kesir };
    }
  }
  ciz();
  rafId = requestAnimationFrame(dongu);
}

async function jsonYukleDosya(dosya) {
  try {
    const v = await disa.jsonYukle(dosya);
    durum.sehir = v.sekil;
    durum.senaryoId = v.senaryoId || 'A';
    durum.seciliYol = v.seciliYol || null;
    durum.yenidenPlanlamaSayisi = v.yenidenPlanlamaSayisi || 0;
    graf = grafOlustur(durum.sehir);
    planla();
    panel.panelKur(durum, eylemler);
  } catch (e) {
    alert('Proje yüklenemedi: ' + e.message);
  }
}

const eylemler = {
  senaryoSec, planla, yolDegistir, nufusAyarla, kapasiteAyarla, hizAyarla,
  simulasyonBaslat, simulasyonDurdur,
  jsonKaydet: () => disa.jsonKaydet(durum),
  jsonYukle: jsonYukleDosya,
  csvAktar: () => disa.csvAktar(durum.plan),
  svgAktar: () => disa.svgAktar(svg),
  rapor: () => disa.raporIndir(durum, durum.plan),
};

export function baslat() {
  svg = document.getElementById('harita');
  svg.setAttribute('viewBox', '0 0 760 640');
  planla();
  panel.panelKur(durum, eylemler);
  harita.suruklemeBagla(svg, durum, () => { svg.__durum = durum; harita.haritaCiz(svg, durum, durum.plan); });
  harita.yolTiklamaBagla(svg, secimYap);
  window.__numexAfet = { get durum() { return durum; }, planla, senaryoSec, yolDegistir };
}

document.addEventListener('DOMContentLoaded', baslat);
