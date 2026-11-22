/* =========================================================================
   FATİH BAYRAKTAR — ŞİRİNİN SESSİZ DÜNYASI
   Uygulama mantığı (bağımlılık yok, saf JS)
   -------------------------------------------------------------------------
   Bölümler:
     1. Yardımcılar & durum
     2. Paralaks (fareye tepki veren geometrik şekiller + kitap eğimi)
     3. Tema (gece/gündüz), yazı boyutu, hareket azaltma
     4. Kitap: açma / kapama
     5. Okuyucu: sayfa yükleme, sayfa çevirme animasyonu, gezinme
     6. Favoriler (localStorage)
     7. Kopyala / Paylaş
     8. Koleksiyon ızgarası, arama, kategori filtresi
     9. Başlatma
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------- 1. YARDIMCILAR --------------------------------- */
  const $  = (sel, kok) => (kok || document).querySelector(sel);
  const $$ = (sel, kok) => Array.from((kok || document).querySelectorAll(sel));

  const VERI      = window.SIIR_VERISI || { sair: {}, kategoriler: [], siirler: [] };
  const SIIRLER   = Array.isArray(VERI.siirler) ? VERI.siirler.slice() : [];
  const KATEGORI  = new Map((VERI.kategoriler || []).map(k => [k.id, k]));
  const ANAHTAR   = 'fb-siirin-sessiz-dunyasi';

  const durum = {
    indeks: 0,          // okuyucudaki aktif şiir
    acik: false,        // kitap açık mı
    filtre: 'hepsi',
    arama: '',
    cevirmiyor: false,  // animasyon kilidi
    favoriler: new Set(),
    kategori: 'tumu'    // (ayrılmadı; tek filtre değişkeni kullanılıyor)
  };

  const azHareket = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('az-hareket');

  /* Kayıtlı tercihleri oku */
  function tercihleriYukle() {
    try {
      const kayit = JSON.parse(localStorage.getItem(ANAHTAR) || '{}');
      if (kayit.favoriler && Array.isArray(kayit.favoriler) && kayit.favoriler.length) {
        durum.favoriler = new Set(kayit.favoriler);
      }
      if (kayit.tema === 'gece') document.body.classList.add('night');
      if (kayit.hareket === 'az') document.body.classList.add('az-hareket');
      if (typeof kayit.yaziOlcek === 'number' && kayit.yaziOlcek > 0) {
        document.documentElement.style.setProperty('--reader-scale', kayit.yaziOlcek);
      }
    } catch (e) { /* localStorage kapalı olabilir; sorun değil */ }
  }

  function tercihleriKaydet() {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify({
        favoriler: Array.from(durum.favoriler),
        tema: document.body.classList.contains('night') ? 'gece' : 'gunduz',
        hareket: document.body.classList.contains('az-hareket') ? 'az' : 'normal',
        yaziOlcek: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-scale')) || 1
      }));
    } catch (e) { /* yoksay */ }
  }

  let bildirimZaman = null;
  function bildir(metin) {
    const el = $('#bildirim');
    if (!el) return;
    el.textContent = metin;
    el.classList.add('goster');
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(() => el.classList.remove('goster'), 2400);
  }

  const kategoriAdi = (id) => (KATEGORI.get(id) || {}).ad || id;

  function tarihMetni(tarih) {
    if (!tarih) return null;
    try {
      const d = new Date(tarih);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return null; }
  }

  /* Basit bir "dizede geçiyor mu" araması: Türkçe küçük harf + aksan sadeleştirme */
  function sadeles(metin) {
    return (metin || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  }

  function siirAramaAnahtari(s) {
    return sadeles(s.baslik + ' ' + (s.metre || []).join(' ') + ' ' + kategoriAdi(s.kategori));
  }

  /* ------------------------------ 2. PARALAKS ------------------------------- */
  const kitapEgim = $('#kitapEgim');
  const sahneler  = $$('.sahne .sek');

  let imlecX = 0, imlecY = 0;      // hedef (-1..1)
  let gecerliX = 0, gecerliY = 0;  // yumuşatılmış
  let paralaksCalisiyor = false;

  function paralaksDongusu() {
    gecerliX += (imlecX - gecerliX) * 0.075;
    gecerliY += (imlecY - gecerliY) * 0.075;

    if (kitapEgim && !durum.acik) {
      kitapEgim.style.transform =
        `rotateY(${(gecerliX * 15).toFixed(2)}deg) rotateX(${(-gecerliY * 11).toFixed(2)}deg) translateZ(0)`;
    }
    sahneler.forEach(el => {
      const d = parseFloat(el.dataset.derinlik || '1');
      const dx = gecerliX * 26 * d;
      const dy = gecerliY * 22 * d;
      const dondur = gecerliX * 7 * d;
      el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${dondur.toFixed(2)}deg)`;
    });

    if (Math.abs(gecerliX - imlecX) > 0.001 || Math.abs(gecerliY - imlecY) > 0.001) {
      requestAnimationFrame(paralaksDongusu);
    } else {
      paralaksCalisiyor = false;
    }
  }

  function paralaksTetik() {
    if (paralaksCalisiyor || azHareket()) return;
    paralaksCalisiyor = true;
    requestAnimationFrame(paralaksDongusu);
  }

  function paralaksKur() {
    if (azHareket()) {
      if (kitapEgim) kitapEgim.style.transform = 'none';
      return;
    }
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;     // dokunmatikte paralaks yok
      imlecX = (e.clientX / window.innerWidth) * 2 - 1;
      imlecY = (e.clientY / window.innerHeight) * 2 - 1;
      paralaksTetik();
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      imlecX = 0; imlecY = 0; paralaksTetik();
    });

    /* Mobilde cihaz eğimi (izni olan tarayıcılarda sessizce çalışır) */
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      imlecX = Math.max(-1, Math.min(1, e.gamma / 32));
      imlecY = Math.max(-1, Math.min(1, (e.beta - 45) / 32));
      paralaksTetik();
    }, { passive: true });
  }

  /* --------------------------- 3. TEMA / YAZI / HAREKET ---------------------- */
  function temaDegistir() {
    const gece = document.body.classList.toggle('night');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', gece ? '#1b2530' : '#e6eef6');
    tercihleriKaydet();
    bildir(gece ? 'Gece modu açık — okuma ışığı kısıldı.' : 'Gündüz modu — inci beyazına dönüldü.');
  }

  function yaziBoyutu(yon) {
    const kok = document.documentElement;
    let olcek = parseFloat(getComputedStyle(kok).getPropertyValue('--reader-scale')) || 1;
    olcek = Math.min(1.6, Math.max(0.8, +(olcek + yon * 0.1).toFixed(2)));
    kok.style.setProperty('--reader-scale', olcek);
    tercihleriKaydet();
    bildir('Yazı boyutu: %' + Math.round(olcek * 100));
  }

  function hareketTercihiniDinle() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const uygula = () => {
      if (mq.matches) document.body.classList.add('az-hareket');
    };
    uygula();
    if (mq.addEventListener) mq.addEventListener('change', uygula);
  }

  /* ------------------------------ 4. KİTAP AÇMA ----------------------------- */
  const kitapSahne = $('#kitapSahne');
  const kitap3d    = $('#kitap3d');
  const okuyucu    = $('#okuyucu');

  function kitabiAc(indeks) {
    if (durum.acik) return;
    durum.acik = true;
    const hedef = typeof indeks === 'number' ? indeks : 0;
    durum.indeks = Math.max(0, Math.min(SIIRLER.length - 1, hedef));

    kitapSahne.classList.add('acik');
    okuyucu.hidden = false;
    siirYukle(durum.indeks);

    requestAnimationFrame(() => {
      okuyucu.classList.add('acik');
      document.body.classList.add('okuyor');
      window.scrollTo({ top: window.scrollY, behavior: 'auto' });
    });

    const kapatBtn = $('#btnKapatOkuyucu');
    if (kapatBtn) kapatBtn.focus({ preventScroll: true });
  }

  function kitabiKapat() {
    if (!durum.acik) return;
    durum.acik = false;
    okuyucu.classList.remove('acik');
    document.body.classList.remove('okuyor');

    const bitir = () => {
      okuyucu.hidden = true;
      kitapSahne.classList.remove('acik');
      if (kitapEgim) kitapEgim.style.transform = '';
      if (kitap3d) kitap3d.focus({ preventScroll: true });
    };
    if (azHareket()) bitir();
    else setTimeout(bitir, 520);
  }

  /* ---------------------------- 5. OKUYUCU / SAYFA -------------------------- */
  const defter      = $('#defter');
  const yaprak      = $('#yaprak');
  const yaprakOn    = $('#yaprakOn');
  const yaprakArka  = $('#yaprakArka');

  function sayfaDoldur(yan, s) {
    const meta = $('#meta' + yan);
    const baslik = $('#baslik' + yan);
    const metin = $('#metin' + yan);
    const alt = $('#altBilgi' + yan);

    meta.innerHTML = '';
    const etiketKat = document.createElement('span');
    etiketKat.className = 'etiket';
    etiketKat.textContent = kategoriAdi(s.kategori);
    meta.appendChild(etiketKat);

    if (s.demo) {
      const demo = document.createElement('span');
      demo.className = 'etiket demo';
      demo.textContent = 'Örnek metin';
      meta.appendChild(demo);
    }

    const t = tarihMetni(s.tarih);
    const tar = document.createElement('span');
    tar.textContent = t ? t : 'Tarih belirtilmemiş';
    meta.appendChild(tar);

    baslik.textContent = s.baslik;
    /* Metin burada boşaltılır; sol sayfanın kıtalarını siirYukle() dağıtır. */
    metin.innerHTML = '';

    alt.textContent = s.demo
      ? 'Bu metin demo amaçlı yazılmış özgün bir örnektir; şaire ait değildir.'
      : 'Fatih Bayraktar';

    /* Sağ sayfada, önceki turdan kalan künye kutusu varsa temizle */
    const eskiKunye = document.querySelector('#sayfaSag .sag-kunye');
    if (eskiKunye) eskiKunye.remove();

    /* Sağ sayfaya sade bir künye bloğu ekle (kitap dengesi için) */
    if (yan === 'Sag') {
      const kunye = document.createElement('div');
      kunye.className = 'sag-kunye';
      const b = document.createElement('b');
      b.textContent = s.demo ? 'Örnek metin' : 'Künye';
      kunye.appendChild(b);
      kunye.appendChild(document.createTextNode(
        'Tür: ' + kategoriAdi(s.kategori) +
        ' · Tarih: ' + (s.tarih ? tarihMetni(s.tarih) : 'belirtilmemiş')
      ));
      const kutu = $('#sayfaSag');
      if (kutu) kutu.appendChild(kunye);
    }
  }

  /* Sayfaları böl: sol sayfa giriş kıtaları, sağ sayfa şiirin devamı.
     Böylece metin gereksiz yere iki kez basılmaz; kitap gerçekten iki sayfa olur. */
  function siiriBol(metre) {
    const kitalar = [];
    let gecici = [];
    (metre || []).forEach(satir => {
      if (satir === '' || satir == null) {
        if (gecici.length) { kitalar.push(gecici); gecici = []; }
      } else {
        gecici.push(satir);
      }
    });
    if (gecici.length) kitalar.push(gecici);

    if (!kitalar.length) return { sol: [], sag: [] };

    /* Tek kıtaysa bölmeye gerek yok: tamamı sol sayfada, sağ sayfa künye */
    if (kitalar.length === 1) {
      return { sol: kitalar, sag: [] };
    }

    /* Dengeli bölme: kıtaları satır sayısına göre ikiye ayır */
    const satirSayisi = kitalar.reduce((t, k) => t + k.length, 0);
    let toplam = 0;
    let ortada = 0;
    for (let i = 0; i < kitalar.length; i++) {
      toplam += kitalar[i].length;
      if (toplam >= satirSayisi / 2) { ortada = i; break; }
    }
    /* Sağ sayfada en az bir kıta kalsın */
    if (ortada >= kitalar.length - 1) ortada = kitalar.length - 2;
    if (ortada < 0) ortada = 0;

    return { sol: kitalar.slice(0, ortada + 1), sag: kitalar.slice(ortada + 1) };
  }

  function kitalariYaz(kap, kitalar) {
    kap.innerHTML = '';
    kitalar.forEach(satirlar => {
      const p = document.createElement('span');
      p.className = 'kita';
      p.textContent = satirlar.join('\n');
      kap.appendChild(p);
    });
  }

  function siirYukle(indeks) {
    const s = SIIRLER[indeks];
    if (!s) return;

    /* Mobilde yalnızca tek sayfa görünür: metnin TAMAMI o sayfaya yazılır,
       böylece hiçbir kıta kaybolmaz. Masaüstünde kitap iki sayfaya bölünür. */
    const tekSayfa = window.innerWidth <= 760;
    const bolum = tekSayfa
      ? { sol: [], sag: [] }
      : siiriBol(s.metre);

    sayfaDoldur('Sol', s);
    kitalariYaz($('#metinSol'), bolum.sol);
    sayfaDoldur('Sag', s);

    /* Sağ sayfayı şiirin devamıyla doldur */
    const metaSag = $('#metaSag');
    const metinSag = $('#metinSag');
    const altSag = $('#altBilgiSag');

    /* Künye kutusu siirYukle içinde yönetiliyor (tek kutu, tekrar yok) */
    metaSag.innerHTML = '';
    const etiket = document.createElement('span');
    etiket.className = 'etiket';
    etiket.textContent = bolum.sag.length ? 'Devam' : 'Künye';
    metaSag.appendChild(etiket);
    const kat = document.createElement('span');
    kat.textContent = kategoriAdi(s.kategori);
    metaSag.appendChild(kat);

    if (tekSayfa) {
      /* Tek sayfa: başlık, künye ve şiirin TAMAMI bu sayfada.
         metreyi (düz dize dizisi) doğrudan kıta kıta yazıyoruz. */
      $('#baslikSag').textContent = s.baslik;
      kitalariYaz(metinSag, siiriBol(s.metre).sol.concat(siiriBol(s.metre).sag));
      metinSag.style.display = '';
      altSag.style.display = '';
      altSag.textContent = s.demo
        ? 'Bu metin demo amaçlı yazılmış özgün bir örnektir; şaire ait değildir.'
        : 'Fatih Bayraktar';
    } else {
      kitalariYaz(metinSag, bolum.sag);
      metinSag.style.display = bolum.sag.length ? '' : 'none';
      altSag.style.display = bolum.sag.length ? '' : 'none';
      altSag.textContent = bolum.sag.length ? 'Devam' : '';
    }

    /* Sol sayfayı başa sar */
    const sol = $('#sayfaSol');
    const sag = $('#sayfaSag');
    if (sol) sol.scrollTop = 0;
    if (sag) sag.scrollTop = 0;

    /* Gezinme düğmeleri */
    const onceki = $('#btnOnceki');
    const sonraki = $('#btnSonraki');
    if (onceki) onceki.disabled = indeks <= 0;
    if (sonraki) sonraki.disabled = indeks >= SIIRLER.length - 1;

    const gosterge = $('#sayfaGostergesi');
    if (gosterge) gosterge.textContent = (indeks + 1) + ' / ' + SIIRLER.length;

    /* Favori durumu */
    const fav = $('#btnFavori');
    if (fav) {
      const var_ = durum.favoriler.has(s.id);
      fav.classList.toggle('basili', var_);
      fav.setAttribute('aria-pressed', String(var_));
      const yazi = fav.querySelector('.yazi');
      if (yazi) yazi.textContent = var_ ? 'Favoride' : 'Favori';
    }
  }

  /* Gerçek sayfa çevirme: eski sayfanın içeriği geçici bir "yaprağa" kopyalanıp
     perspektifte döndürülür, altındaki yeni sayfa açığa çıkar. */
  function sayfaCevir(yon, hedefIndeks) {
    if (durum.cevirmiyor) return;
    const s = SIIRLER[hedefIndeks];
    if (!s) return;

    if (azHareket() || window.innerWidth <= 760) {
      /* Hareket azaltma veya mobil tek sayfa: yumuşak solma */
      const alan = $('#sayfaSag') || defter;
      alan.style.transition = 'opacity .18s ease';
      alan.style.opacity = '0.15';
      setTimeout(() => {
        siirYukle(hedefIndeks);
        durum.indeks = hedefIndeks;
        alan.style.opacity = '1';
      }, 180);
      return;
    }

    durum.cevirmiyor = true;

    /* Yaprağa eski sayfanın içeriğini kopyala */
    const aktifYan = yon === 'ileri' ? 'Sol' : 'Sag';
    const kaynak = $('#sayfa' + aktifYan);
    const hedefYuz = yon === 'ileri' ? yaprakOn : yaprakArka;

    hedefYuz.innerHTML = '';
    const kopya = kaynak.cloneNode(true);
    kopya.removeAttribute('id');
    kopya.style.overflow = 'hidden';
    kopya.style.height = '100%';
    hedefYuz.appendChild(kopya);

    /* Arka yüzü soluk bir yeni-sayfa görüntüsü ile doldur */
    const digerYuz = yon === 'ileri' ? yaprakArka : yaprakOn;
    digerYuz.innerHTML = '';
    const onizlemeBaslik = document.createElement('h2');
    onizlemeBaslik.textContent = s.baslik;
    onizlemeBaslik.style.fontFamily = 'var(--font-serif)';
    onizlemeBaslik.style.fontSize = 'clamp(20px, 2.4vw, 28px)';
    onizlemeBaslik.style.margin = '0 0 10px';
    const onizlemeDevam = document.createElement('p');
    onizlemeDevam.textContent = '…';
    onizlemeDevam.style.opacity = '.5';
    digerYuz.appendChild(onizlemeBaslik);
    digerYuz.appendChild(onizlemeDevam);

    yaprak.className = 'yaprak ' + yon;
    void yaprak.offsetWidth;   // reflow: animasyonu yeniden başlat

    const bitir = () => {
      if (!durum.cevirmiyor) return;   // animasyonun animationend + zamanlayıcı çift tetiklemesini yut
      durum.cevirmiyor = false;
      yaprak.className = 'yaprak';
      yaprakOn.innerHTML = '';
      yaprakArka.innerHTML = '';
      siirYukle(hedefIndeks);
      durum.indeks = hedefIndeks;
      durum.cevirmiyor = false;
    };
    yaprak.addEventListener('animationend', bitir, { once: true });
    /* Güvenlik ağı: animasyon olayı gelmezse 1 sn sonra yine de yeni sayfaya geç */
    setTimeout(() => { if (durum.cevirmiyor) bitir(); }, 1000);
  }

  function git(yon) {
    const hedef = durum.indeks + (yon === 'ileri' ? 1 : -1);
    if (hedef < 0 || hedef >= SIIRLER.length) return;
    sayfaCevir(yon, hedef);
  }

  /* ------------------------------ 6. FAVORİLER ------------------------------ */
  function favoriDegistir() {
    const s = SIIRLER[durum.indeks];
    if (!s) return;
    if (durum.favoriler.has(s.id)) {
      durum.favoriler.delete(s.id);
      bildir('Favorilerden çıkarıldı: ' + s.baslik);
    } else {
      durum.favoriler.add(s.id);
      bildir('Favorilere eklendi: ' + s.baslik);
    }
    tercihleriKaydet();
    favoriArayuzuGuncelle();
    siirYukle(durum.indeks);
  }

  function favoriArayuzuGuncelle() {
    const rozet = $('#favoriRozet');
    if (rozet) {
      rozet.hidden = durum.favoriler.size === 0;
      rozet.textContent = String(durum.favoriler.size);
    }
    const liste = $('#favoriListe');
    const bos = $('#favoriBos');
    if (!liste) return;

    liste.innerHTML = '';
    const favoriler = SIIRLER.filter(s => durum.favoriler.has(s.id));
    if (bos) bos.hidden = favoriler.length > 0;

    favoriler.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'favori-satir';
      const m = document.createElement('span');
      m.className = 'fs-metin';
      const b = document.createElement('b'); b.textContent = s.baslik;
      const sp = document.createElement('span'); sp.textContent = kategoriAdi(s.kategori);
      m.appendChild(b); m.appendChild(sp);
      const ok = document.createElement('span');
      ok.textContent = '→';
      ok.style.color = 'var(--accent)';
      btn.appendChild(m); btn.appendChild(ok);
      btn.addEventListener('click', () => {
        panelKapat();
        const i = SIIRLER.indexOf(s);
        if (durum.acik) { siirYukle(i); durum.indeks = i; }
        else kitabiAc(i);
      });
      liste.appendChild(btn);
    });
  }

  function panelAc() {
    $('#favoriPanel').classList.add('acik');
    $('#favoriPanel').setAttribute('aria-hidden', 'false');
    $('#panelArka').classList.add('acik');
  }
  function panelKapat() {
    $('#favoriPanel').classList.remove('acik');
    $('#favoriPanel').setAttribute('aria-hidden', 'true');
    $('#panelArka').classList.remove('acik');
  }
  const panelAcikMi = () => $('#favoriPanel').classList.contains('acik');

  /* --------------------------- 7. KOPYALA / PAYLAŞ -------------------------- */
  function siirDuzMetni(s) {
    const govde = (s.metre || []).join('\n').replace(/\n{3,}/g, '\n\n');
    return s.baslik + '\n\n' + govde + '\n\n— Fatih Bayraktar · Şiirin Sessiz Dünyası' +
      (s.demo ? '\n(Örnek metin)' : '');
  }

  async function kopyala() {
    const s = SIIRLER[durum.indeks];
    if (!s) return;
    const metin = siirDuzMetni(s);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(metin);
      } else {
        const ta = document.createElement('textarea');
        ta.value = metin;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      bildir('Şiir panoya kopyalandı.');
    } catch (e) {
      bildir('Kopyalanamadı — metni elle seçebilirsin.');
    }
  }

  async function paylas() {
    const s = SIIRLER[durum.indeks];
    if (!s) return;
    const veri = {
      title: s.baslik + ' — Fatih Bayraktar',
      text: siirDuzMetni(s),
      url: location.href.split('#')[0] + '#siir=' + encodeURIComponent(s.id)
    };
    try {
      if (navigator.share) {
        await navigator.share(veri);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;   // kullanıcı vazgeçti
    }
    /* Paylaşım API'si yoksa panoya kopyala */
    await kopyala();
    bildir('Paylaşım desteği yok — metin panoya kopyalandı.');
  }

  /* --------------------- 8. KOLEKSİYON / ARAMA / FİLTRE --------------------- */
  function kategoriCipleri() {
    const kutu = $('#filtreler');
    if (!kutu) return;
    const hepsi = [{ id: 'hepsi', ad: 'Tümü' }].concat(VERI.kategoriler || []);

    hepsi.forEach(k => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cip' + (k.id === durum.filtre ? ' secili' : '');
      btn.textContent = k.ad;
      btn.setAttribute('aria-pressed', String(k.id === durum.filtre));
      btn.addEventListener('click', () => {
        durum.filtre = k.id;
        $$('.cip', kutu).forEach(c => {
          const secili = c === btn;
          c.classList.toggle('secili', secili);
          c.setAttribute('aria-pressed', String(secili));
        });
        kartlariCiz();
      });
      kutu.appendChild(btn);
    });
  }

  function onizlemeMetni(s) {
    const dolu = (s.metre || []).filter(x => x && x.trim());
    if (!dolu.length) return '';
    return '“' + dolu[0].trim() + '”';
  }

  function kartlariCiz() {
    const izgara = $('#kartIzgara');
    const bos = $('#bosDurum');
    if (!izgara) return;

    const q = sadeles(durum.arama.trim());
    const liste = SIIRLER.filter(s => {
      const katUygun = durum.filtre === 'hepsi' || s.kategori === durum.filtre;
      if (!katUygun) return false;
      if (!q) return true;
      return siirAramaAnahtari(s).indexOf(q) !== -1;
    });

    izgara.innerHTML = '';

    liste.forEach(s => {
      const kart = document.createElement('div');
      kart.className = 'siir-kart ortaya gorundu';
      kart.setAttribute('role', 'button');
      kart.setAttribute('tabindex', '0');
      kart.setAttribute('aria-label', s.baslik + ' şiirini oku');

      const kat = document.createElement('span');
      kat.className = 'kategori-etiket';
      kat.textContent = kategoriAdi(s.kategori);

      const h = document.createElement('h3');
      h.textContent = s.baslik;

      const on = document.createElement('p');
      on.className = 'onizleme';
      on.textContent = onizlemeMetni(s);

      const alt = document.createElement('div');
      alt.className = 'alt-satir';

      if (s.demo) {
        const rozet = document.createElement('span');
        rozet.className = 'demo-rozet';
        rozet.textContent = 'Örnek metin';
        alt.appendChild(rozet);
      } else {
        const t = document.createElement('span');
        t.textContent = tarihMetni(s.tarih) || '';
        alt.appendChild(t);
      }

      const fav = document.createElement('span');
      fav.textContent = durum.favoriler.has(s.id) ? '♥ favoride' : '♡';
      fav.style.color = durum.favoriler.has(s.id) ? 'var(--accent)' : '';
      alt.appendChild(fav);

      kart.appendChild(kat); kart.appendChild(h); kart.appendChild(on); kart.appendChild(alt);

      const ac = () => {
        const i = SIIRLER.indexOf(s);
        kitabiAc(i);
      };
      kart.addEventListener('click', ac);
      kart.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(); }
      });

      izgara.appendChild(kart);
    });

    if (bos) bos.hidden = liste.length > 0;
  }

  /* -------------------- 9. GÖRÜNÜR OLMA / BAŞLATMA ------------------------- */
  function ortayaCikar() {
    const ogeler = $$('.ortaya');
    if (!('IntersectionObserver' in window) || azHareket()) {
      ogeler.forEach(el => el.classList.add('gorundu'));
      return;
    }
    const io = new IntersectionObserver((girisler) => {
      girisler.forEach(g => {
        if (g.isIntersecting) {
          g.target.classList.add('gorundu');
          io.unobserve(g.target);
        }
      });
    }, { threshold: 0.12 });
    ogeler.forEach(el => io.observe(el));
  }

  function sairBilgileriniBas() {
    const s = VERI.sair || {};
    if (s.ad) {
      document.title = s.ad + ' — ' + (s.altBaslik || 'Şiirin Sessiz Dünyası');
      const ad = $('#sairAd'); if (ad) ad.textContent = s.ad;
    }
    const img = $('#sairFoto');
    if (img) {
      if (s.fotograf) {
        img.src = s.fotograf;
        img.alt = (s.ad || 'Şair') + ' fotoğrafı';
      } else {
        /* Fotoğraf yoksa: uydurma biri koymuyoruz — zarif bir yer tutucu göster */
        img.removeAttribute('src');
        img.style.display = 'none';
        const tutucu = document.createElement('div');
        tutucu.className = 'foto-tutucu';
        tutucu.innerHTML =
          '<span class="ft-muhur">FB</span>' +
          '<span class="ft-yazi">Portre fotoğrafı<br /><b>buraya eklenecek</b></span>';
        img.parentNode.appendChild(tutucu);
      }
    }
    if (s.fotografNot) {
      const n = $('#fotoNot'); if (n) n.textContent = s.fotografNot;
    }
    if (s.biyografi) {
      const k = $('#biyografiKutu');
      if (k) k.textContent = s.biyografi;
      const g = $('#sairGiris');
      if (g) g.textContent = 'Şairin yaşam öyküsü.';
    }
    if (s.dogum) {
      const d = $('#bilgiDogum'); if (d) { d.textContent = s.dogum; d.classList.remove('bekliyor'); }
    }
    if (Array.isArray(s.eserler) && s.eserler.length) {
      const e = $('#bilgiEserler');
      if (e) {
        e.textContent = s.eserler.map(x => x.ad + (x.yil ? ' (' + x.yil + ')' : '')).join(', ');
        e.classList.remove('bekliyor');
      }
    }
    const sayi = $('#bilgiSiirSayisi');
    if (sayi) sayi.textContent = SIIRLER.length + ' şiir (örnek metin)';

    const yil = $('#yil'); if (yil) yil.textContent = new Date().getFullYear();
  }

  function olaylariBagla() {
    /* Kitap açma */
    if (kitap3d) {
      kitap3d.addEventListener('click', () => kitabiAc());
      kitap3d.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kitabiAc(); }
      });
    }

    /* Okuyucu düğmeleri */
    $('#btnOnceki') && $('#btnOnceki').addEventListener('click', () => git('geri'));
    $('#btnSonraki') && $('#btnSonraki').addEventListener('click', () => git('ileri'));
    $('#btnFavori')  && $('#btnFavori').addEventListener('click', favoriDegistir);
    $('#btnKopyala') && $('#btnKopyala').addEventListener('click', kopyala);
    $('#btnPaylas')  && $('#btnPaylas').addEventListener('click', paylas);
    $('#btnKapatOkuyucu') && $('#btnKapatOkuyucu').addEventListener('click', kitabiKapat);
    $('#btnTemaOkuyucu')  && $('#btnTemaOkuyucu').addEventListener('click', temaDegistir);
    $('#yaziBuyult') && $('#yaziBuyult').addEventListener('click', () => yaziBoyutu(1));
    $('#yaziKucult') && $('#yaziKucult').addEventListener('click', () => yaziBoyutu(-1));

    /* Tema & favoriler */
    $('#btnTema') && $('#btnTema').addEventListener('click', temaDegistir);
    $('#btnFavoriler') && $('#btnFavoriler').addEventListener('click', () => {
      favoriArayuzuGuncelle();
      panelAcikMi() ? panelKapat() : panelAc();
    });
    $('#btnPanelKapat') && $('#btnPanelKapat').addEventListener('click', panelKapat);
    $('#panelArka') && $('#panelArka').addEventListener('click', panelKapat);

    /* Arama */
    const arama = $('#aramaInput');
    if (arama) {
      let z;
      arama.addEventListener('input', () => {
        clearTimeout(z);
        z = setTimeout(() => { durum.arama = arama.value; kartlariCiz(); }, 120);
      });
    }

    /* Klavye + dokunmatik kaydırma */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (panelAcikMi()) { panelKapat(); return; }
        if (durum.acik) kitabiKapat();
        return;
      }
      if (!durum.acik) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); git('ileri'); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); git('geri'); }
    });

    if (defter) {
      let baslaX = null, baslaY = null;
      defter.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        baslaX = t.clientX; baslaY = t.clientY;
      }, { passive: true });

      defter.addEventListener('touchend', (e) => {
        if (baslaX == null) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - baslaX;
        const dy = t.clientY - baslaY;
        baslaX = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          git(dx < 0 ? 'ileri' : 'geri');
        }
      }, { passive: true });
    }

    /* Üst bar gölgesi */
    const bar = $('#ustbar');
    if (bar) {
      const guncelle = () => bar.classList.toggle('sabitlendi', window.scrollY > 24);
      window.addEventListener('scroll', guncelle, { passive: true });
      guncelle();
    }
  }

  function cagriParametresiniOku() {
    /* #siir=id ile paylaşılan bağlantı doğrudan o şiiri açar */
    const h = location.hash || '';
    const m = h.match(/siir=([^&]+)/);
    if (!m) return null;
    const id = decodeURIComponent(m[1]);
    const i = SIIRLER.findIndex(s => s.id === id);
    return i >= 0 ? i : null;
  }

  function baslat() {
    tercihleriYukle();
    hareketTercihiniDinle();
    sairBilgileriniBas();
    kategoriCipleri();
    kartlariCiz();
    favoriArayuzuGuncelle();
    olaylariBagla();
    paralaksKur();
    ortayaCikar();

    const dogrudan = cagriParametresiniOku();
    if (dogrudan !== null) setTimeout(() => kitabiAc(dogrudan), 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }

  /* Test ve hata ayıklama için küçük bir dışa açılım */
  window.NumexSiir = {
    durum,
    siirler: SIIRLER,
    ac: kitabiAc,
    kapat: kitabiKapat,
    git,
    favoriDegistir,
    kaynak: 'Numex AI tarafından geliştirildi'
  };
})();
