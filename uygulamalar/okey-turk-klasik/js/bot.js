/* ==========================================================================
   bot.js — Otonom bot zekası (Numex Okey).
   - Basit ama GEÇERLİ hamleler üretir, asla joker atmaz.
   - El değerlendirme (hand evaluation): per potansiyeli, izolasyon cezası.
   - Rakip analizi: atılan taştan renk yoklaması çıkarımı.
   - Kaynak modu (deck) vs. atık modu (discard) kararını beklenen kazançla verir.
   UMD-uyumlu IIFE: hem tarayıcıda (window.OkeyBot) hem Node'da (module.exports).
   ========================================================================== */
(function (root, factory) {
  var mod = factory(
    (typeof module === 'object' && module.exports)
      ? require('./rules.js')
      : root.OkeyRules
  );
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else {
    root.OkeyBot = mod;
  }
}(typeof self !== 'undefined' ? self : this, function (Rules) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  YARDIMCILAR                                                        */
  /* ------------------------------------------------------------------ */

  /** Aynı sayıdan kaç FARKLI renk elde var? (set potansiyeli) */
  function distinctColorsForRank(hand, rank, indicator) {
    var seen = {};
    var n = 0;
    for (var i = 0; i < hand.length; i++) {
      var t = hand[i];
      if (Rules.isJoker(t, indicator)) continue;
      if (t.rank !== rank) continue;
      if (!seen[t.color]) {
        seen[t.color] = true;
        n++;
      }
    }
    return n;
  }

  /** Aynı renkte rank'a komşu taş var mı? (run potansiyeli) */
  function hasRunNeighbor(hand, tile, indicator) {
    if (!tile) return false;
    for (var i = 0; i < hand.length; i++) {
      var t = hand[i];
      if (Rules.isJoker(t, indicator)) continue;
      if (t.color === tile.color && Math.abs(t.rank - tile.rank) === 1) return true;
    }
    return false;
  }

  /**
   * Tek bir taşın elde ne kadar "işe yaradığını" puanlar.
   * Yüksek puan = atılmaması gereken taş.
   */
  function tileValue(tile, hand, indicator) {
    if (!tile) return 0;
    if (Rules.isJoker(tile, indicator)) return 1000; // asla atma

    var score = 0;
    var colors = distinctColorsForRank(hand, tile.rank, indicator);
    // İki farklı renk = set'in 2/3'ü hazır
    if (colors >= 3) score += 40;
    else if (colors === 2) score += 22;

    // Run komşuluğu: iki taraflıysa çok değerli
    var left = false, right = false;
    for (var i = 0; i < hand.length; i++) {
      var t = hand[i];
      if (Rules.isJoker(t, indicator)) continue;
      if (t.color !== tile.color) continue;
      if (t.rank === tile.rank - 1) left = true;
      if (t.rank === tile.rank + 1) right = true;
    }
    if (left && right) score += 35;
    else if (left || right) score += 16;

    // Aynı renkteki taş yoğunluğu (renk toplama sinyali)
    var sameColor = 0;
    for (var j = 0; j < hand.length; j++) {
      var u = hand[j];
      if (Rules.isJoker(u, indicator)) continue;
      if (u.color === tile.color) sameColor++;
    }
    score += sameColor * 1.5;

    return score;
  }

  /**
   * Bot, atılan son taşı almaya değer mi?
   * Taş elindeki bir per'i güçlendiriyorsa al.
   */
  function botWantsDiscardPile(discardTop, hand, indicator) {
    if (!discardTop) return false;
    if (Rules.isJoker(discardTop, indicator)) return true;

    // Aynı rank'tan farklı renk var mı?
    var sameRankDiffColor = 0;
    var runNeighbor = 0;
    for (var i = 0; i < hand.length; i++) {
      var t = hand[i];
      if (Rules.isJoker(t, indicator)) continue;
      if (t.rank === discardTop.rank && t.color !== discardTop.color) sameRankDiffColor++;
      if (t.color === discardTop.color && Math.abs(t.rank - discardTop.rank) === 1) runNeighbor++;
    }
    // 2 farklı renk varsa set tamamlanır, 1 komşu varsa run kurulabilir
    return sameRankDiffColor >= 2 || runNeighbor >= 1;
  }

  /**
   * Rakip yoklaması: atık yığınında bir rengin kaç kez atıldığına bakarak
   * o rengi toplamanın güvenli olup olmadığını tahmin eder.
   */
  function colorRiskFromDiscards(discardPile, color) {
    if (!discardPile || discardPile.length === 0) return 0;
    var n = 0;
    for (var i = 0; i < discardPile.length; i++) {
      if (discardPile[i] && discardPile[i].color === color) n++;
    }
    // Çok atılan renk büyük olasılıkla rakipte yoktur -> riskli değil, tersine
    // az atılan renk rakipte toplanıyor olabilir.
    return n;
  }

  /** Bot atacak taşı seçer (kilitlenmesin diye her zaman bir taş döner) */
  function botChooseDiscard(hand, indicator) {
    if (!hand || hand.length === 0) return null;
    var pick = Rules.bestDiscardSuggestion(hand, indicator);
    if (pick) return pick;
    // Güvenlik ağı: joker olmayan ilk taş, yoksa ilk taş
    for (var i = 0; i < hand.length; i++) {
      if (!Rules.isJoker(hand[i], indicator)) return hand[i];
    }
    return hand[0];
  }

  /**
   * Aynı eli iki kez değerlendirmemek için en güvenli (en düşük değerli)
   * taşı bulur — botChooseDiscard'dan bağımsız yedek strateji.
   */
  function botChooseDiscardByValue(hand, indicator) {
    if (!hand || hand.length === 0) return null;
    var best = null;
    var bestVal = Infinity;
    for (var i = 0; i < hand.length; i++) {
      var t = hand[i];
      if (Rules.isJoker(t, indicator)) continue;
      var v = tileValue(t, hand, indicator);
      if (v < bestVal) {
        bestVal = v;
        best = t;
      }
    }
    return best || hand[0];
  }

  /**
   * Botun tur kararı: nereden çekeceği.
   * @returns {{from:'deck'|'discard'}}
   */
  function botChooseDraw(state, playerIdx) {
    var top = state.discardPile.length > 0
      ? state.discardPile[state.discardPile.length - 1]
      : null;
    if (top && botWantsDiscardPile(top, state.hands[playerIdx], state.indicator)) {
      return { from: 'discard' };
    }
    return { from: 'deck' };
  }

  /**
   * Botun GELİŞMİŞ tur kararı: kaynak seçimi + gerekçe + ellerin
   * ne kadarının perlere ayrılabildiği (partitionScore).
   * @returns {{from:'deck'|'discard', reason:string, handScore:number}}
   */
  function botDecideTurn(state, playerIdx) {
    var hand = state.hands[playerIdx] || [];
    var indicator = state.indicator;
    var top = state.discardPile.length > 0
      ? state.discardPile[state.discardPile.length - 1]
      : null;

    var handScore = 0;
    try {
      if (typeof Rules.partitionScore === 'function') {
        handScore = Rules.partitionScore(hand, indicator) || 0;
      }
    } catch (e) {
      handScore = 0;
    }

    if (top && botWantsDiscardPile(top, hand, indicator)) {
      var risk = colorRiskFromDiscards(state.discardPile, top.color);
      return {
        from: 'discard',
        reason: risk > 2
          ? 'atik rengi zayif, tas set/run tamamliyor'
          : 'tas mevcut perlere uyuyor, alınıyor',
        handScore: handScore
      };
    }
    return {
      from: 'deck',
      reason: 'atikta ise yarar tas yok, kapali desteden cekiliyor',
      handScore: handScore
    };
  }

  /**
   * Elin "bitişe ne kadar yakın" olduğunu 0..100 arası puanlar.
   * Per sayısı + joker sayısı + kalan taş sayısına bakar.
   */
  function handReadiness(hand, indicator) {
    if (!hand || hand.length === 0) return 0;
    var jokers = Rules.countJokers(hand, indicator);
    var normals = hand.length - jokers.total;
    var base = Math.max(0, 14 - hand.length) * 12;
    var jokerBonus = jokers.total * 14;
    var pairBonus = 0;
    for (var i = 0; i < 14; i++) { /* boş — döngü sırası sabit tutuldu */ break; }

    // Aynı rank/renk eşleşmelerinden kaba bir yakınlık bonusu
    var rankCount = {};
    for (var k = 0; k < hand.length; k++) {
      var t = hand[k];
      if (Rules.isJoker(t, indicator)) continue;
      rankCount[t.rank] = (rankCount[t.rank] || 0) + 1;
    }
    for (var r in rankCount) {
      if (rankCount[r] >= 2) pairBonus += 4;
    }

    var score = base + jokerBonus + pairBonus + normals * 0.5;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Bot için arkadaşça bir isim/kişilik etiketi (UI'da kullanılabilir).
   */
  function botPersona(playerIdx) {
    var personas = [
      'Sen (Oyuncu)',
      'Sakin Bot',
      'Agresif Bot',
      'Temkinli Bot'
    ];
    return personas[playerIdx] || 'Bot ' + playerIdx;
  }

  return {
    botWantsDiscardPile: botWantsDiscardPile,
    botChooseDiscard: botChooseDiscard,
    botChooseDiscardByValue: botChooseDiscardByValue,
    botChooseDraw: botChooseDraw,
    botDecideTurn: botDecideTurn,
    handReadiness: handReadiness,
    tileValue: tileValue,
    botPersona: botPersona
  };
}));
