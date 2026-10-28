/* =========================================================
   Elif Demirsoy — Portfolyo davranışları
   1) tema (karanlık mod, hatırlanır)  2) mobil menü
   3) proje kartı aç/kapa              4) iletişim formu + teşekkür
   5) üst bar gölgesi, yıl, yukarı çık
   ========================================================= */
(function () {
  "use strict";

  var html = document.documentElement;
  var TEMA_ANAHTAR = "ed-tema";
  var temaDugme = document.getElementById("temaDugme");

  /* ---------------- 1) KARANLIK MOD ---------------- */
  function sistemTemasi() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "karanlik"
      : "acik";
  }

  function temayiUygula(tema, kaydet) {
    var karanlik = tema === "karanlik";
    html.setAttribute("data-tema", karanlik ? "karanlik" : "acik");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", karanlik ? "#151114" : "#f4efe6");

    if (temaDugme) {
      var ipucu = karanlik ? "Aydınlık moda geç" : "Karanlık moda geç";
      temaDugme.setAttribute("aria-pressed", karanlik ? "true" : "false");
      temaDugme.setAttribute("title", ipucu);
      temaDugme.setAttribute("aria-label", ipucu);
      /* Görünen yazı da güncellenmeli: index.html:53'te sabit "Karanlık mod"
         yazıyordu, JS yalnızca title/aria değiştirdiği için düğme tema
         değişse de hep aynı yazıyordu. */
      var gorunenEtiket = temaDugme.querySelector(".tema-dugme__etiket");
      if (gorunenEtiket) gorunenEtiket.textContent = karanlik ? "Aydınlık mod" : "Karanlık mod";
    }
    if (kaydet) {
      try { localStorage.setItem(TEMA_ANAHTAR, karanlik ? "karanlik" : "acik"); } catch (e) {}
    }
  }

  var kayitliTema = null;
  try { kayitliTema = localStorage.getItem(TEMA_ANAHTAR); } catch (e) {}
  temayiUygula(kayitliTema === "karanlik" || kayitliTema === "acik" ? kayitliTema : sistemTemasi(), false);

  if (temaDugme) {
    temaDugme.addEventListener("click", function () {
      temayiUygula(html.getAttribute("data-tema") === "karanlik" ? "acik" : "karanlik", true);
    });
  }

  /* Kullanıcı seçim yapmadıysa sistem temasını izle */
  if (window.matchMedia) {
    var sorgu = window.matchMedia("(prefers-color-scheme: dark)");
    var dinle = function (e) {
      var secim = null;
      try { secim = localStorage.getItem(TEMA_ANAHTAR); } catch (err) {}
      if (!secim) temayiUygula(e.matches ? "karanlik" : "acik", false);
    };
    if (sorgu.addEventListener) sorgu.addEventListener("change", dinle);
    else if (sorgu.addListener) sorgu.addListener(dinle);
  }

  /* ---------------- 2) MOBİL MENÜ ---------------- */
  var menu = document.getElementById("menu");
  var menuDugme = document.getElementById("menuDugme");

  function menuyuKapat() {
    if (!menu || !menuDugme) return;
    menu.classList.remove("acik");
    menuDugme.setAttribute("aria-expanded", "false");
    menuDugme.setAttribute("aria-label", "Menüyü aç");
  }

  if (menuDugme && menu) {
    menuDugme.addEventListener("click", function () {
      var acik = menu.classList.toggle("acik");
      menuDugme.setAttribute("aria-expanded", acik ? "true" : "false");
      menuDugme.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) menuyuKapat();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") menuyuKapat();
    });

    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("acik")) return;
      if (menu.contains(e.target) || menuDugme.contains(e.target)) return;
      menuyuKapat();
    });
  }

  /* ---------------- 3) PROJE KARTLARI → BÜYÜK GÖRÜNÜM ---------------- */
  var kartlar = Array.prototype.slice.call(document.querySelectorAll(".kart"));
  var buyuk = document.getElementById("buyuk");
  var buyukGorsel = document.getElementById("buyukGorsel");
  var buyukRozet = document.getElementById("buyukRozet");
  var buyukAd = document.getElementById("buyukAd");
  var buyukMeta = document.getElementById("buyukMeta");
  var buyukAciklama = document.getElementById("buyukAciklama");
  var buyukEtiketler = document.getElementById("buyukEtiketler");
  var buyukSayac = document.getElementById("buyukSayac");
  var suanKac = -1;
  var odakGeri = null;

  function kartVerisi(kart) {
    var gorsel = kart.querySelector(".kart__kapak img");
    var detay = kart.querySelector(".kart__detay");
    var etiketler = detay ? Array.prototype.map.call(
      detay.querySelectorAll(".etiket-liste li"), function (li) { return li.textContent; }) : [];
    return {
      gorsel: gorsel ? gorsel.getAttribute("src") : "",
      alt: gorsel ? gorsel.getAttribute("alt") : "",
      rozet: (kart.querySelector(".kart__rozet") || {}).textContent || "",
      ad: (kart.querySelector(".kart__ad") || {}).textContent || "",
      meta: (kart.querySelector(".kart__meta") || {}).textContent || "",
      aciklama: detay && detay.querySelector("p") ? detay.querySelector("p").textContent.trim() : "",
      etiketler: etiketler
    };
  }

  function buyukGoster(i) {
    if (!buyuk || !kartlar.length) return;
    suanKac = (i + kartlar.length) % kartlar.length;
    var v = kartVerisi(kartlar[suanKac]);

    buyukGorsel.src = v.gorsel;
    buyukGorsel.alt = v.alt;
    buyukRozet.textContent = v.rozet;
    buyukAd.textContent = v.ad;
    buyukMeta.textContent = v.meta;
    buyukAciklama.textContent = v.aciklama;
    buyukSayac.textContent = (suanKac + 1) + " / " + kartlar.length;
    buyukEtiketler.innerHTML = "";
    v.etiketler.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      buyukEtiketler.appendChild(li);
    });

    if (buyuk.hidden) {
      odakGeri = document.activeElement;
      buyuk.hidden = false;
      document.body.classList.add("kilitli");
    }
    var kapatDugme = buyuk.querySelector(".buyuk__kapat");
    if (kapatDugme) kapatDugme.focus();
  }

  function buyukKapat() {
    if (!buyuk || buyuk.hidden) return;
    buyuk.hidden = true;
    document.body.classList.remove("kilitli");
    if (odakGeri && odakGeri.focus) odakGeri.focus();
    odakGeri = null;
  }

  kartlar.forEach(function (kart, i) {
    var dugme = kart.querySelector(".kart__tikla");
    if (!dugme) return;
    dugme.addEventListener("click", function () {
      dugme.setAttribute("aria-expanded", "true");
      buyukGoster(i);
    });
  });

  if (buyuk) {
    buyuk.addEventListener("click", function (e) {
      if (e.target.closest("[data-kapat]")) buyukKapat();
    });

    var onceki = document.getElementById("oncekiProje");
    var sonraki = document.getElementById("sonrakiProje");
    if (onceki) onceki.addEventListener("click", function () { buyukGoster(suanKac - 1); });
    if (sonraki) sonraki.addEventListener("click", function () { buyukGoster(suanKac + 1); });

    document.addEventListener("keydown", function (e) {
      if (buyuk.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); buyukKapat(); }
      else if (e.key === "ArrowLeft") buyukGoster(suanKac - 1);
      else if (e.key === "ArrowRight") buyukGoster(suanKac + 1);
      else if (e.key === "Tab") {
        /* odağı büyük görünüm içinde tut */
        var odaklar = buyuk.querySelectorAll("button, [href], input, select, textarea");
        if (!odaklar.length) return;
        var ilk = odaklar[0], son = odaklar[odaklar.length - 1];
        if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      }
    });
  }

  /* ---------------- 4) İLETİŞİM FORMU ---------------- */
  var form = document.getElementById("iletisimForm");
  var tesekkur = document.getElementById("tesekkur");
  var tesekkurMetin = document.getElementById("tesekkurMetin");
  var yeniMesaj = document.getElementById("yeniMesaj");

  var kurallar = {
    ad: function (v) {
      if (!v) return "Adınızı yazın.";
      if (v.trim().length < 2) return "En az 2 karakter olmalı.";
      return "";
    },
    eposta: function (v) {
      var d = (v || "").trim();
      if (!d) return "E-posta adresinizi yazın.";
      if (/\s/.test(d)) return "E-posta adresinde boşluk olamaz.";
      if (d.indexOf("@") === -1) return "E-posta adresinde @ işareti eksik (ornek@eposta.com).";
      var parcalar = d.split("@");
      if (parcalar.length !== 2) return "E-posta adresinde yalnızca bir @ olmalı.";
      var yerel = parcalar[0], alan = parcalar[1];
      if (!yerel) return "@ işaretinden önce bir ad yazın.";
      if (yerel.length > 64) return "@ öncesi kısım çok uzun.";
      if (alan.indexOf(".") === -1) return "Alan adı eksik: ornek@eposta.com biçiminde yazın.";
      if (/^[.\-]|[.\-]$|\.\./.test(alan)) return "Alan adı geçersiz görünüyor.";
      if (!/^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ][a-zA-Z0-9.\-]*\.[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,}$/.test(alan))
        return "Alan adı geçersiz (ornek@eposta.com).";
      if (!/^[a-zA-Z0-9._%+\-ğüşıöçĞÜŞİÖÇ]+$/.test(yerel))
        return "@ öncesinde geçersiz karakter var.";
      return "";
    },
    konu: function (v) {
      if (!v) return "Bir konu seçin.";
      return "";
    },
    mesaj: function (v) {
      if (!v) return "Mesajınızı yazın.";
      if (v.trim().length < 10) return "Biraz daha ayrıntı verin (en az 10 karakter).";
      return "";
    }
  };

  function alanKutusu(ad) {
    var alan = form.querySelector("#" + ad);
    return alan ? alan.closest(".alan") : null;
  }

  function hataYaz(ad, mesaj) {
    var kutu = alanKutusu(ad);
    var yazi = form.querySelector('[data-hata="' + ad + '"]');
    if (kutu) kutu.classList.toggle("hatali", !!mesaj);
    if (yazi) yazi.textContent = mesaj || "";
    var alan = form.querySelector("#" + ad);
    if (alan) {
      if (mesaj) alan.setAttribute("aria-invalid", "true");
      else alan.removeAttribute("aria-invalid");
    }
  }

  function dogrula(ad) {
    var alan = form.querySelector("#" + ad);
    if (!alan) return true;
    var mesaj = kurallar[ad](alan.value);
    hataYaz(ad, mesaj);
    return !mesaj;
  }

  if (form) {
    Object.keys(kurallar).forEach(function (ad) {
      var alan = form.querySelector("#" + ad);
      if (!alan) return;
      alan.addEventListener("blur", function () {
        if (alan.value.trim()) dogrula(ad);
      });
      alan.addEventListener("input", function () {
        var kutu = alanKutusu(ad);
        if (kutu && kutu.classList.contains("hatali")) dogrula(ad);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var ilkHatali = null;
      Object.keys(kurallar).forEach(function (ad) {
        if (!dogrula(ad) && !ilkHatali) ilkHatali = form.querySelector("#" + ad);
      });

      if (ilkHatali) {
        ilkHatali.focus();
        return;
      }

      var adDegeri = (form.querySelector("#ad").value || "").trim();
      var dugme = document.getElementById("gonderDugme");
      if (dugme) { dugme.disabled = true; dugme.textContent = "Gönderiliyor…"; }

      /* Sunucu yok: kullanıcıya gerçek gönderim yapılmadığı açıkça söylenir.
         Gerçek bir servis bağlanınca buraya fetch() konur. */
      setTimeout(function () {
        if (tesekkurMetin) {
          tesekkurMetin.textContent =
            "Sayın " + adDegeri + ", mesajınız alındı. Genelde bir iş günü içinde " +
            "e-posta ile dönüş yapıyorum.";
        }
        form.hidden = true;
        if (tesekkur) {
          tesekkur.hidden = false;
          tesekkur.focus();
        }
        if (dugme) { dugme.disabled = false; dugme.textContent = "Mesajı gönder"; }
      }, 700);
    });

    form.addEventListener("reset", function () {
      Object.keys(kurallar).forEach(function (ad) { hataYaz(ad, ""); });
    });
  }

  if (yeniMesaj) {
    yeniMesaj.addEventListener("click", function () {
      if (form) {
        form.reset();
        Object.keys(kurallar).forEach(function (ad) { hataYaz(ad, ""); });
        form.hidden = false;
      }
      if (tesekkur) tesekkur.hidden = true;
      var ad = document.getElementById("ad");
      if (ad) ad.focus();
    });
  }

  /* ---------------- 5) KÜÇÜK DETAYLAR ---------------- */
  var ustBar = document.getElementById("ustBar");
  var yukari = document.getElementById("yukari");

  function kaydirmaDurumu() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (ustBar) ustBar.classList.toggle("kaydirildi", y > 12);
    if (yukari) yukari.hidden = y < 600;
  }
  window.addEventListener("scroll", kaydirmaDurumu, { passive: true });
  kaydirmaDurumu();

  if (yukari) {
    yukari.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var yil = document.getElementById("yil");
  if (yil) yil.textContent = String(new Date().getFullYear());
})();
