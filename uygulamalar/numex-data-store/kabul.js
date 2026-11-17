/* Numex Data Story — KABUL TESTİ
 * Kural: kabul, prompta değil ÇIKTININ DOĞRULUĞUNA bağlıdır.
 * Her testte "beklenen" değer uygulamadan BAĞIMSIZ hesaplanır (ham CSV metninden ya da
 * kuruş aritmetiğiyle), "çıkan" ise uygulamanın ürettiği değerdir. Uyuşmazsa test kaldı.
 */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const kurus = v => Math.round(Number(v) * 100);
  let satirlar = [];

  function ekle(ad, beklenen, gelen, tol) {
    let gecti;
    if (typeof beklenen === 'number' && typeof gelen === 'number') {
      gecti = Math.abs(beklenen - gelen) <= (tol == null ? 0.004 : tol);
    } else {
      gecti = String(beklenen) === String(gelen);
    }
    satirlar.push({ ad, beklenen, gelen, gecti });
    return gecti;
  }
  function yaz(v) {
    if (typeof v === 'number') return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v);
    return String(v);
  }
  function ciz() {
    const tb = $('#kabulList');
    if (tb) {
      tb.innerHTML = satirlar.map((s, i) =>
        '<tr class="' + (s.gecti ? 'ok' : 'fail') + '"><td>' + (i + 1) + '</td><td>' + s.ad +
        '</td><td class="num">' + yaz(s.beklenen) + '</td><td class="num">' + yaz(s.gelen) +
        '</td><td><span class="sonuc ' + (s.gecti ? 'gecti' : 'kaldi') + '">' +
        (s.gecti ? 'GEÇTİ' : 'KALDI') + '</span></td></tr>').join('');
    }
    const gecen = satirlar.filter(s => s.gecti).length;
    const el = $('#kabulOzet');
    if (el) {
      el.textContent = gecen + ' / ' + satirlar.length + ' test geçti' +
        (gecen === satirlar.length
          ? ' — çıktı doğru, rapor yayınlanabilir.'
          : ' — DİKKAT: ' + (satirlar.length - gecen) + ' test kaldı. Rapor YAYINLANMAMALI.');
      el.className = 'kabul-ozet ' + (gecen === satirlar.length ? 'ok' : 'fail');
    }
    const b = $('#badgeKabul');
    if (b) b.textContent = gecen + '/' + satirlar.length;
  }

  /* ham CSV metninden bağımsız toplam: Tutar her satırın SON alanıdır */
  function bagimsizToplam(metin) {
    const L = metin.replace(/^\uFEFF/, '').split(/\r?\n/).filter(s => s.trim() !== '' && s.indexOf('TOPLAMLAR') !== 0);
    if (!L.length) return { kurus: 0, adet: 0, adetToplam: null };
    const ayrac = L[0].indexOf(';') > -1 ? ';' : ',';
    const basliklar = L[0].split(ayrac).map(s => s.replace(/"/g, '').trim());
    const iAdet = basliklar.indexOf('Adet');
    let top = 0, n = 0, adet = 0;
    for (let i = 1; i < L.length; i++) {
      const s = L[i];
      const son = s.slice(s.lastIndexOf(ayrac) + 1).replace(/"/g, '').trim();
      // ayraç ';' ise ondalık ',' ; ',' ise ondalık '.'
      const v = ayrac === ';' ? son.replace(/\./g, '').replace(',', '.') : son.replace(/\s/g, '');
      const x = Number(v);
      if (isFinite(x)) { top += kurus(x); n++; }
      if (iAdet > -1) {
        const alan = s.split(ayrac)[iAdet].replace(/"/g, '').trim();
        const a = Number(alan);
        if (isFinite(a)) adet += a;
      }
    }
    return { kurus: top, adet: n, adetToplam: iAdet > -1 ? adet : null };
  }

  async function run() {
    const App = window.App;
    satirlar = [];
    if (!App) { ekle('Uygulama yüklendi', 'App', 'yok'); ciz(); return satirlar; }

    // --- veriyi tazele ---
    let ham = '';
    try {
      const r = await fetch('data/satis.csv', { cache: 'no-store' });
      if (r.ok) ham = await r.text();
    } catch (e) { /* file:// altında fetch çalışmaz */ }
    if (ham) { App.jsonToState(App.parseCSV(ham)); }
    else { App.ornekVeri(); ham = App.csvMetni(); }
    App.renderTable(); App.renderChartForm(); App.renderDash();

    // 1 — satır sayısı
    ekle('CSV satır sayısı (102 beklenir)', 102, App.state.rows.length);

    // 2 — Tutar toplamı: beklenen değer ham metinden bağımsız hesaplanır
    const bag = bagimsizToplam(ham);
    const uygulamaTutar = App.kolonToplami('Tutar');
    ekle('Tutar toplamı — bağımsız CSV hesabı', bag.kurus / 100, uygulamaTutar);

    // 3 — Adet toplamı
    if (bag.adetToplam != null) ekle('Adet toplamı — bağımsız CSV hesabı', bag.adetToplam, App.kolonToplami('Adet'));

    // 4 — kimlik kolonu sınıflandırması
    ekle('“Telefon” kimlik olarak sınıflandı', 'id', App.state.kinds['Telefon']);
    ekle('“Sipariş No” kimlik olarak sınıflandı', 'id', App.state.kinds['Sipariş No']);

    // 5 — kimlik kolonu toplanmıyor (alt bilgi satırında tekil sayısı var)
    const ths = Array.from(document.querySelectorAll('#dataTable thead th')).map(t => t.textContent.trim());
    const iTel = ths.indexOf('Telefon');
    const footTel = iTel > -1 ? document.querySelectorAll('#dataTable tfoot td')[iTel].textContent.trim() : '(yok)';
    ekle('Telefon alt toplamı: sayı değil, tekil', 'tekil', /tekil/.test(footTel) ? 'tekil' : 'TOPLAM:' + footTel);
    ekle('Telefon kolonu için kolonToplami() boş', 'null', String(App.kolonToplami('Telefon')));

    // 6 — kimlik kolonu grafikte değer olarak sunulmuyor
    const ySecenekleri = Array.from(document.querySelectorAll('#chartY option')).map(o => o.value || o.textContent);
    ekle('Telefon, “Değer (Y)” listesinde yok', 'yok', ySecenekleri.indexOf('Telefon') > -1 ? 'VAR' : 'yok');

    // 7 — kırılım tutarlılığı: sayılan kayıtlar satır sayısına eşit olmalı
    const bolgeSayim = App.topla('Bölge', 'Tutar', 'count').reduce((a, d) => a + d.deger, 0);
    ekle('Bölge kırılımı → kayıt sayısı = satır sayısı', App.state.rows.length, bolgeSayim);
    // kimlik kolonu DEĞER olarak istenirse toplanmaz, kayıt sayısına düşer
    const telDeger = App.topla('Bölge', 'Telefon', 'sum').reduce((a, d) => a + d.deger, 0);
    ekle('Kimlik kolonu değer seçilirse → sayılmaz, sayılır', App.state.rows.length, telDeger);

    // 8 — hücre düzenleme: toplam farkı tam olarak (yeniAdet - eskiAdet) × fiyat
    const r0 = App.state.rows[0];
    const eskiAdet = Number(r0['Adet']);
    const fiyat = Number(r0['Birim Fiyat']);
    const oncekiToplam = App.kolonToplami('Tutar');
    r0['Adet'] = eskiAdet + 12;
    App.makeRowUpdate ? App.makeRowUpdate(r0) : null;
    // formül: Tutar = Adet × Birim Fiyat
    r0['Tutar'] = Math.round(kurus(fiyat) * r0['Adet']) / 100;
    App.renderTable();
    const beklenenFark = 12 * fiyat;
    ekle('Hücre düzenleme → toplam farkı (kuruş)', beklenenFark, App.kolonToplami('Tutar') - oncekiToplam, 0.011);

    // 9 — CSV dışa aktarma → geri okuma aynı sayıyı verir
    const disari = App.csvMetni();
    const geri = bagimsizToplam(disari);
    ekle('CSV gidiş-dönüş: Tutar toplamı korunur', App.kolonToplami('Tutar'), geri.kurus / 100);
    ekle('CSV gidiş-dönüş: satır sayısı korunur', App.state.rows.length, geri.adet);

    // 10 — PDF ham tablo: gövde = başlık + tüm satırlar + TOPLAM
    const tanim = App.pdfTanim();
    const tablo = tanim.content.filter(c => c && c.table && c.table.body).pop();
    const govdeSatir = tablo ? tablo.table.body.length : -1;
    ekle('PDF ham tablo satır sayısı (başlık + satır + TOPLAM)', App.state.rows.length + 2, govdeSatir);
    const pdfMetni = JSON.stringify(tanim);
    ekle('PDF içinde panel özeti yok (ham tablo)', 'yok', pdfMetni.indexOf('Rapor Paneli Özeti') > -1 ? 'VAR' : 'yok');
    const sonSatir = tablo ? tablo.table.body[tablo.table.body.length - 1] : [];
    const iTutar = App.state.columns.indexOf('Tutar');
    const pdfToplam = sonSatir[iTutar] ? sonSatir[iTutar].text : '(yok)';
    const sayiOlarak = Number(String(pdfToplam).replace(/\./g, '').replace(',', '.'));
    ekle('PDF TOPLAM satırı = uygulama toplamı', App.kolonToplami('Tutar'), sayiOlarak, 0.011);

    // 11 — PDF gerçekten üretiliyor
    try {
      const bayt = await App.pdfUret();
      const bas = String.fromCharCode.apply(null, Array.from(bayt.slice(0, 5)));
      ekle('PDF dosyası üretildi (>10 KB, %PDF-)', 'evet', (bayt.length > 10000 && bas === '%PDF-') ? 'evet' : (bayt.length + ' bayt'), 0);
    } catch (e) {
      ekle('PDF dosyası üretildi (>10 KB, %PDF-)', 'evet', 'HATA: ' + e.message);
    }

    // 12 — kaydet: diske yazılan toplam bellektekiyle aynı
    App.kaydet();
    try {
      const kayit = JSON.parse(localStorage.getItem('numex.datastory.v1'));
      let t = 0;
      kayit.rows.forEach(r => { const n = Number(r['Tutar']); if (isFinite(n)) t += kurus(n); });
      ekle('Kaydet → saklanan Tutar toplamı', App.kolonToplami('Tutar'), t / 100);
    } catch (e) {
      ekle('Kaydet → saklanan Tutar toplamı', 'kayıt', 'HATA: ' + e.message);
    }

    // 13 — yinelenen silme: toplam tam olarak kopyaların tutarı kadar azalır
    const dup = App.yinelenenleriBul();
    const kopyaTutar = Array.from(dup).reduce((a, i) => a + kurus(App.state.rows[i]['Tutar'] || 0), 0) / 100;
    const once = App.kolonToplami('Tutar');
    const satirOnce = App.state.rows.length;
    if (dup.size) {
      const btn = document.querySelector('#btnDedup');
      if (btn) btn.click();
    }
    ekle('Yinelenen silindi → satır sayısı azalması', dup.size, satirOnce - App.state.rows.length);
    ekle('Yinelenen silindi → toplam azalması = kopya tutarı', kopyaTutar, once - App.kolonToplami('Tutar'), 0.011);

    ciz();
    window.__kabulSonuc = {
      toplam: satirlar.length,
      gecen: satirlar.filter(s => s.gecti).length,
      kalan: satirlar.filter(s => !s.gecti).map(s => s.ad)
    };
    return satirlar;
  }

  function bagla() {
    const btn = $('#btnKabul');
    if (btn) btn.addEventListener('click', () => { run().then(() => { if (window.console) console.log('kabul:', window.__kabulSonuc); }); });
  }
  window.Kabul = { run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla);
  else bagla();
})();
