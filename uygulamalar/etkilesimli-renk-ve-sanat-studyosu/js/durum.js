/* Numex Renk Stüdyosu — merkezî durum, undo/redo, localStorage */
(function (kok) {
  "use strict";

  var ANAHTAR = "numex-renk-studio-v1";
  var MAKS_YIGIN = 50;
  var dinleyiciler = [];
  var state = baslangic();
  var geriYigin = [];
  var ileriYigin = [];

  function baslangic() {
    return {
      tema: "koyu",
      palet: ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd"],
      kilitler: [false, false, false, false, false],
      kural: "analog",
      tabanRenk: "#ff6b6b",
      gecmis: [],
      favoriler: [],
      karistirici: { a: "#ff6b6b", b: "#48dbfb", t: 0.5 },
      gradyan: {
        tip: "linear",
        aci: 135,
        duraklar: [
          { renk: "#ff6b6b", konum: 0 },
          { renk: "#feca57", konum: 25 },
          { renk: "#48dbfb", konum: 50 },
          { renk: "#1dd1a1", konum: 75 },
          { renk: "#5f27cd", konum: 100 }
        ]
      },
      sanat: { mod: "dalga", hiz: 1, yogunluk: 0.6, calisiyor: true },
      tuvalNoktalari: [
        { x: 0.3, y: 0.4, renk: "#ff6b6b", r: 160 },
        { x: 0.7, y: 0.6, renk: "#48dbfb", r: 160 },
        { x: 0.5, y: 0.3, renk: "#feca57", r: 140 }
      ],
      aktifSekme: "palet",
      kontrast: { a: "#ffffff", b: "#111111" }
    };
  }

  function kopyala(deger) {
    return JSON.parse(JSON.stringify(deger));
  }

  function al() { return state; }

  function anlik() {
    var { geriYigin: _a, ileriYigin: _b, ...sade } = state;
    return kopyala(sade);
  }

  function uygula(yeni) {
    Object.keys(yeni).forEach(function (k) { state[k] = yeni[k]; });
    dinleyiciler.forEach(function (fn) {
      try { fn(state); } catch (e) { /* dinleyici hatası uygulamayı durdurmaz */ }
    });
  }

  function guncelle(yama, secenek) {
    secenek = secenek || {};
    if (secenek.kaydet !== false) {
      geriYigin.push(anlik());
      if (geriYigin.length > MAKS_YIGIN) geriYigin.shift();
      ileriYigin.length = 0;
    }
    uygula(yama);
    if (secenek.kalici !== false) kaydet();
  }

  function geriAl() {
    if (!geriYigin.length) return false;
    ileriYigin.push(anlik());
    var onceki = geriYigin.pop();
    uygula(onceki);
    kaydet();
    return true;
  }

  function ileriAl() {
    if (!ileriYigin.length) return false;
    geriYigin.push(anlik());
    var sonraki = ileriYigin.pop();
    uygula(sonraki);
    kaydet();
    return true;
  }

  function yiginDurumu() {
    return { geri: geriYigin.length, ileri: ileriYigin.length };
  }

  function kaydet() {
    try { localStorage.setItem(ANAHTAR, JSON.stringify(anlik())); } catch (e) { /* kota dolu olabilir */ }
  }

  function yukle() {
    try {
      var ham = localStorage.getItem(ANAHTAR);
      if (!ham) return false;
      var veri = JSON.parse(ham);
      if (!veri || typeof veri !== "object") return false;
      var temel = baslangic();
      Object.keys(temel).forEach(function (k) {
        if (veri[k] !== undefined) temel[k] = veri[k];
      });
      if (!Array.isArray(temel.palet) || temel.palet.length < 2) temel.palet = baslangic().palet;
      if (temel.gradyan && (!Array.isArray(temel.gradyan.duraklar) || temel.gradyan.duraklar.length < 2)) {
        temel.gradyan.duraklar = baslangic().gradyan.duraklar;
      }
      state = temel;
      return true;
    } catch (e) { return false; }
  }

  function sifirla() {
    geriYigin.push(anlik());
    if (geriYigin.length > MAKS_YIGIN) geriYigin.shift();
    ileriYigin.length = 0;
    uygula(baslangic());
    kaydet();
  }

  function abone(fn) {
    if (typeof fn === "function") dinleyiciler.push(fn);
  }

  var api = {
    baslangic: baslangic, al: al, guncelle: guncelle, geriAl: geriAl, ileriAl: ileriAl,
    yiginDurumu: yiginDurumu, kaydet: kaydet, yukle: yukle, sifirla: sifirla, abone: abone,
    kopyala: kopyala
  };
  kok.Durum = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
