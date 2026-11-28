/* ============================================================
   RENKLERİ YAKALA — küçük balon patlatma oyunu
   · Balonlar aşağıdan yükselir, tıklanınca patlar.
   · Patlayan balonun renk adı ekranda görünür.
   · Ses yalnızca ilk dokunuştan sonra çalışır ve kapatılabilir.
   ============================================================ */
(function () {
  "use strict";

  var alan = document.getElementById("oyunAlani");
  if (!alan) return;

  var skorEl = document.getElementById("skor");
  var mesajEl = document.getElementById("oyunMesaj");
  var sesDugme = document.getElementById("sesDugme");
  var sesIkon = document.getElementById("sesIkon");
  var sesYazi = document.getElementById("sesYazi");
  var yeniden = document.getElementById("yeniden");

  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Renkler ---------- */
  var renkler = [
    { ad: "Kırmızı", kod: "#ff5d5d" },
    { ad: "Turuncu", kod: "#ff9f43" },
    { ad: "Sarı", kod: "#ffd23f" },
    { ad: "Yeşil", kod: "#5bcf8a" },
    { ad: "Mavi", kod: "#48b6ff" },
    { ad: "Mor", kod: "#b07bff" },
    { ad: "Pembe", kod: "#ff6fa5" }
  ];

  var tebrik = [
    "Harika!", "Süper!", "Aferin!", "Tam isabet!", "Bravo!", "Yakaladın!"
  ];

  /* ---------- Durum ---------- */
  var skor = 0;
  var calisiyor = false;
  var zamanlayici = null;
  var balonSayaci = 0;
  var sonRenk = "";

  /* ---------- Ses (ilk dokunuştan sonra kurulur) ---------- */
  var sesAcik = true;
  var sesBaglam = null;

  function sesBaglami() {
    if (!sesAcik) return null;
    if (!sesBaglam) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { sesBaglam = new AC(); } catch (e) { return null; }
    }
    if (sesBaglam.state === "suspended") sesBaglam.resume();
    return sesBaglam;
  }

  /* Patlama sesi: kısa, yumuşak bir "pop" */
  function patlamaSesi() {
    var ctx = sesBaglami();
    if (!ctx) return;
    var simdi = ctx.currentTime;

    var osil = ctx.createOscillator();
    var kazanc = ctx.createGain();
    osil.type = "sine";
    osil.frequency.setValueAtTime(660, simdi);
    osil.frequency.exponentialRampToValueAtTime(220, simdi + 0.13);

    kazanc.gain.setValueAtTime(0.0001, simdi);
    kazanc.gain.exponentialRampToValueAtTime(0.18, simdi + 0.012);
    kazanc.gain.exponentialRampToValueAtTime(0.0001, simdi + 0.16);

    osil.connect(kazanc).connect(ctx.destination);
    osil.start(simdi);
    osil.stop(simdi + 0.18);
  }

  function yukariSesi() {
    var ctx = sesBaglami();
    if (!ctx) return;
    var simdi = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach(function (f, i) {
      var osil = ctx.createOscillator();
      var kazanc = ctx.createGain();
      osil.type = "triangle";
      osil.frequency.value = f;
      var bas = simdi + i * 0.09;
      kazanc.gain.setValueAtTime(0.0001, bas);
      kazanc.gain.exponentialRampToValueAtTime(0.12, bas + 0.02);
      kazanc.gain.exponentialRampToValueAtTime(0.0001, bas + 0.22);
      osil.connect(kazanc).connect(ctx.destination);
      osil.start(bas);
      osil.stop(bas + 0.24);
    });
  }

  /* ---------- Ses düğmesi ---------- */
  function sesDugmeGuncelle() {
    if (!sesDugme) return;
    sesDugme.setAttribute("aria-pressed", sesAcik ? "true" : "false");
    sesDugme.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç");
    if (sesYazi) sesYazi.textContent = sesAcik ? "Ses açık" : "Ses kapalı";
    sesDugme.title = sesAcik ? "Sesi kapat" : "Sesi aç";
  }

  if (sesDugme) {
    sesDugme.addEventListener("click", function (e) {
      e.stopPropagation();
      sesAcik = !sesAcik;
      sesDugmeGuncelle();
      /* Kullanıcı etkileşimiyle ses açıldıysa ortamı hazırla */
      if (sesAcik) { sesBaglami(); patlamaSesi(); }
    });
    sesDugmeGuncelle();
  }

  /* ---------- Yardımcılar ---------- */
  function rastgele(min, maks) {
    return Math.random() * (maks - min) + min;
  }

  function alanOlcusu() {
    return { g: alan.clientWidth, y: alan.clientHeight };
  }

  /* ---------- Balon oluştur ---------- */
  function balonYap() {
    if (!calisiyor) return;
    var olcu = alanOlcusu();
    if (olcu.g === 0) return;

    /* Aynı renk üst üste gelmesin (çeşitlilik) */
    var renk;
    do {
      renk = renkler[Math.floor(Math.random() * renkler.length)];
    } while (renk.ad === sonRenk && renkler.length > 1);
    sonRenk = renk.ad;

    var boy = azHareket ? 62 : Math.round(rastgele(54, 86));
    var solSinir = 8;
    var sagSinir = Math.max(solSinir + 10, olcu.g - boy - 8);
    var sol = rastgele(solSinir, sagSinir);
    var sure = (azHareket ? 9 : rastgele(5.8, 9.4)).toFixed(2);

    var balon = document.createElement("button");
    balon.type = "button";
    balon.className = "balon";
    balon.style.setProperty("--renk", renk.kod);
    balon.style.setProperty("--boy", boy + "px");
    balon.style.setProperty("--sure", sure + "s");
    balon.style.setProperty("--yol", olcu.y + "px");
    balon.style.left = sol + "px";
    balon.style.bottom = "-" + (boy * 1.4) + "px";
    balon.setAttribute("aria-label", renk.ad + " balon");
    balon.style.animationDelay = "0s";

    var govde = document.createElement("span");
    govde.className = "balon-govde";

    var ip = document.createElement("span");
    ip.className = "balon-ip";
    ip.setAttribute("aria-hidden", "true");

    balon.appendChild(govde);
    balon.appendChild(ip);

    balonSayaci++;
    var kimlik = balonSayaci;

    function bitir() {
      if (balon.dataset.durum) return;
      balon.dataset.durum = "bitti";
      balon.remove();
    }

    balon.addEventListener("animationend", function (e) {
      if (e.animationName === "balonTirman") bitir();
    });

    balon.addEventListener("click", function (e) {
      e.stopPropagation();
      if (balon.dataset.durum) return;
      balon.dataset.durum = "patladi";

      /* Balonun merkezini alalım (patlama efekti için) */
      var kutu = balon.getBoundingClientRect();
      var alanKutu = alan.getBoundingClientRect();
      var x = kutu.left - alanKutu.left + kutu.width / 2;
      var y = kutu.top - alanKutu.top + kutu.height / 2;

      balon.classList.add("patladi");
      patlamaSesi();
      kivilcimlar(x, y, renk.kod);
      renkAdiGoster(x, y, renk);

      skor++;
      skorEl.textContent = skor;
      mesajEl.textContent = tebrik[Math.floor(Math.random() * tebrik.length)] + " " + renk.ad + " yakaladın!";

      if (skor === 10) yukariSesi();

      setTimeout(function () { balon.remove(); }, 360);
    });

    alan.appendChild(balon);

    /* Kaybolan balonlar birikir mi? Emniyet temizliği */
    if (kimlik % 40 === 0) {
      Array.prototype.slice.call(alan.querySelectorAll(".balon")).slice(0, 6).forEach(function (b) {
        if (b !== balon) b.remove();
      });
    }
  }

  /* ---------- Patlama kıvılcımları ---------- */
  function kivilcimlar(x, y, renk) {
    if (azHareket) return;
    var adet = 7;
    for (var i = 0; i < adet; i++) {
      var k = document.createElement("span");
      k.className = "kivilcim";
      var aci = (Math.PI * 2 * i) / adet + Math.random() * 0.5;
      var mesafe = rastgele(36, 78);
      k.style.left = x + "px";
      k.style.top = y + "px";
      k.style.background = i % 3 === 0 ? "#ffffff" : renk;
      k.style.setProperty("--dx", Math.cos(aci) * mesafe + "px");
      k.style.setProperty("--dy", Math.sin(aci) * mesafe + "px");
      alan.appendChild(k);
      (function (el) {
        setTimeout(function () { el.remove(); }, 680);
      })(k);
    }
  }

  /* ---------- Renk adını ekranda göster ---------- */
  function renkAdiGoster(x, y, renk) {
    var etiket = document.createElement("span");
    etiket.className = "renk-ad";
    etiket.textContent = renk.ad;
    etiket.style.setProperty("--renk", renk.kod);
    etiket.style.left = Math.min(Math.max(x, 60), alan.clientWidth - 60) + "px";
    etiket.style.top = Math.min(Math.max(y, 40), alan.clientHeight - 30) + "px";
    alan.appendChild(etiket);
    setTimeout(function () { etiket.remove(); }, 1050);
  }

  /* ---------- Oyunu başlat / durdur ---------- */
  function basla() {
    if (calisiyor) return;
    calisiyor = true;
    alan.classList.add("basladi");
    alan.setAttribute("aria-label", "Oyun başladı. Balonlara dokun.");
    mesajEl.textContent = "Hadi yakala!";
    sesBaglami(); /* kullanıcı etkileşimi sonrası */

    balonYap();
    var gecikme = azHareket ? 1500 : 1100;
    zamanlayici = setInterval(function () {
      if (document.hidden) return;
      balonYap();
    }, gecikme);
  }

  function yenidenBasla() {
    clearInterval(zamanlayici);
    zamanlayici = null;
    calisiyor = false;
    skor = 0;
    skorEl.textContent = "0";
    Array.prototype.slice.call(alan.querySelectorAll(".balon, .kivilcim, .renk-ad")).forEach(function (el) { el.remove(); });
    alan.classList.remove("basladi");
    mesajEl.textContent = "Hadi başla, ilk balonu yakala!";
    /* Küçük bir bekleme ile tekrar başlat */
    setTimeout(basla, 260);
  }

  /* Alan boşken dokunmak oyunu başlatır */
  alan.addEventListener("pointerdown", function () {
    if (!calisiyor) basla();
  });

  if (yeniden) {
    yeniden.addEventListener("click", function (e) {
      e.stopPropagation();
      yenidenBasla();
    });
  }

  /* Sekme arka plana gidince temizle (balonların birikmesini önler) */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      Array.prototype.slice.call(alan.querySelectorAll(".balon")).forEach(function (b) { b.remove(); });
    }
  });

  /* ---------------------- OYUN TEST KANCASI ----------------------
     Otomasyon doğrulaması için durumu dışarı açar; sayfada görünmez. */
  window.__oyun = {
    durum: function () {
      return {
        skor: skor,
        calisiyor: calisiyor,
        balonSayisi: alan.querySelectorAll(".balon").length,
        sesAcik: sesAcik
      };
    },
    baslat: basla,
    sifirla: yenidenBasla
  };
})();
