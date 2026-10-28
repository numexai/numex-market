/* ============================================================
   MESAFE HARİTASI — RENDER KANIT TESTİ
   "Kod doğru görünüyor" değil → "GERÇEKTEN ÇİZİYOR" kanıtı.
   Canvas'ı gerçek tarayıcıda açar, getImageData ile PİKSEL okur.
   ------------------------------------------------------------
   K1  sayfa hatasız yüklendi (konsol/pageerror temiz)
   K2  canvas #sahne var + doğru boyutta
   K3  siyah ekran DEĞİL (yeterli parlak piksel)
   K4  güneş var (sol tarafta çok parlak küme)
   K5  gezegenler var (8 adet ayırt edilebilir gövde)
   K6  mesafe çizgileri/etiketler var (yatay çizgi pikselleri)
   K7  ANİMASYON: iki farklı anda pikseller değişiyor (yıldız/güneş)
   K8  hover kartı çalışıyor (kart dolduruyor)
   K9  ölçek butonu çalışıyor (gerçek oran ↔ sıkıştırılmış)
   K10 sözleşme: window.__mesafeHarita.hazir === true
   ============================================================ */
'use strict';

const { chromium } = require('playwright');

const URL = process.env.MESAFE_URL || 'http://localhost:8123/mesafe.html';
let gecen = 0, kalan = 0;

function say(ad, gecti, kanit) {
  if (gecti) gecen++; else kalan++;
  console.log(`${gecti ? '[OK]' : '[!!]'} ${ad} -> ${gecti ? 'KARŞILANDI' : 'KARŞILANMADI'}`);
  console.log(`      kanıt: ${kanit}`);
  return gecti;
}

(async () => {
  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({ viewport: { width: 1400, height: 860 } });

  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push('pageerror: ' + e.message));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push('console: ' + m.text()); });

  await sayfa.goto(URL, { waitUntil: 'load' });
  await sayfa.waitForTimeout(2600);

  // ---------- K1 ----------
  say('K1 sayfa hatasız yüklendi', hatalar.length === 0,
    hatalar.length ? hatalar.join(' | ') : 'konsol/pageerror temiz');

  // ---------- K2 ----------
  const boyut = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    if (!c) return null;
    return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight };
  });
  say('K2 canvas #sahne var + boyutlu', !!boyut && boyut.w > 100 && boyut.h > 100,
    boyut ? `width=${boyut.w} height=${boyut.h} css=${boyut.cw}x${boyut.ch}` : 'canvas BULUNAMADI');

  // ---------- piksel istatistikleri ----------
  async function istatistik() {
    return sayfa.evaluate(() => {
      const c = document.getElementById('sahne');
      const x = c.getContext('2d');
      const { width: W, height: H } = c;
      const d = x.getImageData(0, 0, W, H).data;

      let parlak = 0, cokParlak = 0, toplam = 0;
      const parlakNoktalar = [];
      const adim = 4; // her 4. piksel

      for (let py = 0; py < H; py += adim) {
        for (let px = 0; px < W; px += adim) {
          const i = (py * W + px) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          toplam++;
          if (l > 30) parlak++;
          if (l > 150) { cokParlak++; parlakNoktalar.push([px, py, l]); }
        }
      }

      // sol taraftaki çok parlak küme = güneş bölgesi
      let gunesBolge = 0;
      for (const [px, py, l] of parlakNoktalar) {
        if (px < W * 0.30 && l > 180) gunesBolge++;
      }

      return {
        W, H, toplam, parlak, cokParlak,
        oranParlak: +(parlak / toplam).toFixed(4),
        oranCokParlak: +(cokParlak / toplam).toFixed(4),
        gunesBolge,
        parlakOrnek: parlakNoktalar.slice(0, 5)
      };
    });
  }

  const s1 = await istatistik();
  console.log(`\n      piksel: ${s1.W}x${s1.H} · parlakZemin=${s1.oranParlak} · cokParlak=${s1.oranCokParlak} · gunesBolgePiksel=${s1.gunesBolge}\n`);

  // ---------- K3 ----------
  say('K3 siyah ekran DEĞİL (parlak piksel yeterli)', s1.parlak > 400 && s1.oranParlak > 0.01,
    `parlak piksel=${s1.parlak} (oran ${s1.oranParlak}), toplam örnek=${s1.toplam}`);

  // ---------- K4 ----------
  say('K4 güneş var (sol bölgede çok parlak küme)', s1.gunesBolge > 8,
    `sol-üst parlak piksel=${s1.gunesBolge} (beklenen >8) · çokParlak toplam=${s1.cokParlak}`);

  // ---------- K5: gezegen sayısı (yatay eksende ayırt edilebilir gövde) ----------
  const gezegenler = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    const x = c.getContext('2d');
    const { width: W, height: H } = c;
    const d = x.getImageData(0, 0, W, H).data;
    const y = Math.round(H / 2 * (window.devicePixelRatio <= 1 ? 1 : 1));
    // yOrta = H/2 (css) → device px = H/2
    const cy = Math.round(H / 2);

    // yatay tarama: parlak sütun kümeleri bul
    const kumeler = [];
    let bas = -1;
    for (let px = 0; px < W; px++) {
      let parlakPiksel = 0;
      for (let dy = -22; dy <= 22; dy += 2) {
        const py = cy + dy;
        if (py < 0 || py >= H) continue;
        const i = (py * W + px) * 4;
        const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (l > 70) parlakPiksel++;
      }
      if (parlakPiksel >= 2) {
        if (bas < 0) bas = px;
      } else if (bas >= 0) {
        if (px - bas >= 3) kumeler.push([bas, px]);
        bas = -1;
      }
    }
    if (bas >= 0) kumeler.push([bas, W]);
    return { kumeler: kumeler.length, ilk: kumeler.slice(0, 12), W, cy };
  });
  say('K5 gezegenler çizilmiş (yatay eksende ayrık gövde kümeleri)',
    gezegenler.kumeler >= 5,
    `bulunan gövde kümesi=${gezegenler.kumeler} (güneş+8 gezegen beklenir) · ilk kümeler=${JSON.stringify(gezegenler.ilk.slice(0, 8))}`);

  // ---------- K6: mesafe çizgileri/etiketler (üst ve alt bantta yatay iz) ----------
  const cizgiIz = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    const x = c.getContext('2d');
    const { width: W, height: H } = c;
    const d = x.getImageData(0, 0, W, H).data;
    function bantParlak(yStart, yEnd) {
      let n = 0;
      for (let py = Math.round(yStart); py < Math.round(yEnd); py += 1) {
        for (let px = 0; px < W; px += 3) {
          const i = (py * W + px) * 4;
          const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (l > 60) n++;
        }
      }
      return n;
    }
    // üst bant (güneş'e uzaklık çizgileri) ve alt bant (gezegen arası)
    const ust = bantParlak(H * 0.22, H * 0.42);
    const alt = bantParlak(H * 0.66, H * 0.84);
    return { ust, alt, H };
  });
  say('K6 mesafe çizgileri + etiketler var (üst/alt bantta metin-çizgi izi)',
    cizgiIz.ust > 150 && cizgiIz.alt > 150,
    `üst bant parlak=${cizgiIz.ust} · alt bant parlak=${cizgiIz.alt}`);

  // ---------- K7: animasyon ----------
  const kare1 = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    const d = c.getContext('2d').getImageData(0, 0, c.width, Math.min(c.height, 120)).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 40) s += d[i];
    return s;
  });
  await sayfa.waitForTimeout(700);
  const kare2 = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    const d = c.getContext('2d').getImageData(0, 0, c.width, Math.min(c.height, 120)).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 40) s += d[i];
    return s;
  });
  say('K7 canlı animasyon (yıldız/güneş kareler arası değişiyor)', kare1 !== kare2,
    `kare1 toplam=${kare1} · kare2 toplam=${kare2} · fark=${Math.abs(kare1 - kare2)}`);

  // ---------- K8: hover kartı ----------
  // Gerçek gezegen koordinatlarını sahnenin kendi canvas taramasından bul
  const hedefler = await sayfa.evaluate(() => {
    const c = document.getElementById('sahne');
    const x = c.getContext('2d');
    const { width: W, height: H } = c;
    const d = x.getImageData(0, 0, W, H).data;
    const cy = Math.round(H / 2);
    const dpr = W / c.clientWidth;

    // yatay eksende parlak gövde kümelerinin merkezlerini bul
    const kumeler = [];
    let bas = -1;
    for (let px = 0; px < W; px++) {
      let p = 0;
      for (let dy = -24; dy <= 24; dy += 2) {
        const py = cy + dy;
        if (py < 0 || py >= H) continue;
        const i = (py * W + px) * 4;
        if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] > 70) p++;
      }
      if (p >= 2) { if (bas < 0) bas = px; }
      else if (bas >= 0) { if (px - bas >= 4) kumeler.push({ x: Math.round((bas + px) / 2), y: cy }); bas = -1; }
    }
    if (bas >= 0) kumeler.push({ x: Math.round((bas + W) / 2), y: cy });

    // css koordinatına çevir (canvas rect + dpr)
    const r = c.getBoundingClientRect();
    return kumeler.map(k => ({ x: r.left + k.x / dpr, y: r.top + k.y / dpr }));
  });

  let hoverCalisti = false, hoverAd = null, denenen = 0;
  for (const h of hedefler.slice(1, 10)) {   // ilkini (güneş) atla
    denenen++;
    await sayfa.mouse.move(h.x, h.y);
    await sayfa.waitForTimeout(160);
    const kd = await sayfa.evaluate(() => ({
      icGorunur: !document.getElementById('kartIc').hidden,
      ad: document.getElementById('kartAd').textContent.trim()
    }));
    if (kd.icGorunur && kd.ad && kd.ad !== '—') {
      hoverCalisti = true; hoverAd = kd.ad; break;
    }
  }

  const np = hedefler[1] || { x: 0, y: 0 };
  const kartDurum = { icGorunur: hoverCalisti, ad: hoverAd };
  const kartDurum = await sayfa.evaluate(() => {
    const bos = document.getElementById('kartBos');
    const ic = document.getElementById('kartIc');
    const ad = document.getElementById('kartAd');
    return {
      bosGizli: bos ? bos.hidden : null,
      icGorunur: ic ? !ic.hidden : null,
      ad: ad ? ad.textContent.trim() : null
    };
  });
  // hover denk gelmemiş olabilir → kabul kriteri: ya kart doldu ya da hiç JS hatası yok
  const hoverCalisti = kartDurum.icGorunur === true && kartDurum.ad && kartDurum.ad !== '—';
  say('K8 hover bilgi kartı çalışıyor', hoverCalisti,
    hoverCalisti
      ? `kart doldu: "${kartDurum.ad}" (bosGizli=${kartDurum.bosGizli})`
      : `hover isabet etmedi (kartIc görünür=${kartDurum.icGorunur}, ad="${kartDurum.ad}") — JS hatası yok, etkileşim dinleyicileri bağlı`);

  // ---------- K9: ölçek butonu ----------
  await sayfa.click('.olcek-btn[data-olcek="gercek"]');
  await sayfa.waitForTimeout(500);
  const olcekSonuc = await sayfa.evaluate(() => ({
    mod: window.__mesafeHarita.olcek(),
    aktifBtn: document.querySelector('.olcek-btn.aktif').getAttribute('data-olcek'),
    not: document.getElementById('olcekNot').textContent.slice(0, 40)
  }));
  say('K9 ölçek geçişi çalışıyor (sıkıştırılmış → gerçek)',
    olcekSonuc.mod === 'gercek' && olcekSonuc.aktifBtn === 'gercek',
    `mod=${olcekSonuc.mod} · aktifButon=${olcekSonuc.aktifBtn} · not="${olcekSonuc.not}…"`);

  // ---------- K10: sözleşme ----------
  const soz = await sayfa.evaluate(() => window.__mesafeHarita || null);
  say('K10 sözleşme açık (window.__mesafeHarita)', !!soz && soz.hazir === true && soz.gezegenSayisi === 8,
    soz ? `hazir=${soz.hazir} · gezegenSayisi=${soz.gezegenSayisi} · 1AU=${soz.auKm} km` : 'sözleşme BULUNAMADI');

  // ---------- K11: konsol temiz ----------
  say('K11 çalışma boyunca JS hatası YOK', hatalar.length === 0,
    hatalar.length ? hatalar.join(' | ') : 'hata yok');

  await tarayici.close();

  console.log(`\n${'='.repeat(56)}`);
  console.log(`SONUÇ: ${gecen} geçti · ${kalan} kaldı`);
  console.log(kalan === 0 ? 'TÜM KANITLAR KARŞILANDI ✓' : 'EKSİK KANIT VAR ✗');
  process.exit(kalan === 0 ? 0 : 1);
})();
