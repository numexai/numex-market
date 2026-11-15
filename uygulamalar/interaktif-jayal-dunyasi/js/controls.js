/* Numex Dream Studio — etkileşim denetleyicisi.
   Fare/dokunmatik girdisini anlamlı sahne sinyallerine çevirir:
   itme, girdap, patlama, yakınlaşma, klavye kısayolları. */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});

  function Controls(el, handlers) {
    this.el = el;
    this.h = handlers || {};
    this.pointer = {
      x: 0, y: 0,
      sx: 0, sy: 0,
      vx: 0, vy: 0,
      down: false,
      active: false,
      lastMove: 0
    };
    this.vortex = 0;
    this.zoomMul = 1;
    this.pointers = new Map();
    this.pinchDist = 0;
    this.bind();
  }

  Controls.prototype.worldPoint = function () {
    const p = this.pointer;
    if (this.h.toWorld) return this.h.toWorld(p.sx, p.sy);
    return { x: 0, y: 0 };
  };

  Controls.prototype.bind = function () {
    const el = this.el;
    const self = this;
    const p = this.pointer;

    function local(e) {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    el.addEventListener('pointerdown', function (e) {
      // NUMEX-DÜZELTME (2026-11-15): setPointerCapture bazı ortamlarda (sentetik/iptal edilmiş pointer, bazı dokunmatik tarayıcılar) istisna atıyor ve dinleyicinin geri kalanı hiç çalışmıyordu → sürükleme girdabı ve tıklama patlaması devre dışı kalıyordu. Çağrı try/catch ile korundu.
      // bazı tarayıcılar/iptal edilmiş pointer'larda bu çağrı istisna atar;
      // yakalamazsak dinleyicinin geri kalanı (girdap, patlama) hiç çalışmaz
      try { if (el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (err) { /* yakalama zorunlu değil */ }
      const pt = local(e);
      self.pointers.set(e.pointerId, pt);
      if (self.pointers.size === 2) {
        const arr = Array.from(self.pointers.values());
        self.pinchDist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      }
      p.sx = pt.x; p.sy = pt.y;
      p.down = true;
      p.active = true;
      p.lastMove = performance.now();
      p.moved = 0;
      p.downAt = performance.now();
      p.startX = pt.x; p.startY = pt.y;
      self.vortex = 0;
      if (self.h.onInteract) self.h.onInteract();
    });

    el.addEventListener('pointermove', function (e) {
      const pt = local(e);
      const now = performance.now();
      const dt = Math.max(0.008, (now - (p.lastMove || now)) / 1000);
      const prev = { x: p.sx, y: p.sy };
      p.sx = pt.x; p.sy = pt.y;
      p.active = true;
      p.lastMove = now;

      const wp = self.worldPoint();
      const dtw = p.lastWorld ? { x: wp.x - p.lastWorld.x, y: wp.y - p.lastWorld.y } : { x: 0, y: 0 };
      p.vx = dtw.x / dt;
      p.vy = dtw.y / dt;
      p.lastWorld = wp;
      p.x = wp.x; p.y = wp.y;

      if (p.down) {
        const moved = Math.hypot(p.sx - p.startX, p.sy - p.startY);
        p.moved = Math.max(p.moved || 0, moved);
        const speed = Math.hypot(pt.x - prev.x, pt.y - prev.y);
        const target = Math.min(1, speed / 26);
        self.vortex += (target - self.vortex) * 0.35;
        if (self.pointers.size === 2) {
          const arr = Array.from(self.pointers.values());
          if (arr.length >= 2) {
            const arrPt = { x: arr[0].x, y: arr[0].y };
            arrPt.x = arr[0].x; arrPt.y = arr[0].y;
            const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
            if (self.pinchDist > 0 && d > 0) {
              const ratio = d / self.pinchDist;
              if (self.h.onPinch) self.h.onPinch(ratio);
            }
            self.pinchDist = d;
          }
        }
      }
      if (self.h.onMove) self.h.onMove(wp);
      if (self.h.onInteract) self.h.onInteract();
    });

    function release(e) {
      const pt = local(e);
      if (self.pointers.has(e.pointerId)) self.pointers.delete(e.pointerId);
      const wasDown = p.down;
      p.down = false;
      self.vortex = 0;
      if (wasDown && p.moved < 10 && performance.now() - (p.downAt || 0) < 500) {
        const wp = self.h.toWorld ? self.h.toWorld(pt.x, pt.y) : { x: 0, y: 0 };
        if (self.h.onBurst) self.h.onBurst(wp);
      }
    }

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', function (e) {
      if (self.pointers.has(e.pointerId)) self.pointers.delete(e.pointerId);
      p.down = false; self.vortex = 0;
    });
    el.addEventListener('pointerleave', function () {
      p.active = false;
      p.down = false;
      self.vortex = 0;
      if (self.h.onLeave) self.h.onLeave();
    });

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0016);
      self.zoomMul = Math.max(0.35, Math.min(3.4, self.zoomMul * factor));
      if (self.h.onZoom) self.h.onZoom(self.zoomMul);
      if (self.h.onInteract) self.h.onInteract();
    }, { passive: false });

    window.addEventListener('keydown', function (e) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      const keys = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 };
      if (e.key in keys && self.h.onKeyMode) self.h.onKeyMode(keys[e.key]);
      if (e.code === 'Space') { e.preventDefault(); if (self.h.onCinema) self.h.onCinema(); }
      if (e.key === 'p' || e.key === 'P') { if (self.h.onPng) self.h.onPng(); }
      if (e.key === 'h' || e.key === 'H') { if (self.h.onPanel) self.h.onPanel(); }
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        else document.exitFullscreen && document.exitFullscreen();
      }
    });
  };

  Controls.prototype.force = function () {
    const p = this.pointer;
    const idle = performance.now() - (p.lastMove || 0) > 2600;
    const strength = p.active && !idle ? 1 : 0;
    return { x: p.x, y: p.y, vx: p.vx, vy: p.vy, strength: strength };
  };

  NS.Controls = Controls;
})();
