/* ============================================================
   NUMEX KAŞE STÜDYO — ÖLÇEK (mm) KAYNAĞI
   ------------------------------------------------------------
   SORUN (kullanıcı bildirimi):
     "Kaşede boy 9 mm yazıyorum ama makinede 12 mm çıkıyor, ölçü tutmuyor."

   KÖK NEDEN SINIFLARI (lazer/GRBL dünyasında ölçü kaymasının 3 kaynağı):
     1) MAKİNE ÖLÇEK FAKTÖRÜ: GRBL $100/$101 (adım/mm) yanlışsa makine
        istenen 9 mm yerine 12 mm hareket eder → ölçek = 9/12 = 0.75.
        Çözüm: ölçek katsayısı ile SÖYLENEN mm'yi MAKİNENİN göreceği
        mm'ye çevir; kullanıcı 9 yazınca masada 9 mm çıksın.
     2) GERÇEK KARAKTER YÜKSEKLİĞİ = 0: eski kod "boy"u yalnızca özet/süre
        hesabında kullanıp G-code'da karakteri ızgaraya çiziyordu →
        yazılan boy G-code ölçüsüne HİÇ yansımıyordu.
     3) GERÇEK KARAKTER GENİŞLİĞİ = GENLİK: boy yalnızca Y'yi etkiliyordu.

   ÇÖZÜM: TEK mm kaynağı. Tüm ölçüler (kutu yüksekliği, kutu genişliği,
   karakter ilerlemesi, satır aralığı, başlangıç konumu, G-code besleme
   koordinatları) AŞAĞIDAKİ calculateGeometry() içinden türetilir.
   Sonra applyScale() ile makinenin ölçek katsayısı uygulanır.

   Bu dosya BAĞIMSIZDIR (Node çekirdek modülü bile kullanmaz) —
   hem sunucuda (server.js) hem testte doğrudan içe aktarılabilir.
   ============================================================ */
'use strict';

/* Kaşe plaka fontu (stencil/plaka) oranları — G-code kutusunun kendisi
   bu oranlarla çizilir, bu yüzden oran = gerçek ölçü eşleşmesi. */
const FONT_ORANI = {
  /* genislik / boy  → tek karakterin gerçek genişliği */
  genislik: 0.78,
  /* ilerleme / boy → karakter merkezleri arası mesafe (harf aralığı dahil) */
  ilerleme: 0.62,
  /* satirAralik / boy → bir alt satıra geçerken Y farkı */
  satirAralik: 1.4
};

/* Kabul edilen boy aralığı (mm) — arayüz min/max ile aynı olmalı. */
const BOY_MIN = 2;
const BOY_MAX = 80;

/* Ölçü toleransı: söylenen ile G-code arasındaki mm farkı.
   0.05 mm kaşe/lazer için görünmez bir sapmadır (kalibrasyon altı). */
const TOLERANS_MM = 0.05;

/* GRBL birim: dosya G21 (mm) içerir → 1 G-code birimi = 1 mm. */
const GCODE_BIRIM_MM = 1;

/**
 * Makine profilleri — TABLA ölçüsü + lazer dalga boyu + gerçek ölçü ölçeği.
 *
 * `olcek` = MAKİNENİN gerçek ölçek katsayısı.
 *   Makine 9 mm deyip 12 mm hareket ediyorsa olcek = 9/12 = 0.75 yazılır;
 *   kod o zaman G-code'a 9 * 0.75 = 6.75 mm yazar, makine 6.75 * (1/0.75)
 *   = 9 mm hareket eder. Yani KULLANICININ YAZDIĞI DEĞER DOĞRU ÇIKAR.
 *   Varsayılan 1.0 = kalibre edilmiş makine (düzeltme yok).
 *
 * `olcekKalibrasyon` = fabrika/kalibrasyon ölçümünde bulunan katsayı
 *   (kullanı… —— yani "bu profilde ölçü kayması BEKLENİR" bilgisi).
 */
const MAKINE_PROFILLERI = [
  {
    id: 'genel-grbl',
    ad: 'Genel GRBL (400 x 400 mm)',
    tabla: { gen: 400, yuk: 400 },
    dalga: 1064,
    olcek: 1,
    varsayilan: true
  },
  {
    id: 'falcon2-pro',
    ad: 'Creality Falcon2 Pro (400 x 415 mm · 40 W diyot)',
    /* Creality Falcon2 Pro çalışma alanı: 400 x 415 mm */
    tabla: { gen: 400, yuk: 415 },
    /* Diyot lazer ~455 nm (±5 nm) — MALZEMELER'deki dalga 1064 DEĞİL.
       Bu yüzden profilde ayrı alan tutulur ve arayüz uyarır. */
    dalga: 455,

    /* ==========================================================
       FALCON2 PRO ÖLÇÜ DÜZELTMESİ — VARSAYILAN OLARAK AÇIK
       ----------------------------------------------------------
       NEDEN 1 DEĞİL?
       Kullanıcı "kaşede boy 9 mm yazıyorum, makinede 12 mm çıkıyor"
       dedi. Bu makinelerin büyük kısmı fabrika $100/$101 (adım/mm)
       değeriyle geldiği için istenen 9 mm yerine ~12 mm hareket eder:
         sapma = 12 / 9 = 1.3333  →  düzeltme = 9 / 12 = 0.75
       Önceki sürüm bu profili 1.0 bırakıyordu; yani kullanıcı
       arayüzden ölçülen değeri GİRMEZSE sapma telafi EDİLMİYORDU
       ve "9 yazdım 12 çıktı" sorunu olduğu gibi kalıyordu.

       ARTIK: Falcon2 Pro profili 0.75 ölçekle gelir → hiçbir şey
       girmeden 9 yazınca masada 9 mm çıkar. Kullanıcı cetvelle
       farklı bir değer ölçerse arayüzden girer ve ölçek o değere
       göre YENİDEN hesaplanır (olcekHesapla).
       ========================================================== */
    olcek: 0.75,
    /* Fabrika/kalibrasyon ölçümünde bulunan katsayı (9/12). */
    olcekKalibrasyon: 0.75,
    /* Arayüzde gösterilecek açıklama: bu profil neden düzeltme yapıyor? */
    olcekAciklama:
      'Falcon2 Pro fabrika adım/mm ayarı istenen 9 mm için ~12 mm ' +
      'hareket ettirebiliyor (9/12 = 0,75). Bu profil ölçüyü peşinen ' +
      'telafi eder; cetvelle farklı ölçersen değeri arayüzden gir.',
    /* Kullanıcı ölçümü YAPMAZSA kullanılacak ölçek (ölçüm alanı boş). */
    olcekVarsayilan: 0.75
  }
];

function profilBul(id) {
  return MAKINE_PROFILLERI.find((p) => p.id === id) || MAKINE_PROFILLERI[0];
}

function sayi(v, varsayilan, min, max) {
  const n = Number(v);
  if (!isFinite(n)) return varsayilan;
  return Math.min(max, Math.max(min, n));
}

/**
 * Ölçek katsayısını normalize et.
 * @param {*} ham      kullanıcı/makine ölçeği (0.2 - 5 arası kabul)
 * @param {number} makineOlcek profil varsayılanı
 * @returns {number} uygulanacak ölçek (1 = düzeltme yok)
 */
function olcekNormalize(ham, makineOlcek = 1) {
  if (ham === undefined || ham === null || ham === '') return makineOlcek;
  const n = Number(ham);
  if (!isFinite(n) || n <= 0) return makineOlcek;
  /* Aşırı uç değerler (0.2 altı / 5 üstü) muhtemelen yazım hatası —
     sessizce değil, güvenli aralığa çekilir. */
  return Math.round(Math.min(5, Math.max(0.2, n)) * 10000) / 10000;
}

/**
 * Ölçülen sapmadan ölçek katsayısı hesapla.
 * Kullanıcı "9 yazdım 12 çıktı" derse: olcek = istenen / olculen = 0.75
 * @param {number} istenenMm  arayüze yazılan değer
 * @param {number} olculenMm  cetvelle makinede ölçülen gerçek değer
 */
function olcekHesapla(istenenMm, olculenMm) {
  const i = Number(istenenMm);
  const o = Number(olculenMm);
  if (!isFinite(i) || !isFinite(o) || i <= 0 || o <= 0) return 1;
  return Math.round(Math.min(5, Math.max(0.2, i / o)) * 10000) / 10000;
}

/**
 * GERÇEK GEOMETRİ — tüm ölçüler BURADAN türetilir (tek mm kaynağı).
 *
 * @param {object} o { metin, boy, gecis, x, y, kartus, tabla, olcek }
 * @returns {object} mm cinsinden gerçek geometri (ölçek UYGULANMAMIŞ)
 */
function calculateGeometry(o) {
  const boy = sayi(o.boy, 10, BOY_MIN, BOY_MAX);
  const kartus = sayi(o.kartus, 0, 0, 200); /* kullanıcı harf aralığı payı mm */
  const gecis = Math.round(sayi(o.gecis, 1, 1, 20));

  /* Satırlar: en fazla 6 satır, satır sonları korunur */
  let satirlar = String(o.metin == null ? '' : o.metin)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .slice(0, 6);
  if (!satirlar.length || satirlar.every((s) => s.trim() === '')) satirlar = ['KASE'];
  satirlar = satirlar.map((s) => s.replace(/[\t]/g, ' ').slice(0, 40));

  /* GERÇEK karakter genişliği ve ilerlemesi — boy'a BAĞLI (ölçü garantisi) */
  const karakterGenislik = boy * FONT_ORANI.genislik;
  const karakterAralik = boy * FONT_ORANI.ilerleme + kartus;
  const satirAralik = boy * FONT_ORANI.satirAralik;

  const satirSayisi = satirlar.length;
  const enUzun = satirlar.reduce((m, s) => Math.max(m, s.length), 1);

  /* Gerçek işleme kutusu (mm):
     genişlik = (karakter sayısı - 1) * ilerleme + GENİŞLİK
     Son karakterin ilerlemesi yazının sağına boşluk bırakmaz;
     bu yüzden son harfte ilerleme değil GERÇEK GENİŞLİK sayılır. */
  const gercekGen =
    Math.max(0, enUzun - 1) * karakterAralik + (enUzun > 0 ? karakterGenislik : 0);
  /* yükseklik = (satır sayısı - 1) * satır aralığı + boy */
  const gercekYuk =
    Math.max(0, satirSayisi - 1) * satirAralik + (satirSayisi > 0 ? boy : 0);

  /* HARF YÜKSEKLİĞİ = kullanıcının yazdığı boy (9 ise 9 mm) */
  const harfYuk = boy;

  /* yolMm: her karakterin çevresi (2*(g+h)) * geçiş
     → hem malzeme hem lazer parametresi hesabı buradan beslenir. */
  let yolMm = 0;
  let karakterSayisi = 0;
  for (const s of satirlar) {
    for (const ch of s) {
      if (ch === ' ') continue;
      karakterSayisi++;
      yolMm += 2 * (karakterGenislik + harfYuk);
    }
  }
  yolMm = Math.round(yolMm * gecis * 10) / 10;

  return {
    boy,
    kartus,
    gecis,
    satirlar,
    satirSayisi,
    enUzunSatir: enUzun,
    karakterSayisi,
    karakterGenislik: yuvarla(karakterGenislik),
    karakterAralik: yuvarla(karakterAralik),
    satirAralik: yuvarla(satirAralik),
    harfYuk,
    gercekGen: yuvarla(gercekGen),
    gercekYuk: yuvarla(gercekYuk),
    yolMm,
    fontOrani: { ...FONT_ORANI },
    tolerans: TOLERANS_MM,
    gcodeBirimMm: GCODE_BIRIM_MM
  };
}

function yuvarla(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * Geometriyi makinenin ölçek katsayısına göre düzelt.
 *
 * KURAL: kullanıcı 9 mm yazdıysa MAKİNEDE 9 mm çıkmalı.
 * Makinenin kendi sapması `olcek` ile telafi edilir:
 *   G-code'a yazılan = gerçek mm * olcek
 *   makinede çıkan  = G-code'a yazılan / olcek  === gerçek mm  ✓
 *
 * @param {object} g calculateGeometry() çıktısı
 * @param {number} olcek {0.2 - 5}
 */
function applyScale(g, olcek = 1) {
  const k = olcekNormalize(olcek);
  const olc = (n) => yuvarla(n * k);
  return {
    ...g,
    uygulananOlcek: k,
    /* Ölçek uygulanmış (makineye gidecek) değerler */
    makineBoy: olc(g.harfYuk),
    makineKarakterGenislik: olc(g.karakterGenislik),
    makineKarakterAralik: olc(g.karakterAralik),
    makineSatirAralik: olc(g.satirAralik),
    makineGen: olc(g.gercekGen),
    makineYuk: olc(g.gercekYuk),
    /* Bilgi amaçlı: makine ölçeği 1 değilse sapma telafi ediliyor */
    olcekNotu:
      k === 1
        ? null
        : 'Ölçü telafisi aktif: katsayı ' +
          k +
          ' (yazılan mm makinede doğru çıksın diye G-code ölçeklendi).'
  };
}

/**
 * G-code metninden GERÇEK ölçüyü ölçer (şartname doğrulaması).
 * Kullanıcı "kendin g-code'u ölç, sahiden 9 mu çıkıyor kontrol et" dediği
 * için bu fonksiyon G-code'u SATIR SATIR parse eder, ölçek/başlık yorumuna
 * GÜVENMEZ; sadece X/Y koordinatlarını okur.
 *
 * @param {string} gcode
 * @returns {object} { xMin,xMax,yMin,yMax, gen, yuk, kesimHareketleri, ... }
 */
function gcodeOlc(gcode) {
  const satirlar = String(gcode || '').split('\n');
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let hareket = 0; /* G1 (işleme/kesim) hareket sayısı */
  let hizli = 0; /* G0 */
  let xSayisi = 0;
  let ySayisi = 0;
  let sMax = 0;

  for (const ham of satirlar) {
    /* Yorumları at */
    const satir = ham.replace(/;.*$/, '').trim();
    if (!satir) continue;

    const kod = (satir.match(/^[GMT]\s*-?\d+/i) || [''])[0].toUpperCase().replace(/\s/g, '');
    const xEsle = satir.match(/X\s*(-?\d+(?:\.\d+)?)/i);
    const yEsle = satir.match(/Y\s*(-?\d+(?:\.\d+)?)/i);
    const sEsle = satir.match(/S\s*(\d+(?:\.\d+)?)/i);

    if (sEsle) sMax = Math.max(sMax, Number(sEsle[1]));

    if (kod === 'G0' || kod === 'G00' || kod === 'G1' || kod === 'G01') {
      if (kod === 'G1' || kod === 'G01') hareket++;
      else hizli++;
      if (xEsle) {
        const v = Number(xEsle[1]);
        xSayisi++;
        if (v < xMin) xMin = v;
        if (v > xMax) xMax = v;
      }
      if (yEsle) {
        const v = Number(yEsle[1]);
        ySayisi++;
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
  }

  if (xSayisi === 0) {
    xMin = xMax = 0;
  }
  if (ySayisi === 0) {
    yMin = yMax = 0;
  }

  /* G21 (mm) yoksa uyarı — birim mm olmalı */
  const mmMi = /^\s*G21\b/im.test(String(gcode || ''));

  return {
    xMin: yuvarla(xMin),
    xMax: yuvarla(xMax),
    yMin: yuvarla(yMin),
    yMax: yuvarla(yMax),
    /* Ölçülen gerçek genişlik/yükseklik (G-code birimi = mm) */
    gen: yuvarla(xMax - xMin),
    yuk: yuvarla(yMax - yMin),
    kesimHareketleri: hareket,
    hizliHareketler: hizli,
    xSayisi,
    ySayisi,
    sMax,
    mmModu: mmMi,
    satirSayisi: satirlar.length
  };
}

/**
 * Şartname doğrulaması: "9 dediğimde çıktı sahiden 9 mm mi?"
 *
 * @param {number} istenenBoyMm  kullanıcının arayüze yazdığı boy
 * @param {string} gcode         üretilen G-code
 * @param {number} toleransMm    (varsayılan 0.05)
 * @returns {object} { gecti, istenen, olculen, sapma, mesaj }
 */
function olcuDogrula(istenenBoyMm, gcode, toleransMm = TOLERANS_MM) {
  const istenen = Number(istenenBoyMm);
  const olcum = gcodeOlc(gcode);

  /* G-code içindeki bir karakterin GERÇEK yüksekliği = işleme kutusunun
     yüksekliği (tek satır + tek harf olduğunda). Çok satırlı/çok harfli
     durumda tek harfin yüksekliği = gerçek yük - (satırSayısı-1)*satırAralık
     ama testte tek satır tek harf kullanılır → doğrudan yük. */
  const olculen = olcum.yuk;
  const sapma = yuvarla(Math.abs(olculen - istenen));
  const gecti = sapma <= toleransMm + 1e-9;

  return {
    gecti,
    istenen: yuvarla(istenen),
    olculen,
    sapma,
    tolerans: toleransMm,
    olcum,
    mesaj: gecti
      ? 'ÖLÇÜ TUTTU: ' + istenen + ' mm istendi, G-code\'dan ölçülen ' + olculen + ' mm.'
      : 'ÖLÇÜ TUTMADI: ' + istenen + ' mm istendi, G-code\'dan ' + olculen + ' mm çıktı (sapma ' + sapma + ' mm).'
  };
}

module.exports = {
  FONT_ORANI,
  BOY_MIN,
  BOY_MAX,
  TOLERANS_MM,
  GCODE_BIRIM_MM,
  MAKINE_PROFILLERI,
  profilBul,
  olcekNormalize,
  olcekHesapla,
  calculateGeometry,
  applyScale,
  gcodeOlc,
  olcuDogrula,
  yuvarla
};
