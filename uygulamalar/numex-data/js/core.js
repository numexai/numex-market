/**
 * Numex Data Detective — Çekirdek
 * Para: kayan nokta YOK. Her tutar kuruş bazlı TAMSAYI tutulur (0,1+0,2 = 0,3).
 * Kimlik: 00123 ile 123 ASLA otomatik eşitlenmez (birebir normalize: kırp + boşluk sadeleştir + büyük harf).
 */

/* ---------------------------------- PARA --------------------------------- */

/** "1.234,56" | "1234.56" | "1.234" | 1234.5 | "₺ 12,5" -> tam kuruş sayısı. Çözülemezse null. */
export function paraKurus(ham) {
  if (ham === null || ham === undefined || ham === '') return null;
  if (typeof ham === 'number') {
    if (!Number.isFinite(ham)) return null;
    // float -> metin -> kesin tamsayı (yuvarlama metin üzerinden)
    return _metindenKurus(ham.toFixed(6));
  }
  if (ham instanceof Date) return null;
  let s = String(ham).trim();
  if (!s) return null;

  s = s.replace(/[\s\u00a0\u202f]/g, '').replace(/[₺$€£¥]/g, '');
  let negatif = false;
  if (/^\(.*\)$/.test(s)) { negatif = true; s = s.slice(1, -1); }
  if (s.startsWith('-')) { negatif = true; s = s.slice(1); }
  else if (s.startsWith('+')) s = s.slice(1);
  // yalnız rakam + ayraç kalsın; harf karışıksa (ör. "123A") çözülemez say
  if (!/^[0-9.,]+$/.test(s)) return null;
  const deger = _metindenKurus(s);
  if (deger === null) return null;
  return negatif ? -deger : deger;
}

function _metindenKurus(s) {
  if (!s || !/[0-9]/.test(s)) return null;
  let tam = '', kesir = '';
  const sonNokta = s.lastIndexOf('.');
  const sonVirgul = s.lastIndexOf(',');

  if (sonNokta >= 0 && sonVirgul >= 0) {
    const ondalikAyrac = sonNokta > sonVirgul ? '.' : ',';
    const binlikAyrac = ondalikAyrac === '.' ? ',' : '.';
    const parcalar = s.split(binlikAyrac).join('').split(ondalikAyrac);
    tam = parcalar[0]; kesir = parcalar[1] ?? '';
  } else if (sonVirgul >= 0) {
    const p = s.split(',');
    if (p.length > 2) tam = p.join('');            // 1,234,567 -> binlik
    else { tam = p[0]; kesir = p[1] ?? ''; }        // 12,5  -> ondalık
  } else if (sonNokta >= 0) {
    const p = s.split('.');
    if (p.length > 2) tam = p.join('');             // 1.234.567 -> binlik
    else {
      tam = p[0]; kesir = p[1] ?? '';
      // "1.234" Türkçe binliktir; "1234.56" ondalıktır
      if (kesir.length === 3) { tam = tam + kesir; kesir = ''; }
    }
  } else {
    tam = s;
  }

  tam = tam.replace(/[^0-9]/g, '') || '0';
  kesir = kesir.replace(/[^0-9]/g, '');

  if (kesir.length > 2) {
    let k = parseInt(kesir.slice(0, 2), 10);
    if (parseInt(kesir[2], 10) >= 5) k += 1;
    if (k === 100) { tam = (BigInt(tam) + 1n).toString(); k = 0; }
    kesir = String(k).padStart(2, '0');
  }
  kesir = (kesir + '00').slice(0, 2);
  const t = Number(BigInt(tam));
  if (!Number.isSafeInteger(t)) return null;
  return t * 100 + Number(kesir);
}

/** Kuruş -> Türkçe yazım. birim 'TL' değilse tam sayıda ondalık kırpılır (stok adedi gibi). */
export function kurusYazi(kurus, birim = 'TL') {
  if (kurus === null || kurus === undefined || Number.isNaN(kurus)) return '—';
  const negatif = kurus < 0;
  const mutlak = Math.abs(kurus);
  const lira = Math.floor(mutlak / 100);
  const kurusK = mutlak % 100;
  let yazi = lira.toLocaleString('tr-TR');
  if (kurusK !== 0 || birim === 'TL') yazi += ',' + String(kurusK).padStart(2, '0');
  yazi = (negatif ? '-' : '') + yazi;
  return birim ? yazi + ' ' + birim : yazi;
}

/** Kuruş -> CSV/Excel için nokta ondalıklı düz sayı ("1234.56"). */
export function kurusDuz(kurus) {
  if (kurus === null || kurus === undefined) return '';
  const isaret = kurus < 0 ? '-' : '';
  const m = Math.abs(kurus);
  return `${isaret}${Math.floor(m / 100)}.${String(m % 100).padStart(2, '0')}`;
}

/* --------------------------------- TARİH --------------------------------- */

const AY_GUN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function _gunGecerli(y, m, d) {
  if (m < 1 || m > 12 || d < 1) return false;
  const artik = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const gun = m === 2 && artik ? 29 : AY_GUN[m - 1];
  return d <= gun;
}

function _iso(y, m, d) {
  if (!_gunGecerli(y, m, d)) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Excel seri numarası (1900 sistemi) -> ISO. */
function _excelSeri(n) {
  const ms = Math.round((n - 25569) * 86400 * 1000);
  const t = new Date(ms);
  if (Number.isNaN(t.getTime())) return null;
  return _iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Her türlü tarih girdisini 'YYYY-MM-DD' yapar; çözülemezse null. */
export function tarihISO(ham) {
  if (ham === null || ham === undefined || ham === '') return null;
  if (ham instanceof Date) {
    if (Number.isNaN(ham.getTime())) return null;
    return _iso(ham.getFullYear(), ham.getMonth() + 1, ham.getDate());
  }
  if (typeof ham === 'number') {
    if (ham > 20000 && ham < 80000) return _excelSeri(ham); // 1954–2119 aralığı
    return null;
  }
  const s = String(ham).trim().replace(/[\u00a0]/g, ' ');
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);          // 2026-11-17
  if (m) return _iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);            // 17.11.2026
  if (m) {
    let g = +m[1], a = +m[2], y = +m[3];
    if (y < 100) y += y > 70 ? 1900 : 2000;
    if (g > 12 && a <= 12) { /* zaten g.a.y */ }
    else if (a > 12 && g <= 12) { const t = g; g = a; a = t; }      // 11/17/2026
    return _iso(y, a, g);
  }
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);                          // 20261117
  if (m) return _iso(+m[1], +m[2], +m[3]);
  return null;
}

export function tarihYazi(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** b - a, gün cinsinden (yoksa null). */
export function gunFarki(isoA, isoB) {
  if (!isoA || !isoB) return null;
  const a = Date.UTC(+isoA.slice(0, 4), +isoA.slice(5, 7) - 1, +isoA.slice(8, 10));
  const b = Date.UTC(+isoB.slice(0, 4), +isoB.slice(5, 7) - 1, +isoB.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/* --------------------------------- KİMLİK -------------------------------- */

/** Birebir kimlik normalizasyonu: kırp, iç boşlukları tekle, büyük harf.
 *  BAŞTAKİ SIFIRLAR SİLİNMEZ — "00123" ile "123" ayrı kimliktir. */
export function anahtarNorm(deger) {
  if (deger === null || deger === undefined) return '';
  return String(deger).trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
}

/** Format farkı tespiti için kimlik çekirdeği (YALNIZ ŞÜPHE amaçlı, eşleştirmede kullanılmaz):
 *  harf ve rakam bloklarına ayırır, her rakam bloğunun baştaki sıfırlarını atar.
 *  "S-00123" -> "S123", "S-123" -> "S123" (aynı çekirdek, farklı kimlik),
 *  "S-1005"  -> "S1005" (S-1080 ile aynı çekirdek DEĞİL). */
export function anahtarCekirdek(deger) {
  const n = anahtarNorm(deger);
  const parcalar = n.match(/[0-9A-ZÇĞİÖŞÜ]+/g) || [];
  return parcalar.map(p => {
    if (/^[0-9]+$/.test(p)) return p.replace(/^0+(?=\d)/, '');
    return p.replace(/^([A-ZÇĞİÖŞÜ]+)0+(?=\d)/, '$1');
  }).join('');
}

/** 0..1 benzerlik (Levenshtein). */
export function benzerlik(a, b) {
  a = a || ''; b = b || '';
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length;
  let onceki = new Array(n + 1), simdiki = new Array(n + 1);
  for (let j = 0; j <= n; j++) onceki[j] = j;
  for (let i = 1; i <= m; i++) {
    simdiki[0] = i;
    for (let j = 1; j <= n; j++) {
      const maliyet = a[i - 1] === b[j - 1] ? 0 : 1;
      simdiki[j] = Math.min(simdiki[j - 1] + 1, onceki[j] + 1, onceki[j - 1] + maliyet);
    }
    const t = onceki; onceki = simdiki; simdiki = t;
  }
  return 1 - onceki[n] / Math.max(m, n);
}

/* ------------------------------ CSV / TABLO ------------------------------ */

/** Ayracı ilk satırdan tahmin eder (; , \t |). */
export function csvAyrac(metin) {
  const ilk = metin.split(/\r?\n/)[0] || '';
  const adaylar = [';', ',', '\t', '|'];
  let enIyi = ';', enCok = -1;
  for (const a of adaylar) {
    // tırnak içini sayma
    let sayac = 0, tirnak = false;
    for (let i = 0; i < ilk.length; i++) {
      const c = ilk[i];
      if (c === '"') tirnak = !tirnak;
      else if (c === a && !tirnak) sayac++;
    }
    if (sayac > enCok) { enCok = sayac; enIyi = a; }
  }
  return enCok <= 0 ? ',' : enIyi;
}

/** CSV metni -> { basliklar, satirlar:[{satir, hucre:[]}] } */
export function csvCoz(metin) {
  const temiz = metin.replace(/^\uFEFF/, '');
  const ayrac = csvAyrac(temiz);
  const satirlar = [];
  let hucre = '', kayit = [], tirnak = false, satirNo = 1, ilkSatirNo = 1;

  for (let i = 0; i < temiz.length; i++) {
    const c = temiz[i];
    if (tirnak) {
      if (c === '"') {
        if (temiz[i + 1] === '"') { hucre += '"'; i++; }
        else tirnak = false;
      } else hucre += c;
      continue;
    }
    if (c === '"') { tirnak = true; continue; }
    if (c === ayrac) { kayit.push(hucre); hucre = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && temiz[i + 1] === '\n') i++;
      kayit.push(hucre); hucre = '';
      if (kayit.some(h => String(h).trim() !== '')) {
        satirlar.push({ satir: satirNo, hucre: kayit.map(h => String(h).trim()) });
      }
      kayit = []; satirNo++; continue;
    }
    hucre += c;
  }
  kayit.push(hucre);
  if (kayit.some(h => String(h).trim() !== '')) satirlar.push({ satir: satirNo, hucre: kayit.map(h => String(h).trim()) });

  if (!satirlar.length) return { basliklar: [], satirlar: [] };
  const basliklar = _baslikTekille(satirlar[0].hucre);
  return {
    basliklar,
    satirlar: satirlar.slice(1).map(s => ({
      satir: s.satir,
      hucre: basliklar.map((_, i) => (s.hucre[i] ?? '').toString().trim())
    }))
  };
}

function _baslikTekille(basliklar) {
  const sayac = new Map();
  return basliklar.map((b, i) => {
    let ad = String(b || '').trim() || `Sütun ${i + 1}`;
    const n = (sayac.get(ad) || 0) + 1;
    sayac.set(ad, n);
    return n > 1 ? `${ad} (${n})` : ad;
  });
}

/** Dizi matrisi (XLSX sheet_to_json header:1) -> { basliklar, satirlar } */
export function matristenTablo(matris) {
  const satirlar = [];
  matris.forEach((row, i) => {
    const hucre = (row || []).map(h => {
      if (h instanceof Date) return tarihISO(h) || '';
      if (h === null || h === undefined) return '';
      return typeof h === 'number' ? h : String(h).trim();
    });
    if (!hucre.some(h => String(h).trim() !== '')) return;
    satirlar.push({ satir: i + 1, hucre });
  });
  if (!satirlar.length) return { basliklar: [], satirlar: [] };
  const basliklar = _baslikTekille(satirlar[0].hucre.map(h => String(h)));
  return {
    basliklar,
    satirlar: satirlar.slice(1).map(s => ({
      satir: s.satir,
      hucre: basliklar.map((_, i) => (s.hucre[i] ?? '').toString().trim())
    }))
  };
}

/** Dosya (File) -> { ad, basliklar, satirlar } — CSV ve XLSX. */
export async function dosyaOku(file) {
  const ad = file.name;
  const uzanti = ad.split('.').pop().toLowerCase();
  if (uzanti === 'xlsx' || uzanti === 'xls' || uzanti === 'xlsm') {
    if (!window.XLSX) throw new Error('XLSX okuyucu yüklenemedi (vendor/xlsx.full.min.js).');
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { cellDates: true });
    const sayfa = wb.Sheets[wb.SheetNames[0]];
    const matris = window.XLSX.utils.sheet_to_json(sayfa, { header: 1, raw: true, defval: '' });
    const t = matristenTablo(matris);
    if (!t.basliklar.length) throw new Error('Dosyada okunabilir tablo bulunamadı.');
    return { ad, ...t, sayfaSayisi: wb.SheetNames.length, sayfaAdi: wb.SheetNames[0] };
  }
  const metin = await file.text();
  const t = csvCoz(metin);
  if (!t.basliklar.length) throw new Error('Dosyada okunabilir tablo bulunamadı.');
  return { ad, ...t };
}

/* --------------------------- SÜTUN OTOMATİK TANIMA ------------------------ */

const IPUCU_ANAHTAR = ['satış no', 'satis no', 'fatura', 'sipariş no', 'siparis no', 'işlem no', 'islem no', 'makbuz', 'evrak', 'referans', 'ürün kodu', 'urun kodu', 'stok kodu', 'sicil', 'plaka', 'kayıt no', 'kayit no', 'kimlik', 'id', 'kod', 'no'];
const IPUCU_TUTAR = ['tutar', 'meblağ', 'meblag', 'toplam', 'fiyat', 'ödeme', 'odeme', 'tahsilat', 'ücret', 'ucret', 'maaş', 'maas', 'net', 'brüt', 'brut', 'bakiye', 'miktar', 'adet', 'value', 'amount', 'price', 'qty', 'total', 'sum'];
const IPUCU_TARIH = ['tarih', 'date', 'zaman', 'gün', 'vade', 'dönem', 'donem', 'sayım', 'sayim'];
const IPUCU_ACIKLAMA = ['açıklama', 'aciklama', 'müşteri', 'musteri', 'ad soyad', 'ad', 'isim', 'ürün', 'urun', 'cari', 'not', 'desc', 'name', 'unvan'];
// Para sanılmaması gereken sütunlar (telefon/hesap/kimlik asla toplanmaz, tutar seçilmez)
const YASAK_TUTAR = ['telefon', 'tel ', 'gsm', 'cep', 'iban', 'hesap no', 'hesap', 'tc ', 'tckn', 'kimlik no', 'vergi', 'vkn', 'posta kodu', 'yaş', 'yas'];

function _ipucuPuani(baslik, liste) {
  const b = anahtarNorm(baslik).toLocaleLowerCase('tr-TR');
  for (const k of liste) {
    const kk = k.toLocaleLowerCase('tr-TR');
    if (b === kk) return 1;
    if (b.startsWith(kk) || b.endsWith(kk)) return 0.85;
    if (b.includes(kk)) return 0.65;
  }
  return 0;
}

function _oran(getirici) {
  return getirici;
}

/** Sütunları veriye + başlığa bakarak otomatik tanır. */
export function sutunTani(basliklar, satirlar) {
  const ornek = satirlar.slice(0, 200);
  const profil = basliklar.map((baslik, i) => {
    const degerler = ornek.map(s => s.hucre[i]).filter(v => v !== '' && v != null);
    const sayi = degerler.filter(v => paraKurus(v) !== null).length;
    const tarih = degerler.filter(v => tarihISO(v) !== null).length;
    const tekil = new Set(degerler.map(v => anahtarNorm(v))).size;
    const n = Math.max(degerler.length, 1);
    return {
      i, baslik,
      sayiOran: sayi / n,
      tarihOran: tarih / n,
      tekilOran: tekil / n,
      metinOran: degerler.filter(v => paraKurus(v) === null && tarihISO(v) === null).length / n,
      bos: degerler.length === 0
    };
  });

  const yasakliMi = p => _ipucuPuani(p.baslik, YASAK_TUTAR) > 0;

  // TARİH
  let tarih = -1, tarihPuan = 0.45;
  for (const p of profil) {
    const puan = p.tarihOran * 0.6 + _ipucuPuani(p.baslik, IPUCU_TARIH) * 0.4;
    if (p.tarihOran >= 0.6 && puan > tarihPuan) { tarih = p.i; tarihPuan = puan; }
  }

  // TUTAR (tarih sütunu ve kimlik gibi görünenler hariç)
  let tutar = -1, tutarPuan = 0.5;
  for (const p of profil) {
    if (p.i === tarih) continue;
    const ipucu = _ipucuPuani(p.baslik, IPUCU_TUTAR);
    let puan = p.sayiOran * 0.75 + ipucu * 0.25;
    if (yasakliMi(p)) puan *= 0.15;
    if (p.sayiOran >= 0.8 && puan > tutarPuan) { tutar = p.i; tutarPuan = puan; }
  }

  // ANAHTAR (tutar sütunu hariç; tekil, metin ağırlıklı sütun)
  let anahtar = -1, anahtarPuan = 0.3;
  for (const p of profil) {
    if (p.i === tarih || p.i === tutar) continue;
    const ipucu = _ipucuPuani(p.baslik, IPUCU_ANAHTAR);
    const puan = ipucu * 0.5 + p.tekilOran * 0.35 + p.metinOran * 0.15;
    if (puan > anahtarPuan) { anahtar = p.i; anahtarPuan = puan; }
  }
  if (anahtar < 0) {
    // son çare: tutar/tarih olmayan, en çok tekil değere sahip sütun
    const aday = profil.filter(p => p.i !== tarih && p.i !== tutar).sort((x, y) => y.tekilOran - x.tekilOran)[0];
    anahtar = aday ? aday.i : 0;
  }

  // AÇIKLAMA
  let aciklama = -1, aciklamaPuan = 0.4;
  for (const p of profil) {
    if (p.i === tarih || p.i === tutar || p.i === anahtar) continue;
    const puan = _ipucuPuani(p.baslik, IPUCU_ACIKLAMA) * 0.7 + p.metinOran * 0.3;
    if (puan > aciklamaPuan) { aciklama = p.i; aciklamaPuan = puan; }
  }

  // Uyarılar
  const uyarilar = [];
  if (tutar >= 0 && yasakliMi(profil[tutar])) {
    uyarilar.push(`"${basliklar[tutar]}" sütunu kimlik/telefon gibi görünüyor; tutar olarak kullanılmadı.`);
  }
  if (anahtar === tutar) uyarilar.push('Anahtar ve tutar aynı sütun seçildi — kontrol edin.');

  return { anahtar, tutar, tarih, aciklama, uyarilar, profil: profil.map(p => ({ baslik: p.baslik, sayiOran: p.sayiOran, tarihOran: p.tarihOran, tekilOran: p.tekilOran })) };
}
