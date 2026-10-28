import * as THREE from 'three';

/**
 * Gerçek FPS ölçümü — kare sürelerinden hesaplanır, sabit değer yazılmaz.
 * Ayrıca çizim çağrısı ve üçgen sayısını raporlar (performans kanıtı).
 */
export class FpsMeter {
  private frames = 0;
  private acc = 0;
  private samples: number[] = [];

  fps = 0;
  minFps = 0;
  maxFps = 0;
  drawCalls = 0;
  triangles = 0;

  constructor(private renderer: THREE.WebGLRenderer) {}

  update(dt: number): boolean {
    this.frames++;
    this.acc += dt;
    if (this.acc < 0.5) return false;

    this.fps = this.frames / this.acc;
    this.samples.push(this.fps);
    if (this.samples.length > 40) this.samples.shift();
    this.minFps = Math.min(...this.samples);
    this.maxFps = Math.max(...this.samples);
    this.frames = 0;
    this.acc = 0;

    const info = this.renderer.info.render;
    this.drawCalls = info.calls;
    this.triangles = info.triangles;
    return true;
  }

  /** Ortalama FPS (son 20 örnek) */
  get average(): number {
    if (this.samples.length === 0) return 0;
    const last = this.samples.slice(-20);
    return last.reduce((a, b) => a + b, 0) / last.length;
  }

  reset(): void {
    this.samples = [];
    this.minFps = 0;
    this.maxFps = 0;
  }
}
