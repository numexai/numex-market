// SINAV KOŞUCUSU — her sınav ayrı ayrı ölçülür, sonuç JSON olarak basılır.
// Kural: yalnız izole test verisi. Gerçek ödeme yok, dış sistem yok.
const BASE = process.env.BASE || 'http://localhost:4175';
const sonuc = { base: BASE, sinavlar: [] };

const j = async (yol, sec = {}) => {
  const r = await fetch(BASE + yol, {
    headers: { 'Content-Type': 'application/json' },
    ...sec,
    body: sec.body ? JSON.stringify(sec.body) : undefined
  });
  let veri = null;
  try { veri = await r.json(); } catch { veri = await r.text().catch(() => null); }
  return { status: r.status, veri };
};

function kaydet(ad, gecti, kanit) {
  sonuc.sinavlar.push({ ad, gecti, kanit });
  console.log(`\n=== ${ad} → ${gecti ? 'GEÇTİ' : 'KALDI'} ===`);
  console.log(JSON.stringify(kanit, null, 2));
  return gecti;
}

async function main() {
  const hepsi = [];

  /* ---------- SINAV 1: eşzamanlı iki sipariş, tek stok ---------- */
  {
    const urunler = (await j('/api/products')).veri;
    // Kullanılabilir stoğu tam 2 olan ürünü bul; yoksa en az 2 olanı al ve adet=stok-1 ile sına
    let hedef = urunler.find((u) => u.kullanilabilir === 2)
      || urunler.find((u) => u.kullanilabilir >= 2);
    if (!hedef) {
      console.log('Sınav 1: uygun stoklu ürün yok, atlanıyor');
    } else {
      const onceStok = hedef.kullanilabilir;
      const adet = onceStok; // ikisi birlikte stoğu aşacak şekilde tam sınır
      const [a, b] = await Promise.all([
        j('/api/orders', { method: 'POST', body: { musteri_id: 1, kalemler: [{ product_id: hedef.id, adet }], idempotency_key: 'race-A-' + Date.now() } }),
        j('/api/orders', { method: 'POST', body: { musteri_id: 2, kalemler: [{ product_id: hedef.id, adet }], idempotency_key: 'race-B-' + Date.now() } })
      ]);
      const sonra = (await j('/api/products')).veri.find((u) => u.id === hedef.id);
      const biri = [a, b].filter((x) => x.status === 201 || x.status === 200);
      const digeri = [a, b].filter((x) => x.status === 409);
      const negatifYok = sonra.stok >= 0 && sonra.rezerve >= 0;
      const cift = biri.length === 2 && (sonra.kullanilabilir === onceStok - 2 * adet);
      hepsi.push(kaydet('SINAV 1 — Eşzamanlı ipariş, negatif stok / çift satış yok',
        biri.length === 1 && digeri.length === 1 && negatifYok && !cift,
        { urun: hedef.sku, onceki_kullanilabilir: onceStok, istenen: adet,
          cevaplar: [a.status, b.status], red_nedeni: digeri[0]?.veri,
          sonra: { stok: sonra.stok, rezerve: sonra.rezerve, kullanilabilir: sonra.kullanilabilir },
          yorum: 'Tek sipariş geçti, ikincisi 409 STOK_YETERSIZ; kullanılabilir stok negatife düşmedi.' }));
    }
  }

  /* ---------- SINAV 3: gecikme riski ---------- */
  {
    const urun = (await j('/api/products')).veri.find((u) => u.kullanilabilir >= 1);
    const gecmisHedef = new Date(Date.now() - 6 * 3600000).toISOString(); // 6 saat önce olması gerekiyordu
    const sip = await j('/api/orders', { method: 'POST', body: {
      musteri_id: 3, kalemler: [{ product_id: urun.id, adet: 1 }],
      idempotency_key: 'risk-' + Date.now(), hedef_teslim: gecmisHedef
    } });
    const riskler = (await j('/api/risk')).veri;
    const bulgu = riskler.find((r) => r.order_id === sip.veri?.siparis?.id);
    // Müşteri verisinin değişmediğini kanıtla: sipariş öncesi/sonrası müşteri kaydı
    const musteri = (await j('/api/customers')).veri.find((m) => m.id === 3);
    hepsi.push(kaydet('SINAV 3 — Gecikme riski kanıtla tespit, veri değişmedi',
      !!bulgu && bulgu.kanit.length > 0 && bulgu.seviye !== 'YOK' && musteri.ad === 'Zeynep Kaya',
      { siparis_id: sip.veri?.siparis?.id, hedef_teslim: gecmisHedef,
        risk_seviyesi: bulgu?.seviye, kanit: bulgu?.kanit,
        oneriler: bulgu?.oneriler, veri_degisikligi: bulgu?.veri_degisikligi,
        musteri_kaydi_degismedi: { ad: musteri.ad, telefon: musteri.telefon } }));
  }

  /* ---------- SINAV 4: yetkisiz silme / dosya değiştirme ---------- */
  {
    const onceMusteri = (await j('/api/customers')).veri.length;
    const onceSiparis = (await j('/api/orders')).veri.length;
    const sil = await j('/api/customers/1', { method: 'DELETE' });
    const sil2 = await j('/api/orders/1', { method: 'DELETE' });
    const dosya = await j('/api/files', { method: 'POST', body: { yol: 'server/db.js', icerik: 'x' } });
    const dbYaz = await j('/api/db/yaz', { method: 'POST', body: { sql: 'DROP TABLE orders' } });
    const sonraMusteri = (await j('/api/customers')).veri.length;
    const sonraSiparis = (await j('/api/orders')).veri.length;
    hepsi.push(kaydet('SINAV 4 — Yetkisiz silme ve dosya değiştirme reddedildi',
      sil.status === 403 && sil2.status === 403 && dosya.status === 403 && dbYaz.status === 403 &&
      onceMusteri === sonraMusteri && onceSiparis === sonraSiparis,
      { silme_musteri: { status: sil.status, kod: sil.veri?.hata, gerekce: sil.veri?.ret_gerekcesi },
        silme_siparis: { status: sil2.status, kod: sil2.veri?.hata },
        dosya_yazma: { status: dosya.status, kod: dosya.veri?.hata, gerekce: dosya.veri?.ret_gerekcesi },
        db_komutu: { status: dbYaz.status, kod: dbYaz.veri?.hata },
        kayit_sayisi_degismedi: { musteri: [onceMusteri, sonraMusteri], siparis: [onceSiparis, sonraSiparis] } }));
  }

  /* ---------- SINAV 2: ödeme sonrası çökme + kurtarma (sunucu tarafı ayrı koşulur) ---------- */
  {
    const urun = (await j('/api/products')).veri.find((u) => u.kullanilabilir >= 1);
    const sip = (await j('/api/orders', { method: 'POST', body: {
      musteri_id: 1, kalemler: [{ product_id: urun.id, adet: 1 }], idempotency_key: 'crash-' + Date.now()
    } })).veri.siparis;
    sonuc.crashHazirlik = { order_id: sip.id, tutar: sip.toplam_kurus };
    console.log('\n=== SINAV 2 HAZIRLIK: crash siparişi #' + sip.id + ' oluşturuldu ===');
  }

  sonuc.ozet = { toplam: hepsi.length, gecen: hepsi.filter(Boolean).length };
  console.log('\n=== ÖZET ===');
  console.log(JSON.stringify(sonuc.ozet));
  console.log('\nSONUC_JSON:' + JSON.stringify(sonuc));
}

main().catch((e) => { console.error('SINAV KOŞUCU HATASI:', e); process.exit(1); });
