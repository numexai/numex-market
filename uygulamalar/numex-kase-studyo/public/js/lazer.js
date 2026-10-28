/* ============================================================
   NUMEX KAŞE STÜDYO — LAZER KÖPRÜSÜ (Web Serial API)
   ------------------------------------------------------------
   Amaç: tarayıcıdan GERÇEK makineye bağlanmak.
   Bu dosya, üretilen G-code'u USB/COM portu üzerinden
   GRBL tabanlı lazere (Creality Falcon2 Pro 40W) gönderir.

   NEDEN AYRI DOSYA?
   - api.js  : tarayıcı <-> Node sunucusu (HTTP, port 4175)
   - lazer.js: tarayıcı <-> LAZER (seri port, COM3 vb.)
   İkisi tamamen farklı kanallardır; karıştırılırsa
   "G-code üretiliyor ama makineye gitmiyor" durumu doğar.

   GEREKSİNİM: Chrome veya Edge (Web Serial destekli).
   Firefox/Safari desteklemez — nazik uyarı döner.

   GRBL AKIŞ KONTROLÜ (kritik):
   GRBL'in seri tamponu ~128 bayttır. Tüm G-code'u birden
   göndermek tamponu taşırır ve makine rastgele hareket eder.
   Bu yüzden "ok" el sıkışması (character-counting) uygulanır:
   her satır gönderilir, GRBL "ok" dönene kadar beklenir.
   ============================================================ */
'use strict';

(function (global) {
  const VARSAYILAN_BAUD = 115200; // Creality Falcon2 Pro / GRBL 1.1 varsayılanı

  /* GRBL tampon güvenlik eşiği: 128 baytın altında tutulur. */
  const TAMPON_ESIK = 120;

  /* Tek satır yanıtı için beklenecek en uzun süre (ms).
     Kesim satırları yavaş işlenir (lazer açık, ilerleme düşük). */
  const YANIT_ZAMAN_ASIMI = 30000;

  /* ---------- Durum ---------- */
  const durum = {
    port: null,
    okuyucu: null,
    yazici: null,
    bagli: false,
    gonderiyor: false,
    durduruldu: false,
    /* duraklatildi: feed-hold aktif → kes() döngüsü burada bekler.
       durduruldu'dan FARKI: iş iptal olmaz, devam edilebilir. */
    duraklatildi: false,
    /* makineDurumu: GRBL durum raporundan okunan gerçek durum
       (Idle / Run / Hold / Alarm / Home / Door / Jog) */
    makineDurumu: 'Idle',
    konum: null,      /* { x, y, z } — son durum raporundan */
    lazerGucu: null,  /* S değeri (0-1000) — lazer şu an ne güçte */
    tamponBayt: 0,
    satirSayisi: 0,
    gonderilenSatir: 0
  };

  /* Dinleyiciler (arayüz ilerleme çubuğunu buralardan besler) */
  const dinleyiciler = { durum: [], ilerleme: [], log: [] };

  function bildir(tur, veri) {
    (dinleyiciler[tur] || []).forEach(function (f) {
      try { f(veri); } catch (e) { /* arayüz hatası akışı bozmasın */ }
    });
  }

  /* ---------- Yetenek kontrolü ---------- */
  function destekliMi() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /* ------------------------------------------------------------
     NAVIGATOR ERİŞİMİ (güvenli)
     Tarayıcıda `navigator` globaldir; testler ise dosyayı izole bir
     kapsamda çalıştırıp navigator'ı parametre olarak geçer. İki
     durumda da çalışması için tek bir erişim noktası kullanıyoruz.
     ------------------------------------------------------------ */
  function seriPortAl() {
    try {
      if (typeof navigator !== 'undefined' && navigator && navigator.serial) return navigator.serial;
    } catch (_) { /* izole kapsamda navigator tanımsız olabilir */ }
    try {
      if (typeof global !== 'undefined' && global && global.navigator && global.navigator.serial) {
        return global.navigator.serial;
      }
    } catch (_) { /* global de yoksa destek yok demektir */ }
    return null;
  }

  function destekHatasi() {
    return {
      tamam: false,
      kod: 'DESTEK_YOK',
      hata: 'Bu tarayıcı seri port (Web Serial) desteklemiyor. ' +
            'Chrome veya Edge kullanmalısınız. Firefox ve Safari desteklemez.'
    };
  }

  /* ---------- Bağlan ---------- */
  /**
   * Kullanıcıya port seçtirir ve bağlantıyı açar.
   * @param {{ baud?: number }} [secenek]
   */
  async function baglan(secenek) {
    if (!destekliMi()) return destekHatasi();
    if (durum.bagli) return { tamam: true, zaten: true, mesaj: 'Zaten bağlı' };

    const baud = (secenek && secenek.baud) || VARSAYILAN_BAUD;

    try {
      /* ---- 1. ADIM: OTOMATİK PORT BULMA ----
         Kullanıcı port seçmek zorunda kalmamalı. Tarayıcı, kullanıcının
         DAHA ÖNCE izin verdiği portları hatırlar; getPorts() bunları verir.
         Fiziksel olarak takılı ve açık (usbVendorId'li) ilk portu seçeriz.
         Böylece makine takılıyken butona basmak yeterli olur. */
      let adaylar = [];
      const SP = seriPortAl();
      try { adaylar = SP ? await SP.getPorts() : []; } catch (_) { adaylar = []; }

      const takililar = (adaylar || []).filter(function (p) {
        const b = p.getInfo ? p.getInfo() : {};
        return b && b.usbVendorId;   // gerçek USB cihazı (sanaldan ayırt)
      });

      if (takililar.length === 1) {
        /* Tek cihaz → sormadan doğrudan bağlan. Kullanıcı hiçbir şey seçmez. */
        durum.port = takililar[0];
        bildir('log', { tip: 'bilgi', mesaj: 'Lazer otomatik bulundu — bağlanılıyor…' });
      } else if (takililar.length > 1) {
        /* Birden çok lazer → en son kullanılanı hatırla (localStorage). */
        const hatirlanan = (typeof localStorage !== 'undefined')
          ? localStorage.getItem('numex.sonPort') : null;
        durum.port = takililar.find(function (p) {
          return String(p.getInfo && p.getInfo().usbVendorId) === String(hatirlanan);
        }) || takililar[0];
        bildir('log', { tip: 'bilgi', mesaj: takililar.length + ' cihaz bulundu, otomatik seçildi.' });
      } else {
        /* Hiç izinli cihaz yok → tarayıcı ilk kez soracak (tek seferlik).
           Bu tarayıcının güvenlik kuralıdır, atlanamaz. Sonrasında hatırlanır. */
        durum.port = await navigator.serial.requestPort();
      }

      await durum.port.open({ baudRate: baud });

      /* Seçilen cihazı hatırla — sonraki açılışta otomatik bulunsun. */
      try {
        const bilgi = durum.port.getInfo ? durum.port.getInfo() : {};
        if (bilgi && bilgi.usbVendorId && typeof localStorage !== 'undefined') {
          localStorage.setItem('numex.sonPort', String(bilgi.usbVendorId));
        }
      } catch (_) { /* hatırlama başarısız olsa da bağlantı sürer */ }

      durum.yazici = durum.port.writable.getWriter();
      durum.bagli = true;
      durum.durduruldu = false;
      durum.tamponBayt = 0;
      durum.gonderilenSatir = 0;

      bildir('durum', { bagli: true, baud: baud });
      bildir('log', { tip: 'bilgi', mesaj: 'Bağlandı · ' + baud + ' baud' });

      /* Okuma döngüsünü başlat (GRBL "ok" yanıtları için) */
      okumaDongusuBaslat();
      durumTakibiniBaslat();

      return { tamam: true, baud: baud };
    } catch (e) {
      const ad = (e && e.name) || '';
      const msg = String((e && e.message) || e || '');
      /* Kullanıcı port seçmeden iptal ettiyse bu bir hata değildir. */
      if (ad === 'NotFoundError') {
        return { tamam: false, kod: 'IPTAL', hata: 'Port seçilmedi.' };
      }
      /* Yarım açık kalan handle'ı serbest bırak (sonraki deneme temiz olsun). */
      try { if (durum.yazici) { durum.yazici.releaseLock(); durum.yazici = null; } } catch (_) {}
      try { if (durum.port && durum.port.close) await durum.port.close().catch(function () {}); } catch (_) {}
      durum.bagli = false;
      /* "An unknown system error" / open hatası → port BAŞKA yerde açık (en sık sebep). */
      if (/unknown system error|failed to open|access is denied|access denied|invalidstate|networkerror|already open|busy|kilitli/i.test(ad + ' ' + msg)) {
        return {
          tamam: false, kod: 'PORT_MESGUL',
          hata: 'Port MEŞGUL — başka bir program veya sekme makineyi tutuyor. ' +
                'Şunları KAPAT: LaserGRBL / LightBurn / Creality yazılımı + DİĞER kaşe sekmeleri. ' +
                'Sonra makinenin USB kablosunu çıkar-tak ve TEK sekmede tekrar bağlan.'
        };
      }
      return { tamam: false, kod: 'BAGLANTI_HATASI', hata: msg };
    }
  }

  /* ---------- Gelen veriyi oku ---------- */
  let okumaSuruyor = false;

  async function okumaDongusuBaslat() {
    if (!durum.port || !durum.port.readable || okumaSuruyor) return;
    okumaSuruyor = true;

    const cozucu = new TextDecoderStream();
    durum.port.readable.pipeTo(cozucu.writable).catch(function () { /* kapanınca normal */ });
    durum.okuyucu = cozucu.readable.getReader();

    let tampon = '';
    try {
      while (durum.bagli) {
        const { value, done } = await durum.okuyucu.read();
        if (done) break;
        tampon += value;

        /* Satır satır işle: GRBL her komuta bir satır yanıt verir. */
        let satirSonu;
        while ((satirSonu = tampon.indexOf('\n')) >= 0) {
          const satir = tampon.slice(0, satirSonu).trim();
          tampon = tampon.slice(satirSonu + 1);
          if (satir) yanitIsle(satir);
        }
      }
    } catch (e) {
      if (durum.bagli) bildir('log', { tip: 'hata', mesaj: 'Okuma hatası: ' + e.message });
    } finally {
      okumaSuruyor = false;
    }
  }

  /* GRBL yanıt eşleştirme — TEK BEKLEYEN model (satır-satır handshake).
     KÖK NEDEN (2026-09-12, "bağlı ama yazmıyor"): eski char-counting yolu
     tamponu doluysa "ok" bekliyor, DEĞİLSE beklemeden yazıyordu; üstelik "ok"ta
     tamponBayt'ı 0'a SIFIRLIYORDU → GRBL 128-bayt RX tamponu taşıp komut
     düşürüyordu. Ayrıca 'error' yanıtı satirGonder'e HİÇ bağlı değildi
     (bekleyenler.hata'ya kimse push etmiyordu) → GRBL hatası SESSİZ kalıyordu.
     Çözüm: her komut TAM BİR "ok" alana kadar sıradaki gönderilmez; error/ALARM
     bekleyeni REDDEDER (hata yüzeye çıkar). GRBL protokolünün standart, güvenli hali. */
  let bekleyenYanit = null;

  function bekleyeniCoz(hata) {
    const w = bekleyenYanit; bekleyenYanit = null;
    if (w) { if (hata) w.red(hata); else w.cozum(); }
  }

  /* ------------------------------------------------------------
     GRBL DURUM RAPORU AYRIŞTIRICI
     Biçim: <Idle|MPos:12.340,5.000,0.000|FS:0,0|WCO:0,0,0>
     İlk alan makine durumudur; kalan alanlar '|' ile ayrılır.
     Döner: { durum, konum:{x,y,z}|null, guc:number|null }
     ------------------------------------------------------------ */
  function durumRaporuAyristir(satir) {
    const govde = String(satir).replace(/^</, '').replace(/>$/, '');
    const parcalar = govde.split('|');
    const sonuc = { durum: parcalar[0] || null, konum: null, guc: null };

    for (let i = 1; i < parcalar.length; i++) {
      const p = parcalar[i];
      /* MPos (makine) veya WPos (iş) koordinatı */
      if (p.indexOf('MPos:') === 0 || p.indexOf('WPos:') === 0) {
        const degerler = p.split(':')[1].split(',').map(Number);
        if (degerler.length >= 2) {
          sonuc.konum = { x: degerler[0], y: degerler[1], z: degerler[2] || 0 };
        }
      }
      /* FS:feed,spindle → spindle = lazer S değeri (güç) */
      if (p.indexOf('FS:') === 0) {
        const fs = p.split(':')[1].split(',').map(Number);
        sonuc.guc = isNaN(fs[1]) ? null : fs[1];
      }
      /* Bf:planlayıcı,rx tampon doluluğu — akış kontrolü için değerli */
      if (p.indexOf('Bf:') === 0) {
        const bf = p.split(':')[1].split(',').map(Number);
        sonuc.planlayiciBayt = bf[0];
        sonuc.rxBayt = bf[1];
      }
    }
    return sonuc;
  }

  function yanitIsle(satir) {
    const s = String(satir || '').trim();
    if (!s) return;
    if (s.indexOf('ok') === 0) {
      durum.tamponBayt = 0;
      bekleyeniCoz();
      return;
    }
    if (s.indexOf('error') === 0 || s.indexOf('ALARM') === 0) {
      bildir('log', { tip: 'hata', mesaj: 'GRBL: ' + s });
      bekleyeniCoz(new Error('GRBL ' + s));
      return;
    }
    if (s.indexOf('<') === 0) {
      /* Durum raporu: <Idle|MPos:0.000,0.000,0.000|FS:0,0>
         Ayrıştır → hem ham satır hem YAPISAL durum arayüze gider.
         Arayüz buna göre Duraklat/Devam butonlarını aktifleştirir. */
      const rapor = durumRaporuAyristir(s);
      durum.makineDurumu = rapor.durum || durum.makineDurumu;
      durum.konum = rapor.konum || durum.konum;
      durum.lazerGucu = rapor.guc;
      /* GRBL kendi başına Hold'a geçtiyse (kapak/limit) duraklatma say. */
      if (rapor.durum === 'Hold' && durum.gonderiyor) durum.duraklatildi = true;
      bildir('durum', {
        makineDurumu: rapor.durum,
        ham: s,
        konum: rapor.konum,
        guc: rapor.guc,
        duraklatildi: durum.duraklatildi
      });
      return;
    }
    /* [MSG:...] / hoşgeldin satırı — arayüze taşı, akışı bozmaz */
    bildir('log', { tip: 'bilgi', mesaj: s });
  }

  /* ---------- Tek satır gönder + "ok" bekle (satır-satır handshake) ----------
     Sıradaki satır ancak bu satırın "ok"u gelince gönderilir → RX tamponu
     taşmaz, komut düşmez. GRBL "ok"u satırı PLANLAYICIYA aldığında döner
     (hareket bitince değil) → USB round-trip << satır süresi olduğu için
     planlayıcı beslenmeye devam eder, engrave akıcı kalır. */
  function satirGonder(satir) {
    return new Promise(function (cozum, red) {
      if (!durum.yazici) { red(new Error('Yazıcı yok (bağlı değil).')); return; }
      if (bekleyenYanit) { red(new Error('Önceki komutun yanıtı hâlâ bekleniyor.')); return; }
      const zamanAsimi = setTimeout(function () {
        bekleyenYanit = null;
        red(new Error('Zaman aşımı: GRBL yanıt vermedi (' + String(satir).slice(0, 40) + ')'));
      }, YANIT_ZAMAN_ASIMI);
      bekleyenYanit = {
        cozum: function () { clearTimeout(zamanAsimi); cozum(); },
        red:   function (e) { clearTimeout(zamanAsimi); red(e); }
      };
      durum.yazici.write(new TextEncoder().encode(satir + '\n')).catch(function (e) {
        clearTimeout(zamanAsimi); bekleyenYanit = null; red(e);
      });
    });
  }

  /* ---------- Kesimi başlat ---------- */
  /**
   * Üretilen G-code'u makineye satır satır gönderir.
   * @param {string} gcode
   * @param {{ ilerleme?: Function, satirBasina?: number }} [secenek]
   */
  async function kes(gcode, secenek) {
    if (!destekliMi()) return destekHatasi();
    if (!durum.bagli) {
      return { tamam: false, kod: 'BAGLI_DEGIL', hata: 'Önce lazere bağlanmalısınız.' };
    }
    if (durum.gonderiyor) {
      return { tamam: false, kod: 'MESGUL', hata: 'Kesim zaten sürüyor.' };
    }

    const satirlar = String(gcode)
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s && s[0] !== ';' && s[0] !== '('; });

    durum.gonderiyor = true;
    durum.durduruldu = false;
    durum.satirSayisi = satirlar.length;
    durum.gonderilenSatir = 0;

    bildir('log', { tip: 'bilgi', mesaj: 'Kesim başladı · ' + satirlar.length + ' satır' });

    try {
      /* GRBL açılışta ALARM/kilit modunda olabilir → önce kilidi aç. Aksi halde
         makine tüm hareket/yakma komutlarını reddeder ("bağlı ama yazmıyor" kökü).
         $X her durumda "ok" döner. Homing ZORUNLUYSA ($22=1) ilk G0 "error:9"
         verir ve akış net mesajla durur → kullanıcı önce Home ($H) yapar. */
      try { await satirGonder('$X'); } catch (e) { bildir('log', { tip: 'bilgi', mesaj: 'Kilit-aç ($X): ' + e.message }); }
      for (let i = 0; i < satirlar.length; i++) {
        /* İPTAL: kullanıcı "Durdur" dedi → feed-hold + soft-reset ile bitir. */
        if (durum.durduruldu) {
          await acilDurdur();
          durum.gonderiyor = false;
          return { tamam: false, kod: 'DURDURULDU', hata: 'Kullanıcı durdurdu.', gonderilen: i };
        }

        /* DURAKLATMA: kullanıcı "Duraklat" dedi → döngü burada BEKLER.
           Makine feed-hold'da; lazer kapalı, kafa yerinde. Devam edilince
           döngü kaldığı satırdan sürer — iş KAYBOLMAZ. */
        while (durum.duraklatildi && !durum.durduruldu) {
          await new Promise(function (r) { setTimeout(r, 120); });
        }
        if (durum.durduruldu) {
          await acilDurdur();
          durum.gonderiyor = false;
          return { tamam: false, kod: 'DURDURULDU', hata: 'Kullanıcı durdurdu.', gonderilen: i };
        }

        await satirGonder(satirlar[i]);

        if (secenek && typeof secenek.ilerleme === 'function') {
          secenek.ilerleme({ gonderilen: i + 1, toplam: satirlar.length });
        } else {
          bildir('ilerleme', { gonderilen: i + 1, toplam: satirlar.length });
        }

        /* Arayüz donmasın: her 50 satırda bir nefes payı */
        if (i % 50 === 49) await new Promise(function (r) { setTimeout(r, 0); });
      }

      durum.gonderiyor = false;
      bildir('log', { tip: 'basari', mesaj: 'Kesim tamamlandı.' });
      return { tamam: true, satir: satirlar.length };
    } catch (e) {
      durum.gonderiyor = false;
      bildir('log', { tip: 'hata', mesaj: 'Kesim hatası: ' + e.message });
      return { tamam: false, kod: 'GONDERIM_HATASI', hata: e.message };
    }
  }

  /* ---------- Kontrol komutları ---------- */
  async function komutGonder(komut) {
    if (!durum.bagli || !durum.yazici) {
      return { tamam: false, kod: 'BAGLI_DEGIL', hata: 'Bağlı değil.' };
    }
    try {
      await durum.yazici.write(new TextEncoder().encode(komut + '\n'));
      return { tamam: true };
    } catch (e) {
      return { tamam: false, kod: 'YAZMA_HATASI', hata: e.message };
    }
  }

  /* ============================================================
     GERÇEK-ZAMANLI (REALTIME) KONTROL KOMUTLARI — GRBL 1.1
     ------------------------------------------------------------
     GRBL bu tek-bayt komutları tamponu BEKLEMEDEN anında işler.
     Yanlış bayt kullanmak makineyi çökertir; doğru eşleme ŞART:

       0x21 '!'  → FEED HOLD  → hareketi ANINDA ama GÜVENLİ durdurur.
                                 Kafa yerinde kalır, lazer söner,
                                 iş İPTAL OLMAZ → devam edilebilir.
       0x7E '~'  → CYCLE START → feed-hold'dan DEVAM eder (kaldığı yerden).
       0x18      → SOFT RESET  → Grbl'i SIFIRLAR. Alarm durumuna düşer,
                                 iş TAMAMEN kaybolur. (Kurtarma için $X ya da $H gerekir.)
       0x3F '?'  → STATUS QUERY → makine durumu (Idle/Run/Hold/Alarm...)

     ÖNEMLİ: "Duraklat" = 0x21, "İptal/Durdur" = 0x18. Eskiden ikisi de
     0x18 ile yapılıyordu → duraklatmada iş komple çöp oluyordu.
     ============================================================ */
  const RT = { FEED_HOLD: 0x21, CYCLE_START: 0x7E, SOFT_RESET: 0x18, STATUS: 0x3F };

  /* Ham baytı gerçek-zamanlı yolla — bekleyenYanit'i BEKLEMEZ, akışı bölmez. */
  function rtYaz(bayt) {
    if (!durum.bagli || !durum.yazici) {
      return Promise.resolve({ tamam: false, kod: 'BAGLI_DEGIL', hata: 'Bağlı değil.' });
    }
    return durum.yazici.write(new Uint8Array([bayt]))
      .then(function () { return { tamam: true }; })
      .catch(function (e) { return { tamam: false, kod: 'YAZMA_HATASI', hata: e.message }; });
  }

  /* Duraklat: hareketi güvenle durdur — iş SÜRER (sonra resume ile devam).
     Aktif kesim döngüsü varsa döngüyü Askıya Alır (beklemede tutar). */
  function duraklat() {
    if (!durum.gonderiyor) {
      return Promise.resolve({ tamam: false, kod: 'IS_YOK', hata: 'Şu an süren bir gönderim yok.' });
    }
    durum.duraklatildi = true;
    durum.makineDurumu = 'Hold';
    /* Bekleyen satır yanıtını 'ok' olarak çöz: duraklatmada iş kaybedilmez,
       satır GRBL planlayıcısının içindedir. Döngü duraklatilmisMi'yi bekler. */
    bekleyeniCoz();
    return rtYaz(RT.FEED_HOLD).then(function (r) {
      if (r.tamam) bildir('log', { tip: 'uyari', mesaj: 'DURAKLATILDI (feed hold) — Devam ile sürdürülebilir.' });
      return r;
    });
  }

  /* Devam: feed-hold'dan kaldığı yerden sürdür. */
  function devam() {
    if (!durum.duraklatildi) {
      return Promise.resolve({ tamam: false, kod: 'DURAKLATILMIS_DEGIL', hata: 'Duraklatılmış bir iş yok.' });
    }
    return rtYaz(RT.CYCLE_START).then(function (r) {
      if (r.tamam) {
        durum.duraklatildi = false;
        durum.makineDurumu = 'Run';
        bildir('log', { tip: 'basari', mesaj: 'DEVAM (cycle start) — iş kaldığı yerden sürüyor.' });
      }
      return r;
    });
  }

  /* Acil durdur: işi İPTAL eder (feed hold + soft reset). Bu KURTARILAMAZ
     şekilde işi bitirir; ardından ALARM temizliği istenir. */
  function acilDurdur() {
    durum.durduruldu = true;
    durum.duraklatildi = false;
    /* Bekleyen satır varsa reddet → kes() döngüsü anında çözülür (kilitlenmez). */
    bekleyeniCoz(new Error('Kullanıcı durdurdu (acil).'));
    if (!durum.bagli || !durum.yazici) return Promise.resolve({ tamam: false, kod: 'BAGLI_DEGIL' });
    /* Önce feed hold (hareketi güvenle kes), ardından soft-reset */
    return rtYaz(RT.FEED_HOLD)
      .then(function () { return rtYaz(RT.SOFT_RESET); })
      .then(function () {
        durum.makineDurumu = 'Alarm';
        bildir('log', { tip: 'uyari', mesaj: 'ACİL DURDURMA (feed hold + soft reset) — iş iptal edildi. Kurtarma için "Alarm Çöz" ($X) ya da "Sıfırla" ($H).' });
        /* Soft-reset Grbl'in RAM durumunu sıfırlar → yerel durumları da temizle ama bağlantı sürer. */
        durum.tamponBayt = 0;
        return { tamam: true };
      })
      .catch(function (e) { return { tamam: false, hata: e.message }; });
  }

  /* Durum sorgusu: '?' gerçek-zamanlıdır, tampon beklemez. */
  function makineDurumuSor() { return rtYaz(RT.STATUS); }

  /* ------------------------------------------------------------
     OTOMATİK DURUM TAKİBİ (canlı makine durumu)
     GRBL'e periyodik '?' gönderip Idle/Run/Hold/Alarm bilgisini
     arayüze akıtır. Kullanıcı "durum nerede?" diye sormasın.
     Sadece BAĞLIYKEN çalışır; 300 ms aralık GRBL için güvenli
     (realtime komut, tampon tüketmez). Kesim sırasında GRBL zaten
     kendi durum raporlarını yollar — burada da hafifçe sorgularız.
     ------------------------------------------------------------ */
  let durumZamanlayici = null;

  function durumTakibiniBaslat() {
    durumTakibiniDurdur();
    durumZamanlayici = setInterval(function () {
      if (durum.bagli && durum.yazici) {
        /* Yangın-kontrol: durum sorgusu hata verse de döngü devam etsin. */
        rtYaz(RT.STATUS).catch(function () {});
      }
    }, 300);
  }

  function durumTakibiniDurdur() {
    if (durumZamanlayici) { clearInterval(durumZamanlayici); durumZamanlayici = null; }
  }

  /* ------------------------------------------------------------
     ÜÇ FARKLI "SIFIRLAMA" — kavramlar karıştırılmamalı:
       · alarmCoz($X)   → ALARM kilitini çözer. Kafa OYNAMAZ. Makine
                          komut kabul etmeye başlar. Alarmdan çıkış YOLU.
       · homeYap($H)     → Gerçek homing: eksenleri limit anahtarına
                          sürüp makine koordinatını sıfırlar. Kafa köşeye
                          GİDER (yavaş, gürültülü). $22=1 ise başlangıçta gerekir.
       · workZero(G92)   → İş sıfırı: "burası 0,0 olsun" der. Kafa gitmez,
                          Türkiye'de en çok istenen "sıfırla" budur.
     Eskiden sadece $H home yapılıyordu → "sıfırlama" yanlış anlaşılıyordu.
     ------------------------------------------------------------ */
  function alarmCoz() {
    return komutGonder('$X').then(function (r) {
      if (r.tamam) {
        durum.makineDurumu = 'Idle';
        durum.durduruldu = false;
        bildir('log', { tip: 'basari', mesaj: 'ALARM ÇÖZÜLDÜ ($X) — makine komut kabul ediyor.' });
      }
      return r;
    });
  }

  function homeYap() {
    return komutGonder('$H').then(function (r) {
      if (r.tamam) bildir('log', { tip: 'bilgi', mesaj: 'HOME ($H) gönderildi — kafa köşeye gidiyor, bitmesini bekle.' });
      return r;
    });
  }

  /* İş sıfırı: mevcut konumu 0,0 kabul et ($92 = work zero). Kafa gitmez. */
  function workZero() {
    return komutGonder('G92 X0 Y0').then(function (r) {
      if (r.tamam) bildir('log', { tip: 'basari', mesaj: 'İŞ SIFIRI ayarlandı (G92 X0 Y0) — mevcut konum artık başlangıç.' });
      return r;
    });
  }

  /* İş sıfırını KALDIR (makine koordinatına dön). */
  function workZeroKaldir() {
    return komutGonder('G92.1 X0 Y0');
  }

  /* Başlangıç noktasına git — GÜVENLİ: önce lazer kapat (M5), sonra hızlı git.
     Lazer açıkken G0 göndermek kalıcı çizik bırakır (eski koddaki tehlike). */
  function isBaslangica(secenek) {
    const x = (secenek && secenek.x) || 0;
    const y = (secenek && secenek.y) || 0;
    return komutGonder('M5')
      .then(function () { return komutGonder('G0 X' + x + ' Y' + y); })
      .then(function (r) {
        if (r.tamam) bildir('log', { tip: 'bilgi', mesaj: 'Başlangıç noktasına gidiliyor → X' + x + ' Y' + y + ' (lazer kapalı)' });
        return r;
      });
  }

  /* Geriye dönük ad: 'sifirla' artık HOME yapar; arayüz hangi işi istediğini
     açıkça söyler (alarm çöz / home / iş sıfırı). */
  function sifirla() { return homeYap(); }

  /* ---------- Bağlantıyı kapat ---------- */
  async function kapat() {
    if (!durum.bagli) return { tamam: true, zaten: true };
    durum.bagli = false;

    try {
      if (durum.okuyucu) { await durum.okuyucu.cancel().catch(function () {}); durum.okuyucu = null; }
      if (durum.yazici) { await durum.yazici.releaseLock().catch(function () {}); durum.yazici = null; }
      if (durum.port) { await durum.port.close().catch(function () {}); durum.port = null; }
    } catch (e) {
      /* kapanış hataları sessizce yutulur — kullanıcıyı meşgul etmez */
    }

    okumaSuruyor = false;
    bildir('durum', { bagli: false });
    bildir('log', { tip: 'bilgi', mesaj: 'Bağlantı kapatıldı.' });
    return { tamam: true };
  }

  /* ---------- Dinleyici kaydı ---------- */
  function dinle(tur, fonksiyon) {
    if (!dinleyiciler[tur]) dinleyiciler[tur] = [];
    dinleyiciler[tur].push(fonksiyon);
    return function () {
      const i = dinleyiciler[tur].indexOf(fonksiyon);
      if (i >= 0) dinleyiciler[tur].splice(i, 1);
    };
  }

  global.LazerAPI = {
    destekliMi: destekliMi,
    baglan: baglan,
    kes: kes,
    komutGonder: komutGonder,
    /* YENİ: doğru ayrım — Duraklat ≠ Durdur ≠ Sıfırla */
    duraklat: duraklat,
    devam: devam,
    acilDurdur: acilDurdur,
    makineDurumuSor: makineDurumuSor,
    alarmCoz: alarmCoz,
    homeYap: homeYap,
    workZero: workZero,
    workZeroKaldir: workZeroKaldir,
    sifirla: sifirla,
    isBaslangica: isBaslangica,
    kapat: kapat,
    dinle: dinle,
    durum: function () { return Object.assign({}, durum, { port: !!durum.port }); },
    VARSAYILAN_BAUD: VARSAYILAN_BAUD,

    /* ----------------------------------------------------------
       DIŞARIDAN PORT İLE BAĞLAN
       Sayfa açılışında sessiz otomatik bağlanma için kullanılır.
       Kullanıcı daha önce izin verdiyse port hazır gelir; makine
       takılıysa program kendiliğinden bağlanır — port sorulmaz.
       ---------------------------------------------------------- */
    disaridanPortlaBaglan: async function (port, secenek) {
      if (!port) return { tamam: false, kod: 'PORT_YOK', hata: 'Cihaz bulunamadı.' };
      if (durum.bagli) return { tamam: true, zaten: true };

      const baud = (secenek && secenek.baud) || VARSAYILAN_BAUD;
      try {
        durum.port = port;
        await durum.port.open({ baudRate: baud });
        durum.yazici = durum.port.writable.getWriter();
        durum.bagli = true;
        durum.durduruldu = false;
        durum.tamponBayt = 0;
        durum.gonderilenSatir = 0;

        bildir('durum', { bagli: true, baud: baud });
        bildir('log', { tip: 'bilgi', mesaj: 'Otomatik bağlandı · ' + baud + ' baud' });
        okumaDongusuBaslat();
        durumTakibiniBaslat();
        return { tamam: true, baud: baud, otomatik: true };
      } catch (e) {
        /* Zaten açık bir port ise (başka sekme) burada hata verir — sessiz geç. */
        durum.port = null;
        return { tamam: false, kod: 'BAGLANTI_HATASI', hata: e.message };
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   OTOMATİK PORT HATIRLAMA — kullanıcı port seçmek zorunda kalmasın
   Kaydedilen cihaz kimliğini (vendorId) okur ve varsa döner.
   ============================================================ */
(function (global) {
  'use strict';

  const ANAHTAR = 'numex.sonPort';
  const AKTIF = 'numex.sonPort.aktif';

  /* Bu blok ayrı bir kapsamda çalışıyor; seri port nesnesine kendi
     içinden güvenli biçimde erişmesi gerekir (tarayıcı: navigator,
     test: parametre olarak gelen global.navigator). */
  function seriPortAl() {
    /* Web Serial nesnesini BULUNAN HER ORTAMDA yakala. Sıra önemli değil;
       biri tutarsa yeter. Tarayıcıda `navigator`, Node testinde `new Function`
       parametresi, bazı gömülü tarayıcılarda ise yalnız `window.navigator`
       bulunur. Eksik yol bırakmak = "hatırlanan cihaz bulunamadı" sessiz hatası. */
    const adaylar = [
      function () { return typeof navigator !== 'undefined' ? navigator : null; },
      function () { return global && global.navigator ? global.navigator : null; },
      function () { return global && global.window && global.window.navigator ? global.window.navigator : null; },
      function () { return typeof window !== 'undefined' && window && window.navigator ? window.navigator : null; }
    ];
    for (let i = 0; i < adaylar.length; i++) {
      try {
        const n = adaylar[i]();
        if (n && n.serial) return n.serial;
      } catch (_) { /* bu yol yok, sıradakini dene */ }
    }
    return null;
  }

  /** Daha önce izin verilmiş ve şu an takılı olan cihazı döner. */
  async function hatirlananPort() {
    const SP = seriPortAl();
    if (typeof console !== 'undefined' && console.log) {
      console.log('[TESIS-HP] SP=' + (SP ? 'VAR' : 'YOK') +
        ' id=' + ((typeof localStorage !== 'undefined') ? localStorage.getItem(ANAHTAR) : 'ls-yok'));
    }
    if (!SP) return null;
    const id = (typeof localStorage !== 'undefined') ? localStorage.getItem(ANAHTAR) : null;
    if (!id) return null;

    let portlar = [];
    try { portlar = await SP.getPorts(); } catch (e) {
      if (typeof console !== 'undefined' && console.log) console.log('[TESIS-HP] getPorts HATA: ' + e.message);
      return null;
    }
    if (typeof console !== 'undefined' && console.log) {
      console.log('[TESIS-HP] portlar=' + (portlar ? portlar.length : 'null') +
        ' vendorler=' + JSON.stringify((portlar || []).map(function (p) {
          const b = p.getInfo ? p.getInfo() : {};
          return b && b.usbVendorId;
        })));
    }

    return (portlar || []).find(function (p) {
      const b = p.getInfo ? p.getInfo() : {};
      return b && String(b.usbVendorId) === String(id);
    }) || null;
  }

  /** Bağlanan cihazı hatırla. */
  function portHatirla(port) {
    try {
      const b = (port && port.getInfo) ? port.getInfo() : {};
      if (b && b.usbVendorId && typeof localStorage !== 'undefined') {
        localStorage.setItem(ANAHTAR, String(b.usbVendorId));
        localStorage.setItem(AKTIF, '1');
      }
    } catch (_) { /* hatırlama isteğe bağlı — bağlantıyı engellemez */ }
  }

  /* Elle bağlanma başarıyla bitince cihazı hatırla.
     LazerAPI 'durum' olayı yayar; port nesnesini lazer.js içinden
     alamasak da vendorId'yi durum() üzerinden okuyabiliyoruz. */
  function baglantiyiIzle() {
    if (typeof window === 'undefined' || !window.LazerAPI || !window.LazerAPI.dinle) return;
    window.LazerAPI.dinle('durum', function (d) {
      if (!d || !d.bagli) return;
      /* Sadece hatırlanan yoksa yaz — mevcut kaydı ezmesin. */
      try {
        const varOlan = (typeof localStorage !== 'undefined') ? localStorage.getItem(ANAHTAR) : null;
        if (varOlan) return;
        const p = hatirlananPortTanimi();
        if (p) portHatirla(p);
      } catch (_) { /* sessiz */ }
    });
  }

  /* Bağlı portun bilgisini okumak için en son kullanılan tanımı saklar. */
  let sonPortTanimi = null;
  function sonPortuIsaretle(port) { sonPortTanimi = port; }
  function hatirlananPortTanimi() { return sonPortTanimi; }

  /** Hatırlanan cihaz varsa sessizce bağlan (kullanıcı hiçbir şeye basmaz).
   *  Portu DOĞRUDAN kendisi açar; hata olsa bile istisna SIZMAZ,
   *  kullanıcıya hiçbir uyarı gösterilmez (sessiz geçilir). */
  async function otomatikBaglan() {
    /* `window` tarayıcıda globaldir; ancak izole kapsamda (Node testi, gömülü
       tarayıcı) IIFE argümanı `global` üzerinden gelir. İkisini de kabul et,
       yoksa "köprü yok" sanılıp otomatik bağlanma hep sessizce düşer. */
    const K = (typeof window !== 'undefined' && window)
      ? window
      : ((global && global.window) ? global.window : global);
    if (!K || !K.LazerAPI) return { tamam: false, kod: 'KOPRU_YOK' };
    if (!K.LazerAPI.destekliMi || !K.LazerAPI.destekliMi()) {
      return { tamam: false, kod: 'DESTEK_YOK' };
    }
    const p = await hatirlananPort();
    if (!p) return { tamam: false, kod: 'HATIRLANAN_YOK' };

    /* Köprü varsa asıl bağlanmayı O yapsın; ama bu adım hata fırlatırsa
       bile İSTİSNA SIZMAZ — sessizce başarısız dönülür.
       DİKKAT: `window.LazerAPI` HİÇ olmayabilir (köprü yüklenmemiş/test
       ortamı). O yüzden önce LazerAPI'nin kendisi var mı diye bakılır;
       aksi halde `undefined.disaridanPortlaBaglan` erişimi TypeError fırlatır. */
    const kopru = K.LazerAPI;
    /* Köprü VARSA bağlanmayı MUTLAKA o yapsın — portu iki kez açma riski
       (aynı porta ikinci open → "port meşgul") böyle ortadan kalkar. */
    if (kopru && typeof kopru.disaridanPortlaBaglan === 'function') {
      try {
        const r = await kopru.disaridanPortlaBaglan(p, { baud: 115200 });
        if (r && r.tamam) return { tamam: true, baud: 115200, kopru: true };
        return { tamam: false, kod: (r && r.kod) || 'BAGLANTI_HATASI' };
      } catch (_) {
        /* sessiz geç — kullanıcıya istisna sızmaz */
        return { tamam: false, kod: 'BAGLANTI_HATASI' };
      }
    }

    /* Köprü bağlanamadıysa (veya yoksa) portu DOĞRUDAN kendimiz açalım. */
    try {
      await p.open({ baudRate: 115200 });
      return { tamam: true, baud: 115200, otomatik: true };
    } catch (_) {
      /* Zaten açık port, izin reddi vb. — hepsi sessiz geçilir. */
      return { tamam: false, kod: 'BAGLANTI_HATASI' };
    }
  }

  window.NumexPort = {
    hatirlananPort: hatirlananPort,
    portHatirla: portHatirla,
    otomatikBaglan: otomatikBaglan,
    baglantiyiIzle: baglantiyiIzle,
    sonPortuIsaretle: sonPortuIsaretle
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   SAYFA AÇILIŞINDA SESSİZ BAĞLANMA
   Kullanıcı daha önce bağlandıysa, program açılışta kendi bağlanır.
   Başarısız olursa hiçbir şey yapmaz — kullanıcı yine butona basabilir.
   ============================================================ */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.NumexPort === 'undefined') return;

    /* LazerAPI dinleyicilerini bağla — bağlanan cihaz hatırlansın.
       DİKKAT: bu dinleyici bağlanma DURUMUNU değiştirmemeli; sadece
       port tanımını saklar. Sıra önemli: otomatik bağlanma denemesi
       yapılmadan önce bağlı sayılmamalı. */
    if (window.NumexPort.baglantiyiIzle) window.NumexPort.baglantiyiIzle();

    /* Gecikme (setTimeout) KALDIRILDI. Sebep: 800ms beklemek sayfa açılışını
       gereksiz yavaşlatıyordu ve otomatik bağlanma artık idempotent/ucuz
       (izinli port listesi okunur, port yoksa anında döner). Ayrıca
       zamanlayıcı sarmalayıcıları callback'in Promise'ini yutup testte
       "bağlanmadı" yanlış-pozitifi üretiyordu. Senkron başlatma hem daha
       hızlı hem daha öngörülebilir. */
    return Promise.resolve().then(function () {
      return window.NumexPort.otomatikBaglan().then(function (r) {
        if (r && r.tamam) {
          if (typeof window.uyariGoster === 'function') {
            window.uyariGoster('✓ Lazer otomatik bağlandı — hazır', 'accent');
          }
        } else if (r && r.kod === 'HATIRLANAN_YOK') {
          /* Henüz hiç bağlanılmamış — kullanıcı bir kez seçecek. Sessiz kal. */
        }
      }).catch(function () { /* sessiz geç — kullanıcı elle bağlanabilir */ });
    }, 800);
  });
}

/* Dışa açık yardımcılar (test ve arayüz için) */
if (typeof window !== 'undefined' && window.NumexPort) {
  window.NumexPort.elleBaglanmayiHatirla = function (port) {
    if (port) { sonPortuIsaretle(port); }
    baglantiyiIzle();
  };
}
