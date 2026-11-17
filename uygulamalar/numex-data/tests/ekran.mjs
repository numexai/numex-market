/** Ekran görüntüleri — masaüstü / tablet / mobil (node tests/ekran.mjs) */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KOK = path.resolve();
const PORT = 5198;
const bekle = ms => new Promise(r => setTimeout(r, ms));

function exeBul() {
  const t = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  for (const d of fs.readdirSync(t).filter(x => x.startsWith('chromium-')).sort().reverse()) {
    const p = path.join(t, d, 'chrome-win', 'chrome.exe');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const sunucu = spawn(process.execPath, ['server.js'], {
  cwd: KOK, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
});
await bekle(1200);
const tarayici = await chromium.launch({ executablePath: exeBul(), headless: true });

const boyutlar = [
  { ad: 'masaustu', gen: 1440, yuk: 1000 },
  { ad: 'tablet', gen: 820, yuk: 1180 },
  { ad: 'mobil', gen: 390, yuk: 844 }
];

for (const b of boyutlar) {
  const sayfa = await tarayici.newPage({ viewport: { width: b.gen, height: b.yuk } });
  await sayfa.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await bekle(450);
  await sayfa.screenshot({ path: `tests/ekran-${b.ad}-giris.png` });      // giriş (hero) hâli
  await sayfa.click('#btnOrnek');
  await sayfa.click('[data-senaryo="1"]');
  await sayfa.waitForSelector('#ozetBolumu:not([hidden])');
  await bekle(700);
  await sayfa.locator('#sorunListesi .sorun-kart').first().click();
  await bekle(450);
  await sayfa.screenshot({ path: `tests/ekran-${b.ad}-detay.png` });
  await sayfa.close();
  console.log('  ✓', b.ad, b.gen + 'px');
}

await tarayici.close();
sunucu.kill();
console.log('ekran görüntüleri hazır');
