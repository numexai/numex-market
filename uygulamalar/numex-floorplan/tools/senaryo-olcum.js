/* Ölçüm aracı — bina senaryosu motorunu hazır planlarda koşar.
 * Node'da core.js + scenario.js aynen yüklenir; tarayıcıdaki kodun aynısı.
 * Çalıştır: node tools/senaryo-olcum.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const KOK = path.join(__dirname, '..');

global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(KOK, 'js/core.js'), 'utf8'), { filename: 'core.js' });
vm.runInThisContext(fs.readFileSync(path.join(KOK, 'js/scenario.js'), 'utf8'), { filename: 'scenario.js' });

const SC = global.SCENARIO;
const NF = global.NF;

function line(s) { console.log(s); }

const cases = NF.SAMPLES.map(s => ({ label: s.label, project: s.make() }));

for (const c of cases) {
  line('==============================================');
  line('PLAN: ' + c.label);
  const t0 = Date.now();
  const r = SC.analyse(c.project);
  const ms = Date.now() - t0;
  line('süre: ' + ms + ' ms');
  line('metrik: ' + JSON.stringify(r.metrics));
  line('odalar:');
  r.rooms.forEach(ri => {
    line('  [' + (ri.i + 1) + '] ' + ri.room.name +
      ' alan=' + ri.room.area.toFixed(2) + ' m²' +
      ' merkez=(' + ri.room.cx.toFixed(2) + ',' + ri.room.cy.toFixed(2) + ')' +
      ' kapı=' + ri.doors.length + ' pencere=' + ri.windows.length +
      ' eşya=' + ri.furn + (ri.wet ? ' [ıslak]' : '') + (ri.bed ? ' [yatak]' : '') + (ri.kitchen ? ' [mutfak]' : ''));
  });
  line('tahliye (merkez / en uzak köşe):');
  r.evac.forEach(e => {
    line('  ' + e.room.name + ' → merkez ' + (e.m === null ? 'ÇIKIŞ YOK' : e.m + ' m') +
      ' | en uzak köşe ' + (e.worst === null ? 'ÇIKIŞ YOK' : e.worst + ' m') +
      '  yol=' + e.path.join(' > '));
  });
  line('BEŞ SENARYO:');
  r.senaryolar.forEach(s => {
    line('  [' + (s.ok ? 'GEÇTİ' : 'KALDI') + '] ' + s.ad +
      ' — kritik ' + s.kritik + ', uyarı ' + s.uyari);
  });
  r.evac.forEach(e => {
    line('  ' + e.room.name + ' → ' + (e.m === null ? 'ÇIKIŞ YOK' : e.m + ' m') + '  yol=' + e.path.join(' > '));
  });
  line('çıkış kapıları: ' + r.exits.length + (r.exits.length ? ' (' + r.exits.map(d => d.w + ' m').join(', ') + ')' : ''));
  line('BULGULAR (' + r.issues.length + '):');
  r.issues.forEach(i => line('  [' + i.level + '/' + i.code + '] ' + i.text));
  const v = SC.verdict(r);
  line('KARAR [' + v.level + ']: ' + (v.ok ? 'GEÇTİ' : (v.level === 'uyarı' ? 'KOŞULLU GEÇTİ' : 'KALDI')) + ' — ' + v.text);
  line('');
}

/* --- sınır durumları: çökmemeli --- */
line('==============================================');
line('SINIR DURUMLARI');
const empty = NF.newProject('Boş');
try { const r = SC.analyse(empty); line('boş proje: OK, oda=' + r.metrics.oda + ' bulgu=' + r.issues.length); }
catch (e) { line('boş proje: ÇÖKTÜ → ' + e.message); }

const tek = NF.newProject('Tek duvar');
NF.addWall(tek, { x: 0, y: 0 }, { x: 3, y: 0 });
try { const r = SC.analyse(tek); line('tek duvar: OK, oda=' + r.metrics.oda + ' bulgu=' + r.issues.length); }
catch (e) { line('tek duvar: ÇÖKTÜ → ' + e.message); }

/* --- gerçek ölçüm doğrulaması: 1+1 planının alanı elle hesapla uyuşuyor mu --- */
const p11 = NF.SAMPLES[0].make();
const r11 = SC.analyse(p11);
const toplam = r11.rooms.reduce((s, ri) => s + ri.room.area, 0);
line('');
line('1+1 toplam oda alanı (poligon): ' + toplam.toFixed(2) + ' m² — NF.totalArea: ' + NF.totalArea(p11).toFixed(2) + ' m²');
line('1+1 bina dış ölçüsü: 6,00 × 7,00 = 42,00 m²');
