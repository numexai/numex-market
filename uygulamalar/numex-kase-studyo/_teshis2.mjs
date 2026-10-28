/* GEÇİCİ TEŞHİS 2: DOMContentLoaded kancası otomatikBaglan'ı çağırıyor mu?
   İş bitince silinir. */
import { readFileSync } from 'node:fs';

const k = readFileSync('public/js/lazer.js', 'utf8');

/* --- localStorage: hatırlanan vendor 4292 --- */
const depo = new Map([['numex.sonPort', '4292'], ['numex.sonPort.aktif', '1']]);
const ls = {
  getItem: (x) => (depo.has(x) ? depo.get(x) : null),
  setItem: (x, v) => depo.set(x, String(v)),
  removeItem: (x) => depo.delete(x)
};

/* --- taklit port (testtekiyle aynı) --- */
function taklitPort(vendorId) {
  const yazilanlar = [];
  const port = {
    _yazilanlar: yazilanlar,
    _acik: false,
    getInfo: () => ({ usbVendorId: vendorId, usbProductId: 60000 }),
    open: async (ayar) => { port._acik = true; },
    close: async () => { port._acik = false; },
    setSignals: async () => {},
    getSignals: async () => ({}),
    readonly: { writable: null },
    writable: { getWriter: () => ({ write: async (v) => yazilanlar.push(v), releaseLock: () => {} }) }
  };
  return port;
}

const takiliPort = taklitPort(4292);
const nav = {
  serial: {
    getPorts: async () => [takiliPort],
    requestPort: async () => { throw new Error('istenmemeli'); }
  }
};

/* --- DOM + kuyruk --- */
const olaylar = new Map();
const document = {
  addEventListener: (ad, fn) => { if (!olaylar.has(ad)) olaylar.set(ad, []); olaylar.get(ad).push(fn); },
  _tetikle: async (ad) => { for (const fn of (olaylar.get(ad) || [])) await fn(); }
};

const uyarilar = [];
const zamanlayiciKuyrugu = [];
const kuyruguBosalt = async () => {
  while (zamanlayiciKuyrugu.length) {
    const fn = zamanlayiciKuyrugu.shift();
    await fn();
  }
};
const kuyrukluZamanlayici = (fn, ms) => { zamanlayiciKuyrugu.push(fn); return zamanlayiciKuyrugu.length; };

const el = {
  addEventListener: document.addEventListener,
  querySelector: () => null, getElementById: () => null,
  createElement: () => ({ style: {}, setAttribute() {}, click() {}, appendChild() {} }),
  body: { appendChild() {}, removeChild() {} }
};

let baglananPort = null;
const win = {
  document, localStorage: ls, navigator: nav,
  setTimeout: kuyrukluZamanlayici, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  console,
  uyariGoster: (tur, mesaj) => uyarilar.push({ tur, mesaj }),
  LazerAPI: {
    destekliMi: () => true,
    disaridanPortlaBaglan: async (p) => {
      console.log('>>> KOPRU CAGRILDI');
      baglananPort = p;
      return { tamam: true, baud: 115200 };
    }
  }
};

const f = new Function('window', 'document', 'localStorage', 'navigator',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'console', k);
f(win, el, ls, nav, kuyrukluZamanlayici, () => 0, () => {}, () => {}, console);

console.log('DOMContentLoaded dinleyici sayisi:', (olaylar.get('DOMContentLoaded') || []).length);

await document._tetikle('DOMContentLoaded');
await kuyruguBosalt();

console.log('baglananPort:', baglananPort ? 'ATANDI' : 'NULL');
console.log('uyari sayisi:', uyarilar.length, JSON.stringify(uyarilar));
