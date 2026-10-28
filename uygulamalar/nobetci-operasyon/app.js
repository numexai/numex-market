/* Nöbetçi Operasyon Merkezi — Arayüz Katmanı
   XSS'e karşı her yerde textContent kullanılır; innerHTML ile kullanıcı verisi basılmaz. */
(function () {
  'use strict';

  var S = window.NobetciStore;

  var SEVIYE_ETIKET = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek', kritik: 'Kritik' };
  var DURUM_ETIKET = { acik: 'Açık', inceleniyor: 'İnceleniyor', mudahale: 'Müdahale Ediliyor', cozuldu: 'Çözüldü' };
  var GOREV_ETIKET = { bekliyor: 'Bekliyor', devam: 'Devam Ediyor', tamamlandi: 'Tamamlandı' };
  var ZAMAN_ETIKET = { gecikmis: 'Gecikmiş', bugun: 'Bugün', yarin: 'Yarın', ileri: 'İleri Tarih', tarihyok: 'Tarih Yok', tamamlandi: 'Tamamlandı' };

  // Demo veri: uygulama ilk açılışta boş kalmasın.
  var DEMO = {
    olaylar: [
      {
        id: 'olay_demo_1', baslik: 'Ödeme API yanıt süresi 8 saniyeye çıktı',
        aciklama: 'Üretim ortamında ödeme uç noktası zaman aşımlarına düşmeye başladı.',
        seviye: 'kritik', servis: 'Ödeme API', sorumlu: 'Ayşe K.', durum: 'mudahale',
        olusturma: new Date(Date.now() - 3600e3 * 5).toISOString(),
        guncelleme: new Date(Date.now() - 3600e3 * 2).toISOString()
      },
      {
        id: 'olay_demo_2', baslik: 'Yedekleme görevi 03:00 penceresinde çalışmadı',
        aciklama: 'Gece yedekleme penceresi boş geçmiş, log dosyasında hata var.',
        seviye: 'yuksek', servis: 'Yedekleme', sorumlu: 'Murat T.', durum: 'inceleniyor',
        olusturma: new Date(Date.now() - 3600e3 * 26).toISOString(),
        guncelleme: new Date(Date.now() - 3600e3 * 20).toISOString()
      },
      {
        id: 'olay_demo_3', baslik: 'Giriş ekranı mobilde kayıyor',
        aciklama: 'iOS Safari\'de form alanı klavye açılınca yukarı kayıyor.',
        seviye: 'dusuk', servis: 'Web Arayüzü', sorumlu: 'Zeynep A.', durum: 'acik',
        olusturma: new Date(Date.now() - 3600e3 * 72).toISOString(),
        guncelleme: new Date(Date.now() - 3600e3 * 72).toISOString()
      }
    ],
    gorevler: [
      {
        id: 'gorev_demo_1', olayId: 'olay_demo_1', baslik: 'Yavaş sorguları tespit et',
        sorumlu: 'Ayşe K.', durum: 'devam', sonTarih: S.bugunISO(),
        olusturma: new Date(Date.now() - 3600e3 * 4).toISOString()
      },
      {
        id: 'gorev_demo_2', olayId: 'olay_demo_1', baslik: 'Bağlantı havuzu boyutunu gözden geçir',
        sorumlu: 'Murat T.', durum: 'tamamlandi', sonTarih: S.bugunISO(),
        olusturma: new Date(Date.now() - 3600e3 * 3).toISOString()
      },
      {
        id: 'gorev_demo_3', olayId: 'olay_demo_2', baslik: 'Cron ifadesini doğrula',
        sorumlu: 'Murat T.', durum: 'bekliyor', sonTarih: S.bugunISO(),
        olusturma: new Date(Date.now() - 3600e3 * 24).toISOString()
      }
    ]
  };

  var store = new S.Store(window.localStorage);
  var seciliOlayId = null;
  var duzenlenenOlayId = null;
  var onayCallback = null;

  /* --- Kısayollar --- */
  function el(id) { return document.getElementById(id); }
  function goster(x) { x.classList.remove('gizli'); }
  function gizle(x) { x.classList.add('gizli'); }

  function toast(mesaj, tip) {
    var kutu = document.createElement('div');
    kutu.className = 'toast toast-' + (tip || 'bilgi');
    kutu.textContent = mesaj;
    el('toastAlan').appendChild(kutu);
    setTimeout(function () {
      if (kutu.parentNode) kutu.parentNode.removeChild(kutu);
    }, 3800);
  }

  function tarihYaz(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  }

  /* --- Uygulama ici onay modali --- */
  function onayIste(baslik, metin, butonYazi, cb) {
    el('onayBaslik').textContent = baslik;
    el('onayMetin').textContent = metin;
    el('btnOnayEvet').textContent = butonYazi || 'Sil';
    onayCallback = cb;
    goster(el('onayArka'));
    el('btnOnayEvet').focus();
  }
  function onayKapat() {
    gizle(el('onayArka'));
    onayCallback = null;
  }
  el('btnOnayEvet').addEventListener('click', function () {
    var cb = onayCallback;
    onayKapat();
    if (cb) cb();
  });
  el('btnOnayHayir').addEventListener('click', onayKapat);
  el('onayArka').addEventListener('click', function (e) {
    if (e.target === el('onayArka')) onayKapat();
  });

  /* --- Sayaçlar --- */
  function sayaclariCiz() {
    var t = store.sayaclar();
    ['toplamOlay', 'acikOlay', 'kritikOlay', 'mudahale', 'cozulen',
     'gecikenGorev', 'acikGorev', 'tamamlananGorev'].forEach(function (k) {
      var hedef = el('s-' + k);
      if (hedef) hedef.textContent = String(t[k]);
    });
  }

  /* --- Filtreler --- */
  function filtreDurumu() {
    return {
      metin: el('filtreMetin').value,
      durum: el('filtreDurum').value,
      seviye: el('filtreSeviye').value,
      servis: el('filtreServis').value,
      sorumlu: el('filtreSorumlu').value,
      sirala: el('filtreSirala').value
    };
  }

  function secenekDoldur(selectId, degerler, secili) {
    var sel = el(selectId);
    var mevcut = secili !== undefined ? secili : sel.value;
    sel.textContent = '';
    var hepsi = document.createElement('option');
    hepsi.value = 'hepsi';
    hepsi.textContent = 'Hepsi';
    sel.appendChild(hepsi);
    degerler.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    // Secili deger hala varsa koru, yoksa 'hepsi'.
    if (mevcut !== 'hepsi' && degerler.indexOf(mevcut) !== -1) sel.value = mevcut;
    else sel.value = 'hepsi';
  }

  function filtrelariTazele() {
    var servisler = store.servisler();
    var sorumlular = {};
    store.state.olaylar.forEach(function (o) {
      if (o.sorumlu) sorumlular[o.sorumlu] = true;
    });
    secenekDoldur('filtreServis', servisler);
    secenekDoldur('filtreSorumlu', Object.keys(sorumlular).sort(function (a, b) {
      return a.localeCompare(b, 'tr');
    }));
    // Form icin servis onerileri
    var dl = el('servisListesi');
    dl.textContent = '';
    servisler.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s;
      dl.appendChild(o);
    });
  }

  /* --- Olay karti --- */
  function olayKarti(olay) {
    var li = document.createElement('li');
    li.className = 'olay-kart';
    li.dataset.seviye = olay.seviye;
    li.dataset.olayId = olay.id;

    var ust = document.createElement('div');
    ust.className = 'olay-ust';

    var sol = document.createElement('div');
    var h3 = document.createElement('h3');
    h3.className = 'olay-baslik';
    h3.textContent = olay.baslik; // XSS korumalı
    sol.appendChild(h3);

    var meta = document.createElement('div');
    meta.className = 'olay-meta';
    function etiket(metin, ek) {
      var s = document.createElement('span');
      s.className = 'etiket' + (ek ? ' ' + ek : '');
      s.textContent = metin;
      meta.appendChild(s);
    }
    etiket(SEVIYE_ETIKET[olay.seviye] || olay.seviye, 'etiket-' + olay.seviye);
    etiket(DURUM_ETIKET[olay.durum] || olay.durum, 'etiket-' + olay.durum);
    if (olay.servis) etiket('Servis: ' + olay.servis);
    if (olay.sorumlu) etiket('Sorumlu: ' + olay.sorumlu);
    var gs = store.olayGorevleri(olay.id);
    var acikGs = store.acikGorevler(olay.id);
    etiket('Görev: ' + (gs.length - acikGs.length) + '/' + gs.length);
    sol.appendChild(meta);

    if (olay.aciklama) {
      var p = document.createElement('p');
      p.className = 'olay-aciklama';
      p.textContent = olay.aciklama;
      sol.appendChild(p);
    }

    var sag = document.createElement('div');
    sag.className = 'olay-eylem';
    var detayBtn = document.createElement('button');
    detayBtn.type = 'button';
    detayBtn.className = 'btn btn-sade btn-kucuk';
    detayBtn.textContent = 'Detay';
    detayBtn.dataset.eylem = 'detay';
    sag.appendChild(detayBtn);

    ust.appendChild(sol);
    ust.appendChild(sag);
    li.appendChild(ust);

    var cubuk = document.createElement('div');
    cubuk.className = 'eylem-cubugu';

    // Durum degistirme: cozuldu secenegi is kuralina tabi (acik gorev varsa engellenir).
    var durumlar = S.DURUMLAR;
    durumlar.forEach(function (d) {
      if (d === olay.durum) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-kucuk ' + (d === 'cozuldu' ? 'btn-sade' : 'btn-sade');
      b.textContent = '→ ' + DURUM_ETIKET[d];
      b.dataset.eylem = 'durum';
      b.dataset.durum = d;
      cubuk.appendChild(b);
    });

    var duzBtn = document.createElement('button');
    duzBtn.type = 'button';
    duzBtn.className = 'btn btn-sade btn-kucuk';
    duzBtn.textContent = 'Düzenle';
    duzBtn.dataset.eylem = 'duzenle';
    cubuk.appendChild(duzBtn);

    var silBtn = document.createElement('button');
    silBtn.type = 'button';
    silBtn.className = 'btn btn-tehlike-sade btn-kucuk';
    silBtn.textContent = 'Sil';
    silBtn.dataset.eylem = 'sil';
    cubuk.appendChild(silBtn);

    li.appendChild(cubuk);
    return li;
  }

  /* --- Olay listesi --- */
  function listeyiCiz() {
    var liste = el('olayListesi');
    liste.textContent = '';
    var sonuc = store.filtrele(filtreDurumu());
    var sayi = el('sonucSayisi');
    sayi.textContent = '';
    var guclu = document.createElement('strong');
    guclu.textContent = String(sonuc.length);
    sayi.appendChild(guclu);
    sayi.appendChild(document.createTextNode(' olay gösteriliyor (toplam ' + store.state.olaylar.length + ')'));

    if (sonuc.length === 0) {
      goster(el('bosDurum'));
    } else {
      gizle(el('bosDurum'));
      sonuc.forEach(function (o) { liste.appendChild(olayKarti(o)); });
    }
    sayaclariCiz();
    filtrelariTazele();
  }

  /* --- Olay formu --- */
  function formHatalariTemizle() {
    ['hata-olayBaslik', 'hata-olayGenel'].forEach(function (id) {
      el(id).textContent = '';
    });
    el('olayBaslik').removeAttribute('aria-invalid');
  }

  function olayFormuSifirla() {
    el('olayForm').reset();
    el('olaySeviye').value = 'orta';
    duzenlenenOlayId = null;
    el('btnOlayKaydet').textContent = 'Olay Oluştur';
    gizle(el('btnOlayDuzenleIptal'));
    formHatalariTemizle();
  }

  el('olayForm').addEventListener('submit', function (e) {
    e.preventDefault();
    formHatalariTemizle();
    var veri = {
      baslik: el('olayBaslik').value,
      aciklama: el('olayAciklama').value,
      seviye: el('olaySeviye').value,
      servis: el('olayServis').value,
      sorumlu: el('olaySorumlu').value
    };
    var sonuc;
    if (duzenlenenOlayId) {
      sonuc = store.olayGuncelle(duzenlenenOlayId, veri);
    } else {
      sonuc = store.olayEkle(veri);
    }
    if (!sonuc.ok) {
      el('hata-olayGenel').textContent = sonuc.hatalar.join(' ');
      if (S.metinTemizle(veri.baslik) === '') {
        el('hata-olayBaslik').textContent = 'Başlık boş olamaz.';
        el('olayBaslik').setAttribute('aria-invalid', 'true');
        el('olayBaslik').focus();
      }
      toast(sonuc.hatalar[0], 'hata');
      return;
    }
    toast(duzenlenenOlayId ? 'Olay güncellendi.' : 'Olay oluşturuldu.', 'basari');
    olayFormuSifirla();
    listeyiCiz();
  });

  el('btnOlayDuzenleIptal').addEventListener('click', olayFormuSifirla);

  /* --- Liste eylemleri (event delegation) --- */
  el('olayListesi').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-eylem]');
    if (!btn) return;
    var li = btn.closest('[data-olay-id]');
    if (!li) return;
    var olayId = li.dataset.olayId;
    var olay = store.olayGetir(olayId);
    if (!olay) { toast('Olay bulunamadı.', 'hata'); listeyiCiz(); return; }
    var eylem = btn.dataset.eylem;

    if (eylem === 'detay') {
      detayAc(olayId);
      return;
    }

    if (eylem === 'durum') {
      var hedef = btn.dataset.durum;
      var sonuc = store.olayDurumDegistir(olayId, hedef);
      if (!sonuc.ok) {
        toast(sonuc.hatalar[0], 'hata');
        return;
      }
      toast('Durum güncellendi: ' + (DURUM_ETIKET[hedef] || hedef), 'basari');
      listeyiCiz();
      if (seciliOlayId === olayId) detayAc(olayId);
      return;
    }

    if (eylem === 'duzenle') {
      duzenlenenOlayId = olayId;
      el('olayBaslik').value = olay.baslik;
      el('olayAciklama').value = olay.aciklama;
      el('olaySeviye').value = olay.seviye;
      el('olayServis').value = olay.servis === 'Genel' ? '' : olay.servis;
      el('olaySorumlu').value = olay.sorumlu;
      el('btnOlayKaydet').textContent = 'Değişiklikleri Kaydet';
      goster(el('btnOlayDuzenleIptal'));
      el('olayForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
      el('olayBaslik').focus();
      return;
    }

    if (eylem === 'sil') {
      var gs = store.olayGorevleri(olayId).length;
      var metin = '"' + olay.baslik + '" olayını silmek üzeresiniz.' +
        (gs > 0 ? ' Bu olaya bağlı ' + gs + ' görev de silinecek.' : '');
      onayIste('Olayı Sil', metin, 'Olayı Sil', function () {
        var s2 = store.olaySil(olayId);
        if (!s2.ok) { toast(s2.hatalar[0], 'hata'); return; }
        if (seciliOlayId === olayId) detayKapat();
        if (duzenlenenOlayId === olayId) olayFormuSifirla();
        toast('Olay silindi.', 'basari');
        listeyiCiz();
      });
      return;
    }
  });

  /* --- Detay modali --- */
  function detaySatiri(etiketMetin, degerMetin) {
    var d = document.createElement('div');
    d.className = 'detay-satir';
    var l = document.createElement('span');
    l.className = 'detay-etiket';
    l.textContent = etiketMetin;
    var v = document.createElement('span');
    v.className = 'detay-deger';
    v.textContent = degerMetin;
    d.appendChild(l);
    d.appendChild(v);
    return d;
  }

  function detayCiz(olayId) {
    var olay = store.olayGetir(olayId);
    if (!olay) { detayKapat(); toast('Olay bulunamadı.', 'hata'); return; }

    el('detayBaslik').textContent = olay.baslik;
    var govde = el('detayGovde');
    govde.textContent = '';
    govde.appendChild(detaySatiri('Başlık', olay.baslik));
    govde.appendChild(detaySatiri('Açıklama', olay.aciklama || '—'));
    govde.appendChild(detaySatiri('Önem', SEVIYE_ETIKET[olay.seviye] || olay.seviye));
    govde.appendChild(detaySatiri('Durum', DURUM_ETIKET[olay.durum] || olay.durum));
    govde.appendChild(detaySatiri('Servis', olay.servis || '—'));
    govde.appendChild(detaySatiri('Sorumlu', olay.sorumlu || '—'));
    govde.appendChild(detaySatiri('Oluşturma', tarihYaz(olay.olusturma)));
    govde.appendChild(detaySatiri('Güncelleme', tarihYaz(olay.guncelleme)));

    // Görevler
    var liste = el('detayGorevler');
    liste.textContent = '';
    var gorevler = store.olayGorevleri(olayId);
    if (gorevler.length === 0) {
      goster(el('detayGorevBos'));
    } else {
      gizle(el('detayGorevBos'));
      gorevler.forEach(function (g) {
        liste.appendChild(gorevKarti(g));
      });
    }
  }

  function gorevKarti(g) {
    var li = document.createElement('li');
    li.className = 'gorev-kart';
    li.dataset.gorevId = g.id;
    li.dataset.gdurum = g.durum;
    var zaman = S.gorevZamanDurumu(g);
    li.dataset.zaman = zaman;

    var sol = document.createElement('div');
    var h = document.createElement('p');
    h.className = 'gorev-baslik';
    h.textContent = g.baslik;
    sol.appendChild(h);
    var meta = document.createElement('div');
    meta.className = 'olay-meta';
    function et(metin, ek) {
      var s = document.createElement('span');
      s.className = 'etiket' + (ek ? ' ' + ek : '');
      s.textContent = metin;
      meta.appendChild(s);
    }
    et(GOREV_ETIKET[g.durum] || g.durum);
    if (g.sorumlu) et('Sorumlu: ' + g.sorumlu);
    et((g.sonTarih ? 'Son tarih: ' + g.sonTarih : 'Son tarih yok') + ' · ' + (ZAMAN_ETIKET[zaman] || zaman),
       zaman === 'gecikmis' ? 'etiket-kritik' : (zaman === 'bugun' ? 'etiket-yuksek' : ''));
    sol.appendChild(meta);

    var sag = document.createElement('div');
    sag.className = 'gorev-sag';
    if (g.durum !== 'tamamlandi') {
      var tamam = document.createElement('button');
      tamam.type = 'button';
      tamam.className = 'btn btn-sade btn-kucuk';
      tamam.textContent = 'Tamamla';
      tamam.dataset.geylem = 'tamamla';
      sag.appendChild(tamam);
      var sil = document.createElement('button');
      sil.type = 'button';
      sil.className = 'btn btn-tehlike-sade btn-kucuk';
      sil.textContent = 'Sil';
      sil.dataset.geylem = 'sil';
      sag.appendChild(sil);
    } else {
      var bitti = document.createElement('span');
      bitti.className = 'etiket etiket-cozuldu';
      bitti.textContent = 'Tamamlandı';
      sag.appendChild(bitti);
    }

    li.appendChild(sol);
    li.appendChild(sag);
    return li;
  }

  function detayAc(olayId) {
    seciliOlayId = olayId;
    detayCiz(olayId);
    el('gorevForm').reset();
    el('hata-gorevGenel').textContent = '';
    goster(el('detayArka'));
  }
  function detayKapat() {
    seciliOlayId = null;
    gizle(el('detayArka'));
  }
  el('btnDetayKapat').addEventListener('click', detayKapat);
  el('detayArka').addEventListener('click', function (e) {
    if (e.target === el('detayArka')) detayKapat();
  });

  /* --- Görev formu ve eylemleri --- */
  el('gorevForm').addEventListener('submit', function (e) {
    e.preventDefault();
    el('hata-gorevGenel').textContent = '';
    if (!seciliOlayId) {
      el('hata-gorevGenel').textContent = 'Önce bir olay seçin.';
      return;
    }
    var sonTarih = el('gorevSonTarih').value;
    var veri = {
      baslik: el('gorevBaslik').value,
      sorumlu: el('gorevSorumlu').value,
      sonTarih: sonTarih || null
    };
    var sonuc = store.gorevEkle(seciliOlayId, veri);
    if (!sonuc.ok) {
      el('hata-gorevGenel').textContent = sonuc.hatalar.join(' ');
      toast(sonuc.hatalar[0], 'hata');
      return;
    }
    el('gorevForm').reset();
    toast('Görev eklendi.', 'basari');
    detayCiz(seciliOlayId);
    listeyiCiz();
  });

  el('detayGorevler').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-geylem]');
    if (!btn || !seciliOlayId) return;
    var li = btn.closest('[data-gorev-id]');
    if (!li) return;
    var gorevId = li.dataset.gorevId;
    var eylem = btn.dataset.geylem;

    if (eylem === 'tamamla') {
      var sonuc = store.gorevTamamla(gorevId);
      if (!sonuc.ok) { toast(sonuc.hatalar[0], 'hata'); return; }
      toast('Görev tamamlandı.', 'basari');
      detayCiz(seciliOlayId);
      listeyiCiz();
      return;
    }
    if (eylem === 'sil') {
      var g = store.gorevGetir(gorevId);
      onayIste('Görevi Sil', '"' + (g ? g.baslik : '') + '" görevini silmek üzeresiniz.',
        'Görevi Sil', function () {
          var s2 = store.gorevSil(gorevId);
          if (!s2.ok) { toast(s2.hatalar[0], 'hata'); return; }
          toast('Görev silindi.', 'basari');
          detayCiz(seciliOlayId);
          listeyiCiz();
        });
      return;
    }
  });

  /* --- Filtre olaylari --- */
  ['filtreMetin', 'filtreDurum', 'filtreSeviye', 'filtreServis', 'filtreSorumlu', 'filtreSirala']
    .forEach(function (id) {
      el(id).addEventListener('input', listeyiCiz);
      el(id).addEventListener('change', listeyiCiz);
    });

  /* --- Ust bar eylemleri --- */
  el('btnYenile').addEventListener('click', function () {
    store.yukle();
    listeyiCiz();
    toast('Veri yeniden yüklendi.', 'bilgi');
  });

  el('btnSifirla').addEventListener('click', function () {
    onayIste('Demo Veriyi Sıfırla',
      'Tüm mevcut olay ve görevler silinip demo veri yeniden yüklenecek. Emin misiniz?',
      'Sıfırla', function () {
        store.sifirla(DEMO);
        listeyiCiz();
        if (seciliOlayId) detayKapat();
        toast('Demo veri sıfırlandı.', 'basari');
      });
  });

  /* --- Klavye: ESC ile kapatma --- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!el('onayArka').classList.contains('gizli')) { onayKapat(); return; }
    if (!el('detayArka').classList.contains('gizli')) { detayKapat(); }
  });

  /* --- Başlat --- */
  function baslat() {
    var ham = null;
    try { ham = window.localStorage.getItem(S.STORAGE_KEY); } catch (err) { ham = null; }
    if (!ham) {
      store.sifirla(DEMO); // ilk açılış: demo veri ile başla
    } else {
      store.yukle(); // bozuksa temiz duruma düşer, uygulama çökmez
    }
    listeyiCiz();
  }

  baslat();

  // Test erişimi için (tarayıcı testleri bunu kullanır).
  window.__NUMEX_TEST__ = {
    store: store,
    listeyiCiz: listeyiCiz,
    detayAc: detayAc,
    detayKapat: detayKapat,
    DEMO: DEMO
  };
})();
