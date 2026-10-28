/* ============================================================
   Mahalle Fırını — Sipariş Takip
   Saf JS, bağımlılık yok, veriler localStorage'da tutulur.
   ============================================================ */
(function () {
  'use strict';

  var DEPO_ANAHTAR = 'mahalle-firini-v1';

  var VARSAYILAN_URUNLER = [
    { id: 'simit',  ad: 'Simit',  fiyat: 15 },
    { id: 'pogaca', ad: 'Poğaça', fiyat: 20 },
    { id: 'acma',   ad: 'Açma',   fiyat: 25 },
    { id: 'ekmek',  ad: 'Ekmek',  fiyat: 12 }
  ];

  /* ---------- DURUM ---------- */
  var durum = {
    urunler: VARSAYILAN_URUNLER.map(function (u) { return { id: u.id, ad: u.ad, fiyat: u.fiyat }; }),
    siparisler: [],   // { id, musteri, kalemler:[{urunId, ad, adet, fiyat}], tutar, durum:'bekliyor'|'hazir'|'teslim', olusturma, gun }
    gecmis: [],       // { gun, ciro, siparisSayisi, teslimSayisi, urunler:[{ad, adet, tutar}] }
    sepet: {},        // { urunId: adet }
    filtre: 'aktif'
  };

  /* ---------- YARDIMCILAR ---------- */
  function $(sec) { return document.querySelector(sec); }
  function $$(sec) { return Array.prototype.slice.call(document.querySelectorAll(sec)); }
  // Fiyatlar Türk biçiminde: binlik nokta, kuruş ayırıcı virgül, sonda "TL" (ör. 1.250,50 TL)
  function para(n) {
    return (Math.round((n || 0) * 100) / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + ' TL';
  }
  function bugunKodu(t) {
    var d = t ? new Date(t) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function tarihYaz(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
  }
  function saatYaz(ts) {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function kacis(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- KALICILIK ---------- */
  function kaydet() {
    try {
      localStorage.setItem(DEPO_ANAHTAR, JSON.stringify({
        urunler: durum.urunler,
        siparisler: durum.siparisler,
        gecmis: durum.gecmis
      }));
      return true;
    } catch (e) {
      bildir('Veri kaydedilemedi: ' + (e && e.message ? e.message : 'tarayıcı depolaması kapalı'), true);
      return false;
    }
  }

  function yukle() {
    var ham;
    try { ham = localStorage.getItem(DEPO_ANAHTAR); } catch (e) { ham = null; }
    if (!ham) return;
    try {
      var veri = JSON.parse(ham);
      if (veri && Array.isArray(veri.urunler) && veri.urunler.length) {
        durum.urunler = veri.urunler.map(function (u) {
          return { id: u.id || uid(), ad: String(u.ad || 'Ürün'), fiyat: Number(u.fiyat) || 0 };
        });
      }
      if (veri && Array.isArray(veri.siparisler)) durum.siparisler = veri.siparisler;
      if (veri && Array.isArray(veri.gecmis)) durum.gecmis = veri.gecmis;
    } catch (e) {
      bildir('Kayıtlı veri okunamadı, temiz başlanıyor.', true);
    }
  }

  /* ---------- BİLDİRİM ---------- */
  var bildirimZaman;
  function bildir(mesaj, hataMi) {
    var el = $('#bildirim');
    el.textContent = mesaj;
    el.className = 'bildirim goster' + (hataMi ? ' hata' : '');
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { el.className = 'bildirim'; }, 2400);
  }

  /* ---------- ÜRÜN / SEPET ---------- */
  function urunBul(id) {
    for (var i = 0; i < durum.urunler.length; i++) if (durum.urunler[i].id === id) return durum.urunler[i];
    return null;
  }

  function sepetToplam() {
    var t = 0;
    durum.urunler.forEach(function (u) {
      var adet = durum.sepet[u.id] || 0;
      t += adet * u.fiyat;
    });
    return t;
  }

  function sepetAdetToplam() {
    var t = 0;
    for (var k in durum.sepet) if (Object.prototype.hasOwnProperty.call(durum.sepet, k)) t += durum.sepet[k];
    return t;
  }

  function urunSecimCiz() {
    var kap = $('#urunSecimListesi');
    kap.innerHTML = durum.urunler.map(function (u) {
      var adet = durum.sepet[u.id] || 0;
      return '' +
        '<div class="urun-satir' + (adet > 0 ? ' secili' : '') + '" data-urun="' + kacis(u.id) + '">' +
          '<div class="urun-bilgi">' +
            '<div class="urun-ad">' + kacis(u.ad) + '</div>' +
            '<div class="urun-fiyat">' + para(u.fiyat) + ' / adet</div>' +
          '</div>' +
          '<div class="adet-kontrol">' +
            '<button class="adet-btn eksi" data-islem="eksi" data-urun="' + kacis(u.id) + '" aria-label="' + kacis(u.ad) + ' azalt"' + (adet <= 0 ? ' disabled' : '') + '>−</button>' +
            '<span class="adet-deger" aria-live="polite">' + adet + '</span>' +
            '<button class="adet-btn arti" data-islem="arti" data-urun="' + kacis(u.id) + '" aria-label="' + kacis(u.ad) + ' artır">+</button>' +
          '</div>' +
        '</div>';
    }).join('');
    sepetOzetCiz();
  }

  function sepetOzetCiz() {
    var adet = sepetAdetToplam();
    var toplam = sepetToplam();
    if (adet === 0) {
      $('#sepetOzet').textContent = 'Henüz ürün seçilmedi';
    } else {
      var parcalar = durum.urunler
        .filter(function (u) { return (durum.sepet[u.id] || 0) > 0; })
        .map(function (u) { return (durum.sepet[u.id]) + '× ' + u.ad; });
      $('#sepetOzet').textContent = parcalar.join(', ');
    }
    $('#sepetToplam').textContent = para(toplam);
    $('#siparisEkleBtn').disabled = adet === 0;
  }

  /* ---------- SİPARİŞ EKLE ---------- */
  function siparisEkle() {
    var adet = sepetAdetToplam();
    if (adet === 0) { bildir('Önce ürün seçin.', true); return; }

    var musteriEl = $('#musteri');
    var musteri = musteriEl.value.trim() || 'İsimsiz müşteri';

    var kalemler = durum.urunler
      .filter(function (u) { return (durum.sepet[u.id] || 0) > 0; })
      .map(function (u) {
        return { urunId: u.id, ad: u.ad, adet: durum.sepet[u.id], fiyat: u.fiyat };
      });

    var simdi = Date.now();
    var siparis = {
      id: uid(),
      musteri: musteri,
      kalemler: kalemler,
      tutar: Math.round(sepetToplam() * 100) / 100,
      durum: 'bekliyor',
      olusturma: simdi,
      gun: bugunKodu(simdi)
    };

    durum.siparisler.unshift(siparis);
    durum.sepet = {};
    musteriEl.value = '';
    kaydet();

    urunSecimCiz();
    siparisleriCiz();
    gunSonuCiz();
    musteriEl.focus();
    bildir(musteri + ' · ' + para(siparis.tutar) + ' kaydedildi');
  }

  /* ---------- DURUM DEĞİŞTİR ---------- */
  function durumDegistir(id, yeniDurum) {
    var s = null;
    for (var i = 0; i < durum.siparisler.length; i++) if (durum.siparisler[i].id === id) { s = durum.siparisler[i]; break; }
    if (!s) return;
    if (yeniDurum) {
      s.durum = yeniDurum;
      kaydet();
      siparisleriCiz();
      gunSonuCiz();
      bildir(s.musteri + ' → ' + (yeniDurum === 'hazir' ? 'Hazır' : 'Teslim edildi'));
    }
  }

  function siparisSil(id) {
    for (var i = 0; i < durum.siparisler.length; i++) {
      if (durum.siparisler[i].id === id) {
        var s = durum.siparisler[i];
        if (!confirm('"' + s.musteri + '" siparişi silinsin mi?')) return;
        durum.siparisler.splice(i, 1);
        kaydet();
        siparisleriCiz();
        gunSonuCiz();
        bildir('Sipariş silindi');
        return;
      }
    }
  }

  /* ---------- SİPARİŞ LİSTESİ ---------- */
  function gununSiparisleri() {
    var g = bugunKodu();
    return durum.siparisler.filter(function (s) { return s.gun === g; });
  }

  function siparisleriCiz() {
    var kap = $('#siparisListesi');
    var hepsi = durum.siparisler.slice(); // en yeni önce

    var liste = hepsi.filter(function (s) {
      if (durum.filtre === 'aktif') return s.durum === 'bekliyor' || s.durum === 'hazir';
      if (durum.filtre === 'teslim') return s.durum === 'teslim';
      return true;
    });

    var aktifSayi = hepsi.filter(function (s) { return s.durum !== 'teslim'; }).length;
    var rozet = $('#rozetAktif');
    rozet.textContent = aktifSayi;
    rozet.className = 'rozet' + (aktifSayi === 0 ? ' sifir' : '');

    if (!liste.length) {
      kap.innerHTML = '<div class="bos-durum"><span class="buyuk">🥯</span>' +
        (durum.filtre === 'aktif' ? 'Bekleyen sipariş yok. Yeni sipariş ekleyebilirsin.' :
         durum.filtre === 'teslim' ? 'Henüz teslim edilen sipariş yok.' : 'Hiç sipariş kaydı yok.') +
        '</div>';
      return;
    }

    kap.innerHTML = liste.map(function (s) {
      var durumAd = s.durum === 'bekliyor' ? 'Bekliyor' : (s.durum === 'hazir' ? 'Hazır' : 'Teslim edildi');
      var urunler = s.kalemler.map(function (k) { return k.adet + '× ' + k.ad; }).join(' · ');
      var butonlar = '';
      if (s.durum === 'bekliyor') {
        butonlar += '<button class="durum-btn yeşil" data-islem="hazir" data-id="' + kacis(s.id) + '">✓ Hazır olarak işaretle</button>';
      } else if (s.durum === 'hazir') {
        butonlar += '<button class="durum-btn yeşil" data-islem="teslim" data-id="' + kacis(s.id) + '">✓ Teslim edildi</button>';
      } else {
        butonlar += '<button class="durum-btn" data-islem="geri" data-id="' + kacis(s.id) + '">↩ Geri al</button>';
      }
      butonlar += '<button class="durum-btn sil" data-islem="sil" data-id="' + kacis(s.id) + '" title="Siparişi sil" aria-label="Siparişi sil">🗑</button>';

      return '' +
        '<article class="siparis-kart ' + s.durum + '">' +
          '<div class="sk-ust">' +
            '<div class="sk-musteri">' + kacis(s.musteri) + '</div>' +
            '<div class="sk-saat">' + saatYaz(s.olusturma) + '</div>' +
          '</div>' +
          '<div class="sk-urunler">' + kacis(urunler) + '</div>' +
          '<div class="sk-alt">' +
            '<span class="durum-etiket ' + s.durum + '">' + durumAd + '</span>' +
            '<span class="sk-tutar">' + para(s.tutar) + '</span>' +
          '</div>' +
          '<div class="sk-butonlar">' + butonlar + '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------- GÜN SONU ---------- */
  function gunSonuCiz() {
    var bugun = gununSiparisleri();
    var teslim = bugun.filter(function (s) { return s.durum === 'teslim'; });
    var ciro = teslim.reduce(function (t, s) { return t + s.tutar; }, 0);

    $('#ustCiro').textContent = para(ciro);
    $('#gunCiro').textContent = para(ciro);
    $('#gunSiparisSayisi').textContent = bugun.length;
    $('#gunTeslimSayisi').textContent = teslim.length;
    $('#gunBekleyenSayisi').textContent = bugun.filter(function (s) { return s.durum !== 'teslim'; }).length;

    // Ürün bazlı (teslim edilenlerden)
    var harita = {};
    teslim.forEach(function (s) {
      s.kalemler.forEach(function (k) {
        if (!harita[k.ad]) harita[k.ad] = { ad: k.ad, adet: 0, tutar: 0 };
        harita[k.ad].adet += k.adet;
        harita[k.ad].tutar += k.adet * k.fiyat;
      });
    });
    var satirlar = Object.keys(harita).map(function (k) { return harita[k]; });
    satirlar.sort(function (a, b) { return b.tutar - a.tutar; });

    var kap = $('#urunOzet');
    if (!satirlar.length) {
      kap.innerHTML = '<div class="bos-durum"><span class="buyuk">📦</span>Teslim edilen sipariş yok, satış özeti boş.</div>';
    } else {
      kap.innerHTML = satirlar.map(function (u) {
        return '<div class="uo-satir">' +
          '<span class="uo-ad">' + kacis(u.ad) + '</span>' +
          '<span class="uo-adet">' + u.adet + ' adet</span>' +
          '<span class="uo-tutar">' + para(u.tutar) + '</span>' +
        '</div>';
      }).join('');
    }

    // Geçmiş günler
    var gecmisKap = $('#gecmisGunler');
    if (!durum.gecmis.length) {
      gecmisKap.innerHTML = '<p class="kucuk-not" style="margin:0">Henüz kapatılmış gün yok.</p>';
    } else {
      gecmisKap.innerHTML = durum.gecmis.slice(0, 30).map(function (g) {
        return '<div class="g-satir">' +
          '<div><div class="g-tarih">' + kacis(g.gun) + '</div>' +
          '<div class="g-detay">' + g.siparisSayisi + ' sipariş · ' + g.teslimSayisi + ' teslim</div></div>' +
          '<span class="g-tutar">' + para(g.ciro) + '</span>' +
        '</div>';
      }).join('');
    }

    var gunKapatBtn = $('#gunuKapatBtn');
    gunKapatBtn.disabled = bugun.length === 0;
    gunKapatBtn.style.opacity = bugun.length === 0 ? '.45' : '1';
  }

  function gunuKapat() {
    var bugun = gununSiparisleri();
    if (!bugun.length) { bildir('Bugün hiç sipariş yok, kapatılacak bir şey yok.', true); return; }

    var teslim = bugun.filter(function (s) { return s.durum === 'teslim'; });
    var ciro = teslim.reduce(function (t, s) { return t + s.tutar; }, 0);
    var harita = {};
    teslim.forEach(function (s) {
      s.kalemler.forEach(function (k) {
        if (!harita[k.ad]) harita[k.ad] = { ad: k.ad, adet: 0, tutar: 0 };
        harita[k.ad].adet += k.adet;
        harita[k.ad].tutar += k.adet * k.fiyat;
      });
    });

    if (!confirm('Bugünün ' + bugun.length + ' siparişi kapatılsın mı?\n\nCiro: ' + para(ciro) + '\nTeslim edilmeyen ' + (bugun.length - teslim.length) + ' sipariş de geçmişe taşınır.')) return;

    durum.gecmis.unshift({
      gun: tarihYaz(Date.now()),
      ciro: Math.round(ciro * 100) / 100,
      siparisSayisi: bugun.length,
      teslimSayisi: teslim.length,
      urunler: Object.keys(harita).map(function (k) { return harita[k]; })
    });
    durum.siparisler = durum.siparisler.filter(function (s) { return s.gun !== bugunKodu(); });
    kaydet();
    siparisleriCiz();
    gunSonuCiz();
    bildir('Gün kapatıldı: ' + para(ciro));
  }

  /* ---------- AYARLAR / FİYAT ---------- */
  function ayarCiz() {
    var kap = $('#ayarUrunler');
    kap.innerHTML = durum.urunler.map(function (u) {
      return '<div class="ayar-satir">' +
        '<span class="ayar-ad" title="' + kacis(u.ad) + '">' + kacis(u.ad) + '</span>' +
        '<input class="ayar-fiyat" type="number" min="0" step="0.5" inputmode="decimal" ' +
          'value="' + (u.fiyat || 0) + '" data-fiyat-id="' + kacis(u.id) + '" aria-label="' + kacis(u.ad) + ' fiyatı">' +
        '<button class="mini-btn" data-sil-id="' + kacis(u.id) + '" aria-label="' + kacis(u.ad) + ' ürününü sil">🗑</button>' +
      '</div>';
    }).join('');
  }

  function fiyatGuncelle(id, deger) {
    var u = urunBul(id);
    if (!u) return;
    var f = deger === '' ? 0 : Number(String(deger).replace(',', '.'));
    if (isNaN(f) || f < 0) f = 0;
    u.fiyat = Math.round(f * 100) / 100;
    kaydet();
    urunSecimCiz();
  }

  function urunSil(id) {
    if (durum.urunler.length <= 1) { bildir('En az bir ürün kalmalı.', true); return; }
    var u = urunBul(id);
    if (!u) return;
    if (!confirm('"' + u.ad + '" ürünü listeden kaldırılsın mı? (Geçmiş siparişler etkilenmez)')) return;
    durum.urunler = durum.urunler.filter(function (x) { return x.id !== id; });
    delete durum.sepet[id];
    kaydet();
    ayarCiz();
    urunSecimCiz();
  }

  function urunEkle() {
    var adEl = $('#yeniUrunAd');
    var fEl = $('#yeniUrunFiyat');
    var ad = adEl.value.trim();
    if (!ad) { bildir('Ürün adı boş olamaz.', true); adEl.focus(); return; }
    var f = Number(String(fEl.value).replace(',', '.'));
    if (isNaN(f) || f < 0) f = 0;

    durum.urunler.push({ id: uid(), ad: ad, fiyat: Math.round(f * 100) / 100 });
    adEl.value = '';
    fEl.value = '';
    kaydet();
    ayarCiz();
    urunSecimCiz();
    bildir('"' + ad + '" eklendi');
    adEl.focus();
  }

  /* ---------- SEKMELER ---------- */
  function sekmeGec(ad) {
    $$('.sekme').forEach(function (b) {
      var aktif = b.getAttribute('data-sekme') === ad;
      b.classList.toggle('aktif', aktif);
      b.setAttribute('aria-selected', aktif ? 'true' : 'false');
    });
    $$('.panel').forEach(function (p) {
      p.classList.toggle('aktif', p.id === 'panel-' + ad);
    });
  }

  /* ---------- OLAYLAR ---------- */
  function bagla() {
    // sekmeler
    $$('.sekme').forEach(function (b) {
      b.addEventListener('click', function () { sekmeGec(b.getAttribute('data-sekme')); });
    });

    // ürün adet butonları (delegasyon)
    $('#urunSecimListesi').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-islem]');
      if (!btn) return;
      var id = btn.getAttribute('data-urun');
      var u = urunBul(id);
      if (!u) return;
      var mevcut = durum.sepet[id] || 0;
      if (btn.getAttribute('data-islem') === 'arti') {
        durum.sepet[id] = mevcut + 1;
      } else {
        durum.sepet[id] = mevcut - 1;
        if (durum.sepet[id] <= 0) delete durum.sepet[id];
      }
      urunSecimCiz();
    });

    $('#temizleMusteri').addEventListener('click', function () {
      $('#musteri').value = '';
      $('#musteri').focus();
    });

    $('#musteri').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !$('#siparisEkleBtn').disabled) siparisEkle();
    });

    $('#siparisEkleBtn').addEventListener('click', siparisEkle);

    // filtreler
    $('#filtreler').addEventListener('click', function (e) {
      var cip = e.target.closest('.cip');
      if (!cip) return;
      durum.filtre = cip.getAttribute('data-filtre');
      $$('#filtreler .cip').forEach(function (c) { c.classList.toggle('aktif', c === cip); });
      siparisleriCiz();
    });

    // sipariş kartı butonları
    $('#siparisListesi').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-islem]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var islem = btn.getAttribute('data-islem');
      if (islem === 'hazir') durumDegistir(id, 'hazir');
      else if (islem === 'teslim') durumDegistir(id, 'teslim');
      else if (islem === 'geri') durumDegistir(id, 'hazir');
      else if (islem === 'sil') siparisSil(id);
    });

    // gün kapat
    $('#gunuKapatBtn').addEventListener('click', gunuKapat);

    // ayar modalı
    $('#ayarBtn').addEventListener('click', function () {
      ayarCiz();
      $('#ayarModal').hidden = false;
    });
    $('#ayarKapat').addEventListener('click', function () { $('#ayarModal').hidden = true; });
    $('#ayarTamam').addEventListener('click', function () { $('#ayarModal').hidden = true; });
    $('#ayarModal').addEventListener('click', function (e) {
      if (e.target === $('#ayarModal')) $('#ayarModal').hidden = true;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('#ayarModal').hidden = true;
    });

    $('#ayarUrunler').addEventListener('input', function (e) {
      var inp = e.target.closest('[data-fiyat-id]');
      if (!inp) return;
      fiyatGuncelle(inp.getAttribute('data-fiyat-id'), inp.value);
    });
    $('#ayarUrunler').addEventListener('blur', function (e) {
      var inp = e.target.closest && e.target.closest('[data-fiyat-id]');
      if (!inp) return;
      var u = urunBul(inp.getAttribute('data-fiyat-id'));
      if (u) inp.value = u.fiyat;
    }, true);
    $('#ayarUrunler').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-sil-id]');
      if (!btn) return;
      urunSil(btn.getAttribute('data-sil-id'));
    });

    $('#yeniUrunEkle').addEventListener('click', urunEkle);
    $('#yeniUrunFiyat').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') urunEkle();
    });
  }

  /* ---------- BAŞLAT ---------- */
  function baslat() {
    yukle();
    $('#tarihMetni').textContent = tarihYaz(Date.now());
    bagla();
    urunSecimCiz();
    siparisleriCiz();
    gunSonuCiz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
