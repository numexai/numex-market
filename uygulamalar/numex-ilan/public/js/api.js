// Ortak API yardımcıları + format fonksiyonları
const API = {
  kategoriler: () => fetch('/api/kategoriler').then((r) => r.json()),
  ilanlar: (params = '') => fetch(`/api/ilanlar${params}`).then((r) => r.json()),
  ilan: (id) => fetch(`/api/ilanlar/${id}`).then((r) => (r.ok ? r.json() : null)),
  ilanEkle: (veri) =>
    fetch('/api/ilanlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veri),
    }).then((r) => r.json()),
  ilanGuncelle: (id, veri) =>
    fetch(`/api/ilanlar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veri),
    }).then((r) => r.json()),
  ilanSil: (id) => fetch(`/api/ilanlar/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  mesajlar: (ilanId) => fetch(`/api/mesajlar/${ilanId}`).then((r) => r.json()),
  mesajGonder: (veri) =>
    fetch('/api/mesajlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veri),
    }).then((r) => r.json()),
};

function paraSayi(deger) {
  const n = Number(deger);
  if (isNaN(n)) return deger;
  return n.toLocaleString('tr-TR') + ' ₺';
}

function fiyatOzet(deger) {
  const n = Number(deger);
  if (n >= 1000000) return (n / 1000000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' M TL';
  return paraSayi(deger);
}

// Üst barı tüm sayfalara gömer
function ustbariCiz(aktif) {
  const aktifArama = new URLSearchParams(location.search).get('q') || '';
  document.body.insertAdjacentHTML(
    'afterbegin',
    `
  <header class="topbar">
    <div class="topbar-inner">
      <a class="logo" href="index.html">🏠 <span>Numex</span> İlan</a>
      <form class="top-search" action="katalog.html" method="get">
        <input name="q" placeholder="Ara: daire, araba, iPhone..." value="${aktifArama}" />
        <button type="submit">🔍</button>
      </form>
      <div class="top-actions">
        <a class="btn btn-ilan" href="ilan-ac.html">+ İlan Ver</a>
        <a class="btn btn-beyaz" href="katalog.html">Katalog</a>
      </div>
    </div>
  </header>
  `
  );
  if (aktif) {
    const el = document.querySelector(`[data-aktif="${aktif}"]`);
    if (el) el.style.fontWeight = '700';
  }
}
