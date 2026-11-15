/* Numex Core — Veri Üretim Motoru
   Senaryo: DB bağlantı havuzu sızıntısı → API gecikmesi → ödeme hataları → sipariş kuyruğu büyümesi → servis restart.
   Üretilen kayıtlar analiz motoruna verilir; gerçek neden AYRI anahtarda tutulur (analiz bitmeden gösterilmez). */
(function (global) {
  'use strict';

  // Deterministik PRNG (mulberry32) — aynı seed aynı veriyi üretir
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SERVISLER = [
    { ad: 'db-pool', seviye: 'alta' },
    { ad: 'api-gateway', seviye: 'orta' },
    { ad: 'payment-service', seviye: 'yan' },
    { ad: 'order-queue', seviye: 'yan' },
    { ad: 'auth-service', seviye: 'yan' },
    { ad: 'inventory-service', seviye: 'yan' },
    { ad: 'notification-worker', seviye: 'ilgisiz' },
    { ad: 'search-indexer', seviye: 'ilgisiz' },
    { ad: 'cdn-edge', seviye: 'ilgisiz' },
    { ad: 'reporting-cron', seviye: 'ilgisiz' }
  ];
  const ADLAR = SERVISLER.map(s => s.ad);

  const HATALAR = {
    'db-pool': [
      { kod: 'DB_CONN_LEAK', msg: 'Bağlantı havuzu tükendi: boşta kalan bağlantı yok (active=200/200)', ani: true },
      { kod: 'DB_POOL_TIMEOUT', msg: 'Bağlantı havuzundan bağlantı alınamadı: 3000ms zaman aşımı', ani: true },
      { kod: 'DB_ACQUIRE_SLOW', msg: 'Bağlantı edinme süresi eşiği aştı: 1840ms', uyari: true },
      { kod: 'DB_QUERY_OK', msg: 'Sorgu tamamlandı', ok: true }
    ],
    'api-gateway': [
      { kod: 'API_LATENCY_HIGH', msg: 'Yanıt süresi SLA sınırını aştı: 4.2s > 1.0s', uyari: true, ani: true },
      { kod: 'API_UPSTREAM_TIMEOUT', msg: 'Üst servis zaman aşımı: db-pool 5000ms', ani: true },
      { kod: 'API_5XX', msg: 'İstek 502 ile sonuçlandı', ani: true },
      { kod: 'API_OK', msg: 'İstek 200 ile tamamlandı', ok: true }
    ],
    'payment-service': [
      { kod: 'PAYMENT_DECLINED', msg: 'Ödeme başarısız: sağlayıcı yanıt vermedi (upstream timeout)', ani: true },
      { kod: 'PAYMENT_RETRY_EXHAUSTED', msg: 'Ödeme yeniden denemeleri tükendi (3/3)', ani: true },
      { kod: 'PAYMENT_TIMEOUT', msg: 'Ödeme oturumu zaman aşımına uğradı', ani: true },
      { kod: 'PAYMENT_OK', msg: 'Ödeme onaylandı', ok: true }
    ],
    'order-queue': [
      { kod: 'QUEUE_BACKLOG', msg: 'Kuyruk derinliği arttı: bekleyen mesaj 12.400', uyari: true, ani: true },
      { kod: 'QUEUE_CONSUMER_LAG', msg: 'Tüketici gecikmesi 90s', uyari: true, ani: true },
      { kod: 'QUEUE_MSG_CONSUMED', msg: 'Mesaj işlendi', ok: true }
    ],
    'auth-service': [
      { kod: 'AUTH_SLOW', msg: 'Token doğrulama 900ms', uyari: true, ani: true },
      { kod: 'AUTH_OK', msg: 'Oturum doğrulandı', ok: true }
    ],
    'inventory-service': [
      { kod: 'INV_RESERVE_TIMEOUT', msg: 'Stok rezervasyonu zaman aşımı', ani: true },
      { kod: 'INV_OK', msg: 'Stok rezerve edildi', ok: true }
    ],
    'notification-worker': [
      { kod: 'MAIL_SMTP_4XX', msg: 'SMTP 421 geçici hata, yeniden denenecek', uyari: true, ilgisiz: true },
      { kod: 'PUSH_TOKEN_INVALID', msg: 'Geçersiz cihaz tokenı', ilgisiz: true },
      { kod: 'NOTIFY_OK', msg: 'Bildirim gönderildi', ok: true }
    ],
    'search-indexer': [
      { kod: 'SEARCH_INDEX_STALE', msg: 'Arama indeksi 4 saat geride', ilgisiz: true },
      { kod: 'SEARCH_INDEX_OK', msg: 'İndeks dilimi yazıldı', ok: true }
    ],
    'cdn-edge': [
      { kod: 'EDGE_CACHE_MISS_BURST', msg: 'Önbellek ıskalama artışı', uyari: true, ilgisiz: true },
      { kod: 'EDGE_OK', msg: 'İçerik servis edildi', ok: true }
    ],
    'reporting-cron': [
      { kod: 'CRON_OVERLAP', msg: 'Önceki çalışma bitmeden yeni iş başladı', uyari: true, ilgisiz: true },
      { kod: 'CRON_OK', msg: 'Rapor işi tamamlandı', ok: true }
    ]
  };

  // Restart olayı (servis yeniden başladı)
  const RESTART = { kod: 'SERVICE_RESTARTED', msg: 'Servis yeniden başlatıldı (health check başarısız)', ani: true };

  const ID_ALFABE = 'abcdef0123456789';

  function uret(opts) {
    opts = opts || {};
    const adet = opts.adet || 5200;
    const seed = opts.seed || 42;
    const r = rng(seed);
    const sec = (x) => x[Math.floor(r() * x.length)];
    const id = () => { let s = ''; for (let i = 0; i < 12; i++) s += ID_ALFABE[Math.floor(r() * 16)]; return 'req_' + s; };

    // Zaman penceresi: 12:00:00 → 12:40:00. Kök arıza 12:10'da başlar.
    const T0 = Date.UTC(2026, 10, 14, 9, 0, 0); // 09:00 UTC = 12:00 TR
    const TOPLAM_SN = 40 * 60;
    const ARIZA_SN = 10 * 60;  // 09:10 UTC
    const CevapAnahtari = {
      senaryo: 'Veritabanı bağlantı havuzunda bağlantı sızıntısı',
      kokServis: 'db-pool',
      kokHataKodu: 'DB_CONN_LEAK',
      arizaBaslangic: new Date(T0 + ARIZA_SN * 1000).toISOString(),
      nedenselZincir: [
        'db-pool (bağlantı sızıntısı)',
        'api-gateway (gecikme / 502)',
        'payment-service (ödeme hatası) + order-queue (kuyruk büyümesi)',
        'inventory-service (rezervasyon zaman aşımı) + auth-service (yavaşlama)'
      ],
      ilgisizler: ['MAIL_SMTP_4XX', 'PUSH_TOKEN_INVALID', 'SEARCH_INDEX_STALE', 'EDGE_CACHE_MISS_BURST', 'CRON_OVERLAP'],
      kayitSayisi: adet
    };

    const kayitlar = [];
    let n = 0;

    function ekle(servis, ts, hata, extra) {
      n++;
      const kayit = {
        id: 'EVT-' + String(n).padStart(5, '0'),
        ts: new Date(ts).toISOString(),
        servis: servis,
        seviye: hata.ok ? 'INFO' : (hata.uyari ? 'WARN' : 'ERROR'),
        kod: hata.kod,
        mesaj: hata.msg,
        istekId: extra && extra.istekId ? extra.istekId : null,
        sureMs: extra && extra.sureMs != null ? extra.sureMs : null,
        dugum: 'node-' + (1 + Math.floor(r() * 8))
      };
      kayitlar.push(kayit);
      return kayit;
    }

    function saat(sn) { return T0 + Math.round(sn) * 1000; }
    function ani(servisListesi) { return servisListesi.indexOf(sec(servisListesi)) >= 0; }

    // --- 1) YOĞUN OLARAK NORMAL / İLGİSİZ AKIŞ (gürültü) ---
    const normalServis = ['auth-service', 'inventory-service', 'notification-worker', 'search-indexer', 'cdn-edge', 'reporting-cron', 'api-gateway', 'db-pool', 'payment-service', 'order-queue'];
    while (kayitlar.length < adet) {
      const sn = r() * TOPLAM_SN;
      const s = sec(normalServis);
      const okList = HATALAR[s].filter(h => h.ok);
      // %12 olasılıkla normal akış içinde ilgisiz hata
      if (r() < 0.12) {
        const ilg = HATALAR[s].filter(h => h.ilgisiz);
        if (ilg.length) { ekle(s, saat(sn), sec(ilg), { istekId: id() }); }
        else { ekle(s, saat(sn), sec(okList.length ? okList : HATALAR[s]), { istekId: id(), sureMs: 20 + Math.round(r() * 180) }); }
      } else {
        ekle(s, saat(sn), sec(okList.length ? okList : HATALAR[s]), { istekId: id(), sureMs: 15 + Math.round(r() * 220) });
      }
    }

    // --- 2) NEDENSELLİK ZİNCİRİ (arıza penceresi 09:10 → 09:25) ---
    // Bir istek akışı: api-gateway -> db-pool -> api-gateway(payment) -> payment-service -> order-queue
    const zincir = [];
    // 2a) db-pool sızıntısı: ilk anomali (09:10:04 civarı)
    const ilkZaman = ARIZA_SN + 3 + r() * 2;
    const ilkIstek = id();
    zincir.push(ekle('db-pool', saat(ilkZaman), { kod: 'DB_CONN_LEAK', msg: 'Bağlantı havuzu tükendi: boşta kalan bağlantı yok (active=200/200)', ani: true }, { istekId: ilkIstek, sureMs: 3000 }));
    zincir.push(ekle('db-pool', saat(ilkZaman + 0.6), { kod: 'DB_POOL_TIMEOUT', msg: 'Bağlantı havuzundan bağlantı alınamadı: 3000ms zaman aşımı', ani: true }, { istekId: ilkIstek, sureMs: 3000 }));
    zincir.push(ekle('api-gateway', saat(ilkZaman + 1.4), { kod: 'API_LATENCY_HIGH', msg: 'Yanıt süresi SLA sınırını aştı: 4.2s > 1.0s', uyari: true, ani: true }, { istekId: ilkIstek, sureMs: 4200 }));
    zincir.push(ekle('api-gateway', saat(ilkZaman + 1.8), { kod: 'API_UPSTREAM_TIMEOUT', msg: 'Üst servis zaman aşımı: db-pool 5000ms', ani: true }, { istekId: ilkIstek, sureMs: 5000 }));
    zincir.push(ekle('payment-service', saat(ilkZaman + 4.5), { kod: 'PAYMENT_DECLINED', msg: 'Ödeme başarısız: sağlayıcı yanıt vermedi (upstream timeout)', ani: true }, { istekId: ilkIstek, sureMs: 5100 }));
    zincir.push(ekle('order-queue', saat(ilkZaman + 6.2), { kod: 'QUEUE_BACKLOG', msg: 'Kuyruk derinliği arttı: bekleyen mesaj 12.400', uyari: true, ani: true }, { istekId: ilkIstek }));

    // 2b) Zincirin yayılması: her 2-4 saniyede yeni bağımlı kayıtlar
    for (let sn = ilkZaman + 8; sn < ARIZA_SN + 15 * 60; sn += 2 + r() * 3) {
      const istekId = id();
      const mod = r();
      // db-pool: sızıntı devam ediyor, EN ÇOK görünen hata buradan geliyor (sayı tuzağı)
      const dbHata = r() < 0.55 ? HATALAR['db-pool'][0] : HATALAR['db-pool'][1];
      ekle('db-pool', saat(sn), dbHata, { istekId: istekId, sureMs: 3000 });
      if (mod < 0.7) ekle('api-gateway', saat(sn + 0.4), r() < 0.5 ? HATALAR['api-gateway'][0] : HATALAR['api-gateway'][1], { istekId: istekId, sureMs: 4000 + Math.round(r() * 3000) });
      if (mod < 0.5) ekle('payment-service', saat(sn + 1.1), HATALAR['payment-service'][Math.floor(r() * 3)], { istekId: istekId, sureMs: 5000 });
      if (mod < 0.55) ekle('order-queue', saat(sn + 1.6), HATALAR['order-queue'][r() < 0.5 ? 0 : 1], { istekId: istekId });
      if (mod < 0.25) ekle('auth-service', saat(sn + 0.8), HATALAR['auth-service'][0], { istekId: istekId, sureMs: 900 });
      if (mod < 0.2) ekle('inventory-service', saat(sn + 1.3), HATALAR['inventory-service'][0], { istekId: istekId });
    }

    // 2c) Restart olayları (arıza ilerleyince)
    let restSn = ARIZA_SN + 9 * 60;
    ['api-gateway', 'payment-service', 'order-queue', 'api-gateway'].forEach((s) => {
      ekle(s, saat(restSn), { kod: 'SERVICE_RESTARTED', msg: 'Servis yeniden başlatıldı (health check başarısız)', ani: true }, { istekId: null });
      restSn += 120 + r() * 90;
    });

    // 2d) İLGİSİZ hata yoğunluğu: paralel olarak gürültü (kök nedeni gölgelemek için)
    for (let i = 0; i < Math.round(adet * 0.06); i++) {
      const s = sec(['notification-worker', 'search-indexer', 'cdn-edge', 'reporting-cron']);
      const ilg = HATALAR[s].filter(h => h.ilgisiz);
      if (ilg.length) ekle(s, saat(ARIZA_SN + r() * 15 * 60), sec(ilg), { istekId: id() });
    }

    kayitlar.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    CevapAnahtari.kayitSayisi = kayitlar.length;
    CevapAnahtari.ilkAnomaliId = zincir[0].id;
    CevapAnahtari.ilkAnomaliZamani = zincir[0].ts;
    return { kayitlar: kayitlar, anahtar: CevapAnahtari };
  }

  function csvYaz(kayitlar) {
    const k = ['id', 'ts', 'servis', 'seviye', 'kod', 'mesaj', 'istekId', 'sureMs', 'dugum'];
    const esc = v => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return k.join(',') + '\n' + kayitlar.map(r => k.map(x => esc(r[x])).join(',')).join('\n');
  }

  global.NumexGenerator = { gen: uret, csvYaz: csvYaz, SERVISLER: ADLAR };
})(window);
