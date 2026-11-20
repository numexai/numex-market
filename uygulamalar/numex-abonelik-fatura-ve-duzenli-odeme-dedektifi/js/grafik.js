// Numex — SVG grafik üretimi (harici kütüphane yok)
import { kisaPara, kacis, ayAdi } from './bicim.js';

export function donut(veri, boyut = 200) {
  const toplam = veri.reduce((s, v) => s + (v.deger || 0), 0);
  const r = boyut / 2 - 14;
  const cx = boyut / 2, cy = boyut / 2;
  const cevre = 2 * Math.PI * r;
  if (toplam <= 0) {
    return `<svg viewBox="0 0 ${boyut} ${boyut}" class="donut" role="img" aria-label="Veri yok">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--cizgi)" stroke-width="20"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--metin-soluk)" font-size="13">Veri yok</text>
    </svg>`;
  }
  let offset = 0;
  const dilimler = veri.filter(v => v.deger > 0).map(v => {
    const oran = v.deger / toplam;
    const uzunluk = oran * cevre;
    const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${v.renk}" stroke-width="20"
      stroke-dasharray="${uzunluk.toFixed(2)} ${(cevre - uzunluk).toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"></circle>`;
    offset += uzunluk;
    return s;
  }).join('');

  const ana = veri.slice().sort((a, b) => b.deger - a.deger)[0];
  return `<svg viewBox="0 0 ${boyut} ${boyut}" class="donut" role="img" aria-label="Kategori dağılımı">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--cizgi)" stroke-width="20"/>
    ${dilimler}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--metin-soluk)" font-size="11">${kacis(ana ? ana.ad : '')}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--metin)" font-size="15" font-weight="700">${kacis(ana ? kisaPara(ana.deger, ana.para || 'TRY') : '')}</text>
  </svg>`;
}

export function barGrafik(seri, { yukseklik = 170, vurgu = -1 } = {}) {
  const enBuyuk = Math.max(1, ...seri.map(s => s.deger || 0));
  const adim = Math.max(38, Math.floor(520 / Math.max(1, seri.length)));
  const genislik = adim * seri.length;
  const barlar = seri.map((s, i) => {
    const oran = (s.deger || 0) / enBuyuk;
    const h = Math.max(2, Math.round(oran * (yukseklik - 42)));
    const x = i * adim + 4;
    const y = yukseklik - 26 - h;
    const aktif = i === vurgu;
    return `<g class="bar-grup" data-bar="${i}">
      <rect x="${x}" y="${y}" width="${adim - 10}" height="${h}" rx="5"
        fill="${aktif ? 'url(#barAktif)' : 'url(#barNormal)'}"><title>${kacis(s.ay)}: ${kacis(kisaPara(s.deger, s.para || 'TRY'))}</title></rect>
      <text x="${x + (adim - 10) / 2}" y="${yukseklik - 10}" text-anchor="middle"
        font-size="10" fill="${aktif ? 'var(--vurgu-turkuaz)' : 'var(--metin-soluk)'}">${kacis(s.ayKisa || s.ay)}</text>
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 ${genislik} ${yukseklik}" class="bar" preserveAspectRatio="none" role="img" aria-label="Aylık nakit akışı">
    <defs>
      <linearGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.85"/><stop offset="100%" stop-color="#14b8a6" stop-opacity="0.35"/>
      </linearGradient>
      <linearGradient id="barAktif" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5b544" stop-opacity="0.95"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
    ${barlar}
  </svg>`;
}

export function lejant(veri, paraBirimi = 'TRY') {
  const toplam = veri.reduce((s, v) => s + (v.deger || 0), 0) || 1;
  return veri.map(v => `
    <li class="lejant-satir">
      <span class="lejant-nokta" style="background:${v.renk}"></span>
      <span class="lejant-ad">${kacis(v.ad)}</span>
      <span class="lejant-deger">${kacis(v.metin || '')}</span>
      <span class="lejant-yuzde">%${((v.deger / toplam) * 100).toFixed(0)}</span>
    </li>`).join('');
}

export function aylikSeri(durum, bugunT, aylikToplamFn) {
  const seri = [];
  for (let i = -5; i <= 6; i++) {
    const toplamAy = bugunT.getFullYear() * 12 + bugunT.getMonth() + i;
    const yil = Math.floor(toplamAy / 12), ay0 = ((toplamAy % 12) + 12) % 12;
    seri.push({
      ay: `${ayAdi(ay0)} ${yil}`,
      ayKisa: ayAdi(ay0),
      deger: aylikToplamFn(yil, ay0),
      vurgu: i === 0
    });
  }
  return seri;
}
