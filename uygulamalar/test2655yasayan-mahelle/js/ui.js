'use strict';
/* Numex Living Neighborhood — arayüz katmanı */

const UI = {
  h: {},
  nodes: {},
  _statT: 0,
  _skyT: 0,

  init(handlers) {
    this.h = handlers || {};
    const $ = (s) => document.querySelector(s);
    this.nodes = {
      clockTime: $('#clock-time'),
      clockPhase: $('#clock-phase'),
      speed: $('#speed'),
      speedOut: $('#speed-out'),
      stats: $('#stats'),
      tip: $('#tip'),
      bar: $('#interior-bar'),
      barTitle: $('#interior-title'),
      loader: $('#loader'),
      scene: $('#scene'),
      fx: $('#fx'),
      timeBtns: Array.from(document.querySelectorAll('#time-buttons button')),
      weatherBtns: Array.from(document.querySelectorAll('#weather-buttons button')),
      btnOverview: $('#btn-overview'),
      btnStreet: $('#btn-street'),
      btnExit: $('#btn-exit'),
    };

    const N = this.nodes;

    N.timeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mark(N.timeBtns, btn);
        if (this.h.setHour) this.h.setHour(parseFloat(btn.dataset.hour));
      });
    });

    N.weatherBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mark(N.weatherBtns, btn);
        if (this.h.setWeather) this.h.setWeather(btn.dataset.weather);
      });
    });

    N.speed.addEventListener('input', () => {
      const v = parseFloat(N.speed.value);
      N.speedOut.textContent = v === 0 ? 'Durdu' : v + '×';
      if (this.h.setSpeed) this.h.setSpeed(v);
    });

    N.btnOverview.addEventListener('click', () => this.h.overview && this.h.overview());
    N.btnStreet.addEventListener('click', () => this.h.street && this.h.street());
    N.btnExit.addEventListener('click', () => this.h.exit && this.h.exit());

    this.setSpeed(2);
    return this;
  },

  mark(list, active) {
    list.forEach((b) => b.classList.toggle('is-on', b === active));
  },

  setSpeed(v) {
    const N = this.nodes;
    N.speed.value = String(v);
    N.speedOut.textContent = v === 0 ? 'Durdu' : v + '×';
    if (this.h.setSpeed) this.h.setSpeed(v);
  },

  /** Saat şeridi ve istatistikler. */
  tick(L, dt) {
    const N = this.nodes;
    const hh = Math.floor(L.hour);
    const mm = Math.floor((L.hour - hh) * 60);
    N.clockTime.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    N.clockPhase.textContent = L.phaseName();

    this._statT += dt;
    if (this._statT > 0.6) {
      this._statT = 0;
      const c = L.counts();
      N.stats.textContent = c.people + ' kişi · ' + c.cars + ' araç';
    }

    this._skyT += dt;
    if (this._skyT > 0.12) {
      this._skyT = 0;
      const sky = L.sky();
      const t = sky.top.map((v) => Math.round(v * 255));
      const b = sky.bot.map((v) => Math.round(v * 255));
      document.body.style.background =
        'linear-gradient(to bottom, rgb(' + t.join(',') + ') 0%, rgb(' + b.join(',') + ') 68%, rgb(' +
        b.map((v) => Math.round(v * 0.82)).join(',') + ') 100%)';
    }
  },

  tip(text, x, y) {
    const N = this.nodes;
    if (!text) { N.tip.hidden = true; return; }
    N.tip.hidden = false;
    N.tip.textContent = text;
    N.tip.style.left = x + 'px';
    N.tip.style.top = y + 'px';
  },

  interior(on, title) {
    const N = this.nodes;
    N.bar.hidden = !on;
    if (on && title) N.barTitle.textContent = title;
    N.scene.classList.toggle('is-walk', !!on);
    document.body.classList.toggle('is-inside', !!on);
  },

  loaderDone() {
    const L = this.nodes.loader;
    if (!L) return;
    L.classList.add('is-done');
    setTimeout(() => { L.style.display = 'none'; }, 600);
  },
};
