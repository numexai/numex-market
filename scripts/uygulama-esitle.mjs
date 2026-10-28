// Market uygulamalarının kaynak kodunu uygulamalar/ klasörüne her gün eşitler; GitHub'da da bulunsun, geride kalmasın.
// Kaynak: numexai.com.tr vitrini (/api/hub/apps) ve her uygulamanın herkese açık kaynak zip'i (/api/hub/download/<id>/zip).
// Güvenlik: .env, anahtar/sertifika, .exe ve büyük dosyalar alınmaz; içinde gizli anahtar izi bulunan uygulama hiç yayımlanmaz.
// Liste okunamaz ya da uygulama sayısı %20'den çok düşerse hiçbir şey değiştirilmez.
// Yerel deneme: MARKET_KAYNAK=/yol/apps.json MARKET_INDIR=/zip/klasoru node scripts/uygulama-esitle.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync, renameSync, mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { numexUygulamalari, kova, KOVALAR } from './market-esitle.mjs';

const KAYNAK = process.env.MARKET_KAYNAK || 'https://www.numexai.com.tr/api/hub/apps';
const INDIR = process.env.MARKET_INDIR || new URL('/api/hub/download/', KAYNAK).href;
const KLASOR = 'uygulamalar';
const EN_BUYUK = 10 * 1024 * 1024;

const ALINMAZ = [/(^|\/)\.env(\.|$)/i, /\.(pem|key|p12|pfx|crt|exe|dll|msi)$/i, /(^|\/)id_(rsa|ed25519)/, /(^|\/)(node_modules|\.git|\.hub-artifacts)(\/|$)/];
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
  else writeFileSync(readme, `# ${u.name}\n\n${uygulamaOzeti(u)}\n\n${u.description || ''}\n\n${numexBlogu(u)}`);
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
  'Diğer': ['web sitesi şablonu', 'tanıtım sayfası', 'landing page', 'template'],
};
const ORTAK_ETIKETLER = ['açık kaynak', 'türkçe', 'yapay zeka ile yapıldı', 'open source', 'javascript', 'ai generated', 'numex ai'];

const TEKIL = { 'Oyunlar': 'tarayıcı oyunu', 'Simülasyon': 'simülasyon', 'Yapay Zekâ': 'yapay zekâ uygulaması', 'Araçlar': 'araç',
  'Üretkenlik': 'iş ve üretkenlik uygulaması', 'Web / OS': 'web masaüstü uygulaması', 'Diğer': 'web uygulaması' };
const uygulamaOzeti = (u) => `> **${u.name}** — Numex AI'nın otonom olarak yazıp test ettiği ücretsiz, açık kaynak bir **${TEKIL[kova(u.category)]}**. Kurulum yok, tarayıcıda çalışır.`;

const numexBlogu = (u) => {
  const yol = `uygulamalar/${kisaAd(u.app_id)}`;
  const etiket = [...(ETIKETLER[kova(u.category)] || []), ...ORTAK_ETIKETLER].map((e) => `\`${e}\``).join(' · ');
  return `**Kategori:** ${kova(u.category)} · Numex AI tarafından otonom üretildi ve test edildi.

- ⚡ [Tarayıcıda aç ve düzenle (StackBlitz)](https://stackblitz.com/github/numexai/numex-market/tree/main/${yol})
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
    for (const u of grup) satir.push(`| [**${u.name.replace(/\|/g, '\\|')}**](${kisaAd(u.app_id)}/) | ${String(u.description || '').replace(/\s+/g, ' ').replace(/\|/g, '\\|')} |`);
    satir.push('');
  }
  return satir.join('\n');
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

  const yayimlanan = [];
  for (const u of liste) {
    const hedef = join(KLASOR, kisaAd(u.app_id));
    const gecici = mkdtempSync(join(tmpdir(), 'numex-'));
    try {
      const kok = await hazirla(u, gecici);
      if (kok) { rmSync(hedef, { recursive: true, force: true }); renameSync(kok, hedef); yayimlanan.push(u); }
      else rmSync(hedef, { recursive: true, force: true }); // gizli iz bulunduysa eski kopya da kalmasın
    } catch (e) {
      console.warn(`⚠️  ${u.app_id}: kaynak alınamadı (${e.message}) — ${existsSync(hedef) ? 'önceki kopya korundu' : 'atlandı'}`);
      if (existsSync(hedef)) yayimlanan.push(u);
    } finally { rmSync(gecici, { recursive: true, force: true }); }
  }
  const adlar = new Set(liste.map((u) => kisaAd(u.app_id)));
  for (const eski of mevcut) if (!adlar.has(eski)) { rmSync(join(KLASOR, eski), { recursive: true, force: true }); console.log(`Market'ten kalkan uygulama silindi: ${eski}`); }

  writeFileSync(join(KLASOR, 'README.md'), dizinReadme(yayimlanan));
  writeFileSync(join(KLASOR, 'LICENSE'), LISANS);
  console.log(`Uygulamalar: ${yayimlanan.length}/${liste.length} yayımlandı → ${KLASOR}/`);
}
