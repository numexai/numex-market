/* Numex Dream Studio — otomatik kalite denetleyicisi (FPS ölçümü) */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});

  function Perf() {
    this.frames = 0;
    this.acc = 0;
    this.fps = 60;
    this.level = 1;      // 0.45 .. 1
    this.cool = 0;
    this.changed = false;
  }

  Perf.prototype.tick = function (dt) {
    this.acc += dt;
    this.frames++;
    this.cool -= dt;
    if (this.acc >= 0.5) {
      this.fps = this.frames / this.acc;
      this.frames = 0;
      this.acc = 0;
      this.evaluate();
    }
    return this.fps;
  };

  Perf.prototype.evaluate = function () {
    this.changed = false;
    if (this.cool > 0) return;
    if (this.fps < 34 && this.level > 0.46) {
      this.level = Math.max(0.45, this.level - 0.16);
      this.cool = 1.5;
      this.changed = true;
    } else if (this.fps > 56 && this.level < 1) {
      this.level = Math.min(1, this.level + 0.09);
      this.cool = 3;
      this.changed = true;
    }
  };

  NS.Perf = Perf;
})();
