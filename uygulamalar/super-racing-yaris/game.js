/**
 * Süper Racing - Game Engine v2.0 Turbo Edition (Keyboard Enter Restart Added)
 * Deep Upgrade Shop (Engine, Nitro, Armor Shield), Bulletproof Canvas Drawing.
 */

(function () {
  'use strict';

  // --- SAFE CANVAS ROUNDRECT POLYFILL ---
  function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // --- AUDIO SYNTHESIZER ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.engineOsc = null;
      this.engineGain = null;
    }

    init() {
      try {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {}
    }

    toggleSound() {
      this.enabled = !this.enabled;
      if (!this.enabled && this.engineGain && this.ctx) {
        try { this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime); } catch (e) {}
      }
      return this.enabled;
    }

    startEngine() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx || this.engineOsc) return;

      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc.start();
      } catch (e) {}
    }

    updateEngine(speedRatio) {
      if (!this.enabled || !this.engineOsc || !this.ctx) return;
      try {
        const targetFreq = 40 + speedRatio * 110;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(0.03 + speedRatio * 0.04, this.ctx.currentTime, 0.1);
      } catch (e) {}
    }

    stopEngine() {
      if (this.engineOsc) {
        try {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
        } catch (e) {}
        this.engineOsc = null;
        this.engineGain = null;
      }
    }

    playCoin() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) {}
    }

    playNearMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    playNitro() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.25);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    playCrash() {
      if (!this.enabled) return;
      this.init();
      this.stopEngine();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    }

    playShield() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    playNudge() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(120, now + 0.07);
        osc.frequency.setValueAtTime(240, now + 0.14);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }

    playWin() {
      if (!this.enabled) return;
      this.init();
      this.stopEngine();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99];

        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.12, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.25);
        });
      } catch (e) {}
    }
  }

  // --- VEHICLES CONFIGURATION ---
  const VEHICLES = [
    {
      id: 'car_red',
      name: 'Süper Kırmızı Spor',
      desc: 'Standart başlangıç yarış aracı.',
      color: '#ef4444',
      price: 0,
      speedBase: 140,
      accelBase: 50
    },
    {
      id: 'car_blue',
      name: 'Mavi Fırtına Turbo',
      desc: 'Hızlı ivmelenen şehir yarışçısı.',
      color: '#0284c7',
      price: 150,
      speedBase: 165,
      accelBase: 65
    },
    {
      id: 'car_neon',
      name: 'Neon Siber Roadster',
      desc: 'Yüksek maksimum hız ve özel görünüm.',
      color: '#38bdf8',
      price: 350,
      speedBase: 190,
      accelBase: 80
    },
    {
      id: 'car_gold',
      name: 'Efsanevi Altın Phantom',
      desc: 'Pistlerin en güçlü ve prestijli efsanesi.',
      color: '#fbbf24',
      price: 700,
      speedBase: 220,
      accelBase: 100
    }
  ];

  // --- LEVELS ---
  const LEVELS = [
    {
      id: 1,
      name: 'Sahil Yolu (Başlangıç)',
      desc: 'Güneşli otobanda 800m sürüş yap.',
      goalDistance: 800,
      trafficDensity: 0.015,
      bgTheme: 'day',
      asphaltColor: '#334155',
      starScores: [1000, 2000, 3500]
    },
    {
      id: 2,
      name: 'Gece Yağmuru (Orta)',
      desc: 'Gece yağmurlu yolda 1200m ilerle.',
      goalDistance: 1200,
      trafficDensity: 0.02,
      bgTheme: 'rain',
      asphaltColor: '#1e293b',
      starScores: [2000, 3500, 5500]
    },
    {
      id: 3,
      name: 'Sonsuz Otoban Şampiyonluğu (Zor)',
      desc: 'Sınırsız sürüş! En yüksek skoru kır.',
      goalDistance: 999999,
      trafficDensity: 0.026,
      bgTheme: 'cyber',
      asphaltColor: '#0f172a',
      starScores: [4000, 10000, 20000]
    }
  ];

  // --- GAME ENGINE ---
  class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.sound = new SoundManager();

      this.userData = this.loadUserData();

      this.currentLevel = LEVELS[0];
      this.selectedCar = VEHICLES[0];

      this.state = 'MENU';
      this.distance = 0;
      this.score = 0;
      this.coinsCollected = 0;
      this.speed = 0;
      this.maxSpeed = 150;
      this.nitro = 100;
      this.hasShield = false;

      this.lanes = [240, 340, 440, 540];

      this.player = {
        currentLane: 1,
        x: 340,
        targetX: 340,
        y: 480,
        width: 42,
        height: 76
      };

      this.traffic = [];
      this.coins = [];
      this.particles = [];
      this.roadScroll = 0;

      this.keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        nitro: false
      };

      this.laneCooldown = false;

      this.initEvents();
      this.initGarageView();
      this.renderMenuStats();
      this.startLoop();
    }

    loadUserData() {
      const defaultData = {
        totalCoins: 0,
        unlockedCars: ['car_red'],
        selectedCarId: 'car_red',
        unlockedLevels: [1],
        levelStars: { 1: 0, 2: 0, 3: 0 },
        upgrades: {
          engineLevel: 1,
          nitroLevel: 1,
          armorLevel: 0
        }
      };

      try {
        const stored = localStorage.getItem('super_racing_save');
        return stored ? Object.assign(defaultData, JSON.parse(stored)) : defaultData;
      } catch (e) {
        return defaultData;
      }
    }

    saveUserData() {
      try {
        localStorage.setItem('super_racing_save', JSON.stringify(this.userData));
      } catch (e) {}
    }

    initEvents() {
      const unlockAudio = () => this.sound.init();
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });

      // Keyboard Controls (INCLUDING ENTER / RESTART SHORTCUTS!)
      window.addEventListener('keydown', (e) => {
        // ENTER or SPACE or 'R' Key on Game Over / Win / Menu screens to instantly restart/play!
        if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          if (this.state === 'GAMEOVER') {
            this.startLevel(this.currentLevel.id);
            e.preventDefault();
            return;
          } else if (this.state === 'WIN') {
            const nextId = Math.min(3, this.currentLevel.id + 1);
            this.startLevel(nextId);
            e.preventDefault();
            return;
          } else if (this.state === 'MENU' && !document.getElementById('menuModal').classList.contains('hidden')) {
            this.startLevel(1);
            e.preventDefault();
            return;
          }
        }

        if (this.state === 'GAMEOVER' && (e.key === ' ' || e.key === 'Spacebar')) {
          this.startLevel(this.currentLevel.id);
          e.preventDefault();
          return;
        }

        if (this.state === 'PLAYING') {
          if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && !this.laneCooldown) {
            this.changeLane(-1);
            this.laneCooldown = true;
          }
          if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && !this.laneCooldown) {
            this.changeLane(1);
            this.laneCooldown = true;
          }
        }

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
        if (e.key === ' ' || e.key === 'Spacebar') {
          this.keys.nitro = true;
          e.preventDefault();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.laneCooldown = false;
        }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
        if (e.key === ' ' || e.key === 'Spacebar') this.keys.nitro = false;
      });

      // Touch Controls
      const setupTouchClick = (id, action) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onclick = (e) => {
          e.preventDefault();
          this.sound.init();
          if (action === 'left') this.changeLane(-1);
          if (action === 'right') this.changeLane(1);
        };
      };

      setupTouchClick('btnTouchLeft', 'left');
      setupTouchClick('btnTouchRight', 'right');

      const setupHoldBtn = (id, keyName) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onmousedown = () => { this.keys[keyName] = true; };
        btn.onmouseup = () => { this.keys[keyName] = false; };
        btn.ontouchstart = (e) => { e.preventDefault(); this.keys[keyName] = true; };
        btn.ontouchend = (e) => { e.preventDefault(); this.keys[keyName] = false; };
      };

      setupHoldBtn('btnTouchBrake', 'down');
      setupHoldBtn('btnTouchNitro', 'nitro');

      // Menu Buttons
      document.getElementById('btnQuickPlay').onclick = () => this.startLevel(1);
      document.getElementById('btnSelectLevel').onclick = () => this.showModal('levelModal');
      document.getElementById('btnCloseLevel').onclick = () => this.hideModal('levelModal');
      document.getElementById('btnGarage').onclick = () => this.showGarage();
      document.getElementById('btnCloseGarage').onclick = () => this.hideModal('garageModal');
      document.getElementById('btnHowToPlay').onclick = () => this.showModal('howToModal');
      document.getElementById('btnCloseHowTo').onclick = () => this.hideModal('howToModal');

      document.getElementById('btnRetryLevel').onclick = () => this.startLevel(this.currentLevel.id);
      document.getElementById('btnBackToMenuFromGO').onclick = () => this.showMenu();
      document.getElementById('btnNextLevel').onclick = () => {
        const nextId = Math.min(3, this.currentLevel.id + 1);
        this.startLevel(nextId);
      };
      document.getElementById('btnBackToMenuFromWin').onclick = () => this.showMenu();

      // Nudge Button
      document.getElementById('btnNudge').onclick = () => {
        this.sound.playNudge();
        const wrapper = document.getElementById('canvasWrapper');
        wrapper.classList.remove('nudge-shake');
        void wrapper.offsetWidth;
        wrapper.classList.add('nudge-shake');
      };

      // Sound Toggle
      document.getElementById('btnSound').onclick = (e) => {
        const isEnabled = this.sound.toggleSound();
        e.target.innerText = isEnabled ? '🔊 Ses' : '🔇 Mute';
      };

      // Fullscreen Toggle
      document.getElementById('btnFullscreen').onclick = () => {
        if (!document.fullscreenElement) {
          document.querySelector('.app-container').requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      };

      // Shop Upgrades
      document.getElementById('btnUpgradeEngine').onclick = () => this.buyUpgrade('engine');
      document.getElementById('btnUpgradeNitro').onclick = () => this.buyUpgrade('nitro');
      document.getElementById('btnUpgradeArmor').onclick = () => this.buyUpgrade('armor');
    }

    changeLane(dir) {
      const nextLane = Math.max(0, Math.min(3, this.player.currentLane + dir));
      this.player.currentLane = nextLane;
      this.player.targetX = this.lanes[nextLane];
    }

    renderMenuStats() {
      let totalStars = 0;
      Object.values(this.userData.levelStars).forEach(s => totalStars += s);

      document.getElementById('totalStarsText').innerText = `⭐ ${totalStars}/9`;
      document.getElementById('totalCoinsText').innerText = `🪙 ${this.userData.totalCoins}`;
    }

    showModal(id) {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      document.getElementById(id).classList.remove('hidden');

      if (id === 'levelModal') this.renderLevelsList();
    }

    hideModal(id) {
      document.getElementById(id).classList.add('hidden');
    }

    showMenu() {
      this.state = 'MENU';
      this.sound.stopEngine();
      document.getElementById('hudOverlay').classList.add('hidden');
      document.getElementById('touchControls').classList.add('hidden');
      this.renderMenuStats();
      this.showModal('menuModal');
    }

    renderLevelsList() {
      const container = document.getElementById('levelsGrid');
      container.innerHTML = '';

      LEVELS.forEach(lvl => {
        const isUnlocked = this.userData.unlockedLevels.includes(lvl.id);
        const stars = this.userData.levelStars[lvl.id] || 0;
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

        const item = document.createElement('div');
        item.className = `level-item ${isUnlocked ? '' : 'locked'}`;
        item.innerHTML = `
          <div class="level-info">
            <h5>${lvl.id}. ${lvl.name}</h5>
            <p>${lvl.desc}</p>
          </div>
          <div class="level-stars">${isUnlocked ? starStr : '🔒 KİLİTLİ'}</div>
        `;

        if (isUnlocked) {
          item.onclick = () => {
            this.hideModal('levelModal');
            this.startLevel(lvl.id);
          };
        }
        container.appendChild(item);
      });
    }

    showGarage() {
      this.showModal('garageModal');
      this.renderGarageCar(VEHICLES.find(c => c.id === this.userData.selectedCarId) || VEHICLES[0]);
    }

    renderGarageCar(car) {
      document.getElementById('garageCarName').innerText = car.name;
      document.getElementById('garageCarDesc').innerText = car.desc;

      const engineLvl = this.userData.upgrades.engineLevel || 1;
      const nitroLvl = this.userData.upgrades.nitroLevel || 1;
      const armorLvl = this.userData.upgrades.armorLevel || 0;

      const effectiveSpeed = car.speedBase + (engineLvl - 1) * 15;
      document.getElementById('specSpeed').style.width = `${Math.min(100, (effectiveSpeed / 250) * 100)}%`;
      document.getElementById('specAccel').style.width = `${Math.min(100, ((car.accelBase + engineLvl * 10) / 150) * 100)}%`;
      document.getElementById('garageCoinDisplay').innerText = `Altınınız: 🪙 ${this.userData.totalCoins}`;

      document.getElementById('lblEngineLvl').innerText = `Lvl ${engineLvl}/5`;
      document.getElementById('lblNitroLvl').innerText = `Lvl ${nitroLvl}/5`;
      document.getElementById('lblArmorLvl').innerText = armorLvl > 0 ? `Aktif (${armorLvl} Kalkan)` : 'Devre Dışı';

      const engineCost = engineLvl < 5 ? engineLvl * 60 : 'MAX';
      const nitroCost = nitroLvl < 5 ? nitroLvl * 50 : 'MAX';
      const armorCost = armorLvl < 3 ? (armorLvl + 1) * 100 : 'MAX';

      document.getElementById('btnUpgradeEngine').innerText = engineLvl < 5 ? `Yükselt (🪙 ${engineCost})` : 'MAX LEVEL';
      document.getElementById('btnUpgradeNitro').innerText = nitroLvl < 5 ? `Yükselt (🪙 ${nitroCost})` : 'MAX LEVEL';
      document.getElementById('btnUpgradeArmor').innerText = armorLvl < 3 ? `Kalkan Al (🪙 ${armorCost})` : 'MAX KALKAN';

      const btn = document.getElementById('btnSelectOrBuyCar');
      const isUnlocked = this.userData.unlockedCars.includes(car.id);
      const isSelected = this.userData.selectedCarId === car.id;

      if (isSelected) {
        btn.innerText = 'SEÇİLDİ ✓';
        btn.className = 'btn btn-secondary';
        btn.onclick = null;
      } else if (isUnlocked) {
        btn.innerText = 'ARACI SEÇ';
        btn.className = 'btn btn-primary';
        btn.onclick = () => {
          this.userData.selectedCarId = car.id;
          this.selectedCar = car;
          this.saveUserData();
          this.renderGarageCar(car);
        };
      } else {
        btn.innerText = `SATIN AL (🪙 ${car.price})`;
        btn.className = 'btn btn-primary';
        btn.onclick = () => {
          if (this.userData.totalCoins >= car.price) {
            this.userData.totalCoins -= car.price;
            this.userData.unlockedCars.push(car.id);
            this.userData.selectedCarId = car.id;
            this.selectedCar = car;
            this.saveUserData();
            this.sound.playCoin();
            this.renderGarageCar(car);
          } else {
            alert('Yeterli altınınız yok! Bölümleri oynayarak altın kazanın.');
          }
        };
      }

      const strip = document.getElementById('carSelectorStrip');
      strip.innerHTML = '';
      VEHICLES.forEach(v => {
        const thumb = document.createElement('div');
        const unlocked = this.userData.unlockedCars.includes(v.id);
        const sel = this.userData.selectedCarId === v.id;
        thumb.className = `car-thumb ${sel ? 'active' : ''}`;
        thumb.innerHTML = `<strong>${v.name.split(' ')[0]}</strong><br>${unlocked ? 'Açık' : `🪙 ${v.price}`}`;
        thumb.onclick = () => this.renderGarageCar(v);
        strip.appendChild(thumb);
      });

      const gCanvas = document.getElementById('garageCarCanvas');
      const gCtx = gCanvas.getContext('2d');
      gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
      this.drawCarBody(gCtx, gCanvas.width / 2, gCanvas.height / 2, 46, 84, car.color);
    }

    buyUpgrade(type) {
      const u = this.userData.upgrades;
      let cost = 0;

      if (type === 'engine' && u.engineLevel < 5) {
        cost = u.engineLevel * 60;
        if (this.userData.totalCoins >= cost) {
          this.userData.totalCoins -= cost;
          u.engineLevel++;
          this.sound.playCoin();
        } else { alert('Yeterli altınınız yok!'); }
      } else if (type === 'nitro' && u.nitroLevel < 5) {
        cost = u.nitroLevel * 50;
        if (this.userData.totalCoins >= cost) {
          this.userData.totalCoins -= cost;
          u.nitroLevel++;
          this.sound.playCoin();
        } else { alert('Yeterli altınınız yok!'); }
      } else if (type === 'armor' && u.armorLevel < 3) {
        cost = (u.armorLevel + 1) * 100;
        if (this.userData.totalCoins >= cost) {
          this.userData.totalCoins -= cost;
          u.armorLevel++;
          this.sound.playCoin();
        } else { alert('Yeterli altınınız yok!'); }
      }

      this.saveUserData();
      this.renderGarageCar(this.selectedCar);
    }

    initGarageView() {
      const car = VEHICLES.find(c => c.id === this.userData.selectedCarId) || VEHICLES[0];
      this.selectedCar = car;
    }

    startLevel(levelId) {
      try {
        this.currentLevel = LEVELS.find(l => l.id === levelId) || LEVELS[0];
        this.selectedCar = VEHICLES.find(c => c.id === this.userData.selectedCarId) || VEHICLES[0];

        const engineLvl = this.userData.upgrades.engineLevel || 1;
        const nitroLvl = this.userData.upgrades.nitroLevel || 1;

        this.distance = 0;
        this.score = 0;
        this.coinsCollected = 0;
        this.speed = 50;
        this.maxSpeed = this.selectedCar.speedBase + (engineLvl - 1) * 15;
        this.nitro = 100;
        this.hasShield = (this.userData.upgrades.armorLevel || 0) > 0;

        this.player.currentLane = 1;
        this.player.x = this.lanes[1];
        this.player.targetX = this.lanes[1];

        this.traffic = [];
        this.coins = [];
        this.particles = [];

        this.hideModal('menuModal');
        this.hideModal('levelModal');
        this.hideModal('gameOverModal');
        this.hideModal('levelWinModal');

        document.getElementById('hudOverlay').classList.remove('hidden');
        document.getElementById('touchControls').classList.remove('hidden');

        document.getElementById('hudLevelName').innerText = `${this.currentLevel.id}: ${this.currentLevel.name}`;
        document.getElementById('hudProgressText').innerText = `0 / ${this.currentLevel.goalDistance === 999999 ? '∞' : this.currentLevel.goalDistance + 'm'}`;

        this.state = 'PLAYING';
        this.sound.startEngine();
      } catch (err) {
        console.error('Start level error:', err);
      }
    }

    startLoop() {
      let lastTime = performance.now();
      const loop = (now) => {
        try {
          const dt = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;

          this.update(dt);
          this.render();
        } catch (err) {
          console.error('Loop error:', err);
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    update(dt) {
      if (this.state !== 'PLAYING') return;

      this.player.x += (this.player.targetX - this.player.x) * 18 * dt;

      const engineLvl = this.userData.upgrades.engineLevel || 1;
      const accel = this.selectedCar.accelBase + engineLvl * 10;

      if (this.keys.up) {
        this.speed = Math.min(this.speed + accel * dt, this.maxSpeed);
      } else if (this.keys.down) {
        this.speed = Math.max(this.speed - accel * 1.5 * dt, 20);
      } else {
        if (this.speed > 70) this.speed -= 15 * dt;
        if (this.speed < 70) this.speed += 15 * dt;
      }

      const nitroLvl = this.userData.upgrades.nitroLevel || 1;
      if (this.keys.nitro && this.nitro > 5) {
        this.speed = Math.min(this.speed + accel * 2 * dt, this.maxSpeed * (1.25 + nitroLvl * 0.05));
        this.nitro -= (35 - nitroLvl * 3) * dt;
        this.sound.playNitro();
        this.createNitroParticles();
      } else {
        if (this.nitro < 100) this.nitro += (8 + nitroLvl * 2) * dt;
      }

      const distDelta = (this.speed * dt);
      this.distance += distDelta * 0.2;
      this.score += Math.floor(distDelta * 0.5);
      this.roadScroll += this.speed * dt * 8;

      this.sound.updateEngine(this.speed / this.maxSpeed);

      if (Math.random() < this.currentLevel.trafficDensity) {
        this.spawnTraffic();
      }

      if (Math.random() < 0.018) {
        this.spawnCoin();
      }

      for (let i = this.traffic.length - 1; i >= 0; i--) {
        const car = this.traffic[i];
        car.y += (this.speed - car.speed) * dt * 6;

        if (!car.nearMissed && Math.abs(car.x - this.player.x) < 48 && Math.abs(car.y - this.player.y) < 65 && car.y < this.player.y) {
          car.nearMissed = true;
          this.score += 150;
          this.sound.playNearMiss();
          this.showNearMissBanner();
        }

        if (Math.abs(car.x - this.player.x) < 30 && Math.abs(car.y - this.player.y) < 58) {
          if (this.hasShield) {
            this.hasShield = false;
            this.userData.upgrades.armorLevel = Math.max(0, (this.userData.upgrades.armorLevel || 1) - 1);
            this.saveUserData();
            this.sound.playShield();
            this.traffic.splice(i, 1);
            this.createSparkles(this.player.x, this.player.y);
            continue;
          } else {
            this.handleCrash();
            return;
          }
        }

        if (car.y > 700 || car.y < -300) {
          this.traffic.splice(i, 1);
        }
      }

      for (let i = this.coins.length - 1; i >= 0; i--) {
        const coin = this.coins[i];
        coin.y += this.speed * dt * 6;

        if (Math.abs(coin.x - this.player.x) < 30 && Math.abs(coin.y - this.player.y) < 38) {
          this.coinsCollected++;
          this.score += 100;
          this.sound.playCoin();
          this.createSparkles(coin.x, coin.y);
          this.coins.splice(i, 1);
          continue;
        }

        if (coin.y > 650) {
          this.coins.splice(i, 1);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      document.getElementById('hudScore').innerText = this.score;
      document.getElementById('hudCoins').innerText = `🪙 ${this.coinsCollected}`;
      document.getElementById('hudSpeed').innerText = Math.floor(this.speed);
      document.getElementById('hudNitroBar').style.width = `${this.nitro}%`;

      const distMeter = Math.floor(this.distance);
      const goal = this.currentLevel.goalDistance;
      document.getElementById('hudProgressText').innerText = `${distMeter} / ${goal === 999999 ? '∞' : goal + 'm'}`;
      document.getElementById('hudProgressBar').style.width = goal === 999999 ? '100%' : `${Math.min(100, (distMeter / goal) * 100)}%`;

      if (distMeter >= goal && goal !== 999999) {
        this.handleLevelWin();
      }
    }

    spawnTraffic() {
      const laneIndex = Math.floor(Math.random() * 4);
      const laneX = this.lanes[laneIndex];

      const existingInLane = this.traffic.some(c => Math.abs(c.x - laneX) < 20 && c.y < 0 && c.y > -220);
      if (existingInLane) return;

      const carTypes = [
        { color: '#e11d48', speed: 55 },
        { color: '#f59e0b', speed: 45 },
        { color: '#16a34a', speed: 65 }
      ];
      const type = carTypes[Math.floor(Math.random() * carTypes.length)];

      this.traffic.push({
        x: laneX,
        y: -100,
        width: 40,
        height: 72,
        color: type.color,
        speed: type.speed,
        nearMissed: false
      });
    }

    spawnCoin() {
      const laneIndex = Math.floor(Math.random() * 4);
      this.coins.push({ x: this.lanes[laneIndex], y: -40 });
    }

    createNitroParticles() {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 14,
          y: this.player.y + 38,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 3,
          color: Math.random() > 0.5 ? '#f59e0b' : '#38bdf8',
          size: Math.random() * 5 + 3,
          life: 0.25
        });
      }
    }

    createSparkles(x, y) {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          color: '#fbbf24',
          size: 4,
          life: 0.35
        });
      }
    }

    showNearMissBanner() {
      const banner = document.getElementById('hudNearMiss');
      if (banner) {
        banner.classList.remove('hidden');
        clearTimeout(this.nearMissTimeout);
        this.nearMissTimeout = setTimeout(() => banner.classList.add('hidden'), 700);
      }
    }

    handleCrash() {
      this.state = 'GAMEOVER';
      this.sound.playCrash();

      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: this.player.x,
          y: this.player.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 6 + 4,
          life: 0.6
        });
      }

      this.userData.totalCoins += this.coinsCollected;
      this.saveUserData();

      document.getElementById('goDistance').innerText = `${Math.floor(this.distance)}m`;
      document.getElementById('goCoins').innerText = `🪙 ${this.coinsCollected}`;
      document.getElementById('goScore').innerText = this.score;

      setTimeout(() => {
        document.getElementById('hudOverlay').classList.add('hidden');
        document.getElementById('touchControls').classList.add('hidden');
        this.showModal('gameOverModal');
      }, 400);
    }

    handleLevelWin() {
      this.state = 'WIN';
      this.sound.playWin();

      let stars = 1;
      if (this.score >= this.currentLevel.starScores[1]) stars = 2;
      if (this.score >= this.currentLevel.starScores[2]) stars = 3;

      const currentStars = this.userData.levelStars[this.currentLevel.id] || 0;
      if (stars > currentStars) {
        this.userData.levelStars[this.currentLevel.id] = stars;
      }

      const rewardCoins = 100 + stars * 50;
      this.userData.totalCoins += this.coinsCollected + rewardCoins;

      const nextLevelId = this.currentLevel.id + 1;
      if (nextLevelId <= 3 && !this.userData.unlockedLevels.includes(nextLevelId)) {
        this.userData.unlockedLevels.push(nextLevelId);
      }

      this.saveUserData();

      const starsDisplay = document.getElementById('winStarsDisplay');
      starsDisplay.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      document.getElementById('winRewardCoins').innerText = `🪙 +${rewardCoins}`;
      document.getElementById('winScore').innerText = this.score;

      document.getElementById('hudOverlay').classList.add('hidden');
      document.getElementById('touchControls').classList.add('hidden');
      this.showModal('levelWinModal');
    }

    render() {
      this.ctx.clearRect(0, 0, 800, 600);

      this.drawEnvironment();
      this.drawRoad();
      this.drawCoins();
      this.drawTraffic();
      this.drawPlayer();
      this.drawParticles();
    }

    drawEnvironment() {
      const theme = this.currentLevel.bgTheme;
      if (theme === 'day') {
        this.ctx.fillStyle = '#15803d';
      } else if (theme === 'rain') {
        this.ctx.fillStyle = '#0f172a';
      } else {
        this.ctx.fillStyle = '#2e1065';
      }
      this.ctx.fillRect(0, 0, 800, 600);
    }

    drawRoad() {
      this.ctx.fillStyle = this.currentLevel.asphaltColor;
      this.ctx.fillRect(180, 0, 440, 600);

      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(185, 0, 6, 600);
      this.ctx.fillRect(609, 0, 6, 600);

      this.ctx.fillStyle = '#ffffff';
      const offset = this.roadScroll % 50;
      const dividers = [290, 390, 490];

      for (let x of dividers) {
        for (let y = -50 + offset; y < 600; y += 50) {
          this.ctx.fillRect(x - 2, y, 4, 26);
        }
      }
    }

    drawPlayer() {
      this.drawCarBody(this.ctx, this.player.x, this.player.y, this.player.width, this.player.height, this.selectedCar.color);

      if (this.hasShield) {
        this.ctx.save();
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 48, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    drawTraffic() {
      this.traffic.forEach(car => {
        this.drawCarBody(this.ctx, car.x, car.y, car.width, car.height, car.color);
      });
    }

    drawCoins() {
      this.ctx.save();
      this.coins.forEach(c => {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, 13, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#92400e';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('$', c.x, c.y);
      });
      this.ctx.restore();
    }

    drawParticles() {
      this.particles.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    drawCarBody(ctx, x, y, width, height, color) {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-width / 2 - 4, -height / 2 + 10, 6, 16);
      ctx.fillRect(width / 2 - 2, -height / 2 + 10, 6, 16);
      ctx.fillRect(-width / 2 - 4, height / 2 - 24, 6, 16);
      ctx.fillRect(width / 2 - 2, height / 2 - 24, 6, 16);

      ctx.fillStyle = color;
      drawRoundRect(ctx, -width / 2, -height / 2, width, height, 8);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, -width / 2 + 4, -height / 2 + 16, width - 8, height - 34, 5);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      drawRoundRect(ctx, -width / 2 + 6, -height / 2 + 18, width - 12, 14, 3);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-width / 2 + 4, -height / 2 + 2, 8, 4);
      ctx.fillRect(width / 2 - 12, -height / 2 + 2, 8, 4);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-width / 2 + 4, height / 2 - 6, 8, 4);
      ctx.fillRect(width / 2 - 12, height / 2 - 6, 8, 4);

      ctx.restore();
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
  });
})();
