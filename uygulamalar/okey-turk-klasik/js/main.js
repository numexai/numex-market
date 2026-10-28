/* ==========================================================================
   main.js — Bootstrap katmanı (Numex Okey).
   Sorumluluklar:
   1) DOM referanslarını ve oyun durumunu hazırla (UI.cacheRefs + Game.newGame)
   2) Olay dinleyicilerini bağla (UI.bindEvents)
   3) Tarayıcı-içi SELF-TEST çalıştır (deste/per/kazanma bütünlüğü)
   4) Global hata yakalama (error boundary) — beyaz ekran yerine görünür mesaj
   5) Görünürlük değişince oyunu duraklat/devam ettir (sekme arka plandayken CPU yakma)
   Kırılganlık ilkesi: bootstrap tek bir try/catch içinde; herhangi bir modül
   eksik/bozuksa kullanıcı SESSİZ beyaz ekran yerine NET hata görür.
   ========================================================================== */
(function (root) {
  'use strict';

  var Game = root.OkeyGame;
  var UI = root.OkeyUI;
  var Rules = root.OkeyRules;
  var Tiles = root.OkeyTiles;

  var BOOT_FLAG = '__numexOkeyBooted';
  var PAUSED = false;

  /* ------------------------------------------------------------------ */
  /*  HATA GÖRÜNÜRLÜĞÜ (error boundary)                                  */
  /* ------------------------------------------------------------------ */

  /** Durum çubuğuna görünür hata yazar; konsola da düşer. */
  function showFatal(msg, err) {
    try {
      if (UI && typeof UI.setStatus === 'function') {
        UI.setStatus('⚠ ' + msg);
      } else {
        var el = document.getElementById('status-msg');
        if (el) el.textContent = '⚠ ' + msg;
      }
    } catch (e) { /* UI bile bozuksa sessiz kal */ }
    console.error('[Okey] ' + msg, err || '');
  }

  /** Yakalanmamış hataları ve reddedilen promise'leri görünür yap. */
  function installErrorBoundary() {
    if (typeof root.addEventListener !== 'function') return;

    root.addEventListener('error', function (ev) {
      var msg = (ev && ev.message) ? ev.message : 'Bilinmeyen hata';
      showFatal('Beklenmeyen hata: ' + msg, ev && ev.error);
    });

    root.addEventListener('unhandledrejection', function (ev) {
      var r = ev && ev.reason;
      showFatal('İşlenmeyen promise hatası: ' + (r && r.message ? r.message : r), r);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  SELF-TEST                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Tarayıcı-içi sağlık kontrolü: modüller yüklendi mi, deste tutarlı mı,
   * per/kazanma mantığı beklenen sonucu veriyor mu?
   * Hata FIRLATMAZ; sonucu döner ve konsola yazar (oyunu kilitlemesin).
   */
  function runSelfTest(state) {
    var sonuc = { gecti: 0, kaldi: 0, satirlar: [] };

    function kontrol(ad, kosul) {
      if (kosul) {
        sonuc.gecti++;
        sonuc.satirlar.push('  ✓ ' + ad);
      } else {
        sonuc.kaldi++;
        sonuc.satirlar.push('  ✗ ' + ad);
        console.warn('[Okey self-test] BAŞARISIZ: ' + ad);
      }
    }

    try {
      var toplamElde = state.hands[0].length + state.hands[1].length +
        state.hands[2].length + state.hands[3].length;

      kontrol('Deste 106 taş olmalı (elde+kapalı)',
        toplamElde + state.deck.length === 106);
      kontrol('Başlangıç oyuncusu 15 taş', state.hands[0].length === 15);
      kontrol('Diğerleri 14 taş',
        state.hands[1].length === 14 &&
        state.hands[2].length === 14 &&
        state.hands[3].length === 14);
      kontrol('Gösterge atandı', !!state.indicator);
      kontrol('Okey sırası geçerli (1..13)',
        state.okeyRank >= 1 && state.okeyRank <= 13);
      kontrol('Okey rengi geçerli', !!state.okeyColor);
      kontrol('Sahte okey mevcut', !!state.fakeOkey);
      kontrol('Sıra 0..3 aralığında',
        state.currentPlayer >= 0 && state.currentPlayer <= 3);
      kontrol('Atık yığını dizisi', Array.isArray(state.discardPile));

      // Kurallar modülü akıl sağlığı (saf fonksiyonlar)
      if (Rules && typeof Rules.isJoker === 'function') {
        kontrol('Rules.isJoker erişilebilir', true);
        kontrol('Sahte okey daima joker',
          Rules.isJoker(state.fakeOkey, state.indicator) === true);
      } else {
        kontrol('Rules modülü yüklü', false);
      }

      if (Tiles && typeof Tiles.isRealOkey === 'function') {
        kontrol('Tiles.isRealOkey erişilebilir', true);
      } else {
        kontrol('Tiles modülü yüklü', false);
      }
    } catch (e) {
      sonuc.kaldi++;
      sonuc.satirlar.push('  ✗ self-test istisnası: ' + e.message);
      console.error('[Okey self-test hata]', e);
    }

    console.log('[Okey self-test] ' + sonuc.gecti + ' geçti / ' +
      sonuc.kaldi + ' kaldı');
    for (var i = 0; i < sonuc.satirlar.length; i++) console.log(sonuc.satirlar[i]);

    return sonuc;
  }

  /* ------------------------------------------------------------------ */
  /*  GÖRÜNÜRLÜK (sekme arka plan)                                       */
  /* ------------------------------------------------------------------ */

  function installVisibilityGuard(state) {
    if (typeof document.addEventListener !== 'function') return;
    document.addEventListener('visibilitychange', function () {
      PAUSED = document.hidden === true;
      var el = document.getElementById('status-msg');
      if (PAUSED && el) {
        el.textContent = 'Oyun duraklatıldı (sekme arka planda) — geri dönünce devam eder.';
      } else if (!PAUSED) {
        try { UI.render(); } catch (e) { /* yoksay */ }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  BAŞLATMA                                                           */
  /* ------------------------------------------------------------------ */

  function init() {
    // Çift bootstrap koruması (script bir kez daha yüklenirse oyun sıfırlanmasın)
    if (root[BOOT_FLAG]) return;
    root[BOOT_FLAG] = true;

    // Modül sözleşmesi kontrolü — erken ve NET hata
    if (!Game || !UI) {
      showFatal('Modüller yüklenemedi (OkeyGame/OkeyUI eksik). ' +
        'index.html script sırasını kontrol edin.');
      return;
    }

    installErrorBoundary();

    try {
      UI.cacheRefs();
      var state = Game.newGame();
      UI.state = state;
      UI.bindEvents();

      // İlk sıra insan (0) — botlar hemen oynamaz.
      if (typeof Game.autoPlayBots === 'function') Game.autoPlayBots(state);

      UI.render();

      var test = runSelfTest(state);
      installVisibilityGuard(state);

      // Başlangıç bilgisi durum çubuğunda
      if (typeof UI.setStatus === 'function') {
        UI.setStatus('Yeni oyun hazır. Gösterge: ' + state.indicator.color + ' ' +
          state.indicator.rank + ' → Okey: ' + state.okeyColor + ' ' +
          state.okeyRank + (test.kaldi ? '  (self-test: ' + test.kaldi + ' uyarı)'
            : '  (self-test: tamam)'));
      }

      console.log('[Okey] Oyun başlatıldı. Gösterge:', state.indicator,
        '| Okey:', state.okeyColor, state.okeyRank);
    } catch (e) {
      showFatal('Oyun başlatılamadı: ' + e.message, e);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  KAYIT                                                              */
  /* ------------------------------------------------------------------ */

  if (typeof document === 'undefined' || !document.addEventListener) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM zaten hazır (script gövde sonunda yüklendiyse)
    init();
  }

}(typeof self !== 'undefined' ? self : this));
