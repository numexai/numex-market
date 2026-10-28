// Veritabani baglantisi — tek surec, WAL, busy_timeout.
// WAL + busy_timeout: eszamanli isteklerde kilit hatasi yerine siraya girme.
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_SQL } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.NUMEX_DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
export const DB_PATH = path.join(DATA_DIR, 'isletme.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = FULL'); // odeme sonrasi cokme senaryosunda veri diskte kalsin
db.exec(SCHEMA_SQL);

export function now() {
  return new Date().toISOString();
}

export function logOps(tur, baslik, detay) {
  db.prepare('INSERT INTO ops_log (zaman, tur, baslik, detay) VALUES (?,?,?,?)')
    .run(now(), tur, baslik, detay ? JSON.stringify(detay) : null);
}

export function recordDecision(d) {
  db.prepare(`INSERT INTO decisions (zaman, gozlem, risk, karar, gerekce, yetki, yapilmayan, dogrulama)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(now(), d.gozlem, d.risk, d.karar, d.gerekce, d.yetki, d.yapilmayan, d.dogrulama);
}
