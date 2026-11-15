/*
 * NUMEX İPEK YOLU — deterministik ekonomi testleri
 * Çalıştır: node tests/ekonomi.test.js
 */
"use strict";
const E = require("../js/ekonomi.js");

let gecen = 0, kalan = 0;
const hatalar = [];

function esit(ad, gelen, beklenen, tolerans) {
  const t = tolerans == null ? 0 : tolerans;
  if (Math.abs(gelen - beklenen) <= t) { gecen++; console.log("  ✓ " + ad); }
  else { kalan++; hatalar.push(ad + " — gelen: " + gelen + " beklenen: " + beklenen); console.log("  ✗ " + ad + " (gelen " + gelen + ", beklenen " + beklenen + ")"); }
}
function dogru(ad, kosul, ayrinti) {
  if (kosul) { gecen++; console.log("  ✓ " + ad); }
  else { kalan++; hatalar.push(ad + (ayrinti ? " — " + ayrinti : "")); console.log("  ✗ " + ad + (ayrinti ? " — " + ayrinti : "")); }
}
function ilerlet(sim, saat) { for (let i = 0; i < saat; i++) sim.adim(1); }

/* ------------------------------------------------------------------ 1. temel */
console.log("\n[1] Fiyat = arz/talep");
{
  const sim = new E.Sim({ tohum: 1 });
  const s = sim.sehirler.buhara;
  const oncekiFiyat = s.fiyat.ipek;
  s.stok.ipek = s.stok.ipek * 0.2;   // stok beşte bire inerse
  sim.fiyatHesapla(s);
  dogru("stok düşünce fiyat yükselir", s.fiyat.ipek > oncekiFiyat, oncekiFiyat + " -> " + s.fiyat.ipek);
  s.stok.ipek = sim.hedefStok(s, E.URUN_HARITA.ipek) * 5;
  sim.fiyatHesapla(s);
  dogru("stok dolunca fiyat düşer", s.fiyat.ipek < oncekiFiyat);
  dogru("fiyat taban sınırının altına inmez", s.fiyat.ipek >= E.URUN_HARITA.ipek.taban * 0.35 - 0.001, "fiyat " + s.fiyat.ipek);
}

/* --------------------------------------------------------------- 2. alım-satım */
console.log("\n[2] Alım / satım");
{
  const sim = new E.Sim({ tohum: 2 });
  const k = sim.kervanlar.find(x => x.sahip === "oyuncu");
  const s = sim.sehirler.semerkant;
  const stokOnce = s.stok.ipek;
  const sermayeOnce = sim.oyuncu.sermaye;
  const r = sim.al(k, "ipek", 20);
  dogru("alım başarılı", r.ok, r.mesaj);
  esit("kervana 20 ipek girdi", k.yuk.ipek, 20);
  dogru("şehir stoğu azaldı", s.stok.ipek < stokOnce, stokOnce + " -> " + s.stok.ipek);
  dogru("sermaye azaldı", sim.oyuncu.sermaye < sermayeOnce, sermayeOnce + " -> " + sim.oyuncu.sermaye);

  const stokOrta = s.stok.ipek, sermayeOrta = sim.oyuncu.sermaye;
  const r2 = sim.sat(k, "ipek", 20);
  dogru("satım başarılı", r2.ok, r2.mesaj);
  esit("kervan yükü boşaldı", k.yuk.ipek || 0, 0);
  dogru("şehir stoğu arttı", s.stok.ipek > stokOrta);
  dogru("sermaye arttı", sim.oyuncu.sermaye > sermayeOrta);

  const r3 = sim.al(k, "ipek", 99999);
  dogru("kapasiteyi aşan alım reddedilir", !r3.ok, r3.mesaj);
}

/* ------------------------------------------------------------- 3. rota / kapanma */
console.log("\n[3] Rota ve yol kapanması");
{
  const sim = new E.Sim({ tohum: 3 });
  const normal = sim.rota("semerkant", "buhara");
  dogru("doğrudan rota var", normal && normal.sehirler.length === 2, normal ? normal.sehirler.join(">") : "yok");
  esit("doğrudan rota 260 km", normal.km, 260);

  // 3. güne kadar ilerlet -> kriz
  ilerlet(sim, 24 * 2 + 12);
  const kapanan = sim.yolBul("semerkant", "buhara");
  dogru("ana yol krizle kapandı", kapanan.kapali, "kapalı: " + kapanan.kapali);

  const alternatif = sim.rota("semerkant", "buhara");
  dogru("alternatif rota bulundu", !!alternatif);
  dogru("alternatif rota daha uzun", alternatif && alternatif.km > 260, alternatif ? alternatif.km + " km" : "");
  dogru("alternatif rota kapalı yolu kullanmıyor", alternatif && alternatif.yollar.every(y => !y.kapali));

  // yol açılınca doğrudan rota geri gelir
  ilerlet(sim, 42);
  dogru("yol yeniden açıldı", !sim.yolBul("semerkant", "buhara").kapali);
  const tekrar = sim.rota("semerkant", "buhara");
  esit("doğrudan rota geri döndü (260 km)", tekrar.km, 260);
}

/* --------------------------------------------------- 4. krizin fiyatlara etkisi */
console.log("\n[4] Krizin gerçek ekonomik sonucu");
{
  const sim = new E.Sim({ tohum: 4 });
  // ölçüm krizden hemen önce: 3. gün 08:00 (başlangıç 1. gün 07:00 → 49 saat)
  ilerlet(sim, 24 * 2 + 1);
  const maliyetOnce = sim.rota("semerkant", "buhara").maliyet;
  const buharaSeramik = sim.sehirler.buhara.fiyat.seramik;
  const semerkantStok = sim.sehirler.semerkant.stok.seramik;
  const buharaStok = sim.sehirler.buhara.stok.seramik;

  ilerlet(sim, 26);   // kriz hâlâ sürüyor (5. gün 01:00'e kadar)
  dogru("kriz anında yol kapalı", sim.yolBul("semerkant", "buhara").kapali);
  const alternatif = sim.rota("semerkant", "buhara");
  dogru("alternatif güzergâh maliyeti arttı", alternatif.maliyet > maliyetOnce * 1.5,
    Math.round(maliyetOnce) + " -> " + Math.round(alternatif.maliyet));
  dogru("Semerkant'ta seramik birikti (ihraç edilemiyor)",
    sim.sehirler.semerkant.stok.seramik > semerkantStok,
    Math.round(semerkantStok) + " -> " + Math.round(sim.sehirler.semerkant.stok.seramik));
  dogru("Buhara'da seramik stoğu eridi (kervan gelemiyor)",
    sim.sehirler.buhara.stok.seramik < buharaStok,
    Math.round(buharaStok) + " -> " + Math.round(sim.sehirler.buhara.stok.seramik));
  dogru("Buhara'da seramik fiyatı yükseldi", sim.sehirler.buhara.fiyat.seramik > buharaSeramik,
    buharaSeramik + " -> " + sim.sehirler.buhara.fiyat.seramik);

  // kriz bittikten sonra kademeli denge
  const zirveFiyat = Math.max(sim.sehirler.buhara.fiyat.seramik, buharaSeramik);
  ilerlet(sim, 70);
  dogru("yol açıldıktan sonra fiyat zirveden gevşedi",
    sim.sehirler.buhara.fiyat.seramik < zirveFiyat || sim.sehirler.buhara.fiyat.seramik <= E.URUN_HARITA.seramik.taban * 1.2,
    zirveFiyat + " -> " + sim.sehirler.buhara.fiyat.seramik);
}

/* ----------------------------------------------------------- 5. kervan varış */
console.log("\n[5] Kervan varışı ve kâr");
{
  const sim = new E.Sim({ tohum: 5 });
  const k = sim.kervanlar.find(x => x.sahip === "oyuncu");
  sim.al(k, "seramik", 40);
  const rota = sim.rota("semerkant", "buhara");
  sim.kervanGit(k, rota);
  dogru("kervan yolda", k.durum === "yolda");
  const sermayeOnce = sim.oyuncu.sermaye;
  let saat = 0;
  while (k.durum === "yolda" && saat < 40) { sim.adim(1); saat++; }
  dogru("kervan hedefe ulaştı", k.sehir === "buhara", "konum: " + k.sehir + " (" + saat + " saat)");
  dogru("yük boşaldı", Object.keys(k.yuk).length === 0);
  dogru("satış geliri kasaya girdi", sim.oyuncu.sermaye > sermayeOnce - 1);
  dogru("varış makul sürede", saat <= 14, saat + " saat");
}

/* ------------------------------------------------------------- 6. determinizm */
console.log("\n[6] Determinizm");
{
  const a = new E.Sim({ tohum: 42 });
  const b = new E.Sim({ tohum: 42 });
  ilerlet(a, 60); ilerlet(b, 60);
  let ayni = true;
  Object.keys(a.sehirler).forEach(sid => {
    E.URUNLER.forEach(u => {
      if (Math.abs(a.sehirler[sid].stok[u.id] - b.sehirler[sid].stok[u.id]) > 1e-6) ayni = false;
      if (Math.abs(a.sehirler[sid].fiyat[u.id] - b.sehirler[sid].fiyat[u.id]) > 1e-6) ayni = false;
    });
  });
  dogru("aynı tohum aynı durumu üretir", ayni);
  // farklı tohum: rastgele dizi (hava/olay/tüccar kararı kaynağı) farklı olmalı
  const r1 = new E.Rastgele(42), r2 = new E.Rastgele(43);
  let diziAyni = true;
  for (let i = 0; i < 50; i++) if (Math.abs(r1.sonraki() - r2.sonraki()) > 1e-9) diziAyni = false;
  dogru("farklı tohum farklı rastgele dizi üretir", !diziAyni);
  const simA = new E.Sim({ tohum: 42 }), simB = new E.Sim({ tohum: 43 });
  let havaFarki = false;
  for (let i = 0; i < 200; i++) {
    simA.adim(1); simB.adim(1);
    Object.keys(simA.sehirler).forEach(sid => { if (simA.sehirler[sid].hava !== simB.sehirler[sid].hava) havaFarki = true; });
  }
  dogru("farklı tohum farklı hava geçmişi üretir", havaFarki);
}

/* ------------------------------------------------------------ 7. kaydet/yükle */
console.log("\n[7] Kayıt / geri yükleme");
{
  const sim = new E.Sim({ tohum: 7 });
  ilerlet(sim, 30);
  const k = sim.kervanlar.find(x => x.sahip === "oyuncu");
  sim.al(k, "baharat", 15);
  const kayit = JSON.parse(JSON.stringify(sim.kaydet()));
  const yuklenen = E.Sim.geriYukle(kayit);
  dogru("kayıt geri yüklendi", !!yuklenen);
  esit("gün korundu", yuklenen.gun, sim.gun);
  esit("sermaye korundu", yuklenen.oyuncu.sermaye, sim.oyuncu.sermaye, 0.001);
  esit("stok korundu", yuklenen.sehirler.buhara.stok.ipek, sim.sehirler.buhara.stok.ipek, 0.001);
  esit("kervan sayısı korundu", yuklenen.kervanlar.length, sim.kervanlar.length);
  const ky = yuklenen.kervanlar.find(x => x.sahip === "oyuncu");
  esit("kervan yükü korundu", ky.yuk.baharat, 15);
}

/* ------------------------------------------------------- 8. NPC kâr gözetimi */
console.log("\n[8] Tüccar kararı kör değil");
{
  const sim = new E.Sim({ tohum: 8 });
  const npc = sim.kervanlar.find(x => x.sahip === "npc");
  // yükü yok, karar verdiğinde ya kârlı rotaya çıkar ya bekler
  npc.sehir = "merv";
  npc.yuk = {};
  npc.sermaye = 1200;
  sim.npcKarar(npc);
  if (npc.durum === "yolda") {
    dogru("kârlı rota bulunca yola çıkıyor", npc.hedef && npc.hedef !== "merv");
    dogru("yükü var", Object.keys(npc.yuk).length > 0);
    dogru("yükü kapasitesini aşmıyor", sim.kervanYukToplam(npc) <= npc.kapasite + 0.001, sim.kervanYukToplam(npc) + "/" + npc.kapasite);
  } else {
    dogru("kâr yoksa beklemede kalıyor", npc.durum === "sehirde");
  }
}

/* ------------------------------------------------------------ 9. sınır değerler */
console.log("\n[9] Sınır durumlar");
{
  const sim = new E.Sim({ tohum: 9 });
  const k = sim.kervanlar.find(x => x.sahip === "oyuncu");
  const r = sim.al(k, "ipek", 0);
  dogru("sıfır miktar reddedilir", !r.ok);
  const r2 = sim.sat(k, "ipek", 5);
  dogru("olmayan mal satılamaz", !r2.ok, r2.mesaj);
  const r3 = sim.al(k, "yokboyle", 5);
  dogru("olmayan ürün reddedilir", !r3.ok);

  // 200 saat sonra hiçbir stok negatif değil, fiyat sınırlar içinde
  ilerlet(sim, 200);
  let temiz = true;
  Object.keys(sim.sehirler).forEach(sid => {
    E.URUNLER.forEach(u => {
      const s = sim.sehirler[sid];
      if (s.stok[u.id] < 0) temiz = false;
      if (s.fiyat[u.id] < u.taban * 0.35 - 0.01 || s.fiyat[u.id] > u.taban * 3.4 + 0.01) temiz = false;
    });
  });
  dogru("200 saat sonra stoklar negatife düşmüyor, fiyatlar sınır içinde", temiz);

  const yeniKervan = sim.kervanSatinAl();
  dogru("sermaye yetince yeni kervan alınır", yeniKervan.ok, yeniKervan.mesaj);
  sim.oyuncu.sermaye = 10;
  const pahali = sim.kervanSatinAl();
  dogru("sermaye yetmeyince kervan alınmaz", !pahali.ok, pahali.mesaj);
}

/* ------------------------------------------------------------------- özet */
console.log("\n========================================");
console.log("Geçen: " + gecen + " · Başarısız: " + kalan);
if (kalan) { console.log("Hatalar:\n - " + hatalar.join("\n - ")); process.exit(1); }
console.log("Tüm ekonomi testleri geçti.");
