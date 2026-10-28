/* =========================================================
   NumexShop — Arayüz katmanı (her şeyi birbirine bağlar)
   ========================================================= */
(function (global) {
  "use strict";

  var V = global.NumexVeri;
  var S = global.NumexSepet;
  var O = global.NumexOdeme;
  var $ = function (sec, kok) { return (kok || document).querySelector(sec); };
  var $$ = function (sec, kok) { return Array.prototype.slice.call((kok || document).querySelectorAll(sec)); };
  var para = V.paraBicim;

  /* ---------------- Uygulama durumu (yalnızca görünüm) ---------------- */
  var ui = {
    kategori: "tumu",
    arama: "",
    siralama: "onerilen",
    odemeAdim: 1,
    form: { ad: "", eposta: "", telefon: "", adres: "", kartno: "", sonkullanma: "", cvv: "" },
    sonSiparis: null
  };

  /* ---------------- Bildirim ---------------- */
  function bildir(mesaj, tip) {
    var alan = $("#bildirim-alani");
    if (!alan) return;
    var d = document.createElement("div");
    d.className = "bildirim " + (tip || "");
    d.textContent = mesaj;
    alan.appendChild(d);
    setTimeout(function () {
      d.className += " cikiyor";
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 260);
    }, 2600);
  }

  /* ---------------- Ürünleri süz / sırala ---------------- */
  function suzulmusUrunler() {
    var q = ui.arama.trim().toLowerCase();
    var liste = V.URUNLER.filter(function (u) {
      var katOk = ui.kategori === "tumu" || u.kategori === ui.kategori;
      if (!katOk) return false;
      if (!q) return true;
      var metin = (u.ad + " " + u.aciklama + " " + u.kategori).toLowerCase();
      return metin.indexOf(q) !== -1;
    });

    var sirali = liste.slice();
    if (ui.siralama === "artan") sirali.sort(function (a, b) { return a.fiyat - b.fiyat; });
    else if (ui.siralama === "azalan") sirali.sort(function (a, b) { return b.fiyat - a.fiyat; });
    else if (ui.siralama === "puan") sirali.sort(function (a, b) { return b.puan - a.puan; });
    else if (ui.siralama === "stok") sirali.sort(function (a, b) { return b.stok - a.stok; });
    return sirali;
  }

  function yildizlar(puan) {
    var dolu = Math.round(puan);
    var s = "";
    for (var i = 0; i < 5; i++) s += i < dolu ? "★" : "☆";
    return s;
  }

  function kategoriAdi(id) {
    for (var i = 0; i < V.KATEGORILER.length; i++) {
      if (V.KATEGORILER[i].id === id) return V.KATEGORILER[i].ad;
    }
    return id;
  }

  /* ---------------- Kategoriler ---------------- */
  function kategorileriCiz() {
    var kap = $("#kategori-listesi");
    if (!kap) return;
    kap.innerHTML = "";
    V.KATEGORILER.forEach(function (k) {
      var adet = k.id === "tumu"
        ? V.URUNLER.length
        : V.URUNLER.filter(function (u) { return u.kategori === k.id; }).length;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "kat-btn" + (ui.kategori === k.id ? " aktif" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", ui.kategori === k.id ? "true" : "false");
      b.dataset.kat = k.id;
      b.textContent = k.ad + " (" + adet + ")";
      kap.appendChild(b);
    });
  }

  /* ---------------- Ürün kartları ---------------- */
  function urunleriCiz() {
    var izgara = $("#urun-izgara");
    var bos = $("#bos-durum");
    var liste = suzulmusUrunler();

    $("#liste-baslik").textContent = ui.kategori === "tumu" ? "Tüm Ürünler" : kategoriAdi(ui.kategori);
    var toplamStok = liste.reduce(function (t, u) { return t + u.stok; }, 0);
    $("#sonuc-sayisi").textContent = liste.length + " ürün · " + toplamStok + " adet stokta";

    izgara.innerHTML = "";
    bos.hidden = liste.length !== 0;
    if (!liste.length) return;

    liste.forEach(function (u, i) {
      var kart = document.createElement("article");
      kart.className = "urun-kart";
      kart.style.animationDelay = Math.min(i * 35, 320) + "ms";

      var stokEtiketi = "";
      var durumSinifi = "";
      if (u.stok <= 0) { stokEtiketi = "Tükendi"; durumSinifi = "tukendi"; }
      else if (u.stok <= 5) { stokEtiketi = "Son " + u.stok + " adet"; durumSinifi = "az"; }
      else if (u.etiket) { stokEtiketi = u.etiket; }
      else if (u.eskiFiyat) { stokEtiketi = "İndirim"; }

      var etiketHtml = stokEtiketi
        ? '<span class="etiket ' + durumSinifi + '">' + kacir(stokEtiketi) + "</span>"
        : "";

      var fiyatHtml = u.eskiFiyat
        ? "₺" + u.fiyat.toLocaleString("tr-TR") + "<s>" + (u.eskiFiyat).toLocaleString("tr-TR") + " ₺</s>"
        : "₺" + u.fiyat.toLocaleString("tr-TR");

      /* Animasyon bitince kartı sabitle — hover dışında transform değişmesin (tıklama stabilitesi) */
      kart.addEventListener("animationend", function () {
        kart.classList.add("animasyon-bitti");
      }, { once: true });

      kart.innerHTML =
        '<div class="urun-gorsel" aria-hidden="true">' + etiketHtml + u.ikon + "</div>" +
        '<div class="urun-govde">' +
          '<span class="urun-kategori">' + kacir(kategoriAdi(u.kategori)) + "</span>" +
          '<h3 class="urun-ad">' + kacir(u.ad) + "</h3>" +
          '<p class="urun-aciklama">' + kacir(u.aciklama) + "</p>" +
          '<div class="urun-meta">' +
            '<span class="yildiz" title="' + u.puan + ' / 5">' + yildizlar(u.puan) + "</span>" +
            "<span>" + u.puan.toFixed(1) + " · " + u.yorum + " yorum</span>" +
          "</div>" +
          '<div class="urun-meta"><span>Stok: <b>' + u.stok + "</b></span>" +
            (u.stok > 5 ? "<span style='color:var(--iyi)'>Hızlı kargo</span>" : "") +
          "</div>" +
          '<div class="urun-alt">' +
            '<span class="fiyat">' + fiyatHtml + "</span>" +
            '<button class="ekle-btn" type="button" data-ekle="' + u.id + '"' +
              (u.stok <= 0 ? " disabled" : "") + ">" +
              (u.stok <= 0 ? "Stokta Yok" : "Sepete Ekle") +
            "</button>" +
          "</div>" +
        "</div>";

      izgara.appendChild(kart);
    });
  }

  function kacir(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- Hero istatistikleri ---------------- */
  function heroCiz() {
    var adet = V.URUNLER.length;
    var toplamStok = V.URUNLER.reduce(function (t, u) { return t + u.stok; }, 0);
    var ortPuan = V.URUNLER.reduce(function (t, u) { return t + u.puan; }, 0) / adet;
    var kap = $("#hero-istatistik");
    if (kap) {
      kap.innerHTML =
        "<span><b>" + adet + "</b> ürün</span>" +
        "<span><b>" + toplamStok + "</b> adet stok</span>" +
        "<span>Ortalama <b>★ " + ortPuan.toFixed(1) + "</b></span>";
    }
    var stokMini = $("#hero-stok-mini");
    if (stokMini) stokMini.textContent = toplamStok + " adet";
  }

  /* ---------------- Sepet çekmecesi ---------------- */
  function sepetCiz() {
    var govde = $("#sepet-govde");
    var satirlar = S.satirlariVer();
    var ozet = S.ozet();

    $("#sepet-adet").textContent = ozet.adet;
    $("#cekmec-adet").textContent = ozet.adet;

    govde.innerHTML = "";
    if (!satirlar.length) {
      govde.innerHTML = '<p class="sepet-bos">Sepetin henüz boş.<br>Beğendiğin ürünü ekle, gerisini biz hallederiz.</p>';
    } else {
      satirlar.forEach(function (s) {
        var d = document.createElement("div");
        d.className = "sepet-satir";
        d.innerHTML =
          '<div class="satir-gorsel" aria-hidden="true">' + s.ikon + "</div>" +
          "<div>" +
            '<div class="satir-ad">' + kacir(s.ad) + "</div>" +
            '<div class="satir-fiyat">' + para(s.fiyat) + " × " + s.adet + " · stok " + s.stok + "</div>" +
          "</div>" +
          '<div class="satir-sag">' +
            '<div class="adet-kutu">' +
              '<button type="button" data-azalt="' + s.id + '" aria-label="Azalt"' + (s.adet <= 1 ? " disabled" : "") + ">−</button>" +
              "<span>" + s.adet + "</span>" +
              '<button type="button" data-artir="' + s.id + '" aria-label="Artır"' + (s.adet >= s.stok ? " disabled" : "") + ">+</button>" +
            "</div>" +
            '<div class="satir-toplam">' + para(s.toplam) + "</div>" +
            '<button class="satir-sil" type="button" data-sil="' + s.id + '">Kaldır</button>' +
          "</div>";
        govde.appendChild(d);
      });
    }

    ozetCiz(ozet);
    heroSepetMiniCiz();
  }

  function ozetCiz(ozet) {
    var dl = $("#sepet-ozet");
    var html = "";
    html += '<div class="ozet-satir"><span>Ara toplam</span><b>' + para(ozet.araToplam) + "</b></div>";
    if (ozet.indirim > 0) {
      html += '<div class="ozet-satir indirim"><span>İndirim (' + kacir(ozet.kuponKodu) + ")</span><b>−" + para(ozet.indirim) + "</b></div>";
    }
    html += '<div class="ozet-satir"><span>Kargo</span><b>' +
      (ozet.kargo > 0 ? para(ozet.kargo) : (ozet.adet ? "Bedava" : "—")) + "</b></div>";
    if (ozet.adet && !ozet.kargoBedava && ozet.kargoEsikKalan > 0) {
      html += '<div class="ozet-satir"><span>Ücretsiz kargoya</span><b>' + para(ozet.kargoEsikKalan) + " kaldı</b></div>";
    }
    if (ozet.adet) {
      html += '<div class="ozet-satir"><span>Dahil KDV (%' + V.KDV_ORANI + ")</span><b>" + para(ozet.kdv) + "</b></div>";
    }
    html += '<div class="ozet-satir toplam"><span>Genel Toplam</span><b>' + para(ozet.genelToplam) + "</b></div>";
    dl.innerHTML = html;

    var btn = $("#odeme-basla");
    btn.disabled = ozet.adet === 0;

    /* Kupon alanı: uygulanmışsa mesaj ve kaldırma imkânı */
    var kuponMesaj = $("#kupon-mesaj");
    if (ozet.kupon) {
      kuponMesaj.hidden = false;
      kuponMesaj.className = "kupon-mesaj iyi";
      kuponMesaj.textContent = "✓ " + ozet.kupon.aciklama + " (kaldırmak için X)";
      $("#kupon-kod").value = ozet.kupon.kod;
      $("#kupon-uygula").textContent = "Kaldır";
    } else {
      if (!$("#kupon-kod").value.trim()) kuponMesaj.hidden = true;
      $("#kupon-uygula").textContent = "Uygula";
    }
  }

  function heroSepetMiniCiz() {
    var mini = $("#hero-sepet-mini");
    if (mini) mini.textContent = para(S.ozet().genelToplam);
  }

  /* ---------------- Çekmece aç/kapa ---------------- */
  function cekmeceAcil(acik) {
    var c = $("#sepet-cekmec");
    var perde = $("#perde");
    c.classList.toggle("acik", acik);
    c.setAttribute("aria-hidden", acik ? "false" : "true");
    perde.hidden = !acik;
    document.body.style.overflow = acik ? "hidden" : "";
  }

  /* ---------------- Sepet kartlarındaki stok göstergesi ---------------- */
  function kartButonGuncelle() {
    $$("[data-ekle]").forEach(function (b) {
      var id = b.dataset.ekle;
      var urun = V.urunBul(id);
      if (!urun) return;
      var kalan = S.kalanStok(id);
      if (urun.stok <= 0) {
        b.disabled = true;
        b.textContent = "Stokta Yok";
      } else if (kalan <= 0) {
        b.disabled = true;
        b.textContent = "Sepette Tamamı";
      } else {
        b.disabled = false;
        b.textContent = "Sepete Ekle";
      }
    });
  }

  /* ---------------- Ödeme modalı ---------------- */
  function odemeAcil() {
    var ozet = S.ozet();
    if (!ozet.adet) { bildir("Sepetin boş kanka.", "kotu"); return; }
    var eksikler = S.stokDogrula();
    if (eksikler.length) {
      bildir(eksikler[0].mesaj, "kotu");
      return;
    }
    $("#odeme-modal").hidden = false;
    adimGoster(1);
  }

  function odemeKapat() { $("#odeme-modal").hidden = true; }

  function adimGoster(adim) {
    ui.odemeAdim = adim;
    $$(".adim-alan").forEach(function (a) {
      a.classList.toggle("aktif", Number(a.dataset.adim) === adim);
    });
    $$(".adim").forEach(function (s) {
      var n = Number(s.dataset.adim);
      s.classList.toggle("aktif", n === adim);
      s.classList.toggle("tamam", n < adim);
    });
    $("#geri-btn").hidden = adim === 1;
    $("#ileri-btn").textContent = adim === 1 ? "Ödemeye Geç" : (adim === 2 ? "Siparişi Onayla" : "Alışverişe Devam");
    if (adim === 3) onayCiz();
  }

  function hatalariGoster(hatalar) {
    $$(".hata").forEach(function (h) { h.textContent = ""; });
    $$(".gecersiz").forEach(function (i) { i.classList.remove("gecersiz"); });
    Object.keys(hatalar || {}).forEach(function (alan) {
      var h = $('[data-hata="' + alan + '"]');
      if (h) h.textContent = hatalar[alan];
      var inp = document.getElementById(alan);
      if (inp) {
        inp.classList.add("gecersiz");
        if (alan === hatalar.__ilk) inp.focus();
      }
    });
    var ilk = Object.keys(hatalar || {})[0];
    if (ilk) {
      var el = document.getElementById(ilk);
      if (el) el.focus();
    }
  }

  function formDegerleriOku() {
    ["ad", "eposta", "telefon", "adres", "kartno", "sonkullanma", "cvv"].forEach(function (a) {
      var el = document.getElementById(a);
      if (el) ui.form[a] = el.value;
    });
    return ui.form;
  }

  function onayCiz() {
    var ozet = S.ozet();
    var satirlar = S.satirlariVer();
    var f = ui.form;
    var li = satirlar.map(function (s) {
      return "<li><span>" + kacir(s.ad) + " × " + s.adet + "</span><b>" + para(s.toplam) + "</b></li>";
    }).join("");

    $("#onay-ozet").innerHTML =
      '<div class="onay-blok"><h3>Teslimat</h3>' +
        "<p><b>" + kacir(f.ad) + "</b><br>" + kacir(f.adres) + "<br>" + kacir(f.eposta) + " · " + kacir(f.telefon) + "</p>" +
      "</div>" +
      '<div class="onay-blok"><h3>Ödeme</h3><p><b>' + kacir(O.kartMaskele(f.kartno)) + "</b>" +
        (O.kartMarkasi(f.kartno.replace(/\D/g, "")) ? " · " + O.kartMarkasi(f.kartno.replace(/\D/g, "")) : "") +
      "</p></div>" +
      '<div class="onay-blok"><h3>Sipariş Özeti</h3><ul class="onay-liste">' + li + "</ul>" +
        '<div class="ozet-satir" style="margin-top:10px"><span>Kargo</span><b>' + (ozet.kargo ? para(ozet.kargo) : "Bedava") + "</b></div>" +
        (ozet.indirim ? '<div class="ozet-satir indirim"><span>İndirim</span><b>−' + para(ozet.indirim) + "</b></div>" : "") +
        '<div class="ozet-satir toplam"><span>Genel Toplam</span><b>' + para(ozet.genelToplam) + "</b></div>" +
      "</div>";
  }

  function ileriTikla() {
    var veri = formDegerleriOku();

    if (ui.odemeAdim === 3) {
      basariKapat();
      cekmeceAcil(false);
      odemeKapat();
      return;
    }

    var sonuc = O.adimDogrula(ui.odemeAdim, veri);
    if (!sonuc.gecerli) {
      hatalariGoster(sonuc.hatalar);
      bildir("Birkaç alanı düzeltelim.", "kotu");
      return;
    }
    hatalariGoster({});
    adimGoster(ui.odemeAdim + 1);
  }

  function siparisiTamamla() {
    var ozet = S.ozet();
    var satirlar = S.satirlariVer();
    var siparis = O.siparisOlustur(formDegerleriOku(), ozet, satirlar);
    var dusen = S.stokDus();
    O.siparisKaydet(siparis, dusen);
    ui.sonSiparis = siparis;

    /* Sipariş sonrası: sepeti boşalt, stokları yeniden çiz */
    S.temizle();
    heroCiz();
    urunleriCiz();
    kartButonGuncelle();

    adimGoster(3);
    basariGoster(siparis);
  }

  function basariGoster(siparis) {
    $("#siparis-kod").textContent = "Sipariş No: " + siparis.kod;
    var satirlar = siparis.urunler.map(function (u) {
      return '<div class="satir"><span>' + kacir(u.ad) + " × " + u.adet + "</span><b>" + para(u.toplam) + "</b></div>";
    }).join("");
    $("#siparis-detay").innerHTML =
      satirlar +
      '<div class="satir"><span>Kargo</span><b>' + (siparis.kargo ? para(siparis.kargo) : "Bedava") + "</b></div>" +
      (siparis.indirim ? '<div class="satir" style="color:var(--iyi)"><span>İndirim</span><b>−' + para(siparis.indirim) + "</b></div>" : "") +
      '<div class="satir" style="border-top:1px solid var(--cizgi);margin-top:8px;padding-top:8px"><span>Ödenen</span><b>' + para(siparis.genelToplam) + "</b></div>" +
      '<div class="satir"><span>Tahmini teslim</span><b>' + siparis.tahminiTeslim + "</b></div>" +
      '<div class="satir"><span>Kart</span><b>' + kacir(siparis.kart) + "</b></div>";
    odemeKapat();
    $("#basari-modal").hidden = false;
  }

  function basariKapat() {
    $("#basari-modal").hidden = true;
    bildir("Bizi tercih ettiğin için sağ ol!", "iyi");
  }

  /* ---------------- Kupon işlemleri ---------------- */
  function kuponTikla() {
    var btn = $("#kupon-uygula");
    if (btn.textContent === "Kaldır") {
      var r = S.kuponKaldir();
      bildir(r.mesaj, "iyi");
      $("#kupon-kod").value = "";
      $("#kupon-mesaj").hidden = true;
      return;
    }
    var kod = $("#kupon-kod").value;
    var sonuc = S.kuponUygula(kod);
    var mesaj = $("#kupon-mesaj");
    mesaj.hidden = false;
    mesaj.className = "kupon-mesaj " + (sonuc.gecerli ? "iyi" : "kotu");
    mesaj.textContent = sonuc.gecerli ? "✓ " + sonuc.aciklama : sonuc.mesaj;
    if (sonuc.gecerli) bildir(sonuc.mesaj, "iyi");
  }

  /* ---------------- Olay bağlama ---------------- */
  function olaylariBagla() {
    /* Kategori */
    $("#kategori-listesi").addEventListener("click", function (e) {
      var b = e.target.closest("[data-kat]");
      if (!b) return;
      ui.kategori = b.dataset.kat;
      kategorileriCiz();
      urunleriCiz();
      kartButonGuncelle();
    });

    /* Arama */
    var arama = $("#arama");
    var zaman = null;
    arama.addEventListener("input", function () {
      var temizleBtn = $("#arama-temizle");
      temizleBtn.hidden = !arama.value;
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        ui.arama = arama.value;
        urunleriCiz();
        kartButonGuncelle();
      }, 140);
    });
    $("#arama-temizle").addEventListener("click", function () {
      arama.value = "";
      ui.arama = "";
      $("#arama-temizle").hidden = true;
      urunleriCiz();
      kartButonGuncelle();
      arama.focus();
    });

    /* Sıralama */
    $("#siralama").addEventListener("change", function () {
      ui.siralama = this.value;
      urunleriCiz();
      kartButonGuncelle();
    });

    /* Filtre sıfırla */
    $("#filtre-sifirla").addEventListener("click", function () {
      ui.kategori = "tumu";
      ui.arama = "";
      ui.siralama = "onerilen";
      $("#arama").value = "";
      $("#arama-temizle").hidden = true;
      $("#siralama").value = "onerilen";
      kategorileriCiz();
      urunleriCiz();
      kartButonGuncelle();
    });

    /* Sepete ekle (olay delegasyonu) */
    $("#urun-izgara").addEventListener("click", function (e) {
      var b = e.target.closest("[data-ekle]");
      if (!b || b.disabled) return;
      var sonuc = S.ekle(b.dataset.ekle, 1);
      if (sonuc.basarili) {
        bildir(sonuc.mesaj, sonuc.kismi ? "" : "iyi");
        var rozet = $("#sepet-adet");
        rozet.classList.remove("patla");
        void rozet.offsetWidth;
        rozet.classList.add("patla");
      } else {
        bildir(sonuc.mesaj, "kotu");
      }
      kartButonGuncelle();
    });

    /* Çekmece */
    $("#sepet-btn").addEventListener("click", function () { sepetCiz(); cekmeceAcil(true); });
    $("#sepet-kapat").addEventListener("click", function () { cekmeceAcil(false); });
    $("#perde").addEventListener("click", function () { cekmeceAcil(false); });

    /* Sepet içi işlemler (delegasyon) */
    $("#sepet-govde").addEventListener("click", function (e) {
      var art = e.target.closest("[data-artir]");
      var az = e.target.closest("[data-azalt]");
      var sil = e.target.closest("[data-sil]");
      var sonuc = null;
      if (art) sonuc = S.artir(art.dataset.artir);
      else if (az) sonuc = S.azalt(az.dataset.azalt);
      else if (sil) { sonuc = S.sil(sil.dataset.sil); if (sonuc.basarili) bildir(sonuc.mesaj, ""); }
      if (sonuc && !sonuc.basarili && sonuc.mesaj) bildir(sonuc.mesaj, "kotu");
      kartButonGuncelle();
    });

    /* Sepet boşalt */
    $("#sepet-temizle").addEventListener("click", function () {
      if (!S.toplamAdet()) { bildir("Sepet zaten boş.", ""); return; }
      var r = S.temizle();
      $("#kupon-kod").value = "";
      $("#kupon-mesaj").hidden = true;
      bildir(r.mesaj, "");
      kartButonGuncelle();
    });

    /* Kupon */
    $("#kupon-uygula").addEventListener("click", kuponTikla);
    $("#kupon-kod").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); kuponTikla(); }
    });
    $("#kupon-tanitim").addEventListener("click", function () {
      sepetCiz();
      cekmeceAcil(true);
      $("#kupon-kod").value = "NUMEX10";
      $("#kupon-kod").focus();
      bildir("NUMEX10 kodunu deneyebilirsin (min. 500 TL).", "");
    });

    /* Ödeme akışı */
    $("#odeme-basla").addEventListener("click", odemeAcil);
    $("#odeme-kapat").addEventListener("click", odemeKapat);
    $("#geri-btn").addEventListener("click", function () {
      if (ui.odemeAdim > 1) adimGoster(ui.odemeAdim - 1);
    });
    $("#ileri-btn").addEventListener("click", function () {
      if (ui.odemeAdim === 2) {
        var sonuc = O.adimDogrula(2, formDegerleriOku());
        if (!sonuc.gecerli) { hatalariGoster(sonuc.hatalar); bildir("Kart bilgilerini kontrol et.", "kotu"); return; }
        siparisiTamamla();
      } else {
        ileriTikla();
      }
    });
    $("#basari-kapat").addEventListener("click", basariKapat);

    /* Ödeme formu alanları: canlı maske + anlık doğrulama */
    var kart = $("#kartno"), skt = $("#sonkullanma"), tel = $("#telefon");
    kart.addEventListener("input", function () {
      var p = this.selectionStart, uzunluk = this.value.length;
      this.value = O.kartBicimle(this.value);
      if (p !== null && this.value.length !== uzunluk) this.setSelectionRange(this.value.length, this.value.length);
      anlikDogrula(this, "kartno");
    });
    skt.addEventListener("input", function () {
      this.value = O.sonKullanmaBicimle(this.value);
      anlikDogrula(this, "sonkullanma");
    });
    tel.addEventListener("input", function () {
      this.value = O.telefonBicimle(this.value);
      anlikDogrula(this, "telefon");
    });
    $("#cvv").addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 4);
      anlikDogrula(this, "cvv");
    });
    ["ad", "eposta", "adres"].forEach(function (a) {
      var el = document.getElementById(a);
      el.addEventListener("blur", function () { anlikDogrula(this, a); });
    });

    /* Klavye: ESC ile kapat */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!$("#basari-modal").hidden) return;              /* başarıyı ESC ile kapatma */
      if (!$("#odeme-modal").hidden) odemeKapat();
      else if ($("#sepet-cekmec").classList.contains("acik")) cekmeceAcil(false);
    });

    /* Sepet değiştiğinde arayüzü tazele */
    global.addEventListener("sepet:degisti", function () {
      sepetCiz();
    });
  }

  function anlikDogrula(el, alan) {
    var h = O.tekAlanDogrula(alan, el.value);
    var kutu = $('[data-hata="' + alan + '"]');
    if (kutu) kutu.textContent = h;
    el.classList.toggle("gecersiz", !!h && el.value.trim().length > 0);
  }

  /* ---------------- Başlat ---------------- */
  function baslat() {
    yukleKuponFromStorage();
    kategorileriCiz();
    urunleriCiz();
    sepetCiz();
    heroCiz();
    kartButonGuncelle();
    olaylariBagla();
    bildir("Hoş geldin! Sepete bir şeyler at, mantığı gör.", "");
  }

  function yukleKuponFromStorage() {
    var ozet = S.ozet();
    if (ozet.kupon) {
      var m = $("#kupon-mesaj");
      m.hidden = false;
      m.className = "kupon-mesaj iyi";
      m.textContent = "✓ " + ozet.kupon.aciklama;
      $("#kupon-kod").value = ozet.kupon.kod;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }
})(window);
