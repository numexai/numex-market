/*
 * NUMEX İPEK YOLU — Ekonomi Çekirdeği
 * Saf mantık: DOM yok, three.js yok, tarih yok. Node ile deterministik test edilir.
 * Tarayıcıda global `NumexEkonomi`, Node'da module.exports olarak açılır.
 */
(function (kok, fabrika) {
  if (typeof module === "object" && module.exports) module.exports = fabrika();
  else kok.NumexEkonomi = fabrika();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ---------------------------------------------------------------- ürünler */
  var URUNLER = [
    { id: "ipek", ad: "İpek", taban: 42, talepTemel: 0.35, hedefGun: 30, hacim: 0.6, renk: "#e9d9a9" },
    { id: "baharat", ad: "Baharat", taban: 30, talepTemel: 0.5, hedefGun: 30, hacim: 0.4, renk: "#c2553a" },
    { id: "tahil", ad: "Tahıl", taban: 6, talepTemel: 1.6, hedefGun: 20, hacim: 1.0, renk: "#d9b45a" },
    { id: "demir", ad: "Demir", taban: 14, talepTemel: 0.5, hedefGun: 30, hacim: 1.2, renk: "#8b95a3" },
    { id: "tuz", ad: "Tuz", taban: 9, talepTemel: 0.7, hedefGun: 30, hacim: 0.8, renk: "#e6e6ea" },
    { id: "seramik", ad: "Seramik", taban: 12, talepTemel: 0.6, hedefGun: 30, hacim: 0.9, renk: "#4f8f8b" }
  ];
  var URUN_HARITA = {};
  URUNLER.forEach(function (u) { URUN_HARITA[u.id] = u; });

  /* ---------------------------------------------------------------- şehirler */
  var SEHIRLER = [
    {
      id: "semerkant", ad: "Semerkant", x: 0, z: 0, nufus: 120000,
      cografi: "Zeravşan vadisi · sulak ova",
      mimari: "Kubbeli medreseler, çini kaplı portaller, ipek atölyeleri",
      uretim: { ipek: 1.6, seramik: 1.2 },
      talep: { baharat: 1.5, demir: 1.3, tahil: 1.1, tuz: 1.0, seramik: 0.7, ipek: 0.6 },
      not: "İpeğin kalbi; tezgâhlar gece gündüz çalışır, demir ve baharat dışarıdan gelir."
    },
    {
      id: "buhara", ad: "Buhara", x: -260, z: 110, nufus: 90000,
      cografi: "Vaha · kumul çevrili sulak halka",
      mimari: "Kerpiç surlar, rüzgâr kuleleri, kervansaray avluları",
      uretim: { baharat: 1.4, tahil: 1.25 },
      talep: { ipek: 1.5, demir: 1.2, seramik: 1.1, tuz: 0.9, baharat: 0.6 },
      not: "Baharat kervanlarının ilk durağı; ipek için batıya altın akıtır."
    },
    {
      id: "belh", ad: "Belh", x: -420, z: 340, nufus: 75000,
      cografi: "Dağ eteği · demir ocakları",
      mimari: "Taş işçiliği, ocak bacaları, su kemerleri",
      uretim: { demir: 1.5, tuz: 1.35 },
      talep: { tahil: 1.4, ipek: 1.3, seramik: 1.1, baharat: 0.8 },
      not: "Ocaklar dumanı eksik etmez; tahıl ve ipek için komşularına muhtaç."
    },
    {
      id: "kasgar", ad: "Kaşgar", x: 640, z: -180, nufus: 65000,
      cografi: "Dağ geçidi · kar sınırı",
      mimari: "Kat kat çıkmalı kerpiç evler, taş kuleler, tuz çuvalları",
      uretim: { ipek: 1.35, tuz: 1.5 },
      talep: { tahil: 1.5, demir: 1.4, seramik: 1.2, baharat: 1.0 },
      not: "Geçit şehri; kışın yolu kapandığında fiyatlar bir gecede ikiye katlanır."
    },
    {
      id: "merv", ad: "Merv", x: -620, z: 130, nufus: 80000,
      cografi: "Büyük vaha · sulama kanalları",
      mimari: "Kanallar boyunca dizilmiş değirmenler, seramik fırınları",
      uretim: { tahil: 1.55, seramik: 1.35 },
      talep: { ipek: 1.4, demir: 1.3, tuz: 1.1, baharat: 1.2 },
      not: "Tahıl ambarı; batı yolu buradan Konstantinopolis'e uzanır."
    },
    {
      id: "konstantinopolis", ad: "Konstantinopolis", x: -1180, z: -120, nufus: 150000,
      cografi: "Boğaz kıyısı · liman",
      mimari: "Kubbeli bazilikalar, liman ambarları, taş rıhtımlar",
      uretim: { seramik: 1.05, demir: 1.1 },
      talep: { ipek: 1.8, baharat: 1.6, tuz: 1.2, tahil: 1.15, seramik: 0.5 },
      not: "Dünyanın en iştahlı pazarı: ipek ve baharat için ne bulsa alır."
    }
  ];
  var SEHIR_HARITA = {};
  SEHIRLER.forEach(function (s) { SEHIR_HARITA[s.id] = s; });

  /* -------------------------------------------------------------------- yollar */
  var YOLLAR = [
    { a: "semerkant", b: "buhara", km: 260, guvenlik: 0.86, ad: "Semerkant–Buhara" },
    { a: "semerkant", b: "merv", km: 430, guvenlik: 0.78, ad: "Semerkant–Merv" },
    { a: "buhara", b: "merv", km: 380, guvenlik: 0.82, ad: "Buhara–Merv" },
    { a: "buhara", b: "belh", km: 560, guvenlik: 0.72, ad: "Buhara–Belh" },
    { a: "merv", b: "belh", km: 400, guvenlik: 0.7, ad: "Merv–Belh" },
    { a: "belh", b: "kasgar", km: 780, guvenlik: 0.62, ad: "Belh–Kaşgar" },
    { a: "semerkant", b: "kasgar", km: 980, guvenlik: 0.55, ad: "Semerkant–Kaşgar" },
    { a: "merv", b: "konstantinopolis", km: 1450, guvenlik: 0.76, ad: "Merv–Konstantinopolis" }
  ];

  var HAVA_TIPLERI = [
    { id: "acik", ad: "Açık", hiz: 1.0, risk: 0.0, agirlik: 5 },
    { id: "sicak", ad: "Sıcak rüzgâr", hiz: 0.95, risk: 0.03, agirlik: 3 },
    { id: "yagmur", ad: "Yağmur", hiz: 0.8, risk: 0.1, agirlik: 3 },
    { id: "sis", ad: "Sis", hiz: 0.7, risk: 0.12, agirlik: 2 },
    { id: "kar", ad: "Kar", hiz: 0.55, risk: 0.2, agirlik: 2 },
    { id: "firtina", ad: "Çöl fırtınası", hiz: 0.4, risk: 0.28, agirlik: 1 }
  ];
  var HAVA_HARITA = {};
  HAVA_TIPLERI.forEach(function (h) { HAVA_HARITA[h.id] = h; });

  /* --------------------------------------------------------------- yardımcılar */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function kopya(o) { return JSON.parse(JSON.stringify(o)); }

  function Rastgele(tohum) { this.s = (tohum >>> 0) || 1; }
  Rastgele.prototype.sonraki = function () {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    var t = this.s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rastgele.prototype.aralik = function (a, b) { return a + (b - a) * this.sonraki(); };
  Rastgele.prototype.sec = function (dizi) { return dizi[Math.floor(this.sonraki() * dizi.length) % dizi.length]; };

  /* ------------------------------------------------------------------- Simülasyon */
  function Sim(opts) {
    opts = opts || {};
    this.tohum = opts.tohum != null ? opts.tohum : 1317;
    this.rng = new Rastgele(this.tohum);
    this.saat = 7;              // günün saati 0..24
    this.gun = 1;               // 1 tabanlı gün
    this.toplamSaat = 7;        // başlangıçtan beri geçen saat
    this.hiz = 0;               // oyun katmanının zaman çarpanı (0 = durduruldu)
    this.sehirler = {};
    this.yollar = [];
    this.kervanlar = [];
    this.olaylar = [];          // son olaylar (en yeni başta)
    this.fiyatGecmisi = [];     // { gun, saat, fiyatlar: {sehirId: {urunId: f}} }
    this._sonOlayId = 1;
    this._sonKervanId = 1;
    this.oyuncu = {
      sermaye: 3000,
      kervanSayisi: 1,
      kar: 0,
      harcama: 0,
      gelir: 0,
      islemGecmisi: []
    };
    this._kur();
    this._olaylariBaslat();
  }

  Sim.prototype._kur = function () {
    var self = this;
    SEHIRLER.forEach(function (tanim) {
      var s = kopya(tanim);
      s.stok = {};
      s.fiyat = {};
      s.uretimSaat = {};
      s.tuketimSaat = {};
      s.hava = "acik";
      s.uretimCanli = {};
      URUNLER.forEach(function (u) {
        var talepK = (tanim.talep && tanim.talep[u.id] != null) ? tanim.talep[u.id] : 1;
        var temelTuketim = 0.045 * (tanim.nufus / 1000) * u.talepTemel * talepK;
        var uretimK = (tanim.uretim && tanim.uretim[u.id]) || 0;
        s.tuketimSaat[u.id] = temelTuketim;
        s.uretimSaat[u.id] = temelTuketim * uretimK;
        s.uretimCanli[u.id] = s.uretimSaat[u.id];
        s.stok[u.id] = Math.round(temelTuketim * u.hedefGun);
        s.fiyat[u.id] = u.taban;
      });
      self.sehirler[s.id] = s;
    });

    YOLLAR.forEach(function (y, i) {
      self.yollar.push({
        id: "yol" + i, a: y.a, b: y.b, km: y.km, ad: y.ad,
        guvenlikTemel: y.guvenlik, guvenlik: y.guvenlik,
        kapali: false, kapanmaBitis: 0, kapanmaNeden: null, havaCeza: 0
      });
    });

    // fiyatları başlangıç stoklarına göre oturt
    Object.keys(this.sehirler).forEach(function (sid) { self.fiyatHesapla(self.sehirler[sid]); });
    this.fiyatGecmisi.push(this._fiyatAnlik());
  };

  /* --------------------------------------------------------------------- rastgele */
  Sim.prototype._olaylariBaslat = function () {
    var self = this;
    // 8 NPC kervanı, farklı şehirlerde
    var dagilim = ["buhara", "merv", "belh", "kasgar", "konstantinopolis", "semerkant",
      "buhara", "merv", "belh", "kasgar", "konstantinopolis", "semerkant", "merv", "buhara",
      "semerkant", "merv", "belh", "buhara"];
    dagilim.forEach(function (sid, i) {
      self.kervanEkle({
        sahip: "npc",
        sehir: sid,
        kapasite: 140 + Math.floor(self.rng.aralik(0, 80)),
        sermaye: 900 + Math.floor(self.rng.aralik(0, 1900)),
        ad: "Tüccar Kervanı " + (i + 1)
      });
    });
    this.kervanEkle({ sahip: "oyuncu", sehir: "semerkant", kapasite: 120, ad: "Senin Kervanın", yuk: {} });
  };

  Sim.prototype.kervanEkle = function (o) {
    var k = {
      id: "k" + (this._sonKervanId++),
      ad: o.ad,
      sahip: o.sahip || "npc",
      sehir: o.sehir,
      kapasite: o.kapasite || 120,
      yuk: o.yuk || {},
      durum: "sehirde",          // sehirde | yolda
      hedef: null,
      rota: null,
      rotaIndex: 0,
      kalanKm: 0,
      toplamKm: 0,
      sermaye: o.sermaye != null ? o.sermaye : 0,
      hiz: 30,                   // km/saat
      konum: { x: this.sehirler[o.sehir].x, z: this.sehirler[o.sehir].z },
      sonKar: 0,
      bekleyen: 0,
      _kararSaati: 0
    };
    this.kervanlar.push(k);
    return k;
  };

  Sim.prototype.kervanYukToplam = function (k) {
    var t = 0, self = this;
    Object.keys(k.yuk).forEach(function (uid) { t += k.yuk[uid] * (URUN_HARITA[uid] ? URUN_HARITA[uid].hacim : 1); });
    return t;
  };

  /* ----------------------------------------------------------------------- fiyat */
  Sim.prototype.hedefStok = function (s, u) {
    return Math.max(1, s.tuketimSaat[u.id] * u.hedefGun);
  };

  Sim.prototype.fiyatHesapla = function (s) {
    var self = this;
    URUNLER.forEach(function (u) {
      var hedef = self.hedefStok(s, u);
      var oran = s.stok[u.id] / hedef;             // 1 = normal
      var talepK = (s.talep && s.talep[u.id] != null) ? s.talep[u.id] : 1;
      var carpan = Math.pow(1 / Math.max(oran, 0.08), 0.7);
      var f = u.taban * carpan * talepK;
      s.fiyat[u.id] = Math.round(clamp(f, u.taban * 0.35, u.taban * 3.4) * 100) / 100;
    });
  };

  Sim.prototype._fiyatAnlik = function () {
    var out = {};
    var self = this;
    Object.keys(this.sehirler).forEach(function (sid) {
      out[sid] = {};
      URUNLER.forEach(function (u) { out[sid][u.id] = self.sehirler[sid].fiyat[u.id]; });
    });
    return { gun: this.gun, saat: Math.floor(this.saat), fiyatlar: out };
  };

  /* ------------------------------------------------------------------- ulaşım */
  Sim.prototype.yolBul = function (a, b) {
    for (var i = 0; i < this.yollar.length; i++) {
      var y = this.yollar[i];
      if ((y.a === a && y.b === b) || (y.a === b && y.b === a)) return y;
    }
    return null;
  };

  Sim.prototype.kenarMaliyeti = function (y) {
    if (y.kapali) return Infinity;
    var hava = 1 + y.havaCeza;
    var risk = 0.55 + (1 - y.guvenlik) * 2.2;
    return y.km * risk * hava;
  };

  // Dijkstra — kapalı yolları atlar, maliyet km değil "riskli km" cinsindendir
  Sim.prototype.rota = function (bas, son) {
    if (bas === son) return { sehirler: [bas], yollar: [], km: 0, maliyet: 0 };
    var mesafe = {}, onceki = {}, ziyaret = {};
    var self = this;
    Object.keys(this.sehirler).forEach(function (sid) { mesafe[sid] = Infinity; });
    mesafe[bas] = 0;
    while (true) {
      var enIyi = null, enKucuk = Infinity;
      Object.keys(mesafe).forEach(function (sid) {
        if (!ziyaret[sid] && mesafe[sid] < enKucuk) { enKucuk = mesafe[sid]; enIyi = sid; }
      });
      if (enIyi === null || enIyi === son) break;
      ziyaret[enIyi] = true;
      var komsular = this.komsular(enIyi);
      komsular.forEach(function (k) {
        var m = self.kenarMaliyeti(k.yol);
        if (m === Infinity) return;
        var yeni = mesafe[enIyi] + m;
        if (yeni < mesafe[k.sehir]) { mesafe[k.sehir] = yeni; onceki[k.sehir] = enIyi; }
      });
    }
    if (mesafe[son] === Infinity) return null;
    var zincir = [son], kmToplam = 0, kapaliAtlandi = false;
    var cur = son;
    while (cur !== bas) {
      var prev = onceki[cur];
      if (!prev) return null;
      var yol = this.yolBul(prev, cur);
      if (!yol || yol.kapali) { kapaliAtlandi = true; return null; }
      kmToplam += yol.km;
      zincir.unshift(prev);
      cur = prev;
    }
    return { sehirler: zincir, yollar: zincir.slice(1).map(function (s, i) { return self.yolBul(zincir[i], s); }), km: kmToplam, maliyet: mesafe[son], kapaliAtlandi: kapaliAtlandi };
  };

  Sim.prototype.komsular = function (sid) {
    var out = [];
    this.yollar.forEach(function (y) {
      if (y.a === sid) out.push({ sehir: y.b, yol: y });
      else if (y.b === sid) out.push({ sehir: y.a, yol: y });
    });
    return out;
  };

  // Bir kervanın taşıma maliyeti (akçe / birim)
  Sim.prototype.nakliyeMaliyeti = function (rota, urunId) {
    if (!rota) return Infinity;
    var u = URUN_HARITA[urunId];
    var risk = 0;
    rota.yollar.forEach(function (y) { risk += (1 - y.guvenlik) * 0.18; });
    var temel = rota.km * u.hacim * 0.03;
    return temel * (1 + risk) + risk * u.taban * 0.35;
  };

  /* ------------------------------------------------------------------ hava & olay */
  Sim.prototype.havaGuncelle = function () {
    var self = this;
    Object.keys(this.sehirler).forEach(function (sid) {
      var s = self.sehirler[sid];
      // ağırlıklı rastgele seçim
      var toplam = 0, i;
      for (i = 0; i < HAVA_TIPLERI.length; i++) toplam += HAVA_TIPLERI[i].agirlik;
      var r = self.rng.sonraki() * toplam;
      var secilen = HAVA_TIPLERI[0];
      for (i = 0; i < HAVA_TIPLERI.length; i++) {
        r -= HAVA_TIPLERI[i].agirlik;
        if (r <= 0) { secilen = HAVA_TIPLERI[i]; break; }
      }
      // coğrafya etkisi: Kaşgar dağ geçidi karda, Merv/Buhara çölde fırtınaya yatkın
      if (sid === "kasgar" && self.rng.sonraki() < 0.18) secilen = HAVA_HARITA.kar;
      if ((sid === "merv" || sid === "buhara") && self.rng.sonraki() < 0.08) secilen = HAVA_HARITA.firtina;
      s.hava = secilen.id;
    });
    // yol hava cezası: iki ucun havasının ortalaması
    this.yollar.forEach(function (y) {
      var ha = HAVA_HARITA[self.sehirler[y.a].hava];
      var hb = HAVA_HARITA[self.sehirler[y.b].hava];
      var risk = (ha.risk + hb.risk) / 2;
      y.havaCeza = risk;
      // hava yolu güvenliğini de aşındırır
      y.guvenlik = clamp(y.guvenlikTemel - risk * 0.5, 0.3, 0.98);
    });
    this.olayEkle("hava", "Hava değişti", "Kervanlar " + HAVA_HARITA[this.sehirler.semerkant.hava].ad.toLowerCase() + " koşullarında ilerliyor.", "bilgi");
  };

  Sim.prototype.olayEkle = function (tur, baslik, aciklama, seviye) {
    this.olaylar.unshift({
      id: this._sonOlayId++,
      gun: this.gun, saat: Math.floor(this.saat),
      tur: tur, baslik: baslik, aciklama: aciklama, seviye: seviye || "bilgi"
    });
    if (this.olaylar.length > 60) this.olaylar.pop();
  };

  // Kriz takvimi: 3. gün ana yol kapanır, 40 saat sonra açılır
  Sim.prototype._krizTetikle = function () {
    var yol = this.yolBul("semerkant", "buhara");
    if (!yol || yol.kapali) return;
    yol.kapali = true;
    yol.kapanmaBitis = this.toplamSaat + 40;
    yol.kapanmaNeden = "Dağ heyelanı";
    yol.guvenlik = 0.2;
    this.olayEkle("kriz", "Semerkant–Buhara yolu kapandı",
      "Şiddetli yağış sonrası heyelan ana geçidi kapattı. Kervanlar Merv üzerinden dolanıyor; 260 km'lik yol 810 km'ye çıktı.", "kriz");
    // yolda olan kervanları yeniden yönlendir
    var self = this;
    this.kervanlar.forEach(function (k) {
      if (k.durum === "yolda" && k.rota) {
        var hedef = k.rota.sehirler[k.rota.sehirler.length - 1];
        var bas = k.rota.sehirler[k.rotaIndex] || k.sehir;
        var yeni = self.rota(bas, hedef);
        if (yeni) {
          k.rota = yeni;
          k.rotaIndex = 0;
          k.kalanKm = yeni.km;
          k.toplamKm = yeni.km;
          k.yuk = k.yuk || {};
          k.bekleyen = 1;
        }
      }
    });
  };

  Sim.prototype._yolAcmayiDene = function () {
    var self = this;
    this.yollar.forEach(function (y) {
      if (y.kapali && self.toplamSaat >= y.kapanmaBitis) {
        y.kapali = false;
        y.kapanmaNeden = null;
        self.olayEkle("kriz", y.ad + " yeniden açıldı",
          "Ekipler geçidi temizledi. Güvenlik kademeli olarak toparlanacak; fiyatlar birkaç gün içinde dengelenir.", "iyi");
        // kademeli toparlanma: guvenlik 0.2'den temel değere
        y.guvenlik = 0.35;
      }
    });
  };

  /* ------------------------------------------------------------------ zaman adımı */
  Sim.prototype.adim = function (dtSaat) {
    if (!(dtSaat > 0)) return;
    var self = this;
    var dt = Math.min(dtSaat, 6);
    this.toplamSaat += dt;
    this.saat += dt;
    while (this.saat >= 24) { this.saat -= 24; this.gun += 1; }

    // 1) hava (her 6 saatte)
    if (Math.floor(this.toplamSaat / 6) !== Math.floor((this.toplamSaat - dt) / 6)) this.havaGuncelle();

    // 2) üretim / tüketim / fiyat
    Object.keys(this.sehirler).forEach(function (sid) { self._sehirAdim(self.sehirler[sid], dt); });

    // 3) yolların güvenliği toparlanır
    this.yollar.forEach(function (y) {
      if (!y.kapali && y.guvenlik < y.guvenlikTemel) {
        y.guvenlik = Math.min(y.guvenlikTemel, y.guvenlik + 0.004 * dt);
      }
    });

    // 4) kervanlar
    this.kervanlar.forEach(function (k) { self._kervanAdim(k, dt); });

    // 5) kriz takvimi
    if (this.gun === 3 && this.saat >= 9 && this.saat < 9 + dt && !this._krizYapildi) {
      this._krizYapildi = true;
      this._krizTetikle();
    }
    this._yolAcmayiDene();

    // 6) NPC kararları (her 6 saatte bir kontrol)
    if (Math.floor(this.toplamSaat / 6) !== Math.floor((this.toplamSaat - dt) / 6)) {
      this.kervanlar.forEach(function (k) { if (k.sahip === "npc") self.npcKarar(k); });
    }

    // 7) fiyat geçmişi (her 3 saatte bir örnek)
    if (Math.floor(this.toplamSaat / 3) !== Math.floor((this.toplamSaat - dt) / 3)) {
      this.fiyatGecmisi.push(this._fiyatAnlik());
      if (this.fiyatGecmisi.length > 400) this.fiyatGecmisi.shift();
    }
  };

  Sim.prototype._sehirAdim = function (s, dt) {
    var self = this;
    URUNLER.forEach(function (u) {
      var fiyat = s.fiyat[u.id];
      var fiyatOran = fiyat / u.taban;
      var uretimCarpan = clamp(Math.pow(fiyatOran, 0.8), 0.3, 1.5);
      var tuketimCarpan = clamp(Math.pow(1 / fiyatOran, 0.45), 0.55, 1.9);
      var uretim = s.uretimSaat[u.id] * uretimCarpan;
      var tuketim = s.tuketimSaat[u.id] * tuketimCarpan;
      s.uretimCanli[u.id] = uretim;
      s.stok[u.id] = Math.max(0, s.stok[u.id] + (uretim - tuketim) * dt);
    });
    self.fiyatHesapla(s);
  };

  Sim.prototype._kervanAdim = function (k, dt) {
    var self = this;
    if (k.durum !== "yolda" || !k.rota) return;
    var hava = HAVA_HARITA[this.sehirler[k.sehir] ? this.sehirler[k.sehir].hava : "acik"];
    var hiz = k.hiz * hava.hiz;
    // kalan km azalt
    var gidilen = hiz * dt;
    if (gidilen >= k.kalanKm) {
      gidilen = k.kalanKm;
      k.kalanKm = 0;
    } else {
      k.kalanKm -= gidilen;
    }
    // konum güncelle (segment ilerlemesi)
    var segBas = k.rota.sehirler[k.rotaIndex];
    var segSon = k.rota.sehirler[k.rotaIndex + 1];
    if (segBas && segSon) {
      var A = this.sehirler[segBas], B = this.sehirler[segSon];
      var segYol = this.yolBul(segBas, segSon);
      var segKm = segYol ? segYol.km : 1;
      // bu segmentte ne kadar kaldı: kalanKm, sonraki segmentlerin km'si çıkarılır
      var sonrakiKm = 0;
      for (var i = k.rotaIndex + 1; i < k.rota.yollar.length; i++) sonrakiKm += k.rota.yollar[i].km;
      var segKalan = clamp(k.kalanKm - sonrakiKm, 0, segKm);
      var t = 1 - segKalan / segKm;
      k.konum = { x: A.x + (B.x - A.x) * t, z: A.z + (B.z - A.z) * t };
    }
    if (k.kalanKm <= 0) {
      // varış
      var varis = k.rota.sehirler[k.rota.sehirler.length - 1];
      k.sehir = varis;
      k.durum = "sehirde";
      k.konum = { x: this.sehirler[varis].x, z: this.sehirler[varis].z };
      this._varisIslem(k, varis);
      k.hedef = null; k.rota = null; k.rotaIndex = 0;
      // tüccar boş beklemesin: varışta hemen yeni sefer kararı
      if (k.sahip === "npc") this.npcKarar(k);
    }
  };

  Sim.prototype._varisIslem = function (k, sehirId) {
    var self = this, s = this.sehirler[sehirId];
    var satilan = 0, kar = 0;
    Object.keys(k.yuk).forEach(function (uid) {
      var miktar = k.yuk[uid];
      if (!miktar || miktar <= 0) return;
      var fiyat = s.fiyat[uid];
      var gelir = fiyat * miktar * 0.985;
      s.stok[uid] = Math.max(0, s.stok[uid]) + miktar;
      satilan += miktar;
      if (k.sahip === "npc") { k.sermaye += gelir; }
      else {
        self.oyuncu.sermaye += gelir;
        self.oyuncu.gelir += gelir;
        self.oyuncu.kar += gelir;
        self.oyuncu.islemGecmisi.unshift({ gun: self.gun, saat: Math.floor(self.saat), tur: "satis", sehir: sehirId, urun: uid, miktar: miktar, birim: fiyat, tutar: gelir });
      }
      kar += gelir;
    });
    k.sonKar = kar;
    k.yuk = {};
    self.fiyatHesapla(s);
    if (k.sahip === "npc" && satilan > 0) {
      self.olayEkle("ticaret", k.ad + " " + s.ad + "'a ulaştı", satilan + " birim mal pazara indi, fiyatlar gevşedi.", "bilgi");
    }
    if (k.sahip === "oyuncu" && satilan > 0) {
      self.olayEkle("ticaret", "Kervanın " + s.ad + "'a ulaştı", satilan + " birim sattın; kasaya " + Math.round(kar) + " akçe girdi.", "iyi");
      k.bekleyen = 1;
    }
  };

  /* --------------------------------------------------------------- NPC karar */
  Sim.prototype.npcKarar = function (k) {
    if (k.durum !== "sehirde") return;
    var self = this;
    var burada = this.sehirler[k.sehir];

    // yükü varsa: en kârlı hedefe git
    var yukVar = Object.keys(k.yuk).some(function (uid) { return k.yuk[uid] > 0; });
    if (yukVar) {
      var enIyi = null;
      Object.keys(this.sehirler).forEach(function (sid) {
        if (sid === k.sehir) return;
        var r = self.rota(k.sehir, sid);
        if (!r) return;
        var kar = 0;
        Object.keys(k.yuk).forEach(function (uid) {
          if (k.yuk[uid] <= 0) return;
          var maliyet = self.nakliyeMaliyeti(r, uid);
          kar += (self.sehirler[sid].fiyat[uid] - maliyet) * k.yuk[uid];
        });
        if (!enIyi || kar > enIyi.kar) enIyi = { sid: sid, rota: r, kar: kar };
      });
      if (enIyi && enIyi.kar > 0) { this.kervanGit(k, enIyi.rota); return; }
      // kâr yoksa yükü burada boşalt (zararına da olsa dolaşmasın)
      Object.keys(k.yuk).forEach(function (uid) {
        var m = k.yuk[uid];
        if (m > 0) { k.sermaye += burada.fiyat[uid] * m * 0.985; burada.stok[uid] += m; }
      });
      k.yuk = {};
      this.fiyatHesapla(burada);
      return;
    }

    // yükü yok: en kârlı malı al, hedefe yönel
    var adaylar = [];
    Object.keys(this.sehirler).forEach(function (sid) {
      if (sid === k.sehir) return;
      var r = self.rota(k.sehir, sid);
      if (!r) return;
      URUNLER.forEach(function (u) {
        var fiyatBu = burada.fiyat[u.id];
        var hedefFiyat = self.sehirler[sid].fiyat[u.id];
        var maliyet = self.nakliyeMaliyeti(r, u.id);
        var birimKar = hedefFiyat - fiyatBu - maliyet;
        if (birimKar > fiyatBu * 0.1) {
          adaylar.push({ sid: sid, rota: r, urun: u.id, birimKar: birimKar, marj: birimKar / fiyatBu });
        }
      });
    });
    if (!adaylar.length) { this.olayEkle("ticaret", k.ad + " bekliyor", "Kârlı rota yok, " + burada.ad + "'da fiyatların oturmasını bekliyor.", "bilgi"); return; }
    adaylar.sort(function (a, b) { return b.marj - a.marj; });
    // bazen ikinci en iyi (tekdüzelik kırılsın)
    var sec = adaylar[0];
    if (adaylar.length > 2 && this.rng.sonraki() < 0.25) sec = adaylar[1];
    var maxSermaye = Math.max(0, k.sermaye);
    if (maxSermaye <= 0) maxSermaye = 600; // NPC asgari işletme sermayesi
    var stoktan = Math.floor(burada.stok[sec.urun] * 0.35);
    var miktar = Math.floor(Math.min(k.kapasite * 0.9, maxSermaye / (burada.fiyat[sec.urun] * 1.01), stoktan));
    if (miktar < 3) { return; }
    this.al(k, sec.urun, miktar);
    this.kervanGit(k, sec.rota);
  };

  Sim.prototype.kervanGit = function (k, rota) {
    if (!k) return false;
    k.rota = rota;
    k.rotaIndex = 0;
    k.kalanKm = rota.km;
    k.toplamKm = rota.km;
    k.durum = "yolda";
    k.hedef = rota.sehirler[rota.sehirler.length - 1];
    return true;
  };

  /* --------------------------------------------------------------- alım-satım */
  Sim.prototype.al = function (k, urunId, miktar) {
    var s = this.sehirler[k.sehir];
    if (!s || !URUN_HARITA[urunId]) return { ok: false, mesaj: "Geçersiz işlem" };
    miktar = Math.floor(miktar);
    if (miktar <= 0) return { ok: false, mesaj: "Miktar sıfır olamaz" };
    var u = URUN_HARITA[urunId];
    var bos = k.kapasite - this.kervanYukToplam(k);
    if (miktar * u.hacim > bos + 1e-9) return { ok: false, mesaj: "Kervan kapasitesi yetersiz" };
    if (s.stok[urunId] < miktar) return { ok: false, mesaj: "Şehirde bu kadar " + u.ad + " yok" };
    var tutar = s.fiyat[urunId] * miktar * 1.015;
    if (k.sahip === "oyuncu" && this.oyuncu.sermaye < tutar) return { ok: false, mesaj: "Sermaye yetersiz" };
    if (k.sahip === "npc" && k.sermaye < tutar) return { ok: false, mesaj: "Tüccarın sermayesi yetersiz" };
    s.stok[urunId] -= miktar;
    k.yuk[urunId] = (k.yuk[urunId] || 0) + miktar;
    if (k.sahip === "oyuncu") {
      this.oyuncu.sermaye -= tutar;
      this.oyuncu.harcama += tutar;
      this.oyuncu.kar -= tutar;
      this.oyuncu.islemGecmisi.unshift({ gun: this.gun, saat: Math.floor(this.saat), tur: "alis", sehir: k.sehir, urun: urunId, miktar: miktar, birim: s.fiyat[urunId], tutar: -tutar });
    } else k.sermaye -= tutar;
    this.fiyatHesapla(s);
    return { ok: true, tutar: tutar, birim: s.fiyat[urunId] };
  };

  Sim.prototype.sat = function (k, urunId, miktar) {
    var s = this.sehirler[k.sehir];
    if (!s) return { ok: false, mesaj: "Geçersiz şehir" };
    miktar = Math.floor(miktar);
    var mevcut = k.yuk[urunId] || 0;
    if (k.durum === "yolda") return { ok: false, mesaj: "Yolda satış yapılamaz" };
    if (miktar <= 0 || mevcut < miktar) return { ok: false, mesaj: "Kervanda bu kadar mal yok" };
    var gelir = s.fiyat[urunId] * miktar * 0.985;
    k.yuk[urunId] = mevcut - miktar;
    if (k.yuk[urunId] <= 0) delete k.yuk[urunId];
    s.stok[urunId] += miktar;
    if (k.sahip === "oyuncu") {
      this.oyuncu.sermaye += gelir;
      this.oyuncu.gelir += gelir;
      this.oyuncu.kar += gelir;
      this.oyuncu.islemGecmisi.unshift({ gun: this.gun, saat: Math.floor(this.saat), tur: "satis", sehir: k.sehir, urun: urunId, miktar: miktar, birim: s.fiyat[urunId], tutar: gelir });
    } else k.sermaye += gelir;
    this.fiyatHesapla(s);
    return { ok: true, gelir: gelir, birim: s.fiyat[urunId] };
  };

  Sim.prototype.kervanSatinAl = function () {
    var fiyat = 1800;
    if (this.oyuncu.sermaye < fiyat) return { ok: false, mesaj: "Yeni kervan için " + fiyat + " akçe gerekiyor" };
    this.oyuncu.sermaye -= fiyat;
    this.oyuncu.harcama += fiyat;
    this.oyuncu.kervanSayisi += 1;
    var k = this.kervanEkle({
      sahip: "oyuncu",
      sehir: "semerkant",
      kapasite: 120,
      ad: "Kervan " + this.oyuncu.kervanSayisi
    });
    this.olayEkle("ticaret", "Yeni kervan satın alındı", k.ad + " Semerkant'tan yola çıkmaya hazır.", "iyi");
    return { ok: true, kervan: k };
  };

  /* ------------------------------------------------------------------ kayıt */
  Sim.prototype.kaydet = function () {
    return {
      surum: 1,
      tohum: this.tohum,
      rngDurum: this.rng.s,
      saat: this.saat,
      gun: this.gun,
      toplamSaat: this.toplamSaat,
      _krizYapildi: !!this._krizYapildi,
      oyuncu: kopya(this.oyuncu),
      sehirler: (function (self) {
        var o = {};
        Object.keys(self.sehirler).forEach(function (sid) {
          var s = self.sehirler[sid];
          o[sid] = { stok: kopya(s.stok), fiyat: kopya(s.fiyat), hava: s.hava };
        });
        return o;
      })(this),
      yollar: this.yollar.map(function (y) {
        return { id: y.id, kapali: y.kapali, kapanmaBitis: y.kapanmaBitis, kapanmaNeden: y.kapanmaNeden, guvenlik: y.guvenlik, havaCeza: y.havaCeza };
      }),
      kervanlar: kopya(this.kervanlar),
      olaylar: kopya(this.olaylar.slice(0, 40))
    };
  };

  Sim.geriYukle = function (veri) {
    if (!veri || veri.surum !== 1) return null;
    var sim = new Sim({ tohum: veri.tohum });
    // yeniden kurulan NPC kervanlarını temizle, kayıttan gelenleri koy
    sim.kervanlar = [];
    sim.saat = veri.saat;
    sim.gun = veri.gun;
    sim.toplamSaat = veri.toplamSaat;
    sim._krizYapildi = !!veri._krizYapildi;
    sim.rng.s = veri.rngDurum >>> 0;
    sim.oyuncu = veri.oyuncu;
    Object.keys(veri.sehirler).forEach(function (sid) {
      if (!sim.sehirler[sid]) return;
      sim.sehirler[sid].stok = veri.sehirler[sid].stok;
      sim.sehirler[sid].fiyat = veri.sehirler[sid].fiyat;
      sim.sehirler[sid].hava = veri.sehirler[sid].hava;
    });
    sim.yollar.forEach(function (y) {
      var kayit = veri.yollar.filter(function (v) { return v.id === y.id; })[0];
      if (kayit) { y.kapali = kayit.kapali; y.kapanmaBitis = kayit.kapanmaBitis; y.kapanmaNeden = kayit.kapanmaNeden; y.guvenlik = kayit.guvenlik; y.havaCeza = kayit.havaCeza; }
    });
    sim.kervanlar = veri.kervanlar;
    sim.olaylar = veri.olaylar || [];
    sim._sonKervanId = sim.kervanlar.length + 1;
    return sim;
  };

  /* -------------------------------------------------------------- dışa açılan */
  return {
    URUNLER: URUNLER,
    URUN_HARITA: URUN_HARITA,
    SEHIRLER: SEHIRLER,
    SEHIR_HARITA: SEHIR_HARITA,
    YOLLAR: YOLLAR,
    HAVA_TIPLERI: HAVA_TIPLERI,
    HAVA_HARITA: HAVA_HARITA,
    Sim: Sim,
    Rastgele: Rastgele,
    clamp: clamp
  };
});
