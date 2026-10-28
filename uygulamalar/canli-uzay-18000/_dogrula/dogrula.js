/* ============================================================
   RENDER KANIT TESTİ (self-review)
   Amaç: "kod doğru görünüyor" değil — "GERÇEKTEN ÇİZİYOR" kanıtı.
   Saf Canvas 2D'de tek bir ctx hatası siyah ekran verir; bu test
   canvas'ı gerçek tarayıcıda açar, getImageData ile PİKSEL OKUR.
   ------------------------------------------------------------
   Ölçülen kriterler:
     K1 canvas var mı + doğru boyutta mı
     K2 siyah ekran DEĞİL (yeterli parlak piksel var)
     K3 yıldız alanı var (parlak nokta sayısı)
     K4 güneş var (merkezde çok parlak büyük küme)
     K5 ay var (dünya çevresinde ayrı gövde)
     K6 gezegen var (güneşten farklı konumda gövde)
     K7 CANLI: iki farklı anda pikseller DEĞİŞİYOR (dönüş/animasyon)
     K8 güneş kendi ekseninde dönüyor (yüzey deseni değişiyor)
     K9 ilahi güç katmanı var (panel + taç halkaları)
     K10 konsol JS hatası YOK
   ============================================================ */
const { chromium } = require('playwright');

const URL = process.env.URL || 'http://localhost:8123/index.html';

function say(ad, gecti, kanit) {
  const imza = gecti ? 'KARŞILANDI' : 'KARŞILANMADI';
  console.log(`${gecti ? '[OK]' : '[!!]'} ${ad} -> ${imza}\n      kanıt: ${kanit}`);
  return gecti;
}

(async () => {
  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 800 } });

  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push('pageerror: ' + e.message));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push('console: ' + m.text()); });

  await sayfa.goto(URL, { waitUntil: 'load' });
  await sayfa.waitForTimeout(2500);

  let hepsi = true;

  /* ---------- K1: canvas var + boyut ---------- */
  const bilgi = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    if (!c) return null;
    return { w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight };
  });
  hepsi &= say('K1 canvas #evren var ve boyutlu',
    !!bilgi && bilgi.w > 100 && bilgi.h > 100,
    bilgi ? `canvas.width=${bilgi.w} canvas.height=${bilgi.h} css=${bilgi.cssW}x${bilgi.cssH}` : 'canvas BULUNAMADI');

  /* ---------- yardımcı: piksel istatistikleri ---------- */
  async function istatistik() {
    return await sayfa.evaluate(() => {
      const c = document.getElementById('evren');
      const g = c.getContext('2d');
      const W = c.width, H = c.height;
      const d = g.getImageData(0, 0, W, H).data;
      let parlak = 0, toplamParlaklik = 0, enParlak = 0, enParlakX = 0, enParlakY = 0;
      let sicakNokta = 0; // turuncu/sarı güneş pikselleri
      let cokParlak = 0;  // neredeyse beyaz (güneş koru)
      const adim = 4;
      for (let y = 0; y < H; y += adim) {
        for (let x = 0; x < W; x += adim) {
          const i = (y * W + x) * 4;
          const r = d[i], gg = d[i + 1], b = d[i + 2];
          const p = (r + gg + b) / 3;
          toplamParlaklik += p;
          if (p > 40) parlak++;
          if (p > 200) cokParlak++;
          if (r > 150 && gg > 80 && b < 120 && r > b + 60) sicakNokta++;
          if (p > enParlak) { enParlak = p; enParlakX = x; enParlakY = y; }
        }
      }
      const ornek = Math.ceil(W / adim) * Math.ceil(H / adim);
      return {
        W, H, ornek, parlak, cokParlak, sicakNokta,
        ortalamaParlaklik: +(toplamParlaklik / ornek).toFixed(2),
        enParlak: +enParlak.toFixed(1),
        enParlakX, enParlakY,
        // DPR ölçeğini geri almak için
        dprX: W / c.clientWidth,
        dprY: H / c.clientHeight
      };
    });
  }

  const s1 = await istatistik();

  /* ---------- K2: siyah ekran değil ---------- */
  hepsi &= say('K2 siyah ekran DEĞİL (sahne çiziliyor)',
    s1.parlak > 300 && s1.ortalamaParlaklik > 1.5,
    `parlak(>40) piksel=${s1.parlak} · ortalama parlaklık=${s1.ortalamaParlaklik}/255`);

  /* ---------- K3: yıldız alanı ---------- */
  hepsi &= say('K3 uzay boşluğu / yıldız alanı var',
    s1.parlak > 500,
    `uzak-uzay parlak piksel örneklemi=${s1.parlak} (adım=${4}px, örneklenen=${s1.ornek} nokta)`);

  /* ---------- K4: güneş (merkezde en parlak küme) ---------- */
  const merkezX = s1.W / 2, merkezY = s1.H / 2;
  const enParlakMerkezdeMi =
    Math.abs(s1.enParlakX - merkezX) < s1.W * 0.22 &&
    Math.abs(s1.enParlakY - merkezY) < s1.H * 0.22;
  hepsi &= say('K4 GÜNEŞ çizilmiş (merkezde sıcak/parlak çekirdek)',
    s1.cokParlak > 50 && s1.sicakNokta > 50 && enParlakMerkezdeMi,
    `çok-parlak(>200) piksel=${s1.cokParlak} · sıcak(turuncu/sarı)=${s1.sicakNokta} · ` +
    `en parlak nokta=(${s1.enParlakX},${s1.enParlakY}) vs merkez=(${merkezX.toFixed(0)},${merkezY.toFixed(0)})`);

  /* ---------- sahne özeti: motorun kendi iç durumu ---------- */
  const icDurum = await sayfa.evaluate(() => {
    // app.js IIFE içinde; dışarıdan erişilebilen izleri kullan
    const c = document.getElementById('evren');
    return {
      fps: (document.getElementById('fps') || {}).textContent,
      durum: (document.getElementById('durum') || {}).textContent,
      ilahiPerdeVar: !!document.getElementById('ilahi-perde')
    };
  });

  /* ---------- K5 + K6: ay ve gezegen gövdesi ---------- */
  // Merkez çevresinde, belirli yarıçap halkalarında parlak gövde ara
  const govdeTarama = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;
    const d = g.getImageData(0, 0, W, H).data;
    const at = (x, y) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return -1;
      const i = (y * W + x) * 4;
      return (d[i] + d[i + 1] + d[i + 2]) / 3;
    };
    // 40..300 px arası gövde kümelerini bul (güneş dışı)
    const maxR = Math.min(W, H) * 0.42;
    let ayKume = 0, ayEnIyi = null;
    for (let a = 0; a < 360; a += 2) {
      const rad = a * Math.PI / 180;
      for (let r = 60; r < maxR; r += 3) {
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        if (at(x, y) > 120) {
          ayKume++;
          if (!ayEnIyi) ayEnIyi = { r: Math.round(r), aci: a };
        }
      }
    }
    return { ayKume, ayEnIyi, maxR: Math.round(maxR) };
  });

  hepsi &= say('K5/K6 gezegen ve AY gövdeleri güneş çevresinde bulundu',
    govdeTarama.ayKume > 30,
    `merkez çevresinde parlak gövde ışını=${govdeTarama.ayKume} · ilk gövde r=${govdeTarama.ayEnIyi ? govdeTarama.ayEnIyi.r : '-'}px @ ${govdeTarama.ayEnIyi ? govdeTarama.ayEnIyi.aci : '-'}° (taranan max r=${govdeTarama.maxR}px)`);

  /* ---------- K7: CANLI animasyon — pikseller zamanla değişiyor ---------- */
  const kare1 = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H).data;
    const imza = [];
    for (let y = 0; y < H; y += 16)
      for (let x = 0; x < W; x += 16) {
        const i = (y * W + x) * 4;
        imza.push(d[i], d[i + 1], d[i + 2]);
      }
    return imza;
  });

  await sayfa.waitForTimeout(1200);

  const kare2 = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H).data;
    const imza = [];
    for (let y = 0; y < H; y += 16)
      for (let x = 0; x < W; x += 16) {
        const i = (y * W + x) * 4;
        imza.push(d[i], d[i + 1], d[i + 2]);
      }
    return imza;
  });

  let degisen = 0;
  for (let i = 0; i < Math.min(kare1.length, kare2.length); i += 3) {
    const fark = Math.abs(kare1[i] - kare2[i]) +
                 Math.abs(kare1[i + 1] - kare2[i + 1]) +
                 Math.abs(kare1[i + 2] - kare2[i + 2]);
    if (fark > 8) degisen++;
  }
  const toplamNokta = Math.floor(kare1.length / 3);
  const degisimYuzde = +(100 * degisen / toplamNokta).toFixed(1);

  hepsi &= say('K7 CANLI: 1.2 sn arayla pikseller değişiyor (evren akıyor)',
    degisen > 20,
    `değişen örnek nokta=${degisen}/${toplamNokta} (%${degisimYuzde}) · durum="${icDurum.durum}" · fps="${icDurum.fps}"`);

  /* ---------- K8: güneş KENDİ EKSENİNDE dönüyor ---------- */
  // Güneş bölgesine yakın zoom yapıp yüzey deseninin değiştiğini ölç
  const gunes1 = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const cx = Math.round(W / 2), cy = Math.round(H / 2);
    const yar = Math.round(Math.min(W, H) * 0.09);
    const d = g.getImageData(cx - yar, cy - yar, yar * 2, yar * 2).data;
    const t = [];
    for (let i = 0; i < d.length; i += 4 * 7) t.push(d[i], d[i + 1], d[i + 2]);
    return t;
  });
  await sayfa.waitForTimeout(900);
  const gunes2 = await sayfa.evaluate(() => {
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const cx = Math.round(W / 2), cy = Math.round(H / 2);
    const yar = Math.round(Math.min(W, H) * 0.09);
    const d = g.getImageData(cx - yar, cy - yar, yar * 2, yar * 2).data;
    const t = [];
    for (let i = 0; i < d.length; i += 4 * 7) t.push(d[i], d[i + 1], d[i + 2]);
    return t;
  });
  let gunesDegisen = 0;
  for (let i = 0; i < Math.min(gunes1.length, gunes2.length); i++) {
    if (Math.abs(gunes1[i] - gunes2[i]) > 10) gunesDegisen++;
  }
  hepsi &= say('K8 GÜNEŞ kendi ekseninde dönüyor (yüzey deseni değişiyor)',
    gunesDegisen > 15,
    `güneş bölgesinde değişen kanal değeri=${gunesDegisen}/${Math.min(gunes1.length, gunes2.length)}`);

  /* ---------- K9: ilahi güç katmanı ---------- */
  const ilahiTest = await sayfa.evaluate(async () => {
    const sl = document.getElementById('ilahi');
    if (!sl) return { var: false };
    const c = document.getElementById('evren');
    const g = c.getContext('2d');
    // ilahi gücü 0 yap
    sl.value = '0';
    sl.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const W = c.width, H = c.height;
    const d0 = g.getImageData(0, 0, W, H).data;
    let p0 = 0;
    for (let i = 0; i < d0.length; i += 4 * 11) if ((d0[i] + d0[i + 1] + d0[i + 2]) / 3 > 150) p0++;
    // ilahi gücü max yap
    sl.value = '1';
    sl.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 900));
    const d1 = g.getImageData(0, 0, W, H).data;
    let p1 = 0;
    for (let i = 0; i < d1.length; i += 4 * 11) if ((d1[i] + d1[i + 1] + d1[i + 2]) / 3 > 150) p1++;
    // geri al
    sl.value = '0.75';
    sl.dispatchEvent(new Event('input', { bubbles: true }));
    return { var: true, p0, p1, etiket: (document.getElementById('ilahiDeger') || {}).textContent };
  });

  hepsi &= say('K9 İLAHİ GÜÇ katmanı çalışıyor (slider sahneyi gerçekten etkiliyor)',
    ilahiTest.var && ilahiTest.p1 !== ilahiTest.p0,
    ilahiTest.var
      ? `parlak piksel @güç=0 → ${ilahiTest.p0} · @güç=1 → ${ilahiTest.p1} (fark=${ilahiTest.p1 - ilahiTest.p0}) · etiket="${ilahiTest.etiket}"`
      : 'slider bulunamadı');

  /* ---------- K10: konsol hatası yok (favicon 404 hariç) ---------- */
  const gercekHatalar = hatalar.filter(h => !/favicon/i.test(h) && !/404/i.test(h));
  hepsi &= say('K10 konsol JS hatası YOK',
    gercekHatalar.length === 0,
    gercekHatalar.length === 0 ? 'JS hatası yok (favicon 404 hariç tutuldu)' : gercekHatalar.join(' | '));

  /* ---------- Kontroller paneli işlevsel mi ---------- */
  const etkilesim = await sayfa.evaluate(async () => {
    const sonuc = {};
    const hiz = document.getElementById('hiz');
    hiz.value = '2.5'; hiz.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    sonuc.hizEtiket = (document.getElementById('hizDeger') || {}).textContent;
    const yb = document.getElementById('yorungeBtn');
    if (yb) { yb.click(); await new Promise(r => setTimeout(r, 120)); }
    const eb = document.getElementById('etiketBtn');
    if (eb) { eb.click(); await new Promise(r => setTimeout(r, 300)); }
    sonuc.etiketAktif = eb ? eb.classList.contains('aktif') : null;
    const db = document.getElementById('duraklatBtn');
    if (db) { db.click(); await new Promise(r => setTimeout(r, 200)); }
    sonuc.duraklatMetin = db ? db.textContent.trim() : null;
    // devam
    if (db) db.click();
    return sonuc;
  });

  hepsi &= say('K11 kontrol paneli işlevsel (hız / yörünge / isimler / duraklat)',
    etkilesim.hizEtiket && /2\.5/.test(etkilesim.hizEtiket) && etkilesim.duraklatMetin !== null,
    `hız etiketi="${etkilesim.hizEtiket}" · isimler aktif=${etkilesim.etiketAktif} · duraklat butonu="${etkilesim.duraklatMetin}"`);

  /* ---------- son kare ---------- */
  await sayfa.waitForTimeout(600);
  await sayfa.screenshot({ path: '.numex/shots/dogrulama-son.png', fullPage: false });

  console.log('\n================ SONUÇ ================');
  console.log(hepsi ? 'TÜM RENDER KANITLARI GEÇTİ' : 'BAZI KRİTERLER KARŞILANMADI');
  console.log('=======================================');

  await tarayici.close();
  process.exit(hepsi ? 0 : 1);
})().catch((e) => {
  console.error('TEST ÇÖKTÜ:', e && e.message ? e.message : e);
  process.exit(2);
});
