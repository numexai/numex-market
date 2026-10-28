'use strict';
// Geçici sözdizimi denetçisi — tüm JS dosyalarını node --check ile test eder.
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;
const files = [
  'server.js',
  'routes/products.js',
  'routes/stock.js',
  'routes/categories.js',
  'routes/reports.js',
  'models/productModel.js',
  'models/stockModel.js',
  'models/categoryModel.js',
  'services/lowStockService.js',
  'services/reportService.js',
  'seed.js'
];

let allOK = true;
for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log('EXIK DOSYA:', rel);
    allOK = false;
    continue;
  }
  try {
    execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
    console.log('OK:', rel);
  } catch (e) {
    allOK = false;
    console.log('FAIL:', rel, '|', String(e.stderr || e.message).trim());
  }
}
console.log(allOK ? '=== TÜM SINTAKS OK ===' : '=== SINTAKS HATALARI VAR ===');
process.exit(allOK ? 0 : 1);
