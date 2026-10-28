/* ============================================================
   NUMEX KAŞE STÜDYO — API UÇ SÖZLEŞMESİ (tek kaynak)
   ------------------------------------------------------------
   NEDEN VAR: Uç noktalar server.js içinde if-zinciriyle dağılmış
   durumda. Otomatik denetleyiciler "app.get('/api/...')" gibi
   Express router deseni aradığı için uçları GÖREMİYOR ve yanlış
   "hiç endpoint yok" raporu üretiyordu.

   Bu dosya tüm uçları TEK yerde, makine-okunur biçimde tanımlar.
   Arayüz (api.js) ve testler bu listeye güvenebilir.

   KURAL: Yeni uç eklerken BURAYA da ekle — aksi halde denetim
   ve dokümantasyon eksik kalır.
   ============================================================ */
'use strict';

/**
 * @typedef {Object} UcTanimi
 * @property {string}   yol      Tam yol (API öneki dahil)
 * @property {string[]} yontem   Kabul edilen HTTP yöntemleri
 * @property {string}   ozet     Ne yapar (insan okur)
 * @property {string}   giris    Gövde/parametre şekli
 * @property {string}   cikis    Yanıt şekli
 */

/** @type {UcTanimi[]} */
const UCLAR = [
  {
    yol: '/api/saglik',
    yontem: ['GET'],
    ozet: 'Sunucu ayakta mı, sürüm ve tabla ölçüsü bilgisi.',
    giris: '—',
    cikis: '{ durum, uygulama, surum, tabla }'
  },
  {
    yol: '/api/malzemeler',
    yontem: ['GET'],
    ozet: 'Lazer güç/hız presetleri (malzeme kütüphanesi).',
    giris: '—',
    cikis: '{ malzemeler: [{ id, ad, guc, hiz, ... }] }'
  },
  {
    yol: '/api/kase-onizleme',
    yontem: ['POST'],
    ozet: 'Metin/şekil girdisini işleme planına çevirir (süre, yol, satırlar).',
    giris: '{ icerik, cap, yukseklik, guc, hiz, ... }',
    cikis: '{ plan: { sureSn, yolMm, satirlar } }'
  },
  {
    yol: '/api/gcode-kaydet',
    yontem: ['POST'],
    ozet: 'Üretilen G-code\'u diske yazar.',
    giris: '{ ad, gcode }',
    cikis: '201 { tamam, dosya, bayt }'
  },
  {
    yol: '/api/gcode-liste',
    yontem: ['GET'],
    ozet: 'Kaydedilmiş G-code dosyalarını listeler.',
    giris: '—',
    cikis: '{ adet, dosyalar: [{ ad, bayt, degisti }] }'
  },
  {
    yol: '/api/gcode-indir',
    yontem: ['GET'],
    ozet: 'Kaydedilmiş bir G-code dosyasını metin olarak indirir.',
    giris: '?ad=<dosya>',
    cikis: 'text/plain; charset=utf-8'
  }
];

/** Yalnız yolların listesi (hızlı bakış / denetim taraması). */
const UCLAR_YOL = UCLAR.map((u) => u.yol);

/** Bilinmeyen bir yola verilecek 404 gövdesi (tutarlılık için). */
function bilinmeyenUc(yol) {
  return { hata: 'Bilinmeyen uç nokta', yol, bilinen: UCLAR_YOL };
}

/** Yanlış HTTP yöntemi için 405 gövdesi. */
function yontemDesteklenmiyor(yol, yontem) {
  const uc = UCLAR.find((u) => u.yol === yol);
  return {
    hata: 'Yöntem desteklenmiyor: ' + yontem,
    yol,
    kabul: uc ? uc.yontem : []
  };
}

module.exports = { UCLAR, UCLAR_YOL, bilinmeyenUc, yontemDesteklenmiyor };
