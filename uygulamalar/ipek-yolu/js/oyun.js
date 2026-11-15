/*
 * NUMEX İPEK YOLU — Oyun (orkestrasyon)
 * Ekonomi (js/ekonomi.js) + dünya (js/dunya.js) + arayüz (js/arayuz.js) bağlantısı.
 */
(function (kok) {
  "use strict";
  var E = kok.NumexEkonomi;
  var KAYIT_ANAHTAR = "numex-ipek-yolu-v1";

  var Oyun = {
    sim: null,
    dunya: null,
    secim: { sehir: "semerkant", kervan: null, hizGoster: 1 },
    hiz: 1,
    _sonKare: 0,
    _sonCizim: 0,
    _miktar: 10,
    basladi: false
  };

  Oyun.baslat = function () {
    var sim = new E.Sim({ tohum: 1317 });
    Oyun.sim = sim;
    Oyun.secim.kervan = sim.kervanlar.filter(function (k) { return k.sahip === "oyuncu"; })[0].id;
    Oyun.secim.sehir = "semerkant";
    sim.hiz = Oyun.hiz;

    Arayuz.baslat(Oyun);
    Oyun._dunyaBaslat();

    Oyun.perdeGoster("İpek Yolu — 1219", Oyun.yardimMetni());
    Oyun._dongu();
    Oyun.basladi = true;
  };

  Oyun._dunyaBaslat = function () {
    try {
      var d = new kok.Dunya(document.getElementById("sahne"));
      var ok = d.baslat(Oyun.sim);
      if (!ok) {
        Oyun.perdeGoster("3B katman açılamadı", "Tarayıcı WebGL'i desteklemiyor görünüyor. Ekonomi simülasyonu yine de çalışıyor; panellerden işlem yapabilirsin.");
        return;
      }
      d.tiklaGeriCagri = function (tip, id) {
        if (tip === "sehir") Oyun.sehirSec(id);
        else if (tip === "kervan") Oyun.kervanSec(id);
      };
      d.kameraGit("semerkant");
      Oyun.dunya = d;
    } catch (e) {
      console.error("Dünya kurulamadı:", e);
      Oyun.perdeGoster("3B katman hatası", "Dünya kurulurken bir sorun çıktı. Ekonomi simülasyonu panellerden çalışmaya devam ediyor.");
    }
  };

  /* ------------------------------------------------------------------ döngü */
  Oyun._dongu = function () {
    var simdi = kok.performance.now();
    var dtSn = Oyun._sonKare ? Math.min(0.1, (simdi - Oyun._sonKare) / 1000) : 0.016;
    Oyun._sonKare = simdi;

    var sim = Oyun.sim;
    if (Oyun.hiz > 0 && dtSn > 0) {
      // 1× = saniyede yarım oyun saati
      var dtSaat = dtSn * Oyun.hiz * 0.5;
      var adimSayisi = Math.ceil(dtSaat / 0.5);
      for (var i = 0; i < adimSayisi; i++) sim.adim(dtSaat / adimSayisi);
    }

    if (Oyun.dunya) {
      Oyun.dunya.kameraAdim();
      Oyun.dunya.guncelle(sim, Oyun.secim.sehir, Oyun.secim.kervan, dtSn);
    }

    if (simdi - Oyun._sonCizim > 280) {
      Oyun._sonCizim = simdi;
      Arayuz.ciz(sim, Oyun.secim);
    }
    kok.requestAnimationFrame(Oyun._dongu);
  };

  /* ----------------------------------------------------------------- eylemler */
  Oyun.hizAyarla = function (h) {
    Oyun.hiz = h;
    Oyun.sim.hiz = h;
    Oyun.secim.hizGoster = h;
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.sehirSec = function (id) {
    if (!Oyun.sim.sehirler[id]) return;
    Oyun.secim.sehir = id;
    Oyun.secim.kervan = null;
    if (Oyun.dunya) Oyun.dunya.kameraGit(id);
    var s = Oyun.sim.sehirler[id];
    if (Oyun.dunya && Oyun.dunya.sehirObjeleri[id]) Oyun.dunya.seciliSehir = id;
    Arayuz.ciz(Oyun.sim, Oyun.secim);
    return s;
  };

  Oyun.kervanSec = function (id) {
    var k = Oyun.sim.kervanlar.filter(function (x) { return x.id === id; })[0];
    if (!k) return;
    Oyun.secim.kervan = id;
    if (k.sahip === "oyuncu" && k.sehir) Oyun.secim.sehir = k.sehir;
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.miktarAyarla = function (m) {
    Oyun._miktar = m;
    Arayuz.miktarAyarla(m);
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun._oyuncuKervani = function () {
    var id = Oyun.secim.kervan;
    var k = Oyun.sim.kervanlar.filter(function (x) { return x.id === id && x.sahip === "oyuncu"; })[0];
    if (k) return k;
    return Oyun.sim.kervanlar.filter(function (x) { return x.sahip === "oyuncu"; })[0] || null;
  };

  Oyun.trade = function (tur, urun, miktar) {
    var k = Oyun._oyuncuKervani();
    if (!k) return Oyun.bildir("Önce bir kervan gerekiyor.");
    if (k.durum === "yolda") return Oyun.bildir("Kervan yolda — satış için şehre varmasını bekle.");
    var sonuc = tur === "al" ? Oyun.sim.al(k, urun, miktar) : Oyun.sim.sat(k, urun, miktar);
    if (!sonuc.ok) Oyun.bildir(sonuc.mesaj);
    else {
      var u = E.URUN_HARITA[urun];
      if (tur === "al") Oyun.bildir(u.ad + " alındı: " + miktar + " birim · " + Arayuz.akce(sonuc.tutar) + " ödendi.");
      else Oyun.bildir(u.ad + " satıldı: " + miktar + " birim · " + Arayuz.akce(sonuc.gelir) + " kasaya girdi.");
    }
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.hepsiniSat = function () {
    var k = Oyun._oyuncuKervani();
    if (!k || k.durum === "yolda") return Oyun.bildir("Yolda satış olmaz.");
    var toplam = 0;
    Object.keys(k.yuk || {}).forEach(function (uid) {
      var r = Oyun.sim.sat(k, uid, k.yuk[uid]);
      if (r.ok) toplam += r.gelir;
    });
    Oyun.bildir(toplam > 0 ? "Yük boşaltıldı · " + Arayuz.akce(toplam) + " kasaya girdi." : "Kervan zaten boş.");
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.rotaGit = function (hedefId) {
    var k = Oyun._oyuncuKervani();
    if (!k) return Oyun.bildir("Kervan yok.");
    if (k.durum === "yolda") return Oyun.bildir("Kervan zaten yolda.");
    if (!hedefId || hedefId === k.sehir) return Oyun.bildir("Farklı bir şehir seç.");
    var rota = Oyun.sim.rota(k.sehir, hedefId);
    if (!rota) return Oyun.bildir("Bu şehre açık bir yol yok.");
    Oyun.sim.kervanGit(k, rota);
    Oyun.bildir(k.ad + " yola çıktı: " + rota.sehirler.map(function (s) { return Oyun.sim.sehirler[s].ad; }).join(" → ") + " · " + rota.km + " km");
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.yeniKervan = function () {
    var r = Oyun.sim.kervanSatinAl();
    if (!r.ok) Oyun.bildir(r.mesaj);
    else { Oyun.secim.kervan = r.kervan.id; Oyun.bildir("Yeni kervan alındı: " + r.kervan.ad); }
    Arayuz.ciz(Oyun.sim, Oyun.secim);
  };

  Oyun.kameraOdak = function (id) {
    if (Oyun.dunya) Oyun.dunya.kameraGit(id);
  };

  Oyun.yolBilgi = function () {
    var k = Oyun._oyuncuKervani();
    if (!k) return;
  };

  /* ------------------------------------------------------------------ kayıt */
  Oyun.kaydet = function () {
    try {
      var veri = Oyun.sim.kaydet();
      kok.localStorage.setItem(KAYIT_ANAHTAR, JSON.stringify(veri));
      Oyun.bildir("Oyun kaydedildi (" + veri.gun + ". gün, " + Math.floor(veri.saat) + ":00).");
      return true;
    } catch (e) {
      console.error(e);
      Oyun.bildir("Kaydedilemedi: tarayıcı depolaması kapalı olabilir.");
      return false;
    }
  };

  Oyun.yukle = function () {
    var ham = null;
    try { ham = kok.localStorage.getItem(KAYIT_ANAHTAR); } catch (e) { ham = null; }
    if (!ham) return Oyun.bildir("Kayıtlı oyun bulunamadı.");
    var sim = null;
    try { sim = E.Sim.geriYukle(JSON.parse(ham)); } catch (e) { console.error(e); }
    if (!sim) return Oyun.bildir("Kayıt okunamadı.");
    Oyun.sim = sim;
    var ok = sim.kervanlar.filter(function (k) { return k.sahip === "oyuncu"; })[0];
    Oyun.secim.kervan = ok ? ok.id : null;
    Oyun.secim.sehir = ok ? ok.sehir : "semerkant";
    if (Oyun.dunya) Oyun.dunya.kameraGit(Oyun.secim.sehir);
    Oyun.bildir("Kayıt açıldı: " + sim.gun + ". gün, " + Math.floor(sim.saat) + ":00");
    Arayuz.ciz(sim, Oyun.secim);
    return sim;
  };

  /* ------------------------------------------------------------------ yardımcı */
  Oyun.bildir = function (metin) {
    var kutu = document.getElementById("ipucu");
    if (kutu) {
      kutu.textContent = metin;
      kutu.classList.remove("gizli");
      clearTimeout(Oyun._bildirZaman);
      Oyun._bildirZaman = setTimeout(function () { kutu.classList.add("gizli"); }, 4200);
    }
    return metin;
  };

  Oyun.perdeGoster = function (baslik, metin) {
    document.getElementById("perdeBaslik").textContent = baslik;
    document.getElementById("perdeMetin").textContent = metin;
    document.getElementById("perde").classList.remove("gizli");
  };

  Oyun.yardimMetni = function () {
    return "Altı şehir, altı mal, bir kervan ve senin ticaret aklın. Şehir seç, pazardan mal al, " +
      "kervanı kârlı güzergâha sal, varışta sat. Fiyatlar sabit değil: stok azalınca yükselir, " +
      "hava ve yol güvenliği nakliyeyi pahalılaştırır. 3. gün ana geçit heyelandan kapanacak — " +
      "alternatif yolları ve fiyat farklarını önceden gör. Kaydet ve Yükle butonları ilerlemeni saklar. " +
      "Sol tık: döndür · Tekerlek: yakınlaş · Sağ tık / Shift + sürükle: kaydır.";
  };

  kok.Oyun = Oyun;
  kok.addEventListener("load", function () {
    if (!kok.THREE) {
      console.warn("three.js CDN'den yüklenemedi; dünya katmanı devre dışı.");
    }
    Oyun.baslat();
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
