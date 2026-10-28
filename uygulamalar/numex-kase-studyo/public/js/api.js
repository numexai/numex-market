/* ============================================================
   NUMEX KAŞE STÜDYO — SUNUCU KÖPRÜSÜ (api.js)
   ------------------------------------------------------------
   Arayüz ile yerel Node sunucusu arasındaki TEK temas noktası.
   Sunucu uçları (server/server.js ile birebir sözleşmeli):

     GET  /api/saglik          → { durum, uygulama, surum, tabla }
     GET  /api/malzemeler      → { malzemeler: [...] }
     POST /api/kase-onizleme   → { plan: { sureSn, yolMm, satirlar, ... } }
     POST /api/gcode-kaydet    → 201 { tamam, dosya, bayt }
     GET  /api/gcode-liste     → { adet, dosyalar:[{ad,bayt,...}] }
     GET  /api/gcode-indir?ad= → text/plain G-code

   KURALLAR
   - Sunucu yoksa arayüz ÇÖKMEZ: her çağrı nazik bir hata nesnesi döner.
   - Ağ hatalarında otomatik 1 kez yeniden dener (geçici kopmalar için).
   - Hiçbir yerde alert() yok; hatalar dönen değerle bildirilir.
   ============================================================ */
'use strict';

(function (global) {
  /* Sunucu aynı kökenden servis edildiği için göreli yollar yeterli.
     file:// ile açılırsa localhost'a düşülür (kullanıcı sunucuyu çalıştırmışsa çalışır). */
  /* Sunucu aynı kökenden servis edildiğinde (tarayıcı, http/https) göreli
     yol yeterlidir; ancak Node/vitest gibi göreli URL'i çözemeyen
     bağlamlarda location.host'tan TAM taban üretilir. file:// ile açılırsa
     localhost'a düşülür (kullanıcı sunucuyu çalıştırmışsa çalışır). */
  const TABAN = (function () {
    const kon = global.location;
    if (!kon) return 'http://localhost:4175';
    const protokol = kon.protocol || '';
    if (/^https?:$/.test(protokol)) {
      /* host varsa (127.0.0.1:PORT) tam köken kullan — göreli fetch'in
         Node tarafında çözülememesi sorununu ortadan kaldırır. */
      if (kon.host) return protokol + '//' + kon.host;
      return '';
    }
    return 'http://localhost:4175';
  })();

  const VARSAYILAN_ZAMAN_ASIMI = 12000;

  /* ---------- Alt düzey istek yardımcısı ---------- */
  /* fetch'i ÇAĞRI ANINDA çöz: tarayıcıda/Node'da global fetch sonradan
     değiştirilebilir (test stub'ları, polyfill). Yükleme anında sabitlenmiş
     bir referans, sahte/stub fetch'i gölgeleyip yanlış sonuç üretirdi. */
  /* new Function ile yüklenen bu köprüde "globalThis" parametre olarak
     gölgelenebilir (test yardımcıları sahte bir global geçer). Gerçek global
     nesneye erişmek için dolaylı Function çağrısı kullanılır; bu, enjekte
     edilen sahte globalden BAĞIMSIZ olarak canlı fetch'i bulur. */
  function gercekGlobal() {
    try {
      /* eslint-disable-next-line no-new-func */
      return Function('return this')();
    } catch (e) {
      return typeof globalThis !== 'undefined' ? globalThis : global;
    }
  }

  function fetchBul() {
    /* Öncelik: GERÇEK global (tarayıcıda window, Node/vitest'te globalThis).
       vi.stubGlobal fetch'i burada ezer; sabitlenmiş referans yerine daima
       canlı değere bak ki test stub'ları doğru yakalansın. */
    const kok = gercekGlobal();
    if (kok && typeof kok.fetch === 'function') return kok.fetch.bind(kok);
    if (global && typeof global.fetch === 'function') return global.fetch.bind(global);
    throw new Error('fetch bulunamadı');
  }

  function istek(yol, secenek) {
    secenek = secenek || {};
    const yontem = (secenek.yontem || 'GET').toUpperCase();
    const urlAdres = TABAN + yol;

    const cfg = {
      method: yontem,
      headers: Object.assign({ 'Accept': 'application/json' }, secenek.basliklar || {})
    };
    if (secenek.govde !== undefined && secenek.govde !== null) {
      cfg.headers['Content-Type'] = 'application/json';
      cfg.body = typeof secenek.govde === 'string' ? secenek.govde : JSON.stringify(secenek.govde);
    }

    const kontrolcu = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (kontrolcu) cfg.signal = kontrolcu.signal;
    const zamanAsimi = setTimeout(function () {
      if (kontrolcu) kontrolcu.abort();
    }, secenek.zamanAsimi || VARSAYILAN_ZAMAN_ASIMI);

    return fetchBul()(urlAdres, cfg)
      .then(function (yanit) {
        clearTimeout(zamanAsimi);
        const icerikTipi = yanit.headers.get('content-type') || '';
        const okuyucu = icerikTipi.indexOf('application/json') >= 0
          ? yanit.json()
          : yanit.text();
        return okuyucu.then(function (govde) {
          return { tamam: yanit.ok, kod: yanit.status, veri: govde, basliklar: yanit.headers };
        });
      })
      .catch(function (hata) {
        clearTimeout(zamanAsimi);
        const iptal = hata && (hata.name === 'AbortError');
        throw new Error(
          iptal
            ? 'Sunucu zamanında yanıt vermedi (zaman aşımı).'
            : 'Sunucuya ulaşılamadı — "npm start" ile çalıştığından emin olun.'
        );
      });
  }

  /* ---------- Yeniden denemeli istek ---------- */
  function istekTekrar(yol, secenek, deneme) {
    deneme = deneme === undefined ? 1 : deneme;
    return istek(yol, secenek).catch(function (hata) {
      if (deneme > 0) {
        return new Promise(function (r) { setTimeout(r, 350); })
          .then(function () { return istekTekrar(yol, secenek, deneme - 1); });
      }
      throw hata;
    });
  }

  /* ---------- Genel sonuç sarmalayıcı ----------
     Arayüz hiçbir zaman "throw" görmez; hep { tamam, veri, hata } alır. */
  function guvenli(promiseFn) {
    return promiseFn()
      .then(function (r) {
        if (!r.tamam) {
          const mesaj = (r.veri && (r.veri.hata || r.veri.mesaj)) || ('Sunucu hatası (HTTP ' + r.kod + ')');
          return { tamam: false, kod: r.kod, hata: mesaj, veri: r.veri };
        }
        return { tamam: true, kod: r.kod, veri: r.veri, hata: null };
      })
      .catch(function (hata) {
        return { tamam: false, kod: 0, hata: hata.message, veri: null };
      });
  }

  /* ============================================================
     DIŞA AÇIK API
     ============================================================ */
  const KaseAPI = {
    taban: TABAN,

    /** Sunucu ayakta mı + sürüm/tabla bilgisi */
    saglik: function () {
      return guvenli(function () { return istekTekrar('/api/saglik', {}, 1); });
    },

    /** Lazer parametre presetleri */
    malzemeler: function () {
      return guvenli(function () { return istekTekrar('/api/malzemeler', {}, 1); });
    },

    /**
     * İşleme önizlemesi (süre, toplam yol, satır kırılımı).
     * @param {object} govde { metin, font, boy, guc, hiz, gecis, x, y }
     */
    onizleme: function (govde) {
      return guvenli(function () {
        return istek('/api/kase-onizleme', { yontem: 'POST', govde: govde });
      });
    },

    /** Üretilen G-code'u cikti/ klasörüne yazar. */
    gcodeKaydet: function (govde) {
      return guvenli(function () {
        return istek('/api/gcode-kaydet', { yontem: 'POST', govde: govde });
      });
    },

    /** Kaydedilmiş G-code dosyalarını listeler. */
    gcodeListe: function () {
      return guvenli(function () { return istek('/api/gcode-liste', {}, 1); });
    },

    /** Kaydedilmiş bir dosyayı metin olarak indirir. */
    gcodeIndir: function (ad) {
      return guvenli(function () {
        return istek('/api/gcode-indir?ad=' + encodeURIComponent(ad));
      });
    },

    /**
     * Tarayıcıdan dosya indirmeyi tetikler (kaydedilmiş .nc dosyası).
     * Sunucudan metni çekip Blob ile indirir — böylece indirme
     * davranışı da sunucu sözleşmesine bağlı kalır.
     */
    gcodeIndirTetikle: function (ad) {
      return KaseAPI.gcodeIndir(ad).then(function (sonuc) {
        if (!sonuc.tamam) return sonuc;
        try {
          const blob = new Blob([sonuc.veri], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = ad;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        } catch (e) {
          return { tamam: false, kod: 0, hata: 'İndirme başlatılamadı: ' + e.message, veri: null };
        }
        return sonuc;
      });
    },

    /** Ham istek (test/ileri düzey kullanım için) */
    hamIstek: istek
  };

  global.KaseAPI = KaseAPI;
})(typeof window !== 'undefined' ? window : globalThis);

/* Node tarafında (vitest) require edilebilirlik — tarayıcıda etkisiz. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = typeof window !== 'undefined' ? window.KaseAPI : globalThis.KaseAPI;
}
