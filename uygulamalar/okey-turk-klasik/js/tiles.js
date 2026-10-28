/* ==========================================================================
   tiles.js — Taş modeli, deste, karıştırma, dağıtım, gösterge/okey hesabı
   UMD-uyumlu IIFE: hem tarayıcıda (window.OkeyTiles) hem Node'da (module.exports)
   ========================================================================== */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else {
    root.OkeyTiles = mod;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Renkler: kirmizi, siyah, mavi, sari (Türk okeyi standart)
  var TILE_COLORS = ['kirmizi', 'siyah', 'mavi', 'sari'];
  var COLOR_LABEL = {
    kirmizi: 'Kırmızı',
    siyah: 'Siyah',
    mavi: 'Mavi',
    sari: 'Sarı'
  };
  var RANKS = [];
  for (var r = 1; r <= 13; r++) RANKS.push(r);

  var idCounter = 0;
  function resetIdCounter() { idCounter = 0; }

  /**
   * Yeni bir taş nesnesi üretir.
   * @param {string} color
   * @param {number} rank 1..13
   * @param {boolean} isFakeOkey sahte okey mi
   */
  function createTile(color, rank, isFakeOkey) {
    idCounter += 1;
    return {
      id: 't' + idCounter,
      color: color,
      rank: rank,
      isFakeOkey: !!isFakeOkey
    };
  }

  /**
   * Gösterge taşına göre okey sırası: 13 -> 1, aksi halde rank+1
   */
  function okeyRankOf(indicator) {
    if (!indicator) return 0;
    return indicator.rank === 13 ? 1 : indicator.rank + 1;
  }

  /**
   * Gerçek okey mi? (göstergeyle AYNI renk ve okey sırasındaki taş)
   * Sahte okey asla "gerçek okey" değildir ama joker sayılır.
   */
  function isRealOkey(tile, indicator) {
    if (!tile || !indicator) return false;
    if (tile.isFakeOkey) return false;
    return tile.color === indicator.color && tile.rank === okeyRankOf(indicator);
  }

  /**
   * 106 taşlık klasik okey destesi:
   *  4 renk x 13 sayı x 2 kopya = 104 normal taş
   *  + 2 sahte okey = 106
   */
  function buildDeck() {
    resetIdCounter();
    var deck = [];
    for (var c = 0; c < TILE_COLORS.length; c++) {
      for (var r = 0; r < RANKS.length; r++) {
        for (var k = 0; k < 2; k++) {
          deck.push(createTile(TILE_COLORS[c], RANKS[r], false));
        }
      }
    }
    deck.push(createTile('joker', 0, true)); // sahte okey 1
    deck.push(createTile('joker', 0, true)); // sahte okey 2
    return deck;
  }

  /**
   * Fisher-Yates karıştırma. rng enjekte edilebilir (test / seed).
   */
  function shuffle(deck, rng) {
    var rand = rng || Math.random;
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  /**
   * Göstergeyi belirler. Gösterge SAHTE OKEY olamaz; normal taş olmalı.
   * @returns {{indicator: Object, deck: Array}}
   */
  function pickIndicator(deck) {
    var idx = -1;
    for (var i = deck.length - 1; i >= 0; i--) {
      if (!deck[i].isFakeOkey) { idx = i; break; }
    }
    if (idx === -1) return { indicator: null, deck: deck };
    var indicator = deck.splice(idx, 1)[0];
    return { indicator: indicator, deck: deck };
  }

  /**
   * Dağıtım: başlangıç oyuncusu 15, diğerleri 14 taş.
   * @returns {{hands: Array<Array>, remainingDeck: Array, discardTop: Object|null}}
   */
  function deal(deck) {
    var hands = [[], [], [], []];
    var working = deck.slice();
    // Deste karıştırılmış varsayılır; başlangıç oyuncusu 15 taş alır.
    for (var i = 0; i < 15; i++) hands[0].push(working.pop());
    for (var p = 1; p < 4; p++) {
      for (var k = 0; k < 14; k++) hands[p].push(working.pop());
    }
    return {
      hands: hands,
      remainingDeck: working,
      discardTop: null
    };
  }

  function colorLabel(color) {
    return COLOR_LABEL[color] || color;
  }

  /** Taşın okunabilir etiketi: "Kırmızı 5", "Okey" gibi */
  function tileLabel(tile, indicator) {
    if (!tile) return '—';
    if (tile.isFakeOkey) return 'Sahte Okey';
    var name = colorLabel(tile.color) + ' ' + tile.rank;
    if (indicator && isRealOkey(tile, indicator)) name += ' (OKEY)';
    return name;
  }

  return {
    TILE_COLORS: TILE_COLORS,
    COLOR_LABEL: COLOR_LABEL,
    RANKS: RANKS,
    resetIdCounter: resetIdCounter,
    createTile: createTile,
    okeyRankOf: okeyRankOf,
    isRealOkey: isRealOkey,
    buildDeck: buildDeck,
    shuffle: shuffle,
    pickIndicator: pickIndicator,
    deal: deal,
    colorLabel: colorLabel,
    tileLabel: tileLabel
  };
}));
