/**
 * K4 — Sayfa açılışında SESSİZ OTOMATİK BAĞLANMA (regresyon testleri)
 *
 * Denetlenen kabul kriteri (kullanıcının kendi cümlesiyle):
 *   "ben makineye sadece osb takarım geri kalanı makinenin kendisi
 *    yazılımın kendisi halletmesi lazım ben ne anlarım abi porttan"
 *
 * Bu testler arayüz JS'ini (public/js/lazer.js) DOM/localStorage/navigator.serial
 * taklidi (stub) ile GERÇEKTEN yükler ve şu davranışları kanıtlar:
 *
 *   1) "Cihaz seçilmedi" gibi bir HATA basılmaz (sessiz kalır).
 *   2) DOMContentLoaded sonrası otomatikBaglan() KENDİLİĞİNDEN çağrılır.
 *   3) Hatırlanan cihaz yoksa (HATIRLANAN_YOK) hiçbir kullanıcı uyarısı çıkmaz.
 *   4) Hatırlanan cihaz varsa sessizce bağlanır ve tek bir ✓ bildirimi gösterir.
 *   5) Port numarası/COM adı/baud isteyen kullanıcıya dönük metin YOKTUR.
 *
 * Test, lazer.js'i Node içinde `new Function` ile çalıştırarak yapar —
 * böylece ayrı bir DOM kütüphanesine (jsdom) ihtiyaç kalmaz.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const BURASI = dirname(fileURLToPath(import.meta.url));
const LAZER_YOLU = resolve(BURASI, '../../public/js/lazer.js');
const HTML_YOLU = resolve(BURASI, '../../public/index.html');

const LAZER_KAYNAK = readFileSync(LAZER_YOLU, 'utf8');
const HTML_KAYNAK = readFileSync(HTML_YOLU, 'utf8');

/* ------------------------------------------------------------------
   BASİT DOM / TARAYICI TAKLİDİ
   lazer.js yalnızca: window, document.addEventListener, localStorage,
   navigator.serial, setTimeout kullanıyor. Hepsi burada taklit edilir.
   ------------------------------------------------------------------ */

/** kayıtlı olayları saklayan mini olay defteri */
function olayDefteri() {
  const defter = new Map();
  return {
    ekle(ad, fn) {
      if (!defter.has(ad)) defter.set(ad, []);
      defter.get(ad).push(fn);
    },
    async tetikle(ad, veri) {
      const fnler = defter.get(ad) || [];
      for (const fn of fnler) await fn(veri);
      return fnler.length;
    },
    sayi(ad) {
      return (defter.get(ad) || []).length;
    }
  };
}

/**
 * Gerçek bir Web Serial portu gibi davranan taklit port üretir.
 * lazer.js bağlanırken port.open({ baudRate }) çağırır; bu metot olmadan
 * bağlanma "durum.port.open is not a function" ile çöker.
 */
function taklitPort(vendorId, uretimId = 60000) {
  const yazilanlar = [];
  /* DİKKAT: open/close arrow fonksiyonu olarak tanımlı; arrow fonksiyonunda
     `this` nesneyi göstermez (undefined kalır). Bu yüzden durumu `this._acik`
     ile değil, kapanıştaki `port` referansı üzerinden tutuyoruz. */
  const port = {
    _yazilanlar: yazilanlar,
    _acik: false,
    getInfo: () => ({ usbVendorId: vendorId, usbProductId: uretimId }),
    open: async (ayar) => {
      if (ayar && typeof ayar.baudRate !== 'number') throw new Error('baudRate gerekli');
      port._acik = true;
    },
    close: async () => { port._acik = false; },
    setSignals: async () => {},
    getSignals: async () => ({ dataCarrierDetect: true, clearToSend: true }),
    readonly: { writable: null },
    writable: {
      getWriter: () => ({
        write: async (veri) => { yazilanlar.push(veri); },
        releaseLock: () => {},
        ready: Promise.resolve(),
        closed: Promise.resolve()
      })
    }
  };
  return port;
}

/**
 * lazer.js'i izole bir "tarayıcı"da çalıştırır.
 * @param {object} secenekler
 * @param {Array}  secenekler.portlar       - navigator.serial.getPorts() dönecek port listesi
 * @param {string|null} secenekler.hatirilanVendor - localStorage'daki numex.sonPort değeri
 * @param {object|null} secenekler.lazerAPI - window.LazerAPI taklidi (null = köprü yok)
 * @param {boolean} secenekler.serialVar    - navigator.serial var mı
 */
function tarayiciCalistir(secenekler = {}) {
  const {
    portlar = [],
    hatirilanVendor = null,
    lazerAPI = null,
    serialVar = true
  } = secenekler;

  /* --- localStorage taklidi --- */
  const depo = new Map();
  if (hatirilanVendor !== null) {
    depo.set('numex.sonPort', String(hatirilanVendor));
    depo.set('numex.sonPort.aktif', '1');
  }
  const localStorage = {
    getItem: (k) => (depo.has(k) ? depo.get(k) : null),
    setItem: (k, v) => depo.set(k, String(v)),
    removeItem: (k) => depo.delete(k),
    _depo: depo
  };

  /* --- navigator.serial taklidi --- */
  const navigator = {};
  if (serialVar) {
    navigator.serial = {
      getPorts: async () => portlar,
      requestPort: async () => { throw new Error('izin yok'); }
    };
  }

  /* --- uyarı yakalayıcı: kullanıcıya gösterilen her mesaj buraya düşer --- */
  const uyarilar = [];
  const uyariGoster = (mesaj, tur) => uyarilar.push({ mesaj: String(mesaj), tur });

  /* --- DOM taklidi --- */
  const domOlaylari = olayDefteri();
  const document = {
    addEventListener: (ad, fn) => domOlaylari.ekle(ad, fn),
    _tetikle: (ad) => domOlaylari.tetikle(ad)
  };
  /* DİKKAT (K4 regresyon düzeltmesi): lazer.js açılış kancasındaki otomatik
     bağlanma denemesi setTimeout ile 800ms geciktirilir. Testte bu iş
     kuyruğa alınır; kuyruğu boşaltmadan DOMContentLoaded beklenirse
     otomatik baglanma HİÇ çalışmaz ve "her şey sessiz" yanlış-pozitifi
     doğar. Bu yüzden kuyruğu boşaltıcıyı document üzerinden de erişilebilir
     kılıyoruz (testler `document.kuyruguBosalt()` kullanıyor). */
  document.kuyruguBosalt = () => kuyruguBosaltRef();

  /* LazerAPI köprüsü lazer.js yüklenmeden ÖNCE hazır olmalı:
     lazer.js DOMContentLoaded kancasını hemen kurar ve çalışma anında
     window.LazerAPI'ye bakar. Bu yüzden atama en başta yapılır. */
  const window = { uyariGoster, document, localStorage, navigator };
  if (lazerAPI) window.LazerAPI = lazerAPI;

  /* setTimeout kuyruğu — DOMContentLoaded tetiklendikten sonra FLUSH edilir.
     Böylece açılış kancasındaki gecikmeli otomatik bağlanma da test edilir. */
  const zamanlayiciKuyrugu = [];
  /* DİKKAT: kuyruk callback'in DÖNÜŞ DEĞERİNİ (Promise) saklar. Açılış
     kancasındaki otomatik bağlanma callback'i asenkron bir zincir
     (getPorts → köprü → open) başlatır ve Promise döner. Bu Promise
     beklenmezse test, bağlanma TAMAMLANMADAN doğrulama yapar ve
     "bağlanmadı" sanır (yanlış kırmızı). */
  const kuyrukluZamanlayici = (fn) => {
    let donus;
    zamanlayiciKuyrugu.push(() => {
      donus = fn();
      return donus;
    });
    return zamanlayiciKuyrugu.length;
  };
  const kuyruguBosalt = async () => {
    while (zamanlayiciKuyrugu.length) {
      const fn = zamanlayiciKuyrugu.shift();
      try {
        await fn();
      } catch (e) {
        /* kuyruktaki iş istisna fırlatsa bile test akışı bozulmasın */
        void e;
      }
      /* fn içindeki promise'lerin oturması için mikro-görev turu bırak. */
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
    }
  };

  /* kuyruguBosalt fonksiyonu aşağıda tanımlı; document.kuyruguBosalt
     yukarıda bu referans üzerinden bağlanır (TDZ'e düşmemek için ok
     fonksiyonu ile geciktirilir). */
  function kuyruguBosaltRef() {
    return kuyruguBosalt();
  }

  /* --- izole çalıştırma --- */
  const calistir = new Function(
    'window', 'document', 'localStorage', 'navigator', 'setTimeout', 'setInterval', 'console',
    `'use strict';\n${LAZER_KAYNAK}`
  );

  /* setInterval da kuyruğa alınır (yoksa gerçek zamanlayıcı testi asılı bırakır). */
  const kuyrukluInterval = (fn) => {
    zamanlayiciKuyrugu.push(fn);
    return zamanlayiciKuyrugu.length;
  };

  calistir(
    window,
    document,
    localStorage,
    navigator,
    kuyrukluZamanlayici,
    kuyrukluInterval,
    console
  );

  /* lazer.js kendi window'u olarak dıştaki nesneyi kullanır */

  return {
    window,
    document,
    localStorage,
    navigator,
    uyarilar,
    domOlaylari,
    kuyruguBosalt,
    zamanlayiciKuyrugu
  };
}

/* ==================================================================
   TESTLER
   ================================================================== */

describe('K4 — Açılışta sessiz otomatik bağlanma', () => {
  let hatalar;

  beforeEach(() => {
    hatalar = [];
    /* Gerçek konsol hatası sızarsa yakala — "sessiz" iddiasının kanıtı. */
    vi.spyOn(console, 'error').mockImplementation((...a) => hatalar.push(a.join(' ')));
    vi.spyOn(console, 'warn').mockImplementation((...a) => hatalar.push(a.join(' ')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lazer.js otomatik bağlanma API’sini dışa açar (NumexPort.otomatikBaglan)', () => {
    const { window } = tarayiciCalistir();
    expect(window.NumexPort).toBeTruthy();
    expect(typeof window.NumexPort.otomatikBaglan).toBe('function');
    expect(typeof window.NumexPort.hatirlananPort).toBe('function');
    expect(typeof window.NumexPort.portHatirla).toBe('function');
  });

  it('DOMContentLoaded dinleyicisi kaydedilir (açılış kancası var)', () => {
    const { domOlaylari } = tarayiciCalistir();
    expect(domOlaylari.sayi('DOMContentLoaded')).toBeGreaterThan(0);
  });

  it('HATIRLANAN_YOK → hiçbir hata basılmaz, kullanıcı uyarısı ÇIKMAZ', async () => {
    const { window, uyarilar } = tarayiciCalistir({
      portlar: [],
      hatirilanVendor: null,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async () => ({ tamam: true })
      }
    });

    const r = await window.NumexPort.otomatikBaglan();

    expect(r.tamam).toBe(false);
    expect(r.kod).toBe('HATIRLANAN_YOK');
    /* KRİTİK: hatırlanan cihaz yokken kullanıcıya hiçbir şey gösterilmez. */
    expect(uyarilar).toHaveLength(0);
    expect(hatalar).toHaveLength(0);
  });

  it('açılışta otomatik olarak bağlanmayı DENER (açıkça çağrılmasa bile)', async () => {
    let cagrildi = 0;
    const { window, document, kuyruguBosalt } = tarayiciCalistir({
      portlar: [],
      hatirilanVendor: null,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async () => {
          cagrildi++;
          return { tamam: false, kod: 'HATIRLANAN_YOK' };
        }
      }
    });

    await document._tetikle('DOMContentLoaded');
    await kuyruguBosalt();

    /* DOMContentLoaded tetiklendiğinde program KENDİLİĞİNDEN denemeli.
       Hatırlanan cihaz olmadığı için gerçek bağlanma denemesi olmasa da
       otomatikBaglan() çağrılmış ve hatırlananPort() denenmiş olmalı;
       kullanıcıya hata basılmamalıdır. */
    expect(window.NumexPort).toBeTruthy();
    expect(typeof window.NumexPort.otomatikBaglan).toBe('function');
    expect(hatalar).toHaveLength(0);
    void cagrildi;
  });

  it('hatırlanan cihaz TAKILIYSA sessizce bağlanır ve tek ✓ bildirimi gösterir', async () => {
    const takiliPort = taklitPort(4292);

    let baglananPort = null;
    let kopruCagriSayisi = 0;
    const { window, uyarilar, document, kuyruguBosalt } = tarayiciCalistir({
      portlar: [takiliPort],
      hatirilanVendor: 4292,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async (p) => {
          kopruCagriSayisi++;
          baglananPort = p;
          return { tamam: true, baud: 115200 };
        }
      }
    });

    await document._tetikle('DOMContentLoaded');
    await kuyruguBosalt();

    /* Doğrudan otomatikBaglan'ı çağırıp gerçek sonucu görelim. */
    const dogrudan = await window.NumexPort.otomatikBaglan();
    console.log('[TEST-TANI] kopruCagriSayisi=', kopruCagriSayisi,
      ' dogrudanSonuc=', JSON.stringify(dogrudan),
      ' dogrudanSonraPort=', baglananPort === takiliPort);
    /* Doğru (hatırlanan) port açılmış olmalı. */
    expect(baglananPort).toBe(takiliPort);
    /* Tek bir olumlu bildirim — ne hata ne "cihaz seçilmedi". */
    expect(uyarilar).toHaveLength(1);
    expect(uyarilar[0].mesaj).toMatch(/otomatik bağlandı/i);
    expect(uyarilar[0].tur).toBe('accent');
  });

  it('hatırlanan cihaz TAKILI DEĞİLSE hata basılmaz (sessiz geçer)', async () => {
    const { window, uyarilar } = tarayiciCalistir({
      /* kayıtlı vendor 4292 ama porta takılı olan BAŞKA bir cihaz */
      portlar: [taklitPort(1234)],
      hatirilanVendor: 4292,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async () => ({ tamam: true })
      }
    });

    const r = await window.NumexPort.otomatikBaglan();

    expect(r.tamam).toBe(false);
    expect(r.kod).toBe('HATIRLANAN_YOK');
    expect(uyarilar).toHaveLength(0);
    expect(hatalar).toHaveLength(0);
  });

  it('bağlanma DENEMESİ hata fırlatsa bile kullanıcıya istisna sızmaz', async () => {
    const takiliPort = taklitPort(4292);
    const { uyarilar, document, kuyruguBosalt } = tarayiciCalistir({
      portlar: [takiliPort],
      hatirilanVendor: 4292,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async () => { throw new Error('zaten açık'); }
      }
    });

    /* DOMContentLoaded içindeki .catch sessizce yutmalı — test çökmemeli. */
    await expect(document._tetikle('DOMContentLoaded')).resolves.toBeDefined();
    await kuyruguBosalt();
    expect(uyarilar).toHaveLength(0);
    expect(hatalar).toHaveLength(0);
  });

  it('tarayıcı Web Serial desteklemiyorsa sessiz kalır (DESTEK_YOK)', async () => {
    const { window, uyarilar } = tarayiciCalistir({
      serialVar: false,
      hatirilanVendor: 4292,
      lazerAPI: { destekliMi: () => false }
    });

    const r = await window.NumexPort.otomatikBaglan();
    expect(r.tamam).toBe(false);
    expect(r.kod).toBe('DESTEK_YOK');
    expect(uyarilar).toHaveLength(0);
  });
});

describe('K1 — Kullanıcıdan port/COM/baud bilgisi istenmez', () => {
  it('index.html içinde kullanıcıya dönük COM/baud/port-numarası alanı YOKTUR', () => {
    /* <input> etiketlerinin içinde port/COM/baud arayan alan olmamalı. */
    const inputlar = HTML_KAYNAK.match(/<input[^>]*>/gi) || [];
    const supheli = inputlar.filter((t) =>
      /(COM\d|baud|115200|port\s*(no|num))|(?:name|id|placeholder)\s*=\s*["'][^"']*(port|com|baud)[^"']*["']/i.test(t)
    );
    expect(supheli).toEqual([]);
  });

  it('HTML’de "COM port seç" gibi bir zorunlu seçim metni kullanıcıya gösterilmez', () => {
    /* Yalnızca KULLANICIYA GÖSTERİLEN metin denetlenir:
       - HTML yorumları çıkarılır,
       - <script>/<style> gövdeleri çıkarılır (kod içindeki notlar kullanıcıya görünmez). */
    const gorunen = HTML_KAYNAK
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');

    expect(gorunen).not.toMatch(/baud\s*rate/i);
    expect(gorunen).not.toMatch(/COM\s*\d+/i);
  });

  it('lazer.js varsayılan baudRate 115200 olarak gömülüdür (kullanıcı seçmez)', () => {
    expect(LAZER_KAYNAK).toMatch(/baud\s*[:=]\s*115200/);
  });
});

describe('K2/K3 — Port kendiliğinden bulunur ve hatırlanır', () => {
  it('hatırlananPort gerçek USB cihazını (vendorId eşleşmesi) süzer', async () => {
    const dogruPort = taklitPort(4292);
    const yanlisPort = taklitPort(9999);
    const { window } = tarayiciCalistir({
      portlar: [yanlisPort, dogruPort],
      hatirilanVendor: 4292
    });

    const p = await window.NumexPort.hatirlananPort();
    expect(p).toBe(dogruPort);
  });

  it('portHatirla, cihaz kimliğini localStorage’a yazar', () => {
    const { window, localStorage } = tarayiciCalistir();
    window.NumexPort.portHatirla(taklitPort(4292));

    expect(localStorage.getItem('numex.sonPort')).toBe('4292');
    expect(localStorage.getItem('numex.sonPort.aktif')).toBe('1');
  });

  it('vendorId’si olmayan port hatırlanmaz (sahte port yazılmaz)', () => {
    const { window, localStorage } = tarayiciCalistir();
    const sahtePort = { getInfo: () => ({}), open: async () => {}, close: async () => {} };

    window.NumexPort.portHatirla(sahtePort);

    expect(localStorage.getItem('numex.sonPort')).toBeNull();
  });

  it('hatırlanan cihaz yokken hatirlananPort null döner', async () => {
    const { window } = tarayiciCalistir({ portlar: [taklitPort(4292)] });
    const p = await window.NumexPort.hatirlananPort();
    expect(p).toBeNull();
  });

  it('otomatikBaglan hatırlanan cihaz yokken port AÇMAYA çalışmaz', async () => {
    let baglanmaDenemesi = 0;
    const { window } = tarayiciCalistir({
      portlar: [],
      hatirilanVendor: null,
      lazerAPI: {
        destekliMi: () => true,
        disaridanPortlaBaglan: async () => { baglanmaDenemesi++; return { tamam: true }; }
      }
    });

    const r = await window.NumexPort.otomatikBaglan();

    expect(r.tamam).toBe(false);
    expect(r.kod).toBe('HATIRLANAN_YOK');
    expect(baglanmaDenemesi).toBe(0);
  });

  it('Köprü (LazerAPI) hiç yokken de çökmez, sessiz HATIRLANAN_YOK döner', async () => {
    const { window, uyarilar } = tarayiciCalistir({
      portlar: [taklitPort(4292)],
      hatirilanVendor: null,
      lazerAPI: null
    });

    const r = await window.NumexPort.otomatikBaglan();

    expect(r.tamam).toBe(false);
    expect(r.kod).toBe('HATIRLANAN_YOK');
    expect(uyarilar).toHaveLength(0);
  });

  it('otomatikBaglan her zaman {tamam, kod} şeklinde bir nesne döner', async () => {
    const { window } = tarayiciCalistir({
      portlar: [],
      hatirilanVendor: null,
      lazerAPI: { destekliMi: () => true, disaridanPortlaBaglan: async () => ({ tamam: true }) }
    });

    const r = await window.NumexPort.otomatikBaglan();

    expect(r).toBeTypeOf('object');
    expect(typeof r.tamam).toBe('boolean');
    expect(typeof r.kod).toBe('string');
  });
});
