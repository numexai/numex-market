/**
 * Arayüz tutarlılık kontrolü: HTML ve JS'te kullanılan her CSS sınıfı stil dosyasında tanımlı mı?
 * Eksik sınıf = bozuk görünüm. Çalıştır: node tests/sinif-kontrol.mjs
 */
import fs from 'node:fs';

const css = fs.readFileSync('assets/style.css', 'utf8');
const kaynaklar = ['index.html', 'js/ui.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');

const siniflar = new Set();
for (const m of kaynaklar.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && siniflar.add(c));
for (const m of kaynaklar.matchAll(/class=`([^`]*)`/g)) for (const p of m[1].split(/[^a-zA-Z0-9_-]+/)) if (p) siniflar.add(p);
for (const m of kaynaklar.matchAll(/classList\.(?:add|toggle|remove)\('([^']+)'/g)) siniflar.add(m[1]);
for (const m of kaynaklar.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && siniflar.add(c));

const kacis = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// şablon interpolasyonu artıkları (${...}, ? : , ===) sınıf adı değildir — elenir
const gecerli = c => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(c);
const eksik = [...siniflar].filter(gecerli).filter(c => !new RegExp('\\.' + kacis(c) + '(?![a-zA-Z0-9_-])').test(css));

// yalnız JS'te üretilen durum sınıfları (CSS'te dinamik olarak üretilir)
console.log('Kullanılan sınıf sayısı:', [...siniflar].filter(gecerli).length);
if (eksik.length) {
  console.log('\x1b[31mCSS\'TE TANIMSIZ (' + eksik.length + '):\x1b[0m ' + eksik.join(', '));
  process.exit(1);
}
console.log('\x1b[32mTüm sınıflar CSS\'te tanımlı ✓\x1b[0m');

// responsive göstergeleri
const medya = [...css.matchAll(/@media[^{]+/g)].map(m => m[0].trim());
console.log('\nMedya sorguları (' + medya.length + '):');
medya.forEach(m => console.log('  · ' + m));
