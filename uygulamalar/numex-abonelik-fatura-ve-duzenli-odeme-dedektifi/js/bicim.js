// Numex — biçimlendirme yardımcıları (tr-TR)
const PARA_SEMBOL = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

export function para(deger, paraBirimi = 'TRY') {
  const n = Number(deger) || 0;
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: paraBirimi,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  } catch (e) {
    return `${n.toFixed(2)} ${PARA_SEMBOL[paraBirimi] || paraBirimi}`;
  }
}

export function sayi(deger, basamak = 0) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: basamak,
    maximumFractionDigits: basamak
  }).format(Number(deger) || 0);
}

export function kisaPara(deger, paraBirimi = 'TRY') {
  const n = Number(deger) || 0;
  const s = PARA_SEMBOL[paraBirimi] || paraBirimi;
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')} M${s}`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} B${s}`;
  return `${Math.round(n)}${s}`;
}

const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const AYLAR_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function tarih(iso) {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (isNaN(d)) return '—';
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

export function tarihKisa(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (isNaN(d)) return '—';
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`;
}

export function ayAdi(ay0, uzun = false) {
  return (uzun ? AYLAR_UZUN : AYLAR)[((ay0 % 12) + 12) % 12];
}

export function yuzde(deger) {
  if (deger === null || deger === undefined || !isFinite(deger)) return '—';
  const isaret = deger > 0 ? '+' : deger < 0 ? '−' : '';
  return `${isaret}%${Math.abs(deger).toFixed(1).replace('.', ',')}`;
}

export function slugKategori(s) {
  return String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function kacis(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function paraSemol(kod) {
  return PARA_SEMBOL[kod] || kod;
}
