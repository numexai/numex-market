import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3965;
const DATA_YOLU = join(__dirname, 'data', 'data.json');

let dataCache = null;
function vitrinVerisi() {
  try {
    if (!dataCache) dataCache = JSON.parse(readFileSync(DATA_YOLU, 'utf8'));
    return dataCache;
  } catch {
    return null;
  }
}

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Vitrin verisi (hizmetler, fiyatlar, adres, saatler vb.)
app.get('/api/data', (_req, res) => {
  const v = vitrinVerisi();
  if (!v) return res.status(500).json({ ok: false, mesaj: 'Veri dosyası okunamadı.' });
  return res.json(v);
});

// Randevu / yerinde servis talebi kaydı (demo: dosyaya eklemeden, sadece doğrular ve onaylar)
app.post('/api/randevu', (req, res) => {
  const { ad, telefon, hizmet, ilce, adres, not } = req.body || {};
  if (!ad || !telefon || !hizmet || !adres) {
    return res.status(400).json({ ok: false, mesaj: 'Ad, telefon, hizmet ve adres zorunludur.' });
  }
  return res.status(201).json({
    ok: true,
    mesaj: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    kayit: { ad, telefon, hizmet, ilce, adres, not, talep_zamani: new Date().toISOString() }
  });
});

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, hizmet: 'Omer Kalpat Cep Telefonu Tamiri', mod: 'yerinde-tamir-vitrin' })
);

const srv = app.listen(PORT, () =>
  console.log('Omer Kalpat Cep Telefonu Tamiri -> http://localhost:' + PORT)
);
srv.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' zaten kullanımda. Lütfen mevcut servisi durdurup yeniden başlatın ya da PORT ortam değişkeniyle başka bir port verin.');
  } else {
    console.error('Sunucu hatası:', err && err.message);
  }
});
