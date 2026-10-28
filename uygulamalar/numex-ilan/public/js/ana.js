// Ana sayfa: kategoriler + öne çıkan ilanlar
ustbariCiz();

async function yukle() {
  const [kategoriler, ilanlar] = await Promise.all([API.kategoriler(), API.ilanlar()]);
  domBosalt('kategoriler');
  domBosalt('ilanlar');

  // Kategoriler
  const kKat = document.getElementById('kategoriler');
  kategoriler.forEach((k) => {
    const kart = document.createElement('div');
    kart.className = 'kategori-kart';
    kart.innerHTML = `
      <div class="ikon">${k.ikon}</div>
      <div class="ad">${k.ad}</div>
      <div class="alt">${(k.alt || []).join(' · ')}</div>
    `;
    kart.addEventListener('click', () => (location.href = `katalog.html?kategori=${k.id}`));
    kKat.appendChild(kart);
  });

  // İlanlar
  const kIlan = document.getElementById('ilanlar');
  const bosEl = document.getElementById('bos');
  if (!ilanlar.length) {
    bosEl.style.display = 'block';
    return;
  }
  ilanlar.forEach((i) => kIlan.appendChild(ilanKarti(i)));
}

function ilanKarti(i) {
  const kart = document.createElement('a');
  kart.className = 'ilan-kart';
  kart.href = `ilan-detay.html?id=${i.id}`;
  const gorsel = i.gorsel
    ? `<img class="foto" src="${i.gorsel}" alt="${i.baslik}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'><rect width=\'100%25\' height=\'100%25\' fill=\'%23eef0f2\'/><text x=\'50%25\' y=\'50%25\' fill=\'%23999\' font-size=\'28\' text-anchor=\'middle\' font-family=\'sans-serif\'>📷</text></svg>'">`
    : `<div class="foto" style="display:flex;align-items:center;justify-content:center;font-size:2rem">🖼️</div>`;
  kart.innerHTML = `
    ${gorsel}
    <div class="govde">
      <div class="kategori-etiket">${i.kategori || 'İlan'}</div>
      <div class="baslik">${degisken(i.baslik)}</div>
      <div class="fiyat">${fiyatOzet(i.fiyat)}</div>
      <div class="meta">📍 ${i.il}${i.ilce ? ', ' + i.ilce : ''} · ${i.tarih || ''}</div>
    </div>
  `;
  return kart;
}

// güvenli metin çıkışı
function degisken(m) {
  const d = document.createElement('div');
  d.textContent = m == null ? '' : String(m);
  return d.innerHTML;
}

function domBosalt(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '';
}

// footer'daki "verileri sıfırla" — localStorage favorileri temizler
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-sifirla]')) {
    localStorage.removeItem('numex_favori');
    alert('Favorileriniz temizlendi.');
  }
});

yukle();
