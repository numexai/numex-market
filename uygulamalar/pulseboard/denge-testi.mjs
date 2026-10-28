/* Basit denge kontrolü: süslü parantez / parantez / köşeli parantez */
import { readFileSync } from "node:fs";

const dosyalar = [
  "js/utils.js",
  "js/store.js",
  "js/tasks.js",
  "js/modal.js",
  "js/toast.js",
  "js/charts.js",
  "js/app.js",
  "js/views/dashboard.js",
  "js/views/tasks.js",
  "js/views/habits.js",
  "js/views/stats.js",
  "js/views/settings.js",
];

function denetle(yol) {
  const s = readFileSync(yol, "utf8");
  let c = 0, p = 0, b = 0;
  let satir = 1;
  let inS = null;
  let esc = false;
  const ilkHata = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\n") satir++;

    if (inS) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === inS) inS = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inS = ch; continue; }

    if (ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      satir++;
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) {
        if (s[i] === "\n") satir++;
        i++;
      }
      i++;
      continue;
    }

    if (ch === "{") c++;
    else if (ch === "}") { c--; if (c < 0 && ilkHata.length < 3) ilkHata.push(`satır ${satir}: fazla '}'`); }
    else if (ch === "(") p++;
    else if (ch === ")") { p--; if (p < 0 && ilkHata.length < 3) ilkHata.push(`satır ${satir}: fazla ')'`); }
    else if (ch === "[") b++;
    else if (ch === "]") { b--; if (b < 0 && ilkHata.length < 3) ilkHata.push(`satır ${satir}: fazla ']'`); }
  }

  return { yol, c, p, b, ilkHata };
}

let hataVar = false;
console.log("Dosya                          {}   ()   []   Durum");
console.log("-".repeat(62));
for (const d of dosyalar) {
  const r = denetle(d);
  const ok = r.c === 0 && r.p === 0 && r.b === 0 && r.ilkHata.length === 0;
  if (!ok) hataVar = true;
  console.log(
    `${d.padEnd(30)} ${String(r.c).padStart(4)} ${String(r.p).padStart(4)} ${String(r.b).padStart(4)}   ${ok ? "✓ dengeli" : "✗ DENGESİZ"}`,
  );
  r.ilkHata.forEach((h) => console.log(`      ↳ ${h}`));
}
console.log("-".repeat(62));
console.log(hataVar ? "SONUÇ: KALDI" : "SONUÇ: GEÇTİ — tüm dosyalar dengeli.");
process.exit(hataVar ? 1 : 0);
