/**
 * Numex Data Detective — Arayüz katmanı
 * Tüm hesaplama tarayıcıda; dosya içeriği hiçbir yere gönderilmez.
 */

import { dosyaOku, csvCoz, sutunTani, kurusYazi, kurusDuz, tarihYazi, paraKurus } from './core.js';
import { karsilastir, TIP_BILGI, SIRA, kayitlariCikar } from './engine.js';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const SENARYOLAR = {
  1: {
    ad: 'Banka & satış mutabakatı', birim: 'TL',
    a: { dosya: 'data/senaryo1-satis.csv', etiket: 'Satış kayıtları' },
    b: { dosya: 'data/senaryo1-banka.csv', etiket: 'Banka hareketleri' },
    not: '11 satış, 12 banka hareketi: eksik ödeme, çift kayıt, tutar/tarih farkı, 00123 ↔ 123 ve transpoze kimlik.'
  },
  2: {
    ad: 'Depo & mağaza stok', birim: 'Adet',
    a: { dosya: 'data/senaryo2-depo.csv', etiket: 'Depo sayımı' },
    b: { dosya: 'data/senaryo2-magaza.csv', etiket: 'Mağaza sayımı' },
    not: '8 ürün, adet karşılaştırması: eksik sayım, miktar farkı, yinelenen satır, U-00108 ↔ U-108.'
  },
  3: {
    ad: 'Personel maaş & ödeme', birim: 'TL',
    a: { dosya: 'data/senaryo3-personel.csv', etiket: 'Personel / net maaş' },
    b: { dosya: 'data/senaryo3-odeme.csv', etiket: 'Banka ödemeleri' },
    not: '8 personel, 10 ödeme: çift maaş, eksik ödeme, 180 TL fark, P-0048 ↔ P-048.'
  }
};

const state = {
  A: null, B: null,
  ayar: { tutarTolerans: 0, tarihTolerans: 0, benzerEsik: 0.6, birim: 'TL' },
  elle: { onayli: [], ayrilan: [], reddedilen: [] },
  cozulen: {},
  gecmis: [],
  geriYigin: [],
  sonuc: null,
  secili: null,
  filtre: 'hepsi',
  sekme: 'dedektif',
  senaryo: null
};

/* ------------------------------- yardımcı -------------------------------- */

function toast(mesaj, tur = '') {
  const t = $('#toast');
  t.textContent = mesaj;
  t.className = 'toast gorunur ' + tur;
  clearTimeout(t._zaman);
  t._zaman = setTimeout(() => { t.className = 'toast ' + tur; }, 2800);
}

function kacis(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function saatYazi(ts) {
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function anlikAl() {
  state.geriYigin.push(JSON.stringify({ elle: state.elle, cozulen: state.cozulen, gecmis: state.gecmis }));
  if (state.geriYigin.length > 60) state.geriYigin.shift();
}

function logEkle(ikon, islem, detay = '', anlikYok = false) {
  if (!anlikYok) anlikAl();
  state.gecmis.push({ ts: Date.now(), ikon, islem, detay });
  if (state.gecmis.length > 300) state.gecmis.shift();
}

function durum(id) { return state.cozulen[id] ? 'cozuldu' : 'acik'; }

function birim() { return state.ayar.birim; }
function para(kurus) { return kurusYazi(kurus, birim()); }

/* --------------------------- dosya yükleme ------------------------------- */

async function dosyaYerlestir(taraf, veri) {
  veri.mapping = sutunTani(veri.basliklar, veri.satirlar);
  state[taraf] = veri;
  logEkle('↥', `${taraf} dosyası yüklendi`, `${veri.ad} · ${veri.satirlar.length} satır`);
  dosyaKartiCiz(taraf);
  guncelleDosyaRozet();
  girisGuncelle();
  if (state.sonuc) karsilastirTetikle(true);
}

/** Giriş (hero) kartı yalnız hiç dosya yokken görünür. */
function girisGuncelle() {
  const hero = $('#girisHero');
  if (hero) hero.hidden = !!(state.A || state.B);
}

/** Mobil alt çubuktaki kısa durum metni. */
function mobilGuncelle() {
  const cubuk = $('#mobilCubuk');
  const ozet = $('#mobilOzet');
  if (!cubuk || !ozet) return;
  cubuk.hidden = !(state.sonuc || state.A || state.B);
  if (state.sonuc) {
    const s = state.sonuc.istatistik;
    ozet.textContent = `${s.toplam} sorun · ${s.eslesme} eşleşme`;
  } else if (state.A && state.B) {
    ozet.textContent = 'Dosyalar hazır — karşılaştırın';
  } else {
    ozet.textContent = `${state.A ? 1 : 0} / 2 dosya yüklendi`;
  }
  const btn = $('#btnMobilKarsilastir');
  if (btn) btn.disabled = !(state.A && state.B && state.A.mapping?.anahtar >= 0 && state.B.mapping?.anahtar >= 0);
}

async function dosyaSecildi(taraf, file) {
  try {
    const veri = await dosyaOku(file);
    await dosyaYerlestir(taraf, veri);
    toast(`${file.name} yüklendi · ${veri.satirlar.length} satır`, 'basari');
  } catch (e) {
    toast('Dosya okunamadı: ' + e.message, 'hata');
    const d = document.querySelector(`[data-durum="${taraf}"]`);
    if (d) { d.textContent = 'hata'; d.dataset.durum = 'hata'; }
  }
}

async function senaryoYukle(no) {
  const s = SENARYOLAR[no];
  if (!s) return;
  try {
    const [a, b] = await Promise.all([s.a.dosya, s.b.dosya].map(async u => {
      const r = await fetch(u);
      if (!r.ok) throw new Error('Örnek dosya bulunamadı: ' + u);
      const metin = await r.text();
      const t = csvCoz(metin);
      return { ad: u.split('/').pop(), basliklar: t.basliklar, satirlar: t.satirlar };
    }));
    state.senaryo = no;
    state.ayar.birim = s.birim;
    $('#birimSec').value = s.birim;
    state.elle = { onayli: [], ayrilan: [], reddedilen: [] };
    state.cozulen = {};
    state.gecmis = [];
    state.geriYigin = [];
    state.sonuc = null;
    state.secili = null;
    await dosyaYerlestir('A', a);
    await dosyaYerlestir('B', b);
    logEkle('📁', `Örnek senaryo yüklendi: ${s.ad}`, s.not);
    karsilastirTetikle(true);
    toast('Örnek hazır: ' + s.ad, 'basari');
  } catch (e) {
    toast('Örnek yüklenemedi: ' + e.message, 'hata');
  }
}

function guncelleDosyaRozet() {
  const n = (state.A ? 1 : 0) + (state.B ? 1 : 0);
  $('#dosyaRoze').textContent = `${n} / 2 dosya`;
  const hazir = state.A && state.B && state.A.mapping?.anahtar >= 0 && state.B.mapping?.anahtar >= 0 &&
    state.A.mapping?.tutar >= 0 && state.B.mapping?.tutar >= 0;
  $('#btnKarsilastir').disabled = !hazir;
  $('#karsilastirIpucu').textContent = hazir ? 'Hazır — karşılaştırmayı başlatın'
    : (!state.A || !state.B) ? 'İki dosyayı da yükleyin' : 'Anahtar ve tutar sütunlarını seçin';
  mobilGuncelle();
}

function secenekler(veri, secili) {
  return veri.basliklar.map((b, i) =>
    `<option value="${i}" ${i === secili ? 'selected' : ''}>${kacis(b)}</option>`).join('');
}

function dosyaKartiCiz(taraf) {
  const kart = document.querySelector(`[data-taraf="${taraf}"]`);
  const icerik = document.querySelector(`[data-icerik="${taraf}"]`);
  const birak = document.querySelector(`[data-birak="${taraf}"]`);
  const durumEl = document.querySelector(`[data-durum="${taraf}"]`);
  const veri = state[taraf];

  if (!veri) {
    icerik.hidden = true; birak.hidden = false; kart.classList.remove('dolu');
    durumEl.textContent = 'bekliyor'; durumEl.dataset.durum = taraf;
    return;
  }

  birak.hidden = true; icerik.hidden = false; kart.classList.add('dolu');
  durumEl.textContent = `${veri.satirlar.length} satır · hazır`; durumEl.dataset.durum = 'hazir';

  const m = veri.mapping;
  const onizleme = veri.satirlar.slice(0, 4);
  const basliklar = veri.basliklar;

  icerik.innerHTML = `
    <div class="di-ust">
      <div>
        <div class="di-ad">${kacis(veri.ad)}</div>
        <div class="di-alt">${veri.satirlar.length} kayıt · ${basliklar.length} sütun${veri.sayfaAdi ? ' · sayfa: ' + kacis(veri.sayfaAdi) : ''}</div>
      </div>
      <button class="btn btn-kucuk btn-hayalet" data-degistir="${taraf}">değiştir</button>
    </div>
    <div class="esleme-grid">
      <label>Kimlik sütunu<select data-esle="${taraf}" data-alan="anahtar">${secenekler(veri, m.anahtar)}</select></label>
      <label>Tutar / miktar<select data-esle="${taraf}" data-alan="tutar">${secenekler(veri, m.tutar)}</select></label>
      <label>Tarih<select data-esle="${taraf}" data-alan="tarih"><option value="-1" ${m.tarih < 0 ? 'selected' : ''}>— yok —</option>${secenekler(veri, m.tarih)}</select></label>
      <label>Açıklama<select data-esle="${taraf}" data-alan="aciklama"><option value="-1" ${m.aciklama < 0 ? 'selected' : ''}>— yok —</option>${secenekler(veri, m.aciklama)}</select></label>
    </div>
    ${(m.uyarilar || []).map(u => `<div class="uyari-kutu">⚠ ${kacis(u)}</div>`).join('')}
    <div class="onizleme-sarmal">
      <table class="onizleme-tablo">
        <thead><tr>${basliklar.map(b => `<th>${kacis(b)}</th>`).join('')}</tr></thead>
        <tbody>${onizleme.map(s => `<tr>${basliklar.map((_, i) => `<td>${kacis(s.hucre[i])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;
}

/* ---------------------------- karşılaştırma ------------------------------ */

function ayarOku() {
  state.ayar.tutarTolerans = Math.max(0, parseInt($('#tutarTolerans').value || '0', 10) || 0);
  state.ayar.tarihTolerans = Math.max(0, parseInt($('#tarihTolerans').value || '0', 10) || 0);
  state.ayar.benzerEsik = parseFloat($('#benzerEsik').value || '0.6');
  state.ayar.birim = $('#birimSec').value || 'TL';
}

function karsilastirTetikle(sessiz = false) {
  ayarOku();
  if (!state.A || !state.B) { toast('Önce iki dosyayı yükleyin', 'hata'); return; }
  const sonuc = karsilastir({ A: state.A, B: state.B, ayar: state.ayar, elle: state.elle });
  state.sonuc = sonuc;
  if (state.secili && !sonuc.sorunlar.some(s => s.id === state.secili)) state.secili = null;
  if (!sessiz) logEkle('🔍', 'Karşılaştırma çalıştırıldı',
    `${sonuc.sorunlar.length} sorun · ${sonuc.eslesmeler.length} eşleşme`);
  ekranlariAc();
  yenile();
}

function ekranlariAc() {
  $('#ozetBolumu').hidden = false;
  $('#sekmeler').hidden = false;
  $('#anaPanel').hidden = false;
  mobilGuncelle();
}

/* ------------------------------- render ---------------------------------- */

function yenile() {
  renderOzet();
  renderSayaclar();
  renderFiltreler();
  renderListe();
  renderDetay();
  renderEslesmeler();
  renderGecmis();
  renderRapor();
  guncelleDosyaRozet();
}

function renderSayaclar() {
  if (!state.sonuc) return;
  const s = state.sonuc.istatistik;
  $('#sayacDedektif').textContent = s.toplam;
  $('#sayacEslesme').textContent = s.eslesme;
  $('#sayacGecmis').textContent = state.gecmis.length;
}

function renderOzet() {
  if (!state.sonuc) return;
  const s = state.sonuc.istatistik;
  const cozulenSayi = Object.keys(state.cozulen).length;
  const kartlar = [
    { tip: 'kritik', baslik: 'Kritik sorun', deger: s.toplam - s.uyari - s.bilgi, alt: 'ödemesi yok / çift kayıt', sinif: 'kritik' },
    { tip: 'uyari', baslik: 'Uyarı', deger: s.uyari, alt: 'tutar, tarih, şüpheli eşleşme', sinif: 'uyari' },
    { tip: 'bilgi', baslik: 'Bilgi', deger: s.bilgi, alt: 'veri kalitesi notları', sinif: '' },
    { tip: 'eslesme', baslik: 'Eşleşen kayıt', deger: s.eslesme, alt: `${s.kesin} kesin · ${s.manuel} manuel`, sinif: 'mor' },
    { tip: '', baslik: 'Net tutar farkı', deger: para(s.farkToplamKurus), alt: `A ${para(s.aToplamKurus)} · B ${para(s.bToplamKurus)}`, sinif: '' },
    { tip: '', baslik: 'Çözülen', deger: cozulenSayi, alt: 'işaretlenen sorun', sinif: '' }
  ];
  $('#ozetGrid').innerHTML = kartlar.map(k => `
    <div class="ozet-kart" data-tip="${k.tip}">
      <div class="oe-baslik">${k.baslik}</div>
      <div class="oe-deger ${k.sinif}">${kacis(k.deger)}</div>
      <div class="oe-alt">${kacis(k.alt)}</div>
    </div>`).join('');

  const toplam = Math.max(s.toplam, 1);
  $('#dengeCubugu').innerHTML = `
    <span class="denge-parca"><span class="denge-nokta" style="background:var(--mercan)"></span>kritik ${s.toplam - s.uyari - s.bilgi}</span>
    <span class="denge-parca"><span class="denge-nokta" style="background:#f0b429"></span>uyarı ${s.uyari}</span>
    <span class="denge-parca"><span class="denge-nokta" style="background:var(--turkuaz)"></span>bilgi ${s.bilgi}</span>
    <div class="denge-bar">
      <span style="width:${((s.toplam - s.uyari - s.bilgi) / toplam) * 100}%;background:var(--mercan)"></span>
      <span style="width:${(s.uyari / toplam) * 100}%;background:#f0b429"></span>
      <span style="width:${(s.bilgi / toplam) * 100}%;background:var(--turkuaz)"></span>
    </div>
    <span class="denge-parca">${s.aSatir} ↔ ${s.bSatir} satır karşılaştırıldı</span>`;
}

const FILTRELER = [
  { id: 'hepsi', ad: 'Tümü' },
  { id: 'kritik', ad: 'Kritik' },
  { id: 'uyari', ad: 'Uyarı' },
  { id: 'supheli', ad: 'Şüpheli eşleşme' },
  { id: 'cozuldu', ad: 'Çözülen' }
];

function filtreli() {
  if (!state.sonuc) return [];
  const f = state.filtre;
  return state.sonuc.sorunlar.filter(s => {
    if (f === 'kritik') return s.sinif === 'kritik';
    if (f === 'uyari') return s.sinif === 'uyari' || s.sinif === 'bilgi';
    if (f === 'supheli') return s.tip === 'supheli-eslesme' || s.tip === 'kimlik-format';
    if (f === 'cozuldu') return !!state.cozulen[s.id];
    return true;
  });
}

function renderFiltreler() {
  if (!state.sonuc) return;
  const s = state.sonuc.istatistik;
  const sayilar = {
    hepsi: s.toplam, kritik: s.toplam - s.uyari - s.bilgi, uyari: s.uyari + s.bilgi,
    supheli: s.supheli, cozuldu: Object.keys(state.cozulen).length
  };
  $('#filtreler').innerHTML = FILTRELER.map(f =>
    `<button class="filtre ${state.filtre === f.id ? 'aktif' : ''}" data-filtre="${f.id}">${f.ad} ${sayilar[f.id] ?? 0}</button>`
  ).join('');
}

function guvenSinif(seviye) {
  return { kesin: 'kesin', yuksek: 'yuksek', orta: 'orta', dusuk: 'dusuk' }[seviye] || 'orta';
}

function renderListe() {
  if (!state.sonuc) return;
  const liste = filtreli();
  if (!liste.length) {
    $('#sorunListesi').innerHTML = `<div class="bos-durum" style="padding:40px 10px"><div class="bos-ikon">✅</div><h3>Bu filtrede sorun yok</h3><p>${state.filtre === 'cozuldu' ? 'Henüz çözüldü olarak işaretlenen sorun yok.' : 'Farklı bir filtre deneyin.'}</p></div>`;
    return;
  }
  $('#sorunListesi').innerHTML = liste.map(s => {
    const coz = durum(s.id) === 'cozuldu';
    const satirlar = s.kaynaklar.map(k => `<span class="sk-satir">${kacis(k)}</span>`).join('');
    return `<div class="sorun-kart ${state.secili === s.id ? 'secili' : ''} ${coz ? 'cozuldu' : ''}" data-sorun="${kacis(s.id)}" data-sinif="${s.sinif}" tabindex="0" role="button">
      <div class="sk-ust">
        <span class="sk-tip"><span class="guven-nokta g-${guvenSinif(s.guven.seviye)}"></span>${kacis(s.tipAd)}</span>
        ${coz ? '<span class="coz-etiket">çözüldü</span>' : `<span class="sk-tip">%${s.guven.puan} güven</span>`}
      </div>
      <div class="sk-baslik">${kacis(s.baslik)}</div>
      <div class="sk-alt">${satirlar}</div>
    </div>`;
  }).join('');
}

function kayitKutusu(k, sinif, baslik, karsi) {
  if (!k) {
    return `<div class="kayit-kutu"><div class="kk-ust ${sinif}">${baslik}<span>—</span></div>
      <div class="kk-satir"><span class="etiket">Durum</span><span class="deger">Bu tarafta kayıt yok</span></div></div>`;
  }
  const alanlar = [
    ['Dosya', k.dosya],
    ['Satır', String(k.satir)],
    ['Kimlik', k.anahtar || '—'],
    ['Tutar', k.tutarMetin],
    ['Tarih', k.tarihMetin],
    ['Açıklama', k.aciklama || '—']
  ];
  return `<div class="kayit-kutu">
    <div class="kk-ust ${sinif}">${baslik}<span>${kacis(k.etiket)}</span></div>
    ${alanlar.map(([e, d]) => {
      const farkli = karsi && ((e === 'Kimlik' && String(d) !== String(karsi.anahtar || '—')) ||
        (e === 'Tutar' && k.tutar !== karsi.tutar) ||
        (e === 'Tarih' && k.tarih !== karsi.tarih) ||
        (e === 'Açıklama' && (k.aciklama || '—') !== (karsi.aciklama || '—')));
      return `<div class="kk-satir"><span class="etiket">${e}</span><span class="deger ${farkli ? 'farkli' : ''}">${kacis(d)}</span></div>`;
    }).join('')}
  </div>`;
}

function renderDetay() {
  const panel = $('#detayPanel');
  if (!state.sonuc || !state.secili) {
    panel.innerHTML = `<div class="bos-durum"><div class="bos-ikon">🔍</div><h3>Soldan bir sorun seçin</h3>
      <p>Hatanın açıklamasını, kaynak satırları, beklenen/mevcut değerleri ve önerilen düzeltmeyi burada yan yana göreceksiniz.</p></div>`;
    return;
  }
  const s = state.sonuc.sorunlar.find(x => x.id === state.secili);
  if (!s) { state.secili = null; renderDetay(); return; }
  const coz = durum(s.id) === 'cozuldu';
  const supheliMi = s.tip === 'supheli-eslesme' || s.tip === 'kimlik-format';
  const ciftMi = !!(s.a && s.b);

  const eylemler = [];
  if (supheliMi && coz !== true) {
    eylemler.push(`<button class="btn btn-turkuaz" data-eylem="onayla" data-id="${kacis(s.id)}">✔ Eşleştir (onayla)</button>`);
    eylemler.push(`<button class="btn btn-mercan" data-eylem="yuksay" data-id="${kacis(s.id)}">✖ Yok say</button>`);
  }
  if (ciftMi) eylemler.push(`<button class="btn btn-hayalet" data-eylem="ayir" data-id="${kacis(s.id)}">✂ Eşleşmeyi ayır</button>`);
  eylemler.push(coz
    ? `<button class="btn btn-hayalet" data-eylem="cozgeri" data-id="${kacis(s.id)}">↺ Çözümü geri al</button>`
    : `<button class="btn btn-mor" data-eylem="coz" data-id="${kacis(s.id)}">✓ Çözüldü işaretle</button>`);

  panel.innerHTML = `
    <button class="btn btn-hayalet btn-kucuk mobil-geri" data-eylem="geri-liste">← Listeye dön</button>
    <div class="dd-ust">
      <div>
        <span class="dd-etiket ${s.sinif}">${kacis(s.tipAd)}</span>
        <h2 class="dd-baslik">${kacis(s.baslik)}</h2>
      </div>
      ${coz ? '<span class="coz-etiket">çözüldü</span>' : ''}
    </div>
    <div class="dd-aciklama">${kacis(s.aciklama)}</div>
    <div class="guven-satiri">
      <strong style="font-size:12.5px">Güven: ${kacis(s.guven.seviye)}</strong>
      <div class="guven-cubuk"><span style="width:${s.guven.puan}%"></span></div>
      <span style="font-size:12.5px;color:var(--soluk)">%${s.guven.puan}</span>
      <span style="font-size:12px;color:var(--soluk)">${s.kaynaklar.map(k => `<span class="kaynak-etiket">📄 ${kacis(k)}</span>`).join('')}</span>
    </div>
    <div class="karsilastirma">
      ${kayitKutusu(s.a, 'a', 'A · Kaynak dosya', s.b)}
      ${kayitKutusu(s.b, 'b', 'B · Karşılaştırma dosyası', s.a)}
    </div>
    <div class="beklenen-mevcut">
      <div class="bm-kutu beklenen"><div class="bm-etiket">Beklenen</div><div class="bm-deger">${kacis(s.beklenen || '—')}</div></div>
      <div class="bm-kutu mevcut"><div class="bm-etiket">Mevcut</div><div class="bm-deger">${kacis(s.mevcut || '—')}</div></div>
    </div>
    <div class="oneri-kutu"><strong>Önerilen düzeltme:</strong> ${kacis(s.oneri || '—')}</div>
    <div class="dd-eylemler">${eylemler.join('')}</div>`;
}

function renderEslesmeler() {
  if (!state.sonuc) return;
  const s = state.sonuc.istatistik;
  $('#eslesmeIstatistik').innerHTML =
    `<span>toplam <b>${s.eslesme}</b></span><span>kesin <b>${s.kesin}</b></span><span>manuel <b>${s.manuel}</b></span><span>şüpheli aday <b>${s.supheli}</b></span>`;
  const satirlar = state.sonuc.eslesmeler.map(e => {
    const fark = (e.a.tutar != null && e.b.tutar != null) ? e.b.tutar - e.a.tutar : null;
    // data-label: dar ekranda tablo kart görünümüne dönüşürken alan adı olarak kullanılır
    return `<tr>
      <td data-label="Tip"><span class="rozet ${e.tip === 'manuel' ? 'manuel' : 'kesin'}">${e.tip === 'manuel' ? 'manuel onay' : 'kesin'}</span></td>
      <td data-label="A dosya">${kacis(e.a.dosya)}<br><span style="color:var(--soluk)">satır ${e.a.satir}</span></td>
      <td data-label="A kimlik"><b>${kacis(e.a.anahtar || '—')}</b><br><span style="color:var(--soluk)">${kacis(e.a.aciklama || '')}</span></td>
      <td class="sayi" data-label="A tutar">${kacis(e.a.tutarMetin)}</td>
      <td class="sayi" data-label="A tarih">${kacis(e.a.tarihMetin)}</td>
      <td data-label="B dosya">${kacis(e.b.dosya)}<br><span style="color:var(--soluk)">satır ${e.b.satir}</span></td>
      <td data-label="B kimlik"><b>${kacis(e.b.anahtar || '—')}</b><br><span style="color:var(--soluk)">${kacis(e.b.aciklama || '')}</span></td>
      <td class="sayi" data-label="B tutar">${kacis(e.b.tutarMetin)}</td>
      <td class="sayi" data-label="Fark">${fark === 0 ? '<span style="color:var(--turkuaz-koyu);font-weight:700">0</span>' : kacis(para(fark))}</td>
      <td class="sayi" data-label="Gün">${e.gunFark == null ? '—' : e.gunFark + ' g'}</td>
      <td><button class="btn btn-kucuk btn-hayalet" data-eylem="ayir" data-id="${kacis(e.id)}">ayır</button></td>
    </tr>`;
  }).join('');
  $('#eslesmeTablosu').innerHTML = `
    <thead><tr><th>Tip</th><th>A dosya</th><th>A kimlik</th><th class="sayi">A tutar</th><th class="sayi">A tarih</th>
    <th>B dosya</th><th>B kimlik</th><th class="sayi">B tutar</th><th class="sayi">Fark</th><th class="sayi">Gün</th><th></th></tr></thead>
    <tbody>${satirlar || '<tr><td colspan="11" style="text-align:center;color:var(--soluk);padding:24px">Eşleşme yok</td></tr>'}</tbody>`;
}

function renderGecmis() {
  $('#sayacGecmis').textContent = state.gecmis.length;
  if (!state.gecmis.length) {
    $('#gecmisListe').innerHTML = '<li><span class="gc-saat">—</span><span class="gc-detay">Henüz işlem yapılmadı.</span></li>';
    return;
  }
  $('#gecmisListe').innerHTML = state.gecmis.slice().reverse().map(g => `
    <li>
      <span class="gc-saat">${saatYazi(g.ts)}</span>
      <span class="gc-ikon">${kacis(g.ikon)}</span>
      <span><b>${kacis(g.islem)}</b>${g.detay ? `<br><span class="gc-detay">${kacis(g.detay)}</span>` : ''}</span>
    </li>`).join('');
}

function renderRapor() {
  if (!state.sonuc) return;
  const s = state.sonuc.istatistik;
  const cozulenSayi = Object.keys(state.cozulen).length;
  const ilk = state.sonuc.sorunlar.slice(0, 12);
  $('#raporMetni').innerHTML = `
    <p><b>${kacis(state.A.ad)}</b> ↔ <b>${kacis(state.B.ad)}</b></p>
    <p class="alt-yazi">${s.aSatir} + ${s.bSatir} satır · ${s.eslesme} eşleşme · ${s.toplam} sorun (${cozulenSayi} çözüldü)</p>
    <h3>Özet</h3>
    <table>
      <tr><th>Kritik</th><th>Uyarı</th><th>Bilgi</th><th>Net tutar farkı</th></tr>
      <tr><td>${s.toplam - s.uyari - s.bilgi}</td><td>${s.uyari}</td><td>${s.bilgi}</td><td>${kacis(para(s.farkToplamKurus))}</td></tr>
      <tr><th>A toplam</th><td colspan="3">${kacis(para(s.aToplamKurus))}</td></tr>
      <tr><th>B toplam</th><td colspan="3">${kacis(para(s.bToplamKurus))}</td></tr>
    </table>
    <h3>İlk sorunlar</h3>
    <table><tr><th>Tip</th><th>Açıklama</th><th>Kaynak</th></tr>
    ${ilk.map(x => `<tr><td>${kacis(x.tipAd)}</td><td>${kacis(x.baslik)}</td><td>${kacis(x.kaynaklar.join(' · '))}</td></tr>`).join('')}
    </table>
    <p class="alt-yazi">Tamamı PDF raporunda.</p>`;
}

/* ------------------------------- eylemler -------------------------------- */

function sorunSec(id) {
  state.secili = id;
  renderListe();
  renderDetay();
  // telefonda detay, tam ekran çekmece olarak açılır
  const panel = $('#detayPanel');
  if (window.matchMedia('(max-width: 900px)').matches) {
    panel.classList.add('mobil-acik');
    document.body.classList.add('detay-acik');
    panel.scrollTop = 0;
  }
}

function detayKapat() {
  const panel = $('#detayPanel');
  panel.classList.remove('mobil-acik');
  document.body.classList.remove('detay-acik');
}

function coz(id) {
  const s = state.sonuc.sorunlar.find(x => x.id === id);
  logEkle('✓', 'Sorun çözüldü olarak işaretlendi', s ? s.baslik : id);
  state.cozulen[id] = { ts: Date.now() };
  yenile();
  toast('Çözüldü olarak işaretlendi', 'basari');
}

function cozGeri(id) {
  logEkle('↺', 'Çözüm işareti kaldırıldı', id);
  delete state.cozulen[id];
  yenile();
  toast('Çözüm geri alındı');
}

function eslestirOnayla(id) {
  const s = state.sonuc.sorunlar.find(x => x.id === id);
  if (!s || !s.a || !s.b) return;
  logEkle('🔗', 'Şüpheli eşleşme onaylandı', `${s.a.dosya} ${s.a.satir} ↔ ${s.b.dosya} ${s.b.satir}`);
  state.elle.onayli.push([s.a.satir, s.b.satir]);
  state.secili = null;
  karsilastirTetikle(true);
  toast('Eşleştirildi — artık kesin eşleşme sayılıyor', 'basari');
}

function yokSay(id) {
  const s = state.sonuc.sorunlar.find(x => x.id === id);
  if (!s) return;
  logEkle('✖', 'Şüpheli eşleşme yok sayıldı', s.baslik);
  state.elle.reddedilen.push(id);
  state.secili = null;
  karsilastirTetikle(true);
  toast('Aday reddedildi, kayıtlar ayrı değerlendiriliyor');
}

function eslesmeAyir(id) {
  const e = state.sonuc.eslesmeler.find(x => x.id === id);
  if (!e) return;
  logEkle('✂', 'Eşleşme ayrıldı', `${e.a.dosya} ${e.a.satir} ↔ ${e.b.dosya} ${e.b.satir}`);
  state.elle.ayrilan.push([e.a.satir, e.b.satir]);
  state.secili = null;
  karsilastirTetikle(true);
  toast('Eşleşme ayrıldı; iki kayıt yeniden değerlendirilecek');
}

function geriAl() {
  if (!state.geriYigin.length) { toast('Geri alınacak işlem yok'); return; }
  const anlik = JSON.parse(state.geriYigin.pop());
  const son = state.gecmis[state.gecmis.length - 1];
  state.elle = anlik.elle;
  state.cozulen = anlik.cozulen;
  state.gecmis = anlik.gecmis;
  if (state.A && state.B) {
    state.secili = null;
    state.sonuc = karsilastir({ A: state.A, B: state.B, ayar: state.ayar, elle: state.elle });
    ekranlariAc();
    yenile();
  }
  toast(son ? `Geri alındı: ${son.islem}` : 'Geri alındı');
}

/* ------------------------------ dışa aktarma ----------------------------- */

function indir(icerik, dosyaAdi, mime) {
  const blob = new Blob([icerik], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = dosyaAdi;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
}

function zamanDamgasi() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function csvAktar() {
  if (!state.sonuc) { toast('Önce karşılaştırın', 'hata'); return; }
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const satirlar = [];
  satirlar.push(['EŞLEŞMELER']);
  satirlar.push(['Tip', 'A Dosya', 'A Satır', 'A Kimlik', 'A Tutar', 'A Tarih', 'B Dosya', 'B Satır', 'B Kimlik', 'B Tutar', 'B Tarih', 'Tutar Farkı', 'Gün Farkı']);
  for (const e of state.sonuc.eslesmeler) {
    satirlar.push([e.tip === 'manuel' ? 'manuel onay' : 'kesin', e.a.dosya, e.a.satir, e.a.anahtar,
      kurusDuz(e.a.tutar), e.a.tarih || '', e.b.dosya, e.b.satir, e.b.anahtar,
      kurusDuz(e.b.tutar), e.b.tarih || '', kurusDuz((e.b.tutar ?? 0) - (e.a.tutar ?? 0)), e.gunFark ?? '']);
  }
  satirlar.push([]);
  satirlar.push(['SORUNLAR']);
  satirlar.push(['Tip', 'Sınıf', 'Güven %', 'Açıklama', 'Beklenen', 'Mevcut', 'Kaynak Satırlar', 'Öneri', 'Durum']);
  for (const s of state.sonuc.sorunlar) {
    satirlar.push([s.tipAd, s.sinif, s.guven.puan, s.baslik, s.beklenen || '', s.mevcut || '',
      s.kaynaklar.join(' | '), s.oneri || '', durum(s.id) === 'cozuldu' ? 'çözüldü' : 'açık']);
  }
  const metin = '\uFEFF' + satirlar.map(r => r.map(q).join(';')).join('\r\n');
  indir(metin, `numex-dedektif-eslesmeler-${zamanDamgasi()}.csv`, 'text/csv;charset=utf-8');
  logEkle('⤓', 'CSV indirildi', `${state.sonuc.eslesmeler.length} eşleşme, ${state.sonuc.sorunlar.length} sorun`);
  renderGecmis();
  toast('CSV indirildi', 'basari');
}

function projeJson() {
  return {
    surum: 1, uygulama: 'Numex Data Detective', kayit: new Date().toISOString(),
    senaryo: state.senaryo, ayar: state.ayar,
    A: state.A ? { ad: state.A.ad, basliklar: state.A.basliklar, satirlar: state.A.satirlar, mapping: state.A.mapping } : null,
    B: state.B ? { ad: state.B.ad, basliklar: state.B.basliklar, satirlar: state.B.satirlar, mapping: state.B.mapping } : null,
    elle: state.elle, cozulen: state.cozulen, gecmis: state.gecmis
  };
}

function jsonAktar() {
  indir(JSON.stringify(projeJson(), null, 2), `numex-dedektif-proje-${zamanDamgasi()}.json`, 'application/json');
  logEkle('⤓', 'Proje JSON olarak kaydedildi', '');
  renderGecmis();
  toast('Proje kaydedildi', 'basari');
}

async function jsonYukle(file) {
  try {
    const j = JSON.parse(await file.text());
    if (!j.A || !j.B) throw new Error('Proje dosyasında iki veri seti bulunamadı.');
    state.A = j.A; state.B = j.B;
    state.ayar = { ...state.ayar, ...(j.ayar || {}) };
    state.elle = j.elle || { onayli: [], ayrilan: [], reddedilen: [] };
    state.cozulen = j.cozulen || {};
    state.gecmis = j.gecmis || [];
    state.geriYigin = [];
    state.senaryo = j.senaryo || null;
    $('#tutarTolerans').value = state.ayar.tutarTolerans ?? 0;
    $('#tarihTolerans').value = state.ayar.tarihTolerans ?? 0;
    $('#benzerEsik').value = String(state.ayar.benzerEsik ?? 0.6);
    $('#birimSec').value = state.ayar.birim || 'TL';
    dosyaKartiCiz('A'); dosyaKartiCiz('B');
    guncelleDosyaRozet();
    karsilastirTetikle(true);
    logEkle('↥', 'Proje yüklendi', file.name);
    renderGecmis();
    toast('Proje yüklendi — kaldığınız yerden devam', 'basari');
  } catch (e) {
    toast('Proje yüklenemedi: ' + e.message, 'hata');
  }
}

/* --------------------------------- PDF ----------------------------------- */

function pdfIcerik() {
  const s = state.sonuc.istatistik;
  const cozulenSayi = Object.keys(state.cozulen).length;
  const satir = x => `<tr>
    <td class="${x.sinif}">${kacis(x.tipAd)}</td>
    <td>${kacis(x.baslik)}</td>
    <td>${kacis(x.kaynaklar.join(' · '))}</td>
    <td>${kacis(x.beklenen || '—')}</td>
    <td>${kacis(x.mevcut || '—')}</td>
    <td>%${x.guven.puan} ${kacis(x.guven.seviye)}</td>
    <td>${kacis(x.oneri || '—')}</td>
    <td>${durum(x.id) === 'cozuldu' ? 'çözüldü' : 'açık'}</td>
  </tr>`;
  return `
    <h1>Numex Data Detective — Mutabakat Raporu</h1>
    <div style="color:#8792a8;font-size:11px">${new Date().toLocaleString('tr-TR')} · ${kacis(state.A.ad)} ↔ ${kacis(state.B.ad)}</div>
    <h2>Özet</h2>
    <table>
      <tr><th>Toplam sorun</th><th>Kritik</th><th>Uyarı</th><th>Bilgi</th><th>Çözülen</th><th>Eşleşme</th></tr>
      <tr><td>${s.toplam}</td><td class="kritik">${s.toplam - s.uyari - s.bilgi}</td><td>${s.uyari}</td><td>${s.bilgi}</td><td>${cozulenSayi}</td><td>${s.eslesme} (${s.kesin} kesin, ${s.manuel} manuel)</td></tr>
      <tr><th>A toplam</th><td colspan="5">${kacis(para(s.aToplamKurus))}</td></tr>
      <tr><th>B toplam</th><td colspan="5">${kacis(para(s.bToplamKurus))}</td></tr>
      <tr><th>Net fark</th><td colspan="5">${kacis(para(s.farkToplamKurus))}</td></tr>
    </table>
    <h2>Tespit edilen sorunlar (${s.toplam})</h2>
    <table>
      <thead><tr><th>Tip</th><th>Açıklama</th><th>Kaynak</th><th>Beklenen</th><th>Mevcut</th><th>Güven</th><th>Öneri</th><th>Durum</th></tr></thead>
      <tbody>${state.sonuc.sorunlar.map(satir).join('')}</tbody>
    </table>
    <h2>Eşleşmeler (${state.sonuc.eslesmeler.length})</h2>
    <table>
      <thead><tr><th>Tip</th><th>A satır</th><th>A kimlik</th><th>A tutar</th><th>B satır</th><th>B kimlik</th><th>B tutar</th><th>Fark</th></tr></thead>
      <tbody>${state.sonuc.eslesmeler.map(e => `<tr>
        <td>${e.tip === 'manuel' ? 'manuel' : 'kesin'}</td>
        <td>${kacis(e.a.dosya)} #${e.a.satir}</td><td>${kacis(e.a.anahtar)}</td><td>${kacis(e.a.tutarMetin)}</td>
        <td>${kacis(e.b.dosya)} #${e.b.satir}</td><td>${kacis(e.b.anahtar)}</td><td>${kacis(e.b.tutarMetin)}</td>
        <td>${kacis(para((e.b.tutar ?? 0) - (e.a.tutar ?? 0)))}</td></tr>`).join('')}</tbody>
    </table>
    <div class="pdf-alt">Para hesapları kuruş bazlı tamsayı ile yapılmıştır; kimlikler birebir eşleştirilmiştir (00123 ≠ 123). Şüpheli eşleşmeler kullanıcı onayı olmadan kesinleştirilmemiştir. · Numex Data Detective</div>`;
}

async function pdfAktar() {
  if (!state.sonuc) { toast('Önce karşılaştırın', 'hata'); return; }
  if (!window.html2canvas || !window.jspdf) { toast('PDF motoru yüklenemedi (vendor klasörü)', 'hata'); return; }
  const dugme = $('#btnPdf');
  dugme.disabled = true;
  const eski = dugme.querySelector('strong').textContent;
  dugme.querySelector('strong').textContent = 'PDF hazırlanıyor…';
  try {
    const node = $('#pdfRapor');
    node.innerHTML = pdfIcerik();
    node.style.display = 'block';
    const canvas = await window.html2canvas(node, { scale: 2, backgroundColor: '#ffffff', logging: false });
    node.style.display = 'none';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const sayfaG = 210, sayfaY = 297;
    const imgG = sayfaG, imgY = (canvas.height * imgG) / canvas.width;
    let konum = 0;
    pdf.addImage(canvas, 'PNG', 0, 0, imgG, imgY);
    while (konum + sayfaY < imgY) {
      konum += sayfaY;
      pdf.addPage();
      pdf.addImage(canvas, 'PNG', 0, -konum, imgG, imgY);
    }
    pdf.save(`numex-dedektif-raporu-${zamanDamgasi()}.pdf`);
    logEkle('⤓', 'PDF raporu indirildi', `${state.sonuc.sorunlar.length} sorun`);
    renderGecmis();
    toast('PDF indirildi', 'basari');
  } catch (e) {
    toast('PDF oluşturulamadı: ' + e.message, 'hata');
  } finally {
    dugme.disabled = false;
    dugme.querySelector('strong').textContent = eski;
    $('#pdfRapor').style.display = 'none';
  }
}

/* -------------------------------- olaylar -------------------------------- */

function sekmeAc(ad) {
  state.sekme = ad;
  $$('.sekme').forEach(b => b.classList.toggle('aktif', b.dataset.sekme === ad));
  $$('.panel').forEach(p => p.classList.toggle('aktif', p.dataset.panel === ad));
}

function baglan() {
  // dosya girdileri + sürükle-bırak
  $$('[data-girdi]').forEach(inp => {
    inp.addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) dosyaSecildi(inp.dataset.girdi, f);
      e.target.value = '';
    });
  });
  $$('[data-birak]').forEach(alan => {
    const taraf = alan.dataset.birak;
    ['dragenter', 'dragover'].forEach(ev => alan.addEventListener(ev, e => {
      e.preventDefault(); alan.closest('.dosya-kart').classList.add('surukle');
    }));
    ['dragleave', 'dragend'].forEach(ev => alan.addEventListener(ev, () => alan.closest('.dosya-kart').classList.remove('surukle')));
    alan.addEventListener('drop', e => {
      e.preventDefault();
      alan.closest('.dosya-kart').classList.remove('surukle');
      const f = e.dataTransfer.files[0];
      if (f) dosyaSecildi(taraf, f);
    });
  });

  // örnek menü
  $('#btnOrnek').addEventListener('click', e => {
    e.stopPropagation();
    const m = $('#ornekMenu');
    m.classList.toggle('acik');
    $('#btnOrnek').setAttribute('aria-expanded', m.classList.contains('acik'));
  });
  document.addEventListener('click', () => $('#ornekMenu').classList.remove('acik'));
  $('#ornekMenu').addEventListener('click', e => {
    const b = e.target.closest('[data-senaryo]');
    if (b) { $('#ornekMenu').classList.remove('acik'); senaryoYukle(b.dataset.senaryo); }
  });

  // eşleme seçimleri / dosya değiştir
  document.addEventListener('change', e => {
    const sel = e.target.closest('[data-esle]');
    if (sel) {
      const taraf = sel.dataset.esle, alan = sel.dataset.alan;
      const deger = parseInt(sel.value, 10);
      state[taraf].mapping[alan] = deger;
      logEkle('⚙', `${taraf} eşleştirme güncellendi`, `${alan} → ${state[taraf].basliklar[deger] || 'yok'}`);
      guncelleDosyaRozet();
      if (state.sonuc) karsilastirTetikle(true);
      return;
    }
    if (e.target.id === 'birimSec') {
      state.ayar.birim = e.target.value;
      if (state.sonuc) karsilastirTetikle(true);
    }
  });

  document.addEventListener('click', e => {
    const degistir = e.target.closest('[data-degistir]');
    if (degistir) {
      const taraf = degistir.dataset.degistir;
      const inp = document.querySelector(`[data-girdi="${taraf}"]`);
      if (inp) inp.click();
      return;
    }
    const kart = e.target.closest('[data-sorun]');
    if (kart) { sorunSec(kart.dataset.sorun); return; }

    const filtre = e.target.closest('[data-filtre]');
    if (filtre) { state.filtre = filtre.dataset.filtre; renderFiltreler(); renderListe(); return; }

    const sekme = e.target.closest('[data-sekme]');
    if (sekme) { sekmeAc(sekme.dataset.sekme); return; }

    const eylem = e.target.closest('[data-eylem]');
    if (eylem) {
      const id = eylem.dataset.id;
      switch (eylem.dataset.eylem) {
        case 'onayla': eslestirOnayla(id); break;
        case 'yuksay': yokSay(id); break;
        case 'ayir': eslesmeAyir(id); break;
        case 'coz': coz(id); break;
        case 'cozgeri': cozGeri(id); break;
        case 'geri-liste': detayKapat(); break;
      }
      return;
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); geriAl(); }
    if (e.key === 'Enter' && e.target.classList?.contains('sorun-kart')) sorunSec(e.target.dataset.sorun);
  });

  $('#btnKarsilastir').addEventListener('click', () => karsilastirTetikle());
  $('#btnMobilKarsilastir').addEventListener('click', () => karsilastirTetikle());
  $('#heroOrnek').addEventListener('click', () => senaryoYukle('1'));
  $('#btnGeriAl').addEventListener('click', geriAl);
  $('#btnPdf').addEventListener('click', pdfAktar);
  $('#btnCsv').addEventListener('click', csvAktar);
  $('#btnJson').addEventListener('click', jsonAktar);
  $('#btnJsonYukle').addEventListener('click', () => $('#projeGirdi').click());
  $('#btnProjeKaydet').addEventListener('click', jsonAktar);
  $('#btnProjeYukle').addEventListener('click', () => $('#projeGirdi').click());
  $('#projeGirdi').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) jsonYukle(f);
    e.target.value = '';
  });

  $('#btnSifirla').addEventListener('click', () => {
    if (state.A || state.B) {
      if (!confirm('Tüm dosyalar, kararlar ve geçmiş silinsin mi?')) return;
    }
    state.A = null; state.B = null; state.sonuc = null; state.secili = null;
    state.elle = { onayli: [], ayrilan: [], reddedilen: [] };
    state.cozulen = {}; state.gecmis = []; state.geriYigin = [];
    state.filtre = 'hepsi'; state.senaryo = null;
    $('#ozetBolumu').hidden = true; $('#sekmeler').hidden = true; $('#anaPanel').hidden = true;
    detayKapat();
    $('#mobilCubuk').hidden = true;
    dosyaKartiCiz('A'); dosyaKartiCiz('B'); guncelleDosyaRozet(); girisGuncelle();
    $('#raporMetni').innerHTML = '<p class="alt-yazi">Karşılaştırma çalıştırılınca rapor burada görünür.</p>';
    toast('Her şey sıfırlandı');
  });

  // ayar değişince yeniden hesapla
  ['tutarTolerans', 'tarihTolerans', 'benzerEsik'].forEach(id => {
    $('#' + id).addEventListener('change', () => { if (state.sonuc) karsilastirTetikle(true); });
  });
}

/* --------------------------------- açılış -------------------------------- */

baglan();
dosyaKartiCiz('A');
dosyaKartiCiz('B');
guncelleDosyaRozet();
girisGuncelle();
mobilGuncelle();

// üst çubuk: sayfa kayınca hafif gölge
const ustCubuk = document.getElementById('topbar');
if (ustCubuk) {
  const golge = () => ustCubuk.classList.toggle('kaydirildi', window.scrollY > 6);
  window.addEventListener('scroll', golge, { passive: true });
  golge();
}
// ekran büyürse açık kalmış mobil çekmeceyi kapat
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) detayKapat();
});

// dışa açık test kancası (kabul testleri için)
window.__dedektif = {
  get durum() { return state; },
  karsilastir: karsilastirTetikle,
  senaryo: senaryoYukle,
  sec: sorunSec,
  geriAl,
  paraKurus,
  pdfIcerik,
  csvMetni: () => { const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`; return state.sonuc ? state.sonuc.sorunlar.map(s => [s.tip, s.a?.satir ?? '', s.b?.satir ?? '', s.guven.puan].map(q).join(';')).join('\n') : ''; }
};
