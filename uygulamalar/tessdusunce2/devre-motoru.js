/*
 * Numex Devre — Hesaplama Motoru
 * Arayüzden tamamen bağımsız: DOM yok, sadece sayı ve graf.
 * Yöntem: Düğüm Gerilimleri Yöntemi (Modified Nodal Analysis)
 *   - Kirchhoff Akım Yasası (KAL) her düğümde yazılır
 *   - Gerilim kaynakları ek bilinmeyen (kol akımı) olarak eklenir
 *   - LED, parçalı-doğrusal (piecewise-linear) model: Vf + Rs, durum yinelemesiyle çözülür
 */
(function (kok) {
  'use strict';

  var TIPLER = {
    kaynak: {
      ad: 'Pil / Gerilim Kaynağı', onek: 'V', birim: 'V',
      pinler: [{ ad: 'art', x: -30, y: 0, etiket: '+' }, { ad: 'eksi', x: 30, y: 0, etiket: '−' }],
      varsayilan: { gerilim: 9 }
    },
    direnc: {
      ad: 'Direnç', onek: 'R', birim: 'Ω',
      pinler: [{ ad: 'a', x: -30, y: 0, etiket: '1' }, { ad: 'b', x: 30, y: 0, etiket: '2' }],
      varsayilan: { direnc: 330 }
    },
    led: {
      ad: 'LED', onek: 'D', birim: 'V',
      pinler: [{ ad: 'anot', x: -30, y: 0, etiket: 'A' }, { ad: 'katot', x: 30, y: 0, etiket: 'K' }],
      varsayilan: { vf: 2, rs: 15 }
    },
    anahtar: {
      ad: 'Anahtar', onek: 'S', birim: '',
      pinler: [{ ad: 'a', x: -30, y: 0 }, { ad: 'b', x: 30, y: 0 }],
      varsayilan: { kapali: true }
    },
    ampermetre: {
      ad: 'Ampermetre', onek: 'A', birim: 'A',
      pinler: [{ ad: 'a', x: -30, y: 0 }, { ad: 'b', x: 30, y: 0 }],
      varsayilan: {}
    },
    voltmetre: {
      ad: 'Voltmetre', onek: 'M', birim: 'V',
      pinler: [{ ad: 'a', x: -30, y: 0 }, { ad: 'b', x: 30, y: 0 }],
      varsayilan: {}
    }
  };

  // Devre içi sabitler (hepsi ohm / siemens)
  var S = {
    anahtarKapali: 1e-3,   // 1 mΩ
    anahtarAcik: 1e9,      // 1 GΩ  (açık devre)
    ampermetre: 1e-3,      // 1 mΩ (ideal akım ölçeri taklit eder)
    voltmetre: 1e7,        // 10 MΩ (paralel etkisi ihmal edilebilir)
    ledKapali: 1e-9,       // ters yönlü sızıntı
    reg: 1e-9,             // her düğümden toprağa çok küçük kaçak (matris tekilliğini önler)
    kisaEsik: 20           // A — bu üstü akım "kısa devre" sayılır
  };

  function say(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : d;
  }

  // ---------------------------------------------------------------- pin konumu
  function pinKonum(b, pinAd) {
    var t = TIPLER[b.tip];
    if (!t) return { x: say(b.x, 0), y: say(b.y, 0) };
    var p = null;
    for (var i = 0; i < t.pinler.length; i++) if (t.pinler[i].ad === pinAd) p = t.pinler[i];
    if (!p) return { x: say(b.x, 0), y: say(b.y, 0) };
    var r = (say(b.rot, 0) * Math.PI) / 180;
    return {
      x: say(b.x, 0) + p.x * Math.cos(r) - p.y * Math.sin(r),
      y: say(b.y, 0) + p.x * Math.sin(r) + p.y * Math.cos(r)
    };
  }

  // -------------------------------------------------- Gauss-Jordan (kısmi pivot)
  function ciz(A, b) {
    var n = b.length;
    if (n === 0) return { x: [] };
    var M = [], i, j;
    for (i = 0; i < n; i++) { var row = A[i].slice(); row.push(b[i]); M.push(row); }

    for (var c = 0; c < n; c++) {
      var piv = c, best = Math.abs(M[c][c]);
      for (var r = c + 1; r < n; r++) {
        var v = Math.abs(M[r][c]);
        if (v > best) { best = v; piv = r; }
      }
      if (!(best > 1e-14)) {
        return { hata: 'Denklem sistemi tekil: devrede çözülemeyen (kopuk ya da çelişkili) bir bağlantı var.' };
      }
      if (piv !== c) { var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp; }
      var pv = M[c][c];
      for (j = c; j <= n; j++) M[c][j] /= pv;
      for (r = 0; r < n; r++) {
        if (r === c) continue;
        var f = M[r][c];
        if (!f) continue;
        for (j = c; j <= n; j++) M[r][j] -= f * M[c][j];
      }
    }
    var x = [];
    for (i = 0; i < n; i++) {
      var val = M[i][n];
      if (!isFinite(val)) return { hata: 'Sayısal çözüm taştı (NaN / Infinity). Devre değerlerini kontrol et.' };
      x.push(Math.abs(val) < 1e-15 ? 0 : val);
    }
    return { x: x };
  }

  // ------------------------------------------------------------------- ANALİZ
  function analiz(devre) {
    devre = devre || {};
    var bilesenler = (devre.bilesenler || []).filter(function (b) { return b && TIPLER[b.tip]; });
    var kablolar = devre.kablolar || [];

    var sonuc = {
      tamam: true, hatalar: [], uyarilar: [],
      dugumler: [], elemanlar: [], kaynaklar: [],
      toplamAkim: 0, esdegerDirenc: null,
      kisaDevre: false, acikDevre: false, not: '', ledDurum: {}
    };

    if (!bilesenler.length) {
      sonuc.not = 'Tuvalde bileşen yok. Soldaki paletten bileşen ekleyerek başla.';
      return sonuc;
    }

    // --- 1) Uç noktaları düğümlere birleştir (union-find) ---
    var eb = {}, kokler = {};
    function bul(k) { while (eb[k] !== k) { eb[k] = eb[eb[k]]; k = eb[k]; } return k; }
    bilesenler.forEach(function (b) {
      TIPLER[b.tip].pinler.forEach(function (p) { eb[b.id + '|' + p.ad] = b.id + '|' + p.ad; });
    });
    kablolar.forEach(function (w) {
      if (!w || !w.a || !w.b) return;
      var a = w.a.bilesen + '|' + w.a.pin, c = w.b.bilesen + '|' + w.b.pin;
      if (eb[a] === undefined || eb[c] === undefined) return;
      var ra = bul(a), rc = bul(c);
      if (ra !== rc) eb[ra] = rc;
    });
    Object.keys(eb).forEach(function (k) { kokler[k] = bul(k); });

    var netHarita = {}, netler = [];
    Object.keys(eb).forEach(function (k) {
      var r = kokler[k];
      if (netHarita[r] === undefined) { netHarita[r] = netler.length; netler.push({ id: netler.length, pinler: [] }); }
      var ni = netHarita[r];
      kokler[k] = ni;
      netler[ni].pinler.push(k);
    });
    function net(bid, pin) { var v = kokler[bid + '|' + pin]; return v === undefined ? -1 : v; }

    // --- 2) Toprak düğümü: ilk kaynağın (−) ucu ---
    var N = netler.length;
    var ilkKaynak = null;
    for (var i0 = 0; i0 < bilesenler.length; i0++) if (bilesenler[i0].tip === 'kaynak') { ilkKaynak = bilesenler[i0]; break; }
    var toprak = ilkKaynak ? net(ilkKaynak.id, 'eksi') : 0;
    if (toprak < 0) toprak = 0;

    // --- 3) Gerilim kaynakları (kısa devre kontrolü dahil) ---
    var kaynaklar = [], kisa = false;
    bilesenler.forEach(function (b) {
      if (b.tip !== 'kaynak') return;
      var p = net(b.id, 'art'), n = net(b.id, 'eksi');
      if (p === n) {
        kisa = true;
        sonuc.hatalar.push('Kısa devre: ' + (b.ad || b.id) + ' kaynağının (+) ve (−) uçları aynı düğüme bağlı.');
        return;
      }
      kaynaklar.push({ b: b, p: p, n: n, V: say(b.params && b.params.gerilim, 9), k: 0 });
    });
    if (kisa) {
      sonuc.tamam = false; sonuc.kisaDevre = true;
      sonuc.not = 'Kaynak uçları doğrudan birbirine bağlı. Gerçek bir pil bu durumda aşırı akım çeker, ısınır ve zarar görür — bu simülasyon bunu hesaplamaz, sadece uyarır.';
      return sonuc;
    }

    // --- 4) Bilinmeyenler ---
    var idx = new Array(N), dugumSay = 0;
    for (var i1 = 0; i1 < N; i1++) idx[i1] = (i1 === toprak) ? -1 : dugumSay++;
    var boyut = dugumSay + kaynaklar.length;
    kaynaklar.forEach(function (k, j) { k.k = dugumSay + j; });

    // --- 5) Sistem kurucu ---
    function kur(ledDurum) {
      var A = [], bv = [], i, j, r;
      for (i = 0; i < boyut; i++) { r = new Array(boyut); for (j = 0; j < boyut; j++) r[j] = 0; A.push(r); bv.push(0); }

      function ekle(rr, cc, v) { if (rr < 0 || cc < 0) return; A[rr][cc] += v; }
      function ekleB(rr, v) { if (rr < 0) return; bv[rr] += v; }
      function iletkenlik(a, c, g) {
        var ra = idx[a], rc = idx[c];
        ekle(ra, ra, g); ekle(rc, rc, g); ekle(ra, rc, -g); ekle(rc, ra, -g);
      }

      // tekilliği önleyen çok küçük kaçak
      for (i = 0; i < N; i++) if (idx[i] >= 0) A[idx[i]][idx[i]] += S.reg;

      kaynaklar.forEach(function (k) {
        ekle(idx[k.p], k.k, 1); ekle(idx[k.n], k.k, -1);
        ekle(k.k, idx[k.p], 1); ekle(k.k, idx[k.n], -1);
        ekleB(k.k, k.V);
      });

      bilesenler.forEach(function (b) {
        var P = b.params || {};
        if (b.tip === 'direnc') {
          var R = say(P.direnc, 330);
          if (!(R > 0)) { R = 1; }
          iletkenlik(net(b.id, 'a'), net(b.id, 'b'), 1 / R);
        } else if (b.tip === 'anahtar') {
          var kapali = P.kapali !== false;
          iletkenlik(net(b.id, 'a'), net(b.id, 'b'), kapali ? 1 / S.anahtarKapali : 1 / S.anahtarAcik);
        } else if (b.tip === 'ampermetre') {
          iletkenlik(net(b.id, 'a'), net(b.id, 'b'), 1 / S.ampermetre);
        } else if (b.tip === 'voltmetre') {
          iletkenlik(net(b.id, 'a'), net(b.id, 'b'), 1 / S.voltmetre);
        } else if (b.tip === 'led') {
          var a = net(b.id, 'anot'), c = net(b.id, 'katot');
          var vf = say(P.vf, 2), rs = say(P.rs, 15);
          if (!(rs > 0)) rs = 15;
          if (ledDurum && ledDurum[b.id]) {
            var g = 1 / rs;
            iletkenlik(a, c, g);
            var I0 = -vf * g;           // akım a→c: I = g·(Va−Vc) + I0
            ekleB(idx[a], -I0);
            ekleB(idx[c], I0);
          } else {
            iletkenlik(a, c, S.ledKapali);
          }
        }
      });
      return { A: A, b: bv };
    }

    // --- 6) LED durum yinelemesi ---
    var ledler = bilesenler.filter(function (b) { return b.tip === 'led'; });
    var ledDurum = {};
    ledler.forEach(function (l) { ledDurum[l.id] = true; });

    var cozum = null, salinim = false, gorulen = {};
    for (var tur = 0; tur < 80; tur++) {
      var sistem = kur(ledDurum);
      cozum = ciz(sistem.A, sistem.b);
      if (cozum.hata) {
        sonuc.tamam = false;
        sonuc.hatalar.push(cozum.hata);
        sonuc.not = cozum.hata;
        return sonuc;
      }
      var degisti = false;
      for (var li = 0; li < ledler.length; li++) {
        var l = ledler[li];
        var vfL = say(l.params && l.params.vf, 2), rsL = say(l.params && l.params.rs, 15);
        if (!(rsL > 0)) rsL = 15;
        var na = net(l.id, 'anot'), nk = net(l.id, 'katot');
        var va = na === toprak ? 0 : cozum.x[idx[na]];
        var vk = nk === toprak ? 0 : cozum.x[idx[nk]];
        var vd = va - vk;
        if (ledDurum[l.id]) {
          if ((vd - vfL) / rsL < -1e-9) { ledDurum[l.id] = false; degisti = true; }
        } else {
          if (vd > vfL + 1e-9) { ledDurum[l.id] = true; degisti = true; }
        }
      }
      if (!degisti) break;
      var imza = ledler.map(function (x) { return ledDurum[x.id] ? '1' : '0'; }).join('');
      if (gorulen[imza]) { salinim = true; break; }
      gorulen[imza] = true;
    }
    if (salinim) {
      var son = kur(ledDurum);
      var y2 = ciz(son.A, son.b);
      if (!y2.hata) cozum = y2;
      sonuc.uyarilar.push('LED modeli bu devrede salınım gösterdi; sonuç yaklaşıktır.');
    }
    sonuc.ledDurum = ledDurum;

    // --- 7) Sonuçlar ---
    function V(ni) {
      if (ni < 0 || ni === toprak) return 0;
      var v = cozum.x[idx[ni]];
      return isFinite(v) ? v : 0;
    }
    function guvenli(v) { return isFinite(v) ? v : 0; }

    var toplamAkim = 0;
    bilesenler.forEach(function (b) {
      var P = b.params || {};
      var el = { id: b.id, ad: b.ad || b.id, tip: b.tip, tipAd: TIPLER[b.tip].ad, gerilim: 0, akim: 0, guc: 0, not: '' };

      if (b.tip === 'kaynak') {
        var kk = null;
        for (var i = 0; i < kaynaklar.length; i++) if (kaynaklar[i].b.id === b.id) kk = kaynaklar[i];
        if (!kk) { el.not = 'Devre dışı'; sonuc.elemanlar.push(el); return; }
        el.akim = guvenli(-cozum.x[kk.k]);   // (+) ucundan devreye verilen akım
        el.gerilim = kk.V;
        el.guc = guvenli(el.gerilim * el.akim);
        toplamAkim += Math.abs(el.akim);
        sonuc.kaynaklar.push({ id: b.id, ad: el.ad, gerilim: el.gerilim, akim: el.akim, guc: el.guc });

      } else if (b.tip === 'direnc') {
        var R = say(P.direnc, 330); if (!(R > 0)) R = 1;
        var v = V(net(b.id, 'a')) - V(net(b.id, 'b'));
        el.gerilim = guvenli(v);
        el.akim = guvenli(v / R);
        el.guc = guvenli(el.akim * el.akim * R);
        if (el.guc > 1) sonuc.uyarilar.push(el.ad + ': ' + fmtGuc(el.guc) + ' güç harcıyor — 1/4 W direnç için fazla.');

      } else if (b.tip === 'anihtar' || b.tip === 'anahtar') {
        var kp = P.kapali !== false;
        var v2 = V(net(b.id, 'a')) - V(net(b.id, 'b'));
        el.gerilim = guvenli(v2);
        el.akim = guvenli(kp ? v2 / S.anahtarKapali : v2 / S.anahtarAcik);
        el.guc = guvenli(el.gerilim * el.akim);
        el.not = kp ? 'kapalı' : 'açık';

      } else if (b.tip === 'ampermetre') {
        var v3 = V(net(b.id, 'a')) - V(net(b.id, 'b'));
        el.gerilim = guvenli(v3);
        el.akim = guvenli(v3 / S.ampermetre);
        el.guc = 0;

      } else if (b.tip === 'voltmetre') {
        var v4 = V(net(b.id, 'a')) - V(net(b.id, 'b'));
        el.gerilim = guvenli(v4);
        el.akim = guvenli(v4 / S.voltmetre);
        el.guc = 0;
        el.not = 'ölçülen';

      } else if (b.tip === 'led') {
        var vfL2 = say(P.vf, 2), rsL2 = say(P.rs, 15);
        if (!(rsL2 > 0)) rsL2 = 15;
        var vd2 = V(net(b.id, 'anot')) - V(net(b.id, 'katot'));
        el.gerilim = guvenli(vd2);
        if (ledDurum[b.id]) {
          el.akim = guvenli((vd2 - vfL2) / rsL2);
          el.guc = guvenli(vd2 * el.akim);
          el.iletim = true;
          if (Math.abs(el.akim) > 0.025) sonuc.uyarilar.push(el.ad + ': ' + fmtAkim(Math.abs(el.akim)) + ' — LED için yüksek akım, yanma riski!');
        } else {
          el.akim = guvenli(vd2 * S.ledKapali);
          el.guc = 0;
          el.iletim = false;
          el.not = vd2 < -0.1 ? 'ters bağlı (yanmıyor)' : 'iletimde değil';
        }
      }
      sonuc.elemanlar.push(el);
    });

    sonuc.toplamAkim = toplamAkim;

    // --- 8) Uyarılar ---
    if (toplamAkim > S.kisaEsik) {
      sonuc.kisaDevre = true;
      sonuc.hatalar.push('Kısa devre! Kaynak ' + fmtAkim(toplamAkim) + ' çekiyor — devrede neredeyse sıfır dirençli bir yol var. Gerçek bir pil bu akımda hasar görür.');
    } else if (toplamAkim > 0 && toplamAkim < 1e-6) {
      sonuc.acikDevre = true;
      sonuc.uyarilar.push('Devre açık: kaynaktan akım akmıyor (anahtar açık ya da bir bağlantı eksik olabilir).');
    }
    if (kaynaklar.length === 0) sonuc.uyarilar.push('Devrede gerilim kaynağı yok — gerilimler sıfır.');

    // NUMEX-DÜZELTME (2026-11-19): Açık devrede toplam akım ~25 nA iken V/I = 360 MΩ gibi yanıltıcı bir 'eşdeğer direnç' gösteriliyordu; eşik 1 µA'ya çekildi ki açık devrede '—' görünsün.
    // eşdeğer direnç (açık devrede anlamsız → gösterilmez)
    if (kaynaklar.length === 1 && Math.abs(toplamAkim) > 1e-6) {
      var Vk = Math.abs(kaynaklar[0].V);
      sonuc.esdegerDirenc = Vk / Math.abs(toplamAkim);
    }

    // --- 9) Düğümler ---
    var dSayac = 0;
    netler.forEach(function (nt, i) {
      sonuc.dugumler.push({
        id: nt.id,
        ad: (i === toprak) ? 'GND (0 V)' : 'D' + (++dSayac),
        toprak: i === toprak,
        gerilim: i === toprak ? 0 : guvenli(V(i)),
        pinler: nt.pinler.slice(0, 12)
      });
    });

    if (!sonuc.hatalar.length) sonuc.not = 'Çözüm tamam (düğüm gerilimleri yöntemi).';
    return sonuc;
  }

  // -------------------------------------------------------------- biçimleme
  function fmtAkim(a) {
    var x = Math.abs(a);
    if (x === 0) return '0 A';
    if (x < 1e-6) return (x * 1e9).toFixed(2) + ' nA';
    if (x < 1e-3) return (x * 1e6).toFixed(2) + ' µA';
    if (x < 1) return (x * 1e3).toFixed(3) + ' mA';
    return x.toFixed(3) + ' A';
  }
  function fmtGerilim(v) {
    var x = Math.abs(v);
    if (x < 1e-3) return (v * 1e6).toFixed(2) + ' µV';
    return v.toFixed(4) + ' V';
  }
  function fmtGuc(p) {
    var x = Math.abs(p);
    if (x < 1e-3) return (p * 1e6).toFixed(2) + ' µW';
    if (x < 1) return (p * 1e3).toFixed(2) + ' mW';
    return p.toFixed(3) + ' W';
  }
  function fmtDirenc(r) {
    if (r === null || r === undefined) return '—';
    var x = Math.abs(r);
    if (x >= 1e6) return (r / 1e6).toFixed(3) + ' MΩ';
    if (x >= 1e3) return (r / 1e3).toFixed(3) + ' kΩ';
    return r.toFixed(2) + ' Ω';
  }

  // ------------------------------------------------------- JSON proje dosyası
  function disaAktar(devre) {
    return JSON.stringify({
      uygulama: 'numex-devre',
      surum: 1,
      tarih: new Date().toISOString(),
      bilesenler: (devre.bilesenler || []).map(function (b) {
        return { id: b.id, ad: b.ad, tip: b.tip, x: b.x, y: b.y, rot: b.rot || 0, params: b.params || {} };
      }),
      kablolar: (devre.kablolar || []).map(function (w) {
        return { id: w.id, a: { bilesen: w.a.bilesen, pin: w.a.pin }, b: { bilesen: w.b.bilesen, pin: w.b.pin } };
      })
    }, null, 2);
  }

  function iceAktar(metin) {
    var o = (typeof metin === 'string') ? JSON.parse(metin) : metin;
    if (!o || !Array.isArray(o.bilesenler)) throw new Error('Geçersiz proje dosyası: "bilesenler" dizisi bulunamadı.');
    var bilesenler = o.bilesenler
      .filter(function (b) { return b && TIPLER[b.tip]; })
      .map(function (b) {
        return {
          id: String(b.id), ad: b.ad || b.id, tip: b.tip,
          x: say(b.x, 0), y: say(b.y, 0), rot: say(b.rot, 0),
          params: b.params && typeof b.params === 'object' ? b.params : {}
        };
      });
    var gecerli = {};
    bilesenler.forEach(function (b) { gecerli[b.id] = true; });
    var kablolar = (o.kablolar || []).filter(function (w) {
      return w && w.a && w.b && gecerli[w.a.bilesen] && gecerli[w.b.bilesen];
    }).map(function (w) {
      return { id: String(w.id || ('w' + Math.random().toString(36).slice(2, 8))), a: { bilesen: String(w.a.bilesen), pin: String(w.a.pin) }, b: { bilesen: String(w.b.bilesen), pin: String(w.b.pin) } };
    });
    return { bilesenler: bilesenler, kablolar: kablolar };
  }

  // ------------------------------------------------------- bağımsız test takımı
  function testler() {
    var sonuc = [];
    function d(id, tip, p) { return { id: id, ad: id, tip: tip, x: 0, y: 0, rot: 0, params: p || {} }; }
    function k(id, a, ap, b, bp) { return { id: id, a: { bilesen: a, pin: ap }, b: { bilesen: b, pin: bp } }; }
    function kaydet(ad, gecti, olculen, beklenen) {
      sonuc.push({ ad: ad, gecti: !!gecti, olculen: olculen, beklenen: beklenen });
    }
    function yakin(a, b, tol) { return Math.abs(a - b) <= tol; }
    function eleman(r, id) {
      for (var i = 0; i < r.elemanlar.length; i++) if (r.elemanlar[i].id === id) return r.elemanlar[i];
      return null;
    }

    // 1) 9 V / 1000 Ω = 9 mA
    var c1 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 1000 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'V1', 'eksi')]
    };
    var r1 = analiz(c1);
    var I1 = Math.abs(eleman(r1, 'R1').akim);
    kaydet('1) 9 V / 1000 Ω → 9 mA', yakin(I1, 0.009, 1e-6), (I1 * 1000).toFixed(4) + ' mA', '9.0000 mA');

    // 2) 100 Ω + 200 Ω seri → 300 Ω
    var c2 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 100 }), d('R2', 'direnc', { direnc: 200 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'R2', 'a'), k('w3', 'R2', 'b', 'V1', 'eksi')]
    };
    var r2 = analiz(c2);
    kaydet('2) 100 Ω + 200 Ω seri → 300 Ω', yakin(r2.esdegerDirenc, 300, 1e-3), fmtDirenc(r2.esdegerDirenc), '300.00 Ω');

    // 3) 100 Ω ∥ 100 Ω → 50 Ω
    var c3 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 100 }), d('R2', 'direnc', { direnc: 100 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'V1', 'art', 'R2', 'a'),
                 k('w3', 'R1', 'b', 'R2', 'b'), k('w4', 'R2', 'b', 'V1', 'eksi')]
    };
    var r3 = analiz(c3);
    kaydet('3) 100 Ω ∥ 100 Ω → 50 Ω', yakin(r3.esdegerDirenc, 50, 1e-3), fmtDirenc(r3.esdegerDirenc), '50.00 Ω');

    // 4) Açık anahtar → akım 0
    var c4 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 330 }), d('S1', 'anahtar', { kapali: false })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'S1', 'a'), k('w3', 'S1', 'b', 'V1', 'eksi')]
    };
    var r4 = analiz(c4);
    kaydet('4) Açık anahtar → akım 0', Math.abs(r4.toplamAkim) < 1e-6, fmtAkim(r4.toplamAkim), '< 1 µA');

    // 5) Kaynak uçları doğrudan bağlı → kısa devre uyarısı
    var c5 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 })],
      kablolar: [k('w1', 'V1', 'art', 'V1', 'eksi')]
    };
    var r5 = analiz(c5);
    kaydet('5) Kaynak uçları kısa → güvenli kısa devre uyarısı', r5.kisaDevre === true && r5.hatalar.length > 0, r5.kisaDevre ? 'kısa devre tespit edildi' : 'tespit yok', 'kısa devre uyarısı');

    // 6) LED ters bağlı → yanmıyor
    var c6 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 330 }), d('D1', 'led', { vf: 2, rs: 15 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'D1', 'katot'), k('w3', 'D1', 'anot', 'V1', 'eksi')]
    };
    var r6 = analiz(c6);
    var D1 = eleman(r6, 'D1');
    kaydet('6) LED ters bağlıyken yanmıyor', D1 && !D1.iletim && Math.abs(D1.akim) < 1e-6, D1 ? (D1.iletim ? 'iletimde' : 'iletimde değil, |I|=' + fmtAkim(D1.akim)) : 'yok', 'iletimde değil');

    // 7) Direnç değişince akım güncelleniyor
    var c7a = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 1000 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'V1', 'eksi')]
    };
    var c7b = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 500 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'V1', 'eksi')]
    };
    var Ia = Math.abs(eleman(analiz(c7a), 'R1').akim), Ib = Math.abs(eleman(analiz(c7b), 'R1').akim);
    kaydet('7) Direnç 1000→500 Ω, akım canlı güncelleniyor', yakin(Ib, Ia * 2, 1e-6), fmtAkim(Ia) + ' → ' + fmtAkim(Ib), 'akım iki katına çıkar');

    // 8) JSON kaydet / yükle
    var metin = disaAktar(c2);
    var geri = iceAktar(metin);
    var r8 = analiz(geri);
    var korundu = geri.bilesenler.length === c2.bilesenler.length &&
      geri.kablolar.length === c2.kablolar.length &&
      yakin(r8.esdegerDirenc, 300, 1e-3);
    kaydet('8) JSON kaydedip tekrar açınca bağlantılar ve sonuç korunuyor', korundu,
      geri.bilesenler.length + ' bileşen / ' + geri.kablolar.length + ' kablo, R=' + fmtDirenc(r8.esdegerDirenc),
      '3 bileşen / 3 kablo, R=300 Ω');

    // Ek: gerilim bölücü düğüm gerilimi
    var c9 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 1000 }), d('R2', 'direnc', { direnc: 2000 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'R2', 'a'), k('w3', 'R2', 'b', 'V1', 'eksi')]
    };
    var r9 = analiz(c9);
    var ara = null;
    r9.dugumler.forEach(function (du) {
      if (du.toprak) return;
      if (du.pinler.indexOf('R1|b') >= 0) ara = du.gerilim;
    });
    kaydet('Ek) 9 V gerilim bölücü (1 kΩ + 2 kΩ) → orta düğüm 6 V', ara !== null && yakin(ara, 6, 1e-4), ara === null ? 'bulunamadı' : ara.toFixed(6) + ' V', '6.0000 V (±0.1 mV)');

    // Ek: LED doğru bağlı → iletimde ve ~20 mA
    var c10 = {
      bilesenler: [d('V1', 'kaynak', { gerilim: 9 }), d('R1', 'direnc', { direnc: 330 }), d('D1', 'led', { vf: 2, rs: 15 })],
      kablolar: [k('w1', 'V1', 'art', 'R1', 'a'), k('w2', 'R1', 'b', 'D1', 'anot'), k('w3', 'D1', 'katot', 'V1', 'eksi')]
    };
    var r10 = analiz(c10);
    var D10 = eleman(r10, 'D1');
    kaydet('Ek) 9 V + 330 Ω + LED → iletimde ≈ 20 mA', D10 && D10.iletim && yakin(D10.akim, 7 / 345, 1e-6),
      D10 ? fmtAkim(D10.akim) : 'yok', '≈ ' + fmtAkim(7 / 345));

    return sonuc;
  }

  kok.NumexDevre = {
    TIPLER: TIPLER,
    SABIT: S,
    pinKonum: pinKonum,
    analiz: analiz,
    disaAktar: disaAktar,
    iceAktar: iceAktar,
    testler: testler,
    fmtAkim: fmtAkim,
    fmtGerilim: fmtGerilim,
    fmtGuc: fmtGuc,
    fmtDirenc: fmtDirenc
  };
})(typeof window !== 'undefined' ? window : this);
