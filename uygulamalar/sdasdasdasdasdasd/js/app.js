/* ============================================================
   Minik Yıldızlar — sayfa etkileşimleri
   Menü, kaydırma efekti, canlı sayılar, yıl.
   ============================================================ */
(function () {
  "use strict";

  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Üst menü: kaydırınca gölge ---------- */
  var ust = document.getElementById("ust");

  /* ---------- Mobil menü ---------- */
  var menu = document.getElementById("menu");
  var menuAc = document.getElementById("menuAc");

  function menuyuKapat() {
    if (!menu || !menuAc) return;
    menu.classList.remove("acik");
    menuAc.setAttribute("aria-expanded", "false");
    menuAc.setAttribute("aria-label", "Menüyü aç");
  }

  if (menuAc && menu) {
    menuAc.addEventListener("click", function () {
      var acik = menu.classList.toggle("acik");
      menuAc.setAttribute("aria-expanded", acik ? "true" : "false");
      menuAc.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) menuyuKapat();
    });

    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("acik")) return;
      if (menu.contains(e.target) || menuAc.contains(e.target)) return;
      menuyuKapat();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") menuyuKapat();
    });
  }

  /* ---------- Bölüm bağlantıları: başlık menünün altında kalmasın ----------
     Yapışkan menü varken tarayıcının kendi atlaması hedefi menünün arkasına
     gömüyordu (#oyun'da skor satırı kesiliyordu). Bu yüzden kaydırmayı biz yapıyoruz. */
  function bolumeGit(hedefId, gecikmesiz) {
    var hedef = document.getElementById(hedefId);
    if (!hedef) return;
    var menulAlt = ust ? ust.getBoundingClientRect().bottom : 0;
    var ustBosluk = Math.max(menulAlt, 0) + 18;
    var y = hedef.getBoundingClientRect().top + window.pageYOffset - ustBosluk;
    window.scrollTo({ top: Math.max(y, 0), behavior: (gecikmesiz || azHareket) ? "auto" : "smooth" });
    /* Adres çubuğunda bağlantı görünsün, sayfa ikinci kez zıplamasın */
    if (history.replaceState) history.replaceState(null, "", "#" + hedefId);
  }

  document.addEventListener("click", function (e) {
    var bag = e.target.closest('a[href^="#"]');
    if (!bag) return;
    var hedefId = bag.getAttribute("href").slice(1);
    if (!hedefId || !document.getElementById(hedefId)) return;
    e.preventDefault();
    bolumeGit(hedefId);
  });

  /* Sayfa doğrudan bir bölüm bağlantısıyla açıldıysa (ör. site.com/#oyun) */
  if (window.location.hash.length > 1) {
    var ilkHedef = window.location.hash.slice(1);
    if (document.getElementById(ilkHedef)) {
      window.addEventListener("load", function () { bolumeGit(ilkHedef, true); });
    }
  }

  /* ---------- Kaydırma: yapışkan menü gölgesi ---------- */
  var kaydirmaIstegi = 0;
  function kaydirmaDurumu() {
    kaydirmaIstegi = 0;
    if (!ust) return;
    ust.classList.toggle("yapiskan", window.scrollY > 24);
  }
  window.addEventListener("scroll", function () {
    if (!kaydirmaIstegi) kaydirmaIstegi = requestAnimationFrame(kaydirmaDurumu);
  }, { passive: true });
  kaydirmaDurumu();

  /* ---------- Bölümler kaydırınca belirsin ---------- */
  var belirenler = document.querySelectorAll(".gorunen");

  if (!("IntersectionObserver" in window) || azHareket) {
    belirenler.forEach(function (el) { el.classList.add("gorundu"); });
  } else {
    var gozlemci = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (giris) {
        if (!giris.isIntersecting) return;
        var el = giris.target;
        /* Aynı satırdaki kartlar sırayla belirsin */
        var kardesler = Array.prototype.slice.call(el.parentElement.children);
        var sira = kardesler.filter(function (k) { return k.classList.contains("gorunen"); }).indexOf(el);
        el.style.transitionDelay = Math.min(sira, 5) * 90 + "ms";
        el.classList.add("gorundu");
        gozlemci.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    belirenler.forEach(function (el) { gozlemci.observe(el); });

    /* Emniyet ağı: gözlemci bir öğeyi kaçırırsa ya da ekran dışına
       kaydırma olursa 4 saniye sonra hepsi görünür kalsın — içerik asla gizli kalmasın. */
    setTimeout(function () {
      belirenler.forEach(function (el) { el.classList.add("gorundu"); });
    }, 4000);
  }

  /* ---------- Canlı sayılar ---------- */
  var sayilar = document.querySelectorAll("[data-sayi]");

  function sayiyiBüyüt(el) {
    var hedef = parseInt(el.getAttribute("data-sayi"), 10) || 0;
    if (azHareket) { el.textContent = hedef; return; }
    var baslangic = performance.now();
    var sure = 1100;
    function adim(simdi) {
      var oran = Math.min((simdi - baslangic) / sure, 1);
      var yumusak = 1 - Math.pow(1 - oran, 3);
      el.textContent = Math.round(hedef * yumusak);
      if (oran < 1) requestAnimationFrame(adim);
      else el.textContent = hedef;
    }
    requestAnimationFrame(adim);
  }

  if (sayilar.length) {
    if (!("IntersectionObserver" in window)) {
      sayilar.forEach(sayiyiBüyüt);
    } else {
      var sayiGozlemci = new IntersectionObserver(function (girisler) {
        girisler.forEach(function (giris) {
          if (!giris.isIntersecting) return;
          sayiyiBüyüt(giris.target);
          sayiGozlemci.unobserve(giris.target);
        });
      }, { threshold: 0.5 });
      sayilar.forEach(function (el) { sayiGozlemci.observe(el); });
    }
  }

  /* ---------- Hover sesi gerektiren dokunmatik ayarı ---------- */
  document.documentElement.classList.add("js-hazir");

  /* ---------- Yıl ---------- */
  var yil = document.getElementById("yil");
  if (yil) yil.textContent = new Date().getFullYear();
})();
