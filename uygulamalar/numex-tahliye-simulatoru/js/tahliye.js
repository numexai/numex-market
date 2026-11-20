// Tahliye motoru — kapasite dağıtımı, çoklu alan paylaştırma, ulaşılamaz tespiti
import { dijkstra } from './motor.js';

export function alanKapasiteKalan(alan, alanDoluluk) {
  return Math.max(0, (alan.kapasite || 0) - (alanDoluluk[alan.id] || 0));
}

export function ulasilabilirAlanlar(graf, bolge, alanlar) {
  return alanlar.filter(a => dijkstra(graf, bolge.kavsakId, a.kavsakId, { agirlik: 'sure' }).bulundu);
}

// Bölge nüfusunu, toplam süresi en kısa alandan başlayarak sığdıkça çoklu alana dağıtır
export function bolgeDagit(graf, bolge, alanlar, alanDoluluk) {
  const uygun = [];
  for (const a of alanlar) {
    const r = dijkstra(graf, bolge.kavsakId, a.kavsakId, { agirlik: 'sure' });
    if (r.bulundu) uygun.push({ alan: a, rota: r, kalan: alanKapasiteKalan(a, alanDoluluk) });
  }
  uygun.sort((x, y) => (x.rota.sure - y.rota.sure) || x.alan.id.localeCompare(y.alan.id));
  const atamalar = [];
  let kalanNufus = bolge.nufus;
  for (const u of uygun) {
    if (kalanNufus <= 0) break;
    if (u.kalan <= 0) continue;
    const kisi = Math.min(kalanNufus, u.kalan);
    alanDoluluk[u.alan.id] = (alanDoluluk[u.alan.id] || 0) + kisi;
    atamalar.push({ bolgeId: bolge.id, bolgeAd: bolge.ad, alanId: u.alan.id, alanAd: u.alan.ad, kisi, rota: u.rota.yol, kenarlar: u.rota.kenarlar, sure: u.rota.sure });
    kalanNufus -= kisi;
  }
  return { atamalar, kalanNufus, ulasilabilir: uygun.length > 0 };
}

export function tahliyePlani(graf, durum) {
  const { bolgeler, alanlar } = durum.sehir;
  const alanDoluluk = {};
  for (const a of alanlar) alanDoluluk[a.id] = 0;
  const atamalar = [], ulasilamayan = [], uyarilar = [];
  let yerlesen = 0, yerlesemeyen = 0, sureToplam = 0, sureAdet = 0;
  for (const bolge of bolgeler) {
    const sonuc = bolgeDagit(graf, bolge, alanlar, alanDoluluk);
    atamalar.push(...sonuc.atamalar);
    for (const a of sonuc.atamalar) { yerlesen += a.kisi; sureToplam += a.sure; sureAdet++; }
    if (sonuc.kalanNufus > 0) {
      yerlesemeyen += sonuc.kalanNufus;
      ulasilamayan.push({ bolgeId: bolge.id, ad: bolge.ad, kisi: sonuc.kalanNufus, neden: sonuc.ulasilabilir ? 'Kapasite yetersiz' : 'Hiçbir toplanma alanına erişilemiyor' });
    }
  }
  if (ulasilamayan.length) {
    uyarilar.push(`UYARI: ${ulasilamayan.length} bölge tam olarak yerleştirilemedi. Güvenli rota üretilmedi.`);
  }
  return { atamalar, yerlesen, yerlesemeyen, ulasilamayan, alanDoluluk, ortSure: sureAdet ? sureToplam / sureAdet : 0, uyarilar };
}

export function nufusKorunumKontrol(plan, durum) {
  const toplam = durum.sehir.bolgeler.reduce((s, b) => s + b.nufus, 0);
  return { dogru: plan.yerlesen + plan.yerlesemeyen === toplam, toplam, yerlesen: plan.yerlesen, yerlesemeyen: plan.yerlesemeyen };
}

export function ortalamaSure(plan) { return plan.ortSure || 0; }
