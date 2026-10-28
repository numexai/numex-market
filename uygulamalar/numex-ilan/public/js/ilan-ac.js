// Yeni ilan açma formu
ustbariCiz();

const form = document.getElementById('ilan-formu');
const fb = document.getElementById('fb-kutu');

// Kategorileri doldur
(async () => {
  const kategoriler = await API.kategoriler();
  const sel = document.getElementById('t-kategori');
  kategoriler.forEach((k) => {
    const o = document.createElement('option');
    o.value = k.id;
    o.textContent = k.ad;
    sel.appendChild(o);
  });
  sel.value = kategoriler.length ? kategoriler[0].id : '';
})();

// Görsel önizleme
const gorselIn = document.getElementById('t-gorsel');
const oniz = document.getElementById('onizleme');
gorselIn.addEventListener('input', () => {
  const url = gorselIn.value.trim();
  if (url) {
    oniz.src = url;
    oniz.style.border = url ? '2px solid #16a34a' : '';
    oniz.onerror = () => {
      oniz.style.border = '2px dashed var(--tehlike)';
      oniz.alt = 'Görsel yüklenemedi';
    };
  } else {
    oniz.removeAttribute('src');
    oniz.style.border = '';
    oniz.alt = 'Görsel önizleme';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const veri = {
    baslik: document.getElementById('t-baslik').value.trim(),
    kategoriId: Number(document.getElementById('t-kategori').value),
    fiyat: document.getElementById('t-fiyat').value,
    il: document.getElementById('t-il').value.trim(),
    ilce: document.getElementById('t-ilce').value.trim() || undefined,
    sahip: document.getElementById('t-sahip').value.trim(),
    telefon: document.getElementById('t-telefon').value.trim(),
    aciklama: document.getElementById('t-aciklama').value.trim() || 'Detay yok.',
    gorsel: gorselIn.value.trim() || undefined,
    ozellikler: {},
  };

  const sonuc = await API.ilanEkle(veri);
  if (sonuc && sonuc.id) {
    fb.innerHTML = `<div class="fb fb-ok">✅ İlanın yayınlandı! <a href="ilan-detay.html?id=${sonuc.id}" style="font-weight:700">İlanı gör →</a></div>`;
    form.reset();
    oniz.removeAttribute('src');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    fb.innerHTML = `<div class="fb fb-hata">⚠ Bir sorun oluştu: ${sonuc?.hata || 'bilinmeyen hata'}</div>`;
  }
});
