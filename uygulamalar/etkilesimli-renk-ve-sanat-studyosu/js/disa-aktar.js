/* Numex Renk Stüdyosu — PNG / SVG / CSS / JSON dışa aktarma */
(function (kok) {
  "use strict";
  var G = kok.Gradyan;

  function indir(icerik, ad, mime) {
    var blob = icerik instanceof Blob ? icerik : new Blob([icerik], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function zamanAdi(ek) {
    var d = new Date();
    function p(n) { return String(n).padStart(2, "0"); }
    return "numex-renk-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + "." + ek;
  }

  function png(canvas, ad) {
    if (!canvas) return false;
    var url;
    try { url = canvas.toDataURL("image/png"); } catch (e) { return false; }
    var a = document.createElement("a");
    a.href = url;
    a.download = ad || zamanAdi("png");
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  function svg(duraklar, tip, aci) {
    var icerik = G.svgUret(duraklar, tip, aci, 1200, 750);
    indir(icerik, zamanAdi("svg"), "image/svg+xml;charset=utf-8");
    return icerik;
  }

  function css(duraklar, tip, aci) {
    var satir = G.cssUret(duraklar, tip, aci);
    var icerik = "/* Numex Renk Stüdyosu */\n.gradyan {\n  background: " + satir + ";\n}\n";
    indir(icerik, zamanAdi("css"), "text/css;charset=utf-8");
    return icerik;
  }

  function json(state) {
    var veri = {
      uygulama: "Numex Renk Stüdyosu",
      surum: 1,
      tarih: new Date().toISOString(),
      palet: state.palet,
      kilitler: state.kilitler,
      kural: state.kural,
      gradyan: state.gradyan,
      karistirici: state.karistirici,
      sanat: state.sanat,
      tema: state.tema,
      favoriler: state.favoriler,
      gecmis: state.gecmis
    };
    indir(JSON.stringify(veri, null, 2), zamanAdi("json"), "application/json;charset=utf-8");
    return veri;
  }

  function jsonYukle(dosya) {
    return new Promise(function (resolve, reject) {
      if (!dosya) return reject(new Error("Dosya seçilmedi"));
      var okuyucu = new FileReader();
      okuyucu.onload = function () {
        try {
          var veri = JSON.parse(String(okuyucu.result));
          if (!veri || typeof veri !== "object") throw new Error("Geçersiz içerik");
          resolve(veri);
        } catch (e) { reject(e); }
      };
      okuyucu.onerror = function () { reject(new Error("Dosya okunamadı")); };
      okuyucu.readAsText(dosya);
    });
  }

  function panoyaMetin(metin) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(metin).then(function () { return true; }).catch(function () { return eskiKopyala(metin); });
    }
    return Promise.resolve(eskiKopyala(metin));
  }

  function eskiKopyala(metin) {
    try {
      var ta = document.createElement("textarea");
      ta.value = metin;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  var api = {
    png: png, svg: svg, css: css, json: json, jsonYukle: jsonYukle, indir: indir,
    zamanAdi: zamanAdi, panoyaMetin: panoyaMetin
  };
  kok.DisaAktar = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
