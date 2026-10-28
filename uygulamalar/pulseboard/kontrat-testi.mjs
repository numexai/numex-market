/* =========================================================
   PulseBoard — Sözleşme (contract) testi
   Tüm ESM import'larını gerçekten çözümler:
   1) Hedef dosya diskte var mı?
   2) İstenen isimli export o dosyada gerçekten var mı?
   3) Döngüsel bağımlılık var mı?
   Çalıştırma: node kontrat-testi.mjs
   ========================================================= */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";

const KOK = process.cwd();
const hatalar = [];
const uyarilar = [];
const grafik = new Map();

/** Bir dosyadan import/export ifadelerini kabaca çıkarır */
function importlariCikar(kod) {
  const liste = [];
  const re = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(kod))) {
    const govde = m[1].trim();
    const kaynak = m[2];
    const adlar = [];
    const susl = govde.match(/^\{([\s\S]*)\}$/);
    if (susl) {
      for (const parca of susl[1].split(",")) {
        const p = parca.trim();
        if (!p) continue;
        const asli = p.split(/\s+as\s+/)[0].trim();
        if (asli && asli !== "default") adlar.push(asli);
      }
    }
    const yanEtki = !govde && kaynak;
    liste.push({ govde, kaynak, adlar, yanEtki });
  }
  // yan etkili import "import './x.js'"
  const reYan = /(?:^|\n)\s*import\s*["']([^"']+)["']/g;
  while ((m = reYan.exec(kod))) {
    liste.push({ govde: "", kaynak: m[1], adlar: [], yanEtki: true });
  }
  return liste;
}

/** Dosyada export edilen isimleri toplar */
function exportlariCikar(kod) {
  const isimler = new Set();
  const reFonksiyon = /export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_$]+)/g;
  let m;
  while ((m = reFonksiyon.exec(kod))) isimler.add(m[1]);

  const reListe = /export\s*\{([^}]*)\}/g;
  while ((m = reListe.exec(kod))) {
    for (const parca of m[1].split(",")) {
      const p = parca.trim();
      if (!p) continue;
      const asli = p.split(/\s+as\s+/)[0].trim();
      if (asli) isimler.add(asli);
    }
  }

  const reVarsayilan =
    /export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_$]*)/g;
  while ((m = reVarsayilan.exec(kod))) isimler.add("default");

  if (/export\s+default\b/.test(kod)) isimler.add("default");
  return isimler;
}

/* --- Taranacak dosyalar (giriş noktasından derinlemesine) --- */
const baslangic = "js/app.js";
const gorulen = new Set();
const kuyruk = [baslangic];
const tumDosyalar = new Set();

function gitme(yol) {
  const mutlak = resolve(KOK, yol);
  if (gorulen.has(mutlak)) return;
  gorulen.add(mutlak);
  if (!existsSync(mutlak)) {
    hatalar.push(`MISSING FILE: ${yol}`);
    return;
  }
  tumDosyalar.add(yol);

  const kod = readFileSync(mutlak, "utf8");
  const bagimliliklar = importlariCikar(kod);
  const yerelBagimliliklar = [];

  for (const b of bagimliliklar) {
    if (!b.kaynak.startsWith(".")) {
      uyarilar.push(
        `${yol}: paket import'u "${b.kaynak}" (node_modules gerekir)`,
      );
      continue;
    }
    const hedefYol = resolve(dirname(mutlak), b.kaynak);
    const hedefGoreli = relative(KOK, hedefYol).replace(/\\/g, "/");
    if (!existsSync(hedefYol)) {
      hatalar.push(
        `UNRESOLVED IMPORT: ${yol} -> "${b.kaynak}" (beklenen: ${hedefGoreli})`,
      );
      continue;
    }
    yerelBagimliliklar.push(hedefGoreli);

    // isimli export kontrolü
    if (b.adlar.length) {
      const hedefKod = readFileSync(hedefYol, "utf8");
      const mevcut = exportlariCikar(hedefKod);
      for (const ad of b.adlar) {
        if (!mevcut.has(ad)) {
          hatalar.push(
            `MISSING EXPORT: ${yol} -> "${b.kaynak}" içinden { ${ad} } import ediyor ama ${hedefGoreli} bunu export ETMİYOR`,
          );
        }
      }
    }
  }
  grafik.set(yol, yerelBagimliliklar);
}

while (kuyruk.length) {
  const dosya = kuyruk.shift();
  gitme(dosya);
  const mutlak = resolve(KOK, dosya);
  if (!existsSync(mutlak)) continue;
  const kod = readFileSync(mutlak, "utf8");
  for (const b of importlariCikar(kod)) {
    if (!b.kaynak.startsWith(".")) continue;
    const hedefYol = resolve(dirname(mutlak), b.kaynak);
    const hedefGoreli = relative(KOK, hedefYol).replace(/\\/g, "/");
    if (!gorulen.has(hedefYol)) kuyruk.push(hedefGoreli);
  }
}

/* --- Döngüsel bağımlılık tespiti (DFS) --- */
const BEYAZ = 0, GRI = 1, SIYAH = 2;
const renk = new Map();
const yigin = [];
const donguler = new Set();

function dfs(dugum) {
  renk.set(dugum, GRI);
  yigin.push(dugum);
  for (const komsu of grafik.get(dugum) || []) {
    const c = renk.get(komsu) ?? BEYAZ;
    if (c === GRI) {
      const bas = yigin.indexOf(komsu);
      const dongu = [...yigin.slice(bas), komsu].join(" -> ");
      donguler.add(dongu);
    } else if (c === BEYAZ) {
      dfs(komsu);
    }
  }
  yigin.pop();
  renk.set(dugum, SIYAH);
}

for (const d of grafik.keys()) {
  if ((renk.get(d) ?? BEYAZ) === BEYAZ) dfs(d);
}

/* --- Rapor --- */
console.log("=".repeat(62));
console.log("PulseBoard — Sözleşme Testi");
console.log("=".repeat(62));
console.log(`Taranan modül sayısı : ${tumDosyalar.size}`);
console.log(`Kenar (import) sayısı: ${[...grafik.values()].reduce((t, l) => t + l.length, 0)}`);
console.log("");

for (const d of [...tumDosyalar].sort()) {
  const b = grafik.get(d) || [];
  console.log(`  ${d}  ->  ${b.length ? b.join(", ") : "(yaprak)"}`);
}

if (uyarilar.length) {
  console.log("\nUYARILAR:");
  uyarilar.forEach((u) => console.log("  ⚠ " + u));
}

if (donguler.size) {
  console.log("\nDÖNGÜSEL BAĞIMLILIK:");
  [...donguler].forEach((d) => console.log("  ↻ " + d));
  hatalar.push(`Döngüsel bağımlılık: ${[...donguler].join(" | ")}`);
}

console.log("\n" + "=".repeat(62));
if (hatalar.length === 0) {
  console.log("SONUÇ: GEÇTİ — tüm import yolları ve isimli export'lar çözüldü.");
  console.log("=".repeat(62));
  process.exit(0);
} else {
  console.log(`SONUÇ: KALDI — ${hatalar.length} hata`);
  hatalar.forEach((h) => console.log("  ✗ " + h));
  console.log("=".repeat(62));
  process.exit(1);
}
