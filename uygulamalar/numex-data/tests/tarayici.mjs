/**
 * Numex Data Detective — GERÇEK TARAYICI kabul testleri (Playwright / Chromium)
 * Çalıştır:  node tests/tarayici.mjs
 * Sunucuyu kendisi açar (port 5199), sonunda kapatır.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const KOK = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 5199;
const TABAN = `http://localhost:${PORT}`;
const INDIRME = fs.mkdtempSync(path.join(os.tmpdir(), 'numex-test-'));

let gecen = 0;
const hatalar = [];
async function test(ad, fn) {
  try { await fn(); gecen++; console.log('  \x1b[32m✓\x1b[0m ' + ad); }
  catch (e) { hatalar.push({ ad, mesaj: e.message }); console.log('  \x1b[31m✗\x1b[0m ' + ad + '\n      → ' + String(e.message).split('\n')[0]); }
}
const bekle = ms => new Promise(r => setTimeout(r, ms));
// CSS text-transform: uppercase innerText'i BÜYÜTÜR ("Kritik" -> "KRİTİK") — karşılaştırmalar küçük harfle yapılır
const kucuk = s => String(s).toLocaleLowerCase('tr-TR');

function tarayiciBul() {
  const tabanlar = [
    path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
    path.join(os.homedir(), '.cache', 'ms-playwright')
  ];
  for (const t of tabanlar) {
    if (!fs.existsSync(t)) continue;
    const dizinler = fs.readdirSync(t).filter(d => d.startsWith('chromium-')).sort().reverse();
    for (const d of dizinler) {
      for (const alt of [['chrome-win', 'chrome.exe'], ['chrome-linux', 'chrome'], ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium']]) {
        const p = path.join(t, d, ...alt);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

/* --------------------------- sunucu + tarayıcı --------------------------- */
const sunucu = spawn(process.execPath, ['server.js'], {
  cwd: KOK, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
});

async function sunucuBekle() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(TABAN + '/'); if (r.ok) return true; } catch { /* bekle */ }
    await bekle(150);
  }
  throw new Error('Sunucu açılmadı');
}

const exe = tarayiciBul();
if (!exe) { console.error('Chromium bulunamadı (ms-playwright klasörü).'); sunucu.kill(); process.exit(1); }

await sunucuBekle();
const tarayici = await chromium.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
const sayfa = await tarayici.newPage({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });

const konsolHatalari = [];
sayfa.on('pageerror', e => konsolHatalari.push(String(e)));
sayfa.on('console', m => { if (m.type() === 'error') konsolHatalari.push(m.text()); });

const indirKaydet = async (tetik) => {
  const [d] = await Promise.all([sayfa.waitForEvent('download', { timeout: 30000 }), tetik()]);
  const hedef = path.join(INDIRME, d.suggestedFilename());
  await d.saveAs(hedef);
  return hedef;
};
const kartSay = async (metin) => metin
  ? sayfa.locator('#sorunListesi .sorun-kart', { hasText: metin }).count()
  : sayfa.locator('#sorunListesi .sorun-kart').count();
const sayac = async (sec) => parseInt(await sayfa.locator(sec).textContent(), 10);
const senaryoYukle = async (no) => {
  await sayfa.click('#btnOrnek');
  await sayfa.click(`[data-senaryo="${no}"]`);
  await sayfa.waitForSelector('#ozetBolumu:not([hidden])', { timeout: 15000 });
  await bekle(300);
};
const sekme = async ad => { await sayfa.click(`[data-sekme="${ad}"]`); await bekle(120); };

console.log('\n\x1b[1mNumex Data Detective — tarayıcı kabul testleri\x1b[0m\n');
await sayfa.goto(TABAN + '/', { waitUntil: 'networkidle' });

/* ------------------------------ 1. AÇILIŞ ------------------------------- */
await test('1. Sayfa hatasız açılıyor, başlık ve yükleme alanları yerinde', async () => {
  if (await sayfa.title() !== 'Numex Data Detective — Verilerin İçindeki Gizli Hatalar') throw new Error('başlık yanlış');
  if (!(await sayfa.isVisible('#btnKarsilastir'))) throw new Error('karşılaştır düğmesi yok');
  if ((await sayfa.locator('.birak-alani').count()) !== 2) throw new Error('iki yükleme alanı yok');
  if (konsolHatalari.length) throw new Error('konsol hatası: ' + konsolHatalari[0]);
});

/* --------------------------- 2. ÖRNEK SENARYO --------------------------- */
await test('2. Örnek senaryo yükleniyor: 8 sorun, 8 eşleşme, 3 kritik', async () => {
  await senaryoYukle('1');
  const sorun = await sayac('#sayacDedektif');
  if (sorun !== 8) throw new Error('sorun sayısı 8 değil: ' + sorun);
  if (await sayac('#sayacEslesme') !== 8) throw new Error('eşleşme 8 değil');
  if (await kartSay() !== 8) throw new Error('liste 8 kart değil');
  const metin = kucuk(await sayfa.locator('#ozetGrid').innerText());
  if (!metin.includes('kritik')) throw new Error('özet kartları yok: ' + metin.slice(0, 80));
  const roze = await sayfa.locator('#dosyaRoze').innerText();
  if (!/2 \/ 2/.test(roze)) throw new Error('dosya rozeti: ' + roze);
});

/* ------------------- 3. SÜTUN EŞLEŞTİRME DEĞİŞTİRME --------------------- */
await test('3. Eşleştirme sütunu değiştirilince sonuç yeniden hesaplanıyor', async () => {
  const sec = sayfa.locator('select[data-esle="A"][data-alan="tutar"]');
  await sec.selectOption('1'); // "Müşteri" sütununu tutar san
  await bekle(500);
  const bozuk = await sayac('#sayacDedektif');
  if (bozuk === 8) throw new Error('sütun değişikliği sonucu etkilemedi');
  await sec.selectOption('3'); // doğrusu geri
  await bekle(500);
  if (await sayac('#sayacDedektif') !== 8) throw new Error('geri dönünce 8 sorun olmadı');
});

/* --------------------------- 4. DEDEKTİF DETAY -------------------------- */
await test('4. Sorun seçilince detay: açıklama, kaynak satır, beklenen/mevcut, güven', async () => {
  await sayfa.locator('#sorunListesi .sorun-kart', { hasText: 'S-1005' }).first().click();
  await bekle(200);
  const detay = sayfa.locator('#detayPanel');
  const metin = kucuk(await detay.innerText());
  for (const parca of ['s-1005', 'satır 6', 'beklenen', 'mevcut', 'güven', 'önerilen düzeltme']) {
    if (!metin.includes(parca)) throw new Error('detayda eksik: ' + parca);
  }
  if (!(await detay.locator('.guven-cubuk span').count())) throw new Error('güven çubuğu yok');
  // yan yana karşılaştırma kutuları
  if ((await detay.locator('.kayit-kutu').count()) !== 2) throw new Error('iki kayıt kutusu yok');
});

await test('5. 00123 ↔ 123 otomatik eşleşmiyor, "kimlik formatı" olarak uyarıyor', async () => {
  const k = sayfa.locator('#sorunListesi .sorun-kart', { hasText: 'Aynı görünen farklı kimlik' });
  if (await k.count() !== 1) throw new Error('kimlik formatı kartı yok');
  await k.first().click();
  await bekle(150);
  const metin = await sayfa.locator('#detayPanel').innerText();
  if (!metin.includes('S-00123') || !metin.includes('S-123')) throw new Error('kimlikler detayda yok');
  if (!/otomatik eşitlemez|Onayınız olmadan/i.test(metin)) throw new Error('uyarı metni yok');
});

/* ------------------------------ 6. CSV DIŞA ----------------------------- */
await test('6. CSV indiriliyor: BOM + ; ayraç + kaynak satırlar', async () => {
  await sekme('rapor');
  const dosya = await indirKaydet(() => sayfa.click('#btnCsv'));
  const ikili = fs.readFileSync(dosya);
  if (!(ikili[0] === 0xEF && ikili[1] === 0xBB && ikili[2] === 0xBF)) throw new Error('UTF-8 BOM yok');
  const metin = ikili.toString('utf8');
  for (const parca of ['EŞLEŞMELER', 'SORUNLAR', 'S-1005', 'A Satır', 'Öneri']) {
    if (!metin.includes(parca)) throw new Error('CSV içinde eksik: ' + parca);
  }
});

/* ------------------------- 7. JSON KAYDET / YÜKLE ----------------------- */
let jsonYol = '';
await test('7. Proje JSON kaydediliyor ve geri yükleniyor', async () => {
  jsonYol = await indirKaydet(() => sayfa.click('#btnJson'));
  const j = JSON.parse(fs.readFileSync(jsonYol, 'utf8'));
  if (j.A.satirlar.length !== 11 || j.B.satirlar.length !== 12) throw new Error('satır sayısı JSON’da yanlış');
  if (!j.A.mapping || j.A.mapping.tutar !== 3) throw new Error('eşleştirme JSON’da yok');
  await sayfa.setInputFiles('#projeGirdi', jsonYol);
  await bekle(800);
  if (await sayac('#sayacDedektif') !== 8) throw new Error('yüklenen projede 8 sorun yok');
});

/* ------------------------------- 8. PDF -------------------------------- */
await test('8. PDF raporu indiriliyor (geçerli PDF, Türkçe karakter)', async () => {
  await sekme('rapor');
  const dosya = await indirKaydet(() => sayfa.click('#btnPdf'));
  const boyut = fs.statSync(dosya).size;
  if (boyut < 20000) throw new Error('PDF çok küçük: ' + boyut);
  const bas = fs.readFileSync(dosya).subarray(0, 5).toString();
  if (bas !== '%PDF-') throw new Error('geçerli PDF değil: ' + bas);
});

/* ---------------------- 9. ŞÜPHELİ EŞLEŞMEYİ ONAYLA -------------------- */
await test('9. Şüpheli eşleşme onaylanınca eşleşme 9’a çıkıyor, uyarı kalkıyor', async () => {
  await sekme('dedektif');
  const k = sayfa.locator('#sorunListesi .sorun-kart', { hasText: 'Aynı görünen farklı kimlik' }).first();
  await k.click();
  await bekle(150);
  await sayfa.click('[data-eylem="onayla"]');
  await bekle(600);
  if (await sayac('#sayacEslesme') !== 9) throw new Error('eşleşme 9 değil');
  if (await kartSay('Aynı görünen farklı kimlik') !== 0) throw new Error('uyarı kartı hâlâ duruyor');
});

/* ------------------------------ 10. GERİ AL ----------------------------- */
await test('10. Geri al: karar iptal, 8 eşleşmeye dönüş', async () => {
  await sekme('gecmis');
  await sayfa.click('#btnGeriAl');
  await bekle(600);
  if (await sayac('#sayacEslesme') !== 8) throw new Error('geri alınca 8 eşleşme olmadı');
  if (await kartSay('Aynı görünen farklı kimlik') !== 1) throw new Error('uyarı kartı geri gelmedi');
});

/* --------------------------- 11. YOK SAY / AYIR ------------------------- */
await test('11. Şüpheli aday "yok say"ılınca kayıtlar ayrı sorun oluyor', async () => {
  await sekme('dedektif');
  await sayfa.locator('#sorunListesi .sorun-kart', { hasText: 'Benzer kayıt' }).first().click();
  await bekle(150);
  await sayfa.click('[data-eylem="yuksay"]');
  await bekle(600);
  if (await kartSay('Benzer kayıt') !== 0) throw new Error('aday reddedilmedi');
  if (await kartSay('Ödemesi gelmemiş') < 1) throw new Error('eksik ödeme oluşmadı');
  if (await kartSay('Karşılığı yok') < 1) throw new Error('karşılıksız kayıt oluşmadı');
});

/* --------------------------- 12. TOLERANS ------------------------------- */
await test('12. Tutar toleransı 100 kuruş: 45 kuruşluk fark susuyor, 360 TL kalıyor', async () => {
  await sayfa.fill('#tutarTolerans', '100');
  await sayfa.locator('#tutarTolerans').dispatchEvent('change');
  await bekle(600);
  if (await kartSay('Tutar uyuşmuyor') !== 1) throw new Error('tutar uyuşmazlığı 1 değil: ' + await kartSay('Tutar uyuşmuyor'));
  await sayfa.fill('#tutarTolerans', '0');
  await sayfa.locator('#tutarTolerans').dispatchEvent('change');
  await bekle(600);
  if (await kartSay('Tutar uyuşmuyor') !== 2) throw new Error('tolerans sıfırlanınca 2 fark olmadı');
});

/* ------------------------ 13. ÇÖZÜLDÜ İŞARETLE -------------------------- */
await test('13. Sorun çözüldü işaretleniyor, sayılıyor ve geri alınabiliyor', async () => {
  await sayfa.locator('#sorunListesi .sorun-kart', { hasText: 'S-1005' }).first().click();
  await bekle(150);
  await sayfa.click('[data-eylem="coz"]');
  await bekle(400);
  if (await sayfa.locator('#sorunListesi .sorun-kart.cozuldu').count() !== 1) throw new Error('çözüldü işareti yok');
  const ozet = kucuk(await sayfa.locator('#ozetGrid').innerText());
  if (!ozet.includes('çözülen')) throw new Error('özet kartı yok');
  await sayfa.click('[data-eylem="cozgeri"]');
  await bekle(400);
  if (await sayfa.locator('#sorunListesi .sorun-kart.cozuldu').count() !== 0) throw new Error('çözüm geri alınmadı');
});

/* ------------------------------ 14. XLSX -------------------------------- */
await test('14. XLSX dosyası yükleniyor, sütunlar otomatik tanınıyor', async () => {
  // vendor paketi UMD: ESM paketinde .js olarak require edilemez -> .cjs kopyası ile yüklenir
  const kopya = path.join(INDIRME, 'xlsx-yerel.cjs');
  fs.copyFileSync(path.join(KOK, 'vendor', 'xlsx.full.min.js'), kopya);
  const XLSX = require(kopya);
  const aoa = [
    ['Fatura No', 'Müşteri', 'Tarih', 'Tutar'],
    ['F-1', 'Alfa Ltd', '01.11.2026', '1.000,00'],
    ['F-2', 'Beta AŞ', '02.11.2026', '2.500,50']
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Sayfa1');
  const yol = path.join(INDIRME, 'deneme.xlsx');
  // tarayıcı sürümünde fs yok: buffer üretip Node ile yazıyoruz
  fs.writeFileSync(yol, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

  await sayfa.reload({ waitUntil: 'networkidle' });
  await sayfa.setInputFiles('input[data-girdi="A"]', yol);
  await bekle(800);
  const durum = await sayfa.locator('.dosya-kart[data-taraf="A"] .dk-durum').innerText();
  if (!/2 satır/.test(durum)) throw new Error('XLSX satır sayısı okunmadı: ' + durum);
  const secili = await sayfa.locator('select[data-esle="A"][data-alan="tutar"]').inputValue();
  if (secili !== '3') throw new Error('tutar sütunu tanınmadı: ' + secili);
});

/* ------------- 14b. [hidden] GÖRÜNÜRLÜK (regresyon) --------------------- */
await test('14b. Dosya yüklenince sürükle-bırak alanı gerçekten gizleniyor', async () => {
  await sayfa.setViewportSize({ width: 1440, height: 950 });
  await sayfa.reload({ waitUntil: 'networkidle' });
  await senaryoYukle('1');
  // [hidden] UA kuralı, .birak-alani{display:flex} tarafından ezilebiliyordu → CSS [hidden]{display:none!important}
  for (const taraf of ['A', 'B']) {
    const birak = await sayfa.locator(`[data-birak="${taraf}"]`).isVisible();
    if (birak) throw new Error(`${taraf}: yükleme sonrası sürükle-bırak alanı hâlâ görünür`);
    if (!(await sayfa.locator(`[data-icerik="${taraf}"]`).isVisible())) throw new Error(`${taraf}: dosya içeriği görünmüyor`);
  }
});

/* ---------------------- 15. GİRİŞ KARTI (HERO) -------------------------- */
await test('15. Giriş kartı boşta görünüyor, dosya yüklenince gizleniyor', async () => {
  await sayfa.setViewportSize({ width: 1440, height: 950 });
  await sayfa.reload({ waitUntil: 'networkidle' });
  if (!(await sayfa.isVisible('#girisHero'))) throw new Error('boş durumda giriş kartı yok');
  await senaryoYukle('1');
  if (await sayfa.isVisible('#girisHero')) throw new Error('dosya yüklenince giriş kartı gizlenmedi');
});

/* --------------------------- 16. MOBİL DÜZEN ---------------------------- */
await test('16. Mobil (390px): yatay taşma yok, mobil çubuk var, detay çekmece açılıyor', async () => {
  await sayfa.setViewportSize({ width: 390, height: 844 });
  await sayfa.reload({ waitUntil: 'networkidle' });
  await senaryoYukle('1');

  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (tasma > 2) throw new Error('yatay taşma: ' + tasma + 'px');

  if (!(await sayfa.isVisible('#mobilCubuk'))) throw new Error('mobil eylem çubuğu görünmüyor');

  // tek kolon düzen
  const kolon = await sayfa.evaluate(() =>
    getComputedStyle(document.querySelector('.dedektif-grid')).gridTemplateColumns.split(' ').length);
  if (kolon !== 1) throw new Error('mobilde dedektif düzeni tek kolon değil: ' + kolon);

  // detay çekmece
  await sayfa.locator('#sorunListesi .sorun-kart').first().click();
  await bekle(350);
  const cekmece = await sayfa.locator('#detayPanel.mobil-acik').count();
  if (cekmece !== 1) throw new Error('detay çekmecesi açılmadı');
  if (!(await sayfa.isVisible('#detayPanel .mobil-geri'))) throw new Error('çekmecede "listeye dön" yok');

  // geri dönünce kapanmalı
  await sayfa.click('#detayPanel .mobil-geri');
  await bekle(300);
  if (await sayfa.locator('#detayPanel.mobil-acik').count() !== 0) throw new Error('çekmece kapanmadı');
});

await test('17. Mobil: tablo kart görünümüne dönüşüyor (thead gizli, hücre etiketli)', async () => {
  await sekme('eslesmeler');
  const theadGorunur = await sayfa.locator('#eslesmeTablosu thead').isVisible();
  if (theadGorunur) throw new Error('mobilde tablo başlığı hâlâ görünür');
  const etiket = await sayfa.locator('#eslesmeTablosu tbody td[data-label="A tutar"]').first().isVisible();
  if (!etiket) throw new Error('hücre veri etiketleri yok');
  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (tasma > 2) throw new Error('tablo yatay taşırıyor: ' + tasma + 'px');
});

/* --------------------------- 18. TABLET DÜZEN --------------------------- */
await test('18. Tablet (820px): tek kolon, taşma yok, filtreler erişilebilir', async () => {
  await sayfa.setViewportSize({ width: 820, height: 1180 });
  await sayfa.reload({ waitUntil: 'networkidle' });
  await senaryoYukle('1');
  const kolon = await sayfa.evaluate(() =>
    getComputedStyle(document.querySelector('.ozet-grid')).gridTemplateColumns.split(' ').length);
  if (kolon !== 2) throw new Error('tablette özet 2 kolon değil: ' + kolon);
  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (tasma > 2) throw new Error('tablet yatay taşma: ' + tasma + 'px');
  if (!(await sayfa.locator('#filtreler .filtre').first().isVisible())) throw new Error('filtreler görünmüyor');
  await sayfa.setViewportSize({ width: 1440, height: 950 });
});

/* ------------------------------- SONUÇ ---------------------------------- */
await tarayici.close();
sunucu.kill();
if (konsolHatalari.length) console.log('\n\x1b[33mSayfada görülen konsol hataları:\x1b[0m\n  ' + konsolHatalari.slice(0, 5).join('\n  '));

console.log('\n' + '─'.repeat(64));
if (hatalar.length) {
  console.log(`\x1b[31m${hatalar.length} tarayıcı testi BAŞARISIZ\x1b[0m · ${gecen} geçti`);
  hatalar.forEach(h => console.log('  • ' + h.ad + ' → ' + String(h.mesaj).split('\n')[0]));
  process.exit(1);
} else {
  console.log(`\x1b[32mTÜM TARAYICI TESTLERİ GEÇTİ\x1b[0m · ${gecen} test`);
  process.exit(0);
}
