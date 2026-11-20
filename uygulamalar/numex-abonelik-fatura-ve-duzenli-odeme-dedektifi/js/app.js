// Numex — uygulama giriş noktası
import * as S from './state.js';
import * as H from './hesaplayici.js';
import * as G from './gorunum.js';
import { seriUret, bugun as bugunFn } from './tarih.js';
import { formAc, formKapat, formGonder, formVerisiOku } from './form.js';
import { jsonDis, jsonIc, csvDis } from './ice_disa.js';
import { demoVeriUret } from './demo.js';
import { tasarrufToplami } from './senaryo.js';

// döngüsel bağımlılık çözümü: hesaplayici'ye seri üreticisini bağla
H.seriBagla(seriUret);

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

let aktifSekme = 'panel';

function temaUygula() {
  document.documentElement.setAttribute('data-tema', S.durum().tema || 'koyu');
}

export function sekmeDegistir(ad) {
  aktifSekme = ad;
  $$('.sayfa').forEach(s => s.classList.toggle('aktif', s.id === `sayfa-${ad}`));
  $$('.sekme').forEach(b => {
    const aktif = b.dataset.sekme === ad;
    b.classList.toggle('aktif', aktif);
    b.setAttribute('aria-selected', aktif ? 'true' : 'false');
  });
  $$('.alt-sekme').forEach(b => b.classList.toggle('aktif', b.dataset.sekme === ad));
  S.degistir(d => { d.aktifSekme = ad; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function temaDegistir() {
  const yeni = (S.durum().tema === 'koyu') ? 'acik' : 'koyu';
  S.temaDegistir(yeni);
  temaUygula();
  G.renderUyari(yeni === 'acik' ? 'Açık tema açık.' : 'Koyu tema açık.');
}

export function filtreDegistir(alan, deger) {
  S.degistir(d => { d.filtre[alan] = deger; });
  G.renderListe(S.durum());
}

/* --------------- yardımcı --------------- */
function onayIste(mesaj) { return window.confirm(mesaj); }

export function tiklamaDevret(olay) {
  const hedef = olay.target.closest('[data-action]');
  if (!hedef) return;
  const action = hedef.dataset.action;

  switch (action) {
    case 'abonelik-ekle':
      formAc(null); break;

    case 'abonelik-duzenle': {
      const a = S.durum().abonelikler.find(x => x.id === hedef.dataset.id);
      if (a) formAc(a);
      break;
    }

    case 'abonelik-sil': {
      const a = S.durum().abonelikler.find(x => x.id === hedef.dataset.id);
      if (a && onayIste(`"${a.hizmetAdi}" kaydı silinsin mi? Bu işlem geri alınamaz.`)) {
        S.abonelikSil(a.id);
        G.renderUyari('Kayıt silindi.', 'basari');
      }
      break;
    }

    case 'odeme-odendi': {
      olay.preventDefault();
      const id = hedef.dataset.abonelik, tarih = hedef.dataset.tarih;
      const a = S.durum().abonelikler.find(x => x.id === id);
      if (!a) break;
      const yeni = !(a.odemeler && a.odemeler[tarih]);
      S.odemeDurumuDegistir(id, tarih, yeni);
      G.renderUyari(yeni ? 'Ödendi olarak işaretlendi.' : 'Ödendi işareti kaldırıldı.', 'basari');
      break;
    }

    case 'gun-sec': {
      G.seciliGunAyarla(hedef.dataset.iso);
      G.renderTakvim(S.durum());
      break;
    }

    case 'ay-geri':
    case 'ay-ileri': {
      S.degistir(d => {
        const t = d.takvimAy.yil * 12 + d.takvimAy.ay0 + (action === 'ay-geri' ? -1 : 1);
        d.takvimAy = { yil: Math.floor(t / 12), ay0: ((t % 12) + 12) % 12 };
      });
      break;
    }

    case 'ay-bugun': {
      const b = bugunFn();
      S.degistir(d => { d.takvimAy = { yil: b.getFullYear(), ay0: b.getMonth() }; });
      G.seciliGunAyarla(null);
      break;
    }

    case 'senaryo-sec': {
      const id = hedef.dataset.id, tip = hedef.value;
      if (!tip) break;
      S.degistir(d => {
        const a = d.abonelikler.find(x => x.id === id);
        if (a) a.senaryo = tip;
      });
      break;
    }

    case 'senaryo-sifirla':
      S.degistir(d => { for (const a of d.abonelikler) a.senaryo = 'koru'; });
      G.renderUyari('Senaryo sıfırlandı; tüm abonelikler korunuyor.', 'basari');
      break;

    case 'analiz-filtre': {
      const ids = (hedef.dataset.ids || '').split(',').filter(Boolean);
      const ilk = S.durum().abonelikler.find(a => ids.includes(a.id));
      S.degistir(d => { d.filtre = { ...d.filtre, arama: '', kategori: ilk ? ilk.kategori : 'hepsi', durum: 'hepsi', yalnizZorunlu: false }; d.aktifSekme = 'liste'; });
      setTimeout(() => { const k = $('#filtre-kategori'); if (k) k.value = ilk ? ilk.kategori : 'hepsi'; sekmeDegistir('liste'); }, 0);
      break;
    }

    case 'sekme-git':
      sekmeDegistir(hedef.dataset.sekme || 'panel');
      break;

    case 'tema-degistir':
      temaDegistir(); break;

    case 'form-kapat':
      formKapat(); break;

    case 'filtre-temizle': {
      S.degistir(d => { d.filtre = { arama: '', kategori: 'hepsi', durum: 'hepsi', paraBirimi: 'hepsi', yalnizZorunlu: false, siralama: 'yillik-azalan' }; });
      filtreAlanlariniDoldur();
      break;
    }

    case 'json-dis':
      jsonDis(S.durumOrnekle());
      G.renderUyari('JSON dosyası indirildi.', 'basari');
      break;

    case 'json-ic': {
      const girdi = $('#dosya-girdi');
      if (girdi) { girdi.value = ''; girdi.click(); }
      break;
    }

    case 'csv-dis':
      csvDis(S.durumOrnekle(), H);
      G.renderUyari('CSV raporu indirildi (Excel uyumlu).', 'basari');
      break;

    case 'demo-yukle':
      if (onayIste('Demo veri mevcut kayıtların yerine yüklenecek. Devam edilsin mi?')) {
        S.degistir(d => {
          d.abonelikler = demoVeriUret();
          d.demoYuklendi = true;
          d.filtre = { arama: '', kategori: 'hepsi', durum: 'hepsi', paraBirimi: 'hepsi', yalnizZorunlu: false, siralama: 'yillik-azalan' };
        });
        filtreAlanlariniDoldur();
        G.renderUyari('32 demo kayıt yüklendi.', 'basari');
      }
      break;

    case 'tumunu-sil':
      if (onayIste('TÜM kayıtlar silinecek. Bu işlem geri alınamaz. Emin misiniz?')) {
        S.degistir(d => { d.abonelikler = []; d.demoYuklendi = false; });
        G.renderUyari('Tüm kayıtlar silindi.', 'basari');
      }
      break;

    default: break;
  }
}

function filtreAlanlariniDoldur() {
  const st = S.durum();
  const kat = $('#filtre-kategori');
  if (kat) {
    const kategoriler = [...new Set([...st.abonelikler.map(a => a.kategori)])].sort((a, b) => a.localeCompare(b, 'tr'));
    kat.innerHTML = '<option value="hepsi">Tüm kategoriler</option>' +
      kategoriler.map(k => `<option value="${k}">${k}</option>`).join('');
    kat.value = st.filtre.kategori || 'hepsi';
  }
  const p = $('#filtre-para');
  if (p) {
    const paralar = [...new Set(st.abonelikler.map(a => a.paraBirimi))].sort();
    p.innerHTML = '<option value="hepsi">Tüm para birimleri</option>' +
      paralar.map(k => `<option value="${k}">${k}</option>`).join('');
    p.value = st.filtre.paraBirimi || 'hepsi';
  }
  const d = $('#filtre-durum'); if (d) d.value = st.filtre.durum || 'hepsi';
  const a = $('#filtre-arama'); if (a) a.value = st.filtre.arama || '';
  const z = $('#filtre-zorunlu'); if (z) z.checked = !!st.filtre.yalnizZorunlu;
  const s = $('#filtre-siralama'); if (s) s.value = st.filtre.siralama || 'yillik-azalan';
}

export function olaylariBagla() {
  document.addEventListener('click', tiklamaDevret);

  $$('.sekme, .alt-sekme').forEach(b => {
    b.addEventListener('click', () => sekmeDegistir(b.dataset.sekme));
  });

  $$('#yaklasan-cips .cip').forEach(c => {
    c.addEventListener('click', () => {
      $$('#yaklasan-cips .cip').forEach(x => x.classList.remove('aktif'));
      c.classList.add('aktif');
      G.yaklasanGunAyarla(Number(c.dataset.gun) || 7);
      G.renderYaklasan(S.durum());
    });
  });

  const form = $('#abonelik-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formGonder(formVerisiOku());
    });
  }

  const arka = $('#modal-arka');
  if (arka) arka.addEventListener('click', (e) => { if (e.target === arka) formKapat(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const acik = $('#modal-arka');
      if (acik && !acik.hidden) formKapat();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      sekmeDegistir('liste');
      const a = $('#filtre-arama');
      if (a) { a.focus(); a.select(); }
    }
  });

  const bagla = (sel, alan, olay = 'change', donustur = (v) => v) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener(olay, () => {
      if (olay === 'input') {
        clearTimeout(el._t);
        el._t = setTimeout(() => filtreDegistir(alan, donustur(el.value)), 140);
      } else {
        filtreDegistir(alan, donustur(el.value));
      }
    });
  };
  bagla('#filtre-arama', 'arama', 'input', v => v);
  bagla('#filtre-kategori', 'kategori');
  bagla('#filtre-durum', 'durum');
  bagla('#filtre-para', 'paraBirimi');
  bagla('#filtre-zorunlu', 'yalnizZorunlu', 'change', v => v.checked);
  bagla('#filtre-siralama', 'siralama');

  // kurlar
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el && el.dataset && el.dataset.kur) {
      S.kurlarGuncelle(el.dataset.kur, el.value);
    }
  });

  // dosya içe aktarma
  const girdi = $('#dosya-girdi');
  if (girdi) {
    girdi.addEventListener('change', async () => {
      const dosya = girdi.files && girdi.files[0];
      if (!dosya) return;
      try {
        const sonuc = await jsonIc(dosya);
        if (!sonuc.abonelikler.length) {
          G.renderUyari('Dosyada geçerli kayıt bulunamadı.' + (sonuc.hatali.length ? ` ${sonuc.hatali.length} kayıt atlandı.` : ''), 'hata');
          return;
        }
        const onay = onayIste(`${sonuc.abonelikler.length} kayıt bulundu. Mevcut kayıtların ÜZERİNE yazılsın mı?`);
        if (!onay) return;
        S.degistir(d => {
          d.abonelikler = sonuc.abonelikler;
          if (sonuc.kurlar) d.kurlar = { ...d.kurlar, ...sonuc.kurlar };
          if (sonuc.esikler) d.esikler = { ...d.esikler, ...sonuc.esikler };
        });
        filtreAlanlariniDoldur();
        G.renderUyari(`${sonuc.abonelikler.length} kayıt içe aktarıldı.` +
          (sonuc.hatali.length ? ` (${sonuc.hatali.length} hatalı kayıt atlandı)` : ''), 'basari');
      } catch (err) {
        G.renderUyari(err.message || 'Dosya okunamadı.', 'hata');
      }
    });
  }

  S.aboneOl((st) => {
    temaUygula();
    document.documentElement.setAttribute('data-tema', st.tema || 'koyu');
    G.renderTumu(st);
    // filtre select'lerini güncel tut
    const kat = $('#filtre-kategori');
    if (kat && !kat.options.length) filtreAlanlariniDoldur();
  });
}

export function baslat() {
  const st = S.durum();
  temaUygula();
  olaylariBagla();
  filtreAlanlariniDoldur();
  G.renderTumu(st);
  if (st.aktifSekme && st.aktifSekme !== 'panel') {
    $$('.sayfa').forEach(s => s.classList.toggle('aktif', s.id === `sayfa-${st.aktifSekme}`));
    $$('.sekme').forEach(b => b.classList.toggle('aktif', b.dataset.sekme === st.aktifSekme));
    $$('.alt-sekme').forEach(b => b.classList.toggle('aktif', b.dataset.sekme === st.aktifSekme));
  }
  if (st.demoYuklendi && st.abonelikler.length) {
    G.renderUyari(`${st.abonelikler.length} kayıt hazır. Veriler yalnız bu tarayıcıda tutulur.`, 'bilgi');
  }
  // test/denetim için
  window.NumexDedektif = { S, H, G };
}

baslat();
