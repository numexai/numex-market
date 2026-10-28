/* Nobetci Operasyon Merkezi - Veri Katmani (store)
   Saf is mantigi; DOM'a dokunmaz, test edilebilir. */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'nobetci-op-v1';
  var SEVIYELER = ['dusuk', 'orta', 'yuksek', 'kritik'];
  var DURUMLAR = ['acik', 'inceleniyor', 'mudahale', 'cozuldu'];
  var GOREV_DURUMLARI = ['bekliyor', 'devam', 'tamamlandi'];

  function bosDurum() {
    return { olaylar: [], gorevler: [], sira: 1, gorevSira: 1 };
  }

  function idUret(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 8);
  }

  /* --- Tarih yardimcilari (timezone/NaN guvenli) --- */
  function bugunISO() {
    var d = new Date();
    var ay = String(d.getMonth() + 1).padStart(2, '0');
    var gun = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + ay + '-' + gun;
  }

  function tarihGecerliMi(iso) {
    if (iso === null || iso === undefined) return false;
    var s = String(iso).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-');
    var y = Number(p[0]), m = Number(p[1]), g = Number(p[2]);
    var d = new Date(y, m - 1, g);
    return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === g;
  }

  // Gun farki: hedef - bugun (gun cinsinden). Tarih yoksa null.
  function gunFarki(iso) {
    if (!tarihGecerliMi(iso)) return null;
    var b = bugunISO().split('-').map(Number);
    var h = String(iso).split('-').map(Number);
    var t1 = Date.UTC(b[0], b[1] - 1, b[2]);
    var t2 = Date.UTC(h[0], h[1] - 1, h[2]);
    return Math.round((t2 - t1) / 86400000);
  }

  // 'gecikmis' | 'bugun' | 'yarin' | 'ileri' | 'tarihyok'
  function gorevZamanDurumu(gorev) {
    if (!gorev || gorev.durum === 'tamamlandi') return 'tamamlandi';
    var fark = gunFarki(gorev.sonTarih);
    if (fark === null) return 'tarihyok';
    if (fark < 0) return 'gecikmis';
    if (fark === 0) return 'bugun';
    if (fark === 1) return 'yarin';
    return 'ileri';
  }

  function gecikmisMi(gorev) {
    return gorevZamanDurumu(gorev) === 'gecikmis';
  }

  /* --- Normalizasyon / dogrulama --- */
  function metinTemizle(v, maxUzunluk) {
    var s = (v === null || v === undefined) ? '' : String(v);
    s = s.trim();
    if (maxUzunluk && s.length > maxUzunluk) s = s.slice(0, maxUzunluk);
    return s;
  }

  function seviyeGecerli(s) { return SEVIYELER.indexOf(s) !== -1; }
  function durumGecerli(s) { return DURUMLAR.indexOf(s) !== -1; }

  function olayDogrula(veri) {
    var hatalar = [];
    var baslik = metinTemizle(veri && veri.baslik, 200);
    if (!baslik) hatalar.push('Baslik bos olamaz.');
    var seviye = veri && veri.seviye;
    if (!seviyeGecerli(seviye)) hatalar.push('Onem seviyesi gecersiz.');
    return { gecerli: hatalar.length === 0, hatalar: hatalar, baslik: baslik };
  }

  function gorevDogrula(veri) {
    var hatalar = [];
    var baslik = metinTemizle(veri && veri.baslik, 200);
    if (!baslik) hatalar.push('Gorev basligi bos olamaz.');
    if (veri && veri.sonTarih !== null && veri.sonTarih !== undefined &&
        String(veri.sonTarih).trim() !== '' && !tarihGecerliMi(veri.sonTarih)) {
      hatalar.push('Son tarih gecersiz.');
    }
    return { gecerli: hatalar.length === 0, hatalar: hatalar, baslik: baslik };
  }

  /* --- Store --- */
  function Store(depo) {
    this.depo = depo || null;
    this.state = bosDurum();
  }

  Store.prototype.yukle = function () {
    var raw = null;
    try {
      if (this.depo) raw = this.depo.getItem(STORAGE_KEY);
    } catch (e) { raw = null; }
    if (!raw) { this.state = bosDurum(); return this.state; }
    try {
      var p = JSON.parse(raw);
      this.state = this.temizle(p);
    } catch (e) {
      // Bozuk JSON: uygulama cokmesin, temiz durumla devam.
      this.state = bosDurum();
    }
    return this.state;
  };

  // Eldeki her turlu cop veriyi guvenli duruma indirger.
  Store.prototype.temizle = function (p) {
    var s = bosDurum();
    if (!p || typeof p !== 'object') return s;
    var olaylar = Array.isArray(p.olaylar) ? p.olaylar : [];
    var gorevler = Array.isArray(p.gorevler) ? p.gorevler : [];

    olaylar.forEach(function (o) {
      if (!o || typeof o !== 'object') return;
      var baslik = metinTemizle(o.baslik, 200);
      if (!baslik) return;
      s.olaylar.push({
        id: typeof o.id === 'string' && o.id ? o.id : idUret('olay'),
        baslik: baslik,
        aciklama: metinTemizle(o.aciklama, 2000),
        seviye: seviyeGecerli(o.seviye) ? o.seviye : 'orta',
        servis: metinTemizle(o.servis, 80) || 'Genel',
        sorumlu: metinTemizle(o.sorumlu, 80),
        durum: durumGecerli(o.durum) ? o.durum : 'acik',
        olusturma: typeof o.olusturma === 'string' ? o.olusturma : new Date().toISOString(),
        guncelleme: typeof o.guncelleme === 'string' ? o.guncelleme : new Date().toISOString()
      });
    });

    var olayIdleri = {};
    s.olaylar.forEach(function (o) { olayIdleri[o.id] = true; });

    gorevler.forEach(function (g) {
      if (!g || typeof g !== 'object') return;
      var baslik = metinTemizle(g.baslik, 200);
      if (!baslik) return;
      // Yetim gorev (olayi yok) kalici olarak tasinmaz.
      if (!olayIdleri[g.olayId]) return;
      s.gorevler.push({
        id: typeof g.id === 'string' && g.id ? g.id : idUret('gorev'),
        olayId: g.olayId,
        baslik: baslik,
        sorumlu: metinTemizle(g.sorumlu, 80),
        durum: GOREV_DURUMLARI.indexOf(g.durum) !== -1 ? g.durum : 'bekliyor',
        sonTarih: tarihGecerliMi(g.sonTarih) ? g.sonTarih : null,
        olusturma: typeof g.olusturma === 'string' ? g.olusturma : new Date().toISOString()
      });
    });
    return s;
  };

  Store.prototype.kaydet = function () {
    try {
      if (this.depo) this.depo.setItem(STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (e) { return false; }
  };

  Store.prototype.sifirla = function (ornekVeri) {
    this.state = ornekVeri ? this.temizle(ornekVeri) : bosDurum();
    this.kaydet();
    return this.state;
  };

  /* --- Olay islemleri --- */
  Store.prototype.olayEkle = function (veri) {
    var d = olayDogrula(veri);
    if (!d.gecerli) return { ok: false, hatalar: d.hatalar };
    var simdi = new Date().toISOString();
    var olay = {
      id: idUret('olay'),
      baslik: d.baslik,
      aciklama: metinTemizle(veri.aciklama, 2000),
      seviye: veri.seviye,
      servis: metinTemizle(veri.servis, 80) || 'Genel',
      sorumlu: metinTemizle(veri.sorumlu, 80),
      durum: 'acik',
      olusturma: simdi,
      guncelleme: simdi
    };
    this.state.olaylar.push(olay);
    this.kaydet();
    return { ok: true, olay: olay };
  };

  Store.prototype.olayGetir = function (id) {
    for (var i = 0; i < this.state.olaylar.length; i++) {
      if (this.state.olaylar[i].id === id) return this.state.olaylar[i];
    }
    return null;
  };

  Store.prototype.olayGuncelle = function (id, veri) {
    var olay = this.olayGetir(id);
    if (!olay) return { ok: false, hatalar: ['Olay bulunamadi.'] };
    var d = olayDogrula({
      baslik: veri.baslik !== undefined ? veri.baslik : olay.baslik,
      seviye: veri.seviye !== undefined ? veri.seviye : olay.seviye
    });
    if (!d.gecerli) return { ok: false, hatalar: d.hatalar };
    olay.baslik = d.baslik;
    if (veri.aciklama !== undefined) olay.aciklama = metinTemizle(veri.aciklama, 2000);
    olay.seviye = veri.seviye !== undefined ? veri.seviye : olay.seviye;
    if (veri.servis !== undefined) olay.servis = metinTemizle(veri.servis, 80) || 'Genel';
    if (veri.sorumlu !== undefined) olay.sorumlu = metinTemizle(veri.sorumlu, 80);
    olay.guncelleme = new Date().toISOString();
    this.kaydet();
    return { ok: true, olay: olay };
  };

  Store.prototype.olaySil = function (id) {
    var idx = -1;
    for (var i = 0; i < this.state.olaylar.length; i++) {
      if (this.state.olaylar[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return { ok: false, hatalar: ['Olay bulunamadi.'] };
    this.state.olaylar.splice(idx, 1);
    // Bagli gorevleri de temizle (yetim kalmasin).
    this.state.gorevler = this.state.gorevler.filter(function (g) {
      return g.olayId !== id;
    });
    this.kaydet();
    return { ok: true };
  };

  // KURAL: acik gorev varsa olay cozuldu yapilamaz.
  Store.prototype.olayDurumDegistir = function (id, yeniDurum) {
    var olay = this.olayGetir(id);
    if (!olay) return { ok: false, hatalar: ['Olay bulunamadi.'] };
    if (!durumGecerli(yeniDurum)) return { ok: false, hatalar: ['Durum gecersiz.'] };
    if (yeniDurum === 'cozuldu') {
      var acik = this.acikGorevler(id);
      if (acik.length > 0) {
        return {
          ok: false,
          hatalar: [acik.length + ' gorev tamamlanmadan olay cozuldu yapilamaz.']
        };
      }
    }
    olay.durum = yeniDurum;
    olay.guncelleme = new Date().toISOString();
    this.kaydet();
    return { ok: true, olay: olay };
  };

  /* --- Gorev islemleri --- */
  Store.prototype.acikGorevler = function (olayId) {
    return this.state.gorevler.filter(function (g) {
      return g.olayId === olayId && g.durum !== 'tamamlandi';
    });
  };

  Store.prototype.olayGorevleri = function (olayId) {
    return this.state.gorevler.filter(function (g) { return g.olayId === olayId; });
  };

  Store.prototype.gorevEkle = function (olayId, veri) {
    var olay = this.olayGetir(olayId);
    if (!olay) return { ok: false, hatalar: ['Olay bulunamadi.'] };
    var d = gorevDogrula(veri);
    if (!d.gecerli) return { ok: false, hatalar: d.hatalar };
    var gorev = {
      id: idUret('gorev'),
      olayId: olayId,
      baslik: d.baslik,
      sorumlu: metinTemizle(veri.sorumlu, 80),
      durum: GOREV_DURUMLARI.indexOf(veri.durum) !== -1 ? veri.durum : 'bekliyor',
      sonTarih: tarihGecerliMi(veri.sonTarih) ? veri.sonTarih : null,
      olusturma: new Date().toISOString()
    };
    this.state.gorevler.push(gorev);
    olay.guncelleme = new Date().toISOString();
    this.kaydet();
    return { ok: true, gorev: gorev };
  };

  Store.prototype.gorevGetir = function (id) {
    for (var i = 0; i < this.state.gorevler.length; i++) {
      if (this.state.gorevler[i].id === id) return this.state.gorevler[i];
    }
    return null;
  };

  Store.prototype.gorevGuncelle = function (id, veri) {
    var gorev = this.gorevGetir(id);
    if (!gorev) return { ok: false, hatalar: ['Gorev bulunamadi.'] };
    var d = gorevDogrula({
      baslik: veri.baslik !== undefined ? veri.baslik : gorev.baslik,
      sonTarih: veri.sonTarih !== undefined ? veri.sonTarih : gorev.sonTarih
    });
    if (!d.gecerli) return { ok: false, hatalar: d.hatalar };
    gorev.baslik = d.baslik;
    if (veri.sorumlu !== undefined) gorev.sorumlu = metinTemizle(veri.sorumlu, 80);
    if (veri.sonTarih !== undefined) {
      gorev.sonTarih = tarihGecerliMi(veri.sonTarih) ? veri.sonTarih : null;
    }
    this.kaydet();
    return { ok: true, gorev: gorev };
  };

  // Zaten tamamlanmis gorev tekrar tamamlanamaz.
  Store.prototype.gorevTamamla = function (id) {
    var gorev = this.gorevGetir(id);
    if (!gorev) return { ok: false, hatalar: ['Gorev bulunamadi.'] };
    if (gorev.durum === 'tamamlandi') {
      return { ok: false, hatalar: ['Bu gorev zaten tamamlanmis.'] };
    }
    gorev.durum = 'tamamlandi';
    var olay = this.olayGetir(gorev.olayId);
    if (olay) olay.guncelleme = new Date().toISOString();
    this.kaydet();
    return { ok: true, gorev: gorev };
  };

  Store.prototype.gorevDurumDegistir = function (id, durum) {
    var gorev = this.gorevGetir(id);
    if (!gorev) return { ok: false, hatalar: ['Gorev bulunamadi.'] };
    if (GOREV_DURUMLARI.indexOf(durum) === -1) {
      return { ok: false, hatalar: ['Gorev durumu gecersiz.'] };
    }
    if (durum === 'tamamlandi') return this.gorevTamamla(id);
    if (gorev.durum === 'tamamlandi') {
      return { ok: false, hatalar: ['Tamamlanan gorev geri alinamaz.'] };
    }
    gorev.durum = durum;
    this.kaydet();
    return { ok: true, gorev: gorev };
  };

  Store.prototype.gorevSil = function (id) {
    var idx = -1;
    for (var i = 0; i < this.state.gorevler.length; i++) {
      if (this.state.gorevler[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return { ok: false, hatalar: ['Gorev bulunamadi.'] };
    this.state.gorevler.splice(idx, 1);
    this.kaydet();
    return { ok: true };
  };

  /* --- Sayaclar (state'ten hesaplanir, sabit degil) --- */
  Store.prototype.sayaclar = function () {
    var s = this.state;
    var t = {
      toplamOlay: s.olaylar.length,
      acikOlay: 0, kritikOlay: 0, mudahale: 0, cozulen: 0,
      toplamGorev: s.gorevler.length, acikGorev: 0, gecikenGorev: 0,
      tamamlananGorev: 0
    };
    s.olaylar.forEach(function (o) {
      if (o.durum === 'acik') t.acikOlay++;
      if (o.durum === 'mudahale') t.mudahale++;
      if (o.durum === 'cozuldu') t.cozulen++;
      if (o.seviye === 'kritik' && o.durum !== 'cozuldu') t.kritikOlay++;
    });
    s.gorevler.forEach(function (g) {
      if (g.durum === 'tamamlandi') { t.tamamlananGorev++; return; }
      t.acikGorev++;
      if (gecikmisMi(g)) t.gecikenGorev++;
    });
    return t;
  };

  /* --- Filtre / arama / siralama --- */
  Store.prototype.filtrele = function (f) {
    f = f || {};
    var metin = metinTemizle(f.metin, 200).toLowerCase();
    var list = this.state.olaylar.filter(function (o) {
      if (f.durum && f.durum !== 'hepsi' && o.durum !== f.durum) return false;
      if (f.seviye && f.seviye !== 'hepsi' && o.seviye !== f.seviye) return false;
      if (f.servis && f.servis !== 'hepsi' && o.servis !== f.servis) return false;
      if (f.sorumlu && f.sorumlu !== 'hepsi' && o.sorumlu !== f.sorumlu) return false;
      if (metin) {
        var hedef = (o.baslik + ' ' + o.aciklama + ' ' + o.servis + ' ' + o.sorumlu).toLowerCase();
        if (hedef.indexOf(metin) === -1) return false;
      }
      return true;
    });
    var sirala = f.sirala || 'yeni';
    list.sort(function (a, b) {
      if (sirala === 'eski') return a.olusturma < b.olusturma ? -1 : 1;
      if (sirala === 'onem') {
        var puan = { kritik: 4, yuksek: 3, orta: 2, dusuk: 1 };
        return (puan[b.seviye] || 0) - (puan[a.seviye] || 0);
      }
      if (sirala === 'baslik') return a.baslik.localeCompare(b.baslik, 'tr');
      return a.olusturma > b.olusturma ? -1 : 1;
    });
    return list;
  };

  Store.prototype.servisler = function () {
    var set = {};
    this.state.olaylar.forEach(function (o) { if (o.servis) set[o.servis] = true; });
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
  };

  var api = {
    Store: Store,
    STORAGE_KEY: STORAGE_KEY,
    SEVIYELER: SEVIYELER,
    DURUMLAR: DURUMLAR,
    GOREV_DURUMLARI: GOREV_DURUMLARI,
    bugunISO: bugunISO,
    tarihGecerliMi: tarihGecerliMi,
    gunFarki: gunFarki,
    gorevZamanDurumu: gorevZamanDurumu,
    gecikmisMi: gecikmisMi,
    metinTemizle: metinTemizle,
    idUret: idUret,
    bosDurum: bosDurum
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NobetciStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
