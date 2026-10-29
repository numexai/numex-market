/* ============================================================
   Numex Görsel Dönüştürücü — Çekirdek (image-core.js)
   Bağımlılık YOK. Her şey tarayıcıda çalışır; hiçbir ağ isteği yok.

   - Dosya biçimi imzadan (magic bytes) tespit edilir, uzantıya güvenilmez.
   - Dönüşüm Canvas + createImageBitmap / HTMLImageElement ile GERÇEK
     piksel çözme ve yeniden kodlama yapar (uzantı değiştirme değildir).
   - Kodlama sonucu blob'un imzası yeniden okunup doğrulanır; tutmazsa hata.
   - ZIP, Deflate olmadan (store) yazılır: CRC32 + merkezi dizin elle.
   ============================================================ */
(function (kok) {
  'use strict';

  /* ---------------- Sabitler ---------------- */

  var BICIMLER = {
    png:  { mime: 'image/png',  uzanti: 'png',  kayipli: false, etiket: 'PNG' },
    jpeg: { mime: 'image/jpeg', uzanti: 'jpg',  kayipli: true,  etiket: 'JPG' },
    webp: { mime: 'image/webp', uzanti: 'webp', kayipli: true,  etiket: 'WebP' }
  };

  // İmza tablosu: ilk baytlar → biçim adı
  var IMZA = [
    { ad: 'png',  test: function (b) { return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47; } },
    { ad: 'jpeg', test: function (b) { return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; } },
    { ad: 'webp', test: function (b) { return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50; } },
    { ad: 'gif',  test: function (b) { return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38; } },
    { ad: 'bmp',  test: function (b) { return b[0] === 0x42 && b[1] === 0x4d; } },
    { ad: 'avif', test: function (b) { return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && (b[10] === 0x69 || b[10] === 0x66); } },
    { ad: 'tiff', test: function (b) { return (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a); } }
  ];

  function imzaOku(buffer, adet) {
    var b = new Uint8Array(buffer, 0, Math.min(adet || 16, buffer.byteLength));
    for (var i = 0; i < IMZA.length; i++) {
      if (IMZA[i].test(b)) return IMZA[i].ad;
    }
    // SVG metin tabanlı olabilir
    try {
      var bas = new TextDecoder('utf-8').decode(new Uint8Array(buffer, 0, Math.min(256, buffer.byteLength)));
      if (/<svg[\s>]/i.test(bas) || /^\s*<\?xml/i.test(bas) && /<svg/i.test(bas)) return 'svg';
    } catch (e) { /* yok say */ }
    return 'bilinmiyor';
  }

  /* ---------------- Yardımcılar ---------------- */

  function uzantiAyir(ad) {
    var nokta = ad.lastIndexOf('.');
    if (nokta <= 0 || nokta === ad.length - 1) return { govde: ad, uzanti: '' };
    return { govde: ad.slice(0, nokta), uzanti: ad.slice(nokta + 1) };
  }

  /** Orijinal dosya adını korur, uzantıyı hedef biçime göre DEĞİŞTİRİR. */
  function hedefAd(ad, hedefBicim) {
    var p = uzantiAyir(ad || 'goruntu');
    var govde = p.govde || 'goruntu';
    // Bilinen bir görsel uzantısıysa at; değilse de son parçayı uzantı say.
    return govde + '.' + BICIMLER[hedefBicim].uzanti;
  }

  /** Aynı ada sahip dosya varsa " -2", " -3" ekler (uzantıdan önce). */
  function benzersizAd(kullanilan, ad) {
    if (!kullanilan[ad]) { kullanilan[ad] = 1; return ad; }
    var p = uzantiAyir(ad);
    var sayac = kullanilan[ad] + 1;
    var yeni = p.govde + ' -' + sayac + (p.uzanti ? '.' + p.uzanti : '');
    return benzersizAd(kullanilan, yeni);
  }

  function insanBoyut(bayt) {
    if (!isFinite(bayt) || bayt < 0) return '—';
    if (bayt < 1024) return bayt + ' B';
    var kb = bayt / 1024;
    if (kb < 1024) return (kb < 10 ? kb.toFixed(1) : Math.round(kb)) + ' KB';
    var mb = kb / 1024;
    return (mb < 10 ? mb.toFixed(2) : mb.toFixed(1)) + ' MB';
  }

  function hexToRgb(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      css: '#' + h.toUpperCase()
    };
  }

  function bekle(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- Çözme ---------------- */

  /**
   * Dosyayı gerçek piksellere çözer.
   * Önce createImageBitmap (hızlı, worker'da da çalışır), olmazsa <img>.
   */
  async function coz(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(file);
      } catch (e) {
        // GIF/AVIF/SVG gibi biçimlerde destek yoksa <img> yoluna düşülür.
      }
    }
    return await cozImg(file);
  }

  function cozImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        // <img> kapanmadan URL serbest bırakılmamalı; yüklenmiş veri bellekte.
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Görüntü çözülemedi — dosya bozuk ya da tarayıcı bu biçimi desteklemiyor.'));
      };
      img.decoding = 'async';
      img.src = url;
    });
  }

  function kaynakBoyut(kaynak) {
    return {
      g: kaynak.width || kaynak.naturalWidth || 0,
      y: kaynak.height || kaynak.naturalHeight || 0
    };
  }

  /* ---------------- Boyut hesabı ---------------- */

  /**
   * Hedef piksel boyutunu hesaplar. Turda "yeniden boyutlandırma" istenmezse
   * orijinal boyut döner.
   */
  function hedefBoyut(kaynakG, kaynakY, ayar) {
    var mod = ayar.boyutModu || 'yok';
    var g = kaynakG, y = kaynakY;

    if (mod === 'yuzde') {
      var k = Math.max(1, Number(ayar.yuzde) || 100) / 100;
      g = Math.round(kaynakG * k);
      y = Math.round(kaynakY * k);
    } else if (mod === 'genislik') {
      var hg = Math.max(1, Math.round(Number(ayar.genislik) || kaynakG));
      var oran = kaynakY / (kaynakG || 1);
      g = hg;
      y = Math.max(1, Math.round(hg * oran));
    } else if (mod === 'cerceve') {
      var cg = Math.max(1, Math.round(Number(ayar.cerceveG) || kaynakG));
      var cy = Math.max(1, Math.round(Number(ayar.cerceveY) || kaynakY));
      var olcek = Math.min(cg / (kaynakG || 1), cy / (kaynakY || 1));
      g = Math.max(1, Math.round(kaynakG * olcek));
      y = Math.max(1, Math.round(kaynakY * olcek));
    }

    // Tarayıcıların pratik üst sınırı (Safari/Chrome ~16k kenar)
    var TAVAN = 16384;
    if (g > TAVAN || y > TAVAN) {
      var o2 = Math.min(TAVAN / g, TAVAN / y);
      g = Math.max(1, Math.floor(g * o2));
      y = Math.max(1, Math.floor(y * o2));
    }
    return { g: Math.max(1, Math.round(g)), y: Math.max(1, Math.round(y)) };
  }

  /* ---------------- Kodlama ---------------- */

  function canvasKodla(canvas, mime, kalite) {
    return new Promise(function (resolve, reject) {
      if (typeof canvas.toBlob !== 'function') {
        reject(new Error('Bu tarayıcı canvas kodlamasını desteklemiyor.'));
        return;
      }
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('Kodlama başarısız — tarayıcı bu biçime yazamadı (' + BICIMLER[mime].etiket + ').'));
          return;
        }
        if (blob.type && blob.type.indexOf(mime) === -1) {
          reject(new Error('Tarayıcı istenen biçime yazamadı, onun yerine "' + blob.type + '" verdi (' + BICIMLER[mime].etiket + ' desteklenmiyor olabilir).'));
          return;
        }
        resolve(blob);
      }, mime, BICIMLER[mime] ? kalite / 100 : undefined);
    });
  }

  /**
   * Tek bir görseli dönüştürür.
   * ayar: { hedef:'png'|'jpeg'|'webp', kalite:10..100, arkaPlan:'#RRGGBB',
   *         boyutModu:'yok'|'yuzde'|'genislik'|'cerceve', yuzde, genislik, cerceveG, cerceveY }
   */
  async function donustur(file, ayar) {
    var hedef = ayar.hedef;
    var tanim = BICIMLER[hedef];
    if (!tanim) throw new Error('Geçersiz hedef biçim: ' + hedef);

    // 1) Biçim girişi kontrolü (uzantıya değil, imzaya bakılır)
    var ilkBayt = await file.slice(0, 16).arrayBuffer();
    var girisBicim = imzaOku(ilkBayt, 16);
    if (girisBicim === 'bilinmiyor') {
      throw new Error('Bu dosya bir görsel değil (imza tanınmadı): ' + file.name);
    }

    // 2) Gerçek piksel çözme
    var kaynak = await coz(file);
    var kb = kaynakBoyut(kaynak);
    if (!kb.g || !kb.y) {
      if (kaynak.close) kaynak.close();
      throw new Error('Görüntü boyutu okunamadı.');
    }

    // 3) Hedef boyut
    var hb = hedefBoyut(kb.g, kb.y, ayar);

    // 4) Gerekirse kademeli küçültme (kalite kaybını azaltır)
    var araG = kb.g, araY = kb.y;
    var basamaklar = [];
    while (araG / 2 >= hb.g && araY / 2 >= hb.y && araG > 64 && araY > 64) {
      araG = Math.round(araG / 2);
      araY = Math.round(araY / 2);
      basamaklar.push({ g: araG, y: araY });
    }

    var tuval = document.createElement('canvas');
    var ctx = tuval.getContext('2d');
    if (!ctx) {
      if (kaynak.close) kaynak.close();
      throw new Error('Canvas 2D bağlamı alınamadı.');
    }

    var mevcut = kaynak;
    for (var i = 0; i < basamaklar.length; i++) {
      var b = basamaklar[i];
      tuval.width = b.g; tuval.height = b.y;
      ctx.clearRect(0, 0, b.g, b.y);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(mevcut, 0, 0, b.g, b.y);
      if (mevcut.close) mevcut.close();
      var ara = document.createElement('canvas');
      ara.width = b.g; ara.height = b.y;
      ara.getContext('2d').drawImage(tuval, 0, 0);
      mevcut = ara;
    }

    // 5) Son çizim
    tuval.width = hb.g;
    tuval.height = hb.y;
    ctx.clearRect(0, 0, hb.g, hb.y);
    if (hedef === 'jpeg') {
      // JPG şeffaflık desteklemez: kullanıcının seçtiği renk zemine boyanır.
      var rgb = hexToRgb(ayar.arkaPlan) || { r: 255, g: 255, b: 255, css: '#FFFFFF' };
      ctx.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
      ctx.fillRect(0, 0, hb.g, hb.y);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(mevcut, 0, 0, hb.g, hb.y);
    if (mevcut.close) mevcut.close();
    if (kaynak.close && kaynak !== mevcut) kaynak.close();

    // 6) Kodla
    var blob = await canvasKodla(tuval, tanim.mime, ayar.kalite);

    // 7) Çıktıyı DOĞRULA: imza gerçekten hedef biçim mi?
    var ciktiBayt = await blob.slice(0, 16).arrayBuffer();
    var ciktiBicim = imzaOku(ciktiBayt, 16);
    if (ciktiBicim !== hedef) {
      throw new Error('Doğrulama başarısız: çıktı ' + tanim.etiket + ' değil, "' + ciktiBicim + '" olarak yazıldı.');
    }

    // Tuvali boşalt (bellek)
    tuval.width = 0; tuval.height = 0;

    return {
      blob: blob,
      ad: hedefAd(file.name, hedef),
      hedefBicim: hedef,
      hedefMime: tanim.mime,
      girisBicim: girisBicim,
      kaynakBoyut: { g: kb.g, y: kb.y, bayt: file.size },
      ciktiBoyut: { g: hb.g, y: hb.y, bayt: blob.size }
    };
  }

  /* ---------------- ZIP yazıcı (store, sıkıştırmasız) ---------------- */

  var CRC_TABLO = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLO[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(s) { return new TextEncoder().encode(s); }

  function tarihSaat(d) {
    var yil = Math.max(1980, d.getFullYear());
    var sa = ((yil - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var st = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    return { sa: sa & 0xFFFF, st: st & 0xFFFF };
  }

  /**
   * ZIP üretir. girisler: [{ ad: 'x.png', blob }]
   * Dönüş: { blob, bayt }  — ZIP64'e girilmez; 4GB üstü desteklenmez.
   */
  async function zipYap(girisler, secenek) {
    secenek = secenek || {};
    var parcalar = [];
    var merkez = [];
    var konum = 0;
    var zaman = tarihSaat(secenek.tarih || new Date());
    var toplam = 0;

    for (var i = 0; i < girisler.length; i++) {
      var g = girisler[i];
      var veri = new Uint8Array(await g.blob.arrayBuffer());
      var crc = crc32(veri);
      var adBayt = utf8(g.ad);
      var boyut = veri.length;
      toplam += boyut;

      // Yerel başlık: 30 bayt + ad
      var yerel = new Uint8Array(30 + adBayt.length);
      var yv = new DataView(yerel.buffer);
      yv.setUint32(0, 0x04034b50, true);
      yv.setUint16(4, 20, true);          // sürüm gerekli
      yv.setUint16(6, 0x0800, true);      // UTF-8 ad bayrağı
      yv.setUint16(8, 0, true);           // yöntem: store
      yv.setUint16(10, zaman.st, true);
      yv.setUint16(12, zaman.sa, true);
      yv.setUint32(14, crc, true);
      yv.setUint32(18, boyut, true);
      yv.setUint32(22, boyut, true);
      yv.setUint16(26, adBayt.length, true);
      yv.setUint16(28, 0, true);
      yerel.set(adBayt, 30);

      parcalar.push(yerel, veri);

      // Merkezi dizin kaydı: 46 bayt + ad
      var merkezKayit = new Uint8Array(46 + adBayt.length);
      var mv = new DataView(merkezKayit.buffer);
      mv.setUint32(0, 0x02014b50, true);
      mv.setUint16(4, 20, true);          // oluşturma sürümü
      mv.setUint16(6, 20, true);          // gerekli sürüm
      mv.setUint16(8, 0x0800, true);
      mv.setUint16(10, 0, true);
      mv.setUint16(12, zaman.st, true);
      mv.setUint16(14, zaman.sa, true);
      mv.setUint32(16, crc, true);
      mv.setUint32(20, boyut, true);
      mv.setUint32(24, boyut, true);
      mv.setUint16(28, adBayt.length, true);
      mv.setUint16(30, 0, true);          // ek alan
      mv.setUint16(32, 0, true);          // yorum
      mv.setUint16(34, 0, true);          // disk
      mv.setUint16(36, 0, true);          // iç öznitelik
      mv.setUint32(38, 0, true);          // dış öznitelik
      mv.setUint32(42, konum, true);      // yerel başlık konumu
      merkezKayit.set(adBayt, 46);
      merkez.push(merkezKayit);

      konum += yerel.length + boyut;
    }

    var merkezBoyut = merkez.reduce(function (t, p) { return t + p.length; }, 0);
    var son = new Uint8Array(22);
    var sv = new DataView(son.buffer);
    sv.setUint32(0, 0x06054b50, true);
    sv.setUint16(4, 0, true);
    sv.setUint16(6, 0, true);
    sv.setUint16(8, girisler.length, true);
    sv.setUint16(10, girisler.length, true);
    sv.setUint32(12, merkezBoyut, true);
    sv.setUint32(16, konum, true);
    sv.setUint16(20, 0, true);

    var blob = new Blob(parcalar.concat(merkez, [son]), { type: 'application/zip' });
    return { blob: blob, bayt: blob.size, dosyaSayisi: girisler.length, sikistirilmamisIcerik: toplam };
  }

  /* ---------------- Dışa aktarım ---------------- */

  var API = {
    BICIMLER: BICIMLER,
    imzaOku: imzaOku,
    uzantiAyir: uzantiAyir,
    hedefAd: hedefAd,
    benzersizAd: benzersizAd,
    insanBoyut: insanBoyut,
    hexToRgb: hexToRgb,
    bekle: bekle,
    hedefBoyut: hedefBoyut,
    donustur: donustur,
    zipYap: zipYap,
    crc32: crc32
  };

  kok.NumexGorsel = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
