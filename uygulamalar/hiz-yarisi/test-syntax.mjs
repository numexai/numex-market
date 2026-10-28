import { checkJsSyntax, checkWrittenJsFiles } from 'C:/numexai/numexai/numex-cli/src/syntaxCheck.js';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert';

console.log('🧪 Multi-Language Syntax Check Test Başlatılıyor...');

const tmpDir = mkdtempSync(join(tmpdir(), 'syntax-test-'));

try {
  // Test 1: Geçerli JS
  const validJs = join(tmpDir, 'valid.js');
  writeFileSync(validJs, 'const x = 10; console.log(x);');
  const res1 = await checkJsSyntax(validJs);
  assert.strictEqual(res1.ok, true, 'Geçerli JS hatasız olmalı');

  // Test 2: Geçersiz JSON
  const invalidJson = join(tmpDir, 'bad.json');
  writeFileSync(invalidJson, '{ "name": "numex", }'); // trailing comma is invalid JSON
  const res2 = await checkJsSyntax(invalidJson);
  assert.strictEqual(res2.ok, false, 'Bozuk JSON yakalanmalı');
  assert.match(res2.message, /JSON/, 'Mesajda JSON uyarısı bulunmalı');

  // Test 3: Kapanmamış parantezli TS/TSX
  const badTs = join(tmpDir, 'bad.ts');
  writeFileSync(badTs, 'function test() { return (1 + 2;'); // missing closing parenthesis
  const res3 = await checkJsSyntax(badTs);
  assert.strictEqual(res3.ok, false, 'Bozuk TS parantez dengesi yakalanmalı');

  // Test 4: Bozuk HTML gömülü script
  const badHtml = join(tmpDir, 'index.html');
  writeFileSync(badHtml, '<html><body><script>function foo() { const a = ; }</script></body></html>');
  const res4 = await checkJsSyntax(badHtml);
  assert.strictEqual(res4.ok, false, 'HTML içi bozuk script yakalanmalı');

  // Test 5: Toplu kontrol
  const errors = await checkWrittenJsFiles(tmpDir, ['bad.json', 'bad.ts', 'valid.js']);
  assert.strictEqual(errors.length, 2, 'Tam olarak 2 hatalı dosya yakalanmalı');

  console.log('✅ TÜM TESTLER BAŞARIYLA GEÇTİ!');
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
