'use strict';
/* Numex Core — Operasyon Smart Factory / arayüz */

const $ = (sec) => document.querySelector(sec);
const el = (etiket, ozellik, ...cocuklar) => {
  const n = document.createElement(etiket);
  if (ozellik) {
    for (const [k, v] of Object.entries(ozellik)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
  }
  for (const c of cocuklar) if (c !== null && c !== undefined) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
};

const durumAdi = { kuyrukta: 'Kuyrukta', calisiyor: 'Çalışıyor', tamamlandi: 'Tamamlandı', iptal: 'İptal' };
const tipAdi = { giris: 'Hammadde girişi', cikis: 'Hammadde çıkışı', uretim: 'Üretim tamamlama', iptal: 'İptal' };

const para = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0) + ' TL';
const sayi = (n, hane = 0) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: hane, maximumFractionDigits: hane }).format(Number(n) || 0);
const saatG = (ms) =>
  new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const tarihSaat = (ms) =>
  new Date(ms).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const gunAdi = (ms) => new Date(ms).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });

let durum = null;
let uretimZamani = null; // sunucudan gelen simülasyon zamanı; her yenilemede senkronlanır
let sonTick = Date.now();
let aralik = null;
let planlaniyor = false;
let sonPlan = null; // form alanları değişince planı tazelemek için
let siparisGonderiliyor = false;

async function api(yol, govde) {
  const secenek = govde === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) };
  const yanit = await fetch('/api' + yol, secenek);
  let veri = null;
  try {
    veri = await yanit.json();
  } catch {
    throw new Error('Sunucu yanıtı okunamadı.');
  }
  if (!yanit.ok || !veri.ok) {
    const h = new Error(veri.hata || 'İşlem başarısız.');
    h.detay = veri.detay;
    h.kod = yanit.status;
    throw h;
  }
  return veri.veri;
}

function mesaj(metin, tur = 'uyari') {
  const s = $('#durumSeridi');
  s.className = 'durum-seridi aktif';
  s.replaceChildren(el('div', { class: 'mesaj ' + tur }, metin));
  clearTimeout(mesaj.zaman);
  mesaj.zaman = setTimeout(() => {
    s.className = 'durum-seridi';
    s.replaceChildren();
  }, 6500);
}

/* ---------------- Yükleme ---------------- */
async function yukle() {
  try {
    durum = await api('/durum');
    uretimZamani = durum.simZaman;
    sonTick = Date.now();
    ciz();
  } catch (e) {
    mesaj('Veriler yüklenemedi: ' + e.message, 'uyari');
  }
}

function ciz() {
  if (!durum) return;
  kpiCiz();
  emirleriCiz();
  makineleriCiz();
  stokCiz();
  takvimCiz();
  hareketCiz();
  urunSelectDoldur();
  $('#hizSec').value = String(durum.simAyar.hiz);
}

/* ---------------- KPI ---------------- */
function kpiCiz() {
  const o = durum.ozet.olcu;
  const kpiGrid = $('#kpiGrid');
  const kpi = (etiket, deger, alt, uyari = false) =>
    el('div', { class: 'kpi' + (uyari ? ' uyari' : '') }, el('span', { class: 'etiket' }, etiket), el('span', { class: 'deger' }, deger), el('span', { class: 'alt' }, alt));

  kpiGrid.replaceChildren(
    kpi('Aktif üretim emri', sayi(o.aktifEmir), `${sayi(o.calisanEmir)} çalışıyor · ${sayi(o.aktifEmir - o.calisanEmir)} kuyrukta`),
    kpi('Çalışan makine', `${sayi(durum.ozet.istasyonlar.filter((x) => x.calisiyor > 0).length)} / ${durum.ozet.istasyonlar.length}`, durum.ozet.istasyonlar.map((x) => x.ad).join(' · ')),
    kpi('Günlük üretim', `${sayi(o.gunlukUretim)} adet`, 'Tamamlanan emirlerden'),
    kpi('Kritik stok', sayi(o.kritikStok), o.kritikStok ? 'Minimum seviyede veya altında' : 'Tüm hammaddeler güvenli seviyede', o.kritikStok > 0),
    kpi('Toplam üretim maliyeti', para(o.toplamMaliyet), `${sayi(o.toplamSiparis)} sipariş üzerinden`),
    kpi('Tahmini kâr', para(o.tahminiKar), `Ciro ${para(o.toplamSatis)}`)
  );
}

/* ---------------- Emirler ---------------- */
function emirYuzde(e) {
  const t = e.adimlar.reduce((a, x) => a + x.planlananDk, 0);
  const c = e.adimlar.reduce((a, x) => a + (x.tamamlananDk || 0), 0);
  if (e.durum === 'tamamlandi') return 100;
  return t ? Math.round((c / t) * 100) : 0;
}

function emirleriCiz() {
  const ara = $('#emirAra').value.trim().toLowerCase();
  const filtre = $('#emirDurum').value;
  let liste = durum.emirler.filter((e) => {
    if (filtre === 'aktif' && !(e.durum === 'kuyrukta' || e.durum === 'calisiyor')) return false;
    if (filtre !== 'aktif' && filtre !== 'tumu' && e.durum !== filtre) return false;
    if (!ara) return true;
    return [e.id, e.siparisId, e.urunAd].some((x) => String(x).toLowerCase().includes(ara));
  });

  const kap = $('#emirListe');
  if (!liste.length) {
    kap.replaceChildren(
      el('div', { class: 'bos' }, el('b', null, 'Bu filtrede emir yok'), 'Sağdaki “Yeni sipariş” formundan sipariş oluşturun; emir otomatik kuyruğa girer.')
    );
    kap.style.maxHeight = 'none';
    return;
  }
  // Liste azken panelin boş alanı şişmesin; 3+ emirde kaydırma başlar
  kap.classList.toggle('az', liste.length <= 2);

  kap.replaceChildren(
    ...liste.map((e) => {
      const yuzde = emirYuzde(e);
      const bas = el('div', { class: 'emir-bas' },
        el('span', { class: 'kimlik' }, e.id),
        el('span', { class: 'urun' }, `${e.urunAd} × ${sayi(e.adet)}`),
        el('span', { class: 'meta' }, `${e.siparisId} · ${e.olusturmaSim ? 'planlandı ' + saatG(Math.round(e.olusturmaSim / durum.simAyar.hiz)) : ''}`),
        el('span', { class: 'sag' },
          el('span', { class: 'rozet-durum ' + e.durum }, durumAdi[e.durum]),
          e.durum === 'kuyrukta' ? el('button', { class: 'btn btn-kucuk btn-birincil', onclick: () => emriBaslat(e.id) }, 'Başlat') : null,
          (e.durum === 'kuyrukta' || e.durum === 'calisiyor')
            ? el('button', { class: 'btn btn-kucuk btn-tehlike', onclick: () => emriIptal(e.id) }, 'İptal')
            : null,
          e.durum === 'calisiyor' ? el('button', { class: 'btn btn-kucuk', onclick: () => emriIlerlet(e.id) }, 'Simülasyonda ilerlet') : null,
          el('button', { class: 'btn btn-kucuk btn-ghost', onclick: () => emirDetay(e) }, 'Detay')
        )
      );
      const kalanDk = e.adimlar.reduce((a, x) => a + Math.max(0, x.planlananDk - (x.tamamlananDk || 0)), 0);
      const tahminiBitis = e.durum === 'tamamlandi'
        ? 'Tamamlandı'
        : `${sayi(Math.ceil(kalanDk))} sim-dk kaldı`;
      const ilerleme = el('div', { class: 'ilerleme-sar' },
        el('div', { class: 'ilerleme' }, el('span', { style: `width:${yuzde}%` })),
        el('div', { class: 'satir' },
          el('span', null, 'Üretim ilerlemesi ', el('b', null, yuzde + '%')),
          el('span', null, 'Kalan ', el('b', null, tahminiBitis)),
          el('span', null, 'Maliyet ', el('b', null, para(e.toplamMaliyet ?? (e.birimMaliyet ?? 0) * e.adet)))
        )
      );
      const adimlar = el('div', { class: 'adimlar' },
        ...e.adimlar.map((a) => {
          const p = a.planlananDk ? Math.round(((a.tamamlananDk || 0) / a.planlananDk) * 100) : 0;
          return el('div', { class: 'adim ' + a.durum },
            el('div', { class: 'ad' }, el('span', null, a.istasyon), el('span', null, p + '%')),
            el('div', { class: 'bar' }, el('span', { style: `width:${p}%` }))
          );
        })
      );
      return el('div', { class: 'emir' }, bas, ilerleme, adimlar);
    })
  );
}

async function emriBaslat(id) {
  try {
    const r = await api(`/emir/${id}/baslat`, {});
    mesaj(`${id}: ${r.mesaj}`, 'ok');
  } catch (e) {
    mesaj(`${id} başlatılamadı — ${e.message}`, 'uyari');
  }
  await yukle();
}

async function emriIlerlet(id) {
  const e = durum.emirler.find((x) => x.id === id);
  if (!e) return;
  const t = e.adimlar.reduce((a, x) => a + x.planlananDk, 0);
  const c = e.adimlar.reduce((a, x) => a + (x.tamamlananDk || 0), 0);
  const yeni = Math.min(1, Math.round(((c + t * 0.25) / t) * 100) / 100);
  try {
    await api(`/emir/${id}/ilerlet`, { oran: yeni });
    mesaj(`${id}: %${Math.round(yeni * 100)} tamamlandı.`, 'bilgi');
  } catch (err) {
    mesaj(err.message, 'uyari');
  }
  await yukle();
}

async function emriIptal(id) {
  if (!confirm(`${id} iptal edilsin mi? Rezerve edilen hammaddeler serbest bırakılacak.`)) return;
  try {
    await api(`/emir/${id}/iptal`, { neden: 'Panelden iptal' });
    mesaj(`${id} iptal edildi, rezervasyonlar serbest bırakıldı.`, 'bilgi');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
  await yukle();
}

function emirDetay(e) {
  const satirlar = [];
  satirlar.push(el('h4', null, 'Zaman planı'));
  const tablo = el('table', { class: 'mini-tablo' },
    el('thead', null, el('tr', null, el('th', null, 'İstasyon'), el('th', { class: 'sayi' }, 'Plan (dk)'), el('th', { class: 'sayi' }, 'Tamamlanan'), el('th', null, 'Durum'))),
    el('tbody', null, ...e.adimlar.map((a) => el('tr', null,
      el('td', null, a.istasyon),
      el('td', { class: 'sayi' }, sayi(a.planlananDk)),
      el('td', { class: 'sayi' }, sayi(a.tamamlananDk || 0)),
      el('td', null, durumAdi[a.durum] || a.durum)
    )))
  );
  satirlar.push(tablo);
  satirlar.push(el('h4', null, 'Rezervasyon'));
  if (e.rezervasyon && e.rezervasyon.length) {
    satirlar.push(el('div', null, ...e.rezervasyon.map((r) => {
      const m = durum.stok.find((x) => x.id === r.malzemeId);
      return el('div', { class: 'plan-satir' }, el('span', null, m ? m.ad : r.malzemeId), el('b', null, sayi(r.miktar, 2) + ' ' + (m ? m.birim : '')));
    })));
  } else {
    satirlar.push(el('div', { class: 'ipucu' }, e.durum === 'iptal' ? 'İptal edildi — rezervasyon serbest bırakıldı.' : 'Rezervasyon yok (üretim tamamlandı).'));
  }
  satirlar.push(el('h4', null, 'Maliyet'));
  satirlar.push(
    el('div', { class: 'plan-satir' }, el('span', null, 'Malzeme'), el('b', null, para(e.malzemeMaliyeti))),
    el('div', { class: 'plan-satir' }, el('span', null, 'İşçilik'), el('b', null, para(e.iscilikMaliyeti))),
    el('div', { class: 'plan-satir' }, el('span', null, 'Toplam'), el('b', null, para(e.toplamMaliyet)))
  );
  modalAc(`${e.id} — ${e.urunAd} × ${sayi(e.adet)}`, satirlar);
}

/* ---------------- Makineler ---------------- */
function makineleriCiz() {
  const kap = $('#makineGrid');
  kap.replaceChildren(
    ...durum.ozet.istasyonlar.map((ist) => {
      const dolu = ist.calisiyor;
      const kanal = el('div', { class: 'kanal' });
      for (let i = 0; i < ist.kapasite; i++) kanal.append(el('i', { class: ist.calisiyorMu && dolu > i ? 'dolu' : '' }));
      const girdi = el('input', { type: 'number', min: '1', max: '20', value: ist.kapasite, 'aria-label': ist.ad + ' kapasitesi' });
      return el('div', { class: 'makine' },
        el('div', { class: 'bas' },
          el('strong', null, ist.ad),
          el('span', { class: 'lamba ' + (ist.calisiyorMu ? 'calisiyor' : 'bosta'), title: ist.calisiyorMu ? 'Çalışıyor' : 'Boşta' })
        ),
        kanal,
        el('div', { class: 'bilgi' }, el('span', null, `${sayi(dolu)} / ${sayi(ist.kapasite)} kanal çalışıyor`), el('span', null, `${sayi(ist.kuyrukta)} emir kuyrukta`)),
        el('div', { class: 'kapasite-form' },
          el('span', null, 'Kapasite'),
          girdi,
          el('button', { class: 'btn btn-kucuk btn-ghost', onclick: () => kapasiteKaydet(ist.id, girdi.value) }, 'Kaydet')
        )
      );
    })
  );
}

async function kapasiteKaydet(id, deger) {
  try {
    await api(`/istasyon/${id}/kapasite`, { kapasite: Number(deger) });
    mesaj('Kapasite güncellendi. Çalışan emirlerin zaman planı değişmedi.', 'ok');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
  await yukle();
}

/* ---------------- Stok ---------------- */
function stokCiz() {
  const ara = $('#stokAra').value.trim().toLowerCase();
  const sadece = $('#sadeceKritik').checked;
  const liste = durum.stok.filter((m) => {
    if (sadece && !m.kritik) return false;
    return !ara || m.ad.toLowerCase().includes(ara);
  });
  const tbody = $('#stokTablo tbody');
  if (!liste.length) {
    tbody.replaceChildren(el('tr', null, el('td', { colspan: '7' }, el('div', { class: 'bos' }, el('b', null, 'Eşleşen malzeme yok'), 'Filtreyi temizleyin ya da farklı bir arama yapın.'))));
    return;
  }
  tbody.replaceChildren(
    ...liste.map((m) => {
      // Miktar kutusu BOŞ başlar (girilmiş değer sanılmasın); fiyat kutusu gerçek fiyatı gösterir
      // Miktar kutusu boş başlar; fiyat kutusu mevcut fiyatı GERÇEK değer olarak taşır (placeholder değil)
      const miktarGirdi = el('input', { type: 'number', min: '0.1', step: '0.1', placeholder: 'adet', class: 'miktar-kutu', title: m.ad + ' için giriş/çıkış miktarı', 'aria-label': m.ad + ' giriş çıkış miktarı' });
      const fiyatGirdi = el('input', { type: 'number', min: '0', step: '0.5', value: m.birimFiyat, class: 'fiyat-kutu', title: 'Birim fiyat (TL) — değiştirip Fiyat düğmesine basın', 'aria-label': m.ad + ' birim fiyatı' });
      return el('tr', { class: m.kritik ? 'kritik' : '' },
        el('td', null, el('div', null, m.ad), el('span', { class: 'barkod' }, m.id + ' · ' + m.birim + (m.kritik ? ' · KRİTİK' : ''))),
        el('td', { class: 'sayi' }, sayi(m.stok, 2)),
        el('td', { class: 'sayi' }, sayi(m.rezerve, 2)),
        el('td', { class: 'sayi' + (m.kullanilabilir <= 0 ? ' az' : '') }, sayi(m.kullanilabilir, 2)),
        el('td', { class: 'sayi' }, sayi(m.min)),
        el('td', { class: 'sayi' }, para(m.birimFiyat)),
        el('td', null,
          el('div', { class: 'stok-islem' },
            miktarGirdi,
            el('button', { class: 'btn btn-kucuk btn-birincil', onclick: () => stokHareket(m.id, miktarGirdi.value, 'giris') }, 'Giriş'),
            el('button', { class: 'btn btn-kucuk btn-ghost', onclick: () => stokHareket(m.id, miktarGirdi.value, 'cikis') }, 'Çıkış'),
            el('span', { class: 'islem-ayrac' }, ''),
            fiyatGirdi,
            el('button', { class: 'btn btn-kucuk btn-ghost', title: 'Birim fiyatı kaydet', onclick: () => fiyatKaydet(m.id, fiyatGirdi.value) }, 'Fiyat')
          )
        )
      );
    })
  );
}

async function stokHareket(id, miktar, tip) {
  const m = Number(miktar);
  if (!Number.isFinite(m) || m <= 0) {
    mesaj('Geçerli bir miktar girin.', 'uyari');
    return;
  }
  try {
    if (tip === 'giris') await api('/stok/giris', { malzemeId: id, miktar: m, aciklama: 'Panelden hammadde girişi' });
    else await api('/stok/cikis', { malzemeId: id, miktar: m, aciklama: 'Panelden stok çıkışı' });
    mesaj(`${id} ${tip === 'giris' ? 'girişi' : 'çıkışı'} kaydedildi.`, 'ok');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
  await yukle();
}

async function fiyatKaydet(id, deger) {
  try {
    await api('/stok/fiyat', { malzemeId: id, birimFiyat: Number(deger) });
    mesaj(`${id} birim fiyatı güncellendi.`, 'ok');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
  await yukle();
}

/* ---------------- Takvim / hareketler ---------------- */
function takvimCiz() {
  const liste = durum.ozet.takvim;
  const max = Math.max(1, ...liste.map((g) => g.uretim));
  const bugun = new Date();
  const bugunBas = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate()).getTime();
  $('#takvim').replaceChildren(
    ...liste.map((g) =>
      el('div', { class: 'gun' + (g.gun === bugunBas ? ' bugun' : '') },
        el('span', { class: 'tarih' }, gunAdi(g.gun)),
        el('span', { class: 'adet' }, sayi(g.uretim)),
        el('div', { class: 'cubuk' }, el('span', { style: `width:${(g.uretim / max) * 100}%` }))
      )
    )
  );
}

function hareketCiz() {
  const filtre = $('#hareketFiltre').value;
  const liste = durum.hareketler.filter((h) => filtre === 'tumu' || h.tip === filtre);
  const tbody = $('#hareketTablo tbody');
  if (!liste.length) {
    tbody.replaceChildren(el('tr', null, el('td', { colspan: '5' }, el('div', { class: 'bos' }, el('b', null, 'Kayıt yok'), 'Stok giriş/çıkışı ve üretim tabloya buradan düşer.'))));
    return;
  }
  tbody.replaceChildren(
    ...liste.map((h) =>
      el('tr', null,
        el('td', null, h.id),
        el('td', null, tarihSaat(h.tarih)),
        el('td', null, tipAdi[h.tip] || h.tip),
        el('td', { class: 'sayi' }, h.malzemeId ? sayi(h.miktar, 2) : sayi(h.miktar)),
        el('td', null, h.aciklama)
      )
    )
  );
}

/* ---------------- Yeni sipariş ---------------- */
function urunSelectDoldur() {
  const sec = $('#urunSec');
  if (sec.options.length === durum.urunler.length) return;
  sec.replaceChildren(...durum.urunler.map((u) => el('option', { value: u.id }, `${u.ad} — ${para(u.birimFiyat)}`)));
}

function planCiz(p) {
  const kap = $('#planSonuc');
  if (!p) {
    kap.replaceChildren();
    return;
  }
  const uyari = p.stokYeterli
    ? el('div', { class: 'plan-uyari ok' }, `Stok yeterli — sipariş oluşturulabilir.`)
    : el('div', { class: 'plan-uyari' },
        el('b', null, 'Hammadde eksik: '),
        p.eksikler.map((x) => `${x.ad} → ${sayi(x.eksik, 2)} ${x.birim}`).join(' · '));

  const ihtiyacTablosu = el('table', { class: 'mini-tablo' },
    el('thead', null, el('tr', null, el('th', null, 'Malzeme'), el('th', { class: 'sayi' }, 'Gerek'), el('th', { class: 'sayi' }, 'Kullanılabilir'), el('th', { class: 'sayi' }, 'Maliyet'))),
    el('tbody', null, ...p.ihtiyaclar.map((i) => el('tr', null,
      el('td', null, i.ad),
      el('td', { class: 'sayi' }, sayi(i.gereken, 2)),
      el('td', { class: 'sayi' + (i.eksik ? ' az' : '') }, sayi(i.kullanilabilir, 2)),
      el('td', { class: 'sayi' }, para(i.maliyet))
    )))
  );

  const makineTablosu = el('table', { class: 'mini-tablo' },
    el('thead', null, el('tr', null, el('th', null, 'İstasyon'), el('th', { class: 'sayi' }, 'Süre'), el('th', { class: 'sayi' }, 'Başlangıç'))),
    el('tbody', null, ...p.makinePlan.map((m) => el('tr', null,
      el('td', null, `${m.istasyon} (${m.kapasite} kanal)`),
      el('td', { class: 'sayi' }, `${sayi(m.bitisSim - m.baslangicSim)} dk`),
      el('td', { class: 'sayi' }, saatG(Math.round(m.baslangicGercek)))
    )))
  );

  kap.replaceChildren(
    uyari,
    el('h4', null, 'Hammadde ihtiyacı'),
    ihtiyacTablosu,
    el('h4', null, 'Makine planı'),
    makineTablosu,
    el('h4', null, 'Maliyet'),
    el('div', { class: 'plan-satir' }, el('span', null, 'Malzeme'), el('b', null, para(p.malzemeMaliyeti))),
    el('div', { class: 'plan-satir' }, el('span', null, 'İşçilik'), el('b', null, para(p.iscilikMaliyeti))),
    el('div', { class: 'plan-satir' }, el('span', null, 'Toplam maliyet'), el('b', null, para(p.toplamMaliyet))),
    el('div', { class: 'plan-satir' }, el('span', null, 'Satış geliri'), el('b', null, para(p.satisGeliri))),
    el('div', { class: 'plan-satir' }, el('span', null, 'Tahmini kâr'), el('b', null, para(p.tahminiKar))),
    el('h4', null, 'Süre'),
    el('div', { class: 'plan-satir' }, el('span', null, 'Toplam parça süresi'), el('b', null, sayi(p.toplamParcaSuresiDk) + ' sim-dk')),
    el('div', { class: 'plan-satir' }, el('span', null, 'Takvimde kapladığı süre'), el('b', null, sayi(p.tahminiUretimDk) + ' sim-dk')),
    el('div', { class: 'plan-satir' }, el('span', null, 'Gerçek zamanda (sim hızına göre)'), el('b', null, Math.ceil(p.tahminiUretimDk / durum.simAyar.hiz) + ' sn'))
  );
}

async function planHesapla(sessiz) {
  const urunId = $('#urunSec').value;
  const adet = Number($('#adetGir').value);
  if (!urunId) return null;
  if (!Number.isInteger(adet) || adet <= 0) {
    if (!sessiz) mesaj('Adet pozitif tam sayı olmalı.', 'uyari');
    return null;
  }
  planlaniyor = true;
  try {
    const p = await api('/planla', { urunId, adet, musteri: $('#musteriGir').value.trim() });
    sonPlan = { urunId, adet, p };
    planCiz(p);
    return p;
  } catch (e) {
    if (!sessiz) mesaj(e.message, 'uyari');
    planCiz(null);
    sonPlan = null;
    return null;
  } finally {
    planlaniyor = false;
  }
}

async function siparisVer(olay) {
  olay.preventDefault();
  if (siparisGonderiliyor) return;
  const urunId = $('#urunSec').value;
  const adet = Number($('#adetGir').value);
  const musteri = $('#musteriGir').value.trim();
  if (!Number.isInteger(adet) || adet <= 0) {
    mesaj('Adet pozitif tam sayı olmalı.', 'uyari');
    return;
  }
  const dugme = $('#btnSiparis');
  siparisGonderiliyor = true;
  dugme.disabled = true;
  try {
    const r = await api('/siparis', { urunId, adet, musteri, yavas: true });
    mesaj(`${r.siparis.id} oluşturuldu → ${r.emir.id} kuyruğa alındı. Toplam maliyet ${para(r.siparis.toplamMaliyet)}.`, 'ok');
    planCiz(r.plan);
  } catch (e) {
    mesaj('Sipariş oluşturulamadı — ' + e.message, 'uyari');
    if (e.detay && e.detay.plan) planCiz(e.detay.plan);
  } finally {
    siparisGonderiliyor = false;
    dugme.disabled = false;
  }
  await yukle();
  await planHesapla(true); // plan kartı yeni rezervasyonları yansıtsın
}

/* ---------------- Modal ---------------- */
function modalAc(baslik, icerik, alt) {
  $('#modalBaslik').textContent = baslik;
  $('#modalGovde').replaceChildren(...(Array.isArray(icerik) ? icerik : [icerik]));
  $('#modalAlt').replaceChildren(...(alt || [el('button', { class: 'btn', onclick: modalKapat }, 'Kapat')]));
  $('#modal').hidden = false;
}
function modalKapat() {
  $('#modal').hidden = true;
}

/* ---------------- Simülasyon ---------------- */
function simuleEt() {
  if (!durum) return;
  const simdi = Date.now();
  uretimZamani += (simdi - sonTick) * durum.simAyar.hiz;
  sonTick = simdi;
  $('#simSaat').textContent = saatG(uretimZamani);
  $('#gercekSaat').textContent = saatG(simdi);
  $('#simHiz').textContent = durum.simAyar.hiz + '×';
  // Simülasyon zamanı = gerçek zaman × hız; emir ilerlemesi "Simülasyonda ilerlet" ile yapılır.
}

async function hizDegistir() {
  try {
    const v = await api('/sim', { hiz: Number($('#hizSec').value) });
    durum.simAyar.hiz = v.hiz;
    mesaj(`Simülasyon hızı ${v.hiz}×.`, 'bilgi');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
}

async function sifirla() {
  if (!confirm('Tüm sipariş, emir ve stok verisi başlangıç durumuna dönecek. Emin misiniz?')) return;
  try {
    await api('/sifirla', {});
    uretimZamani = null;
    await yukle();
    mesaj('Veri başlangıç durumuna döndürüldü.', 'bilgi');
  } catch (e) {
    mesaj(e.message, 'uyari');
  }
}

/* ---------------- Başlat ---------------- */
document.addEventListener('DOMContentLoaded', async () => {
  $('#btnPlanla').addEventListener('click', () => planHesapla(false));
  $('#siparisForm').addEventListener('submit', siparisVer);
  $('#urunSec').addEventListener('change', () => planHesapla(true));
  $('#adetGir').addEventListener('change', () => planHesapla(true));
  $('#emirAra').addEventListener('input', emirleriCiz);
  $('#emirDurum').addEventListener('change', emirleriCiz);
  $('#stokAra').addEventListener('input', stokCiz);
  $('#sadeceKritik').addEventListener('change', stokCiz);
  $('#hareketFiltre').addEventListener('change', hareketCiz);
  $('#hizSec').addEventListener('change', hizDegistir);
  $('#btnSifirla').addEventListener('click', sifirla);
  $('#modalKapat').addEventListener('click', modalKapat);
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') modalKapat();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modalKapat();
  });

  await yukle();
  await planHesapla(true);
  sonTick = Date.now();
  aralik = setInterval(simuleEt, 1000);
  simuleEt();
});
