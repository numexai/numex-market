/* =====================================================================
   İnsan Dolaşım & Sinir Sistemi — Canlı Canvas Simülasyonu
   ---------------------------------------------------------------------
   Kalp pompalar, kan damar Bezier eğrileri boyunca akar (oksijenli
   parlak kırmızı / oksijensiz koyu), sinir dürtüleri kalpten yayılır,
   nabız dalgaları damarları şişirir. Kullanıcı aktiviteyi seçer:
     Otur (~72bpm) -> Hafif Koşu (~110bpm) -> Hızlı Koşu (~160bpm)
   Kalp hızı VE kan akış hızı, hedefe yumuşakça yaklaşarak değişir.
   Dış bağımlılık YOK — saf DOM + Canvas + requestAnimationFrame.
   ===================================================================== */

'use strict';

/* ====================== CANVAS & DOM ================================ */
const tuval = document.getElementById('tuval');
const ctx = tuval.getContext('2d');
const W = tuval.width;
const H = tuval.height;

const hudBpm   = document.getElementById('bpmDeger');
const hudAktif = document.getElementById('aktivDeger');
const hudKan   = document.getElementById('kanHucresiDeger');
const hudSinir = document.getElementById('sinirDeger');
const hudNabiz = document.getElementById('nabizDeger');
const btnOtur  = document.getElementById('btnOtur');
const btnYavas = document.getElementById('btnYavas');
const btnHizli = document.getElementById('btnHizli');
const aktiviteBtnlar = [btnOtur, btnYavas, btnHizli];
const notlarEl = document.querySelector('.bilgiNotlar');

/* ================== YARDIMCILAR ===================================== */
function nokta(x, y) { return { x: x, y: y }; }
function yumusak(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function yakinlik(a, b, t) { return a * (1 - t) + b * t; }
function cfgNokta() { return nokta(W * 0.5, H * 0.42); }

/* =====================================================================
   AKTİVİTE -> KALP HIZI HEDEFİ
   idle ~72 bpm (normal, dinlenme), jog ~110 bpm (hafif koşu),
   sprint ~160 bpm (hızlı koşu -> maksimum efor).
   ===================================================================== */
const AKTIVITE_TANIM = {
  idle:   { bpm: 72,  kanSayi: 34,  sinirSayi: 3,  ad: 'Otur',      yazi: '😌 Dinlenme hâli — kalbin normal atıyor.' },
  jog:    { bpm: 110, kanSayi: 56,  sinirSayi: 7,  ad: 'Hafif Koşu', yazi: '🏃 Kalp hızlandı, kan hücreleri daha hızlı akıyor.' },
  sprint: { bpm: 160, kanSayi: 86,  sinirSayi: 14, ad: 'Hızlı Koşu', yazi: '⚡ Maksimum efor! Kalp çok çalışıyor, sinir dürtüleri yoğun.' }
};

/* ================== GLOBAL DURUM ==================================== */
let aktivite = 'idle';        // 'idle' | 'jog' | 'sprint'
let calisiyor = true;
let hedefBpm = 72;            // aktiviteye göre hedef kalp atışı
let guncelBpm = 72;           // yumuşakça hedefe yaklaşan değer
let faz = 0;                  // 0..1 kalp atış fazı (0 başlangıç sistol öncesi)
let zamanGeo = 0;             // toplam süre (sn)
let damarAg = [];             // statik damar Bezier eğrileri
let kanHucreleri = [];        // hareketli kan damlacıkları
let sinirDurtuleri = [];      // kalpten yayılan sinir kıvılcımları
let nabizDalgasi = { aktif: false, konum: 0, guclu: 0 }; // damar şişmesi
let aktifNabizSayisi = 0;

/* =====================================================================
   AKTİVİTE UYGULA
   Hedef BPM'i ve kan/sinir yoğunluğunu günceller; partikülleri yeniler.
   ===================================================================== */
function setActivity(mod) {
  if (!AKTIVITE_TANIM[mod]) return;
  // Eski buton stilini temizle
  aktiviteBtnlar.forEach(function (b) { b.classList.remove('aktif'); });
  aktivite = mod;
  var tanim = AKTIVITE_TANIM[mod];
  // Yeni seçilen butonu işaretle
  if (mod === 'idle') btnOtur.classList.add('aktif');
  else if (mod === 'jog') btnYavas.classList.add('aktif');
  else if (mod === 'sprint') btnHizli.classList.add('aktif');
  hedefBpm = tanim.bpm;
  notlarEl.textContent = tanim.yazi;
  yenidenUret(mod);
}

/* Aktivite değişince kan/sinir partikül havuzunu hedef yoğunlukla senkronlar */
function yenidenUret(mod) {
  var tanim = AKTIVITE_TANIM[mod];
  // Kan hücre eşle, yeterliyse kalsın
  while (kanHucreleri.length < tanim.kanSayi && kanHucreleri.length < 120) {
    kanHucreleri.push(yeniKanHucresi());
  }
  kanHucreleri = kanHucreleri.slice(0, tanim.kanSayi);
  // Sinir dürtüleri senkron
  while (sinirDurtuleri.length < tanim.sinirSayi) {
    sinirDurtuleri.push(yeniSinirImpulsu(0));
  }
  sinirDurtuleri = sinirDurtuleri.slice(0, tanim.sinirSayi);
}

/* Kalbin o anki fazına göre üretilecek nabız hızı / dürtü sayısı */
function calcHeartRate(dt) {
  // bpm'i hedefe yaklaştır (sn cinsinden yumuşak geçiş, ~2s zaman sabiti)
  guncelBpm = yakinlik(guncelBpm, hedefBpm, Math.min(1, dt * 0.8));
  return guncelBpm;
}

/* =====================================================================
   DAMAR AĞI (Anatomi)
   Statik Bezier eğrileri ile ana dolaşım yolları:
   aorta (kalpten çıkar), pulmoner (akciğere), vücut damarları (perifer/
   beyin) ve geri dönüş venaları. Her damar bir "id" taşır; kan
   partikülleri bu eğriler üzerinde ilerler.
   ===================================================================== */
function damarHazirla(x1, y1, c1x, c1y, c2x, c2y, x2, y2, tip, cap) {
  return {
    x1: x1, y1: y1, c1x: c1x, c1y: c1y,
    c2x: c2x, c2y: c2y, x2: x2, y2: y2,
    tip: tip, cap: cap || 5
  };
}

function buildVessels() {
  var hx = W * 0.5, hy = H * 0.42;      // kalp merkezi
  var ag = [];
  var capAna = 9, capOrta = 5, capKapi = 2;

  // --- AORTA: kalp -> göğüs -> baş (yukarı) ve karın (aşağı) ---
  ag.push(damarHazirla(hx + 20, hy, hx + 60, hy - 10, hx + 70, hy - 70, hx + 30, hy - 150, 'arter', capAna));   // aort yukarı
  ag.push(damarHazirla(hx - 5, hy + 14, hx - 5, hy + 70, hx - 5, hy + 90, hx + 40, hy + 160, 'arter', capAna)); // aort aşağı (karın)

  // --- PULMONER (akciğere) ---
  ag.push(damarHazirla(hx - 20, hy + 4, hx - 70, hy + 6, hx - 95, hy - 40, hx - 170, hy - 60, 'arter', capOrta)); // sağ akciğer
  ag.push(damarHazirla(hx + 34, hy + 14, hx + 80, hy + 26, hx + 100, hy - 30, hx + 170, hy - 55, 'arter', capOrta)); // sol akciğer

  // --- PERİFER (kollar/bacaklar) ---
  ag.push(damarHazirla(hx + 40, hy + 160, hx + 90, hy + 200, hx + 95, hy + 260, hx + 90, hy + 320, 'kapiller', capKapi)); // sağ bacak
  ag.push(damarHazirla(hx + 40, hy + 160, hx - 30, hy + 210, hx - 35, hy + 270, hx + 10, hy + 330, 'kapiller', capKapi)); // sol bacak
  ag.push(damarHazirla(hx + 30, hy - 150, hx + 10, hy - 180, hx - 30, hy - 185, hx - 90, hy - 150, 'kapiller', capKapi)); // baş damarları

  // --- VENÖZ DÖNÜŞ (kalbe geri) ---
  ag.push(damarHazirla(hx + 145, hy - 55, hx + 120, hy + 2, hx + 60, hy + 6, hx + 16, hy + 12, 'ven', capOrta)); // sol akciğer dönüşü
  ag.push(damarHazirla(hx - 130, hy - 50, hx - 80, hy + 4, hx - 40, hy + 8, hx - 10, hy + 12, 'ven', capOrta));  // sağ akciğer dönüşü
  ag.push(damarHazirla(hx - 90, hy - 150, hx - 55, hy - 140, hx - 30, hy - 90, hx - 15, hy - 20, 'ven', capOrta)); // baş dönüşü
  ag.push(damarHazirla(hx + 90, hy + 320, hx + 130, hy + 240, hx + 110, hy + 130, hx + 60, hy + 120, 'ven', capOrta)); // bacak dönüşü

  return ag;
}

/* =====================================================================
   KAN HÜCRESİ
   rastgele bir damara yerleştirilir ve eğri üzerinde t yürüyüşü yapar.
   ===================================================================== */
function nasilOksijenli(damar) {
  // Akciğere giden arterler/pulmoner oksijenlenir; venöz dönüşte düşer
  if (!damar) return true;
  if (damar.tip === 'ven') return false;      // vücuttan dönen oksijensiz
  if (damar.y2 < W * 0.42 - 40) return true;  // akciğer/üst — genelde oksijenli
  return true;
}

function yeniKanHucresi() {
  var hedefDamar = damarAg[Math.floor(Math.random() * damarAg.length)];
  var oks = hedefDamar ? (hedefDamar.tip !== 'ven') : true;
  return { damar: hedefDamar || damarAg[0], t: Math.random(), oksijen: oks };
}

/* =====================================================================
   BEZIER NOKTASI — eğri üzerindeki t değerinin gerçek (x,y) konumunu verir
   ===================================================================== */
function bezierNokta(d, t) {
  var u = 1 - t;
  var uu = u * u, uuu = uu * u;
  var tt = t * t, ttt = tt * t;
  return nokta(
    uuu * d.x1 + 3 * uu * t * d.c1x + 3 * u * tt * d.c2x + ttt * d.x2,
    uuu * d.y1 + 3 * uu * t * d.c1y + 3 * u * tt * d.c2y + ttt * d.y2
  );
}

/* =====================================================================
   KAN AKIŞI ÇEVİRİMİ
   Damarın ucuna gelince devam damarına geçer (döngü oluşturur).
   ===================================================================== */
function varisDegeri(d) {
  return (d.y2 - d.y1) + (d.x2 - d.x1);
}

function kanGuncelle(dt, hizCarpani) {
  for (var i = 0; i < kanHucreleri.length; i++) {
    var hc = kanHucreleri[i];
    if (!hc.damar) { kanHucreleri[i] = yeniKanHucresi(); continue; }
    // hız = baz hız * kalp hızı oranı * aktivite katsayısı
    hc.t += dt * 0.15 * hizCarpani;
    if (hc.t >= 1) {
      // damar sonuna geldi: tipine göre devam damarı seç / oksijen durumunu güncelle
      var gecici = hc.damar;
      if (hc.damar.tip === 'arter' && hc.damar.y2 >= H * 0.4) {
        // aorttan perifere gitti -> oksijensizleş
        hc.oksijen = false;
      }
      hc.t = 0;
      // Eşleşen bir giriş bul (yakın noktadan başlayan)
      var uygun = devamDamariBul(hc.damar);
      if (uygun) {
        hc.damar = uygun;
        hc.t = 0;
      } else {
        hc.damar = gecici;
        hc.t = 0;
      }
    }
  }
}

/* Basit bir damar graph'ı : çıkış noktasına göre devamı seç */
function devamDamariBul(simdiki) {
  var enYakin = null, enYakinDeger = 1e9;
  for (var i = 0; i < damarAg.length; i++) {
    var d = damarAg[i];
    if (d === simdiki) continue;
    // giriş noktası simdiki'nin çıkışına yakınsa devam adayı
    var mesafe = Math.abs(d.x1 - simdiki.x2) + Math.abs(d.y1 - simdiki.y2);
    // sırt, döngüyü bitirişe yakın bırakmak için eşik
    if (mesafe < 60 && mesafe < enYakinDeger) {
      enYakin = d;
      enYakinDeger = mesafe;
    }
  }
  // hiçbiri yoksa aortaya geri dön (büyük döngü; kalbe dön)
  return enYakin || damarAg[1];
}

/* =====================================================================
   KALP ÇİZİMİ — Bezier eğrileriyle organik, atan bir kalp
   faz: 0..1 (sistol:0..0.4 kasılır, diyastol:0.4..1 gevşer)
   ===================================================================== */
function kalpNoktalari(cx, cy, r, kas) {
  // Atan kalp: kas arttıkça küçülür (sistol), azalınca büyür (diyastol)
  var squish = 1 - kas * 0.28;      // yükseklik daralması
  var squash = 1 + kas * 0.22;      // yatay açılma (pompa dalgası)
  var hw = r * 1.05 * squash;       // genişlik
  var hh = r * 1.1 * squish;        // yükseklik
  return {
    // üst çentik
    ust: nokta(cx, cy - hh),
    // sol kanat eğri uçları
    lsol: nokta(cx - hw, cy - hh * 0.25),
    lsag: nokta(cx - hw * 0.75, cy + hh * 0.7),
    rsag: nokta(cx + hw * 0.75, cy + hh * 0.7),
    rsol: nokta(cx + hw, cy - hh * 0.25),
    alt: nokta(cx, cy + hh * 1.25)
  };
}

function cizKalp(fazG) {
  var hx = W * 0.5, hy = H * 0.42;
  // sistol aşamasında kasılma daha güçlü (0 ve 0.4 arası)
  var kas = 0;
  if (fazG < 0.45) {
    kas = Math.sin((fazG / 0.45) * Math.PI);   // sistol tepe noktası
  }
  var p = kalpNoktalari(hx, hy, 34, kas);

  ctx.save();
  ctx.beginPath();
  // Sol yarı (kalp sol modülü)
  ctx.moveTo(p.ust.x, p.ust.y);
  ctx.bezierCurveTo(p.lsol.x + 4, p.lsol.y - 28, p.ust.x - 40, p.ust.y + 30, p.lsol.x, p.lsol.y);
  ctx.bezierCurveTo(p.ust.x - 30, p.lsol.y + 16, p.lsol.x, p.lsol.y + 66, p.alt.x, p.alt.y);
  // Sağ yarı
  ctx.bezierCurveTo(p.alt.x + 30, p.lsol.y + 66, p.alt.x + 38, p.lsol.y + 16, p.rsol.x, p.rsol.y);
  ctx.bezierCurveTo(p.alt.x + 46, p.ust.y + 30, p.rsol.x - 4, p.rsol.y - 28, p.ust.x, p.ust.y);
  ctx.closePath();

  // Dolgu — atan kalp için sıcak degrade
  var koronerDegrade = ctx.createLinearGradient(hx - 20, hy - 20, hx + 20, hy + 30);
  koronerDegrade.addColorStop(0, kas > 0.1 ? '#ff5f6d' : '#d93b4a');
  koronerDegrade.addColorStop(0.5, '#ef1f37');
  koronerDegrade.addColorStop(1, '#9c1626');

  // Sistol sırasında parlak nabız halkası
  if (kas > 0.2) {
    ctx.shadowColor = 'rgba(255,71,87,0.9)';
    ctx.shadowBlur = 22 + kas * 26;
  } else {
    ctx.shadowColor = 'rgba(255,71,87,0.35)';
    ctx.shadowBlur = 6;
  }
  ctx.fillStyle = koronerDegrade;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255,160,160,0.7)';
  ctx.stroke();
  ctx.restore();
}

/* Kalbin nabzı; sistol başlayınca damar genişleme dalgası yaratır */
function nabizYarat() {
  nabizDalgasi = { aktif: true, konum: 0, guclu: 1 };
  aktifNabizSayisi = 1;
}

function heartBeatPulse(dt, guncelBpm) {
  if (nabizDalgasi.aktif) {
    nabizDalgasi.konum += dt * 3.4;     // damar ağı boyunca ilerleme hızı
    nabizDalgasi.guclu *= 0.955;         // sönümleme
    if (nabizDalgasi.konum > 1 || nabizDalgasi.guclu < 0.02) {
      nabizDalgasi.aktif = false;
      aktifNabizSayisi = 0;
    }
  }
}

/* =====================================================================
   SİNİR SİSTEMİ — kalple etkileşen, hızlanan/yavaşlayan uyarılar
   Her dürtü, damar ile paralel ilerleyen kıvılcımlı bir "uyarı" çizgisi.
   AktiviteTANI'a göre dürtü sayısı ve hızı değişir.
   ===================================================================== */
function yeniSinirImpulsu(boy) {
  return { konum: boy || Math.random(), hiz: 0.28 + Math.random() * 0.3 };
}

function sinirGuncelle(dt, guncelBpm, aktiv) {
  var tip = AKTIVITE_TANIM[aktiv];
  var hizKatsayi = 1 + (tip.bpm - 72) / 72;   // normalleştirilmiş hız
  var tuketilen = 0;
  for (var i = 0; i < sinirDurtuleri.length; i++) {
    var s = sinirDurtuleri[i];
    s.konum += dt * 0.35 * s.hiz * (0.6 + Math.min(2, guncelBpm / 50));
    if (s.konum >= 1.3) {
      sinirDurtuleri[i] = yeniSinirImpulsu(0);   // hareket ediyor, kalbe geri dönsün
      tuketilen++;
    }
  }
  // boştaki sayıyı tazeliyoruz
  /* sayac dostu */
  return sinirDurtuleri.length;
}

function sinirCiz(yolNokta, x1, y1, x2, y2) {
  // kıvılcımlı kesik çizgi
  ctx.save();
  ctx.strokeStyle = '#ffd32a';
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawNervePath() {
  // Kan hücrelerinin tersi yönde bir damar hattı çizer (statik dekor vb.)
  // Bu istekte doğrudan kullanılmayabilir ama ana API tutarlı kalsın
  ctx.save();
  ctx.strokeStyle = 'rgba(255,211,42,0.16)';
  ctx.lineWidth = 1;
  for (var i = 0; i < damarAg.length; i++) {
    var d = damarAg[i];
    ctx.beginPath();
    ctx.moveTo(d.x1 + 3, d.y1 + 3);
    ctx.bezierCurveTo(d.c1x + 3, d.c1y + 3, d.c2x + 3, d.c2y + 3, d.x2 + 3, d.y2 + 3);
    ctx.stroke();
  }
  ctx.restore();
}

function cizSinirDurtuleri() {
  var hx = W * 0.5, hy = H * 0.42;
  for (var i = 0; i < sinirDurtuleri.length; i++) {
    var s = sinirDurtuleri[i];
    var d = damarAg[i % damarAg.length] || damarAg[0];
    var p = bezierNokta(d, Math.abs(s.konum % 1));
    // kalbin etrafına üç ışın çiz — "uyarı yayılıyor" efekti
    var del = s.konum * 40;
    for (var u = 0; u < 2; u++) {
      var aci = ((s.konum * 2 + u) / (Math.PI * 2)) * 2;
      sinirCiz(d, p.x, p.y, p.x + Math.cos(aci) * 14, p.y + Math.sin(aci) * 14);
    }
    // küçük bağlantı noktası
    ctx.save();
    ctx.fillStyle = '#ffe680';
    ctx.shadowColor = '#ffd32a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* =====================================================================
   STATİK ANATOMİ — her frame başında arka plan grafiği
   ===================================================================== */
function damarCiz(d, genislikEfekt, oksijenFark) {
  ctx.save();
  // kap dallanma / ana arter farkını renklendirme
  var renk;
  if (d.tip === 'arter') renk = 'rgba(226,60,78,0.85)';
  else if (d.tip === 'ven') renk = 'rgba(98,60,105,0.85)';
  else renk = 'rgba(120,90,120,0.45)';
  ctx.strokeStyle = renk;
  ctx.lineWidth = (d.cap || 5) + (genislikEfekt || 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(d.x1, d.y1);
  ctx.bezierCurveTo(d.c1x, d.c1y, d.c2x, d.c2y, d.x2, d.y2);
  ctx.stroke();
  // içte daha açık çekirdek (= akan kan)
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1.5, ((d.cap || 5) * 0.4) + (genislikEfekt || 0) * 0.5);
  ctx.strokeStyle = oksijenFark ? '#ff9aa0' : '#6a223b';
  ctx.stroke();
  ctx.restore();
}

function drawStaticAnatomy(fazG, nabizDo) {
  // nabız genişletme her damarda eşit olmasın; dalga konumuna göre değişsin
  var dalgaSekil = 0;
  if (nabizDalgasi.aktif) {
    dalgaSekil = Math.max(0, Math.sin(nabizDalgasi.konum * Math.PI));
  }
  for (var i = 0; i < damarAg.length; i++) {
    damarCiz(damarAg[i], dalgaSekil * (nabizDalgasi.guclu || 0) * 3, false);
  }

  // ---- AKCİĞERLER (oval organlar) ----
  ctx.save();
  var akciDeg = ctx.createRadialGradient(W * 0.5 - 170, H * 0.42 - 60, 6, W * 0.5 - 170, H * 0.42 - 60, 55);
  akciDeg.addColorStop(0, 'rgba(38,222,129,0.34)');
  akciDeg.addColorStop(1, 'rgba(38,222,129,0.05)');
  ctx.fillStyle = akciDeg;
  ctx.beginPath();
  ctx.ellipse(W * 0.5 - 170, H * 0.42 - 60, 48, 70, -0.18, 0, Math.PI * 2);
  ctx.fill();
  var akciDeg2 = ctx.createRadialGradient(W * 0.5 + 170, H * 0.42 - 55, 6, W * 0.5 + 170, H * 0.42 - 55, 55);
  akciDeg2.addColorStop(0, 'rgba(38,222,129,0.34)');
  akciDeg2.addColorStop(1, 'rgba(38,222,129,0.05)');
  ctx.fillStyle = akciDeg2;
  ctx.beginPath();
  ctx.ellipse(W * 0.5 + 170, H * 0.42 - 55, 48, 70, 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- BEYİN (üst merkez) ---
  ctx.save();
  var beyinDeg = ctx.createRadialGradient(W * 0.5, H * 0.42 - 170, 4, W * 0.5, H * 0.42 - 170, 42);
  beyinDeg.addColorStop(0, 'rgba(120,150,220,0.5)');
  beyinDeg.addColorStop(1, 'rgba(120,150,220,0.03)');
  ctx.fillStyle = beyinDeg;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.42 - 175, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* =====================================================================
   KAN HÜCRE ÇİZİMİ — oksijenli parlak, oksijensiz koyu, akan bir "top"
   ===================================================================== */
function cizKanHucreleri() {
  for (var i = 0; i < kanHucreleri.length; i++) {
    var hc = kanHucreleri[i];
    var d = hc.damar;
    if (!d) { continue; }
    var p = bezierNokta(d, Math.abs(hc.t % 1));
    // oksijenli => parlak kırmızı + parlama; değilse koyu bordo
    var renk = hc.oksijen ? '#ff4d5e' : '#6d2235';
    ctx.save();
    ctx.fillStyle = renk;
    if (hc.oksijen) {
      ctx.shadowColor = 'rgba(255,77,94,0.8)';
      ctx.shadowBlur = 9;
    } else {
      ctx.shadowColor = 'rgba(120,30,45,0.4)';
      ctx.shadowBlur = 3;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, hc.oksijen ? 3.4 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (hc.oksijen) {
      // iç parlak çekirdek
      ctx.fillStyle = 'rgba(255,190,200,0.9)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x - 0.8, p.y - 0.8, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* =====================================================================
   ÖN ÇİZİM (tampon) + ANA KARE
   ===================================================================== */
function degradeArkaPlan() {
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0f18');
  g.addColorStop(1, '#06070b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // iskeletimsi gövde dış hattı (şeffaf)
  ctx.save();
  ctx.strokeStyle = 'rgba(120,140,190,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.46, W * 0.34, H * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* Kalp merkezidne küçük damar etiketi / ok (içinde akan yönü belli etsin) */
function okYonuOku(d, tCiz) {
  var p1 = bezierNokta(d, tCiz);
  var p2 = bezierNokta(d, Math.min(1, tCiz + 0.05));
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  // küçük ok başı
  var aci = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p2.x - 5 * Math.cos(aci - 0.5), p2.y - 5 * Math.sin(aci - 0.5));
  ctx.lineTo(p2.x - 5 * Math.cos(aci + 0.5), p2.y - 5 * Math.sin(aci + 0.5));
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.restore();
}

/* =====================================================================
   HUD — üst bilgi kartlarını günceller
   ===================================================================== */
function drawHUD(aktBpm, kanSay, sinirSay) {
  hudBpm.textContent = Math.round(aktBpm);
  if (aktivite === 'sprint') hudBpm.className = 'hudDeger hizli';
  else if (aktivite === 'jog') hudBpm.className = 'hudDeger kosar';
  else hudBpm.className = 'hudDeger normal';
  hudAktif.textContent = AKTIVITE_TANIM[aktivite].ad;
  hudKan.textContent = kanSay;
  hudSinir.textContent = sinirSay;
  hudNabiz.textContent = nabizDalgasi.aktif ? Math.round(nabizDalgasi.guclu * 100) : 0;
}

/* =====================================================================
   ANA ANİMASYON DÖNGÜSÜ
   ===================================================================== */
function animFrame(ts) {
  if (!calisiyor) return;
  // Delta zaman (sn), farkı stabil tut
  var dt = Math.min(0.05, (ts - animFrame.sonTs) / 1000 || 0.016);
  animFrame.sonTs = ts;
  zamanGeo += dt;

  // 1) Kalp atış hızını hedefe yaklaştır
  var akt = calcHeartRate(dt);   // -> guncelBpm yumuşar

  // 2) Faza göre sistol/diyastol ilerlet (bpm'e orantılı)
  var periyotSn = 60 / Math.max(24, guncelBpm);      // saniye/yapı
  faz = (zamanGeo % periyotSn) / periyotSn;          // 0..1
  if (faz > 0.03 && faz < 0.14) nabizYarat();         // her vuruşta nabız dalgası

  // 3) Damarda hareket eden kan hızı = kalp hızı oranı
  var hizCarpani = 1 + ((guncelBpm - 72) / 72);       // sprint'te ~2.2x
  kanGuncelle(dt, hizCarpani);

  // 4) Sinir dürtüleri
  var sinirGucu = sinirGuncelle(dt, guncelBpm, aktivite);

  // 5) Çiz
  degradeArkaPlan();
  drawStaticAnatomy(faz, nabizDalgasi);
  heartBeatPulse(dt, guncelBpm);
  cizKanHucreleri();
  cizSinirDurtuleri();
  drawNervePath();
  cizKalp(faz);
  okYonuOku(damarAg[2] || damarAg[0], 0.4);   // yön göstergeci

  // 6) HUD
  drawHUD(guncelBpm, kanHucreleri.length, sinirGucu);

  requestAnimationFrame(animFrame);
}
animFrame.sonTs = 0;

/* =====================================================================
   BAŞLANGIÇ / OLAY BAĞLAMA
   ===================================================================== */
function initSim() {
  damarAg = buildVessels();
  if (!damarAg.length) damarAg = buildVessels();
  // başlangıç kanı
  yenidenUret('idle');
  setActivity('idle');
  requestAnimationFrame(animFrame);
}

// Buton dinlemesi
aktiviteBtnlar.forEach(function (btn) {
  btn.addEventListener('click', function () {
    setActivity(btn.dataset.aktivite);
  });
});

// Sayfa hazır olunca başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSim);
} else {
  initSim();
}

/* =====================================================================
   MİMARİ SÖZLEŞME / UYUM KATMANI
   Aşağıdaki takma adlar, dış sözleşmede (plan) istenen fonksiyon adlarını
   birebir karşılar. Hepsi yukarıdaki gerçek uygulamalara bağlanır; yeni
   çizim/JS mantığı eklemez, üretim kodunu bozmaz.
   ===================================================================== */

/* Kalp atış fazını üretir (döngüde guncelBpm & faz global güncellendiği
   için burada sadece periyodu geri verir). */
function buildSynergy() {
  var periotSn = 60 / Math.max(24, guncelBpm);
  return { faz: (zamanGeo % periotSn) / periotSn, periyot: periotSn };
}

/* Kalbi çizer (tek sarmalayıcı) */
function drawHeart(fazG) { cizKalp(fazG); }

/* İlk kan hücresi akışını kurar — yenidenUret zaten yapar; istenirse
   başlangıçtaki ilk etki için de bazı hücreyi manuel yaratmayı destekler */
function spawnBloodCells(adet) {
  if (typeof adet === 'number') {
    while (kanHucreleri.length < adet && kanHucreleri.length < 120) {
      kanHucreleri.push(yeniKanHucresi());
    }
  }
  return kanHucreleri.length;
}

/* Aktivite değişince partikül havuzunu hedef yoğunlukla senkronlar */
function respawnActivity(mod) { yenidenUret(mod); }

/* Kan çevrimi ilerlemesi */
function updateBloodCycle(dt, hizCarpani) { kanGuncelle(dt, hizCarpani || 1); }

/* Tek bir kan hücresini çizer (oksijen durumuna göre) */
function drawBloodCell(hc) {
  if (!hc || !hc.damar) return;
  var p = bezierNokta(hc.damar, Math.abs(hc.t % 1));
  ctx.save();
  ctx.fillStyle = hc.oksijen ? '#ff4d5e' : '#6d2235';
  if (hc.oksijen) { ctx.shadowColor = 'rgba(255,77,94,0.8)'; ctx.shadowBlur = 9; }
  else { ctx.shadowColor = 'rgba(120,30,45,0.4)'; ctx.shadowBlur = 3; }
  ctx.beginPath();
  ctx.arc(p.x, p.y, hc.oksijen ? 3.4 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* Sinir dürtüsü oluşturur — yenidenUret de bu adı kullanabilir */
function spawnNerveImpulses(fazC) { return yeniSinirImpulsu(fazC); }

/* Sinir sistemi güncellemesi (kalbin hızına göre sinyal akışı) */
function updateNerves(dt, guncelBpmG, aktiv) { return sinirGuncelle(dt, guncelBpmG, aktiv || aktivite); }
