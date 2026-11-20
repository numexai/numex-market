/* NUMEX KÖKLER — Çekirdek: akrabalık motoru, doğrulayıcı, dışa aktarma
   Tarayıcıda window.NK olarak, Node'da module.exports olarak çalışır. */
(function (kok) {
  'use strict';

  /* ---------------- Yardımcılar ---------------- */
  const yil = (t) => {
    if (t === null || t === undefined || t === '') return null;
    const m = String(t).trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return NaN;
    const y = +m[1];
    if (m[2] && (+m[2] < 1 || +m[2] > 12)) return NaN;
    if (m[3] && (+m[3] < 1 || +m[3] > 31)) return NaN;
    return y;
  };
  const canli = (k) => !k.olum;
  const simdiYil = () => new Date().getFullYear();

  /* ---------------- Aile indeksi ---------------- */
  function indeksKur(veri) {
    const kisiler = new Map();
    (veri.kisiler || []).forEach((k) => { if (k && k.id) kisiler.set(k.id, k); });
    const evlilikler = (veri.evlilikler || []).slice();
    const esler = new Map();   // id -> [esId]
    const evliliklerMap = new Map();
    evlilikler.forEach((e) => {
      evliliklerMap.set(e.id, e);
      if (!esler.has(e.a)) esler.set(e.a, []);
      if (!esler.has(e.b)) esler.set(e.b, []);
      esler.get(e.a).push(e.b);
      esler.get(e.b).push(e.a);
    });
    const cocuklar = new Map(); // ebeveynId -> [cocukId]
    kisiler.forEach((k) => {
      [k.anneId, k.babaId].forEach((p) => {
        if (!p) return;
        if (!cocuklar.has(p)) cocuklar.set(p, []);
        cocuklar.get(p).push(k.id);
      });
    });
    return { kisiler, evliliklerMap, evlilikler, esler, cocuklar };
  }

  /* ---------------- Temel ilişki yardımcıları ---------------- */
  const anne = (ix, id) => { const k = ix.kisiler.get(id); return k ? (k.anneId && ix.kisiler.get(k.anneId)) || null : null; };
  const baba = (ix, id) => { const k = ix.kisiler.get(id); return k ? (k.babaId && ix.kisiler.get(k.babaId)) || null : null; };
  const esListesi = (ix, id) => (ix.esler.get(id) || []).map((e) => ix.kisiler.get(e)).filter(Boolean);
  const cocukListesi = (ix, id) => (ix.cocuklar.get(id) || []).map((c) => ix.kisiler.get(c)).filter(Boolean);
  const kardesListesi = (ix, id) => {
    const k = ix.kisiler.get(id); if (!k) return [];
    const set = new Set();
    [k.anneId, k.babaId].forEach((p) => (ix.cocuklar.get(p) || []).forEach((c) => { if (c !== id) set.add(c); }));
    return [...set].map((c) => ix.kisiler.get(c)).filter(Boolean);
  };

  /* ---------------- Atalara kısa yol (kusak mesafesi) ---------------- */
  // id'den kök atalara olan en kısa kuşak yolunu BFS ile bulur (döngüye dayanıklı)
  function atalaraMesafe(ix, id) {
    const mesafe = new Map();
    mesafe.set(id, 0); // kişinin kendisi de 0. derece (yoksa ebeveyn!=dede ayrımı kayıyor)
    const kuyruk = [[id, 0]];
    const gorulen = new Set([id]);
    while (kuyruk.length) {
      const [cur, d] = kuyruk.shift();
      const k = ix.kisiler.get(cur); if (!k) continue;
      [k.anneId, k.babaId].forEach((p) => {
        if (!p || !ix.kisiler.has(p)) return;
        if (!mesafe.has(p) || mesafe.get(p) > d + 1) mesafe.set(p, d + 1);
        if (!gorulen.has(p)) { gorulen.add(p); kuyruk.push([p, d + 1]); }
      });
    }
    return mesafe;
  }

  // İki kişi arasındaki en yakın ORTAK ATA (id -> uzaklıklar)
  function ortakAtalar(ix, a, b) {
    const ma = atalaraMesafe(ix, a);
    const mb = atalaraMesafe(ix, b);
    // Ebeveynler de "0. derece ata" sayılır: bir kişi diğerinin atası olabilir
    const sonuc = [];
    ma.forEach((da, id) => {
      // Kişilerin kendisi ortak ata sayılmaz (a=b durumu ayrıca ele alınıyor)
      if (id === a || id === b) return;
      if (mb.has(id)) sonuc.push({ id, da, db: mb.get(id), toplam: da + mb.get(id) });
    });
    return sonuc.sort((x, y) => x.toplam - y.toplam || Math.abs(x.da - x.db) - Math.abs(y.da - y.db));
  }

  // x, y'nin ATASI mı? Kaç kuşak yukarıda? { var:false } ya da { var:true, kusak:n }
  function ataUzakligi(ix, xId, yId) {
    if (xId === yId) return { var: false };
    const kuyruk = [[yId, 0]];
    const gorulen = new Set([yId]);
    while (kuyruk.length) {
      const [cur, d] = kuyruk.shift();
      const k = ix.kisiler.get(cur); if (!k) continue;
      for (const p of [k.anneId, k.babaId]) {
        if (!p || !ix.kisiler.has(p) || gorulen.has(p)) continue;
        if (p === xId) return { var: true, kusak: d + 1 };
        gorulen.add(p); kuyruk.push([p, d + 1]);
      }
    }
    return { var: false };
  }

  // x, y'nin ebeveyninin kardeşi mi? (graftan; soyadına BAKILMAZ)
  function ebeveynKardesiMi(ix, xId, yId) {
    const y = ix.kisiler.get(yId); if (!y) return false;
    const x = ix.kisiler.get(xId); if (!x) return false;
    return [y.anneId, y.babaId].some((p) => {
      if (!p || !ix.kisiler.has(p)) return false;
      return kardesListesi(ix, p).some((k) => k.id === xId);
    });
  }

  /* ---------------- Akrabalık hesaplama ---------------- */
  // Dönen: { bulundu:boolean, etiket, aciklama, kol: 'kan'|'evlilik'|null }
  function akrabalik(veri, aId, bId, derinlik) {
    derinlik = derinlik || 0;
    const ix = indeksKur(veri);
    const a = ix.kisiler.get(aId), b = ix.kisiler.get(bId);
    if (!a || !b) return { bulundu: false, etiket: null, aciklama: 'Kişilerden biri kayıtlı değil.' };
    if (aId === bId) return { bulundu: true, etiket: 'Aynı kişi', aciklama: 'Bu, kişinin kendisidir.', kol: null };

    const bAnne = b.anneId, bBaba = b.babaId;
    const aAnne = a.anneId, aBaba = a.babaId;

    // 1) Doğrudan ebeveyn / çocuk
    if (bAnne === aId || bBaba === aId) {
      return { bulundu: true, kol: 'kan', etiket: a.cinsiyet === 'E' ? 'Baba' : 'Anne',
        aciklama: `${a.ad} ${a.soyad}, ${b.ad} ${b.soyad}'in ${a.cinsiyet === 'E' ? 'babasıdır' : 'annesidir'}.` };
    }
    if (aAnne === bId || aBaba === bId) {
      return { bulundu: true, kol: 'kan', etiket: b.cinsiyet === 'E' ? 'Baba' : 'Anne',
        aciklama: `${b.ad} ${b.soyad}, ${a.ad} ${a.soyad}'in ${b.cinsiyet === 'E' ? 'babasıdır' : 'annesidir'}.` };
    }

    // 2) Kardeş — tam kardeş: İKİ ebeveyn de aynı. Tek ebeveyn ortaksa üvey/yarım kardeş.
    const tamKardes = (aAnne && aAnne === bAnne) && (aBaba && aBaba === bBaba);
    const tekEbeveyn = (aAnne && aAnne === bAnne) || (aBaba && aBaba === bBaba);
    if (tamKardes) {
      return { bulundu: true, kol: 'kan', etiket: 'Kardeş',
        aciklama: `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} kardeştir.` };
    }
    if (tekEbeveyn) {
      const ortakEbeveynId = (aAnne === bAnne) ? aAnne : aBaba;
      const oe = ix.kisiler.get(ortakEbeveynId);
      return { bulundu: true, kol: 'kan', etiket: 'Üvey kardeş',
        aciklama: `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} üvey kardeştir (ortak ebeveyn: ${oe ? oe.ad + ' ' + oe.soyad : '—'}).` };
    }

    // 3) Eş / eski eş
    const evlilik = ix.evlilikler.find((e) => (e.a === aId && e.b === bId) || (e.a === bId && e.b === aId));
    if (evlilik) {
      const bosanmis = !!evlilik.bitis;
      return { bulundu: true, kol: 'evlilik',
        etiket: bosanmis ? 'Eski eş' : 'Eş',
        aciklama: bosanmis
          ? `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} ${evlilik.baslangic}–${evlilik.bitis} yılları arasında evliydi, ayrıldılar.`
          : `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} ${evlilik.baslangic} yılından beri evlidir.` };
    }

    // 3.5) Amca / hala / dayı / teyze ve yeğen — DEDE/NİNE bloğundan ÖNCE denenir,
    // çünkü bu ilişkide ortak ata da vardır ve yanlış sınıflanabilir.
    const amcaA = ebeveynKardesiMi(ix, aId, bId);
    const amcaB = ebeveynKardesiMi(ix, bId, aId);
    if (amcaA) {
      const kanalBaba = b.babaId && kardesListesi(ix, b.babaId).some((x) => x.id === aId);
      const etiketX = a.cinsiyet === 'E' ? (kanalBaba ? 'Amca' : 'Dayı') : (kanalBaba ? 'Hala' : 'Teyze');
      return { bulundu: true, kol: 'kan', etiket: etiketX,
        aciklama: `${a.ad} ${a.soyad}, ${b.ad} ${b.soyad}'in ${etiketX.toLowerCase()}sıdır.` };
    }
    if (amcaB) {
      const kanalBaba = a.babaId && kardesListesi(ix, a.babaId).some((x) => x.id === bId);
      const etiketX = b.cinsiyet === 'E' ? (kanalBaba ? 'Amca' : 'Dayı') : (kanalBaba ? 'Hala' : 'Teyze');
      return { bulundu: true, kol: 'kan', etiket: etiketX,
        aciklama: `${b.ad} ${b.soyad}, ${a.ad} ${a.soyad}'in ${etiketX.toLowerCase()}sıdır.` };
    }
    // Yeğen — kişinin ebeveyni, diğerinin kardeşi
    const aYegen = [a.anneId, a.babaId].filter(Boolean).some((p) => kardesListesi(ix, p).some((x) => x.id === bId));
    const bYegen = [b.anneId, b.babaId].filter(Boolean).some((p) => kardesListesi(ix, p).some((x) => x.id === aId));
    if (aYegen) {
      return { bulundu: true, kol: 'kan', etiket: 'Yeğen',
        aciklama: `${a.ad} ${a.soyad}, ${b.ad} ${b.soyad}'in yeğenidir.` };
    }
    if (bYegen) {
      return { bulundu: true, kol: 'kan', etiket: 'Yeğen',
        aciklama: `${b.ad} ${b.soyad}, ${a.ad} ${a.soyad}'in yeğenidir.` };
    }

    // 4a) Ata / torun — bir kişi diğerinin atası ise (ortakAtalar bloğundan ÖNCE:
    // iki tarafın ortak atası olmasa da bu ilişki geçerli ve en doğrudan cevaptır)
    {
      const atasalMi = ataUzakligi(ix, aId, bId);
      const tersAtasal = ataUzakligi(ix, bId, aId);
      if (atasalMi.var || tersAtasal.var) {
        const ata = atasalMi.var ? a : b;
        const torun = atasalMi.var ? b : a;
        const kusakFarki = atasalMi.var ? atasalMi.kusak : tersAtasal.kusak;
        const kadin = ata.cinsiyet === 'K';
        let etiket;
        if (kusakFarki === 1) etiket = kadin ? 'Anne' : 'Baba';
        else if (kusakFarki === 2) etiket = kadin ? 'Nine' : 'Dede';
        else etiket = kadin ? 'Büyük nine' : 'Büyük dede';
        const ek = kusakFarki > 2 ? ` (${kusakFarki}. kuşak)` : '';
        return { bulundu: true, kol: 'kan', etiket,
          aciklama: `${ata.ad} ${ata.soyad}${ata.dogum ? ` (${ata.dogum})` : ''}, ${torun.ad} ${torun.soyad}’in ${etiket.toLowerCase()}sidir${ek}.` };
      }
    }

    // 4b) Ortak atalardan kan akrabalığı
    const ortak = ortakAtalar(ix, aId, bId);
    if (ortak.length) {
      // Ebeveynler zaten 1. adımda bitti; buradaki en yakın ortak ata dede/nine seviyesinde
      const en = ortak[0];
      const da = en.da, db = en.db;
      const enKucuk = Math.min(da, db), enBuyuk = Math.max(da, db);
      const bKoken = ix.kisiler.get(en.id);

      // Dede / nine / torun — bir kişi diğerinin atası ise (ortakAtalar kendini
      // dışladığı için burada AYRI kontrol edilir)
      {
        const atasalMi = ataUzakligi(ix, aId, bId); // a, b'nin atası mı? {var:true, kusak}
        const tersAtasal = ataUzakligi(ix, bId, aId);
        if (atasalMi.var || tersAtasal.var) {
          const ata = atasalMi.var ? a : b;
          const torun = atasalMi.var ? b : a;
          const kusakFarki = atasalMi.var ? atasalMi.kusak : tersAtasal.kusak;
          const kadin = ata.cinsiyet === 'K';
          let etiket;
          if (kusakFarki === 1) etiket = kadin ? 'Anne' : 'Baba';
          else if (kusakFarki === 2) etiket = kadin ? 'Nine' : 'Dede';
          else etiket = kadin ? 'Büyük nine' : 'Büyük dede';
          return { bulundu: true, kol: 'kan', etiket,
            aciklama: `${ata.ad} ${ata.soyad}${ata.dogum ? ` (${ata.dogum})` : ''}, ${torun.ad} ${torun.soyad}’in ${etiket.toLowerCase()}sidir.` };
        }
      }

      // Birinci derece kuzen
      if (da === 2 && db === 2) {
        return { bulundu: true, kol: 'kan', etiket: 'Birinci derece kuzen',
          aciklama: `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} birinci derece kuzendir (ortak ata: ${bKoken.ad} ${bKoken.soyad}).` };
      }
      // Daha uzak kuzenler
      if (da === db && da > 2) {
        return { bulundu: true, kol: 'kan', etiket: `${da - 1}. derece kuzen`,
          aciklama: `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} ${da - 1}. derece kuzendir (ortak ata: ${bKoken.ad} ${bKoken.soyad}).` };
      }
      return { bulundu: true, kol: 'kan', etiket: 'Kan akrabası',
        aciklama: `${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} ortak ata ${bKoken.ad} ${bKoken.soyad} üzerinden akrabadır (${da} ve ${db}. kuşak).` };
    }

    // 5) Kayın akrabalığı — BİR adım evliliğe bak (yalnız ilk çağrıda)
    if (derinlik > 0) return { bulundu: false, etiket: null, aciklama: 'Akrabalık bulunamadı.', kol: null };

    const akrabalikCekirdek = (xId, yId) => {
      // Evlilik adımı YAPMADAN kan akrabalığı ara (sonsuz döngü olmasın)
      const k = ix.kisiler.get(xId), y = ix.kisiler.get(yId);
      if (!k || !y) return null;
      if (y.anneId === xId || y.babaId === xId) return { etiket: k.cinsiyet === 'E' ? 'Baba' : 'Anne' };
      if (k.anneId === yId || k.babaId === yId) return { etiket: y.cinsiyet === 'E' ? 'Baba' : 'Anne' };
      if ((k.anneId && k.anneId === y.anneId) && (k.babaId && k.babaId === y.babaId)) return { etiket: 'Kardeş' };
      if (ataUzakligi(ix, xId, yId).var) return { etiket: 'Ata' };
      if (ataUzakligi(ix, yId, xId).var) return { etiket: 'Torun' };
      const ort = ortakAtalar(ix, xId, yId);
      if (ort.length) {
        const en = ort[0];
        if (en.da === 2 && en.db === 2) return { etiket: 'Birinci derece kuzen' };
        if (en.da === en.db) return { etiket: `${en.da - 1}. derece kuzen` };
        return { etiket: 'Kan akrabası' };
      }
      return null;
    };

    // a'nın eşi ↔ b arasında kan bağı var mı? (ya da tersi)
    const aEs = esListesi(ix, aId), bEs = esListesi(ix, bId);
    for (const ae of aEs) {
      const r = akrabalikCekirdek(ae.id, bId);
      if (r) {
        const etiket = kayinEtiketi(ae.cinsiyet, r.etiket);
        if (etiket) return { bulundu: true, kol: 'evlilik', etiket,
          aciklama: `${a.ad} ${a.soyad}'ın eşi ${ae.ad} ${ae.soyad}, ${b.ad} ${b.soyad}'in ${r.etiket.toLowerCase()}sidir; bu yüzden ${a.ad} ${a.soyad}, ${b.ad} ${b.soyad}'in ${etiket.toLowerCase()}idir.` };
      }
    }
    for (const be of bEs) {
      const r = akrabalikCekirdek(aId, be.id);
      if (r) {
        const etiket = kayinEtiketi(be.cinsiyet, r.etiket);
        if (etiket) return { bulundu: true, kol: 'evlilik', etiket,
          aciklama: `${b.ad} ${b.soyad}'in eşi ${be.ad} ${be.soyad}, ${a.ad} ${a.soyad}'in ${r.etiket.toLowerCase()}sidir; bu yüzden ${a.ad} ${a.soyad}, ${b.ad} ${b.soyad}'in ${etiket.toLowerCase()}idir.` };
      }
    }

    // 6) Kardeşlerin eşleri: A'nın kardeşi B'nin eşi mi / A'nın eşi B'nin kardeşi mi
    const aKardesIdleri = new Set(kardesListesi(ix, aId).map((x) => x.id));
    for (const be of bEs) {
      if (aKardesIdleri.has(be.id)) {
        const etiket = be.cinsiyet === 'E' ? 'Enişte' : 'Yenge';
        return { bulundu: true, kol: 'evlilik', etiket,
          aciklama: `${be.ad} ${be.soyad}, ${a.ad} ${a.soyad}'in kardeşinin eşidir (${etiket.toLowerCase()}), bu yüzden ${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} arasında kayın bağı vardır.` };
      }
    }
    const bKardesIdleri = new Set(kardesListesi(ix, bId).map((x) => x.id));
    for (const ae of aEs) {
      if (bKardesIdleri.has(ae.id)) {
        const etiket = ae.cinsiyet === 'E' ? 'Enişte' : 'Yenge';
        return { bulundu: true, kol: 'evlilik', etiket,
          aciklama: `${ae.ad} ${ae.soyad}, ${b.ad} ${b.soyad}'in kardeşinin eşidir (${etiket.toLowerCase()}), bu yüzden ${a.ad} ${a.soyad} ile ${b.ad} ${b.soyad} arasında kayın bağı vardır.` };
      }
    }

    return { bulundu: false, etiket: null, aciklama: 'Bu iki kişi arasında hesaplanabilir bir akrabalık bulunamadı.' };
  }

  function kayinEtiketi(esCinsiyet, kanEtiket) {
    const e = (kanEtiket || '').toLowerCase();
    if (e === 'anne') return 'Kayınvalide';
    if (e === 'baba') return 'Kayınpeder';
    if (e === 'kardeş') return esCinsiyet === 'E' ? 'Kayınbirader' : 'Baldız / görümce';
    if (e === 'amca' || e === 'dayı') return 'Kayınbirader';
    if (e === 'hala' || e === 'teyze') return 'Görümce';
    return null;
  }

  /* ---------------- Doğrulayıcı (bağımsız) ---------------- */
  function dogrula(veri) {
    const hatalar = [], uyarilar = [];
    const kisiler = veri.kisiler || [];
    const evlilikler = veri.evlilikler || [];

    // ID tekilliği
    const gorulen = new Set();
    kisiler.forEach((k) => {
      if (!k.id) hatalar.push({ tip: 'id-yok', mesaj: 'ID’si olmayan kişi var.' });
      else if (gorulen.has(k.id)) hatalar.push({ tip: 'id-tekrar', mesaj: `Aynı ID birden fazla kez kullanılmış: ${k.id}` });
      else gorulen.add(k.id);
    });

    const map = new Map(kisiler.map((k) => [k.id, k]));

    kisiler.forEach((k) => {
      // Var olmayan kişiye bağ
      [['anneId', 'anne'], ['babaId', 'baba']].forEach(([alan, ad]) => {
        const p = k[alan];
        if (p && !map.has(p)) hatalar.push({ tip: 'var-olmayan', mesaj: `${k.ad} ${k.soyad}: ${ad} olarak tanımlı ${p} kayıtlı değil.` });
        if (p === k.id) hatalar.push({ tip: 'kendi-ebeveyni', mesaj: `${k.ad} ${k.soyad} kendi ${ad}sı olarak tanımlı.` });
      });
      // Tarihler
      const dy = yil(k.dogum), oy = yil(k.olum);
      if (Number.isNaN(dy)) hatalar.push({ tip: 'tarih-bozuk', mesaj: `${k.ad} ${k.soyad}: doğum tarihi geçersiz (“${k.dogum}”).` });
      if (Number.isNaN(oy)) hatalar.push({ tip: 'tarih-bozuk', mesaj: `${k.ad} ${k.soyad}: ölüm tarihi geçersiz (“${k.olum}”).` });
      if (!Number.isNaN(dy) && !Number.isNaN(oy) && dy && oy && oy < dy) {
        hatalar.push({ tip: 'tarih-sirasi', mesaj: `${k.ad} ${k.soyad}: ölüm (${oy}) doğumdan (${dy}) önce.` });
      }
      if (!Number.isNaN(dy) && dy && dy > simdiYil()) uyarilar.push({ tip: 'gelecek-tarih', mesaj: `${k.ad} ${k.soyad}: doğum yılı gelecekte.` });
      if (!Number.isNaN(dy) && dy && oy && oy - dy > 110) uyarilar.push({ tip: 'uzun-omur', mesaj: `${k.ad} ${k.soyad} ${oy - dy} yıl yaşamış görünüyor — kontrol edin.` });
    });

    // Ebeveynlik döngüsü
    const beyaz = new Set(), gri = new Set(), siyah = new Set();
    const dfs = (id, yol) => {
      if (gri.has(id)) { hatalar.push({ tip: 'dongu', mesaj: `Ebeveynlik döngüsü: ${yol.concat(id).join(' → ')}` }); return; }
      if (siyah.has(id)) return;
      gri.add(id);
      const k = map.get(id);
      if (k) [k.anneId, k.babaId].forEach((p) => { if (p && map.has(p)) dfs(p, yol.concat(id)); });
      gri.delete(id); siyah.add(id);
    };
    map.forEach((_, id) => { if (!siyah.has(id)) dfs(id, []); });

    // Evlilikler
    const evGorulen = new Set();
    evlilikler.forEach((e) => {
      if (!e.id) hatalar.push({ tip: 'evlilik-id', mesaj: 'ID’si olmayan evlilik kaydı var.' });
      else if (evGorulen.has(e.id)) hatalar.push({ tip: 'evlilik-id-tekrar', mesaj: `Evlilik ID tekrarı: ${e.id}` });
      else evGorulen.add(e.id);
      if (e.a === e.b) hatalar.push({ tip: 'kendisiyle-evlilik', mesaj: `${e.id}: kişi kendisiyle evli görünüyor.` });
      if (!map.has(e.a)) hatalar.push({ tip: 'evlilik-kisi-yok', mesaj: `${e.id}: ${e.a} kayıtlı değil.` });
      if (!map.has(e.b)) hatalar.push({ tip: 'evlilik-kisi-yok', mesaj: `${e.id}: ${e.b} kayıtlı değil.` });
      const by = yil(e.baslangic), bt = yil(e.bitis);
      if (!Number.isNaN(by) && !Number.isNaN(bt) && by && bt && bt < by) hatalar.push({ tip: 'evlilik-tarihi', mesaj: `${e.id}: evlilik bitişi başlangıçtan önce.` });
      // Aynı iki kişi arasında çakışan evlilik
      evlilikler.forEach((o) => {
        if (o === e || !o.id || !e.id || e.id >= o.id) return;
        const ayni = (e.a === o.a && e.b === o.b) || (e.a === o.b && e.b === o.a);
        if (!ayni) return;
        const by2 = yil(o.baslangic), bt2 = yil(o.bitis);
        const bitti1 = bt || 9999, bitti2 = bt2 || 9999;
        if (by && by2 && by < bitti2 && by2 < bitti1) uyarilar.push({ tip: 'evlilik-cakisma', mesaj: `${e.id} ile ${o.id}: aynı çift arasında çakışan evlilik kayıtları.` });
      });
    });

    // Ebeveyn-çocuk yaş tutarlılığı (uyarı; silme yok)
    kisiler.forEach((k) => {
      const dy = yil(k.dogum); if (!dy) return;
      [['anneId', 'anne', 14], ['babaId', 'baba', 14]].forEach(([alan, ad, esik]) => {
        const p = map.get(k[alan]); if (!p) return;
        const py = yil(p.dogum); if (!py) return;
        const fark = dy - py;
        if (fark < esik) uyarilar.push({ tip: 'yas-tutarsiz', mesaj: `${ad} ${p.ad} ${p.soyad} çocuğu ${k.ad} ${k.soyad}’den ${fark} yaş büyük — yaşça şüpheli.` });
        if (fark > 60) uyarilar.push({ tip: 'yas-tutarsiz', mesaj: `${ad} ${p.ad} ${p.soyad}, ${k.ad} ${k.soyad} doğduğunda ${fark} yaşında — kontrol edin.` });
      });
    });

    return { hatalar, uyarilar, temiz: hatalar.length === 0 };
  }

  /* ---------------- Kuşak hesabı ---------------- */
  function kusakHaritasi(veri) {
    const ix = indeksKur(veri);
    const kusak = new Map();

    // 1) Kan bağıyla kuşak: ebeveyni olan kişi, ebeveyninin bir alt kuşağında.
    const hesapla = (id, ziyaret) => {
      if (kusak.has(id)) return kusak.get(id);
      if (ziyaret.has(id)) return 0; // döngüde sonsuz özyinelemeyi kes
      ziyaret.add(id);
      const k = ix.kisiler.get(id);
      if (!k) return 0;
      let n = 0;
      let varMi = false;
      [k.anneId, k.babaId].forEach((p) => { if (p && ix.kisiler.has(p)) { varMi = true; n = Math.max(n, hesapla(p, ziyaret) + 1); } });
      ziyaret.delete(id);
      if (varMi) kusak.set(id, n);
      return n;
    };
    // Ebeveyni olanları önce yerleştir (bunlar kesin kan kuşağı)
    const ebeveynsizler = [];
    ix.kisiler.forEach((k, id) => {
      const varMi = (k.anneId && ix.kisiler.has(k.anneId)) || (k.babaId && ix.kisiler.has(k.babaId));
      if (varMi) hesapla(id, new Set());
      else ebeveynsizler.push(id);
    });

    // 2) Ebeveynsiz kişiler (gelin/damat olarak girenler): eşinin kuşağına yerleş.
    //    Kök atalar (eşi de ebeveynsizse değil — eşi kan kuşağındaysa ona uy)
    //    Birkaç turda çözülür (zincir halinde evlilikler için 3 tur yeterli).
    let kalan = ebeveynsizler.slice();
    for (let tur = 0; tur < 6 && kalan.length; tur++) {
      const yeniKalan = [];
      kalan.forEach((id) => {
        const esler = (ix.esler.get(id) || []);
        const bilinenEs = esler.find((e) => kusak.has(e));
        if (bilinenEs !== undefined) {
          kusak.set(id, kusak.get(bilinenEs));
        } else {
          yeniKalan.push(id);
        }
      });
      if (yeniKalan.length === kalan.length) break; // ilerleme yok, döngüyü kes
      kalan = yeniKalan;
    }

    // 3) Hâlâ yerleşmeyenler (eşi de yoksa) → gerçek kök ata, 0. kuşak
    //    Ama çocukları varsa, çocuklarının kuşağının BİR ÜSTÜ olmalı.
    const kalan2 = [...ix.kisiler.keys()].filter((id) => !kusak.has(id));
    kalan2.forEach((id) => {
      const cocukKusaklar = (ix.cocuklar.get(id) || []).map((c) => kusak.get(c)).filter((n) => n !== undefined);
      if (cocukKusaklar.length) kusak.set(id, Math.min(...cocukKusaklar) - 1);
      else kusak.set(id, 0);
    });
    ix.kisiler.forEach((_, id) => { if (!kusak.has(id)) kusak.set(id, 0); });

    // 4) Negatif kuşak olmasın (kaydır)
    const enAz = Math.min(...kusak.values());
    if (enAz < 0) kusak.forEach((v, k) => kusak.set(k, v - enAz));

    return kusak;
  }

  /* ---------------- İstatistik ---------------- */
  function istatistik(veri) {
    const ix = indeksKur(veri);
    const kusaklar = kusakHaritasi(veri);
    const kusakSay = new Map();
    kusaklar.forEach((n) => kusakSay.set(n, (kusakSay.get(n) || 0) + 1));
    let enKalabalik = { kusak: null, adet: 0 };
    kusakSay.forEach((adet, k) => { if (adet > enKalabalik.adet) enKalabalik = { kusak: k, adet }; });
    let yasayan = 0, vefat = 0;
    const omurler = [];
    ix.kisiler.forEach((k) => {
      if (canli(k)) yasayan++; else vefat++;
      const dy = yil(k.dogum), oy = yil(k.olum) || (canli(k) ? simdiYil() : null);
      if (dy && oy && !Number.isNaN(dy) && !Number.isNaN(oy)) omurler.push({ id: k.id, omur: oy - dy, ad: `${k.ad} ${k.soyad}` });
    });
    omurler.sort((a, b) => b.omur - a.omur);
    const soyadlar = new Map();
    ix.kisiler.forEach((k) => soyadlar.set(k.soyad || '—', (soyadlar.get(k.soyad || '—') || 0) + 1));
    return {
      toplam: ix.kisiler.size,
      kusakSayisi: kusakSay.size === 0 ? 0 : Math.max(...kusakSay.keys()) + 1,
      yasayan, vefat,
      evlilikSayisi: ix.evlilikler.length,
      bosanmaSayisi: ix.evlilikler.filter((e) => e.bitis).length,
      kusakDagilimi: [...kusakSay.entries()].sort((a, b) => a[0] - b[0]).map(([k, adet]) => ({ kusak: k, adet })),
      enKalabalikKusak: enKalabalik,
      enUzunOmur: omurler[0] || null,
      soyadDagilimi: [...soyadlar.entries()].sort((a, b) => b[1] - a[1])
    };
  }

  /* ---------------- GEDCOM 5.5.1 ---------------- */
  function gedcom(veri) {
    const satirlar = [];
    const aileNo = new Map(); // çift anahtarı -> aile ID
    const L = (s) => satirlar.push(s);
    const adParca = (ad) => {
      const p = String(ad || '').trim().split(/\s+/);
      if (p.length < 2) return p[0] || '';
      return p[p.length - 1] + ' /' + p.slice(0, -1).join(' ') + '/';
    };
    L('0 HEAD');
    L('1 SOUR NUMEX_KOKLER');
    L('2 NAME Numex Kökler — Etkileşimli Dijital Soyağacı');
    L('1 GEDC');
    L('2 VERS 5.5.1');
    L('2 FORM LINEAGE-LINKED');
    L('1 CHAR UTF-8');
    L('1 DATE ' + new Date().toISOString().slice(0, 10).replace(/-/g, ' '));

    // Aile (evlilik) kayıtları
    let sayac = 1;
    (veri.evlilikler || []).forEach((e) => {
      const aid = '@F' + (sayac++) + '@';
      aileNo.set(e.a + '|' + e.b, aid);
      aileNo.set(e.b + '|' + e.a, aid);
      L(`0 ${aid} FAM`);
      L(`1 HUSB @I${e.a}@`);
      L(`1 WIFE @I${e.b}@`);
      if (e.baslangic) L(`1 MARR\n2 DATE ${e.baslangic}`);
      if (e.bitis) L(`1 DIV\n2 DATE ${e.bitis}`);
    });

    // Kişiler
    (veri.kisiler || []).forEach((k) => {
      L(`0 @I${k.id}@ INDI`);
      L(`1 NAME ${adParca(k.ad + ' ' + k.soyad)}`);
      L(`1 SEX ${k.cinsiyet === 'E' ? 'M' : 'F'}`);
      if (k.dogum) L(`1 BIRT\n2 DATE ${k.dogum}`);
      if (k.olum) L(`1 DEAT\n2 DATE ${k.olum}`);
      if (k.yer) L(`1 RESI\n2 PLAC ${k.yer}`);
      if (k.hikaye) { L(`1 NOTE ${k.hikaye.replace(/\n/g, ' ')}`); }
    });

    // Ebeveyn ailesi + çocuk bağları (aile kaydına COC ekle)
    const cocukEkle = new Map(); // aileId -> [kişiId]
    (veri.kisiler || []).forEach((k) => {
      // Anne-baba çiftini bul (evlilik var mı)
      const ev = (veri.evlilikler || []).find((e) =>
        (e.a === k.anneId && e.b === k.babaId) || (e.a === k.babaId && e.b === k.anneId));
      let aid = ev ? aileNo.get(ev.a + '|' + ev.b) : null;
      if (!aid) {
        // Ebeveyn kaydı evlilik dışı ise yeni FAM
        aid = '@F' + (sayac++) + '@';
        L(`0 ${aid} FAM`);
        if (k.babaId) L(`1 HUSB @I${k.babaId}@`);
        if (k.anneId) L(`1 WIFE @I${k.anneId}@`);
        aileNo.set((k.anneId || '') + '|' + (k.babaId || ''), aid);
      }
      if (!cocukEkle.has(aid)) cocukEkle.set(aid, []);
      cocukEkle.get(aid).push(k.id);
    });
    cocukEkle.forEach((liste, aid) => {
      liste.forEach((c) => L(`1 CHIL @I${c}@`));
      // FAM çocukları tekrar yaz: önce çocukları yaz, sonra diğer satırları taşı — GEDCOM sırası
    });
    L('0 TRLR');

    // CHIL satırları FAM bloklarının İÇİNE değil, sonuna düşüyor; yeniden düzenle
    return duzenliGedcom(veri, aileNo, sayac);
  }

  function duzenliGedcom(veri, aileNo, sayac) {
    const famlar = []; // {id, husb, wife, marr, div, chil:[]}
    const famId = new Map();
    (veri.evlilikler || []).forEach((e) => {
      const id = aileNo.get(e.a + '|' + e.b) || ('@F' + (sayac++) + '@');
      const f = { id, husb: e.a, wife: e.b, marr: e.baslangic, div: e.bitis, chil: [] };
      famlar.push(f);
      famId.set(e.a + '|' + e.b, f); famId.set(e.b + '|' + e.a, f);
    });
    (veri.kisiler || []).forEach((k) => {
      let f = null;
      if (k.anneId && k.babaId) f = famId.get(k.anneId + '|' + k.babaId) || famId.get(k.babaId + '|' + k.anneId);
      if (!f) {
        f = { id: '@F' + (sayac++) + '@', husb: k.babaId || null, wife: k.anneId || null, marr: null, div: null, chil: [] };
        famlar.push(f);
        if (k.anneId && k.babaId) { famId.set(k.anneId + '|' + k.babaId, f); famId.set(k.babaId + '|' + k.anneId, f); }
      }
      f.chil.push(k.id);
    });

    const out = [];
    const L = (s) => out.push(s);
    const adParca = (ad) => {
      const p = String(ad || '').trim().split(/\s+/);
      if (p.length < 2) return p[0] || '';
      return p[p.length - 1] + ' /' + p.slice(0, -1).join(' ') + '/';
    };
    L('0 HEAD');
    L('1 SOUR NUMEX_KOKLER');
    L('2 NAME Numex Kökler');
    L('1 GEDC');
    L('2 VERS 5.5.1');
    L('2 FORM LINEAGE-LINKED');
    L('1 CHAR UTF-8');
    L('1 DATE ' + new Date().toISOString().slice(0, 10).replace(/-/g, ' '));

    (veri.kisiler || []).forEach((k) => {
      L(`0 @I${k.id}@ INDI`);
      L(`1 NAME ${adParca(k.ad + ' ' + k.soyad)}`);
      L(`1 SEX ${k.cinsiyet === 'E' ? 'M' : 'F'}`);
      if (k.dogum) { L('1 BIRT'); L(`2 DATE ${k.dogum}`); }
      if (k.olum) { L('1 DEAT'); L(`2 DATE ${k.olum}`); }
      if (k.yer) { L('1 RESI'); L(`2 PLAC ${k.yer}`); }
      if (k.hikaye) L(`1 NOTE ${String(k.hikaye).replace(/\n/g, ' ')}`);
      // Kendi evlilikleri
      famlar.forEach((f) => {
        if (f.husb === k.id || f.wife === k.id) L(`1 FAMS ${f.id}`);
      });
      // Ebeveyn ailesi
      let ebeveynAile = null;
      if (k.anneId && k.babaId) ebeveynAile = famId.get(k.anneId + '|' + k.babaId) || famId.get(k.babaId + '|' + k.anneId);
      if (!ebeveynAile) ebeveynAile = famlar.find((f) => f.chil.includes(k.id));
      if (ebeveynAile) L(`1 FAMC ${ebeveynAile.id}`);
    });

    famlar.forEach((f) => {
      L(`0 ${f.id} FAM`);
      if (f.husb) L(`1 HUSB @I${f.husb}@`);
      if (f.wife) L(`1 WIFE @I${f.wife}@`);
      if (f.marr) { L('1 MARR'); L(`2 DATE ${f.marr}`); }
      if (f.div) { L('1 DIV'); L(`2 DATE ${f.div}`); }
      f.chil.forEach((c) => L(`1 CHIL @I${c}@`));
    });
    L('0 TRLR');
    return out.join('\n');
  }

  const NK = { yil, indeksKur, akrabalik, dogrula, kusakHaritasi, istatistik, gedcom,
    anne, baba, esListesi, cocukListesi, kardesListesi, ortakAtalar, canli };

  if (typeof module !== 'undefined' && module.exports) module.exports = NK;
  if (typeof window !== 'undefined') window.NK = NK;
  kok.NK = NK;
})(typeof globalThis !== 'undefined' ? globalThis : this);
