// Numex — abonelik formu
import { KATEGORILER } from './demo.js';
import { abonelikEkle, abonelikGuncelle, durum, yayinla } from './state.js';
import { tarihYaz, bugun as bugunFn } from './tarih.js';
import { renderUyari } from './gorunum.js';

const $ = (s) => document.querySelector(s);

export function paraBirimiSecenekleri() {
  return [
    { kod: 'TRY', ad: 'Türk Lirası (₺)' },
    { kod: 'USD', ad: 'ABD Doları ($)' },
    { kod: 'EUR', ad: 'Euro (€)' },
    { kod: 'GBP', ad: 'Sterlin (£)' }
  ];
}

export function kategoriSecenekleri() { return KATEGORILER; }

export function siklikSecenekleri() {
  return [
    { kod: 'haftalik', ad: 'Haftalık' },
    { kod: 'aylik', ad: 'Aylık' },
    { kod: '3aylik', ad: '3 Aylık' },
    { kod: 'yillik', ad: 'Yıllık' }
  ];
}

let oncekiOdak = null;

export function formAc(abonelik = null) {
  const arka = $('#modal-arka');
  if (!arka) return;
  oncekiOdak = document.activeElement;

  // Seçenekleri doldur (bir kez)
  const kat = $('#f-kategori');
  if (kat && !kat.options.length) {
    kat.innerHTML = kategoriSecenekleri().map(k => `<option value="${k}">${k}</option>`).join('');
  }
  const paraSel = $('#f-para');
  if (paraSel && !paraSel.options.length) {
    paraSel.innerHTML = paraBirimiSecenekleri().map(p => `<option value="${p.kod}">${p.ad}</option>`).join('');
  }
  const sik = $('#f-siklik');
  if (sik && !sik.options.length) {
    sik.innerHTML = siklikSecenekleri().map(s => `<option value="${s.kod}">${s.ad}</option>`).join('');
  }

  $('#modal-baslik').textContent = abonelik ? 'Aboneliği düzenle' : 'Abonelik ekle';
  $('#f-id').value = abonelik ? abonelik.id : '';
  $('#f-ad').value = abonelik ? abonelik.hizmetAdi : '';
  $('#f-kategori').value = abonelik ? abonelik.kategori : 'Elektrik';
  $('#f-tutar').value = abonelik ? abonelik.tutar : '';
  $('#f-para').value = abonelik ? abonelik.paraBirimi : 'TRY';
  $('#f-siklik').value = abonelik ? abonelik.siklik : 'aylik';
  $('#f-tarih').value = abonelik ? abonelik.sonOdemeTarihi : tarihYaz(bugunFn());
  $('#f-kullanim').value = abonelik && abonelik.sonKullanimTarihi ? abonelik.sonKullanimTarihi : '';
  $('#f-otomatik').checked = abonelik ? !!abonelik.otomatikYenileme : true;
  $('#f-zorunlu').checked = abonelik ? !!abonelik.zorunlu : false;
  $('#f-iptal').checked = abonelik ? abonelik.durum === 'iptal' : false;
  $('#f-not').value = abonelik ? (abonelik.not || '') : '';

  ['h-ad', 'h-kategori', 'h-tutar', 'h-tarih'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = ''; });
  document.querySelectorAll('.alan.hatali').forEach(e => e.classList.remove('hatali'));
  $('#form-ipucu').textContent = '';

  arka.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const ilk = $('#f-ad'); if (ilk) ilk.focus(); }, 30);
}

export function formKapat() {
  const arka = $('#modal-arka');
  if (!arka) return;
  arka.hidden = true;
  document.body.style.overflow = '';
  if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
}

export function formDogrula(v) {
  const hatalar = {};
  if (!v.hizmetAdi || !String(v.hizmetAdi).trim()) hatalar.ad = 'Hizmet adı zorunlu.';
  if (!v.kategori) hatalar.kategori = 'Kategori seçin.';
  const t = Number(v.tutar);
  if (!isFinite(t) || t <= 0) hatalar.tutar = 'Tutar 0’dan büyük olmalı.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.sonOdemeTarihi || '')) hatalar.tarih = 'Geçerli bir tarih seçin.';
  if (!paraBirimiSecenekleri().some(p => p.kod === v.paraBirimi)) hatalar.para = 'Para birimi geçersiz.';
  if (!siklikSecenekleri().some(s => s.kod === v.siklik)) hatalar.siklik = 'Sıklık geçersiz.';
  return { gecerli: Object.keys(hatalar).length === 0, hatalar };
}

export function formGonder(veri) {
  const sonuc = formDogrula(veri);
  ['ad', 'tutar', 'tarih'].forEach(k => {
    const el = document.getElementById('h-' + k);
    if (el) el.textContent = sonuc.hatalar[k] || '';
    const alan = el ? el.closest('.alan') : null;
    if (alan) alan.classList.toggle('hatali', !!sonuc.hatalar[k]);
  });
  if (!sonuc.gecerli) return false;

  const kayit = {
    hizmetAdi: veri.hizmetAdi.trim().slice(0, 80),
    kategori: veri.kategori,
    tutar: Number(veri.tutar),
    paraBirimi: veri.paraBirimi,
    siklik: veri.siklik,
    sonOdemeTarihi: veri.sonOdemeTarihi,
    otomatikYenileme: !!veri.otomatikYenileme,
    sonKullanimTarihi: veri.sonKullanimTarihi || null,
    zorunlu: !!veri.zorunlu,
    not: (veri.not || '').slice(0, 200),
    durum: veri.durum
  };

  if (veri.id) {
    abonelikGuncelle(veri.id, kayit);
    renderUyari('Abonelik güncellendi.', 'basari');
  } else {
    abonelikEkle(kayit);
    renderUyari('Abonelik eklendi.', 'basari');
  }
  formKapat();
  return true;
}

export function formVerisiOku() {
  return {
    id: $('#f-id').value || null,
    hizmetAdi: $('#f-ad').value,
    kategori: $('#f-kategori').value,
    tutar: $('#f-tutar').value,
    paraBirimi: $('#f-para').value,
    siklik: $('#f-siklik').value,
    sonOdemeTarihi: $('#f-tarih').value,
    otomatikYenileme: $('#f-otomatik').checked,
    sonKullanimTarihi: $('#f-kullanim').value || null,
    zorunlu: $('#f-zorunlu').checked,
    not: $('#f-not').value,
    durum: $('#f-iptal').checked ? 'iptal' : 'aktif'
  };
}
