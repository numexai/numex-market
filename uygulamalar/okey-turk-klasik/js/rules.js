/* ==========================================================================
   rules.js — Okey kuralları: okey/joker tanımı, per (set/run) bulma,
   el geçerliliği (kazanma kontrolü), bot için atış önerisi.
   UMD-uyumlu IIFE.
   ========================================================================== */
(function (root, factory) {
  var mod = factory(
    (typeof module === 'object' && module.exports)
      ? require('./tiles.js')
      : root.OkeyTiles
  );
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else {
    root.OkeyRules = mod;
  }
}(typeof self !== 'undefined' ? self : this, function (Tiles) {
  'use strict';

  var COLORS = ['kirmizi', 'siyah', 'mavi', 'sari'];

  /* ----------------------------- JOKER TANIMLARI ---------------------- */

  function isOkey(tile, indicator) {
    return Tiles.isRealOkey(tile, indicator);
  }

  function isFakeOkey(tile) {
    return !!(tile && tile.isFakeOkey);
  }

  /** Okey VEYA sahte okey => joker (per içinde her taşın yerine geçebilir) */
  function isJoker(tile, indicator) {
    return isOkey(tile, indicator) || isFakeOkey(tile);
  }

  function countJokers(tiles, indicator) {
    var okey = 0, fake = 0;
    for (var i = 0; i < tiles.length; i++) {
      if (isFakeOkey(tiles[i])) fake++;
      else if (isOkey(tiles[i], indicator)) okey++;
    }
    return { okey: okey, fake: fake, total: okey + fake };
  }

  /** Normal (joker olmayan, geçerli renkli) taşlar */
  function normalTiles(tiles, indicator) {
    var out = [];
    for (var i = 0; i < tiles.length; i++) {
      if (!isJoker(tiles[i], indicator)) out.push(tiles[i]);
    }
    return out;
  }

  /* ------------------------------- PER'LER ---------------------------- */

  /**
   * Per (grup) modelleri:
   *  SET : aynı sayı, FARKLI renklerden >= 3 taş   (örn. 5kirmizi 5siyah 5mavi)
   *  RUN : aynı renk, ardışık sayılar >= 3 taş      (örn. kirmizi 4,5,6)
   * Joker (okey / sahte okey) herhangi bir taşın YERİNE geçebilir.
   */

  /** Bir per'in geçerli olup olmadığı: normalize edilmiş (rank/color) listesi */
  function isValidSet(entries) {
    if (entries.length < 3) return false;
    var ranks = {}, colors = {};
    for (var i = 0; i < entries.length; i++) {
      ranks[entries[i].rank] = true;
      colors[entries[i].color] = true;
    }
    var rk = Object.keys(ranks);
    var cl = Object.keys(colors);
    return rk.length === 1 && cl.length === entries.length && cl.length <= 4;
  }

  function isValidRun(entries) {
    if (entries.length < 3) return false;
    var color = entries[0].color;
    var rs = [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].color !== color) return false;
      rs.push(entries[i].rank);
    }
    rs.sort(function (a, b) { return a - b; });
    for (var k = 1; k < rs.length; k++) {
      if (rs[k] !== rs[k - 1] + 1) return false;
    }
    return true;
  }

  function isValidPer(entries) {
    return isValidSet(entries) || isValidRun(entries);
  }

  /* --------------- Partition (el -> perlere ayrılabilir mi?) ----------- */

  /**
   * Taş yardımcı anahtarı: "renk:rank"
   */
  function key(t) { return t.color + ':' + t.rank; }

  /**
   * Bir multiset'ten (string anahtar -> adet) geçerli per çıkarma denemesi
   * için aday üretimi. Backtracking ile tam bölümleme arar.
   */

  /**
   * Elimizdeki normal taşları (jokerler hariç) set/run perlerine ayırıp
   * kalan taş sayısını ve kalanları döndürür. Jokerler her adımda boşluk
   * doldurmak için kullanılır.
   *
   * @param {Array} normals joker olmayan taşlar
   * @param {number} jokerCount kullanılabilir joker sayısı
   * @param {Object} memo (opsiyonel) memoization
   */
  function canPartition(normals, jokerCount, memo) {
    memo = memo || {};
    if (normals.length === 0) return { ok: true, usedJokers: 0 };

    var sig = normals.slice().map(key).sort().join('|') + '#' + jokerCount;
    if (memo[sig] !== undefined) return memo[sig];

    // Hiç taş kalmadıysa başarılı
    if (normals.length === 0) {
      memo[sig] = { ok: true, usedJokers: 0 };
      return memo[sig];
    }

    var remain = normals.slice();

    // 1) DOĞAL SET dene: aynı rank, farklı renkler >= 3
    var byRank = {};
    for (var i = 0; i < remain.length; i++) {
      var r = remain[i].rank;
      if (!byRank[r]) byRank[r] = [];
      byRank[r].push(remain[i]);
    }
    var rks = Object.keys(byRank);
    for (var a = 0; a < rks.length; a++) {
      var group = byRank[rks[a]];
      // benzersiz renkleri al (aynı renk+rank 2 kopya varsa birini seç)
      var seenColor = {};
      var uniq = [];
      for (var g = 0; g < group.length; g++) {
        if (!seenColor[group[g].color]) {
          seenColor[group[g].color] = true;
          uniq.push(group[g]);
        }
      }
      if (uniq.length >= 3) {
        for (var take = 3; take <= uniq.length; take++) {
          var subset = uniq.slice(0, take);
          var rest = removeTiles(remain, subset);
          var res = canPartition(rest, jokerCount, memo);
          if (res.ok) {
            memo[sig] = { ok: true, usedJokers: res.usedJokers };
            return memo[sig];
          }
        }
        // joker ile 3'e tamamlanabilir mi? (2 farklı renk + joker)
        if (uniq.length === 2 && jokerCount >= 1) {
          var rest2 = removeTiles(remain, uniq.slice(0, 2));
          var res2 = canPartition(rest2, jokerCount - 1, memo);
          if (res2.ok) {
            memo[sig] = { ok: true, usedJokers: res2.usedJokers + 1 };
            return memo[sig];
          }
        }
      }
    }

    // 2) DOĞAL RUN dene: aynı renk, ardışık >= 3
    var byColor = {};
    for (var m = 0; m < remain.length; m++) {
      var col = remain[m].color;
      if (!byColor[col]) byColor[col] = {};
      byColor[col][remain[m].rank] = remain[m];
    }
    var cols = Object.keys(byColor);
    for (var c = 0; c < cols.length; c++) {
      var colorMap = byColor[cols[c]];
      var ranks = Object.keys(colorMap).map(Number).sort(function (x, y) { return x - y; });
      // ardışık koşuları bul (uzunluk >= 3)
      var runStart = null, prev = null, runSet = [];
      for (var ri = 0; ri <= ranks.length; ri++) {
        var cur = ranks[ri];
        if (prev !== null && cur === prev + 1) {
          runSet.push(cur);
        } else {
          if (runSet.length >= 3) {
            var tilesToRemove = [];
            for (var q = 0; q < runSet.length; q++) tilesToRemove.push(colorMap[runSet[q]]);
            var restR = removeTiles(remain, tilesToRemove);
            var resR = canPartition(restR, jokerCount, memo);
            if (resR.ok) {
              memo[sig] = { ok: true, usedJokers: resR.usedJokers };
              return memo[sig];
            }
          }
          runSet = [];
        }
        if (cur !== undefined) runSet.push(cur);
        prev = (cur === undefined) ? prev : cur;
      }
    }

    // 3) JOKER ile RUN tamamlama: aynı renkte 2 ardışık + joker
    if (jokerCount >= 1) {
      for (var c2 = 0; c2 < cols.length; c2++) {
        var cm = byColor[cols[c2]];
        var rk2 = Object.keys(cm).map(Number);
        for (var i2 = 0; i2 < rk2.length; i2++) {
          for (var j2 = i2 + 1; j2 < rk2.length; j2++) {
            if (Math.abs(rk2[i2] - rk2[j2]) === 1) {
              // iki taş + 1 joker = geçerli run
              var pair = [cm[rk2[i2]], cm[rk2[j2]]];
              var restJ = removeTiles(remain, pair);
              var resJ = canPartition(restJ, jokerCount - 1, memo);
              if (resJ.ok) {
                memo[sig] = { ok: true, usedJokers: resJ.usedJokers + 1 };
                return memo[sig];
              }
            }
          }
        }
      }
      // 3) JOKER ile SET tamamlama: aynı rank 2 farklı renk + joker
      if (jokerCount >= 1) {
        for (var a3 = 0; a3 < rks.length; a3++) {
          var grp3 = byRank[rks[a3]];
          var seenC3 = {}, uniq3 = [];
          for (var g3 = 0; g3 < grp3.length; g3++) {
            if (!seenC3[grp3[g3].color]) { seenC3[grp3[g3].color] = true; uniq3.push(grp3[g3]); }
          }
          if (uniq3.length === 2) {
            var restS3 = removeTiles(remain, uniq3.slice(0, 2));
            var resS3 = canPartition(restS3, jokerCount - 1, memo);
            if (resS3.ok) {
              memo[sig] = { ok: true, usedJokers: resS3.usedJokers + 1 };
              return memo[sig];
            }
          }
        }
      }
    }

    memo[sig] = { ok: false, usedJokers: 0 };
    return memo[sig];
  }

  /** `list` içinden `tiles` öğelerini (id ile) çıkarılmış kopya döndür */
  function removeTiles(list, tiles) {
    var ids = {};
    for (var i = 0; i < tiles.length; i++) ids[tiles[i].id] = true;
    var out = [];
    for (var j = 0; j < list.length; j++) {
      if (!ids[list[j].id]) out.push(list[j]);
    }
    return out;
  }

  /**
   * El kazanabilir mi? Klasik: 14 taş, tümü set/run perlerine ayrılmalı.
   * (Jokerler serbestçe boşluk doldurur.)
   */
  function isWinningHand(hand, indicator) {
    if (!hand || hand.length !== 14) return false;
    var normals = normalTiles(hand, indicator);
    var jk = countJokers(hand, indicator);
    // Normal taşların toplamı + joker <= 14
    var res = canPartition(normals, jk.total, {});
    return res.ok === true;
  }

  /** Kaç adet geçerli per'e ayrılabiliyor — bot/öneri için skor */
  function partitionScore(hand, indicator) {
    var normals = normalTiles(hand, indicator);
    var jk = countJokers(hand, indicator);
    var res = canPartition(normals, jk.total, {});
    return res.ok ? 999 : (normals.length - res.usedJokers);
  }

  /**
   * Bot için: elden hangi taş en uygun şekilde ATILIR?
   * Basit skor: taşın "yardımcılığı". Aynı rank'tan farklı renk çoksa / run
   * komşusu varsa değerli. Hiç yardımcısı olmayan en yalnız taş atılır.
   * Jokerler asla atılmaz.
   */
  function bestDiscardSuggestion(hand, indicator) {
    var normals = normalTiles(hand, indicator);
    if (normals.length === 0) return hand[0];

    var best = null, bestScore = Infinity;
    for (var i = 0; i < normals.length; i++) {
      var t = normals[i];
      var score = 0;
      var sameRankDifferentColor = 0;
      var runNeighbors = 0;
      for (var j = 0; j < normals.length; j++) {
        if (i === j) continue;
        var o = normals[j];
        if (o.rank === t.rank && o.color !== t.color) sameRankDifferentColor++;
        if (o.color === t.color && Math.abs(o.rank - t.rank) === 1) runNeighbors++;
      }
      score = sameRankDifferentColor * 2 + runNeighbors * 2;
      // aynı rank+renkten ikinci kopya varsa at (weak)
      for (var k = 0; k < normals.length; k++) {
        if (k !== i && normals[k].rank === t.rank && normals[k].color === t.color) score -= 1;
      }
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best || normals[0];
  }

  return {
    COLORS: COLORS,
    isOkey: isOkey,
    isFakeOkey: isFakeOkey,
    isJoker: isJoker,
    countJokers: countJokers,
    normalTiles: normalTiles,
    isValidSet: isValidSet,
    isValidRun: isValidRun,
    isValidPer: isValidPer,
    canPartition: canPartition,
    removeTiles: removeTiles,
    isWinningHand: isWinningHand,
    partitionScore: partitionScore,
    bestDiscardSuggestion: bestDiscardSuggestion
  };
}));
