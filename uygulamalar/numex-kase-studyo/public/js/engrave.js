/* ============================================================
   NUMEX KAŞE STÜDYO — GERÇEK ENGRAVE MOTORU (raster fill)
   ------------------------------------------------------------
   NEDEN VAR (2026-09-12, kök): eski G-code her harfi BOŞ DİKDÖRTGEN
   olarak çiziyordu (server.js:gcodeUret 4-köşe kutu) → makinede
   "İŞYERİ ADI" değil yan yana kutular yanıyordu. Ekran gerçek fontu
   gösteriyor ama çıktı sahteydi.

   ÇÖZÜM: Tasarımı (gerçek fontla) offscreen bitmap'e döküp SATIR SATIR
   tarıyoruz (raster). Siyah piksellerin üstünde lazeri M4 ile yakıyoruz,
   boşlukta G0 ile atlıyoruz. Böylece EKRANDA NE VARSA O YANAR (WYSIWYG) —
   gerçek harfler. LightBurn'ün "Fill/Scan" moduyla aynı mantık.

   Modlar:
   • 'kase'   : AYNA + NEGATİF — zemini kazır, harfler KABARIK kalır,
                mürekkeple basınca düz okunur (gerçek kaşe/damga).
   • 'kazima' : POZİTİF — harfleri doğrudan kazır (yüzey markalama, ayna yok).
   • 'kesme'  : VEKTÖR — dikdörtgen/çerçeve kenarlarını keser (delip çıkarır).

   Makine: Creality Falcon2 Pro 40W · GRBL · $32=1 lazer modu · M4 dinamik güç.
   ============================================================ */
'use strict';
(function (glob) {

  const SURUM = '2.0.0';

  /* mm cinsinden tasarım sınır kutusu (tüm nesneleri kapsar). */
  function sinirKutu(nesneler, kutuFn) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const o of nesneler) {
      const k = kutuFn(o);
      x0 = Math.min(x0, k.x); y0 = Math.min(y0, k.y);
      x1 = Math.max(x1, k.x + k.g); y1 = Math.max(y1, k.y + k.h);
    }
    if (!isFinite(x0)) return null;
    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }

  /* Tasarımı offscreen canvas'a çizer (SİYAH tasarım / BEYAZ zemin).
     alan: {x,y,w,h} mm — çizim penceresi (genelde sınır + pay, ya da çerçeve).
     res : px/mm (çözünürlük; aralık'tan türetilir).
     ayna: true ise TÜM plaka yatay çevrilir (kaşe basınca düz okunsun). */
  function bitmapCiz(nesneler, alan, res, ayna, kutuFn) {
    const W = Math.max(1, Math.round(alan.w * res));
    const H = Math.max(1, Math.round(alan.h * res));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000'; c.strokeStyle = '#000';

    const X = (m) => (m - alan.x) * res;
    const Y = (m) => (m - alan.y) * res;
    const SC = (m) => m * res;

    for (const o of nesneler) {
      c.save();
      // Nesne kendi merkezinde döndürülmüşse (aci) uygula
      if (o.aci) {
        const k = kutuFn(o);
        c.translate(X(k.x + k.g / 2), Y(k.y + k.h / 2));
        c.rotate(o.aci * Math.PI / 180);
        c.translate(-X(k.x + k.g / 2), -Y(k.y + k.h / 2));
      }
      if (o.tip === 'metin') {
        // "Boy" = GERÇEK harf yüksekliği olsun (9mm gir → 9mm yan). Font em'i,
        // metnin ÖLÇÜLEN mürekkep yüksekliği = boy olacak şekilde ölçeklenir.
        // (Aksi halde büyük harf cap-height ~0.7×em → 9mm ayar 6.3mm yanardı.)
        const font = (o.font || 'sans-serif');
        const kalin = o.kalin ? 'bold ' : '';
        const hedefPx = o.boy * res;
        let em = hedefPx;
        c.font = kalin + em + 'px ' + font;
        let m = c.measureText(o.icerik || '');
        let inkH = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
        if (inkH > 0.5) {
          em = em * (hedefPx / inkH);
          c.font = kalin + em + 'px ' + font;
          m = c.measureText(o.icerik || '');
          inkH = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
        }
        // Mürekkebin ÜST kenarı o.y'ye otursun (alphabetic baseline + ascent kaydırma)
        const asc = m.actualBoundingBoxAscent || em * 0.8;
        c.textBaseline = 'alphabetic';
        c.fillText(o.icerik || '', X(o.x), Y(o.y) + asc);
      } else if (o.tip === 'cizgi') {
        c.lineWidth = Math.max(1, SC((o.boy || 1) * 0.25));
        c.beginPath(); c.moveTo(X(o.x), Y(o.y)); c.lineTo(X(o.x + o.g), Y(o.y + o.h)); c.stroke();
      } else if (o.tip === 'dikdortgen') {
        c.lineWidth = Math.max(1, SC((o.boy || 1) * 0.18));
        c.strokeRect(X(o.x), Y(o.y), SC(o.g), SC(o.h));
      } else if (o.tip === 'logo') {
        const cx = X(o.x + o.g / 2), cy = Y(o.y + o.h / 2);
        const r = SC(Math.min(o.g, o.h) / 2) * 0.8;
        c.lineWidth = Math.max(1, SC((o.boy || 1) * 0.16));
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
        c.beginPath();
        c.moveTo(cx, cy - r); c.lineTo(cx, cy + r);
        c.moveTo(cx - r, cy); c.lineTo(cx + r, cy);
        c.stroke();
      }
      c.restore();
    }

    let out = cv;
    if (ayna) {
      const cv2 = document.createElement('canvas');
      cv2.width = W; cv2.height = H;
      const c2 = cv2.getContext('2d', { willReadFrequently: true });
      c2.translate(W, 0); c2.scale(-1, 1);
      c2.drawImage(cv, 0, 0);
      out = cv2;
    }
    return { canvas: out, W, H };
  }

  /* Bir bitmap satırındaki (py) yakılacak "koşu"ları (run) bulur.
     negatif=true → BEYAZ (zemin) yakılır (kabartma); false → SİYAH (harf) yakılır. */
  function satirKosulari(data, W, py, negatif) {
    const runs = [];
    let bas = -1;
    for (let px = 0; px < W; px++) {
      const i = (py * W + px) * 4;
      const lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      const yak = negatif ? (lum > 127) : (lum < 128);
      if (yak && bas < 0) bas = px;
      else if (!yak && bas >= 0) { runs.push([bas, px - 1]); bas = -1; }
    }
    if (bas >= 0) runs.push([bas, W - 1]);
    return runs;
  }

  function yuvarla(n) { return Math.round(n * 100) / 100; }

  /* ============ ANA ÜRETİCİ ============ */
  function uret(nesneler, ayar) {
    ayar = ayar || {};
    const kutuFn = ayar.kutuFn || defaultKutu;
    const mod = ayar.mod || 'kase';
    const metinList = (nesneler || []).filter((o) => o && (o.icerik || o.tip !== 'metin'));
    if (!nesneler || !nesneler.length) return { hata: 'Tablada öğe yok.' };

    const guc = clamp(ayar.guc, 1, 100, 78);
    const hiz = clamp(ayar.hiz, 1, 25000, 900);      // Falcon2 Pro 40W max ~25000 mm/dk
    const pas = clamp(ayar.pas, 1, 10, 1);
    const aralik = clamp(ayar.aralik, 0.03, 0.5, 0.10); // satır aralığı mm (spot ~0.08)
    const res = Math.max(1, Math.round(1 / aralik));  // px/mm — aralık ile eşleş
    const kesmeGuc = clamp(ayar.kesmeGuc, 1, 100, 100);
    const kesmeHiz = clamp(ayar.kesmeHiz, 1, 25000, 600);
    const kesmePas = clamp(ayar.kesmePas, 1, 20, 3);

    // Kaşe plakası sınırı: çerçeve (dikdortgen) varsa onu, yoksa tasarım sınırı + pay.
    const cerceve = nesneler.find((o) => o.tip === 'dikdortgen');
    let alan;
    if (cerceve) {
      alan = { x: cerceve.x, y: cerceve.y, w: cerceve.g, h: cerceve.h };
    } else {
      const s = sinirKutu(nesneler, kutuFn);
      if (!s) return { hata: 'Çizilecek geometri yok.' };
      const pay = 2; // mm kenar payı
      alan = { x: s.x - pay, y: s.y - pay, w: s.w + 2 * pay, h: s.h + 2 * pay };
    }

    const L = [];
    L.push('; NUMEX KAŞE STÜDYO — gerçek engrave (raster)');
    L.push('; Motor: engrave.js v' + SURUM + '  |  Makine: Creality Falcon2 Pro 40W');
    L.push('; Tarih: ' + new Date().toISOString());
    L.push('; Mod: ' + mod + (mod === 'kase' ? ' (ayna + negatif — harfler kabarık)' : ''));
    L.push('; Islem alani: ' + yuvarla(alan.w) + ' x ' + yuvarla(alan.h) + ' mm @ ' + yuvarla(alan.x) + ',' + yuvarla(alan.y));
    L.push('; Cozunurluk: ' + res + ' px/mm (satir araligi ' + aralik + ' mm)');
    /* Makinenin KENDİ çalıştırdığı format (flash bellekteki LightBurn/Creality
       40W örnekleriyle birebir): G54 = İŞ koordinatı → HOME gerekmez, origin
       kullanıcının koyduğu yerdir. M4 bir kez → dinamik güç; hareketlerde G0=lazer
       kapalı, G1 S..=yakma. $32/$X/mutlak-0,0 YOK (ALARM'ın kökü buydu). */
    L.push('G00 G17 G40 G21 G54 ; kurulum (LightBurn/Creality 40W uyumlu)');
    L.push('G90 ; mutlak konum');
    L.push('M4 ; dinamik lazer modu (guc hiza gore ayarlanir)');

    if (mod === 'kesme') {
      vektorKes(L, nesneler, kutuFn, kesmeGuc, kesmeHiz, kesmePas, !!ayar.ayna, alan);
    } else {
      // Raster: kase => ayna + negatif; kazima => pozitif, ayna yok
      const ayna = mod === 'kase' ? true : !!ayar.ayna;
      const negatif = mod === 'kase';
      const bmp = bitmapCiz(nesneler, alan, res, ayna, kutuFn);
      const data = bmp.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, bmp.W, bmp.H).data;
      const S = Math.max(1, Math.min(1000, Math.round(guc * 10)));
      const F = Math.round(hiz);
      const stepPx = Math.max(1, Math.round(aralik * res)); // = 1 (res=1/aralik)
      let toplamKosu = 0;

      for (let p = 0; p < pas; p++) {
        L.push('; --- gecis ' + (p + 1) + '/' + pas + ' ---');
        let dir = 1;
        for (let py = 0; py < bmp.H; py += stepPx) {
          const ymm = alan.y + py / res;
          let runs = satirKosulari(data, bmp.W, py, negatif);
          if (!runs.length) { dir = -dir; continue; }
          if (dir < 0) runs = runs.slice().reverse();
          for (const r of runs) {
            // bidirectional: sağ→sol turda run'ı ters yak
            const xaMm = alan.x + (dir > 0 ? r[0] : r[1] + 1) / res;
            const xbMm = alan.x + (dir > 0 ? r[1] + 1 : r[0]) / res;
            L.push('G0 X' + yuvarla(xaMm) + ' Y' + yuvarla(ymm));                       // hizli git (M4'te lazer kapali)
            L.push('G1 X' + yuvarla(xbMm) + ' Y' + yuvarla(ymm) + ' S' + S + ' F' + F); // yak (S=guc)
            L.push('G1 S0');                                                            // koşu sonu: güç sıfır (travel kapalı)
            toplamKosu++;
          }
          dir = -dir;
        }
      }
      L.push('; toplam yakma kosusu: ' + toplamKosu);
    }

    L.push('G1 S0 ; guc sifir');
    L.push('M5 ; lazer kapali');
    L.push('G90');
    L.push('G0 X0 Y0 ; baslangica don');
    L.push('M2 ; program sonu');
    return { gcode: L.join('\n') + '\n', alan: alan, mod: mod };
  }

  /* Vektör kesim: dikdörtgen çerçeveleri kenar boyunca keser (çok pas). */
  function vektorKes(L, nesneler, kutuFn, guc, hiz, pas, ayna, alan) {
    const S = Math.max(1, Math.min(1000, Math.round(guc * 10)));
    const F = Math.round(hiz);
    const mx = (x) => ayna ? yuvarla(2 * alan.x + alan.w - x) : yuvarla(x); // ayna: X'i plaka etrafında çevir
    const dikdortgenler = nesneler.filter((o) => o.tip === 'dikdortgen' || o.tip === 'cizgi');
    if (!dikdortgenler.length) { L.push('; KESME: kesilecek çerçeve/çizgi yok.'); return; }
    for (const o of dikdortgenler) {
      L.push('; kesim: ' + o.tip);
      const pts = o.tip === 'cizgi'
        ? [[o.x, o.y], [o.x + o.g, o.y + o.h]]
        : [[o.x, o.y], [o.x + o.g, o.y], [o.x + o.g, o.y + o.h], [o.x, o.y + o.h], [o.x, o.y]];
      for (let p = 0; p < pas; p++) {
        L.push('; kesim gecis ' + (p + 1) + '/' + pas);
        L.push('G0 X' + mx(pts[0][0]) + ' Y' + yuvarla(pts[0][1]));
        for (let i = 1; i < pts.length; i++) L.push('G1 X' + mx(pts[i][0]) + ' Y' + yuvarla(pts[i][1]) + ' S' + S + ' F' + F);
        L.push('G1 S0');
      }
    }
  }

  function clamp(v, lo, hi, def) {
    v = Number(v);
    if (!isFinite(v)) return def;
    return Math.max(lo, Math.min(hi, v));
  }
  /* Fallback kutu (index.html nesneKutu verilmezse) — kaba tahmin. */
  function defaultKutu(o) {
    if (o.tip === 'metin') {
      const n = String(o.icerik || '').length || 1;
      return { x: o.x, y: o.y, g: n * o.boy * 0.6, h: o.boy };
    }
    return { x: o.x, y: o.y, g: o.g || o.boy || 1, h: o.h || o.boy || 1 };
  }

  glob.Engrave = { uret, bitmapCiz, sinirKutu, SURUM };

})(typeof window !== 'undefined' ? window : globalThis);
