/* ============================================================
   ZÜMRÜT KUYUMCULUK — KUR & ALTIN BANDI
   Statik veri + canlı simülasyon (demo).
   // TODO: Gerçek entegrasyon için TCMB / serbest piyasa API'si bağlanacak.
   ============================================================ */
'use strict';

/* -------------------- VERİ MODELİ -------------------- */
/**
 * @typedef {Object} Kur
 * @property {string} kod       Kısa kod (USD, EUR, GA…)
 * @property {string} ad        Görünen ad
 * @property {number} alis      Alış fiyatı
 * @property {number} satis     Satış fiyatı
 * @property {number} degisim   Günlük değişim (%)
 * @property {number} [birim]   1 = adet, 100 = 100'lük gruplar
 */

/** @type {Kur[]} */
var KUR_VERISI = [
  { kod: 'USD', ad: 'Amerikan Doları',  alis: 41.28,   satis: 41.42,   degisim: 0.12 },
  { kod: 'EUR', ad: 'Euro',             alis: 44.95,   satis: 45.12,   degisim: -0.08 },
  { kod: 'GBP', ad: 'İngiliz Sterlini', alis: 52.60,   satis: 52.85,   degisim: 0.21 },
  { kod: 'GA',  ad: 'Gram Altın',       alis: 3950.00, satis: 3985.00, degisim: 0.35 },
  { kod: 'C',   ad: 'Çeyrek Altın',     alis: 6480.00, satis: 6540.00, degisim: 0.28 },
  { kod: 'Y',   ad: 'Yarım Altın',      alis: 12960.00, satis: 13080.00, degisim: 0.30 }
];

/** Simülasyon aralığı (ms) */
var KUR_SIMULASYON_MS = 4000;
/** Çalışan interval kimlikleri */
var kurIntervalId = null;
var kurSaatIntervalId = null;

/* -------------------- YARDIMCILAR -------------------- */

/**
 * Fiyatı Türkçe biçimde yazar (binlik ayraç, 2 ondalık).
 * @param {number} deger
 * @returns {string} örn. "41,28 ₺"
 */
function fiyatFormatla(deger) {
  if (typeof deger !== 'number' || isNaN(deger)) { return '—'; }
  var metin = deger.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return metin + ' ₺';
}

/**
 * Değişim yönüne göre sınıf adı döner.
 * @param {number} degisim
 * @returns {'artis'|'dusus'|'sabit'}
 */
function trendHesapla(degisim) {
  if (typeof degisim !== 'number' || isNaN(degisim) || Math.abs(degisim) < 0.005) {
    return 'sabit';
  }
  return degisim > 0 ? 'artis' : 'dusus';
}

/**
 * Trend sınıfına göre ok işareti.
 * @param {string} trend
 * @returns {string}
 */
function trendOk(trend) {
  if (trend === 'artis') { return '▲'; }
  if (trend === 'dusus') { return '▼'; }
  return '▬';
}

/**
 * Değişim metnini formatlar.
 * @param {number} degisim
 * @returns {string} örn. "+0,12%"
 */
function degisimFormatla(degisim) {
  var d = (typeof degisim === 'number' && !isNaN(degisim)) ? degisim : 0;
  var isaret = d > 0 ? '+' : (d < 0 ? '' : '');
  return isaret + d.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
}

/* -------------------- DOM ÜRETİMİ -------------------- */

/**
 * Tek bir kur kartı oluşturur.
 * @param {Kur} veri
 * @returns {HTMLElement}
 */
function kurKartOlustur(veri) {
  var trend = trendHesapla(veri.degisim);

  var kart = document.createElement('div');
  kart.className = 'kur-kart';
  kart.setAttribute('data-kod', veri.kod);
  kart.setAttribute('role', 'row');
  kart.setAttribute('aria-label', veri.ad + ' alış ' + fiyatFormatla(veri.alis) + ', satış ' + fiyatFormatla(veri.satis));

  // Üst satır: kod / ad / trend
  var ust = document.createElement('div');
  ust.className = 'kur-ust';

  var kodEl = document.createElement('span');
  kodEl.className = 'kur-kod';
  kodEl.textContent = veri.kod;

  var adEl = document.createElement('span');
  adEl.className = 'kur-ad';
  adEl.textContent = veri.ad;

  var trendEl = document.createElement('span');
  trendEl.className = 'kur-trend ' + trend;
  trendEl.setAttribute('data-degisim', String(veri.degisim));
  trendEl.textContent = trendOk(trend) + ' ' + degisimFormatla(veri.degisim);

  ust.appendChild(kodEl);
  ust.appendChild(adEl);
  ust.appendChild(trendEl);

  // Alt satır: alış / satış
  var fiyatlar = document.createElement('div');
  fiyatlar.className = 'kur-fiyatlar';

  var alisKap = document.createElement('div');
  alisKap.className = 'kur-fiyat alim';
  var alisSmall = document.createElement('small');
  alisSmall.textContent = 'Alış';
  var alisStrong = document.createElement('strong');
  alisStrong.setAttribute('data-alan', 'alis');
  alisStrong.textContent = fiyatFormatla(veri.alis);
  alisKap.appendChild(alisSmall);
  alisKap.appendChild(alisStrong);

  var satisKap = document.createElement('div');
  satisKap.className = 'kur-fiyat';
  var satisSmall = document.createElement('small');
  satisSmall.textContent = 'Satış';
  var satisStrong = document.createElement('strong');
  satisStrong.setAttribute('data-alan', 'satis');
  satisStrong.textContent = fiyatFormatla(veri.satis);
  satisKap.appendChild(satisSmall);
  satisKap.appendChild(satisStrong);

  fiyatlar.appendChild(alisKap);
  fiyatlar.appendChild(satisKap);

  kart.appendChild(ust);
  kart.appendChild(fiyatlar);
  return kart;
}

/**
 * Tüm kur kartlarını container'a basar.
 * @param {Kur[]} liste
 */
function kurTablosunuCiz(liste) {
  var kap = document.getElementById('kur-tablo');
  if (!kap) { return; }
  kap.innerHTML = '';

  if (!liste || !liste.length) {
    var bos = document.createElement('p');
    bos.className = 'vitrin-bos';
    bos.textContent = 'Kur bilgisi şu anda yüklenemiyor.';
    kap.appendChild(bos);
    return;
  }

  var parca = document.createDocumentFragment();
  liste.forEach(function (veri) {
    parca.appendChild(kurKartOlustur(veri));
  });
  kap.appendChild(parca);
}

/* -------------------- CANLI SİMÜLASYON -------------------- */

/**
 * Son güncelleme saatini yazar.
 */
function saatGuncelle() {
  var el = document.getElementById('kur-saat');
  if (!el) { return; }
  var simdi = new Date();
  var saat = simdi.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  el.textContent = saat;
}

/**
 * Kart içindeki bir fiyat alanını günceller ve vurgu animasyonu tetikler.
 * @param {HTMLElement} kart
 * @param {string} alan 'alis' | 'satis'
 * @param {number} deger
 */
function kartFiyatGuncelle(kart, alan, deger) {
  var el = kart.querySelector('[data-alan="' + alan + '"]');
  if (!el) { return; }
  el.textContent = fiyatFormatla(deger);
}

/**
 * Trend etiketini günceller.
 * @param {HTMLElement} kart
 * @param {number} degisim
 */
function kartTrendGuncelle(kart, degisim) {
  var el = kart.querySelector('.kur-trend');
  if (!el) { return; }
  var trend = trendHesapla(degisim);
  el.className = 'kur-trend ' + trend;
  el.textContent = trendOk(trend) + ' ' + degisimFormatla(degisim);
}

/**
 * Demo canlılık: her turda fiyatları hafifçe oynatır.
 */
function simuleKurHareketi() {
  var kartlar = document.querySelectorAll('#kur-tablo .kur-kart');
  if (!kartlar.length) { return; }

  Array.prototype.forEach.call(kartlar, function (kart) {
    var kod = kart.getAttribute('data-kod');
    var veri = null;
    for (var i = 0; i < KUR_VERISI.length; i++) {
      if (KUR_VERISI[i].kod === kod) { veri = KUR_VERISI[i]; break; }
    }
    if (!veri) { return; }

    // ±%0.15 aralığında rastgele oynama
    var oran = (Math.random() - 0.5) * 0.003;
    veri.alis = Math.max(0.01, veri.alis * (1 + oran));
    veri.satis = Math.max(0.01, veri.satis * (1 + oran));

    // Değişim göstergesini hafifçe kaydır (sınırla)
    veri.degisim = Math.max(-3, Math.min(3, veri.degisim + (Math.random() - 0.5) * 0.06));

    kartFiyatGuncelle(kart, 'alis', veri.alis);
    kartFiyatGuncelle(kart, 'satis', veri.satis);
    kartTrendGuncelle(kart, veri.degisim);

    // Vurgu animasyonu
    kart.classList.remove('vurgula');
    // reflow ile animasyonu yeniden tetikle
    void kart.offsetWidth;
    kart.classList.add('vurgula');
  });

  saatGuncelle();
}

/* -------------------- BAŞLAT -------------------- */

/**
 * Kur bandını çizer ve zamanlayıcıları başlatır.
 */
function kurBaslat() {
  if (!document.getElementById('kur-tablo')) { return; }

  kurTablosunuCiz(KUR_VERISI);
  saatGuncelle();

  if (kurIntervalId) { clearInterval(kurIntervalId); }
  if (kurSaatIntervalId) { clearInterval(kurSaatIntervalId); }

  kurIntervalId = setInterval(simuleKurHareketi, KUR_SIMULASYON_MS);
  kurSaatIntervalId = setInterval(saatGuncelle, 1000);

  // Sekme arka plandayken gereksiz çalışmayı azalt
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (kurIntervalId) { clearInterval(kurIntervalId); kurIntervalId = null; }
      if (kurSaatIntervalId) { clearInterval(kurSaatIntervalId); kurSaatIntervalId = null; }
    } else if (!kurIntervalId) {
      kurIntervalId = setInterval(simuleKurHareketi, KUR_SIMULASYON_MS);
      kurSaatIntervalId = setInterval(saatGuncelle, 1000);
    }
  });
}

document.addEventListener('DOMContentLoaded', kurBaslat);
