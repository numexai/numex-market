/* ==========================================================================
   ui.js — DOM render + olay bağlama. Tarayıcıya özel.
   ========================================================================== */
(function (root) {
  'use strict';

  var Tiles = root.OkeyTiles;
  var Rules = root.OkeyRules;
  var Game = root.OkeyGame;

  var state = null;
  var refs = {};

  function $(id) { return document.getElementById(id); }

  function cacheRefs() {
    refs = {
      indicatorTile: $('indicator-tile'),
      okeyTile: $('okey-tile'),
      deckPile: $('deck-pile'),
      deckCount: $('deck-count'),
      discardPile: $('discard-pile'),
      turnName: $('turn-name'),
      turnPhase: $('turn-phase'),
      playerHand: $('player-hand'),
      statusMsg: $('status-msg'),
      btnDiscard: $('btn-discard'),
      btnNewGame: $('btn-new-game'),
      logList: $('log-list'),
      overlay: $('winner-overlay'),
      winnerTitle: $('winner-title'),
      winnerDetail: $('winner-detail'),
      winnerPer: $('winner-per'),
      confettiLayer: $('confetti-layer'),
      btnPlayAgain: $('btn-play-again')
    };
    for (var i = 1; i <= 3; i++) {
      refs['hand' + i] = $('opp-hand-' + i);
      refs['count' + i] = $('count-' + i);
      refs['name' + i] = $('name-' + i);
      refs['seat' + i] = $('seat-' + i);
      // NOT: avatar-i / bar-i ID'leri HTML'de YOK. Bar elementi .seat-bar > i
      // olarak seat içinden sorgulanır (aşağıda render() içinde). Ölü ref tutmuyoruz.
    }
    refs.count0 = $('count-0');
    refs.seat0 = $('seat-0');
  }

  /* --------------------------- TAŞ HTML'i ---------------------------- */

  function renderTileHTML(tile, opts) {
    opts = opts || {};
    var cls = ['tile', 'c-' + tile.color];
    if (tile.isFakeOkey) {
      cls.push('fake-okey');
    } else if (state && state.indicator && Tiles.isRealOkey(tile, state.indicator)) {
      cls.push('okey');
    }
    if (opts.mini) cls.push('mini');
    if (opts.selected) cls.push('selected');

    var title = Tiles.tileLabel(tile, state ? state.indicator : null);
    var rankTxt = tile.isFakeOkey ? '★' : String(tile.rank);

    return '<div class="' + cls.join(' ') + '" ' +
      'data-tile-id="' + tile.id + '" ' +
      'title="' + title + '">' +
      (opts.mini ? '' : '<span class="tile-corner tl">' + rankTxt + '</span>') +
      '<span class="tile-rank">' + rankTxt + '</span>' +
      '<span class="tile-color-dot dot-' + tile.color + '"></span>' +
      (opts.mini ? '' : '<span class="tile-corner br">' + rankTxt + '</span>') +
      '</div>';
  }

  function tileToElement(tile, opts) {
    var wrap = document.createElement('div');
    wrap.innerHTML = renderTileHTML(tile, opts).trim();
    return wrap.firstChild;
  }

  /* ------------------------------ RENDER ----------------------------- */

  function render() {
    if (!state) return;
    var isPlayerTurn = state.turn === 0 && state.phase !== 'gameover';
    var canDraw = isPlayerTurn && state.phase === 'drawing';

    // Gösterge & Okey
    refs.indicatorTile.innerHTML = state.indicator
      ? renderTileHTML(state.indicator, { mini: true })
      : '';
    refs.okeyTile.innerHTML = '';
    var okeyT = Tiles.createTile(state.okeyColor, state.okeyRank, false);
    // Not: görsel amaçlı; id üretir ama DOM'da tutulmaz
    refs.okeyTile.innerHTML = renderTileHTML(okeyT, { mini: true });
    var okeyEl = refs.okeyTile.querySelector('.tile');
    if (okeyEl) { okeyEl.classList.add('okey'); okeyEl.removeAttribute('data-tile-id'); }

    // Kapalı deste
    refs.deckCount.textContent = state.deck.length + ' taş';
    if (canDraw && state.deck.length > 0) {
      refs.deckPile.classList.remove('disabled');
    } else {
      refs.deckPile.classList.add('disabled');
    }

    // Atılan taş
    refs.discardPile.innerHTML = '';
    if (state.discardPile.length > 0) {
      var top = state.discardPile[state.discardPile.length - 1];
      refs.discardPile.classList.toggle('empty-disabled', !canDraw);
      refs.discardPile.appendChild(tileToElement(top, {}));
    } else {
      refs.discardPile.classList.add('empty-disabled');
      refs.discardPile.innerHTML = '<span class="empty-hint">Henüz taş atılmadı</span>';
    }

    // Sıra göstergesi
    refs.turnName.textContent = state.playerNames[state.turn];
    if (state.phase === 'gameover') refs.turnPhase.textContent = 'Oyun bitti';
    else if (state.phase === 'drawing') refs.turnPhase.textContent = 'Taş çek';
    else refs.turnPhase.textContent = 'Taş at';

    // Oturma vurguları
    for (var p = 0; p < 4; p++) {
      var seat = refs['seat' + p];
      if (seat) seat.classList.toggle('active', state.turn === p && state.phase !== 'gameover');
    }

    // Bot elleri (kapalı)
    for (var b = 1; b <= 3; b++) {
      var container = refs['hand' + b];
      container.innerHTML = '';
      var n = state.hands[b].length;
      refs['count' + b].textContent = n + ' taş';
      // Taş sayısı barı: 14 taş = tam dolu (görsel hızlı okuma)
      // .seat-bar > i elementi seat içinden sorgulanır; HTML'de ayrı ID yok.
      var seatEl = refs['seat' + b];
      var bar = seatEl ? seatEl.querySelector('.seat-bar > i') : null;
      if (bar) bar.style.width = Math.max(0, Math.min(100, (n / 14) * 100)) + '%';
      var frag = document.createDocumentFragment();
      for (var k = 0; k < n; k++) {
        var back = document.createElement('div');
        back.className = 'tile-back';
        frag.appendChild(back);
      }
      container.appendChild(frag);
    }

    // Oyuncu eli
    refs.count0.textContent = state.hands[0].length + ' taş';
    refs.playerHand.innerHTML = '';
    var hand = state.hands[0].slice().sort(sortHand);
    for (var i = 0; i < hand.length; i++) {
      var sel = state.selectedTileId === hand[i].id;
      refs.playerHand.appendChild(tileToElement(hand[i], { selected: sel }));
    }

    // Aksiyon butonu + durum
    var canDiscard = isPlayerTurn && state.phase === 'discarding' && state.selectedTileId;
    refs.btnDiscard.disabled = !canDiscard;

    if (state.phase === 'gameover') {
      setStatus('Oyun bitti.');
    } else if (!isPlayerTurn) {
      setStatus('Bot oynuyor...');
    } else if (state.phase === 'drawing') {
      setStatus('Kapalı desteden ya da atılan taştan bir taş çek.');
    } else {
      setStatus(state.selectedTileId ? 'Bir taş seçtin — "Seçili Taşı At" ile at.' : 'Bir taş seç ve at.');
    }

    // Günlük
    refs.logList.innerHTML = '';
    for (var li = state.log.length - 1; li >= 0; li--) {
      var el = document.createElement('li');
      el.textContent = state.log[li];
      refs.logList.appendChild(el);
    }

    // Kazanma ekranı
    if (state.phase === 'gameover' && state.winner >= 0) {
      showWinner(state);
    } else {
      refs.overlay.classList.add('hidden');
    }
  }

  function sortHand(a, b) {
    if (a.isFakeOkey !== b.isFakeOkey) return a.isFakeOkey ? 1 : -1;
    var co = ['kirmizi', 'siyah', 'mavi', 'sari'];
    var ca = co.indexOf(a.color), cb = co.indexOf(b.color);
    if (ca !== cb) return ca - cb;
    return a.rank - b.rank;
  }

  function setStatus(msg) {
    if (refs.statusMsg) refs.statusMsg.textContent = msg;
  }

  /* ------------------------------ OLAYLAR ---------------------------- */

  function bindEvents() {
    refs.deckPile.addEventListener('click', onClickDeck);
    refs.discardPile.addEventListener('click', onClickDiscardPile);
    refs.btnDiscard.addEventListener('click', onDiscardSelected);
    refs.btnNewGame.addEventListener('click', onNewGame);
    refs.btnPlayAgain.addEventListener('click', onNewGame);

    refs.playerHand.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.tile') : null;
      if (!el) return;
      var id = el.getAttribute('data-tile-id');
      if (id) onClickTile(id);
    });
  }

  function onClickDeck() {
    if (!state || state.phase === 'gameover') return;
    if (state.turn !== 0 || state.phase !== 'drawing') return;
    Game.drawFromDeck(state, 0);
    afterPlayerAction();
  }

  function onClickDiscardPile() {
    if (!state || state.phase === 'gameover') return;
    if (state.turn !== 0 || state.phase !== 'drawing') return;
    if (state.discardPile.length === 0) return;
    Game.drawFromDiscard(state, 0);
    afterPlayerAction();
  }

  function onClickTile(id) {
    if (!state || state.phase === 'gameover') return;
    if (state.turn !== 0 || state.phase !== 'discarding') return;
    state.selectedTileId = (state.selectedTileId === id) ? null : id;
    render();
  }

  function onDiscardSelected() {
    if (!state || state.phase === 'gameover') return;
    if (state.turn !== 0 || state.phase !== 'discarding') return;
    if (!state.selectedTileId) return;
    var id = state.selectedTileId;
    Game.discardTile(state, 0, id);

    // Oyuncu attıktan sonra kazandı mı?
    if (state.hands[0].length === 14 && Game.checkPlayerWin(state, 0)) {
      state.winner = 0;
      state.phase = 'gameover';
      Game.pushLog(state, '🎉 Sen OKEY YAPTIN!');
      render();
      return;
    }

    Game.advanceTurn(state);
    Game.autoPlayBots(state);
    render();
  }

  function afterPlayerAction() {
    // Çektikten sonra kazanma kontrolü (nadir ama mümkün)
    Game.checkAllWins(state);
    render();
  }

  function onNewGame() {
    state = Game.newGame();
    api.state = state;
    refs.overlay.classList.add('hidden');
    Game.autoPlayBots(state); // İlk sıra 0 (insan) — botlar bekler; yine de güvenli
    render();
  }

  /* --------------------------- KONFETİ -------------------------------- */

  function launchConfetti() {
    if (!refs.confettiLayer) return;
    refs.confettiLayer.innerHTML = '';
    var colors = ['#ffcc33', '#f2b705', '#4fd18b', '#4fa3e3', '#ef5350', '#ffffff'];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 34; i++) {
      var bit = document.createElement('i');
      bit.style.left = (Math.random() * 100) + '%';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDuration = (1.5 + Math.random() * 1.9) + 's';
      bit.style.animationDelay = (Math.random() * 0.7) + 's';
      bit.style.width = (5 + Math.random() * 5) + 'px';
      bit.style.height = (9 + Math.random() * 8) + 'px';
      frag.appendChild(bit);
    }
    refs.confettiLayer.appendChild(frag);
  }

  /* ------------------------- PER GÖSTERİMİ ---------------------------- */

  /**
   * Kazanan eli perlere gruplayıp ekranda gösterir.
   * canPartition() zaten kazanan el için doğrulama yapmıştır; burada
   * yalnızca OKUNAKLI bir gösterim üretiyoruz (perleri kabaca grupla).
   */
  function renderWinnerPer(st) {
    if (!refs.winnerPer) return;
    refs.winnerPer.innerHTML = '';
    if (st.winner !== 0 || !st.hands || !st.hands[0]) return;

    var hand = st.hands[0];
    var groups = groupIntoPers(hand);
    if (!groups.length) return;

    var frag = document.createDocumentFragment();
    groups.forEach(function (group) {
      var wrap = document.createElement('div');
      wrap.className = 'per-group';
      group.forEach(function (t) {
        var chip = document.createElement('span');
        chip.className = 'per-chip c-' + t.color;
        chip.textContent = t.isJoker
          ? 'J'
          : (t.isFakeOkey ? '★' : String(t.rank));
        chip.title = Tiles.tileLabel ? Tiles.tileLabel(t, st.indicator) : (t.color + ' ' + t.rank);
        wrap.appendChild(chip);
      });
      frag.appendChild(wrap);
    });
    refs.winnerPer.appendChild(frag);
  }

  /** Eli kabaca perlere böler: önce seriler, kalanlar gruplar (gösterim amaçlı). */
  function groupIntoPers(hand) {
    var pool = hand.slice();
    var groups = [];

    // 1) Aynı renk + ardışık (en az 3) seriler
    var byColor = {};
    pool.forEach(function (t) {
      if (t.isJoker) return;
      (byColor[t.color] = byColor[t.color] || []).push(t);
    });

    Object.keys(byColor).forEach(function (color) {
      var arr = byColor[color].sort(function (a, b) { return a.rank - b.rank; });
      var run = [];
      for (var i = 0; i < arr.length; i++) {
        if (!run.length || arr[i].rank === run[run.length - 1].rank + 1) {
          run.push(arr[i]);
        } else {
          if (run.length >= 3) groups.push(run);
          run = [arr[i]];
        }
      }
      if (run.length >= 3) groups.push(run);
    });

    // Gruplananları havuzdan çıkar
    var used = {};
    groups.forEach(function (g) { g.forEach(function (t) { used[t.id] = true; }); });
    var rest = pool.filter(function (t) { return !used[t.id] && !t.isJoker; });

    // 2) Kalanları ada göre 3+ gruplara ayır
    var byRank = {};
    rest.forEach(function (t) { (byRank[t.rank] = byRank[t.rank] || []).push(t); });
    Object.keys(byRank).forEach(function (r) {
      if (byRank[r].length >= 3) groups.push(byRank[r]);
    });

    var grouped = {};
    groups.forEach(function (g) { g.forEach(function (t) { grouped[t.id] = true; }); });

    // 3) Artakalanlar + jokerler tek grup
    var leftovers = pool.filter(function (t) { return !grouped[t.id]; });
    if (leftovers.length) groups.push(leftovers);

    return groups;
  }

  function showWinner(st) {
    refs.overlay.classList.remove('hidden');
    if (st.winner === 0) {
      refs.winnerTitle.textContent = 'Okey Yaptın!';
      refs.winnerDetail.textContent = 'Tebrikler! Elindeki tüm taşları geçerli perlere ayırdın.';
    } else {
      refs.winnerTitle.textContent = st.playerNames[st.winner] + ' Okey Yaptı';
      refs.winnerDetail.textContent = 'Bu turu ' + st.playerNames[st.winner] +
        ' kazandı. Yeni oyunda şansını dene!';
    }
    renderWinnerPer(st);
    launchConfetti();
  }

  /* ------------------------------ API ------------------------------- */

  var api = {
    // ÖNEMLİ: render() ve diğer iç fonksiyonlar MODÜL-İÇİ `state` değişkenini kullanır.
    // main.js `UI.state = state` yazar; bu atama modül-içi state'e ULAŞMAZSA
    // render() satır başındaki `if (!state) return;` yüzünden ANINDA çıkar ve
    // el/atılan taş hiç çizilmez (sayaç HTML'de sabit kalır). get/set ile senkron tutulur.
    get state() { return state; },
    set state(s) { state = s; },
    render: render,
    renderTileHTML: renderTileHTML,
    bindEvents: bindEvents,
    setStatus: setStatus,
    showWinner: showWinner,
    onClickTile: onClickTile,
    onClickDiscardPile: onClickDiscardPile,
    onClickDeck: onClickDeck,
    onDiscardSelected: onDiscardSelected,
    onNewGame: onNewGame,
    cacheRefs: cacheRefs
  };
  root.OkeyUI = api;
}(typeof self !== 'undefined' ? self : this));
