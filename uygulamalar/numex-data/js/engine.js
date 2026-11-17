/**
 * Numex Data Detective — Karşılaştırma ve Hata Tespit Motoru
 *
 * İlkeler:
 *  - Kimlikler birebir karşılaştırılır: "00123" ≠ "123". Sıfır farkı yalnızca ŞÜPHE olarak raporlanır.
 *  - Şüpheli eşleşme kullanıcı onayı olmadan KESİNLEŞTİRİLMEZ.
 *  - Tüm para/miktar karşılaştırmaları kuruş bazlı tamsayı ile yapılır.
 */

import { paraKurus, tarihISO, gunFarki, anahtarNorm, anahtarCekirdek, benzerlik, kurusYazi, tarihYazi } from './core.js';

export const TIP_BILGI = {
  'eksik-odeme':       { ad: 'Ödemesi gelmemiş',      sinif: 'kritik', simge: '!' },
  'karsiliksiz-odeme': { ad: 'Karşılığı olmayan kayıt', sinif: 'kritik', simge: '?' },
  'yinelenen':         { ad: 'Yinelenen kayıt',        sinif: 'kritik', simge: '2' },
  'tutar-farki':       { ad: 'Tutar uyuşmazlığı',      sinif: 'uyari',  simge: '₺' },
  'tarih-farki':       { ad: 'Tarih farkı',            sinif: 'uyari',  simge: '⏱' },
  'kimlik-format':     { ad: 'Kimlik formatı farkı',   sinif: 'uyari',  simge: '0' },
  'supheli-eslesme':   { ad: 'Şüpheli eşleşme',        sinif: 'uyari',  simge: '~' },
  'veri-kalitesi':     { ad: 'Veri kalitesi',          sinif: 'bilgi',  simge: 'i' }
};

export const SIRA = { kritik: 0, uyari: 1, bilgi: 2 };

/** Ham tabloyu kayıt nesnelerine çevirir (satır numarası korunur). */
export function kayitlariCikar(veri, etiket) {
  const m = veri.mapping;
  return veri.satirlar.map(s => {
    const hucre = i => (i >= 0 && i < s.hucre.length ? s.hucre[i] : '');
    const tutarHam = hucre(m.tutar);
    return {
      etiket,
      dosyaAdi: veri.ad,
      satir: s.satir,
      hucre: s.hucre,
      anahtarHam: String(hucre(m.anahtar) ?? '').trim(),
      anahtarNorm: anahtarNorm(hucre(m.anahtar)),
      tutarKurus: paraKurus(tutarHam),
      tutarHam,
      tarih: tarihISO(hucre(m.tarih)),
      tarihHam: hucre(m.tarih),
      aciklama: String(hucre(m.aciklama) ?? '').trim()
    };
  });
}

function kayitOzet(k) {
  if (!k) return null;
  return {
    etiket: k.etiket, dosya: k.dosyaAdi, satir: k.satir,
    anahtar: k.anahtarHam, tutar: k.tutarKurus, tutarMetin: kurusYazi(k.tutarKurus),
    tarih: k.tarih, tarihMetin: tarihYazi(k.tarih), aciklama: k.aciklama
  };
}

function issueOlustur(tip, alanlar) {
  const bilgi = TIP_BILGI[tip];
  const a = alanlar.a || null, b = alanlar.b || null;
  const id = `${tip}|${a ? a.etiket + a.satir : '-'}|${b ? b.etiket + b.satir : '-'}`;
  const kaynaklar = [];
  if (a) kaynaklar.push(`${a.dosyaAdi} · satır ${a.satir}`);
  if (b) kaynaklar.push(`${b.dosyaAdi} · satır ${b.satir}`);
  return {
    id, tip, sinif: bilgi.sinif, tipAd: bilgi.ad,
    baslik: alanlar.baslik,
    aciklama: alanlar.aciklama,
    a: kayitOzet(a), b: kayitOzet(b),
    kaynaklar,
    beklenen: alanlar.beklenen ?? null,
    mevcut: alanlar.mevcut ?? null,
    guven: alanlar.guven || { seviye: 'kesin', puan: 100 },
    oneri: alanlar.oneri || '',
    eylemler: alanlar.eylemler || [TIP_BILGI[tip].sinif === 'kritik' ? 'incele' : 'normal']
  };
}

/**
 * İki dosyayı karşılaştırır.
 * @param {{A:object, B:object, ayar:object, elle:object}} girdi
 *   ayar: { tutarTolerans, tarihTolerans, benzerEsik, birim }
 *   elle: { onayli:[[aSatir,bSatir]], ayrilan:[[aSatir,bSatir]], reddedilen:[id] }
 */
export function karsilastir({ A, B, ayar = {}, elle = {} }) {
  const tolerans = ayar.tutarTolerans ?? 0;
  const tarihTol = ayar.tarihTolerans ?? 0;
  const esik = ayar.benzerEsik ?? 0.6;
  const birim = ayar.birim || 'TL';
  const onayli = (elle.onayli || []).map(([a, b]) => `${a}:${b}`);
  const ayrilan = new Set((elle.ayrilan || []).map(([a, b]) => `${a}:${b}`));
  const reddedilen = new Set(elle.reddedilen || []);

  const kayitA = kayitlariCikar(A, 'A');
  const kayitB = kayitlariCikar(B, 'B');
  const sorunlar = [];
  const eslesmeler = [];
  const kullanilanA = new Set();
  const kullanilanB = new Set();
  const yinelenenSatirlar = new Set();

  const aSatir = new Map(kayitA.map(k => [k.satir, k]));
  const bSatir = new Map(kayitB.map(k => [k.satir, k]));

  const esle = (a, b, tip, ek = {}) => {
    kullanilanA.add(a.satir); kullanilanB.add(b.satir);
    const tutarFark = (a.tutarKurus != null && b.tutarKurus != null) ? a.tutarKurus - b.tutarKurus : null;
    const gun = gunFarki(a.tarih, b.tarih);
    const e = {
      id: `e|${a.satir}|${b.satir}`, a: kayitOzet(a), b: kayitOzet(b), tip,
      tutarFark, gunFark: gun, onayli: tip !== 'kesin' && tip !== 'otomatik', ...ek
    };
    eslesmeler.push(e);
    return e;
  };

  /* 1) Kullanıcının onayladığı eşleşmeler */
  onayli.forEach((cift, idx) => {
    const [as, bs] = cift.split(':').map(Number);
    const orijinal = elle.onayli[idx];
    const a = aSatir.get(orijinal[0]), b = bSatir.get(orijinal[1]);
    if (!a || !b || kullanilanA.has(a.satir) || kullanilanB.has(b.satir)) return;
    esle(a, b, 'manuel');
  });

  /* 2) Dosya içi yinelenen kayıtlar */
  for (const [kayitlar, etiket] of [[kayitA, 'A'], [kayitB, 'B']]) {
    const gruplar = new Map();
    for (const k of kayitlar) {
      if (!k.anahtarNorm) continue;
      if (!gruplar.has(k.anahtarNorm)) gruplar.set(k.anahtarNorm, []);
      gruplar.get(k.anahtarNorm).push(k);
    }
    for (const [anahtar, grup] of gruplar) {
      if (grup.length < 2) continue;
      grup.forEach(g => yinelenenSatirlar.add(g.satir + '|' + etiket));
      const satirlar = grup.map(g => g.satir);
      const birebir = grup.every(g => g.tutarKurus === grup[0].tutarKurus && g.tarih === grup[0].tarih);
      sorunlar.push(issueOlustur('yinelenen', {
        a: grup[0], b: grup[1],
        baslik: `"${anahtar}" kimliği ${grup.length} kez kayıtlı (${kayitlar === kayitA ? A.ad : B.ad})`,
        aciklama: `${kayitlar === kayitA ? 'Birinci' : 'İkinci'} dosyada aynı kimlik ${grup.length} satırda geçiyor: ${satirlar.map(s => 'satır ' + s).join(', ')}. ` +
          (birebir ? 'Satırlar birebir aynı görünüyor (aynı tutar ve tarih) — çift kayıt ihtimali yüksek.' :
                     'Satırlar birebir aynı değil; aynı işlemin iki kez girilmiş olması muhtemel.') +
          ' Fazla satır eşleştirme dışında bırakıldı, toplamlara ikinci kez katılmadı.',
        beklenen: `"${anahtar}" kimliği tek satır`,
        mevcut: `${grup.length} satır (${satirlar.join(', ')})`,
        guven: { seviye: birebir ? 'kesin' : 'yuksek', puan: birebir ? 99 : 88 },
        oneri: birebir ? `Satır ${satirlar.slice(1).join(', ')} silinmeli ya da iptal olarak işaretlenmeli.` : `Satırları inceleyip mükerrer olanı iptal edin.`,
        eylemler: ['coz', 'detay']
      }));
    }
  }

  /* 3) Kesin eşleşme (birebir kimlik) */
  const bGruplari = new Map();
  for (const k of kayitB) {
    if (!k.anahtarNorm) continue;
    if (!bGruplari.has(k.anahtarNorm)) bGruplari.set(k.anahtarNorm, []);
    bGruplari.get(k.anahtarNorm).push(k);
  }

  for (const a of kayitA) {
    if (kullanilanA.has(a.satir) || !a.anahtarNorm) continue;
    const adaylar = (bGruplari.get(a.anahtarNorm) || []).filter(b => !kullanilanB.has(b.satir));
    if (!adaylar.length) continue;
    // aynı kimlikli birden çok aday varsa: tutar eşit > tarih eşit > tarih yakın > ilk
    const puanla = b => (b.tutarKurus === a.tutarKurus ? 4 : 0) + (b.tarih && b.tarih === a.tarih ? 2 : 0) +
      (Math.abs(gunFarki(a.tarih, b.tarih) ?? 999) <= 7 ? 1 : 0);
    adaylar.sort((x, y) => puanla(y) - puanla(x) || x.satir - y.satir);
    const secilen = adaylar[0];
    if (ayrilan.has(`${a.satir}:${secilen.satir}`)) continue;
    esle(a, secilen, 'kesin');
  }

  /* 4) Eşleşen çiftlerin tutar/tarih denetimi (manuel eşleşmeler de denetlenir) */
  for (const e of eslesmeler) {
    const a = aSatir.get(e.a.satir), b = bSatir.get(e.b.satir);
    if (!a || !b) continue;
    if (a.tutarKurus == null || b.tutarKurus == null) {
      sorunlar.push(issueOlustur('veri-kalitesi', {
        a, b,
        baslik: `Tutar okunamadı — "${a.tutarKurus == null ? a.tutarHam : b.tutarHam}"`,
        aciklama: `"${a.anahtarHam}" eşleşti ancak tutar alanı sayı olarak çözülemedi. Bu satır toplamlara katılmadı; hatalı sonuç üretmemek için ayrıca raporlandı.`,
        beklenen: 'Sayısal tutar',
        mevcut: `"${a.tutarKurus == null ? a.tutarHam : b.tutarHam}"`,
        guven: { seviye: 'kesin', puan: 100 },
        oneri: 'Tutar sütununu veya eşleştirmeyi kontrol edin; gerekirse bu satırı manuel eşleştirin.',
        eylemler: ['detay', 'coz']
      }));
      continue;
    }
    const fark = b.tutarKurus - a.tutarKurus; // B - A
    if (Math.abs(fark) > tolerans) {
      const yuzde = a.tutarKurus !== 0 ? (fark / a.tutarKurus) * 100 : null;
      sorunlar.push(issueOlustur('tutar-farki', {
        a, b,
        baslik: `Tutar uyuşmuyor: ${a.anahtarHam} · ${kurusYazi(Math.abs(fark), birim)} fark`,
        aciklama: `${A.ad} satır ${a.satir} beklentisi ${kurusYazi(a.tutarKurus, birim)}; ${B.ad} satır ${b.satir} kaydı ${kurusYazi(b.tutarKurus, birim)}. ` +
          `Fark ${fark > 0 ? 'fazla' : 'eksik'} ${kurusYazi(Math.abs(fark), birim)}` +
          (yuzde != null && Math.abs(yuzde) < 5 ? ` (yaklaşık %${Math.abs(yuzde).toFixed(2)} — kuruş/transpoze hatası olabilir).` : ' (önemli fark, eksik tahsilat veya iade kontrolü gerekir).'),
        beklenen: kurusYazi(a.tutarKurus, birim),
        mevcut: kurusYazi(b.tutarKurus, birim),
        guven: { seviye: 'kesin', puan: 100 },
        oneri: `${B.ad} satır ${b.satir} tutarını ${kurusYazi(a.tutarKurus, birim)} olarak doğrulayın; fark ${Math.abs(fark) < 1000 ? 'kuruş düzeyinde, yazım hatası olabilir' : 'tahsilat/iade kaydı gerektirebilir'}.`,
        eylemler: ['coz', 'detay']
      }));
    }
    const gun = e.gunFark;
    if (gun != null && Math.abs(gun) > tarihTol) {
      sorunlar.push(issueOlustur('tarih-farki', {
        a, b,
        baslik: `Tarih farkı ${Math.abs(gun)} gün: ${a.anahtarHam}`,
        aciklama: `${A.ad} satır ${a.satir} tarihi ${tarihYazi(a.tarih)}; ${B.ad} satır ${b.satir} tarihi ${tarihYazi(b.tarih)}. Aradaki fark ${Math.abs(gun)} gün. ` +
          (Math.abs(gun) > 30 ? 'Bu kadar uzun gecikme vade/hatırlatma kontrolü gerektirir.' : 'Tolerans ayarını (gün) artırarak bu uyarıyı kapatabilirsiniz.'),
        beklenen: tarihYazi(a.tarih),
        mevcut: tarihYazi(b.tarih),
        guven: { seviye: 'kesin', puan: 100 },
        oneri: 'Tarih alanlarından hangisinin doğru olduğunu doğrulayıp düzeltin; eşleşme yanlışsa çifti ayırın.',
        eylemler: ['coz', 'detay']
      }));
    }
  }

  /* 5) Şüpheli (tahmini) eşleşme adayları */
  const kalanA = kayitA.filter(k => !kullanilanA.has(k.satir));
  const kalanB = kayitB.filter(k => !kullanilanB.has(k.satir));
  const adaylar = [];
  for (const a of kalanA) {
    for (const b of kalanB) {
      const anahtarSkor = benzerlik(a.anahtarNorm, b.anahtarNorm);
      const ayniTutar = a.tutarKurus != null && b.tutarKurus != null && a.tutarKurus === b.tutarKurus;
      const yakinTutar = a.tutarKurus != null && b.tutarKurus != null && Math.abs(a.tutarKurus - b.tutarKurus) <= Math.max(100, Math.round(Math.abs(a.tutarKurus) * 0.01));
      const gun = gunFarki(a.tarih, b.tarih);
      const ayniTarih = gun === 0 && a.tarih != null;
      const yakinTarih = gun != null && Math.abs(gun) <= 3;
      let puan = anahtarSkor * 0.52 +
        (ayniTutar ? 0.32 : yakinTutar ? 0.16 : 0) +
        (ayniTarih ? 0.16 : yakinTarih ? 0.08 : 0);
      const formatFarki = a.anahtarNorm !== b.anahtarNorm &&
        anahtarCekirdek(a.anahtarNorm) && anahtarCekirdek(a.anahtarNorm) === anahtarCekirdek(b.anahtarNorm);
      if (formatFarki) puan += 0.08;
      if (puan >= esik) adaylar.push({ a, b, puan: Math.min(puan, 0.99), formatFarki, ayniTutar, gun });
    }
  }
  adaylar.sort((x, y) => y.puan - x.puan || x.a.satir - y.a.satir || x.b.satir - y.b.satir);
  const supheliA = new Set(), supheliB = new Set();
  for (const ad of adaylar) {
    if (supheliA.has(ad.a.satir) || supheliB.has(ad.b.satir)) continue;
    if (ayrilan.has(`${ad.a.satir}:${ad.b.satir}`)) continue;
    supheliA.add(ad.a.satir); supheliB.add(ad.b.satir);
    const tip = ad.formatFarki ? 'kimlik-format' : 'supheli-eslesme';
    // format farkı asla "yüksek güven" gösterilmez: sıfır farkı gerçekten farklı kayıt olabilir
    const hamPuan = ad.formatFarki ? Math.min(ad.puan, 0.72) : ad.puan;
    const seviye = hamPuan >= 0.85 ? 'yuksek' : hamPuan >= 0.7 ? 'orta' : 'dusuk';
    const puan = Math.round(hamPuan * 100);
    const id = `${tip}|A${ad.a.satir}|B${ad.b.satir}`;
    if (reddedilen.has(id)) {
      supheliA.delete(ad.a.satir); supheliB.delete(ad.b.satir);
      continue;
    }
    sorunlar.push(issueOlustur(tip, {
      a: ad.a, b: ad.b,
      baslik: ad.formatFarki
        ? `Aynı görünen farklı kimlik: "${ad.a.anahtarHam}" ≠ "${ad.b.anahtarHam}"`
        : `Benzer kayıt: "${ad.a.anahtarHam}" ~ "${ad.b.anahtarHam}"`,
      aciklama: (ad.formatFarki
        ? `Kimlikler birebir eşit DEĞİL. ${ad.a.dosyaAdi} satır ${ad.a.satir} değeri "${ad.a.anahtarHam}", ${ad.b.dosyaAdi} satır ${ad.b.satir} değeri "${ad.b.anahtarHam}". ` +
          'Baştaki sıfır/ayraç farkı olabilir; ancak bu sistem kimlikleri kendiliğinden eşitlemez (000123 ile 123 ayrı kişi/işlem olabilir). '
        : `Kimlikler farklı ama kayıtlar birbirine çok benziyor (benzerlik %${Math.round(benzerlik(ad.a.anahtarNorm, ad.b.anahtarNorm) * 100)}). ` +
          'Hatalı yazım, transpoze rakam veya yanlış eşleştirme olabilir. ') +
        (ad.ayniTutar ? 'Tutarlar kuruşu kuruşuna aynı. ' : 'Tutarlar da birebir aynı değil. ') +
        (ad.gun != null ? `Tarihler arası ${Math.abs(ad.gun)} gün. ` : '') +
        'Onayınız olmadan eşleştirilmedi; iki kaydı yan yana inceleyip karar verin.',
      beklenen: `Birebir aynı kimlik (${ad.a.anahtarHam})`,
      mevcut: `"${ad.a.anahtarHam}" ↔ "${ad.b.anahtarHam}"`,
      guven: { seviye, puan },
      oneri: ad.formatFarki
        ? 'Kayıtlar aynı işleme aitse "Eşleştir" ile onaylayın; değilse "Yok say" deyin. Kimlik alanlarındaki format (baştaki sıfır) düzeltilmeli.'
        : 'Kimlik alanını kaynak belgeden doğrulayın. Aynı işlemse eşleştirin, farklıysa yok sayın.',
      eylemler: ['onayla', 'yok_say', 'detay']
    }));
  }

  /* 6) Hâlâ eşleşmeyenler -> ödemesi gelmemiş / karşılığı yok */
  for (const a of kalanA) {
    if (supheliA.has(a.satir)) continue;
    if (yinelenenSatirlar.has(a.satir + '|A')) continue;
    sorunlar.push(issueOlustur('eksik-odeme', {
      a, b: null,
      baslik: `Ödemesi gelmemiş: ${a.anahtarHam || '(kimliksiz)'} · ${kurusYazi(a.tutarKurus, birim)}`,
      aciklama: `${A.ad} dosyasında satır ${a.satir} (${a.aciklama || '—'}) kaydı var; ${B.ad} dosyasında bu kimliğe ait hiçbir kayıt bulunamadı. ` +
        `Kimlik "${a.anahtarHam}" birebir aranmış, benzer kayıtlar ayrıca "şüpheli" olarak listelenmiştir.`,
      beklenen: `${A.ad} satır ${a.satir} için ${B.ad}'de karşılık`,
      mevcut: 'Kayıt yok',
      guven: { seviye: 'kesin', puan: 100 },
      oneri: `Tahsilatı kontrol edin; ödeme yapılmadıysa cari hesaba borç olarak işleyin. ${kurusYazi(a.tutarKurus, birim)} açık bakiye.`,
      eylemler: ['coz', 'detay']
    }));
  }
  for (const b of kalanB) {
    if (supheliB.has(b.satir)) continue;
    if (yinelenenSatirlar.has(b.satir + '|B')) continue;
    sorunlar.push(issueOlustur('karsiliksiz-odeme', {
      a: null, b,
      baslik: `Karşılığı yok: ${b.anahtarHam || '(kimliksiz)'} · ${kurusYazi(b.tutarKurus, birim)}`,
      aciklama: `${B.ad} dosyasında satır ${b.satir} (${b.aciklama || '—'}) kaydı var; ${A.ad} dosyasında bu kimliğe ait bir kayıt yok. ` +
        'Hatalı kimlik girişi, iade, avans veya başka işletmeye ait ödeme olabilir.',
      beklenen: 'Satış/kaynak kaydı',
      mevcut: `${B.ad} satır ${b.satir} · ${kurusYazi(b.tutarKurus, birim)}`,
      guven: { seviye: 'kesin', puan: 100 },
      oneri: 'Bu ödemenin hangi işleme ait olduğunu araştırın; bulunamazsa avans/diğer gelir olarak sınıflandırın.',
      eylemler: ['coz', 'detay']
    }));
  }

  /* 7) Sıralama ve istatistik */
  sorunlar.sort((x, y) =>
    (SIRA[x.sinif] - SIRA[y.sinif]) ||
    (x.tip > y.tip ? 1 : x.tip < y.tip ? -1 : 0) ||
    ((x.a?.satir || 0) - (y.a?.satir || 0)) ||
    ((x.b?.satir || 0) - (y.b?.satir || 0))
  );

  const sayim = { kritik: 0, uyari: 0, bilgi: 0 };
  sorunlar.forEach(s => sayim[s.sinif]++);
  const farkToplam = sorunlar.filter(s => s.tip === 'tutar-farki').reduce((t, s) => {
    const f = (s.b?.tutar ?? 0) - (s.a?.tutar ?? 0);
    return t + f;
  }, 0);

  return {
    sorunlar, eslesmeler,
    istatistik: {
      aSatir: kayitA.length, bSatir: kayitB.length,
      eslesme: eslesmeler.length,
      kesin: eslesmeler.filter(e => e.tip === 'kesin').length,
      manuel: eslesmeler.filter(e => e.tip === 'manuel').length,
      supheli: sorunlar.filter(s => s.tip === 'supheli-eslesme' || s.tip === 'kimlik-format').length,
      ...sayim,
      toplam: sorunlar.length,
      aToplamKurus: kayitA.reduce((t, k) => t + (k.tutarKurus || 0), 0),
      bToplamKurus: kayitB.reduce((t, k) => t + (k.tutarKurus || 0), 0),
      farkToplamKurus: farkToplam
    }
  };
}
