/* Geçici doğrulama: index.html içindeki inline script bloklarını ve
   gcodeUret() fonksiyonunu Node parser'ından geçirir. İş bitince silinir. */
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

/* 1) Tüm inline <script> bloklarını sözdizimi kontrolünden geçir */
const bloklar = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
let gecerli = 0;
let hatali = 0;
bloklar.forEach((b, i) => {
  try {
    new Function(b[1]);
    gecerli++;
  } catch (e) {
    hatali++;
    console.log('SCRIPT ' + i + ' SOZDIZIMI HATALI: ' + e.message);
  }
});
console.log('script blogu: ' + bloklar.length + ' | gecerli: ' + gecerli + ' | hatali: ' + hatali);

/* 2) gcodeUret gövdesini bütün olarak çıkar (kıvrım parantez sayarak) */
const idx = html.indexOf('function gcodeUret()');
if (idx < 0) {
  console.log('gcodeUret BULUNAMADI');
  process.exit(1);
}
let derinlik = 0;
let basladi = false;
let son = idx;
for (let i = idx; i < html.length; i++) {
  const c = html[i];
  if (c === '{') { derinlik++; basladi = true; }
  else if (c === '}') { derinlik--; if (basladi && derinlik === 0) { son = i + 1; break; } }
}
const govde = html.slice(idx, son);
console.log('gcodeUret uzunluk: ' + govde.length + ' karakter, ' + govde.split('\n').length + ' satir');
try {
  new Function(govde);
  console.log('gcodeUret SOZDIZIMI: GECERLI');
} catch (e) {
  console.log('gcodeUret SOZDIZIMI HATALI: ' + e.message);
  process.exit(1);
}

/* 3) GRBL kuralları kodun içinde gerçekten var mı? */
const kurallar = [
  ['$32=1 lazer modu', html.includes("$32=1")],
  ['M4 S<guc> kullanimi', /M4 S/.test(html)],
  ['M3 kalmadi (kod satiri)', !/L\.push\('M3 /.test(html)]
];
kurallar.forEach(([ad, ok]) => console.log((ok ? 'OK   ' : 'HATA ') + ad));
console.log('SONUC: ' + (hatali === 0 && kurallar.every(([, ok]) => ok) ? 'TUM_KONTROLLER_GECTI' : 'SORUN_VAR'));
