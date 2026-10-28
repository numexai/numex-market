/**
 * Numex Candy — Express sunucusu
 * ------------------------------------------------------------
 * Statik arayüzü servis eder ve bölüm/skor API uçlarını sunar.
 *
 * Uçlar:
 *   GET  /api/levels           → bölüm listesi (meta)
 *   GET  /api/levels/:id       → tek bölüm (meta + tahta düzeni)
 *   GET  /api/levels/:id/board → bölümün başlangıç tahtası
 *   GET  /api/leaderboard/:id  → bölüm skor tablosu
 *   POST /api/leaderboard      → skor kaydet
 *   GET  /api/saglik           → sağlık kontrolü
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allLevels, getLevel, levelMeta, levelBoard, CANDY_TYPES } from './levels.js';
import { skorKaydet, skorTablosu } from './leaderboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.resolve(__dirname, '..');

export function uygulamaOlustur() {
  const app = express();

  app.use(express.json({ limit: '64kb' }));

  // ---- API ----

  app.get('/api/saglik', (req, res) => {
    res.json({ durum: 'calisiyor', oyun: 'Numex Candy', bolumSayisi: allLevels().length });
  });

  app.get('/api/sekerler', (req, res) => {
    res.json(CANDY_TYPES);
  });

  app.get('/api/levels', (req, res) => {
    res.json(allLevels());
  });

  app.get('/api/levels/:id', (req, res) => {
    const level = getLevel(req.params.id);
    if (!level) return res.status(404).json({ hata: 'Bölüm bulunamadı' });

    const { tahta, jel } = levelBoard(level);
    res.json({
      ...levelMeta(level),
      tahtaDuzeni: tahta,
      jel,
    });
  });

  app.get('/api/levels/:id/board', (req, res) => {
    const level = getLevel(req.params.id);
    if (!level) return res.status(404).json({ hata: 'Bölüm bulunamadı' });

    const { tahta, jel } = levelBoard(level);
    res.json({ levelId: level.id, tahta, jel });
  });

  app.get('/api/leaderboard/:id', (req, res) => {
    const level = getLevel(req.params.id);
    if (!level) return res.status(404).json({ hata: 'Bölüm bulunamadı' });
    res.json({ levelId: level.id, kayitlar: skorTablosu(level.id) });
  });

  app.post('/api/leaderboard', (req, res) => {
    const { levelId, isim, skor, yildiz } = req.body || {};

    if (!levelId || !getLevel(levelId)) {
      return res.status(400).json({ hata: 'Geçersiz bölüm' });
    }
    if (typeof skor !== 'number' || skor < 0 || !Number.isFinite(skor)) {
      return res.status(400).json({ hata: 'Geçersiz skor' });
    }

    const liste = skorKaydet(levelId, isim, skor, yildiz);
    res.status(201).json({ basarili: true, kayitlar: liste });
  });

  // ---- Statik arayüz ----
  // Geliştirme sırasında tarayıcı eski js/css'i önbellekten servis edip
  // "oyun açılmıyor" yanılsaması yaratıyordu. Bu yüzden statik dosyalar
  // no-cache ile sunulur (ETag/last-modified ile yine verimli çalışır).
  const onbelleksiz = (res, yol) => {
    if (/\.(html|js|mjs|css)$/i.test(yol)) res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  };

  app.use(express.static(path.join(KOK, 'public'), { setHeaders: onbelleksiz }));

  // Oyun motoru modülleri: arayüz bunları doğrudan import eder.
  // public/ dışında yaşadıkları için ayrıca servis edilmeleri gerekir —
  // kopyalamak yerine tek kaynaktan (src/engine) sunuyoruz.
  app.use('/engine', express.static(path.join(KOK, 'src', 'engine'), { setHeaders: onbelleksiz }));

  // SPA benzeri yönlendirme: bilinmeyen yolları index.html'e düşür
  app.get(/^\/(?!api\/).*/, (req, res) => {
    // index.html de geliştirmede önbelleğe takılmasın
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(KOK, 'public', 'index.html'));
  });

  // ---- Hata yakalayıcı ----
  // JSON middleware'i (limit: 64kb) aşırı büyük gövdede veya bozuk JSON'da
  // hata fırlatır. Yakalanmazsa Express varsayılan HTML hata sayfasını döner
  // ve istemci (fetch → res.json()) parse hatasıyla uğraşır. API yollarında
  // her zaman TUTARLI bir JSON hata gövdesi döndürüyoruz.
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (res.headersSent) return next(err);

    const durum = err.status || err.statusCode || 500;
    const hata =
      durum === 413
        ? 'Gönderilen veri çok büyük'
        : durum === 400 && err.type === 'entity.parse.failed'
          ? 'Bozuk JSON gövdesi'
          : durum >= 500
            ? 'Sunucu hatası'
            : err.message || 'Geçersiz istek';

    if (req.path.startsWith('/api/')) {
      return res.status(durum).json({ hata });
    }
    // API dışı yollarda da JSON dön (tutarlılık); ham stack sızdırma.
    res.status(durum).json({ hata });
  });

  return app;
}

// Doğrudan çalıştırıldıysa sunucuyu başlat
const dogrudanCalisti = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (dogrudanCalisti) {
  const istenenPort = Number(process.env.PORT) || 4321;

  /**
   * Sunucuyu başlatır; port doluysa sıradaki boş porta geçer.
   * Böylece geliştirme sırasında "EADDRINUSE" ile çökmek yerine
   * oyun her zaman bir adreste ayağa kalkar.
   */
  const baslat = (port, deneme = 0) => {
    const app = uygulamaOlustur();
    const sunucu = app.listen(port);

    sunucu.on('listening', () => {
      console.log(`🍬 Numex Candy çalışıyor → http://localhost:${port}`);
      console.log(`   ${allLevels().length} bölüm yüklendi.`);
    });

    sunucu.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && deneme < 10) {
        const yeniPort = port + 1;
        console.log(`⚠️  ${port} dolu, ${yeniPort} deneniyor...`);
        baslat(yeniPort, deneme + 1);
        return;
      }
      console.error('❌ Sunucu başlatılamadı:', err.message);
      process.exit(1);
    });
  };

  baslat(istenenPort);
}

export default uygulamaOlustur;
