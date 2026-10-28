/**
 * check-ids.js — HTML id <-> app.js getElementById kapsama kontrolu
 * Calistir: node check-ids.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('public/index.html');
const jsFiles = fs.readdirSync(path.join(root, 'public/js')).filter(f => f.endsWith('.js'));

const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

let usedAll = [];
jsFiles.forEach(f => {
  const src = read('public/js/' + f);
  const used = [...src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1]);
  // $('x') / querySelector('#x') kisayol kaliplari (app.js: const $ = id => document.getElementById(id))
  const short = [...src.matchAll(/[^\w$]\$[a-zA-Z]*\(\s*['"]([A-Za-z0-9_\-:]+)['"]\s*\)/g)].map(m => m[1]);
  const qs = [...src.matchAll(/querySelector\(\s*['"]#([A-Za-z0-9_\-]+)['"]\s*\)/g)].map(m => m[1]);
  [...used, ...short, ...qs].forEach(id => usedAll.push({ id, file: f }));
});

const unique = [...new Set(usedAll.map(u => u.id))];
const missing = unique.filter(i => !ids.has(i));

console.log('HTML id sayisi            :', ids.size);
console.log('JS getElementById (tekil) :', unique.length);
if (missing.length) {
  console.log('\nEKSIK ID (HTML de yok, runtime null doner):');
  missing.forEach(m => {
    const owners = usedAll.filter(u => u.id === m).map(u => u.file).join(', ');
    console.log('  - #' + m + '  <- ' + owners);
  });
  process.exit(1);
}
console.log('\nOK — kullanilan tum ID ler index.html de mevcut.');

// Fonksiyon referans kontrolu (self-healing raporundaki "tanimsiz fonksiyon" iddiasi)
const htmlIds = ids;
const appSrc = read('public/js/app.js');
const called = [...appSrc.matchAll(/(?:^|[^\w.$])([a-z][a-zA-Z0-9_]*)\(\s*\)/g)].map(m => m[1]);
const globals = new Set([
  ...appSrc.matchAll(/function\s+([a-zA-Z0-9_]+)/g),
  ...appSrc.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\()/g),
  ...appSrc.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g),
  ...jsFiles.flatMap(f => {
    const s = read('public/js/' + f);
    return [...s.matchAll(/function\s+([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  })
].map(x => (typeof x === 'string' ? x : x[1])));

const BUILTIN = new Set(['if','for','while','switch','catch','function','return','typeof','new','require','parseInt','parseFloat','setTimeout','setInterval','clearInterval','requestAnimationFrame','alert','String','Number','Boolean','Array','Object','Math','Date','Set','Map','JSON','isNaN']);
const sus = [...new Set(called)].filter(n => !globals.has(n) && !BUILTIN.has(n) && n.length > 1);
if (sus.length) {
  console.log('\nTANIMSIZ OLABILECEK CAGRILAR (app.js):');
  sus.forEach(s => console.log('  ? ' + s + '()'));
} else {
  console.log('OK — app.js icindeki tum fonksiyon cagrilari tanimli.');
}
