// İlan detay + satıcıya mesaj
ustbariCiz();

const params = new URLSearchParams(location.search);
const ilanId = params.get('id');

function degisken(m) {
  const d = document.createElement('div');
  d.textContent = m == null ? '' : String(m);
  return d.innerHTML;
}

// Favori durumunu localStorage'dan oku
function favoriDurum() {
  try {
    const f = JSON.parse(localStorage.getItem('numex_favori') || '[]');
    return f.includes(Number(ilanId));
  } catch {
    return false;
  }
}

function favoriDegistir() {
  try {
    let f = JSON.parse(localStorage.getItem('numex_favori') || '[]');
    const varMi = f.includes(Number(ilanId));
    f = varMi ? f.filter((x) => x !== Number(ilanId)) : [...f, Number(ilanId)];
    localStorage.setItem('numex_favori', JSON.stringify(f));
    document.getElementById('favori-bt').textContent = varMi ? '🤍 Favorilere Ekle' : '❤️ Favoriden Çıkar';
    document.getElementById('favori-bt').classList.toggle('btn-dolu', !varMi);
  } catch {}
}

async function yukle() {
  const ilan = await API.ilan(ilanId);
  const con = document.getElementById('icerek');
  if (!ilan) {
    con.innerHTML = `<div class="bos"><div class="ikon">😕</div><h3>İlan bulunamadı</h3><p><a href="index.html">← Anasayfaya dön</a></p></div>`;
    return;
  }

  document.title = `${ilan.baslik} — Numex İlan`;
  const favori = favoriDurum();

  // Özellik tablosu satırları
  const ozellikSatirlari = Object.entries(ilan.ozellikler || {})
    .map(([k, v]) => `<tr><td>${degisken(k)}</td><td><b>${degisken(v)}</b></td></tr>`)
    .join('');

  const gorsel = ilan.gorsel
    ? `<img class="detay-foto" src="${ilan.gorsel}" alt="${degisken(ilan.baslik)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'><rect width=\'100%25\' height=\'100%25\' fill=\'%23eef0f2\'/><text x=\'50%25\' y=\'50%25\' fill=\'%23999\' font-size=\'56\' text-anchor=\'middle\' font-family=\'sans-serif\'>📷</text></svg>'">`
    : `<div class="detay-foto" style="display:flex;align-items:center;justify-content:center;font-size:4rem;background:#eef0f2">🖼️</div>`;

  con.innerHTML = `
    <a class="btn btn-cerceve" href="katalog.html" style="margin-bottom:16px">← Kataloğa dön</a>
    <div class="detay-grid">
      <div>
        ${gorsel}
        <div class="detay-bilgi">
          <div class="kategori-etiket" style="display:inline-block;margin-bottom:6px">${degisken(ilan.kategori)}</div>
          <h1 class="detay-baslik">${degisken(ilan.baslik)}</h1>
          <div class="detay-fiyat">${paraSayi(ilan.fiyat)}</div>
          <div class="meta">📍 ${degisken(ilan.il)}${ilan.ilce ? ', ' + degisken(ilan.ilce) : ''} · İlan tarihi: ${degisken(ilan.tarih)}</div>
          <table class="detay-tablo">${ozellikSatirlari || '<tr><td>Genel ilan</td><td>—</td></tr>'}</table>
          <h3 style="margin-top:16px">Açıklama</h3>
          <p class="detay-aciklama">${degisken(ilan.aciklama)}</p>
        </div>
      </div>

      <div>
        <button id="favori-bt" class="btn ${favori ? 'btn-dolu' : 'btn-cerceve'}" style="width:100%;margin-bottom:12px">
          ${favori ? '❤️ Favoriden Çıkar' : '🤍 Favorilere Ekle'}
        </button>
        <div class="detay-bilgi satici-kart">
          <div class="satici-ad">👤 ${degisken(ilan.sahip)}</div>
          <div class="satici-tel">
            <span>📞 Telefon</span>
            <span class="tel">${degisken(ilan.telefon)}</span>
          </div>
          <div class="mesaj-girdi">
            <textarea id="mesaj-metni" placeholder="${degisken(ilan.sahip)}'e mesajın..."></textarea>
            <button id="mesaj-gonder" class="btn btn-dolu">💬 Mesaj Gönder</button>
          </div>
          <div id="fb-kutu"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('favori-bt').addEventListener('click', favoriDegistir);
  document.getElementById('mesaj-gonder').addEventListener('click', async () => {
    const mesaj = document.getElementById('mesaj-metni').value.trim();
    const fb = document.getElementById('fb-kutu');
    if (!mesaj) {
      fb.innerHTML = `<div class="fb fb-hata">Lütfen mesajını yaz.</div>`;
      return;
    }
    await API.mesajGonder({ ilanId, gonderen: 'Ziyaretçi', mesaj });
    fb.innerHTML = `<div class="fb fb-ok">✅ Mesajın iletildi. ${degisken(ilan.sahip)} en kısa sürede sana ulaşacak.</div>`;
    document.getElementById('mesaj-metni').value = '';
  });
}

yukle();
