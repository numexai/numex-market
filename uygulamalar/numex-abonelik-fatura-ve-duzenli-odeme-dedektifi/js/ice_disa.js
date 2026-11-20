// Numex — JSON dışa/içe aktarma + CSV raporu. Hiçbir veri sunucuya gönderilmez.
import { tarih, sayi } from './bicim.js';

// Yerel gün damgası (UTC kaymasını önler)
function yerelGun() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dosyaIndir(icerik, ad, mime = 'text/plain;charset=utf-8') {
  const blob = icerik instanceof Blob ? icerik : new Blob([icerik], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function jsonDis(durum) {
  const veri = { ...durum, disaAktarma: new Date().toISOString(), uygulama: 'Numex Ödeme Dedektifi' };
  dosyaIndir(JSON.stringify(veri, null, 2), `numex-odeme-dedektifi-${yerelGun()}.json`, 'application/json;charset=utf-8');
}

export function dosyaOku(dosya) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('Dosya okunamadı'));
    r.readAsText(dosya, 'utf-8');
  });
}

const GEREKLI = ['id', 'hizmetAdi', 'kategori', 'tutar', 'paraBirimi', 'siklik', 'sonOdemeTarihi'];

export async function jsonIc(dosya) {
  const metin = await dosyaOku(dosya);
  let p;
  try { p = JSON.parse(metin); } catch (e) { throw new Error('Geçersiz JSON dosyası.'); }
  if (!p || !Array.isArray(p.abonelikler)) throw new Error('Dosyada "abonelikler" dizisi yok.');
  const hatali = [];
  const temiz = p.abonelikler.filter((a, i) => {
    const eksik = GEREKLI.filter(k => a[k] === undefined || a[k] === null || a[k] === '');
    if (eksik.length) { hatali.push(`#${i + 1} eksik: ${eksik.join(', ')}`); return false; }
    return true;
  }).map(a => ({
    id: String(a.id),
    hizmetAdi: String(a.hizmetAdi),
    kategori: String(a.kategori),
    tutar: Number(a.tutar) || 0,
    paraBirimi: String(a.paraBirimi),
    siklik: ['haftalik', 'aylik', '3aylik', 'yillik'].includes(a.siklik) ? a.siklik : 'aylik',
    sonOdemeTarihi: String(a.sonOdemeTarihi).slice(0, 10),
    otomatikYenileme: a.otomatikYenileme !== false,
    sonKullanimTarihi: a.sonKullanimTarihi ? String(a.sonKullanimTarihi).slice(0, 10) : null,
    zorunlu: a.zorunlu === true,
    not: a.not ? String(a.not).slice(0, 200) : '',
    durum: a.durum === 'iptal' ? 'iptal' : 'aktif',
    senaryo: ['koru', 'iptal', 'ucuz_paket'].includes(a.senaryo) ? a.senaryo : 'koru',
    odemeler: a.odemeler && typeof a.odemeler === 'object' ? a.odemeler : {}
  }));
  return { abonelikler: temiz, hatali, kurlar: p.kurlar || null, esikler: p.esikler || null };
}

const BASLIKLAR = ['Hizmet Adı', 'Kategori', 'Tutar', 'Para Birimi', 'Sıklık', 'Son Ödeme Tarihi',
  'Aylık Karşılığı', 'Yıllık Karşılığı', 'Otomatik Yenileme', 'Son Kullanım', 'Zorunlu', 'Durum', 'Senaryo', 'Ödenen Kalem', 'Not'];

const SIKLIK_AD = { haftalik: 'Haftalık', aylik: 'Aylık', '3aylik': '3 Aylık', yillik: 'Yıllık' };
const SENARYO_AD = { koru: 'Korunuyor', iptal: 'İptal düşünülüyor', ucuz_paket: 'Ucuz paket' };

function hucre(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvUret(durum, hesaplayici) {
  const satirlar = [BASLIKLAR.join(';')];
  for (const a of durum.abonelikler || []) {
    const odemeSayisi = Object.keys(a.odemeler || {}).filter(k => a.odemeler[k]).length;
    satirlar.push([
      a.hizmetAdi, a.kategori, sayi(a.tutar, 2).replace(/\./g, ''), a.paraBirimi,
      SIKLIK_AD[a.siklik] || a.siklik, a.sonOdemeTarihi,
      sayi(hesaplayici.aylikTutar(a), 2).replace(/\./g, ''), sayi(hesaplayici.yillikTutar(a), 2).replace(/\./g, ''),
      a.otomatikYenileme ? 'Evet' : 'Hayır',
      a.sonKullanimTarihi || '', a.zorunlu ? 'Zorunlu' : 'İsteğe bağlı',
      a.durum === 'iptal' ? 'İptal' : 'Aktif',
      SENARYO_AD[a.senaryo] || 'Korunuyor', odemeSayisi, a.not || ''
    ].map(hucre).join(';'));
  }
  return '\uFEFF' + satirlar.join('\r\n');
}

export function csvDis(durum, hesaplayici) {
  dosyaIndir(csvUret(durum, hesaplayici), `numex-odeme-dedektifi-${yerelGun()}.csv`, 'text/csv;charset=utf-8');
}
