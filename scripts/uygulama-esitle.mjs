// Market uygulamalarının kaynak kodunu uygulamalar/ klasörüne her gün eşitler; GitHub'da da bulunsun, geride kalmasın.
// Kaynak: numexai.com.tr vitrini (/api/hub/apps) ve her uygulamanın herkese açık kaynak zip'i (/api/hub/download/<id>/zip).
// Güvenlik: .env, anahtar/sertifika, .exe ve büyük dosyalar alınmaz; içinde gizli anahtar izi bulunan uygulama hiç yayımlanmaz.
// Liste okunamaz ya da uygulama sayısı %20'den çok düşerse hiçbir şey değiştirilmez.
// Yerel deneme: MARKET_KAYNAK=/yol/apps.json MARKET_INDIR=/zip/klasoru node scripts/uygulama-esitle.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync, renameSync, mkdtempSync, cpSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { numexUygulamalari, kova, KOVALAR, sade } from './market-esitle.mjs';

const KAYNAK = process.env.MARKET_KAYNAK || 'https://www.numexai.com.tr/api/hub/apps';
const INDIR = process.env.MARKET_INDIR || new URL('/api/hub/download/', KAYNAK).href;
const KLASOR = 'uygulamalar';
const EN_BUYUK = 10 * 1024 * 1024;

const ALINMAZ = [/(^|\/)\.env(\.|$)/i, /\.(pem|key|p12|pfx|crt|exe|dll|msi)$/i, /(^|\/)id_(rsa|ed25519)/, /(^|\/)(node_modules|\.git|\.hub-artifacts)(\/|$)/,
  // üretim sırasında kalan test çıktıları ve kazara oluşmuş dosyalar
  /\.(log|nc)$/i, /(^|\/)test[-_]?(run[-_]?out|sonuc|final|dogrulama)[^/]*\.txt$/i, /(^|\/)_[^/]*\.py$/, /(^|\/)_js_check\.js$/, /[\[\]()]{2,}[^/]*$/];
const GIZLI_IZ = [/\bsk-(proj-|ant-)?[A-Za-z0-9_-]{32,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /gh[pousr]_[A-Za-z0-9]{36}/, /AIza[0-9A-Za-z_-]{35}/, /xox[baprs]-[A-Za-z0-9-]{10,}/];

export const kisaAd = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function dosyalar(kok, dizin = kok) {
  return readdirSync(dizin, { withFileTypes: true }).flatMap((g) => {
    const yol = join(dizin, g.name);
    return g.isDirectory() ? dosyalar(kok, yol) : [relative(kok, yol)];
  });
}

async function zipAl(id, hedef) {
  if (/^https?:/.test(INDIR)) {
    const r = await fetch(`${INDIR}${encodeURIComponent(id)}/zip`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(hedef, Buffer.from(await r.arrayBuffer()));
  } else {
    writeFileSync(hedef, readFileSync(join(INDIR, `${id}.zip`)));
  }
}

// Zip'i geçici klasöre açar, alınmayacakları siler; gizli anahtar izi varsa uygulamayı reddeder (null döner).
async function hazirla(u, gecici) {
  const zip = join(gecici, 'kaynak.zip'), acik = join(gecici, 'acik');
  await zipAl(u.app_id, zip);
  mkdirSync(acik);
  execFileSync('unzip', ['-qq', '-o', zip, '-d', acik]); // unzip, ../ ile dışarı yazmaya kalkan girdileri atlar
  let kok = acik;
  const ust = readdirSync(acik);
  if (ust.length === 1 && statSync(join(acik, ust[0])).isDirectory()) kok = join(acik, ust[0]);
  for (const d of dosyalar(kok)) {
    const yol = join(kok, d);
    if (ALINMAZ.some((re) => re.test(d)) || statSync(yol).size > EN_BUYUK) { rmSync(yol, { force: true }); continue; }
    const metin = readFileSync(yol).toString('latin1');
    if (GIZLI_IZ.some((re) => re.test(metin))) { console.warn(`⚠️  ${u.app_id}: ${d} içinde gizli anahtar izi — uygulama yayımlanmadı`); return null; }
  }
  for (const g of ['node_modules', '.git', '.hub-artifacts']) rmSync(join(kok, g), { recursive: true, force: true });
  // Uygulamanın kendi README'si varsa korunur, Numex bloğu sonuna eklenir; yoksa baştan yazılır
  const readme = join(kok, 'README.md');
  if (existsSync(readme)) writeFileSync(readme, readFileSync(readme, 'utf8').trimEnd() + '\n\n---\n\n' + numexBlogu(u));
  else writeFileSync(readme, `# ${md(u.name)}\n\n${uygulamaOzeti(u)}\n\n${md(u.description)}\n\n${numexBlogu(u)}`);
  return kok;
}

// Google ve GitHub aramasında bulunsun diye her kategoriye Türkçe + İngilizce arama etiketleri
const ETIKETLER = {
  'Oyunlar': ['tarayıcı oyunu', 'html5 oyun', 'browser game', 'html5 game'],
  'Simülasyon': ['simülasyon', 'görselleştirme', 'simulation', 'visualization'],
  'Yapay Zekâ': ['yapay zeka demo', 'sinir ağı', 'ai demo', 'machine learning'],
  'Araçlar': ['ücretsiz araç', 'online araç', 'web tool', 'utility'],
  'Üretkenlik': ['stok takip', 'randevu sistemi', 'productivity', 'business app'],
  'Web / OS': ['web işletim sistemi', 'web masaüstü', 'web os', 'web desktop'],
  'Eğitim': ['eğitim uygulaması', 'öğrenme', 'education', 'learning'],
  'Diğer': ['web sitesi şablonu', 'tanıtım sayfası', 'landing page', 'template'],
};
const ORTAK_ETIKETLER = ['açık kaynak', 'türkçe', 'yapay zeka ile yapıldı', 'open source', 'javascript', 'ai generated', 'numex ai'];

const TEKIL = { 'Oyunlar': 'tarayıcı oyunu', 'Simülasyon': 'simülasyon', 'Yapay Zekâ': 'yapay zekâ uygulaması', 'Araçlar': 'araç',
  'Üretkenlik': 'iş ve üretkenlik uygulaması', 'Web / OS': 'web masaüstü uygulaması', 'Eğitim': 'eğitim uygulaması', 'Diğer': 'web uygulaması' };
// README'de < > HTML etiketi sanılmasın
const md = (s) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const uygulamaOzeti = (u) => `> **${md(u.name)}** — Numex AI'nın otonom olarak yazıp test ettiği ücretsiz, açık kaynak bir **${TEKIL[kova(u.category)]}**. Kurulum yok, tarayıcıda çalışır.`;

const DEPO = 'numexai/numex-market';
// Vitrindeki canlı demo adresi (yalnız http/https kabul edilir)
const demo = (u) => (/^https?:\/\//i.test(String(u.demo_url || '')) ? String(u.demo_url) : null);
const stackblitz = (u) => `https://stackblitz.com/github/${DEPO}/tree/main/${KLASOR}/${kisaAd(u.app_id)}`;
const codesandbox = (u) => `https://codesandbox.io/s/github/${DEPO}/tree/main/${KLASOR}/${kisaAd(u.app_id)}`;

const numexBlogu = (u) => {
  const etiket = [...(ETIKETLER[kova(u.category)] || []), ...ORTAK_ETIKETLER].map((e) => `\`${e}\``).join(' · ');
  return `[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](${stackblitz(u)}) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](${codesandbox(u)})

**Kategori:** ${kova(u.category)} · Numex AI tarafından otonom üretildi ve test edildi.

${demo(u) ? `- ▶️ [Canlı demo](${demo(u)})\n` : ''}- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](${stackblitz(u)}) · [CodeSandbox](${codesandbox(u)}) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** ${etiket}

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
`;
};

export function dizinReadme(liste) {
  const satir = ['# Numex Market uygulamaları — ücretsiz, açık kaynak, Türkçe', '',
    `Numex AI'nın otonom olarak yazdığı, test ettiği ve [Numex Market](https://market.numexai.com.tr)'te yayımladığı **${liste.length} uygulamanın** kaynak kodu:`,
    'tarayıcı oyunları, simülasyonlar, yapay zekâ demoları, günlük araçlar, iş uygulamaları ve web masaüstleri.',
    'Her gün [numexai.com.tr](https://numexai.com.tr) vitrininden kendiliğinden eşitlenir. Hepsi [MIT lisanslı](LICENSE): dene, incele, çatalla.', '',
    `**Etiketler:** ${ORTAK_ETIKETLER.map((e) => `\`${e}\``).join(' · ')} · \`html5\` · \`web apps\` · \`free apps\``, ''];
  for (const { ad, simge } of KOVALAR) {
    const grup = liste.filter((u) => kova(u.category) === ad).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    if (!grup.length) continue;
    satir.push(`## ${simge} ${ad} (${grup.length})`, '', '| Uygulama | Ne yapar |', '|---|---|');
    for (const u of grup) satir.push(`| [**${md(u.name).replace(/\|/g, '\\|')}**](${kisaAd(u.app_id)}/) | ${md(u.description).replace(/\s+/g, ' ').replace(/\|/g, '\\|')} |`);
    satir.push('');
  }
  return satir.join('\n');
}

const kacisHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// uygulamalar/index.html: canlı galeri. Hugging Face Space'te ve (açılırsa) GitHub Pages'te uygulamalar buradan çalışır.
export function galeri(liste, canli) {
  const kod = (u) => `https://github.com/${DEPO}/tree/main/${KLASOR}/${kisaAd(u.app_id)}`;
  const kart = (u) => `<article class="kart" data-ara="${kacisHtml(sade(`${u.name} ${u.description || ''} ${kova(u.category)}`))}">
  <span class="cip">${kacisHtml(kova(u.category))}</span>
  <h3>${kacisHtml(u.name)}</h3>
  <p>${kacisHtml(u.description || '')}</p>
  <nav>${canli(u) ? `<a class="ana" href="${kisaAd(u.app_id)}/">▶ Canlı aç</a>` : demo(u) ? `<a class="ana" href="${kacisHtml(demo(u))}">▶ Canlı aç</a>` : ''}<a href="${kod(u)}">Kod</a><a href="${stackblitz(u)}">StackBlitz</a><a href="${codesandbox(u)}">CodeSandbox</a></nav>
</article>`;
  const bolumler = KOVALAR.map(({ ad, simge }) => {
    const grup = liste.filter((u) => kova(u.category) === ad).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return grup.length ? `<section><h2>${simge} ${kacisHtml(ad)} <small>${grup.length}</small></h2><div class="izgara">${grup.map(kart).join('\n')}</div></section>` : '';
  }).join('\n');
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Numex Market uygulamaları',
    itemListElement: liste.map((u, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'SoftwareApplication', name: u.name,
      description: u.description || '', applicationCategory: kova(u.category), operatingSystem: 'Web', url: kod(u),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, author: { '@type': 'Organization', name: 'Numex AI', url: 'https://numexai.com.tr' } } })) };
  const aciklama = `Numex AI'nın otonom olarak yazdığı ${liste.length} ücretsiz, açık kaynak web uygulaması: tarayıcı oyunları, simülasyonlar, yapay zekâ demoları, araçlar. Kurulum yok, tarayıcıda çalışır.`;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Numex Market — ${liste.length} ücretsiz, açık kaynak web uygulaması</title>
<meta name="description" content="${kacisHtml(aciklama)}">
<meta name="keywords" content="${kacisHtml([...ORTAK_ETIKETLER, 'html5 oyun', 'tarayıcı oyunu', 'ücretsiz uygulama', 'web apps'].join(', '))}">
<meta property="og:title" content="Numex Market — ücretsiz, açık kaynak web uygulamaları">
<meta property="og:description" content="${kacisHtml(aciklama)}">
<meta property="og:image" content="https://raw.githubusercontent.com/${DEPO}/main/gorseller/banner.png">
<meta name="twitter:card" content="summary_large_image">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
  :root { --teal:#00C9A7; --bg:#060d1b; --kutu:#121927; --cizgi:#222935; --yazi:#e6edf3; --soluk:#8b98a9; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Outfit',system-ui,sans-serif; color:var(--yazi); background:radial-gradient(ellipse 900px 500px at 100% 0, rgba(0,200,170,.14), transparent 70%), var(--bg); min-height:100vh; padding:48px 16px 64px; }
  main { max-width:1120px; margin:0 auto; }
  header h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(30px,5vw,48px); line-height:1.05; }
  header h1 span { color:var(--teal); }
  header p { color:#a9b4c2; font-size:18px; margin:14px 0 22px; max-width:720px; line-height:1.5; }
  header a { color:var(--teal); }
  input { width:100%; max-width:480px; padding:14px 16px; border-radius:12px; border:1px solid var(--cizgi); background:var(--kutu); color:var(--yazi); font:inherit; font-size:16px; }
  section { margin-top:40px; }
  h2 { font-family:'Syne',sans-serif; font-weight:700; font-size:22px; margin-bottom:14px; }
  h2 small { color:var(--teal); font-size:16px; margin-left:6px; }
  .izgara { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
  .kart { background:var(--kutu); border:1px solid var(--cizgi); border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:8px; }
  .cip { align-self:flex-start; font-size:12px; letter-spacing:1px; color:var(--teal); border:1px solid rgba(0,201,167,.3); border-radius:99px; padding:2px 10px; }
  .kart h3 { font-size:18px; font-weight:600; }
  .kart p { color:var(--soluk); font-size:14.5px; line-height:1.5; flex:1; }
  .kart nav { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
  .kart nav a { font-size:13.5px; color:var(--yazi); text-decoration:none; border:1px solid var(--cizgi); border-radius:8px; padding:6px 10px; }
  .kart nav a.ana { background:var(--teal); color:#051018; border-color:var(--teal); font-weight:600; }
  .kart nav a:hover { border-color:var(--teal); }
  footer { margin-top:56px; color:var(--soluk); font-size:14px; }
  footer a { color:var(--teal); }
  [hidden] { display:none !important; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Numex <span>Market</span> — ${liste.length} ücretsiz uygulama</h1>
    <p>${kacisHtml(aciklama)} Hepsi <a href="LICENSE">MIT lisanslı</a>: dene, incele, çatalla. Türkçe yapay zekâ asistanı <a href="https://numexai.com.tr">Numex AI</a> ile kendi uygulamanı yap.</p>
    <input id="ara" type="search" placeholder="Uygulama ara… (isim, açıklama, kategori)" aria-label="Uygulama ara">
  </header>
${bolumler}
  <footer>Kaynak kod: <a href="https://github.com/${DEPO}">github.com/${DEPO}</a> · <a href="https://market.numexai.com.tr">market.numexai.com.tr</a> · Her gün kendiliğinden güncellenir.</footer>
</main>
<script>
  const sade = (s) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/ı/g, 'i');
  document.getElementById('ara').addEventListener('input', (e) => {
    const q = sade(e.target.value.trim());
    document.querySelectorAll('.kart').forEach((k) => { k.hidden = q && !k.dataset.ara.includes(q); });
    document.querySelectorAll('section').forEach((s) => { s.hidden = !s.querySelector('.kart:not([hidden])'); });
  });
</script>
</body>
</html>
`;
}

const LISANS = `MIT License

Copyright (c) 2021-2026 Numex AI Bilişim Teknolojileri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

if (process.argv[1]?.endsWith('uygulama-esitle.mjs')) {
  const kaynak = /^https?:/.test(KAYNAK) ? await (await fetch(KAYNAK, { headers: { accept: 'application/json' } })).json() : JSON.parse(readFileSync(KAYNAK, 'utf8'));
  if (!Array.isArray(kaynak)) throw new Error('Kaynak beklenmedik biçimde (dizi değil) — hiçbir şey değiştirilmedi');
  const liste = numexUygulamalari(kaynak).filter((u) => kisaAd(u.app_id));
  mkdirSync(KLASOR, { recursive: true });
  const mevcut = readdirSync(KLASOR, { withFileTypes: true }).filter((g) => g.isDirectory()).map((g) => g.name);
  if (liste.length < 1 || liste.length < mevcut.length * 0.8) {
    throw new Error(`Kaynakta ${liste.length} uygulama var, klasörde ${mevcut.length} — beklenmedik düşüş, hiçbir şey değiştirilmedi`);
  }

  // Her şey önce hazırlık klasöründe kurulur; uygulamalar/ ancak sonuç tutarlıysa değiştirilir.
  // Geçici klasör başka bir diskte olabilir: taşıma (rename) değil kopyalama (cp) kullanılır.
  const HAZIRLIK = `${KLASOR}.hazirlik`;
  rmSync(HAZIRLIK, { recursive: true, force: true });
  mkdirSync(HAZIRLIK);
  const yayimlanan = [];
  for (const u of liste) {
    const ad = kisaAd(u.app_id), eski = join(KLASOR, ad), yeni = join(HAZIRLIK, ad);
    const gecici = mkdtempSync(join(tmpdir(), 'numex-'));
    try {
      const kok = await hazirla(u, gecici);
      if (kok) { cpSync(kok, yeni, { recursive: true }); yayimlanan.push(u); } // gizli iz bulunduysa (null) eski kopya da alınmaz
    } catch (e) {
      const korundu = existsSync(eski);
      console.warn(`⚠️  ${u.app_id}: kaynak alınamadı (${e.message}) — ${korundu ? 'önceki kopya korundu' : 'atlandı'}`);
      if (korundu) { cpSync(eski, yeni, { recursive: true }); yayimlanan.push(u); }
    } finally { rmSync(gecici, { recursive: true, force: true }); }
  }
  if (yayimlanan.length < liste.length * 0.8) {
    rmSync(HAZIRLIK, { recursive: true, force: true });
    throw new Error(`Yalnız ${yayimlanan.length}/${liste.length} uygulama hazırlanabildi — ${KLASOR}/ değiştirilmedi`);
  }
  const adlar = new Set(liste.map((u) => kisaAd(u.app_id)));
  for (const eski of mevcut) if (!adlar.has(eski)) console.log(`Market'ten kalkan uygulama silindi: ${eski}`);

  writeFileSync(join(HAZIRLIK, 'README.md'), dizinReadme(yayimlanan));
  writeFileSync(join(HAZIRLIK, 'LICENSE'), LISANS);
  writeFileSync(join(HAZIRLIK, 'index.html'), galeri(yayimlanan, (u) => existsSync(join(HAZIRLIK, kisaAd(u.app_id), 'index.html'))));
  rmSync(KLASOR, { recursive: true, force: true });
  renameSync(HAZIRLIK, KLASOR); // ikisi de çalışma klasöründe, aynı disk
  console.log(`Uygulamalar: ${yayimlanan.length}/${liste.length} yayımlandı → ${KLASOR}/`);
}
