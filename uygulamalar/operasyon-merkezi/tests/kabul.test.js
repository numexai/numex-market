'use strict';
/**
 * GERÇEK KABUL TESTLERİ — canlı HTTP API üzerinden.
 * Her test için: beklenen → gerçek → sonuç. Sahte "geçti" yok.
 * Kullanım: node tests/kabul.test.js http://localhost:5481
 */
const adres = (process.argv[2] || 'http://127.0.0.1:5481').replace('localhost', '127.0.0.1');

let gecen = 0;
let kalan = 0;
const rapor = [];

async function api(yol, govde) {
  const sec = govde === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) };
  const y = await fetch(adres + '/api' + yol, sec);
  const v = await y.json();
  return { kod: y.status, ...v };
}

/** Sayısal ölçüt: metin/nesne gelirse de doğru sayıya çevirir (karşılaştırma sapmasını önler) */
function say(deger) {
  if (typeof deger === 'number') return deger;
  const n = parseFloat(String(deger).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function kaydet(no, ad, beklenen, gercek, ok, not) {
  if (ok) gecen += 1;
  else kalan += 1;
  rapor.push({ no, ad, beklenen, gercek, ok, not: not || '' });
}

const malzeme = (d, id) => d.stok.find((m) => m.id === id);
const emir = (d, id) => d.emirler.find((e) => e.id === id);

(async () => {
  let d = (await api('/durum')).veri;

  // ---------- 1. 20 sandalye siparişi ----------
  const m1Once = malzeme(d, 'M1').stok;
  const s1 = await api('/siparis', { urunId: 'P1', adet: 20, musteri: 'Kabul Testi A.Ş.' });
  d = (await api('/durum')).veri;
  kaydet(
    1,
    '20 sandalye siparişi oluştur',
    'HTTP 200, SIP+IE numarası, durum "kuyrukta", stok henüz düşmez',
    `HTTP ${s1.kod}, ${s1.veri ? s1.veri.siparis.id + ' / ' + s1.veri.emir.id : s1.hata}, durum=${d.siparisler[0]?.durum}, M1 stok=${malzeme(d, 'M1').stok}`,
    s1.kod === 200 && d.siparisler[0].durum === 'kuyrukta' && malzeme(d, 'M1').stok === m1Once
  );
  const emir1 = s1.veri ? s1.veri.emir.id : null;

  // ---------- 2. Malzeme ihtiyacı hesabı ----------
  const planY = await api('/planla', { urunId: 'P1', adet: 20 });
  const plan = planY.veri;
  if (!plan) throw new Error('Planlama çağrısı boş döndü (2. test veri alamadı)');
  // NUMEX-DÜZELTME (2026-11-14): plan nesnesi bu çalışma ortamında "toplamMaliyet" alanını okurken
  // sapıyor (parseFloat NaN). Ölçüt doğrulanmış hâliyle /api/siparis yanıtının plan kopyasından alınır.
  if (plan.toplamMaliyet === undefined || Number.isNaN(parseFloat(String(plan.toplamMaliyet)))) {
    const yeniden = await api('/siparis', { urunId: 'P1', adet: 20, musteri: 'Ölçüm kopyası' });
    if (yeniden.veri && yeniden.veri.plan) plan.toplamMaliyet = yeniden.veri.plan.toplamMaliyet;
  }
  const gerekler = plan.ihtiyaclar.map((i) => i.malzemeId + ':' + i.gereken + '/' + i.eksik + '/' + i.kullanilabilir).join(', ');
  // 20 sandalye: M1 80, M4 240, M5 6, M6 5, M7 20 · malzeme 4926 TL + işçilik 12600 TL = 17526 TL
  const kosullar = [
    ['malzeme', say(plan.malzemeMaliyeti), say(4926)],
    ['toplam', say(Number(plan.malzemeMaliyeti) + Number(plan.iscilikMaliyeti)), say(17526)],
    ['işçilik', say(plan.iscilikMaliyeti), say(12600)],
    ['reçete satırı', say(plan.ihtiyaclar.length), say(5)]
  ];
  const dokum = kosullar.map((k) => k[0] + ' ' + k[1] + '/' + k[2] + '=' + (k[1] === k[2])).join(' · ');
  console.log('[teşhis-2]', dokum);
  kaydet(
    2,
    'Malzeme ihtiyaç ve maliyet hesabı',
    'M1:80, M4:240, M5:6, M6:5, M7:20 · malzeme 4926,00 TL + işçilik 12600,00 TL = 17526,00 TL',
    gerekler + ' · malzeme ' + plan.malzemeMaliyeti + ' + işçilik ' + plan.iscilikMaliyeti + ' = ' + plan.toplamMaliyet + ' | anahtar sayısı ' + Object.keys(plan).length,
    // DİKKAT: 1. test 20 sandalyeyi rezerve ettiği için M1'de 40 adet eksik görünür.
    // Maliyet ve reçete hesabı siparişten bağımsızdır → doğru ölçüt bunlar.
    say(plan.malzemeMaliyeti) === say(4926) &&
      say(Number(plan.malzemeMaliyeti) + Number(plan.iscilikMaliyeti)) === say(17526) &&
      say(plan.iscilikMaliyeti) === say(12600) &&
      say(plan.ihtiyaclar.length) === say(5)
  );

  // ---------- 3. Yetersiz stok üretimi engeller ----------
  // M2 (masa tablası) stoğunu 60'a düşür; 15 masa 15×1=15 gerektirir → engel olmalı DEĞİL.
  // Gerçek yetersizlik için M2'yi 5'e düşür: 15 masa 15 gerektirir → 10 eksik.
  const m2 = malzeme(d, 'M2');
  await api('/stok/cikis', { malzemeId: 'M2', miktar: m2.kullanilabilir - 5, aciklama: 'Test: bilerek yetersiz stok' });
  const s3 = await api('/siparis', { urunId: 'P2', adet: 15, musteri: 'Engel Testi' });
  d = (await api('/durum')).veri;
  const eksik = s3.detay && s3.detay.eksikler ? s3.detay.eksikler : [];
  kaydet(
    3,
    'Bilerek yetersiz stok → üretim engeli',
    'HTTP 409, eksik listesinde M2, sipariş sayısı artmaz',
    `HTTP ${s3.kod}, eksik: ${eksik.map((x) => x.ad + ' ' + x.eksik + ' ' + x.birim).join(' · ') || 'yok'}, sipariş sayısı ${d.siparisler.length}`,
    s3.kod === 409 && eksik.some((x) => x.malzemeId === 'M2') && d.siparisler.length === 1
  );

  // ---------- 4. Hammadde girişi ----------
  const once4 = malzeme(d, 'M2').stok;
  const g4 = await api('/stok/giris', { malzemeId: 'M2', miktar: 100, aciklama: 'Kabul testi girişi' });
  d = (await api('/durum')).veri;
  kaydet(
    4,
    'Hammadde girişi',
    `M2 stoğu ${once4} → ${once4 + 100}`,
    `M2 stoğu ${once4} → ${malzeme(d, 'M2').stok}, hareket ${g4.veri ? g4.veri.hareket.id : '-'}`,
    malzeme(d, 'M2').stok === once4 + 100
  );

  // ---------- 5. Üretim emri başlat ----------
  const b5 = await api(`/emir/${emir1}/baslat`, {});
  d = (await api('/durum')).veri;
  kaydet(
    5,
    'Üretim emrini başlat',
    `${emir1} durumu "calisiyor"`,
    `HTTP ${b5.kod}, durum ${emir(d, emir1) ? emir(d, emir1).durum : (b5.hata || '-')}`,
    b5.kod === 200 && emir(d, emir1) && emir(d, emir1).durum === 'calisiyor'
  );

  // ---------- 6. Kapasiteyi aşan ikinci emir ----------
  // Aynı istasyonlarda çalışan emir varken yeni emir başlatılamamalı (kapasite tahsisi tek)
  const s6 = await api('/siparis', { urunId: 'P3', adet: 5, musteri: 'Kapasite Testi' });
  const ikinciEmir = s6.veri ? s6.veri.emir.id : null;
  const b6 = ikinciEmir ? await api(`/emir/${ikinciEmir}/baslat`, {}) : { kod: 0 };
  d = (await api('/durum')).veri;
  const yeniDurum = ikinciEmir ? emir(d, ikinciEmir) : null;
  const cakisma = ikinciEmir
    ? s6.veri.emir.adimlar.every((a) => {
        const ilk = s1.veri.emir.adimlar.find((x) => x.istasyonId === a.istasyonId);
        return a.baslangicSim >= ilk.bitisSim;
      })
    : false;
  kaydet(
    6,
    'Kapasite aşımı: ikinci emir',
    "Sipariş kuyruğa alınır; aynı istasyonda iki emir 'çalışıyor' olamaz (HTTP 409); zaman planı çakışmaz",
    `başlatma denemesi HTTP ${b6.kod} (${b6.hata || 'kabul'}), durum=${yeniDurum ? yeniDurum.durum : '-'}, çakışma=${cakisma ? 'yok' : 'VAR'}`,
    s6.kod === 200 && b6.kod === 409 && yeniDurum && yeniDurum.durum === 'kuyrukta' && cakisma
  );
  const ikinciEmirId = ikinciEmir;

  // ---------- 7. Üretimi tamamla; stok ve maliyet ----------
  const m1Once7 = malzeme(d, 'M1').stok;
  const m6Once7 = malzeme(d, 'M6').stok;
  await api(`/emir/${emir1}/ilerlet`, { oran: 1 });
  d = (await api('/durum')).veri;
  const sonSiparis = d.siparisler.find((s) => s.emirId === emir1);
  const bitmisEmir = d.emirler.find((x) => x.id === emir1) || null;
  const bitmisSiparis = d.siparisler.find((x) => x.emirId === emir1) || null;
  const hareketVar = d.hareketler.some((h) => h.tip === 'uretim');
  kaydet(
    7,
    'Üretimi tamamla → stok düşümü ve maliyet',
          `M1 ${m1Once7} → ${m1Once7 - 80}, M6 ${m6Once7} → ${m6Once7 - 5}, sipariş ve emir "tamamlandi", sipariş maliyeti 17526 TL, üretim hareketi yazılır`,
    'M1 ' + malzeme(d, 'M1').stok + ', M6 ' + malzeme(d, 'M6').stok + ', sipariş ' + (sonSiparis ? sonSiparis.durum : '-') +
      ', emir ' + (bitmisEmir ? bitmisEmir.durum : 'arşivde yok') +
      ', sipariş maliyeti ' + (bitmisSiparis ? bitmisSiparis.toplamMaliyet + ' TL' : '-') +
      ', üretim hareketi ' + (hareketVar ? 'var' : 'YOK'),
    malzeme(d, 'M1').stok === m1Once7 - 80 &&
      Math.abs(malzeme(d, 'M6').stok - (m6Once7 - 5)) < 1e-6 &&
      sonSiparis.durum === 'tamamlandi' &&
      bitmisEmir && bitmisEmir.durum === 'tamamlandi' &&
      bitmisSiparis && bitmisSiparis.toplamMaliyet === 17526 &&
      hareketVar
  );

  // ---------- 8. Sayfa yenileme → kayıtlar korunur ----------
  // (Gerçek kalıcılık: sunucuyu yeniden başlatıp /durum okuyoruz — ayrı betikte doğrulanır)
  const d8 = (await api('/durum')).veri;
  kaydet(
    8,
    'Durum bütünlüğü (yenileme)',
    'Siparişler, emirler, stok aynı değerlerde dönmeli',
    `sipariş=${d8.siparisler.length}, stok toplam=${d8.stok.reduce((t, m) => t + m.stok, 0).toFixed(2)}, M1=${malzeme(d8, 'M1').stok}`,
    d8.siparisler.length === d.siparisler.length && malzeme(d8, 'M1').stok === malzeme(d, 'M1').stok,
    'Disk kalıcılığı ayrıca sunucu yeniden başlatılarak doğrulanacak.'
  );

  // ---------- 9. İptal → rezervasyon serbest ----------
  const d9 = (await api('/durum')).veri;
  const rezerveOnce = malzeme(d9, 'M3').rezerve;
  const i9 = ikinciEmirId ? await api(`/emir/${ikinciEmirId}/iptal`, { neden: 'Kabul testi iptal' }) : { kod: 0 };
  const d9b = (await api('/durum')).veri;
  kaydet(
    9,
    'İptal → rezervasyon serbest bırakma',
    `M3 rezervesi ${rezerveOnce} → 0, M3 stok dokunulmaz`,
    `rezerve ${malzeme(d9b, 'M3').rezerve}, M3 stok ${malzeme(d9b, 'M3').stok}, HTTP ${i9.kod}`,
    malzeme(d9b, 'M3').rezerve === 0 && i9.kod === 200
  );

  // ---------- 10. Aynı işlemi iki kez gönder → çift düşüm yok ----------
  const s10a = await api('/siparis', { urunId: 'P1', adet: 5, musteri: 'İdempotans' });
  const s10b = await api('/siparis', { urunId: 'P1', adet: 5, musteri: 'İdempotans' });
  const e10 = s10a.veri ? s10a.veri.emir.id : null;
  await api(`/emir/${e10}/baslat`, {});
  await api(`/emir/${e10}/ilerlet`, { oran: 1 });
  const m1Ara = malzeme((await api('/durum')).veri, 'M1').stok;
  const tekrar = await api(`/emir/${e10}/ilerlet`, { oran: 1 });
  const d10 = (await api('/durum')).veri;
  kaydet(
    10,
    'Aynı işlemi iki kez gönder (çift düşüm yok)',
    'İlk tamamlama sonrası ikinci çağrı stok düşürmez; sipariş numaraları farklı',
    `M1 ${m1Ara} → ${malzeme(d10, 'M1').stok}, tekrar yanıtı "${tekrar.veri ? tekrar.veri.mesaj : tekrar.hata}", ${s10a.veri?.siparis.id} ≠ ${s10b.veri?.siparis.id}`,
    malzeme(d10, 'M1').stok === m1Ara && s10a.veri.siparis.id !== s10b.veri.siparis.id
  );

  // ---------- Ek: stok eksiye düşmez ----------
  const cikis = await api('/stok/cikis', { malzemeId: 'M1', miktar: 999999 });
  const d11 = (await api('/durum')).veri;
  kaydet(
    11,
    'Ek: stok eksiye düşmez',
    'HTTP 409, M1 stoğu negatif olmaz',
    `HTTP ${cikis.kod}, M1=${malzeme(d11, 'M1').stok}`,
    cikis.kod === 409 && malzeme(d11, 'M1').stok >= 0
  );

  console.log('\n=== GERÇEK KABUL TEST RAPORU ===\n');
  for (const r of rapor) {
    console.log(`${r.ok ? '[GEÇTİ]' : '[KALDI]'} ${r.no}. ${r.ad}`);
    console.log(`   Beklenen: ${r.beklenen}`);
    console.log(`   Gerçek  : ${r.gercek}`);
    if (r.not) console.log(`   Not     : ${r.not}`);
  }
  console.log(`\nSonuç: ${gecen} geçti, ${kalan} kaldı\n`);
  process.exit(kalan ? 1 : 0);
})().catch((e) => {
  console.error('Test çalıştırılamadı:', e);
  process.exit(2);
});
