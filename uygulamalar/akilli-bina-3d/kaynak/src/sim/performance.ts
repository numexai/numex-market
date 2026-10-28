import * as THREE from 'three';

/**
 * Gerçek FPS ölçümü + dinamik çözünürlük.
 * FPS değeri sabit yazılmaz; kare sürelerinden ölçülür.
 */

export class PerformanceMonitor {
  private frames = 0;
  private acc = 0;
  private lastReport = 0;
  private fpsSamples: number[] = [];
  private renderer: THREE.WebGLRenderer;
  private basePixelRatio: number;
  private currentPixelRatio: number;
  private lowStreak = 0;
  private highStreak = 0;
  private dynamicEnabled = true;
  private shadowSize = 2048;
  onShadowQualityChange: ((size: number) => void) | null = null;

  fps = 0;
  minFps = 999;
  private drawCalls = 0;
  private triangles = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.currentPixelRatio = this.basePixelRatio;
    renderer.setPixelRatio(this.currentPixelRatio);

    // cihaz gücüne göre başlangıç gölge kalitesi
    const mem = (navigator as any).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores <= 4 || mem <= 4) {
      this.shadowSize = 1024;
    } else if (cores <= 8) {
      this.shadowSize = 2048;
    } else {
      this.shadowSize = 2048;
    }
  }

  get recommendedShadowSize(): number {
    return this.shadowSize;
  }

  get pixelRatio(): number {
    return this.currentPixelRatio;
  }

  get dynamic(): boolean {
    return this.dynamicEnabled;
  }

  setDynamic(on: boolean): void {
    this.dynamicEnabled = on;
    if (!on) {
      this.currentPixelRatio = this.basePixelRatio;
      this.renderer.setPixelRatio(this.currentPixelRatio);
    }
  }

  update(dt: number): void {
    this.frames++;
    this.acc += dt;
    if (this.acc >= 0.5) {
      this.fps = this.frames / this.acc;
      this.fpsSamples.push(this.fps);
      if (this.fpsSamples.length > 20) this.fpsSamples.shift();
      this.minFps = Math.min(...this.fpsSamples);
      this.frames = 0;
      this.acc = 0;

      // NOT: EffectComposer birden fazla pass çalıştırdığı için renderer.info her
      // pass'te SIFIRLANIR. Bu yüzden "autoReset=false" ile pass'ler boyunca toplanır
      // (main.ts'te ayarlanır) ve burada okunur.
      const info = this.renderer.info.render;
      this.drawCalls = info.calls;
      this.triangles = info.triangles;

      // dinamik çözünürlük: 60 altı → düşür, sürekli 58 üstü → yükselt
      if (this.dynamicEnabled) {
        if (this.fps < 45) {
          this.lowStreak++;
          this.highStreak = 0;
          if (this.lowStreak >= 3 && this.currentPixelRatio > 0.75) {
            this.currentPixelRatio = Math.max(0.75, this.currentPixelRatio - 0.15);
            this.renderer.setPixelRatio(this.currentPixelRatio);
            this.lowStreak = 0;
          }
        } else if (this.fps > 58) {
          this.highStreak++;
          this.lowStreak = 0;
          if (this.highStreak >= 6 && this.currentPixelRatio < this.basePixelRatio) {
            this.currentPixelRatio = Math.min(this.basePixelRatio, this.currentPixelRatio + 0.1);
            this.renderer.setPixelRatio(this.currentPixelRatio);
            this.highStreak = 0;
          }
        } else {
          this.lowStreak = 0;
          this.highStreak = 0;
        }
      }
    }
  }

  get stats(): { fps: number; minFps: number; drawCalls: number; triangles: number; pixelRatio: number } {
    return {
      fps: this.fps,
      minFps: this.minFps === 999 ? 0 : this.minFps,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      pixelRatio: this.currentPixelRatio,
    };
  }

  resetMin(): void {
    this.minFps = 999;
    this.fpsSamples = [];
  }
}
