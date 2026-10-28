/**
 * scripts/check-ids.js
 * index.html içindeki id'ler ile js/*.js içinde aranan id'lerin BİREBİR
 * eşleştiğini doğrulayan sıfır-bağımlılık kabul kapısı.
 *
 * Neden ayrı bir kontrol? getElementById yazım hatası = tarayıcıda
 * "Cannot read properties of null" ve tamamen boş ekran demektir.
 * Bu script onu Node'da, tarayıcı açmadan yakalar.
 *
 * Taradığı desenler:
 *   $('id')                     (projede $ = document.getElementById kısaltması)
 *   document.getElementById('id')
 *   querySelector('#id')
 *   $('opp-hand-' + i)          -> opp-hand-0/1/2 (dinamik, app.js ile genişletilir)
 *   $('seat-' + i), $('count-' + i), $('name-' + i)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const JS_DIR = path.join(ROOT, 'js');

const hatalar = [];

// --- index.html oku ---
if (!fs.existsSync(HTML)) {
  console.error('X index.html bulunamadi: ' + HTML);
  process.exit(1);
}
const html = fs.readFileSync(HTML, 'utf8');

const htmlIds = new Set();
for (const m of html.matchAll(/\bid\s*=\s*"([^"]+)"/g)) htmlIds.add(m[1]);

// --- JS dosyalarinda aranan id'ler ---
const jsFiles = fs.readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));

/** $('x') / getElementById('x') / querySelector('#x') duz yakalama */
const DUMDUZ = [
  /\$\s*\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g,
  /getElementById\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g,
  /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g
];

/**
 * Dinamik: $('opp-hand-' + i) gibi ifadeler. Sablonu, o dongunun GERCEK
 * sinirlarina gore acmak zorundayiz; aksi halde var olmayan id icin
 * YANLIS POZITIF ("eksik") uretiriz. Ornek: ui.js'te `for (i=1; i<=3; i++)`
 * dongusu opp-hand-1..3 uretir; opp-hand-0 HTML'de YOKTUR ve olmamalidir.
 *
 * Strateji: her dinamik kalibi, icinde bulundugu `for (...)` basligindaki
 * sayisal alt/ust sinira gore cozumle; dongu bulunamazsa 0..(oyuncu-1).
 */
const DINAMIK = /\$\s*\(\s*['"]([A-Za-z0-9_-]*?)['"]\s*\+\s*([A-Za-z_$][\w$]*)\s*\)/g;
const OYUNCU_SAYISI = 4; // 0 = insan, 1..3 = botlar (dinamik tavan)

/**
 * Verilen degisken adini kullanan dinamik kalibin oncesindeki en yakin
 * `for (var X = ALT; X <= UST; X++)` basligini bulur ve [alt, ust] dondurur.
 * Bulamazsa null doner (guvenli varsayilan uygulanir).
 */
function donguSiniriBul(src, kalipIndex, degisken) {
  const oncesi = src.slice(0, kalipIndex);
  const re = new RegExp(
    'for\\s*\\(\\s*(?:var|let)\\s+' + degisken + '\\s*=\\s*(\\d+)\\s*;\\s*' +
      degisken + '\\s*<=\\s*(\\d+)\\s*;',
    'g'
  );
  let son = null;
  let m;
  while ((m = re.exec(oncesi)) !== null) son = m;
  if (!son) return null;
  return { alt: Number(son[1]), ust: Number(son[2]) };
}

const aranan = []; // { dosya, id }
const dinamikAcilmis = []; // { dosya, id, kaynak }

for (const f of jsFiles) {
  const src = fs.readFileSync(path.join(JS_DIR, f), 'utf8');

  for (const re of DUMDUZ) {
    for (const m of src.matchAll(re)) aranan.push({ dosya: f, id: m[1] });
  }

  for (const m of src.matchAll(DINAMIK)) {
    const cekirdek = m[1];
    const degisken = m[2];
    const sinir = donguSiniriBul(src, m.index, degisken);
    const alt = sinir ? sinir.alt : 0;
    const ust = sinir ? sinir.ust : OYUNCU_SAYISI - 1;
    if (!sinir) {
      console.log(
        '  ! ' + f + ': "$(\'' + cekirdek + "' + " + degisken +
          ')" icin dongu siniri cozumlenemedi -> varsayilan 0..' + ust
      );
    }
    for (let i = alt; i <= ust; i++) {
      dinamikAcilmis.push({
        dosya: f,
        id: cekirdek + i,
        kaynak: cekirdek + "' + " + degisken + ' (' + alt + '..' + ust + ')'
      });
    }
  }
}

// --- Eksik id kontrolu ---
const eksik = [
  ...aranan.filter((a) => !htmlIds.has(a.id)),
  ...dinamikAcilmis.filter((a) => !htmlIds.has(a.id))
];

if (eksik.length) {
  for (const e of eksik) {
    hatalar.push(
      e.dosya + ' -> #' + e.id + (e.kaynak ? ' (' + e.kaynak + ')' : '') + ' index.html\'de YOK'
    );
  }
} else {
  console.log(
    'OK ID eslesmesi: ' + aranan.length + ' duz + ' + dinamikAcilmis.length +
      ' dinamik referans / ' + htmlIds.size + ' HTML id - hepsi mevcut'
  );
}

// --- HTML'deki yerel script/link varliklari diskte var mi? ---
const bagimliliklar = [];
for (const m of html.matchAll(/<script[^>]+src\s*=\s*"([^"]+)"/g)) bagimliliklar.push(m[1]);
for (const m of html.matchAll(/<link[^>]+href\s*=\s*"([^"]+)"/g)) {
  const h = m[1];
  if (/^https?:|^data:/.test(h)) continue;
  bagimliliklar.push(h);
}
let eksikVarlik = 0;
for (const rel of bagimliliklar) {
  const p = path.join(ROOT, rel.replace(/^\.?\//, ''));
  if (!fs.existsSync(p)) {
    hatalar.push('index.html referansi diskte yok: ' + rel);
    eksikVarlik++;
  }
}
if (!eksikVarlik) {
  console.log('OK Yerel varliklar: ' + bagimliliklar.length + ' script/link dosyasi diskte mevcut');
}

// --- Script yukleme SIRASI bagimliliga uygun mu? ---
const beklenenSira = ['js/tiles.js', 'js/rules.js', 'js/bot.js', 'js/game.js', 'js/ui.js', 'js/main.js'];
const gercek = [...html.matchAll(/<script[^>]+src\s*=\s*"(js\/[^"]+)"/g)].map((m) => m[1]);
if (JSON.stringify(gercek) !== JSON.stringify(beklenenSira)) {
  hatalar.push(
    'Script sirasi hatali.\n  beklenen: ' + beklenenSira.join(' -> ') +
      '\n  gercek  : ' + gercek.join(' -> ')
  );
} else {
  console.log('OK Script yukleme sirasi dogru (tiles->rules->bot->game->ui->main)');
}

// --- UMD/global sozlesmesi ---
const moduller = {
  'tiles.js': 'OkeyTiles',
  'rules.js': 'OkeyRules',
  'bot.js': 'OkeyBot',
  'game.js': 'OkeyGame'
};
let globalEksik = 0;
for (const dosya of Object.keys(moduller)) {
  const globalVar = moduller[dosya];
  const p = path.join(JS_DIR, dosya);
  if (!fs.existsSync(p)) {
    hatalar.push(dosya + ' bulunamadi');
    globalEksik++;
    continue;
  }
  const src = fs.readFileSync(p, 'utf8');
  if (src.indexOf(globalVar) === -1) {
    hatalar.push(dosya + ': ' + globalVar + " global'i tanimli degil (tarayicida <script src> kirilir)");
    globalEksik++;
  }
}
if (!globalEksik) console.log('OK UMD global sozlesmesi: tiles/rules/bot/game modulleri hazir');

// --- Uzunluk kapisi: her oyun mantigi dosyasi anlamli boyutta mi? ---
const minSatir = 120;
let kisaDosya = 0;
for (const f of jsFiles) {
  const satir = fs.readFileSync(path.join(JS_DIR, f), 'utf8').split('\n').length;
  if (satir < minSatir) {
    hatalar.push(f + ' cok kisa: ' + satir + ' satir (< ' + minSatir + ') - iskelet/placeholder suphesi');
    kisaDosya++;
  }
}
if (!kisaDosya) console.log('OK Kod hacmi: ' + jsFiles.length + ' JS dosyasi >= ' + minSatir + ' satir');

// --- Sonuc ---
console.log('\n=== Hizli Kabul Kapisi (check-ids) ===');
if (hatalar.length) {
  console.error('X ' + hatalar.length + ' sorun bulundu:');
  for (const h of hatalar) console.error('  - ' + h);
  process.exit(1);
}
console.log('TUM SOZLESMELER TAMAM');
process.exit(0);
