/* TEK KULLANIMLIK TEŞHİS: hatirlananPort() neden null dönüyor? */
import fs from 'node:fs';

const k = fs.readFileSync('public/js/lazer.js', 'utf8');

const depo = new Map([['numex.sonPort', '4292'], ['numex.sonPort.aktif', '1']]);
const ls = {
  getItem: (x) => (depo.has(x) ? depo.get(x) : null),
  setItem: (x, v) => depo.set(x, String(v)),
  removeItem: (x) => depo.delete(x)
};

const portlar = [{ getInfo: () => ({ usbVendorId: 4292 }), open: async () => {}, close: async () => {} }];
const nav = { serial: { getPorts: async () => portlar, requestPort: async () => { throw new Error('yok'); } } };
const el = {
  addEventListener() {}, querySelector: () => null, getElementById: () => null,
  createElement: () => ({ style: {}, setAttribute() {}, click() {} }),
  body: { appendChild() {}, removeChild() {} }
};

const win = { document: el, localStorage: ls, navigator: nav, setTimeout, clearTimeout, setInterval, clearInterval, console };

const f = new Function('window', 'document', 'localStorage', 'navigator', 'setTimeout', 'setInterval', 'console', "'use strict';\n" + k);
f(win, el, ls, nav, setTimeout, setInterval, console);

console.log('NumexPort:', typeof win.NumexPort);
if (!win.NumexPort) process.exit(1);

const p = await win.NumexPort.hatirlananPort();
console.log('hatirlananPort sonucu:', p ? 'BULUNDU ✅' : 'NULL ❌');
console.log('LazerAPI kurulu mu:', typeof win.LazerAPI);

const r = await win.NumexPort.otomatikBaglan();
console.log('otomatikBaglan:', JSON.stringify(r));
