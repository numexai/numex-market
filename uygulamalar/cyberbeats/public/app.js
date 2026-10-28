/* =========================================================
   CYBER BEATS — 16-Step Web Audio Davul Makinesi
   Tüm sesler SAF Web Audio API ile sentezlenir:
   OscillatorNode, GainNode, BiquadFilterNode, AudioBufferSourceNode
   (noise buffer "ses dosyası" değil; kod içinde Math.random ile
   üretilen örnek tampondur). Hiçbir mp3/wav dosyası kullanılmaz.

   - KICK  : frekansı hızla düşen sinüs (150Hz -> 30Hz pitch drop)
   - SNARE : beyaz gürültü + band-pass + kısa rezonans
   - HAT   : yüksek frekanslı (high-pass) kesik metalik tiz ses
   - SYNTH : melodik kare/üçgen dalga tonu
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Sabitler & State ---------- */
  var INSTRUMENTS = [
    { id: 'kick',  label: 'KICK',  rowCls: 'kick' },
    { id: 'snare', label: 'SNARE', rowCls: 'snare' },
    { id: 'hat',   label: 'HAT',   rowCls: 'hat' },
    { id: 'synth', label: 'SYNTH', rowCls: 'synth' }
  ];
  var STEPS = 16;

  var audioCtx = null;
  var masterGain = null;
  var noiseBuffer = null;

  var isPlaying = false;
  var step = 0;               // sıradaki çalınacak adım
  var scheduleTimer = null;   // lookahead interval id
  var visualTimer = null;     // UI playhead interval id
  var nextNoteTime = 0;       // ctx.currentTime cinsinden bir sonraki nota vakti
  var currentStepVisual = -1; // görselde en son yanan sütun
  var lastScheduledStep = -1;

  var bpm = 120;
  var BPM_MIN = 80;
  var BPM_MAX = 180;
  var LOOKAHEAD_MS = 25;      // timer tarama aralığı
  // 16. adım süresi (sn) = 60 / BPM / 4
  function stepDur() { return 60 / bpm / 4; }

  // 4 enstrüman satırı x 16 adım boolean matris
  var pattern = [];
  function initPattern() {
    for (var r = 0; r < 4; r++) {
      pattern[r] = new Array(STEPS).fill(false);
    }
  }

  // SYNTH pentatonik ölçüsünden frekans seçimi için tablo (Hz)
  var SYNTH_TABLE = [
    220.0, 261.63, 293.66, 329.63, 392.0, 440.0,
    523.25, 587.33, 659.25, 783.99, 880.0, 987.77
  ];

  /* ---------- Audio kurulum ---------- */
  // AudioContext'i oluşturur; master gain ve noise buffer hazırlar.
  function initAudio() {
    if (audioCtx) return audioCtx;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { return null; }
    audioCtx = new Ctor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(audioCtx.destination);
    noiseBuffer = createNoiseBuffer();
    return audioCtx;
  }

  // Kullanıcı etkileşimiyle (klavye/tıklama) context'i aç.
  function unlock() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Beyaz gürültü tamponu — AudioBufferSourceNode ile çalınır.
  function createNoiseBuffer() {
    if (!audioCtx) { return null; }
    var dur = 1.5; // saniye
    var length = Math.floor(audioCtx.sampleRate * dur);
    var buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Genel ADSR benzeri env için yardımcı: node'u master'a bağlar.
  function makeEnv(peak, attack, decay, time, isExponential) {
    var g = audioCtx.createGain();
    var z = isExponential ? 0.0001 : 0;
    g.gain.setValueAtTime(z, time);
    if (isExponential) {
      g.gain.exponentialRampToValueAtTime(peak, time + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
    } else {
      g.gain.linearRampToValueAtTime(peak, time + attack);
      g.gain.linearRampToValueAtTime(0, time + attack + decay);
    }
    g.connect(masterGain);
    return { node: g, start: time + attack, stopAt: time + attack + decay };
  }

  /* =========================================================
     SES SENTEZ FONKSİYONLARI
     ========================================================= */

  // KICK — 150Hz -> 30Hz hızla düşen sinüs (pitch drop) + sub body
  function playKick(time) {
    if (!audioCtx) { return; }
    var ctx = audioCtx;
    var t = time;

    // ana sinüs
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.42);

    // düşük geçiren filtre ile sub-gövde yumuşat
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.4);

    var g = makeEnv(0.95, 0.003, 0.38, t, true);
    osc.connect(lp);
    lp.connect(g.node);
    osc.start(t);
    osc.stop(g.stopAt + 0.02);
  }

  // SNARE — beyaz gürültü (noise source) + band-pass + gövde sinüs
  function playSnare(time) {
    if (!audioCtx || !noiseBuffer) { return; }
    var ctx = audioCtx;
    var t = time;

    // gürültü kaynağı (AudioBufferSourceNode)
    var noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;

    var ng = makeEnv(0.55, 0.002, 0.16, t, true);
    noise.connect(bp);
    bp.connect(ng.node);
    noise.start(t, Math.random() * 0.5);
    noise.stop(ng.stopAt + 0.01);

    // gövde (body): kısa düşük sinüs ~180Hz
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    var og = makeEnv(0.4, 0.001, 0.12, t, true);
    osc.connect(og.node);
    osc.start(t);
    osc.stop(og.stopAt + 0.01);
  }

  // HAT — yüksek frekanslı kesik, tiz metalik ses
  function playHiHat(time, open) {
    if (!audioCtx || !noiseBuffer) { return; }
    var ctx = audioCtx;
    var t = time;
    var isOpen = !!open;

    var decay = isOpen ? 0.28 : 0.05; // kapalı kısa titrek, açık daha uzun

    var noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // yüksek geçiren filtre -> keskin tiz
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7500;

    var ng = makeEnv(isOpen ? 0.4 : 0.5, 0.001, decay, t, true);
    noise.connect(hp);
    hp.connect(ng.node);
    noise.start(t, Math.random() * 0.5);
    noise.stop(ng.stopAt + 0.01);

    // metalik rezonans üst tonu
    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 8200;
    var hg = ctx.createGain();
    hg.gain.setValueAtTime(0.12, t);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + (isOpen ? 0.22 : 0.045));
    osc.connect(hg);
    hg.connect(masterGain);
    osc.start(t);
    osc.stop(t + (isOpen ? 0.24 : 0.05) + 0.01);
  }

  // SYNTH — melodik ton (kare/üçgen dalga + env)
  function playSynth(time, noteIdx) {
    if (!audioCtx) { return; }
    var ctx = audioCtx;
    var t = time;

    // notayı ölçüden seç; verilmezse adım indeksinden üret
    var idx = (noteIdx === undefined) ? Math.floor(Math.random() * SYNTH_TABLE.length) : noteIdx;
    var freq = SYNTH_TABLE[idx % SYNTH_TABLE.length];

    var oscA = ctx.createOscillator();
    oscA.type = 'square';
    oscA.frequency.value = freq;

    // ikinci tiz katman
    var oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = freq * 1.5;

    var g = makeEnv(0.22, 0.006, 0.18, t, true);
    var oscBgain = ctx.createGain();
    oscBgain.gain.value = 0.35;

    oscA.connect(g.node);
    oscB.connect(oscBgain);
    oscBgain.connect(g.node);
    oscA.start(t);
    oscB.start(t);
    oscA.stop(t + 0.4);
    oscB.stop(t + 0.4);
  }

  /* =========================================================
     PATTERN (desen) & PLAYBACK
     ========================================================= */

  // Tek bir enstrüman adımını seslendirir (time = ctx zamanı).
  function playStep(instrIdx, stepIdx, time) {
    if (!pattern[instrIdx] || !pattern[instrIdx][stepIdx]) { return; }
    switch (instrIdx) {
      case 0: playKick(time); break;
      case 1: playSnare(time); break;
      case 2:
        // HAT: her 2. vuruşta açık (open) hat — 8. ve 15. gibi
        playHiHat(time, stepIdx % 8 === 7);
        break;
      case 3:
        // SYNTH melodik: notayı time + deterministic bir adım indeksiyle üret
        playSynth(time, stepIdx % SYNTH_TABLE.length);
        break;
      default: break;
    }
  }

  // Hazır örnek break/techno ritmi (kick, snare, hat, synth)
  function defaultPattern() {
    var p = [];
    // kick: 1-3-5-7 + 13. adım variasyon -> 0,2,4,6,12 teknik
    p.push([true, false, false, false, true, false, true, false,
            false, true, false, false, true, false, false, false]);
    // snare: backbeat üzerine 4 ve 12; 7. de tuhaf vuruş
    p.push([false, false, false, false, true, false, false, true,
            false, false, false, false, true, false, false, false]);
    // hat: neredeyse her adım kesik 8'lik his
    p.push([true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true]);
    // synth: melodik dizi — 0,3,6,10,12 gibi aralıklarla
    p.push([false, false, false, false, true, false, true, false,
            false, true, false, false, true, false, false, false]);
    return p;
  }

  // defaultPattern'i pattern'deki duruma kopyalar; UI'ya uygular.
  function loadDefault() {
    var d = defaultPattern();
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < STEPS; c++) {
        pattern[r][c] = !!d[r][c];
      }
    }
    renderRows();
  }

  function clearAll() {
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < STEPS; c++) {
        pattern[r][c] = false;
      }
    }
    renderRows();
  }

  /* =========================================================
     UI — matris & kontroller
     ========================================================= */

  function getCell(r, c) {
    return document.querySelector('#r' + r + 'c' + c);
  }

  // Satırları DOM olarak kurar (olaylar tek sefer; hücre içerikleri güncellenir)
  // Aktif sütunu dikey neon şeritle vurgulayan overlay (bir kez kurulur).
  // Satır hücreleri grid ile dizildiği için; konum hesaplaması ilk satırın
  // hücre genişliğine göre updateVisualStep içinde yapılır.
  var colHeadEl = null;

  function buildMatrix() {
    var matrix = document.getElementById('matrix');
    matrix.innerHTML = '';
    // dikey playhead şeridi — .active sınıfı ve left/width inline verilir
    colHeadEl = document.createElement('div');
    colHeadEl.className = 'step-col-head';
    colHeadEl.style.left = '-999px'; // başlangıçta görünmez
    matrix.appendChild(colHeadEl);
    for (var r = 0; r < 4; r++) {
      var row = document.createElement('div');
      row.className = 'step-row ' + INSTRUMENTS[r].rowCls + '-row';
      row.dataset.row = r;
      for (var c = 0; c < STEPS; c++) {
        var cell = document.createElement('div');
        cell.className = 'step-cell';
        cell.id = 'r' + r + 'c' + c;
        cell.dataset.r = r;
        cell.dataset.c = c;
        var glow = document.createElement('span');
        glow.className = 'cell-glow';
        cell.appendChild(glow);
        row.appendChild(cell);

        // hücre tıklaması
        cell.addEventListener('click', function (ev) {
          var t = ev.currentTarget;
          toggleCell(parseInt(t.dataset.r, 10), parseInt(t.dataset.c, 10));
        });
      }
      matrix.appendChild(row);
    }
  }

  // Her hücrenin .on sınıfını pattern matrisine göre günceller.
  function renderRows() {
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < STEPS; c++) {
        var cell = getCell(r, c);
        if (!cell) { continue; }
        cell.classList.toggle('on', !!pattern[r][c]);
      }
    }
  }

  // Tek bir hücreyi MATRIS ÜZERİNDE yansıtır + silah sesi ön izler.
  function toggleCell(r, c) {
    unlock(); // audio context açık olsun
    if (pattern[r] && pattern[r][c] !== undefined) {
      pattern[r][c] = !pattern[r][c];
      var cell = getCell(r, c);
      if (cell) { cell.classList.toggle('on', pattern[r][c]); }
      // aktifse o enstrümanı önizle (talep geri beslemesi için)
      if (pattern[r][c]) { playStep(r, c, audioCtx ? audioCtx.currentTime + 0.02 : 0); }
    }
  }

  // LED ızgarası (üst bardaki mini göstergeyi adım ile yakar)
  function buildLeds() {
    var ledGrid = document.getElementById('ledGrid');
    ledGrid.innerHTML = '';
    for (var c = 0; c < STEPS; c++) {
      var led = document.createElement('span');
      led.className = 'led';
      ledGrid.appendChild(led);
    }
  }

  function buildStepLabels() {
    var labels = document.getElementById('stepLabels');
    labels.innerHTML = '';
    // ilk hücre boşluk (enstrüman sütununa kalsın)
    var spacer = document.createElement('span');
    spacer.className = 'step-num';
    labels.appendChild(spacer);
    for (var i = 0; i < STEPS; i++) {
      var s = document.createElement('span');
      s.className = 'step-num' + ((i % 4 === 0) ? ' group' : '');
      s.textContent = String(i + 1).padStart(2, '0');
      labels.appendChild(s);
    }
  }

  // Aktif playhead sütununu görsel ışıkla vurgular:
  //   1) matrix üzerinde o sütunu kaplayan DİKEY neon şerit (colHeadEl)
  //   2) çalan ON hücrelere kısa .hit parlaması
  //   3) üst bardaki LED göstergesini yakar
  function updateVisualStep(stepIdx) {
    if (stepIdx < 0 || stepIdx >= STEPS) { return; }
    var prev = currentStepVisual;
    currentStepVisual = stepIdx;

    // --- Dikey sütun şeridi konumlandır ---
    if (colHeadEl) {
      // İlk satırın hedef sütunundaki hücrenin ofsetini kullanarak
      // overlay'i o sütunun tam üstüne bindiririz (satırlar 16 eşit sütun).
      var anchor = getCell(0, stepIdx);
      if (anchor) {
        // left: hücrenin matrix içindeki sol kenarı; width: hücre + gap
        var cellW = anchor.offsetWidth;
        var gap = 5; // .matrix gap (style.css) — hücre büyüklüğüne oransal yerine net
        // satırlar flex'tir ve satır ile matrix genişlikleri aynı anda başlar:
        var leftOfCell = anchor.offsetLeft;
        colHeadEl.style.left = leftOfCell + 'px';
        colHeadEl.style.width = (cellW) + 'px';
        colHeadEl.classList.add('active');
      } else {
        colHeadEl.classList.remove('active');
      }
    }

    // --- LED barları güncelle ---
    var leds = document.querySelectorAll('#ledGrid .led');
    for (var i = 0; i < leds.length; i++) {
      leds[i].classList.toggle('on', i === stepIdx);
    }

    // önceki sütuna verilen .hit sınıfını gecikmeli düşür (temizlik)
    if (prev >= 0 && prev !== stepIdx) {
      for (var pc = 0; pc < 4; pc++) {
        var pcell = getCell(pc, prev);
        if (pcell) { pcell.classList.remove('hit'); }
      }
    }
    // --- Çalan hücrelere kısa parlama ---
    for (var rr = 0; rr < 4; rr++) {
      if (pattern[rr][stepIdx]) {
        var cc = getCell(rr, stepIdx);
        if (cc) { cc.classList.add('hit'); }
      }
    }
    // kısa animasyon sonunda çalan hücrelerin parlamasını düşür
    setTimeout(function () {
      for (var rrr = 0; rrr < 4; rrr++) {
        if (pattern[rrr][stepIdx]) {
          var ccell = getCell(rrr, stepIdx);
          if (ccell) { ccell.classList.remove('hit'); }
        }
      }
    }, 90);
  }

  /* =========================================================
     ZAMANLAYICI (lookahead scheduler)
     ========================================================= */

  function scheduleStep() {
    if (!isPlaying) { return; }
    while (nextNoteTime < audioCtx.currentTime + 0.12) {
      var idx = step;
      // sürede çal — mümkün olan tüm enstrümanları
      for (var r = 0; r < 4; r++) {
        if (pattern[r][idx]) { playStep(r, idx, nextNoteTime); }
      }
      updateVisualStep(idx);
      // bir sonraki adıma ilerle
      step = (step + 1) % STEPS;
      nextNoteTime += stepDur();
    }
  }

  function startLoop() {
    if (!audioCtx) { return; }
    // görsel playhead intervali ~20ms
    visualTimer = setInterval(scheduleStep, LOOKAHEAD_MS);
  }

  function stopLoop() {
    if (visualTimer) { clearInterval(visualTimer); visualTimer = null; }
    if (scheduleTimer) { clearInterval(scheduleTimer); scheduleTimer = null; }
    step = 0;
    currentStepVisual = -1;
    lastScheduledStep = -1;
    var leds = document.querySelectorAll('#ledGrid .led');
    for (var i = 0; i < leds.length; i++) { leds[i].classList.remove('on'); }
    // aktif playhead sütun şeridini ve parlamaları sıfırla
    if (colHeadEl) { colHeadEl.classList.remove('active'); colHeadEl.style.left = '-999px'; }
    var hitCells = document.querySelectorAll('.step-cell.hit');
    for (var h = 0; h < hitCells.length; h++) { hitCells[h].classList.remove('hit'); }
  }

  // Oynat / duraklat. Space ve buton ortak.
  function togglePlay() {
    unlock();
    if (!audioCtx) {
      var st = document.getElementById('statusText');
      if (st) { st.textContent = 'SES YOK'; }
      return;
    }

    if (isPlaying) {
      pause();
      return;
    }
    // başlat
    isPlaying = true;
    step = 0;
    nextNoteTime = (audioCtx.currentTime || 0) + 0.05;
    startLoop();
    // UI durum
    document.getElementById('playIndicator').classList.add('running');
    document.getElementById('statusText').classList.add('running');
    document.getElementById('statusText').textContent = 'ÇALIYOR';
    document.getElementById('playBtn').classList.add('running');
    document.getElementById('playBtn').textContent = '❚❚';
    document.getElementById('statusText').className = 'status-text running';
    statusVisual(true);
  }

  function pause() {
    isPlaying = false;
    stopLoop();
    document.getElementById('playIndicator').classList.remove('running');
    document.getElementById('statusText').textContent = 'DURDU';
    document.getElementById('playBtn').classList.remove('running');
    document.getElementById('playBtn').textContent = '▶';
    statusVisual(false);
  }

  function statusVisual(on) {
    document.getElementById('playIndicator').classList.toggle('running', on);
  }

  function statusStop() {
    isPlaying = false;
    stopLoop();
    document.getElementById('playIndicator').classList.remove('running');
    document.getElementById('statusText').textContent = 'DURDU';
    document.getElementById('playBtn').classList.remove('running');
    document.getElementById('playBtn').textContent = '▶';
  }

  function setTempo(value) {
    var v = parseInt(value, 10);
    if (isNaN(v)) { v = 120; }
    v = Math.max(BPM_MIN, Math.min(BPM_MAX, v));
    bpm = v;
    document.getElementById('bpmValue').textContent = String(bpm);
    // loop ayaktaysa zamanlama otomatik olarak yeni stepDur ile devam eder
  }

  /* =========================================================
     OLAY BAĞLAMA
     ========================================================= */

  function bindControls() {
    var playBtn = document.getElementById('playBtn');
    var stopBtn = document.getElementById('stopBtn');
    var clearBtn = document.getElementById('clearBtn');
    var bpmSlider = document.getElementById('bpmSlider');
    var bpmValue = document.getElementById('bpmValue');

    playBtn.addEventListener('click', togglePlay);
    stopBtn.addEventListener('click', statusStop);
    clearBtn.addEventListener('click', function () { clearAll(); });

    bpmSlider.addEventListener('input', function () {
      setTempo(bpmSlider.value);
    });

    // Space ile oynat/durdur (sayfa kaydırmayı engelle)
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        statusStop();
      }
    });

    // mobil dokunma ile de hücrelerde tam duyarlılık için kullanıcı tıklamaları
    // (click zaten mobilde çalışır).
  }

  function previewSource(instrIdx) {
    if (!audioCtx) { initAudio(); }
    playStep(instrIdx, 0, audioCtx.currentTime + 0.02);
  }

  /* =========================================================
     BAŞLAT
     ========================================================= */

  function buildUI() {
    initPattern();
    buildMatrix();      // hücreleri kur
    buildLeds();
    buildStepLabels();
    loadDefault();      // hazır örnek ritim yükle + render
    bindControls();

    var bpmSlider = document.getElementById('bpmSlider');
    setTempo(bpmSlider.value);

    // play (sahte önizleme hakkı sayacı) için etiket
    document.getElementById('statusText').textContent = 'DURDU';
    statusStop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }

  // (iç API — gerekli: eksiksiz fonksiyon ispatı)
  window.CyberBeats = {
    start: togglePlay,
    stop: statusStop,
    setTempo: setTempo,
    clearAll: clearAll,
    loadDefault: loadDefault,
    toggleCell: toggleCell,
    previewSource: previewSource
  };
})();
