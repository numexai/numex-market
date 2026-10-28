/**
 * Oyun denetleyicisi (controller) — motor ile arayüz arasındaki köprü.
 *
 * Sorumluluklar:
 *  - Motoru kurmak/başlatmak/sıfırlamak
 *  - İnsan tıklamalarını motora iletmek
 *  - AI sırasını otomatik oynatmak (zamanlayıcı ile, animasyonlu)
 *  - Motordan gelen olayları UI render katmanına aktarmak
 *
 * UI DOĞRUDAN STATE'E DOKUNMAZ — her şey bu katmandan geçer.
 */
import { strategyFor } from '../engine/ai';
import { PistiEngine, TEAM_OF } from '../engine/engine';
import type { EngineEvent } from '../engine/engine';
import type { Card, Difficulty, GameState, PlayerId, RoundSummary, TeamScores } from '../engine/types';

/** Denetleyicinin UI'a bildirdiği olay */
export interface ControllerHooks {
  onRender: (state: GameState, extras: Extras) => void;
  onEvent: (ev: EngineEvent) => void;
  onSummary: (summary: RoundSummary) => void;
  onGameEnd: (totals: TeamScores, winner: 'A' | 'B' | null) => void;
  onLog: (text: string, kind: string) => void;
}

/** UI'ın ihtiyaç duyduğu ek bilgiler */
export interface Extras {
  totals: TeamScores;
  summary: RoundSummary | null;
  captured: Record<PlayerId, Card[]>;
  lastMove: { player: PlayerId; card: Card } | null;
  totalCaptured: Record<PlayerId, number>;
}

/** Oyun ayarları */
export interface GameSettings {
  soloVsAi: boolean;
  difficulties: Record<PlayerId, Difficulty>;
  playerName: string;
  /** AI hamle gecikmesi (ms) */
  aiDelay: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  soloVsAi: false,
  difficulties: { 0: 'normal', 1: 'normal', 2: 'normal', 3: 'normal' },
  playerName: 'Sen',
  aiDelay: 900,
};

export class PistiController {
  private engine: PistiEngine;
  private hooks: ControllerHooks;
  private settings: GameSettings;
  private aiTimer: number | null = null;
  private disposed = false;

  constructor(hooks: ControllerHooks, settings: GameSettings = DEFAULT_SETTINGS) {
    this.hooks = hooks;
    this.settings = settings;
    this.engine = this.buildEngine(settings);
  }

  /** Ayar değişikliğinde motoru yeniden kurar */
  private buildEngine(settings: GameSettings): PistiEngine {
    return new PistiEngine({
      soloVsAi: settings.soloVsAi,
      difficulties: settings.difficulties,
      names: { 0: settings.playerName },
      onEvent: (ev) => this.handleEvent(ev),
    });
  }

  /** Ayarları günceller ve oyunu sıfırlar */
  applySettings(settings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.stopAiLoop();
    this.engine = this.buildEngine(this.settings);
    this.engine.createGame();
    this.render();
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  /** Yeni oyun başlatır */
  start(): void {
    this.engine.createGame();
    this.engine.startGame();
    this.render();
    this.scheduleAi();
  }

  /** Oyunu sıfırlar (başlatmaz) */
  reset(): void {
    this.stopAiLoop();
    this.engine.resetGame();
    this.render();
  }

  /** Sıfırla + başlat */
  restart(): void {
    this.stopAiLoop();
    this.engine = this.buildEngine(this.settings);
    this.engine.createGame();
    this.engine.startGame();
    this.render();
    this.scheduleAi();
  }

  /** İnsan oyuncunun kart tıklaması */
  playHuman(card: Card): boolean {
    if (this.engine.isAiTurn()) return false;
    if (this.engine.currentTurn() !== 0) return false;
    if (this.engine.getState().locked) return false;
    const res = this.engine.playCard(0, card);
    if (!res.ok) {
      this.hooks.onLog(res.error ?? 'Geçersiz hamle', 'info');
      return false;
    }
    if (res.roundEnded) {
      this.handleRoundEnd(res.summary ?? null);
    } else {
      this.render();
      this.scheduleAi();
    }
    return true;
  }

  /** Bir kart oynanabilir mi (UI vurgusu için) */
  canPlayCard(card: Card): boolean {
    return this.engine.canPlay(0, card);
  }

  /** Şu an insanın sırası mı */
  isHumanTurn(): boolean {
    const st = this.engine.getState();
    return st.started && !st.finished && st.turn === 0 && !st.locked && !this.engine.isAiTurn();
  }

  /** Motoru doğrudan al (test/debug) */
  getEngine(): PistiEngine {
    return this.engine;
  }

  // ───────────────────────────── AI döngüsü ─────────────────────────────

  /** AI sırasıysa gecikmeli hamle planlar */
  private scheduleAi(): void {
    if (this.disposed) return;
    const st = this.engine.getState();
    if (!st.started || st.finished) return;
    if (!this.engine.isAiTurn()) return;
    this.stopAiLoop();
    this.aiTimer = window.setTimeout(() => {
      this.playAiMove();
    }, this.settings.aiDelay);
  }

  /** AI hamlesini oynar, ardından sıradaki AI'ı planlar */
  private playAiMove(): void {
    if (this.disposed) return;
    const st = this.engine.getState();
    if (!st.started || st.finished) return;
    const player = st.players[st.turn];
    if (!player || player.kind !== 'ai') return;
    const strategy = strategyFor(player.difficulty);
    const decision = this.engine.decideAiMove(strategy);
    if (!decision) {
      this.render();
      return;
    }
    const res = this.engine.playCard(player.id, decision.card);
    if (!res.ok) {
      this.hooks.onLog(`AI hamlesi başarısız: ${res.error ?? ''}`, 'info');
      this.render();
      return;
    }
    if (res.roundEnded) {
      this.handleRoundEnd(res.summary ?? null);
      return;
    }
    this.render();
    this.scheduleAi();
  }

  private stopAiLoop(): void {
    if (this.aiTimer !== null) {
      window.clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
  }

  // ───────────────────────────── Olaylar ─────────────────────────────

  private handleEvent(ev: EngineEvent): void {
    this.hooks.onEvent(ev);
    if (ev.type === 'gameEnd') {
      this.hooks.onGameEnd(ev.totals, ev.winner);
    }
  }

  private handleRoundEnd(summary: RoundSummary | null): void {
    this.render();
    if (summary) {
      this.hooks.onSummary(summary);
    }
    const st = this.engine.getState();
    if (st.finished) {
      const ex = this.engine.getExtras();
      this.hooks.onGameEnd(ex.totals, st.winner);
      return;
    }
    this.scheduleAi();
  }

  /** UI'ı günceller */
  render(): void {
    if (this.disposed) return;
    const state = this.engine.getState();
    const ex = this.engine.getExtras();
    const extras: Extras = {
      totals: ex.totals,
      summary: ex.summary,
      captured: ex.captured,
      lastMove: ex.lastMove ? { player: ex.lastMove.player, card: ex.lastMove.card } : null,
      totalCaptured: ex.totalCaptured,
    };
    this.hooks.onRender(state, extras);
  }

  /** Temizlik */
  dispose(): void {
    this.disposed = true;
    this.stopAiLoop();
  }

  /** Takım etiketi (UI yardımı) */
  teamOf(player: PlayerId): 'A' | 'B' {
    return TEAM_OF[player];
  }
}
