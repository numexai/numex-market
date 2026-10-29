/* ============================================================
   Numex Görsel Dönüştürücü — Arayüz (app.js)
   Motor: image-core.js (window.NumexGorsel)
   Tamamen çevrimdışı. Hiçbir fetch / XHR yok.
   ============================================================ */
(function () {
  'use strict';

  var M = window.NumexGorsel;
  if (!M) {
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="background:#fdecea;color:#7a1f14;padding:14px;font-family:sans-serif">' +
      'Hata: image-core.js yüklenemedi. Dosyayı index.html ile aynı klasöre koyun.</div>');
    return;
  }

  /* ---------------- DOM ---------------- */
  var $ = function (id) { return document.getElementById(id); };

  var damla = $('damla');
  var dosyaGirdi = $('dosyaGirdi');
  var liste = $('liste');
  var bosDurum = $('bosDurum');
  var listeOzet = $('listeOzet');
  var donusturBtn = $('donusturBtn');
  var zipBtn = $('zipBtn');
  var temizleBtn = $('temizleBtn');
  var iptalBtn = $('iptalBtn');
  var ilerlemeKutu = $('ilerlemeKutu');
  var ilerlemeMetin = $('ilerlemeMetin');
  var ilerlemeYuzde = $('ilerlemeYuzde');
  var cubuk = $('cubuk');
  var cubukDolu = $('cubukDolu');
  var uyariKutu = $('uyariKutu');
  var kalite = $('kalite');
  var kaliteDeger = $('kaliteDeger');
  var kaliteAlan = $('kaliteAlan');
  var arkaPlan = $('arkaPlan');
  var arkaPlanKod = $('arkaPlanKod');
  var arkaPlanAlan = $('arkaPlanAlan');
  var hedefIpuclari = $('hedefIpuclari');
  var boyutModu = $('boyutModu');
  var boyutIpucu = $('boyutIpucu');
  var yuzde = $('yuzde');
  var yuzdeDeger = $('yuzdeDeger');
  var genislik = $('genislik');
  var cerceveG = $('cerceveG');
  var cerceveY = $('cerceveY');
  var zemin = $('zemin');

  /* ---------------- Durum ---------------- */
  var ogeler = [];          // { id, file, ad, durum, sonuc, hata, url, el }
  var sayac = 0;
  var calisiyor = false;
  var iptalIstendi = false;

  /* ---------------- Yardımcılar ---------------- */
  function indir(blob, ad) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function uyari(mesaj, tur) {
    if (!mesaj) { uyariKutu.classList.remove('acik'); uyariKutu.textContent = ''; return; }
    uyariKutu.innerHTML = (tur === 'hata' ? '<strong>Hata:</strong> ' : '') + mesaj;
    uyariKutu.classList.add('acik');
  }

  function hedefBicim() {
    var secili = document.querySelector('input[name="hedef"]:checked');
    return secili ? secili.value : 'jpeg';
  }

  function ayarlariOku() {
    var h = hedefBicim();
    return {
      hedef: h,
      kalite: Number(kalite.value) || 85,
      arkaPlan: M.hexToRgb(arkaPlan.value) ? arkaPlan.value : '#FFFFFF',
      boyutModu: boyutModu.value,
      yuzde: Number(yuzde.value) || 100,
      genislik: Number(genislik.value) || 0,
      cerceveG: Number(cerceveG.value) || 0,
      cerceveY: Number(cerceveY.value) || 0
    };
  }

  /* ---------------- Ayar arayüzü ---------------- */
  function kaydiriciBoyama(el) {
    var min = Number(el.min || 0), max = Number(el.max || 100), v = Number(el.value);
    var p = ((v - min) / (max - min)) * 100;
    el.style.setProperty('--dolu', p + '%');
  }

  function ayarGorunumuGuncelle() {
    var h = hedefBicim();
    var tanim = M.BICIMLER[h];

    // Kalite yalnız kayıplı biçimlerde geçerli
    kaliteAlan.classList.toggle('kapali', !tanim.kayipli);
    kalite.disabled = !tanim.kayipli;

    // Arka plan rengi YALNIZ JPG'de anlamlı
    arkaPlanAlan.classList.toggle('kapali', h !== 'jpeg');
    arkaPlan.disabled = h !== 'jpeg';
    arkaPlanKod.disabled = h !== 'jpeg';

    if (h === 'png') {
      hedefIpuclari.textContent = 'PNG seçildi: kayıpsız yazılır, saydamlık korunur, dosya daha büyük olabilir.';
    } else if (h === 'jpeg') {
      hedefIpuclari.textContent = 'JPG seçildi: saydam alanlar seçtiğiniz arka plan rengiyle doldurulur.';
    } else {
      hedefIpuclari.textContent = 'WebP seçildi: kayıplı, küçük dosya; saydamlık desteklenir.';
    }

    // Yeniden boyutlandırma alanları
    $('boyutYuzde').classList.toggle('gizli', boyutModu.value !== 'yuzde');
    $('boyutGenislik').classList.toggle('gizli', boyutModu.value !== 'genislik');
    $('boyutCerceve').classList.toggle('gizli', boyutModu.value !== 'cerceve');

    var ipuc = {
      yok: 'Görseller orijinal çözünürlüğünde kalır.',
      yuzde: 'Genişlik ve yükseklik aynı yüzdeyle ölçeklenir.',
      genislik: 'Genişlik sabitlenir, yükseklik orana göre hesaplanır.',
      cerceve: 'Oran korunarak verilen kutuya sığdırılır (kırpma yapılmaz).'
    };
    boyutIpucu.textContent = ipuc[boyutModu.value] || '';
  }

  /* ---------------- Liste çizimi ---------------- */
  function kartOlustur(o) {
    var li = document.createElement('li');
    li.className = 'kart';
    li.setAttribute('data-id', o.id);

    var oniz = document.createElement('div');
    oniz.className = 'onizleme';
    oniz.setAttribute('role', 'img');
    oniz.setAttribute('aria-label', o.ad + ' önizlemesi');
    if (o.url) oniz.style.backgroundImage = 'url("' + o.url + '")';

    var bilgi = document.createElement('div');
    bilgi.className = 'bilgi';

    var ad = document.createElement('div');
    ad.className = 'ad';
    ad.textContent = o.ad;
    ad.title = o.ad;

    var meta = document.createElement('div');
    meta.className = 'meta';

    var durum = document.createElement('div');
    durum.className = 'durum bekliyor';
    durum.textContent = 'Bekliyor';

    var hataEl = document.createElement('div');
    hataEl.className = 'hata-mesaji';
    hataEl.style.display = 'none';

    bilgi.appendChild(ad);
    bilgi.appendChild(meta);
    bilgi.appendChild(durum);
    bilgi.appendChild(hataEl);

    var eylem = document.createElement('div');
    eylem.className = 'kart-eylem';

    li.appendChild(oniz);
    li.appendChild(bilgi);
    li.appendChild(eylem);

    o.el = { li: li, oniz: oniz, ad: ad, meta: meta, durum: durum, hata: hataEl, eylem: eylem };
    kartDurumGuncelle(o);
    return li;
  }

  function kartDurumGuncelle(o) {
    if (!o.el) return;
    var e = o.el;
    e.li.classList.remove('basarili', 'hata');
    e.hata.style.display = 'none';
    e.eylem.innerHTML = '';

    var kaynakMetin = o.file.name + ' · ' + M.insanBoyut(o.file.size);
    var metaParcalar = [kaynakMetin];

    if (o.durum === 'bekliyor') {
      e.durum.className = 'durum bekliyor';
      e.durum.textContent = 'Bekliyor';
    } else if (o.durum === 'isliyor') {
      e.durum.className = 'durum isliyor';
      e.durum.textContent = 'Dönüştürülüyor…';
    } else if (o.durum === 'tamam' && o.sonuc) {
      e.li.classList.add('basarili');
      e.durum.className = 'durum ok';
      e.durum.textContent = '✓ Dönüştürüldü → ' + o.sonuc.ad;
      e.ad.textContent = o.sonuc.ad;
      e.ad.title = o.sonuc.ad;

      var once = o.sonuc.kaynakBoyut.bayt;
      var sonra = o.sonuc.ciktiBoyut.bayt;
      metaParcalar = [
        'Önce: ' + M.insanBoyut(once) + ' (' + o.sonuc.kaynakBoyut.g + '×' + o.sonuc.kaynakBoyut.y + ')',
        'Sonra: ' + M.insanBoyut(sonra) + ' (' + o.sonuc.ciktiBoyut.g + '×' + o.sonuc.ciktiBoyut.y + ')',
        o.sonuc.hedefMime
      ];

      var fark = sonra - once;
      var yuzdeFark = once > 0 ? Math.round((fark / once) * 100) : 0;
      var farkEl = document.createElement('span');
      farkEl.className = 'fark ' + (fark < 0 ? 'kucuk' : (fark > 0 ? 'buyuk' : 'esit'));
      farkEl.textContent = (fark > 0 ? '+' : '') + yuzdeFark + '%';
      farkEl.title = (fark > 0 ? 'Büyüdü: +' : 'Küçüldü: ') + M.insanBoyut(Math.abs(fark));
      e.eylem.appendChild(farkEl);

      var indirBtn = document.createElement('button');
      indirBtn.className = 'btn kucuk';
      indirBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 4v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/></svg> İndir';
      indirBtn.addEventListener('click', function () { indir(o.sonuc.blob, o.sonuc.ad); });
      e.eylem.appendChild(indirBtn);
    } else if (o.durum === 'hata') {
      e.li.classList.add('hata');
      e.durum.className = 'durum hata';
      e.durum.textContent = '✕ Dönüştürülemedi';
      e.hata.style.display = 'block';
      e.hata.textContent = o.hata || 'Bilinmeyen hata.';
    }

    e.meta.innerHTML = '';
    metaParcalar.forEach(function (t) {
      var sp = document.createElement('span');
      sp.textContent = t;
      e.meta.appendChild(sp);
    });

    var silBtn = document.createElement('button');
    silBtn.className = 'btn kucuk tehlike';
    silBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    silBtn.setAttribute('aria-label', o.ad + ' öğesini listeden kaldır');
    silBtn.title = 'Listeden kaldır';
    silBtn.addEventListener('click', function () { ogeKaldir(o); });
    e.eylem.appendChild(silBtn);
  }

  function listeyiCiz() {
    liste.innerHTML = '';
    ogeler.forEach(function (o) { liste.appendChild(kartOlustur(o)); });
    durumlariGuncelle();
  }

  function durumlariGuncelle() {
    var toplam = ogeler.length;
    var tamam = ogeler.filter(function (o) { return o.durum === 'tamam'; }).length;
    var hata = ogeler.filter(function (o) { return o.durum === 'hata'; }).length;

    bosDurum.style.display = toplam ? 'none' : 'block';

    if (!toplam) {
      listeOzet.textContent = '';
    } else {
      var t = toplam + ' görsel';
      if (tamam) t += ' · ' + tamam + ' hazır';
      if (hata) t += ' · ' + hata + ' hatalı';
      listeOzet.textContent = t;
    }

    donusturBtn.disabled = calisiyor || toplam === 0;
    zipBtn.disabled = calisiyor || tamam === 0;
    temizleBtn.disabled = calisiyor || toplam === 0;
    $('donusturEtiket').textContent = tamam && tamam === toplam
      ? 'Yeniden dönüştür'
      : (toplam > 1 ? 'Tümünü dönüştür (' + toplam + ')' : 'Dönüştür');
  }

  /* ---------------- Öğe ekleme / kaldırma ---------------- */
  async function dosyalariEkle(dosyaListesi) {
    var adlar = dosyaListesi.filter(function (f) { return f && f.size >= 0; });
    if (!adlar.length) return;

    var reddedilen = [];
    var eklenen = 0;

    for (var i = 0; i < adlar.length; i++) {
      var f = adlar[i];
      if (!/^image\//i.test(f.type || '') && !/\.(png|jpe?g|webp|gif|bmp|avif|svg|tiff?)$/i.test(f.name)) {
        reddedilen.push(f.name);
        continue;
      }
      sayac++;
      var o = {
        id: sayac,
        file: f,
        ad: f.name,
        durum: 'bekliyor',
        sonuc: null,
        hata: null,
        url: URL.createObjectURL(f)
      };
      ogeler.push(o);
      eklenen++;
    }

    if (reddedilen.length) {
      uyari('Görsel olmayan ' + reddedilen.length + ' dosya atlandı: ' + reddedilen.join(', '), 'hata');
    } else if (eklenen) {
      uyari('');
    }

    listeyiCiz();
  }

  function ogeKaldir(o) {
    var i = ogeler.indexOf(o);
    if (i === -1) return;
    if (o.url) URL.revokeObjectURL(o.url);
    ogeler.splice(i, 1);
    if (o.el && o.el.li.parentNode) o.el.li.parentNode.removeChild(o.el.li);
    durumlariGuncelle();
  }

  /* ---------------- Dönüştürme akışı ---------------- */
  function ilerlemeGoster(yuzdeVal, metin, durdu) {
    ilerlemeKutu.classList.add('acik');
    cubuk.classList.toggle('durdu', !!durdu);
    cubukDolu.style.width = Math.max(0, Math.min(100, yuzdeVal)) + '%';
    ilerlemeYuzde.textContent = Math.round(yuzdeVal) + '%';
    ilerlemeMetin.textContent = metin;
  }

  async function tumunuDonustur() {
    if (calisiyor) return;
    var hedefler = ogeler.slice();
    if (!hedefler.length) return;

    calisiyor = true;
    iptalIstendi = false;
    uyari('');
    iptalBtn.disabled = false;
    iptalBtn.lastChild.textContent = ' İptal';
    durumlariGuncelle();

    var ayar = ayarlariOku();
    var toplam = hedefler.length;
    var basarili = 0;
    var hatali = 0;
    var baslangic = performance.now();

    for (var i = 0; i < toplam; i++) {
      if (iptalIstendi) break;
      var o = hedefler[i];
      o.durum = 'isliyor';
      o.hata = null;
      kartDurumGuncelle(o);
      ilerlemeGoster((i / toplam) * 100, 'Dönüştürülüyor: ' + o.ad + ' (' + (i + 1) + '/' + toplam + ')');

      try {
        // Arayüzün boyanmasına fırsat ver
        await M.bekle(0);
        var sonuc = await M.donustur(o.file, ayar);
        o.sonuc = sonuc;
        o.durum = 'tamam';
        basarili++;
      } catch (err) {
        // Hatalar SESSİZCE geçilmez: kartta ve uyarı kutusunda görünür.
        o.durum = 'hata';
        o.hata = (err && err.message) ? err.message : String(err);
        hatali++;
      }
      kartDurumGuncelle(o);
      ilerlemeGoster(((i + 1) / toplam) * 100, o.durum === 'tamam'
        ? 'Tamamlandı: ' + o.sonuc.ad
        : 'Hata: ' + o.ad);
      await M.bekle(0);
    }

    var biten = basarili + hatali;
    var sure = ((performance.now() - baslangic) / 1000).toFixed(1);

    if (iptalIstendi) {
      ilerlemeGoster((biten / toplam) * 100, 'İptal edildi — ' + basarili + ' görsel dönüştürüldü, kalanlar bekliyor.', true);
      uyari('İşlem iptal edildi. Dönüştürülen ' + basarili + ' görsel indirilebilir.');
      // Kalan "isliyor" durumlarını bekliyor'a çevir
      hedefler.forEach(function (x) { if (x.durum === 'isliyor') { x.durum = 'bekliyor'; kartDurumGuncelle(x); } });
    } else {
      ilerlemeGoster(100, 'Bitti — ' + basarili + ' başarılı' + (hatali ? ', ' + hatali + ' hatalı' : '') + ' (' + sure + ' sn)');
      if (hatali) {
        uyari(hatali + ' görsel dönüştürülemedi. Nedenler ilgili kartların altında yazıyor.', 'hata');
      }
    }

    calisiyor = false;
    iptalBtn.disabled = true;
    durumlariGuncelle();
  }

  /* ---------------- ZIP ---------------- */
  async function zipIndir() {
    var hazirlar = ogeler.filter(function (o) { return o.durum === 'tamam' && o.sonuc; });
    if (!hazirlar.length) {
      uyari('ZIP için önce en az bir görsel dönüştürün.', 'hata');
      return;
    }
    zipBtn.disabled = true;
    var eski = zipBtn.innerHTML;
    zipBtn.textContent = 'ZIP hazırlanıyor…';
    try {
      var kullanilan = {};
      var girisler = hazirlar.map(function (o) {
        var ad = M.benzersizAd(kullanilan, o.sonuc.ad);
        return { ad: ad, blob: o.sonuc.blob };
      });
      var z = await M.zipYap(girisler);
      var d = new Date();
      var damga = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
      indir(z.blob, 'numex-gorseller-' + damga + '.zip');
      uyari('');
      ilerlemeGoster(100, 'ZIP hazır: ' + z.dosyaSayisi + ' dosya · ' + M.insanBoyut(z.bayt));
    } catch (err) {
      uyari('ZIP oluşturulamadı: ' + (err && err.message ? err.message : err), 'hata');
    } finally {
      zipBtn.disabled = false;
      zipBtn.innerHTML = eski;
    }
  }

  /* ---------------- Olaylar ---------------- */
  damla.addEventListener('click', function () { dosyaGirdi.click(); });
  damla.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dosyaGirdi.click(); }
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    damla.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      damla.classList.add('uzerinde');
    });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    damla.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      if (e.target === damla || !damla.contains(e.relatedTarget)) damla.classList.remove('uzerinde');
    });
  });
  damla.addEventListener('drop', function (e) {
    e.preventDefault(); e.stopPropagation();
    damla.classList.remove('uzerinde');
    var dt = e.dataTransfer;
    if (!dt) return;
    var dosyalar = [];
    if (dt.items && dt.items.length) {
      for (var i = 0; i < dt.items.length; i++) {
        var it = dt.items[i];
        if (it.kind === 'file') {
          var f = it.getAsFile();
          if (f) dosyalar.push(f);
        }
      }
    } else if (dt.files) {
      dosyalar = Array.prototype.slice.call(dt.files);
    }
    dosyalariEkle(dosyalar);
  });

  // Sayfa genelinde sürüklenen dosyanın tarayıcıda açılmasını engelle
  ['dragover', 'drop'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!damla.contains(e.target)) e.preventDefault();
    });
  });

  dosyaGirdi.addEventListener('change', function () {
    var f = Array.prototype.slice.call(dosyaGirdi.files || []);
    dosyaGirdi.value = '';
    dosyalariEkle(f);
  });

  document.querySelectorAll('input[name="hedef"]').forEach(function (r) {
    r.addEventListener('change', ayarGorunumuGuncelle);
  });

  kalite.addEventListener('input', function () {
    kaliteDeger.textContent = kalite.value + '%';
    kaydiriciBoyama(kalite);
  });

  yuzde.addEventListener('input', function () {
    yuzdeDeger.textContent = yuzde.value + '%';
    kaydiriciBoyama(yuzde);
  });

  // Renk önizleme kutusu: tarayıcının swatch boyamasına güvenilmez,
  // seçili renk doğrudan katmanın arka planına yazılır.
  var renkOnizleme = $('renkOnizleme');
  function renkOnizlemeGuncelle(hex) {
    if (!renkOnizleme) return;
    renkOnizleme.style.setProperty('background-color', hex, 'important');
    renkOnizleme.setAttribute('data-renk', hex);
  }

  arkaPlan.addEventListener('input', function () {
    arkaPlanKod.value = arkaPlan.value.toUpperCase();
    renkOnizlemeGuncelle(arkaPlan.value);
  });

  arkaPlanKod.addEventListener('input', function () {
    var r = M.hexToRgb(arkaPlanKod.value);
    if (r) {
      arkaPlan.value = r.css;
      renkOnizlemeGuncelle(r.css);
    }
  });
  arkaPlanKod.addEventListener('blur', function () {
    var r = M.hexToRgb(arkaPlanKod.value);
    arkaPlanKod.value = r ? r.css : arkaPlan.value.toUpperCase();
    renkOnizlemeGuncelle(arkaPlan.value);
  });
  renkOnizlemeGuncelle(arkaPlan.value);

  boyutModu.addEventListener('change', ayarGorunumuGuncelle);

  zemin.addEventListener('change', function () {
    var v = zemin.value;
    var stiller = ogeler.map(function (o) { return o.el && o.el.oniz; }).filter(Boolean);
    stiller.forEach(function (el) {
      if (v === 'damali') {
        el.style.backgroundImage = (el.dataset.img || '');
        el.style.backgroundColor = '#eef1f6';
      } else if (v === 'beyaz') {
        el.style.backgroundImage = el.dataset.img || '';
        el.style.backgroundColor = '#ffffff';
      } else {
        el.style.backgroundImage = el.dataset.img || '';
        el.style.backgroundColor = '#1b2c4a';
      }
    });
  });

  donusturBtn.addEventListener('click', tumunuDonustur);
  zipBtn.addEventListener('click', zipIndir);

  temizleBtn.addEventListener('click', function () {
    if (calisiyor) return;
    ogeler.forEach(function (o) { if (o.url) URL.revokeObjectURL(o.url); });
    ogeler = [];
    sayac = 0;
    liste.innerHTML = '';
    ilerlemeKutu.classList.remove('acik');
    uyari('');
    durumlariGuncelle();
  });

  iptalBtn.addEventListener('click', function () {
    if (!calisiyor) return;
    iptalIstendi = true;
    iptalBtn.disabled = true;
    ilerlemeMetin.textContent = 'İptal ediliyor… (geçerli görsel bitirilecek)';
  });

  // Sayfadan ayrılırken blob URL'lerini bırak
  window.addEventListener('pagehide', function () {
    ogeler.forEach(function (o) { if (o.url) URL.revokeObjectURL(o.url); });
  });

  /* ---------------- Başlangıç ---------------- */
  function baslat() {
    kaydiriciBoyama(kalite);
    kaydiriciBoyama(yuzde);
    ayarGorunumuGuncelle();
    durumlariGuncelle();

    // Küçük resim arka planı için veri sakla (zemin değişimi için)
    var orijinalKart = kartOlustur;
    kartOlustur = function (o) {
      var li = orijinalKart(o);
      if (o.url) o.el.oniz.dataset.img = 'url("' + o.url + '")';
      return li;
    };

    // Test kancası (yalnız teşhis için)
    window.__numexGorsel = {
      durum: function () {
        return ogeler.map(function (o) {
          return {
            ad: o.ad, durum: o.durum,
            sonucAd: o.sonuc ? o.sonuc.ad : null,
            mime: o.sonuc ? o.sonuc.hedefMime : null,
            giris: o.sonuc ? o.sonuc.girisBicim : null,
            once: o.sonuc ? o.sonuc.kaynakBoyut : null,
            sonra: o.sonuc ? o.sonuc.ciktiBoyut : null,
            hata: o.hata
          };
        });
      },
      temizle: function () { temizleBtn.click(); },
      donustur: tumunuDonustur
    };
  }

  baslat();
})();
