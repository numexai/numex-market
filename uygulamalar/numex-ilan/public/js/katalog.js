// Katalog: filtreleme + sıralama
ustbariCiz('katalog');

let tumIlanlar = [];
const iller = new Set();

function degisken(m) {
  const d = document.createElement('div');
  d.textContent = m == null ? '' : String(m);
  return d.innerHTML;
}

function ilanKarti(i) {
  const kart = document.createElement('a');
  kart.className = 'ilan-kart';
  kart.href = `ilan-detay.html?id=${i.id}`;
  const gorsel = i.gorsel
    ? `<img class="foto" src="${i.gorsel}" alt="${degisken(i.baslik)}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'><rect width=\'100%25\' height=\'100%25\' fill=\'%23eef0f2\'/><text x=\'50%25\' y=\'50%25\' fill=\'%23999\' font-size=\'28\' text-anchor=\'middle\' font-family=\'sans-serif\'>📷</text></svg>'">`
    : `<div class="foto" style="display:flex;align-items:center;justify-content:center;font-size:2rem">🖼️</div>`;
  kart.innerHTML = `
    ${gorsel}
    <div class="govde">
      <div class="kategori-etiket">${degisken(i.kategori || 'İlan')}</div>
      <div class="baslik">${degisken(i.baslik)}</div>
      <div class="fiyat">${fiyatOzet(i.fiyat)}</div>
      <div class="meta">📍 ${degisken(i.il)}${i.ilce ? ', ' + degisken(i.ilce) : ''}</div>
    </div>
  `;
  return kart;
}

async function baslangic() {
  const [kategoriler, ilanlar] = await Promise.all([API.kategoriler(), API.ilanlar()]);
  tumIlanlar = ilanlar;
  ilanlar.forEach((i) => iller.add(i.il));

  // filtre dropdownları
  const kKat = document.getElementById('f-kategori');
  kategoriler.forEach((k) => {
    const o = document.createElement('option');
    o.value = k.id;
    o.textContent = k.ad;
    kKat.appendChild(o);
  });
  const kIl = document.getElementById('f-il');
  [...iller].sort().forEach((il) => {
    const o = document.createElement('option');
    o.value = il;
    o.textContent = il;
    kIl.appendChild(o);
  });

  // URL'den gelenleri uygula
  const params = new URLSearchParams(location.search);
  if (params.get('kategori')) kKat.value = params.get('kategori');
  if (params.get('q')) {
    document.getElementById('f-ara').value = params.get('q');
    kKat.value = kategoriler.find((k) => k.ad.toLowerCase() === params.get('q').toLowerCase()) ? kKat.value : kKat.value;
  }

  uygula();
}

function uygula() {
  const kKat = document.getElementById('f-kategori').value;
  const il = document.getElementById('f-il').value;
  const min = document.getElementById('f-min').value;
  const max = document.getElementById('f-max').value;
  const ara = document.getElementById('f-ara').value.trim().toLowerCase();
  const sirala = document.getElementById('f-sirala').value;

  let sonuc = [...tumIlanlar];
  if (kKat) sonuc = sonuc.filter((i) => String(i.kategoriId) === String(kKat));
  if (il) sonuc = sonuc.filter((i) => i.il === il);
  if (min) sonuc = sonuc.filter((i) => i.fiyat >= Number(min));
  if (max) sonuc = sonuc.filter((i) => i.fiyat <= Number(max));
  if (ara)
    sonuc = sonuc.filter((i) => (i.baslik + ' ' + i.aciklama + ' ' + (i.kategori || '')).toLowerCase().includes(ara));

  if (sirala === 'fiyat-artan') sonuc.sort((a, b) => a.fiyat - b.fiyat);
  else if (sirala === 'fiyat-azalan') sonuc.sort((a, b) => b.fiyat - a.fiyat);
  else sonuc.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

  const kIlan = document.getElementById('ilanlar');
  const bosEl = document.getElementById('bos');
  kIlan.innerHTML = '';
  document.getElementById('sonuc-bilgi').textContent = `${sonuc.length} ilan bulundu`;
  if (!sonuc.length) {
    bosEl.style.display = 'block';
    return;
  }
  bosEl.style.display = 'none';
  sonuc.forEach((i) => kIlan.appendChild(ilanKarti(i)));
}

document.getElementById('f-uygula').addEventListener('click', uygula);
// Enter ile de filtrele
document.querySelectorAll('.filtreler input, .filtreler select').forEach((el) =>
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') uygula();
  })
);

baslangic();
