/** Mobilde yatay taşmaya yol açan öğeleri bulur: node tests/tasma-bul.mjs */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 5197;
const bekle = ms => new Promise(r => setTimeout(r, ms));

function exeBul() {
  const t = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  for (const d of fs.readdirSync(t).filter(x => x.startsWith('chromium-')).sort().reverse()) {
    const p = path.join(t, d, 'chrome-win', 'chrome.exe');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const sunucu = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await bekle(1200);
const tarayici = await chromium.launch({ executablePath: exeBul(), headless: true });
const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 } });
await sayfa.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await sayfa.click('#btnOrnek');
await sayfa.click('[data-senaryo="1"]');
await sayfa.waitForSelector('#ozetBolumu:not([hidden])');
await bekle(600);

const rapor = await sayfa.evaluate(() => {
  const gen = window.innerWidth;
  const suclu = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > gen + 0.5 || r.left < -0.5) {
      const st = getComputedStyle(el);
      suclu.push({
        secici: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
        sol: Math.round(r.left), sag: Math.round(r.right), genislik: Math.round(r.width),
        tasma: Math.round(r.right - gen), konum: st.position, overflow: st.overflowX
      });
    }
  });
  // en dıştakileri önce göster
  return { gen, kaydirmaGenisligi: document.documentElement.scrollWidth, suclu: suclu.slice(0, 14) };
});

console.log('viewport:', rapor.gen, '· scrollWidth:', rapor.kaydirmaGenisligi);
console.table(rapor.suclu);
await tarayici.close();
sunucu.kill();
