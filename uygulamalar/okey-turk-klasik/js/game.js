/* ==========================================================================
   game.js — Durum makinesi: dağıtım, sıra, çekme/atma, kazanma, bot turu.
   UMD-uyumlu IIFE.
   ========================================================================== */
(function (root, factory) {
  var mod = factory(
    (typeof module === 'object' && module.exports)
      ? {
          Tiles: require('./tiles.js'),
          Rules: require('./rules.js'),
          Bot: require('./bot.js')
        }
      : {
          Tiles: root.OkeyTiles,
          Rules: root.OkeyRules,
          Bot: root.OkeyBot
        }
  );
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else {
    root.OkeyGame = mod;
  }
}(typeof self !== 'undefined' ? self : this, function (deps) {
  'use strict';

  var Tiles = deps.Tiles;
  var Rules = deps.Rules;
  var Bot = deps.Bot;

  var PLAYER_NAMES = ['Sen', 'Bot 1', 'Bot 2', 'Bot 3'];

  /**
   * Yeni oyun durumu oluşturur.
   */
  function createGame(rng) {
    var deck = Tiles.shuffle(Tiles.buildDeck(), rng);
    var picked = Tiles.pickIndicator(deck);
    var indicator = picked.indicator;
    deck = picked.deck;
    var dealt = Tiles.deal(deck);

    var state = {
      deck: dealt.remainingDeck,
      discardPile: [],
      hands: dealt.hands,
      indicator: indicator,
      okeyRank: Tiles.okeyRankOf(indicator),
      okeyColor: indicator ? indicator.color : '',
      turn: 0,
      phase: 'drawing',       // 'drawing' | 'discarding' | 'gameover'
      winner: -1,
      selectedTileId: null,
      playerNames: PLAYER_NAMES.slice(),
      log: [],
      lastDrawnFrom: null,
      turnCount: 0
    };
    pushLog(state, 'Yeni oyun başladı. Gösterge: ' + Tiles.tileLabel(indicator, indicator) +
      ' | Okey: ' + Tiles.colorLabel(state.okeyColor) + ' ' + state.okeyRank);
    return state;
  }

  function pushLog(state, msg) {
    state.log.push(msg);
    if (state.log.length > 60) state.log.shift();
  }

  /* ------------------------------ DESTE ------------------------------- */

  /**
   * Kapalı desteden çek. Deste boşsa atılanlar (en üstteki hariç)
   * karıştırılıp yeni deste yapılır -> KİLİTLENME YOK.
   */
  function ensureDeck(state) {
    if (state.deck.length > 0) return;
    if (state.discardPile.length <= 1) {
      // Acil durum: hiç taş kalmadıysa sıfırdan deste üret (güvenlik ağı)
      var fresh = Tiles.shuffle(Tiles.buildDeck());
      state.deck = fresh;
      pushLog(state, 'Deste tükendi — yeni deste açıldı.');
      return;
    }
    var top = state.discardPile[state.discardPile.length - 1];
    var recycle = state.discardPile.slice(0, state.discardPile.length - 1);
    state.discardPile = [top];
    state.deck = Tiles.shuffle(recycle);
    pushLog(state, 'Kapalı deste bitti, atılan taşlar karıştırılıp yeni deste yapıldı.');
  }

  /** Kapalı desteden taş çek */
  function drawFromDeck(state, playerIdx) {
    if (state.phase === 'gameover') return state;
    ensureDeck(state);
    var tile = state.deck.pop();
    if (!tile) return state;
    state.hands[playerIdx].push(tile);
    state.lastDrawnFrom = 'deck';
    state.phase = 'discarding';
    pushLog(state, state.playerNames[playerIdx] + ' kapalı desteden taş çekti.');
    return state;
  }

  /** Atılan son taşı çek */
  function drawFromDiscard(state, playerIdx) {
    if (state.phase === 'gameover') return state;
    if (state.discardPile.length === 0) return state;
    var tile = state.discardPile.pop();
    state.hands[playerIdx].push(tile);
    state.lastDrawnFrom = 'discard';
    state.phase = 'discarding';
    pushLog(state, state.playerNames[playerIdx] + ' atılan taşı aldı.');
    return state;
  }

  /** Elden taş at */
  function discardTile(state, playerIdx, tileId) {
    if (state.phase === 'gameover') return state;
    var hand = state.hands[playerIdx];
    var idx = -1;
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].id === tileId) { idx = i; break; }
    }
    if (idx === -1) return state;
    var tile = hand.splice(idx, 1)[0];
    state.discardPile.push(tile);
    state.selectedTileId = null;
    state.lastDrawnFrom = null;
    pushLog(state, state.playerNames[playerIdx] + ' ' + Tiles.tileLabel(tile, state.indicator) + ' attı.');
    return state;
  }

  /* ------------------------------ KAZANMA ----------------------------- */

  function checkPlayerWin(state, playerIdx) {
    return Rules.isWinningHand(state.hands[playerIdx], state.indicator);
  }

  function checkAllWins(state) {
    for (var i = 0; i < 4; i++) {
      if (state.hands[i].length === 14 && checkPlayerWin(state, i)) {
        state.winner = i;
        state.phase = 'gameover';
        pushLog(state, '🎉 ' + state.playerNames[i] + ' OKEY YAPTI!');
        return true;
      }
    }
    return false;
  }

  function advanceTurn(state) {
    state.turn = (state.turn + 1) % 4;
    state.turnCount += 1;
    state.phase = 'drawing';
    state.selectedTileId = null;
    return state;
  }

  /* ------------------------------- BOT -------------------------------- */

  /**
   * Tek bir botun turunu oynar: çek + at.
   */
  function botTurn(state, playerIdx) {
    if (state.phase === 'gameover') return state;

    // 1) Çek
    var decision = Bot.botChooseDraw(state, playerIdx);
    if (decision.from === 'discard') {
      drawFromDiscard(state, playerIdx);
    } else {
      drawFromDeck(state, playerIdx);
    }

    // 2) At
    var hand = state.hands[playerIdx];
    var toDiscard = Bot.botChooseDiscard(hand, state.indicator);
    if (!toDiscard) {
      // Güvenlik: el boşsa (olmamalı) rastgele at
      toDiscard = hand[0];
    }
    discardTile(state, playerIdx, toDiscard.id);

    // 3) Kazandı mı?
    if (state.hands[playerIdx].length === 14 && checkPlayerWin(state, playerIdx)) {
      state.winner = playerIdx;
      state.phase = 'gameover';
      pushLog(state, '🎉 ' + state.playerNames[playerIdx] + ' OKEY YAPTI!');
    }
    return state;
  }

  /**
   * İnsan oyuncunun (0) sırası gelene kadar botları oynatır.
   * Kilitlenmeye karşı max iterasyon koruması vardır.
   */
  function autoPlayBots(state) {
    var guard = 0;
    while (state.phase !== 'gameover' && state.turn !== 0 && guard < 200) {
      var idx = state.turn;
      botTurn(state, idx);
      if (state.phase === 'gameover') break;
      advanceTurn(state);
      guard++;
    }
    return state;
  }

  function newGame(rng) {
    return createGame(rng);
  }

  return {
    PLAYER_NAMES: PLAYER_NAMES,
    createGame: createGame,
    newGame: newGame,
    pushLog: pushLog,
    ensureDeck: ensureDeck,
    drawFromDeck: drawFromDeck,
    drawFromDiscard: drawFromDiscard,
    discardTile: discardTile,
    advanceTurn: advanceTurn,
    checkPlayerWin: checkPlayerWin,
    checkAllWins: checkAllWins,
    botTurn: botTurn,
    autoPlayBots: autoPlayBots
  };
}));
