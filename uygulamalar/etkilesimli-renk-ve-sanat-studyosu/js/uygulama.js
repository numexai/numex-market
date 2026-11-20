/* Numex Renk Stüdyosu — başlatma */
(function (kok) {
  "use strict";

  function baslat() {
    var D = kok.Durum, A = kok.Arayuz;

    D.yukle();

    /* kayıtlı tema varsa uygula (DOM'a erken yaz, göz kırpmasın) */
    document.documentElement.setAttribute("data-tema", D.al().tema || "koyu");

    A.baglan();

    var btnTema = document.getElementById("btnTema");
    if (btnTema) btnTema.textContent = D.al().tema === "koyu" ? "🌙 Tema" : "☀️ Tema";

    /* hoş geldin */
    setTimeout(function () {
      A.bildirim("Numex Renk Stüdyosu hazır — noktaları sürükleyin");
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
