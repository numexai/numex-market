'use strict';

/**
 * Demo veriyi sıfırlar: npm run reset
 */

const db = require('../src/store/db');

const data = db.reset();
console.log('Veri sıfırlandı.');
console.log(`  Projeler : ${data.projects.length}`);
console.log(`  Görevler : ${data.tasks.length}`);
console.log(`  Ekip     : ${data.team.length}`);
console.log(`  Dosya    : ${db.DB_FILE}`);
