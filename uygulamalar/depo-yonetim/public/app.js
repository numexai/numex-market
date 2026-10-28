// Numex Depo Yönetim Sistemi - Frontend mantığı
const api = {
  list: (p) => fetch('/api/' + p).then(r => r.json()),
  post: (p, body) => fetch('/api/' + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async r => ({ ok: r.ok, veri: await r.json() })),
  del: (p) => fetch('/api/' + p, { method: 'DELETE' }).then(r => r.json())
};

// --- Sekme geçişleri ---
document.querySelectorAll('.sekm').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sekm').forEach(b => b.classList.remove('secili'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('aktif'));
    btn.classList.add('secili');
    document.getElementById('sekme-' + btn.dataset.sekme).classList.add('aktif');
    yenile();
  });
});

// --- Evrensel yenileme ---
function yenile() {
  lokasyonlariYukle();
  urunleriYukle();
  stoguYukle();
  gecmisiYukle();
  uyarilariYukle();
}

// --- Lokasyonlar ---
async function lokasyonlariYukle() {
  const lokasyonlar = await api.list('lokasyonlar');
  const t = document.getElementById('lokasyon-tablo');
  t.innerHTML = lokasyonlar.length ? lokasyonlar.map(l => `
    <tr>
      <td>${l.id}</td><td>${l.ad}</td><td>${l.sehir || '-'}</td>
      <td>${new Date(l.olusturuldu).toLocaleDateString('tr-TR')}</td>
      <td><button class="btn-sil" onclick="lokasyonSil(${l.id})">Sil</button></td>
    </tr>`).join('') : '<tr><td colspan="5">Henüz lokasyon yok</td></tr>';

  // Transfer form dropdownları
  durumlariDoldur('transfer-kaynak', lokasyonlar);
  durumlariDoldur('transfer-hedef', lokasyonlar);
}

function durumlariDoldur(id, lokasyonlar) {
  const s = document.getElementById(id);
  const mevcut = s.value;
  s.innerHTML = lokasyonlar.map(l => `<option value="${l.id}">${l.ad}${l.sehir ? ' (' + l.sehir + ')' : ''}</option>`).join('');
  if (lokasyonlar.some(l => l.id === Number(mevcut))) s.value = mevcut;
}

async function lokasyonSil(id) {
  if (!confirm('Bu lokasyon silinsin mi?')) return;
  await api.del('lokasyonlar/' + id);
  yenile();
}

document.getElementById('lokasyon-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await api.post('lokasyonlar', {
    ad: document.getElementById('lokasyon-ad').value,
    sehir: document.getElementById('lokasyon-sehir').value
  });
  e.target.reset();
  yenile();
});

// --- Ürünler ---
async function urunleriYukle() {
  const urunler = await api.list('urunler');
  const t = document.getElementById('urun-tablo');
  t.innerHTML = urunler.length ? urunler.map(u => `
    <tr>
      <td>${u.id}</td><td>${u.ad}</td><td>${u.birim}</td>
      <td>${u.dusukStokEsigi}</td>
      <td><button class="btn-sil" onclick="urunSil(${u.id})">Sil</button></td>
    </tr>`).join('') : '<tr><td colspan="5">Henüz ürün yok</td></tr>';

  const s = document.getElementById('transfer-urun');
  s.innerHTML = urunler.map(u => `<option value="${u.id}">${u.ad}</option>`).join('');
}

async function urunSil(id) {
  if (!confirm('Bu ürün silinsin mi?')) return;
  await api.del('urunler/' + id);
  yenile();
}

document.getElementById('urun-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await api.post('urunler', {
    ad: document.getElementById('urun-ad').value,
    birim: document.getElementById('urun-birim').value,
    dusukStokEsigi: document.getElementById('urun-esik').value
  });
  e.target.reset();
  yenile();
});

// --- Stok ---
async function stoguYukle() {
  const veri = await api.list('stok');
  const g = document.getElementById('stok-gorunum');
  if (!veri.length) { g.innerHTML = '<p class="mesaj">Lokasyon ekleyin ve stok girişi yapın.</p>'; return; }

  g.innerHTML = veri.map(l => `
    <div class="stok-blok">
      <h3>🏬 ${l.lokasyonAd} <small>(${l.sehir || 'Şehir yok'})</small></h3>
      <table>
        <thead><tr><th>Ürün</th><th>Birim</th><th>Miktar</th><th>Durum</th></tr></thead>
        <tbody>
          ${l.stok.length ? l.stok.map(k => {
            const dusuk = k.miktar <= k.dusukStokEsigi;
            return `<tr class="${dusuk ? 'uyari-satir' : ''}">
              <td>${k.urunAd}</td><td>${k.birim}</td><td>${k.miktar}</td>
              <td>${dusuk ? '<span class="badge dusuk">⬇ Düşük stok</span>' : '<span class="badge iyi">✓ Yeterli</span>'}</td>
            </tr>`;
          }).join('') : '<tr><td colspan="4">Bu lokasyonda stok yok</td></tr>'}
        </tbody>
      </table>
    </div>`).join('');
}

// --- Transfer ---
document.getElementById('transfer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const mesaj = document.getElementById('transfer-mesaj');
  const sonuc = await api.post('transferler', {
    kaynakId: document.getElementById('transfer-kaynak').value,
    hedefId: document.getElementById('transfer-hedef').value,
    urunId: document.getElementById('transfer-urun').value,
    miktar: document.getElementById('transfer-miktar').value
  });
  mesaj.className = 'mesaj ' + (sonuc.ok ? 'ok' : 'hata');
  mesaj.textContent = sonuc.ok
    ? '✅ Transfer başarılı!'
    : (sonuc.veri.hata || 'Transfer yapılamadı') + (Array.isArray(sonuc.veri.hata) ? '' : '');
  if (sonuc.ok) e.target.reset();
  yenile();
});

// --- Transfer geçmişi ---
async function gecmisiYukle() {
  if (!document.getElementById('sekme-gecmis').classList.contains('aktif')) return;
  const veri = await api.list('transferler');
  const t = document.getElementById('gecmis-tablo');
  t.innerHTML = veri.length ? veri.map(g => `
    <tr>
      <td>${new Date(g.tarih).toLocaleString('tr-TR')}</td>
      <td>${g.urunAd}</td><td>${g.kaynakAd}</td><td>→</td>
      <td>${g.hedefAd}</td><td><strong>${g.miktar}</strong></td>
    </tr>`).join('') : '<tr><td colspan="6">Henüz transfer yapılmadı</td></tr>';
}

// --- Düşük stok uyarıları ---
async function uyarilariYukle() {
  if (!document.getElementById('sekme-uyari').classList.contains('aktif')) return;
  const veri = await api.list('stok/uyari/dusuk');
  const t = document.getElementById('uyari-tablo');
  t.innerHTML = veri.length ? veri.map(u => `
    <tr class="uyari-satir">
      <td><strong>${u.lokasyonAd}</strong></td><td>${u.urunAd}</td>
      <td>${u.miktar}</td><td>${u.dusukStokEsigi}</td>
      <td><span class="badge dusuk">⚠ Stok az</span></td>
    </tr>`).join('') : '<tr><td colspan="5">🎉 Tüm stok seviyeleri yeterli</td></tr>';
}

// Başlangıç
yenile();
