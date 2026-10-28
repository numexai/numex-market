/* ============================================================
   NUMEX KAŞE — LAZER SİMÜLASYONU
   TEST ve YAZ tuşlarının ortak motoru.
   Lazer kafası gerçekten gezer, çizgi canlı canlı oluşur.
   ============================================================ */
'use strict';

/**
 * Simülasyon kurucusu.
 * @param {object} c0 { S, PX, MM, ciz, arayuzGuncelle, nesneKutu, gcodeUret, uyariGoster, durumPilAyarla }
 */
function SimulasyonKur(c0){
  const { S, PX, ciz, nesneKutu, uyariGoster, durumPilAyarla } = c0;

  /* Aktif koşu */
  let kosu = null;   // { mod, cizgiler, i, j, nokta, t0, hiz, bitti, onBitti }

  /* ----------------------------------------------------------
     Nesneden çizim YOLU üret — makinenin gerçekten gideceği hat
     Dönüş: [{ x, y }, ...] mm dizisi (kesintisiz yol)
     ---------------------------------------------------------- */
  function nesneYolu(o){
    const k = nesneKutu(o);
    const yol = [];
    const a  = (o.aci || 0) * Math.PI / 180;
    const dondur = (x, y) => ({
      x: k.cx + (x - k.cx) * Math.cos(a) - (y - k.cy) * Math.sin(a),
      y: k.cy + (x - k.cx) * Math.sin(a) + (y - k.cy) * Math.cos(a)
    });

    if (o.tip === 'metin'){
      // Metin: harf harf tarama şeritleri (gerçek raster hattı gibi)
      const satirlar = String(o.icerik || '').split('\n');
      /* boy = harfin gerçek yüksekliği (mm). İlk satır tam boy kadar;
         sonraki satırlar SATIR_PAYI kadar aşağı iner. */
      const satirH = (o.boy || 10) * 1.35;
      const ilkBoy = (o.boy || 10);
      let imlec = { x: k.x, y: k.y };
      satirlar.forEach(sat => {
        const harfler = [...sat];
        const harfG = (o.boy || 10) * 0.62;
        let cc = imlec.x;
        harfler.forEach((h, hi) => {
          const hg = h === ' ' ? harfG * .5 : harfG;
          // her harfi 3 dikey şeritle gez
          const serit = Math.max(2, Math.round(hg / 0.6));
          for (let s = 0; s < serit; s++){
            const xx = cc + (s / serit) * hg;
            const ust = dondur(xx, imlec.y + (hi % 2 === 0 ? 0 : satirH));
            const alt = dondur(xx + hg / serit, imlec.y + (hi % 2 === 0 ? satirH : 0));
            yol.push(ust); yol.push(alt);
          }
          cc += hg + (h === ' ' ? harfG * .3 : 0);
        });
        imlec = { x: k.x, y: imlec.y + satirH };
      });
      if (!yol.length) { yol.push({ x:k.x, y:k.y }); yol.push({ x:k.x + k.w, y:k.y + k.h }); }
    }
    else if (o.tip === 'cizgi'){
      yol.push(dondur(k.x, k.y));
      yol.push(dondur(k.x + k.w, k.y + k.h));
    }
    else if (o.tip === 'dikdortgen'){
      [[k.x,k.y],[k.x+k.w,k.y],[k.x+k.w,k.y+k.h],[k.x,k.y+k.h],[k.x,k.y]]
        .forEach(p => yol.push(dondur(p[0], p[1])));
    }
    else if (o.tip === 'logo'){
      const cx = k.cx, cy = k.cy, r = Math.min(k.w, k.h) / 2;
      const adim = 48;
      for (let i = 0; i <= adim; i++){
        const t = (i / adim) * Math.PI * 2;
        yol.push(dondur(cx + Math.cos(t) * r, cy + Math.sin(t) * r));
      }
    }
    return yol;
  }

  /* Tüm iş için yol parçaları: her nesne ayrı, parametreleriyle */
  function tumYollar(){
    return S.nesneler.map(o => ({
      nesne : o,
      yol   : nesneYolu(o),
      guc   : o.guc   != null ? o.guc   : 50,
      hiz   : o.hiz   != null ? o.hiz   : 1000,
      pas   : o.pas   != null ? o.pas   : 1
    }));
  }

  /* Tahmini süre (saniye): yol uzunluğu / hız, pas ile çarpılır */
  function sureHesapla(parcalar){
    let saniye = 0, toplamMm = 0;
    parcalar.forEach(p => {
      let mm = 0;
      for (let i = 1; i < p.yol.length; i++)
        mm += Math.hypot(p.yol[i].x - p.yol[i-1].x, p.yol[i].y - p.yol[i-1].y);
      toplamMm += mm;
      saniye += (mm / Math.max(50, p.hiz)) * 60 * Math.max(1, p.pas);
    });
    // konumlanma + ivme payı
    saniye += parcalar.length * 1.6 + 2;
    return { saniye: Math.round(saniye), toplamMm: Math.round(toplamMm) };
  }

  /* ----------------------------------------------------------
     TEST — düşük güçle iz bırakma koşusu (kırmızı)
     ---------------------------------------------------------- */
  function testBaslat(nesneOzel){
    const liste = nesneOzel ? [nesneOzel] : S.nesneler;
    if (!liste.length){ uyariGoster('Önce tablaya bir şey ekle.'); return null; }

    const parcalar = liste.map(o => ({ nesne:o, yol:nesneYolu(o), guc:8, hiz:900, pas:1 }));
    kosu = {
      mod: 'test',
      parcalar,
      pi: 0, nokta: 0,
      izlenen: [],           // çizilmiş yol noktaları
      hiz: 0.9,              // oynatma çarpanı
      t0: performance.now(),
      bitti: false
    };
    durumPilAyarla('test');
    ciz();
    dongu();
    return kosu;
  }

  /* ----------------------------------------------------------
     YAZ — her öğeyi kendi gücüyle markalama koşusu
     ---------------------------------------------------------- */
  function yazBaslat(){
    if (!S.nesneler.length){ uyariGoster('Tablada öğe yok.'); return null; }
    const parcalar = tumYollar();
    kosu = {
      mod: 'yaz',
      parcalar,
      pi: 0, nokta: 0,
      izlenen: [],
      hiz: 1.6,
      t0: performance.now(),
      bitti: false
    };
    durumPilAyarla('calisiyor');
    ciz();
    dongu();
    return kosu;
  }

  /* ----------------------------------------------------------
     ANİMASYON DÖNGÜSÜ — her karede yolu biraz daha çiz
     ---------------------------------------------------------- */
  function dongu(){
    if (!kosu || kosu.bitti) return;
    const gecen = (performance.now() - kosu.t0) / 1000;
    const hedefNokta = Math.floor(gecen * 520 * kosu.hiz);   // saniyede ~520 yol noktası

    let toplam = 0;
    let bitisNokta = 0;
    for (const p of kosu.parcalar) toplam += p.yol.length;

    // hedefe kadar noktaları izlenen listesine taşı
    let kalan = hedefNokta - bitisNokta;
    while (kalan > 0 && kosu.pi < kosu.parcalar.length){
      const p = kosu.parcalar[kosu.pi];
      const alinabilir = Math.min(kalan, p.yol.length - kosu.nokta);
      for (let i = 0; i < alinabilir; i++){
        kosu.izlenen.push({ x:p.yol[kosu.nokta + i].x, y:p.yol[kosu.nokta + i].y, nesne:p.nesne });
      }
      kosu.nokta += alinabilir;
      kalan -= alinabilir;
      if (kosu.nokta >= p.yol.length){ kosu.pi++; kosu.nokta = 0; }
    }

    ciz();

    if (kosu.pi >= kosu.parcalar.length){
      kosu.bitti = true;
      durumPilAyarla('hazir');
      if (kosu.mod === 'yaz' && kosu.tamamla) kosu.tamamla(kosu);
      return;
    }
    requestAnimationFrame(dongu);
  }

  /* ----------------------------------------------------------
     DURDUR / TEMİZLE
     ---------------------------------------------------------- */
  function durdur(){
    if (!kosu) return;
    kosu.bitti = true;
    uyariGoster('Simülasyon durduruldu.');
    durumPilAyarla('hazir');
    ciz();
  }

  function temizle(){
    durdur();
    kosu = null;
    ciz();
  }

  function aktifMi(){ return !!kosu && !kosu.bitti; }
  function izlenenNoktalar(){ return kosu ? kosu.izlenen : []; }
  function guncelNokta(){
    if (!kosu || !kosu.izlenen.length) return null;
    return kosu.izlenen[kosu.izlenen.length - 1];
  }

  return {
    testBaslat, yazBaslat, durdur, temizle,
    aktifMi, izlenenNoktalar, guncelNokta,
    nesneYolu, tumYollar, sureHesapla
  };
}

window.SimulasyonKur = SimulasyonKur;
