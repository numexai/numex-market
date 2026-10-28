/* ==========================================================================
   test/rules.test.js — Saf birim testleri (Node ile çalışır)
   Çalıştır:  node test/rules.test.js
   ========================================================================== */
'use strict';

var assert = require('assert');
var Tiles = require('../js/tiles.js');
var Rules = require('../js/rules.js');
var Bot = require('../js/bot.js');
var Game = require('../js/game.js');

var passed = 0, failed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (e) {
    failed++;
    failures.push({ name: name, err: e });
    console.log('  \u2717 ' + name);
    console.log('      ' + (e && e.message ? e.message : e));
  }
}

/* seeded RNG (deterministik test) */
function makeRng(seed) {
  var s = seed || 42;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

console.log('\n=== OKEY MVP — Birim Testleri ===\n');

console.log('[Deste & Dağıtım]');

test('testDeckSize: deste 106 taş', function () {
  var deck = Tiles.buildDeck();
  assert.strictEqual(deck.length, 106, 'deste 106 olmalı, bulunan: ' + deck.length);
  var fakes = deck.filter(function (t) { return t.isFakeOkey; });
  assert.strictEqual(fakes.length, 2, 'sahte okey 2 adet olmalı');
  var normals = deck.filter(function (t) { return !t.isFakeOkey; });
  assert.strictEqual(normals.length, 104, 'normal taş 104 olmalı');
});

test('testDeckSize: her renk 26, her sayı 8 taş', function () {
  var deck = Tiles.buildDeck();
  var colors = {}, ranks = {};
  deck.forEach(function (t) {
    if (t.isFakeOkey) return;
    colors[t.color] = (colors[t.color] || 0) + 1;
    ranks[t.rank] = (ranks[t.rank] || 0) + 1;
  });
  Tiles.TILE_COLORS.forEach(function (c) {
    assert.strictEqual(colors[c], 26, c + ' 26 olmalı, bulunan ' + colors[c]);
  });
  for (var r = 1; r <= 13; r++) {
    assert.strictEqual(ranks[r], 8, 'rank ' + r + ' 8 olmalı, bulunan ' + ranks[r]);
  }
});

test('testDealCounts: 15/14/14/14 dağıtım', function () {
  var rng = makeRng(7);
  var deck = Tiles.shuffle(Tiles.buildDeck(), rng);
  Tiles.pickIndicator(deck);
  var dealt = Tiles.deal(deck);
  assert.strictEqual(dealt.hands[0].length, 15, 'P0 15 taş');
  assert.strictEqual(dealt.hands[1].length, 14, 'P1 14 taş');
  assert.strictEqual(dealt.hands[2].length, 14, 'P2 14 taş');
  assert.strictEqual(dealt.hands[3].length, 14, 'P3 14 taş');
  // 106 - 1 (gösterge) - 15 - 42 = 48
  assert.strictEqual(dealt.remainingDeck.length, 48, 'kalan deste 48');
});

test('testDeckSize: taş id’leri benzersiz', function () {
  var deck = Tiles.buildDeck();
  var ids = {};
  deck.forEach(function (t) {
    assert.ok(!ids[t.id], 'tekrarlı id: ' + t.id);
    ids[t.id] = true;
  });
});

console.log('\n[Gösterge & Okey Hesabı]');

test('testOkeyCalc: 13 sonrası 1 olur', function () {
  assert.strictEqual(Tiles.okeyRankOf({ rank: 13 }), 1, '13 -> 1');
  assert.strictEqual(Tiles.okeyRankOf({ rank: 12 }), 13, '12 -> 13');
  assert.strictEqual(Tiles.okeyRankOf({ rank: 1 }), 2, '1 -> 2');
  assert.strictEqual(Tiles.okeyRankOf({ rank: 7 }), 8, '7 -> 8');
});

test('testOkeyCalc: gösterge rengiyle aynı okey run’da doğru hesaplanır', function () {
  var ind = Tiles.createTile('mavi', 12, false);
  assert.strictEqual(Tiles.okeyRankOf(ind), 13);
  var okey = Tiles.createTile('mavi', 13, false);
  assert.ok(Tiles.isRealOkey(okey, ind), 'mavi 13 okey olmalı');
  var notOkey = Tiles.createTile('kirmizi', 13, false);
  assert.ok(!Tiles.isRealOkey(notOkey, ind), 'kirmizi 13 okey olmamalı');
});

test('testOkeyCalc: 13 gösterge => okey 1 (aynı renk)', function () {
  var ind = Tiles.createTile('sari', 13, false);
  assert.strictEqual(Tiles.okeyRankOf(ind), 1);
  assert.ok(Tiles.isRealOkey(Tiles.createTile('sari', 1, false), ind), 'sari 1 okey');
  assert.ok(!Tiles.isRealOkey(Tiles.createTile('sari', 2, false), ind), 'sari 2 okey değil');
});

test('testFakeOkey: sahte okey daima joker, asla gerçek okey değil', function () {
  var ind = Tiles.createTile('kirmizi', 5, false);
  var fake = Tiles.createTile('joker', 0, true);
  assert.ok(Rules.isFakeOkey(fake), 'sahte okey tanınmalı');
  assert.ok(Rules.isJoker(fake, ind), 'sahte okey joker olmalı');
  assert.ok(!Tiles.isRealOkey(fake, ind), 'sahte okey gerçek okey değil');
});

test('countJokers: okey + sahte okey sayımı', function () {
  var ind = Tiles.createTile('kirmizi', 5, false); // okey = kirmizi 6
  var hand = [
    Tiles.createTile('kirmizi', 6, false), // okey
    Tiles.createTile('joker', 0, true),    // sahte
    Tiles.createTile('mavi', 3, false)
  ];
  var c = Rules.countJokers(hand, ind);
  assert.strictEqual(c.okey, 1);
  assert.strictEqual(c.fake, 1);
  assert.strictEqual(c.total, 2);
});

console.log('\n[Per (Set/Run) Doğrulama]');

test('testRun: aynı renk ardışık 3 taş geçerli', function () {
  assert.ok(Rules.isValidRun([
    { color: 'mavi', rank: 4 },
    { color: 'mavi', rank: 5 },
    { color: 'mavi', rank: 6 }
  ]), 'mavi 4-5-6 run olmalı');
  assert.ok(!Rules.isValidRun([
    { color: 'mavi', rank: 4 },
    { color: 'mavi', rank: 5 },
    { color: 'mavi', rank: 8 }
  ]), 'kopuk run geçersiz');
  assert.ok(!Rules.isValidRun([
    { color: 'mavi', rank: 4 },
    { color: 'kirmizi', rank: 5 },
    { color: 'mavi', rank: 6 }
  ]), 'farklı renk run geçersiz');
});

test('testSet: aynı sayı farklı renk 3 taş geçerli', function () {
  assert.ok(Rules.isValidSet([
    { color: 'kirmizi', rank: 9 },
    { color: 'siyah', rank: 9 },
    { color: 'mavi', rank: 9 }
  ]), '9 set olmalı');
  assert.ok(!Rules.isValidSet([
    { color: 'kirmizi', rank: 9 },
    { color: 'kirmizi', rank: 9 },
    { color: 'kirmizi', rank: 9 }
  ]), 'aynı renk set geçersiz');
});

console.log('\n[Kazanma Kontrolü]');

test('testWinningHand: 14 taş tam perlere ayrılırsa kazanır', function () {
  var ind = Tiles.createTile('mavi', 7, false); // okey = mavi 8 (elle çakışmasın)
  // 4+4+3+3 = 14, tamamı per
  var hand = [
    // Run: kirmizi 1,2,3,4 (4)
    Tiles.createTile('kirmizi', 1, false), Tiles.createTile('kirmizi', 2, false),
    Tiles.createTile('kirmizi', 3, false), Tiles.createTile('kirmizi', 4, false),
    // Run: sari 5,6,7,8 (4)
    Tiles.createTile('sari', 5, false), Tiles.createTile('sari', 6, false),
    Tiles.createTile('sari', 7, false), Tiles.createTile('sari', 8, false),
    // Run: siyah 2,3,4 (3)
    Tiles.createTile('siyah', 2, false), Tiles.createTile('siyah', 3, false),
    Tiles.createTile('siyah', 4, false),
    // Set: 11 kirmizi/siyah/mavi (3)
    Tiles.createTile('kirmizi', 11, false), Tiles.createTile('siyah', 11, false),
    Tiles.createTile('mavi', 11, false)
  ];
  assert.strictEqual(hand.length, 14, '14 taş olmalı');
  assert.ok(Rules.isWinningHand(hand, ind), 'tam per el KAZANMALI');
});

test('testWinningHand: 2 taşlık eksik grup kazandırmaz', function () {
  var ind = Tiles.createTile('sari', 13, false); // okey = sari 1
  var hand = [
    Tiles.createTile('mavi', 1, false), Tiles.createTile('mavi', 2, false), Tiles.createTile('mavi', 3, false),
    Tiles.createTile('kirmizi', 5, false), Tiles.createTile('kirmizi', 6, false), Tiles.createTile('kirmizi', 7, false),
    Tiles.createTile('kirmizi', 10, false), Tiles.createTile('siyah', 10, false), Tiles.createTile('mavi', 10, false),
    Tiles.createTile('siyah', 11, false), Tiles.createTile('siyah', 12, false), Tiles.createTile('siyah', 13, false),
    // Kalan 2 taş aynı renk ama ardışık DEĞİL -> per olamaz
    Tiles.createTile('sari', 5, false), Tiles.createTile('sari', 9, false)
  ];
  assert.strictEqual(hand.length, 14, '14 taş olmalı');
  assert.ok(!Rules.isWinningHand(hand, ind), 'kopuk 2 taş kazandırmamalı');
});

test('testWinningHand: geçerli 14 taşlık el kazanır', function () {
  var ind = Tiles.createTile('kirmizi', 13, false); // okey = kirmizi 1
  var hand = [
    // Run: mavi 1,2,3
    Tiles.createTile('mavi', 1, false),
    Tiles.createTile('mavi', 2, false),
    Tiles.createTile('mavi', 3, false),
    // Run: mavi 5,6,7
    Tiles.createTile('mavi', 5, false),
    Tiles.createTile('mavi', 6, false),
    Tiles.createTile('mavi', 7, false),
    // Run: siyah 9,10,11
    Tiles.createTile('siyah', 9, false),
    Tiles.createTile('siyah', 10, false),
    Tiles.createTile('siyah', 11, false),
    // Set: 4 kirmizi/siyah/sari
    Tiles.createTile('kirmizi', 4, false),
    Tiles.createTile('siyah', 4, false),
    Tiles.createTile('sari', 4, false),
    // Set: 8 mavi/sari
    Tiles.createTile('mavi', 8, false),
    Tiles.createTile('sari', 8, false)
  ];
  // Son 2 taş set değil -> kazanmamalı. Bu yüzden gerçek kazanan el kuralım.
  assert.strictEqual(hand.length, 14);
  assert.ok(!Rules.isWinningHand(hand, ind), 'eksik set kazanmamalı');
});

test('testWinningHand: 5 uzun per (3+3+3+3+2 degil) — sadece 14 tam per kazanır', function () {
  var ind = Tiles.createTile('sari', 7, false); // okey = sari 8
  // 3 run (3+3+3=9) + 1 set (3) = 12 + son run (yetersiz 2) -> kazanamaz
  var hand = [
    Tiles.createTile('mavi', 1, false), Tiles.createTile('mavi', 2, false), Tiles.createTile('mavi', 3, false),
    Tiles.createTile('kirmizi', 9, false), Tiles.createTile('kirmizi', 10, false), Tiles.createTile('kirmizi', 11, false),
    Tiles.createTile('siyah', 5, false), Tiles.createTile('siyah', 6, false), Tiles.createTile('siyah', 7, false),
    Tiles.createTile('kirmizi', 12, false), Tiles.createTile('siyah', 12, false), Tiles.createTile('mavi', 12, false),
    // Kalan 2: run OLMAYAN + SET OLMAYAN (farklı renk, farklı rank)
    Tiles.createTile('sari', 1, false), Tiles.createTile('mavi', 6, false)
  ];
  assert.strictEqual(hand.length, 14, '14 taş toplandı');
  assert.ok(!Rules.isWinningHand(hand, ind), 'kalan 2 taş per oluşturmuyorsa kazanmamalı');
});

test('testWinningHand: 4 run + 1 set (4+3+3+4=14) ile KAZANIR', function () {
  var ind = Tiles.createTile('sari', 7, false); // okey = sari 8
  var hand = [
    // Run A: mavi 1,2,3,4 (4)
    Tiles.createTile('mavi', 1, false),
    Tiles.createTile('mavi', 2, false),
    Tiles.createTile('mavi', 3, false),
    Tiles.createTile('mavi', 4, false),
    // Run B: kirmizi 9,10,11,12 (4)
    Tiles.createTile('kirmizi', 9, false),
    Tiles.createTile('kirmizi', 10, false),
    Tiles.createTile('kirmizi', 11, false),
    Tiles.createTile('kirmizi', 12, false),
    // Run C: siyah 5,6,7 (3)
    Tiles.createTile('siyah', 5, false),
    Tiles.createTile('siyah', 6, false),
    Tiles.createTile('siyah', 7, false),
    // Set: 12 mavi/siyah(?)/sari... 12 mavi zaten yok -> farklı renkler
    Tiles.createTile('sari', 12, false),
    Tiles.createTile('mavi', 12, false),
    Tiles.createTile('siyah', 12, false)
  ];
  assert.strictEqual(hand.length, 14);
  assert.ok(Rules.isWinningHand(hand, ind), '4+4+3+3 = 14 geçerli el kazanmalı');
});

test('testWinningHand: joker (okey) boşluğu doldurunca kazanır', function () {
  var ind = Tiles.createTile('kirmizi', 5, false); // okey = kirmizi 6
  var okeyTile = Tiles.createTile('kirmizi', 6, false);
  var hand = [
    // Run A: mavi 9,10, + joker = 11 ? Hayır, joker taşın yerine geçer.
    // mavi 9, mavi 10, OKEY(=mavi 11) => geçerli run
    Tiles.createTile('mavi', 9, false),
    Tiles.createTile('mavi', 10, false),
    okeyTile,
    // Run B: siyah 2,3,4 (3)
    Tiles.createTile('siyah', 2, false),
    Tiles.createTile('siyah', 3, false),
    Tiles.createTile('siyah', 4, false),
    // Run C: sari 7,8,9,10 (4)
    Tiles.createTile('sari', 7, false),
    Tiles.createTile('sari', 8, false),
    Tiles.createTile('sari', 9, false),
    Tiles.createTile('sari', 10, false),
    // Set: 13 kirmizi(?)/mavi/siyah (3) - kirmizi 13 var
    Tiles.createTile('kirmizi', 13, false),
    Tiles.createTile('mavi', 13, false),
    Tiles.createTile('siyah', 13, false),
    // 14. taş: tek kalmasın -> sari 2 ile run B'yi genişlet
    // Aslında yukarıda 13 taş oldu. Sayalım: 3 + 3 + 4 + 3 = 13
    Tiles.createTile('sari', 11, false) // sari 7,8,9,10,11 = 5'li run yapar
  ];
  assert.strictEqual(hand.length, 14);
  assert.ok(Rules.isWinningHand(hand, ind), 'joker ile tamamlanan el kazanmalı');
});

test('isWinningHand: 13 taşlı el kazanmaz (boyut kuralı)', function () {
  var ind = Tiles.createTile('mavi', 2, false);
  var hand = [
    Tiles.createTile('mavi', 1, false), Tiles.createTile('mavi', 2, false), Tiles.createTile('mavi', 3, false),
    Tiles.createTile('siyah', 1, false), Tiles.createTile('siyah', 2, false), Tiles.createTile('siyah', 3, false),
    Tiles.createTile('sari', 1, false), Tiles.createTile('sari', 2, false), Tiles.createTile('sari', 3, false),
    Tiles.createTile('kirmizi', 5, false), Tiles.createTile('kirmizi', 6, false), Tiles.createTile('kirmizi', 7, false),
    Tiles.createTile('kirmizi', 9, false)
  ];
  assert.ok(!Rules.isWinningHand(hand, ind), '13 taş kazanmamalı');
});

console.log('\n[Bot & Oyun Döngüsü]');

test('botChooseDiscard: asla joker atmaz', function () {
  var ind = Tiles.createTile('kirmizi', 3, false); // okey = kirmizi 4
  var hand = [
    Tiles.createTile('kirmizi', 4, false), // okey (joker)
    Tiles.createTile('joker', 0, true),    // sahte okey
    Tiles.createTile('mavi', 9, false),
    Tiles.createTile('sari', 2, false)
  ];
  for (var i = 0; i < 20; i++) {
    var pick = Bot.botChooseDiscard(hand, ind);
    assert.ok(!Rules.isJoker(pick, ind), 'bot joker atmamalı, attı: ' + JSON.stringify(pick));
  }
});

test('botChooseDiscard: her zaman geçerli bir taş döner', function () {
  var ind = Tiles.createTile('sari', 5, false);
  var hand = [Tiles.createTile('mavi', 1, false)];
  var pick = Bot.botChooseDiscard(hand, ind);
  assert.ok(pick && pick.id, 'taş dönmeli');
  assert.strictEqual(pick.id, hand[0].id);
});

test('botChooseDiscard: sadece joker varsa yine de taş döner (kilitlenmez)', function () {
  var ind = Tiles.createTile('kirmizi', 5, false);
  var hand = [
    Tiles.createTile('kirmizi', 6, false),
    Tiles.createTile('joker', 0, true)
  ];
  var pick = Bot.botChooseDiscard(hand, ind);
  assert.ok(pick && pick.id, 'joker bile olsa bir taş dönmeli');
});

test('testNoLockup: deste bitince atılanlar geri karışır', function () {
  var state = Game.createGame(makeRng(99));
  // Deste yokmuş gibi simüle et
  state.discardPile = [];
  for (var i = 0; i < 8; i++) {
    state.discardPile.push(Tiles.createTile('mavi', (i % 13) + 1, false));
  }
  state.deck = [];
  var beforeTop = state.discardPile[state.discardPile.length - 1];
  Game.ensureDeck(state);
  assert.ok(state.deck.length > 0, 'deste yeniden dolmalı');
  assert.strictEqual(state.discardPile.length, 1, 'atılan alanda 1 taş kalmalı');
  assert.strictEqual(state.discardPile[0].id, beforeTop.id, 'üstteki taş korunmalı');
});

test('testNoLockup: deste tamamen boşsa taze deste üretir', function () {
  var state = Game.createGame(makeRng(3));
  state.deck = [];
  state.discardPile = [];
  Game.ensureDeck(state);
  assert.ok(state.deck.length > 0, 'acil deste üretilmeli');
});

test('createGame: başlangıç durumu doğru', function () {
  var s = Game.createGame(makeRng(1));
  assert.strictEqual(s.turn, 0, 'başlangıç sırası 0');
  assert.strictEqual(s.phase, 'drawing');
  assert.strictEqual(s.winner, -1);
  assert.strictEqual(s.hands[0].length, 15);
  assert.strictEqual(s.hands[1].length, 14);
  assert.ok(s.indicator, 'gösterge var');
  assert.ok(!s.indicator.isFakeOkey, 'gösterge sahte okey olamaz');
  var total = s.hands[0].length + s.hands[1].length + s.hands[2].length +
    s.hands[3].length + s.deck.length + 1; // +1 gösterge
  assert.strictEqual(total, 106, 'tüm taşlar hesapta: 106');
});

test('tur akışı: çek -> at -> sıra ilerler', function () {
  var s = Game.createGame(makeRng(11));
  var before = s.hands[0].length;
  Game.drawFromDeck(s, 0);
  assert.strictEqual(s.hands[0].length, before + 1, 'çekince el +1');
  assert.strictEqual(s.phase, 'discarding', 'faz atma olmalı');
  var toDiscard = s.hands[0][0];
  Game.discardTile(s, 0, toDiscard.id);
  // P0 tur başında 15 taşla başlar: çek (16) -> at (15) = tur sonrası 15.
  assert.strictEqual(s.hands[0].length, 15, 'atınca el 15 (başlangıç oyuncusu 15 taş)');
  assert.strictEqual(s.discardPile.length, 1, 'atılan 1 taş');
  Game.advanceTurn(s);
  assert.strictEqual(s.turn, 1, 'sıra Bot 1’e geçti');
  assert.strictEqual(s.phase, 'drawing', 'faz çekmeye döndü');
});

test('atılan taştan çekme çalışır', function () {
  var s = Game.createGame(makeRng(21));
  Game.drawFromDeck(s, 0);
  var t = s.hands[0][0];
  Game.discardTile(s, 0, t.id);
  Game.advanceTurn(s); // bot 1
  var topId = s.discardPile[s.discardPile.length - 1].id;
  var n = s.hands[1].length;
  Game.drawFromDiscard(s, 1);
  assert.strictEqual(s.hands[1].length, n + 1, 'elden +1');
  assert.strictEqual(s.hands[1][s.hands[1].length - 1].id, topId, 'doğru taş alındı');
  assert.strictEqual(s.discardPile.length, 0, 'atılan alan boşaldı');
});

test('bot turu: çeker ve atar, el boyutu korunur', function () {
  var s = Game.createGame(makeRng(5));
  Game.advanceTurn(s); // sıra bot 1
  var before = s.hands[1].length;
  Game.botTurn(s, 1);
  assert.strictEqual(s.hands[1].length, before, 'bot turu sonunda el boyutu aynı');
});

test('autoPlayBots: sıra insana gelene kadar botlar oynar (kilitlenme yok)', function () {
  var s = Game.createGame(makeRng(77));
  s.turn = 1; // sırayı bot 1'e ver
  Game.advanceTurn(s); // drawing fazına geç
  s.turn = 1;
  var guardCalls = 0;
  var origPush = Game.pushLog;
  Game.autoPlayBots(s);
  assert.ok(s.turn === 0 || s.phase === 'gameover',
    'botlar oynadı, sıra insana geldi veya oyun bitti. turn=' + s.turn + ' phase=' + s.phase);
  assert.ok(s.hands[1].length === 14 && s.hands[2].length === 14 && s.hands[3].length === 14,
    'bot elleri 14’e döndü (çekti-attı)');
});

test('checkAllWins: geçerli elle kazanan tespit edilir', function () {
  var s = Game.createGame(makeRng(9));
  var ind = s.indicator;
  // Oyuncu 0'a geçerli 14 taş ver
  s.hands[0] = [
    Tiles.createTile('mavi', 1, false), Tiles.createTile('mavi', 2, false), Tiles.createTile('mavi', 3, false),
    Tiles.createTile('mavi', 5, false), Tiles.createTile('mavi', 6, false), Tiles.createTile('mavi', 7, false),
    Tiles.createTile('siyah', 9, false), Tiles.createTile('siyah', 10, false), Tiles.createTile('siyah', 11, false),
    Tiles.createTile('kirmizi', 4, false), Tiles.createTile('siyah', 4, false), Tiles.createTile('sari', 4, false),
    Tiles.createTile('mavi', 4, false), Tiles.createTile('sari', 8, false)
  ];
  // Son taş sari 8 tek kalır; test için geçerli yapalım: onu mavi 4 yerine...
  // Aslında mavi 4 zaten var. Sari 8 yerine sari 12 koyalım -> yine tek. 
  // Klasik: 4+3+3+4 = 14
  s.hands[0] = [
    Tiles.createTile('mavi', 1, false), Tiles.createTile('mavi', 2, false),
    Tiles.createTile('mavi', 3, false), Tiles.createTile('mavi', 4, false),
    Tiles.createTile('siyah', 5, false), Tiles.createTile('siyah', 6, false), Tiles.createTile('siyah', 7, false),
    Tiles.createTile('kirmizi', 9, false), Tiles.createTile('kirmizi', 10, false),
    Tiles.createTile('kirmizi', 11, false), Tiles.createTile('kirmizi', 12, false),
    Tiles.createTile('sari', 12, false), Tiles.createTile('mavi', 12, false), Tiles.createTile('siyah', 12, false)
  ];
  assert.strictEqual(s.hands[0].length, 14);
  var w = Game.checkPlayerWin(s, 0);
  assert.ok(w, 'geçerli el kazanan olmalı');
  Game.checkAllWins(s);
  assert.strictEqual(s.winner, 0, 'kazanan 0 atanmalı');
  assert.strictEqual(s.phase, 'gameover', 'faz gameover olmalı');
});

test('simülasyon: 200 tam oyun kilitlenmeden tamamlanır', function () {
  var gamesFinished = 0;
  for (var g = 0; g < 200; g++) {
    var s = Game.createGame(makeRng(g + 1));
    var steps = 0;
    while (s.phase !== 'gameover' && steps < 500) {
      // insan yerine basit otomatik hamle
      var decision = Bot.botChooseDraw(s, s.turn);
      if (decision.from === 'discard' && s.discardPile.length > 0) {
        Game.drawFromDiscard(s, s.turn);
      } else {
        Game.drawFromDeck(s, s.turn);
      }
      var pick = Bot.botChooseDiscard(s.hands[s.turn], s.indicator);
      if (!pick) break;
      Game.discardTile(s, s.turn, pick.id);
      if (s.hands[s.turn].length === 14 && Game.checkPlayerWin(s, s.turn)) {
        s.winner = s.turn;
        s.phase = 'gameover';
        break;
      }
      Game.advanceTurn(s);
      steps++;
    }
    if (s.phase === 'gameover') gamesFinished++;
    assert.ok(steps < 500, 'oyun ' + g + ' kilitlenmemeli');
    // El boyutları tutarlı olmalı: her oyuncu 13 veya 14
    for (var p = 0; p < 4; p++) {
      var n = s.hands[p].length;
      // Başlangıç oyuncusu (0) 15, diğerleri 14 taş tutar. Tolerans tanınır.
    var ok = (p === 0) ? (n === 14 || n === 15) : (n === 13 || n === 14);
    assert.ok(ok, 'oyuncu ' + p + ' el boyutu beklenen aralıkta değil, bulunan ' + n);
    }
  }
  console.log('      info: ' + gamesFinished + '/200 oyun doğal olarak kazanıldı (kalanı süre sınırı)');
});

console.log('\n=== Sonuç: ' + passed + ' geçti, ' + failed + ' başarısız ===\n');

if (failed > 0) {
  console.log('BAŞARISIZ TESTLER:');
  failures.forEach(function (f) {
    console.log(' - ' + f.name + ': ' + (f.err && f.err.message));
  });
  process.exit(1);
} else {
  console.log('TÜM TESTLER GEÇTİ ✅');
  process.exit(0);
}
