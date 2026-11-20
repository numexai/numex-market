// Numex — DOM render katmanı
import * as H from './hesaplayici.js';
import { para, kisaPara, tarih, tarihKisa, yuzde, kacis, ayAdi } from './bicim.js';
// NUMEX-DÜZELTME (2026-11-20): tarih.js 'gunFarkıSafe' adında export etmiyor, gerçek ad 'gunFark'. Yanlış import tüm modül yüklenmesini çökertiyordu (sayfa boş kalıyordu).
import { bugun as bugunFn, tarihAyikla, gunEkle, tarihYaz } from './tarih.js';
import { aylikIzgara, tumOdemeler, odemeDurumu, gecikmisler as gecikmislerFn } from './takvim.js';
import { analizEt } from './yorgunluk.js';
import { tasarrufToplami, yeniTakvim, SENARYO_ETIKET } from './senaryo.js';
import { donut, barGrafik, lejant } from './grafik.js';
import { kategoriRenk } from './demo.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

export let seciliGun = null;
export function seciliGunAyarla(iso) { seciliGun = iso; }
let yaklasanGun = 7;
export function yaklasanGunAyarla(n) { yaklasanGun = n; }

const SIKLIK_AD = { haftalik: 'Haftalık', aylik: 'Aylık', '3aylik': '3 Aylık', yillik: 'Yıllık' };

/* ---------------- OZET ---------------- */
function ozetKart(etiket, degerHtml, altHtml, serit, tiklanir = false, dataAttr = '') {
  return `<div class="ozet-kart ${tiklanir ? 'tiklanir' : ''}" style="--serit:${serit}" ${dataAttr}>
    <span class="ozet-etiket">${etiket}</span>
    <div class="ozet-deger ${degerHtml.length > 16 ? 'kucuk' : ''}">${degerHtml}</div>
    <div class="ozet-alt">${altHtml}</div>
  </div>`;
}

// NUMEX-DÜZELTME (2026-11-20): Grup değerleri düz sayı olduğunda filtre `v.aylik > 0.005` bakıp undefined karşılaştırıyordu → tüm para birimleri eleniyor, kart ₺0,00 gösteriyordu. alan verilirse nesne, verilmezse sayı kabul edecek şekilde düzeltildi.
function cokPara(grup, alan = null) {
  const entries = Object.entries(grup || {})
    .map(([p, v]) => [p, typeof v === 'number' ? v : (v && alan ? v[alan] : 0)])
    .filter(([, v]) => v > 0.005);
  if (!entries.length) return '<span class="ozet-yigin"><span>₺0,00</span></span>';
  return `<span class="ozet-yigin">${entries.map(([p, v]) =>
    `<span>${kacis(para(v, p))}</span>`).join('')}</span>`;
}

export function renderOzet(state) {
  const kap = $('#ozet-izgara');
  if (!kap) return;
  const b = bugunFn();
  const o = H.ozet(state, b);
  const d = o.gecenAyaGoreDegisim;
  const degisimSinif = d.yuzde === null ? 'notr' : d.yuzde > 0 ? 'poz' : d.yuzde < 0 ? 'neg' : 'notr';
  const degisimMetin = d.yuzde === null ? 'Karşılaştırma yok'
    : `${d.yuzde > 0 ? '▲' : d.yuzde < 0 ? '▼' : '—'} ${yuzde(d.yuzde)} geçen aya göre`;

  const html = [
    ozetKart('Aylık düzenli yük', cokPara(o.aylikToplam, 'aylik'),
      `<span class="${degisimSinif}">${degisimMetin}</span>`, 'var(--vurgu-turkuaz)'),
    ozetKart('Önümüzdeki 30 gün', cokPara(o.otuzGunOdemeleri),
      `<span>${o.otuzGunOdemeleri ? 'Gerçek takvim tarihleri' : 'Kayıt yok'}</span>`, 'var(--vurgu-amber)'),
    ozetKart('Yıllık tahmini yük', cokPara(o.yillikToplam),
      `<span>12 aylık projeksiyon</span>`, 'var(--vurgu-yesil)'),
    ozetKart('Aktif abonelik', `<span>${o.aktifSayi}</span>`,
      `<span>${o.toplamSayi} kayıt · ${o.iptalSayi} iptal</span>`, '#a78bfa'),
    ozetKart('Kullanılmayan maliyet', cokPara(o.kullanilmayanMaliyet),
      `<span>30+ gündür kullanım yok · aylık</span>`, 'var(--tehlike)'),
    ozetKart('Geçen aya göre değişim', `<span class="${degisimSinif}">${d.yuzde === null ? '—' : yuzde(d.yuzde)}</span>`,
      `<span>${kacis(para(d.onceki, o.anaParaBirimi))} → ${kacis(para(d.onceki + d.mutlak, o.anaParaBirimi))}</span>`, 'var(--vurgu-turkuaz)',
      true, 'data-action="sekme-git" data-sekme="liste"')
  ].join('');
  kap.innerHTML = html;
}

/* ---------------- GRAFİKLER ---------------- */
export function renderGrafikler(state) {
  const b = bugunFn();
  const aktif = (state.abonelikler || []).filter(H.senaryoDahil);
  const anaPara = H.ozet(state, b).anaParaBirimi;

  // Kategori dağılımı (ana para birimi + diğerleri ayrı satır)
  const grup = {};
  for (const a of aktif) {
    if ((a.paraBirimi || 'TRY') !== anaPara) continue;
    grup[a.kategori] = (grup[a.kategori] || 0) + H.aylikTutar(a);
  }
  const veri = Object.entries(grup)
    .map(([ad, deger]) => ({ ad, deger, renk: kategoriRenk(ad), para: anaPara }))
    .sort((x, y) => y.deger - x.deger);

  const diger = {};
  for (const a of aktif) {
    const p = a.paraBirimi || 'TRY';
    if (p === anaPara) continue;
    diger[p] = (diger[p] || 0) + H.aylikTutar(a);
  }
  const digerNot = Object.keys(diger).length
    ? ` · Ayrı gösterim: ${Object.entries(diger).map(([p, v]) => para(v, p)).join(' · ')}`
    : '';
  const alt = $('#donut-alt');
  if (alt) alt.textContent = `Bu ay · ${anaPara} bazında${digerNot}`;

  const donutKap = $('#donut-kap');
  if (donutKap) donutKap.innerHTML = donut(veri, 190);
  const lejantKap = $('#donut-lejant');
  if (lejantKap) {
    lejantKap.innerHTML = veri.length
      ? lejant(veri.map(v => ({ ...v, metin: para(v.deger, anaPara) })), anaPara)
      : `<li class="ipucu">Kayıt yok — "Abonelik Ekle" ile başlayın.</li>`;
  }

  // 12 aylık nakit akışı (gerçek ödeme aylarına göre)
  const seri = [];
  for (let i = -5; i <= 6; i++) {
    const toplamAy = b.getFullYear() * 12 + b.getMonth() + i;
    const yil = Math.floor(toplamAy / 12), ay0 = ((toplamAy % 12) + 12) % 12;
    const ilk = new Date(yil, ay0, 1, 12);
    const son = new Date(yil, ay0 + 1, 0, 12);
    const toplam = tumOdemeler(state, ilk, son)
      .filter(k => k.paraBirimi === anaPara).reduce((s, k) => s + k.tutar, 0);
    seri.push({ ay: `${ayAdi(ay0)} ${String(yil).slice(2)}`, ayKisa: ayAdi(ay0), deger: toplam, para: anaPara });
  }
  const barKap = $('#bar-kap');
  if (barKap) barKap.innerHTML = barGrafik(seri, { yukseklik: 180, vurgu: 5 });
}

/* ---------------- YAKLAŞAN / GECİKMİŞ ---------------- */
function odemeSatiri(k, b, { onay = true } = {}) {
  const durum = odemeDurumu(k, b);
  const d = tarihAyikla(k.tarih);
  const gunMetin = d ? (() => {
    const f = Math.round((d - b) / 86400000);
    if (f === 0) return 'bugün';
    if (f === 1) return 'yarın';
    if (f > 0) return `${f} gün sonra`;
    return `${Math.abs(f)} gün gecikti`;
  })() : '';
  return `<li class="odeme-satir ${durum}">
    <div class="odeme-tarih-kutu"><b>${d ? d.getDate() : '—'}</b><span>${d ? ayAdi(d.getMonth()) : ''}</span></div>
    <div class="odeme-bilgi">
      <strong>${kacis(k.hizmetAdi)}</strong>
      <small>
        <span class="kategori-nokta" style="background:${kategoriRenk(k.kategori)}"></span>${kacis(k.kategori)}
        · ${kacis(gunMetin)}
        ${k.otomatikYenileme ? '<span class="rozet otomatik">oto</span>' : ''}
        <span class="rozet ${durum}">${durum === 'odendi' ? 'ödendi' : durum === 'gecikmis' ? 'gecikmiş' : 'bekliyor'}</span>
      </small>
    </div>
    <div class="odeme-sag">
      <span class="odeme-tutar ${k.odendi ? 'odendi-tutar' : ''}">${kacis(para(k.tutar, k.paraBirimi))}</span>
      ${onay ? `<button class="kutu-onay ${k.odendi ? 'isaretli' : ''}" data-action="odeme-odendi"
        data-abonelik="${kacis(k.abonelikId)}" data-tarih="${kacis(k.tarih)}"
        aria-label="${k.odendi ? 'Ödendi işaretini kaldır' : 'Ödendi olarak işaretle'}"
        title="${k.odendi ? 'Ödendi işaretini kaldır' : 'Ödendi olarak işaretle'}">✓</button>` : ''}
    </div>
  </li>`;
}

function listeRender(kap, kalemler, b, bosMesaj, onay = true) {
  if (!kap) return;
  if (!kalemler.length) {
    kap.innerHTML = `<li class="bos-durum">${bosMesaj}</li>`;
    return;
  }
  kap.innerHTML = kalemler.map(k => odemeSatiri(k, b, { onay })).join('');
}

export function renderYaklasan(state) {
  const b = bugunFn();
  const hepsi = tumOdemeler(state, b, gunEkle(b, yaklasanGun)).filter(k => k.tarih >= tarihYaz(b));
  listeRender($('#yaklasan-liste'), hepsi, b,
    `Önümüzdeki ${yaklasanGun} günde planlı ödeme yok.`);
  const gecikmis = gecikmislerFn(state, b);
  listeRender($('#gecikmis-liste'), gecikmis, b,
    'Gecikmiş kalem yok — hepsi yolunda.');
  const alt = $('#gecikmis-alt');
  if (alt) alt.textContent = gecikmis.length ? `${gecikmis.length} kalem ödenmedi` : '';
}

export function renderMiniTakvim(state) {
  const b = bugunFn();
  const kap = $('#mini-takvim');
  if (!kap) return;
  const { haftalar, baslikGunler } = aylikIzgara(state.takvimAy.yil, state.takvimAy.ay0, state);
  kap.innerHTML = `<div class="takvim-gunler">${baslikGunler.map(g => `<div class="takvim-gun-ad">${g}</div>`).join('')}</div>
    ${haftalar.map(h => `<div class="takvim-hafta">${h.map(c => hucre(c, b)).join('')}</div>`).join('')}`;
}

function hucre(c, b, mini = false) {
  if (!c) return '<div class="takvim-hucre bos"></div>';
  const bugunIso = tarihYaz(b);
  const siniflar = ['takvim-hucre'];
  if (c.iso === bugunIso) siniflar.push('bugun');
  if (seciliGun === c.iso) siniflar.push('secili');
  if (c.iso < bugunIso) siniflar.push('gecmis-gun');
  const gosterilecek = mini ? c.odemeler.slice(0, 1) : c.odemeler.slice(0, 3);
  const icler = gosterilecek.map(k => {
    const durum = odemeDurumu(k, b);
    return `<div class="takvim-mini-odeme ${durum}" title="${kacis(k.hizmetAdi)} — ${kacis(para(k.tutar, k.paraBirimi))}">
      ${kacis(k.hizmetAdi.length > 14 ? k.hizmetAdi.slice(0, 13) + '…' : k.hizmetAdi)}</div>`;
  }).join('');
  const noktalar = c.odemeler.length
    ? `<div class="noktalar">${c.odemeler.slice(0, 4).map(k => `<span class="nokta ${odemeDurumu(k, b)}"></span>`).join('')}</div>` : '';
  const daha = c.odemeler.length > gosterilecek.length ? `<div class="takvim-daha">+${c.odemeler.length - gosterilecek.length}</div>` : '';
  return `<div class="${siniflar.join(' ')}" data-action="gun-sec" data-iso="${c.iso}" role="button" tabindex="0"
    aria-label="${c.iso}, ${c.odemeler.length} ödeme">
    <span class="takvim-gun-no">${c.gun}</span>${noktalar}${icler}${daha}</div>`;
}

export function renderTakvim(state) {
  const b = bugunFn();
  const { haftalar, baslikGunler } = aylikIzgara(state.takvimAy.yil, state.takvimAy.ay0, state);
  const bas = $('#takvim-ay-baslik');
  if (bas) bas.textContent = `${ayAdi(state.takvimAy.ay0, true)} ${state.takvimAy.yil}`;

  const izgara = $('#takvim-izgara');
  if (izgara) {
    izgara.innerHTML = `<div class="takvim-gunler">${baslikGunler.map(g => `<div class="takvim-gun-ad">${g}</div>`).join('')}</div>
      ${haftalar.map(h => `<div class="takvim-hafta">${h.map(c => hucre(c, b)).join('')}</div>`).join('')}`;
  }

  const ilk = new Date(state.takvimAy.yil, state.takvimAy.ay0, 1, 12);
  const son = new Date(state.takvimAy.yil, state.takvimAy.ay0 + 1, 0, 12);
  const kalemler = tumOdemeler(state, ilk, son);
  const toplamlar = {};
  let odenen = 0, kalan = 0;
  for (const k of kalemler) {
    toplamlar[k.paraBirimi] = (toplamlar[k.paraBirimi] || 0) + k.tutar;
    if (k.odendi) odenen++; else kalan++;
  }
  const oz = $('#takvim-ozet');
  if (oz) {
    oz.innerHTML = `<span>Bu ay: <b>${Object.entries(toplamlar).map(([p, v]) => para(v, p)).join(' · ') || para(0)}</b></span>
      <span>Ödendi: <b>${odenen}</b></span><span>Bekleyen: <b>${kalan}</b></span>`;
  }

  // Gün detayı
  const gd = $('#gun-detay');
  const gb = $('#secili-gun-baslik');
  if (seciliGun) {
    const g = tarihAyikla(seciliGun);
    if (gb) gb.textContent = tarih(seciliGun);
    const oGun = tumOdemeler(state, g, g);
    if (gd) {
      if (!oGun.length) {
        gd.innerHTML = '<li class="bos-durum">Bu günde ödeme yok.</li>';
      } else {
        gd.innerHTML = oGun.map(k => odemeSatiri(k, b)).join('');
      }
    }
  } else {
    if (gb) gb.textContent = 'Gün detayı';
    if (gd) gd.innerHTML = '<li class="bos-durum">Takvimden bir güne tıklayın.</li>';
  }

  const otuz = tumOdemeler(state, b, gunEkle(b, 30)).filter(k => k.tarih >= tarihYaz(b));
  listeRender($('#otuz-liste'), otuz, b, 'Önümüzdeki 30 günde ödeme yok.');
  const oa = $('#otuz-alt');
  if (oa) {
    const t = {};
    for (const k of otuz) t[k.paraBirimi] = (t[k.paraBirimi] || 0) + k.tutar;
    oa.textContent = Object.entries(t).map(([p, v]) => para(v, p)).join(' · ') || '—';
  }
}

/* ---------------- LİSTE ---------------- */
export function uygulaFiltre(state, filtre) {
  const f = filtre || state.filtre;
  const arama = (f.arama || '').toLocaleLowerCase('tr-TR');
  let liste = (state.abonelikler || []).filter(a => {
    if (f.kategori && f.kategori !== 'hepsi' && a.kategori !== f.kategori) return false;
    if (f.durum && f.durum !== 'hepsi' && a.durum !== f.durum) return false;
    if (f.paraBirimi && f.paraBirimi !== 'hepsi' && a.paraBirimi !== f.paraBirimi) return false;
    if (f.yalnizZorunlu && !a.zorunlu) return false;
    if (arama) {
      const metin = `${a.hizmetAdi} ${a.kategori} ${a.not || ''} ${a.id}`.toLocaleLowerCase('tr-TR');
      if (!metin.includes(arama)) return false;
    }
    return true;
  });
  const s = f.siralama || 'yillik-azalan';
  if (s === 'yillik-azalan') liste.sort((a, b) => H.yillikTutar(b) - H.yillikTutar(a));
  else if (s === 'yillik-artan') liste.sort((a, b) => H.yillikTutar(a) - H.yillikTutar(b));
  else if (s === 'ad') liste.sort((a, b) => a.hizmetAdi.localeCompare(b.hizmetAdi, 'tr'));
  else if (s === 'tarih') liste.sort((a, b) => (a.sonOdemeTarihi || '').localeCompare(b.sonOdemeTarihi || ''));
  return liste;
}

export function renderListe(state) {
  const liste = uygulaFiltre(state, state.filtre);
  const b = bugunFn();
  const govde = $('#abonelik-govde');
  const kartlar = $('#abonelik-kartlar');
  const sayac = $('#liste-sayaci');

  if (sayac) {
    const toplam = (state.abonelikler || []).length;
    sayac.textContent = `${liste.length} / ${toplam} kayıt gösteriliyor`;
  }

  if (!liste.length) {
    const bos = `<div class="bos-durum" style="grid-column:1/-1">
      <strong>${(state.abonelikler || []).length ? 'Filtreye uyan kayıt yok' : 'Henüz kayıt yok'}</strong>
      <span>${(state.abonelikler || []).length ? 'Filtreleri temizleyip yeniden deneyin.' : '“Abonelik Ekle” ile ilk düzenli ödemenizi ekleyin ya da demo veriyi yükleyin.'}</span>
    </div>`;
    if (govde) govde.innerHTML = `<tr><td colspan="8">${bos}</td></tr>`;
    if (kartlar) kartlar.innerHTML = bos;
    return;
  }

  if (govde) {
    govde.innerHTML = liste.map(a => {
      const durumRozet = a.durum === 'iptal'
        ? '<span class="rozet iptal">iptal</span>'
        : '<span class="rozet aktif">aktif</span>';
      const yakinlik = a.sonOdemeTarihi
        ? `${tarih(a.sonOdemeTarihi)}<br><small class="ipucu">${SIKLIK_AD[a.siklik] || ''}</small>` : '—';
      return `<tr>
        <td>
          <span class="hizmet-ad">${kacis(a.hizmetAdi)}</span>
          ${a.not ? `<span class="hizmet-not" title="${kacis(a.not)}">${kacis(a.not)}</span>` : ''}
        </td>
        <td><span class="kategori-nokta" style="background:${kategoriRenk(a.kategori)}"></span>${kacis(a.kategori)}${
          a.zorunlu ? ' <span class="rozet zorunlu">zorunlu</span>' : ''}</td>
        <td class="sag sayi">${kacis(para(a.tutar, a.paraBirimi))}</td>
        <td class="sag sayi">${kacis(para(H.aylikTutar(a), a.paraBirimi))}</td>
        <td class="sag sayi"><b>${kacis(para(H.yillikTutar(a), a.paraBirimi))}</b></td>
        <td>${yakinlik}</td>
        <td>${durumRozet}</td>
        <td class="sag">
          <button class="btn btn-kucuk" data-action="abonelik-duzenle" data-id="${kacis(a.id)}">Düzenle</button>
          <button class="btn btn-kucuk btn-sil" data-action="abonelik-sil" data-id="${kacis(a.id)}" title="Sil">✕</button>
        </td>
      </tr>`;
    }).join('');
  }

  if (kartlar) {
    kartlar.innerHTML = liste.map(a => `<div class="mobil-kart">
      <div class="ust">
        <div>
          <div class="ad">${kacis(a.hizmetAdi)}</div>
          <div class="ipucu"><span class="kategori-nokta" style="background:${kategoriRenk(a.kategori)}"></span>${kacis(a.kategori)} · ${SIKLIK_AD[a.siklik] || ''}</div>
        </div>
        <div class="fiyat">${kacis(para(a.tutar, a.paraBirimi))}<small>yılda ${kacis(kisaPara(H.yillikTutar(a), a.paraBirimi))}</small></div>
      </div>
      <div class="alt">
        <span>${a.sonOdemeTarihi ? tarih(a.sonOdemeTarihi) : '—'}</span>
        <span>
          ${a.durum === 'iptal' ? '<span class="rozet iptal">iptal</span>' : '<span class="rozet aktif">aktif</span>'}
          ${a.zorunlu ? '<span class="rozet zorunlu">zorunlu</span>' : ''}
        </span>
      </div>
      <div class="alt">
        <button class="btn btn-kucuk" data-action="abonelik-duzenle" data-id="${kacis(a.id)}">Düzenle</button>
        <button class="btn btn-kucuk btn-sil" data-action="abonelik-sil" data-id="${kacis(a.id)}">Sil</button>
      </div>
    </div>`).join('');
  }
}

/* ---------------- ANALİZ ---------------- */
export function renderAnaliz(state) {
  const b = bugunFn();
  const sonuc = analizEt(state, b);
  const notKap = $('#karar-notu');
  if (notKap) {
    notKap.innerHTML = `<span aria-hidden="true">⚖️</span><p>${kacis(sonuc.kararNotu)}</p>`;
  }
  const kap = $('#analiz-kap');
  if (kap) {
    if (!sonuc.uyarilar.length) {
      kap.innerHTML = `<div class="bos-durum" style="grid-column:1/-1">
        <strong>Şu an dikkat çeken bir başlık yok</strong>
        <span>Kullanım tarihlerini güncel tutarsanız analiz daha isabetli olur.</span>
      </div>`;
    } else {
      kap.innerHTML = sonuc.uyarilar.map(u => `
        <div class="analiz-kart seviye-${u.seviye}">
          <h3><span class="rozet ${u.seviye === 'uyari' ? 'bekliyor' : 'zorunlu'}">${u.seviye === 'uyari' ? 'bakın' : 'bilgi'}</span> ${kacis(u.baslik)}</h3>
          <p class="gerekce">${kacis(u.gerekce)}</p>
          <p class="analiz-etki">Aylık etki: ${kacis(para(u.etkiTutar, u.para || 'TRY'))}</p>
          <button class="btn btn-kucuk" data-action="analiz-filtre" data-ids="${kacis(u.abonelikIdler.join(','))}">
            İlgili ${u.abonelikIdler.length} kaydı listede göster
          </button>
        </div>`).join('');
    }
  }

  // Kurlar
  const kurKap = $('#kur-izgara');
  if (kurKap) {
    kurKap.innerHTML = ['USD', 'EUR'].map(kod => `
      <div class="alan">
        <label for="kur-${kod}">1 ${kod} = ? TRY</label>
        <input type="number" id="kur-${kod}" min="0" step="0.0001" placeholder="tanımsız"
          value="${state.kurlar[kod] ?? ''}" data-kur="${kod}">
      </div>`).join('');
  }
  const kurSonuc = $('#kur-sonuc');
  if (kurSonuc) {
    const o = H.ozet(state, b);
    const cevrim = H.cevrilebilirToplam(o.yillikToplam, state.kurlar, 'yillik');
    const parcalar = Object.entries(o.yillikToplam).map(([p, v]) => `${p}: ${para(v, p)}`);
    kurSonuc.textContent = `${parcalar.join('  ·  ')}` +
      (cevrim.cevrilemeyen.length
        ? `  —  ${cevrim.cevrilemeyen.join(', ')} kuru tanımlanmadığı için toplanmadı.`
        : `  —  Girdiğiniz kurlarla yaklaşık ${para(cevrim.toplam)}/yıl (yalnız bilgi amaçlı).`);
  }
}

/* ---------------- SENARYO ---------------- */
export function renderSenaryo(state) {
  const b = bugunFn();
  const t = tasarrufToplami(state, b);

  const ozetKap = $('#senaryo-ozet');
  if (ozetKap) {
    const aylikToplamlar = Object.entries(t.aylik).filter(([, v]) => v > 0.005);
    const yillikToplamlar = Object.entries(t.yillik).filter(([, v]) => v > 0.005);
    ozetKap.innerHTML = `
      <div class="senaryo-kart kazanc">
        <span class="etiket">Aylık tahmini tasarruf</span>
        <span class="deger">${aylikToplamlar.length ? aylikToplamlar.map(([p, v]) => para(v, p)).join(' + ') : para(0)}</span>
        <span class="ipucu">Simülasyon toplamı</span>
      </div>
      <div class="senaryo-kart kazanc">
        <span class="etiket">12 aylık tahmini tasarruf</span>
        <span class="deger">${yillikToplamlar.length ? yillikToplamlar.map(([p, v]) => para(v, p)).join(' + ') : para(0)}</span>
        <span class="ipucu">Seçimleriniz 12 ay sürerse</span>
      </div>
      <div class="senaryo-kart">
        <span class="etiket">Değişen kalem</span>
        <span class="deger">${t.kalemler.length}</span>
        <span class="ipucu">İptal + ucuz paket seçilenler</span>
      </div>`;
  }

  const listeKap = $('#senaryo-liste');
  if (listeKap) {
    const aktif = (state.abonelikler || []).filter(a => a.durum !== 'iptal');
    if (!aktif.length) {
      listeKap.innerHTML = '<div class="bos-durum"><strong>Aktif abonelik yok</strong><span>Senaryo kurmak için önce kayıt ekleyin.</span></div>';
    } else {
      listeKap.innerHTML = aktif.map(a => `
        <div class="senaryo-satir">
          <div>
            <div class="ad">${kacis(a.hizmetAdi)}</div>
            <div class="meta">${kacis(a.kategori)} · ${kacis(para(a.tutar, a.paraBirimi))} ${SIKLIK_AD[a.siklik] || ''}
              · aylık ${kacis(para(H.aylikTutar(a), a.paraBirimi))}</div>
          </div>
          <div class="senaryo-secim" role="radiogroup" aria-label="${kacis(a.hizmetAdi)} kararı">
            ${Object.entries(SENARYO_ETIKET).map(([kod, etiket]) => `
              <label>
                <input type="radio" name="sen_${kacis(a.id)}" value="${kod}"
                  data-action="senaryo-sec" data-id="${kacis(a.id)}"
                  ${a.senaryo === kod ? 'checked' : ''}>
                ${etiket}
              </label>`).join('')}
          </div>
        </div>`).join('');
    }
  }

  const takvimKap = $('#senaryo-takvim');
  const kalemler = yeniTakvim(state, b, 30);
  listeRender(takvimKap, kalemler.map(k => ({ ...k, abonelikId: k.abonelikId })), b,
    'Bu senaryoda önümüzdeki 30 günde ödeme kalmadı.', false);
}

/* ---------------- UYARI ---------------- */
let toastZaman = null;
export function renderUyari(mesaj, tip = 'bilgi') {
  const kap = $('#toast-kap');
  if (!kap) return;
  const el = document.createElement('div');
  el.className = `toast ${tip}`;
  el.textContent = mesaj;
  kap.appendChild(el);
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .25s';
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

export function renderTumu(state) {
  renderOzet(state);
  renderGrafikler(state);
  renderYaklasan(state);
  renderMiniTakvim(state);
  renderTakvim(state);
  renderListe(state);
  renderAnaliz(state);
  renderSenaryo(state);
}
