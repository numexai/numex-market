/**
 * Oyun motoru — Pişti'nin tek doğruluk kaynağı.
 *
 * Kurallar (gerçek pişti):
 *  - 52 kartlık deste, 4 oyuncu (0 = sen, 1 = partner, 2-3 = rakipler).
 *  - Takımlar: (0,2) vs (1,3).
 *  - Oyun başında her oyuncuya 4 kart, masaya 4 açık kart konur.
 *  - Eller bitince (4 tur sonra) deste varsa yeniden 4'er kart dağıtılır;
 *    masaya yeni kart KONMAZ.
 *  - Deste bitti ve eller boşaldıysa son elde yerdeki kartlar son kart alan oyuncuya verilir.
 *  - Kart alma: aynı değer VEYA vale. Pişti: yerde tek kart varken aynı değerle alma (vale ile değil).
 *
 * UI bu sınıfın state'ini doğrudan DEĞİŞTİREMEZ; yalnızca metodlarla ilerler
 * ve `snapshot()`/`getState()` ile salt-okunur kopya alır.
 */
import { createDeck, shuffle, hasCard } from './deck';
import {
  canCapture,
  isVale,
  resolveCapture,
  resolveLastHand,
  topCard,
} from './rules';
import { MAJORITY_BONUS, calculateScores, determineWinner } from './scoring';
import { PISTI_POINTS } from './rules';
import type {
  AiDecision,
  Card,
  Difficulty,
  GameState,
  LogEntry,
  MoveRecord,
  Player,
  PlayerId,
  PlayResult,
  RoundSummary,
  TeamId,
  TeamScores,
} from './types';

/** Handle (el) başına kart sayısı */
export const HAND_SIZE = 4;

/** Oyun başında masaya konan kart sayısı */
export const INITIAL_TABLE_CARDS = 4;

/** Sıra yönü: 0 → 1 → 2 → 3 → 0 */
export const TURN_ORDER: readonly PlayerId[] = [0, 1, 2, 3] as const;

/** Takım eşleşmesi */
export const TEAM_OF: Record<PlayerId, TeamId> = { 0: 'A', 1: 'B', 2: 'A', 3: 'B' };

/** Varsayılan oyuncu adları */
export const DEFAULT_NAMES: Record<PlayerId, string> = {
  0: 'Sen',
  1: 'Partner',
  2: 'Rakip 1',
  3: 'Rakip 2',
};

/** Motor kurulum seçenekleri */
export interface EngineOptions {
  /** Oyuncu 0 insan mı, yoksa hepsi AI mı (tek başına 3 AI'a karşı) */
  soloVsAi?: boolean;
  /** AI zorluk seviyeleri (oyuncu 1,2,3) */
  difficulties?: Partial<Record<PlayerId, Difficulty>>;
  /** Oyuncu adları */
  names?: Partial<Record<PlayerId, string>>;
  /** Determinstik test için rastgelelik kaynağı */
  rng?: () => number;
  /** Toplam tur (hand) sayısı; null = deste bitene kadar */
  maxRounds?: number | null;
  /** Her hamleden sonra tetiklenen olay kancası (UI için) */
  onEvent?: (ev: EngineEvent) => void;
}

/** Motorun dışa vurduğu olaylar (UI animasyon/UI güncellemesi için) */
export type EngineEvent =
  | { type: 'gameStart'; state: GameState }
  | { type: 'roundStart'; round: number; state: GameState }
  | { type: 'deal'; player: PlayerId; count: number; state: GameState }
  | { type: 'play'; player: PlayerId; card: Card; state: GameState }
  | { type: 'capture'; player: PlayerId; cards: Card[]; pisti: boolean; state: GameState }
  | { type: 'turn'; player: PlayerId; state: GameState }
  | { type: 'roundEnd'; summary: RoundSummary; state: GameState }
  | { type: 'gameEnd'; winner: TeamId | null; totals: TeamScores; state: GameState }
  | { type: 'lastHand'; player: PlayerId; cards: Card[]; state: GameState };

/** Motor iç durumu — dışarı sızdırılmaz, snapshot ile kopyalanır */
interface InternalState {
  started: boolean;
  finished: boolean;
  roundNumber: number;
  table: Card[];
  moves: MoveRecord[];
  players: Player[];
  deck: Card[];
  turn: PlayerId;
  playedThisRound: PlayerId[];
  log: LogEntry[];
  locked: boolean;
  winner: TeamId | null;
  totals: TeamScores;
  capturedCards: Record<PlayerId, Card[]>;
  pistiCount: Record<PlayerId, number>;
  lastCapturer: PlayerId | null;
  lastPlayer: PlayerId;
  /** Deste bir kez dağıtıldı mı (ilk dağıtımda masaya kart konur) */
  firstDealDone: boolean;
  seq: number;
  /** Önceden oynanan kartların kaydı (zor AI için) */
  seenCards: Card[];
}

export class PistiEngine {
  private s: InternalState;
  private readonly opts: EngineOptions;

  constructor(opts: EngineOptions = {}) {
    this.opts = opts;
    this.s = this.createEmptyState();
  }

  // ───────────────────────────── KURULUM ─────────────────────────────

  /** Boş/ilk durum oluşturur */
  private createEmptyState(): InternalState {
    const players: Player[] = ([0, 1, 2, 3] as PlayerId[]).map((id) => ({
      id,
      name: this.opts.names?.[id] ?? DEFAULT_NAMES[id],
      team: TEAM_OF[id],
      kind: id === 0 && !this.opts.soloVsAi ? 'human' : 'ai',
      difficulty: this.opts.difficulties?.[id] ?? (id === 0 ? 'normal' : 'normal'),
      hand: [],
      stats: { capturedCount: 0, pistiCount: 0, rawPoints: 0 },
    }));

    return {
      started: false,
      finished: false,
      roundNumber: 0,
      table: [],
      moves: [],
      players,
      deck: [],
      turn: 0,
      playedThisRound: [],
      log: [],
      locked: false,
      winner: null,
      totals: { A: 0, B: 0 },
      capturedCards: { 0: [], 1: [], 2: [], 3: [] },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
      lastCapturer: null,
      lastPlayer: 0,
      firstDealDone: false,
      seq: 0,
      seenCards: [],
    };
  }

  /** Oyunu kurar: deste oluşturulur ve karıştırılır (henüz dağıtım yok). */
  createGame(): GameState {
    this.s = this.createEmptyState();
    const deck = createDeck();
    if (deck.length !== 52) {
      throw new Error(`Deste 52 kart olmalı, ${deck.length} üretildi`);
    }
    const ids = new Set(deck.map((c) => c.id));
    if (ids.size !== 52) {
      throw new Error('Destede yinelenen kart var');
    }
    this.s.deck = shuffle(deck, this.opts.rng);
    this.pushLog('Deste karıştırıldı, oyun kuruldu.', 'info');
    return this.getState();
  }

  /**
   * Oyunu başlatır: dağıtım + masaya açılış kartları + tur başlatma.
   */
  startGame(): GameState {
    if (this.s.deck.length === 0) this.createGame();
    this.s.started = true;
    this.s.finished = false;
    this.s.winner = null;
    this.s.roundNumber = 1;
    this.s.table = [];
    this.s.moves = [];
    this.s.playedThisRound = [];
    this.s.totals = { A: 0, B: 0 };
    this.s.capturedCards = { 0: [], 1: [], 2: [], 3: [] };
    this.s.pistiCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
    this.s.lastCapturer = null;
    this.s.lastPlayer = 0;
    this.s.seenCards = [];
    for (const p of this.s.players) {
      p.hand = [];
      p.stats = { capturedCount: 0, pistiCount: 0, rawPoints: 0 };
    }

    this.dealCards();
    this.dealTable();
    this.s.firstDealDone = true;
    this.s.turn = 0;
    this.s.playedThisRound = [];

    this.emit({ type: 'gameStart', state: this.getState() });
    this.pushLog(`1. tur başladı. Sıra: ${this.playerName(0)}.`, 'round');
    this.emit({ type: 'roundStart', round: 1, state: this.getState() });
    return this.getState();
  }

  /**
   * Her oyuncuya 4 kart dağıtır (elde kart olsa bile üzerine ekler).
   * Deste yetmezse kalan kadar dağıtılır (son el).
   */
  dealCards(): void {
    // Son elde deste 4*4'ten az kalabilir. O durumda HER oyuncuya EŞİT sayıda
    // dağıtılır (kalan kadar) — aksi halde bazı oyunculara kart kalmaz ve
    // el hiçbir zaman tamamlanmaz.
    const perPlayer = Math.min(
      HAND_SIZE,
      Math.floor(this.s.deck.length / this.s.players.length),
    );
    for (const player of this.s.players) {
      let count = 0;
      while (count < perPlayer && this.s.deck.length > 0) {
        const card = this.s.deck.shift();
        if (!card) break;
        player.hand.push(card);
        this.s.seenCards.push(card);
        count++;
      }
      if (count > 0) {
        this.emit({ type: 'deal', player: player.id, count, state: this.getState() });
      }
    }
    this.pushLog(
      `Kartlar dağıtıldı (kişi başı ${perPlayer}). Destede ${this.s.deck.length} kart kaldı.`,
      'info',
    );
  }

  /** Masaya başlangıç kartlarını koyar */
  private dealTable(): void {
    let placed = 0;
    while (placed < INITIAL_TABLE_CARDS && this.s.deck.length > 0) {
      const card = this.s.deck.shift();
      if (!card) break;
      this.s.table.push(card);
      this.s.seenCards.push(card);
      placed++;
    }
    this.pushLog(`Masaya ${placed} açık kart kondu.`, 'info');
  }

  // ─────────────────────────── HAMLE OYNAMA ───────────────────────────

  /**
   * Bir oyuncunun kart oynamasını işler.
   * Doğrulama: oyun başlamış mı, kilitli mi, sıra doğru mu, kart elde mi.
   */
  playCard(player: PlayerId, card: Card): PlayResult {
    if (!this.s.started) return { ok: false, error: 'Oyun başlatılmadı' };
    if (this.s.finished) return { ok: false, error: 'Oyun bitti' };
    if (this.s.locked) return { ok: false, error: 'Oyun şu an kilitli (animasyon sürüyor)' };
    if (this.s.turn !== player) {
      return {
        ok: false,
        error: `Sıra ${this.playerName(this.s.turn)}'de, ${this.playerName(player)} oynayamaz`,
      };
    }
    const p = this.s.players[player];
    if (!p) return { ok: false, error: 'Geçersiz oyuncu' };
    if (!hasCard(p.hand, card)) {
      return { ok: false, error: `${card.name} oyuncunun elinde yok` };
    }

    // ── Geçerli hamle: uygula ──
    const tableBefore = this.s.table.slice();
    const { captured, pisti } = resolveCapture(card, tableBefore);

    // Eli güncelle
    p.hand = p.hand.filter((c) => c.id !== card.id);

    // Masayı güncelle
    if (captured.length > 0) {
      this.s.table = [];
      const all = this.s.capturedCards[player];
      all.push(...captured);
      p.stats.capturedCount = all.length;
      this.s.lastCapturer = player;
      if (pisti) {
        this.s.pistiCount[player] += 1;
        p.stats.pistiCount = this.s.pistiCount[player];
      }
    } else {
      this.s.table.push(card);
    }

    const move: MoveRecord = {
      player,
      card,
      captured: captured.length > 0,
      pisti,
      capturedCards: captured,
    };
    this.s.moves.push(move);
    this.s.lastPlayer = player;
    this.s.playedThisRound.push(player);

    this.emit({ type: 'play', player, card, state: this.getState() });
    this.pushLog(`${p.name}: ${card.name} oynadı.`, 'play');

    if (pisti) {
      this.pushLog(
        `★ PİŞTİ! ${p.name} pişti yaptı (+${PISTI_POINTS} puan).`,
        'pisti',
      );
    }
    if (captured.length > 0) {
      this.emit({ type: 'capture', player, cards: captured, pisti, state: this.getState() });
      this.pushLog(
        `${p.name} ${captured.length} kart aldı (${captured.map((c) => c.short).join(', ')}).`,
        'capture',
      );
    }

    // Sıra ilerlet
    const roundEnded = this.advanceTurn();
    if (roundEnded) {
      return {
        ok: true,
        move,
        roundEnded: true,
        ...(this.s.finished ? { gameEnded: true } : {}),
        summary: this.lastSummary ?? undefined,
      };
    }
    return { ok: true, move };
  }

  /**
   * Sırayı bir sonraki oyuncuya geçirir.
   * Gerekirse yeni el dağıtır veya turu bitirir.
   * @returns tur bitti mi
   */
  nextTurn(): PlayerId {
    const next = this.after(this.s.turn);
    this.s.turn = next;
    return next;
  }

  /** Sıra düzeni: 0 → 1 → 2 → 3 → 0 */
  private after(player: PlayerId): PlayerId {
    const idx = TURN_ORDER.indexOf(player);
    return TURN_ORDER[(idx + 1) % TURN_ORDER.length] ?? 0;
  }

  /**
   * Hamle sonrası akış: el bitti → yeni el / tur sonu.
   * @returns tur bitti mi
   */
  private advanceTurn(): boolean {
    // EL (hand) bitti mi? Her oyuncunun eli boşaldıysa el tamamlanmıştır.
    // (4'er kart dağıtıldığı için bir el = 16 hamle sürer; 4 hamle DEĞİL.)
    const handsEmpty = this.s.players.every((p) => p.hand.length === 0);

    if (handsEmpty) {
      // El bitti. Deste var mı?
      if (this.s.deck.length > 0) {
        this.s.playedThisRound = [];
        this.s.moves = [];
        this.dealCards();
        // Yeni eli SON KART ALAN oyuncu BAŞLATIR (gerçek pişti kuralı).
        // Kart alınmadıysa el, son oynayanın solundaki oyuncuyla devam eder.
        const starter =
          this.s.lastCapturer !== null ? this.s.lastCapturer : this.after(this.s.lastPlayer);
        this.s.turn = starter;
        this.pushLog(
          `Yeni el dağıtıldı. Destede ${this.s.deck.length} kart. Sıra: ${this.playerName(this.s.turn)}.`,
          'info',
        );
        this.emit({ type: 'turn', player: this.s.turn, state: this.getState() });
        return false;
      }
      // Deste bitti → son el kapanışı + tur sonu
      this.finishLastHand();
      this.endRound();
      return true;
    }

    this.nextTurn();
    this.emit({ type: 'turn', player: this.s.turn, state: this.getState() });
    return false;
  }

  /**
   * Son elde yerde kalan kartlar son kart alan oyuncuya verilir.
   */
  private finishLastHand(): void {
    const left = this.s.table.length;
    if (left === 0) return;
    const owner = resolveLastHand(this.s.lastCapturer, this.s.lastPlayer, this.s.table);
    if (owner < 0) return;
    const player = this.s.players[owner as PlayerId];
    if (!player) return;
    const cards = this.s.table.slice();
    this.s.capturedCards[player.id].push(...cards);
    player.stats.capturedCount = this.s.capturedCards[player.id].length;
    this.s.table = [];
    this.emit({ type: 'lastHand', player: player.id, cards, state: this.getState() });
    this.pushLog(
      `Son elde yerde kalan ${cards.length} kart ${player.name}'e verildi.`,
      'capture',
    );
  }

  // ────────────────────────────── TUR SONU ──────────────────────────────

  private lastSummary: RoundSummary | null = null;

  /**
   * Turu bitirir: puanları hesaplar, toplamlara ekler, gerekirse oyunu bitirir.
   */
  endRound(): RoundSummary {
    const input = {
      teams: TEAM_OF,
      capturedCards: this.s.capturedCards,
      pistiCount: this.s.pistiCount,
    };
    const out = calculateScores(input);

    // perPlayer isimlerini doldur
    const perPlayer = out.perPlayer.map((row) => ({
      ...row,
      name: this.playerName(row.player),
    }));

    // İstatistikleri güncelle
    for (const row of perPlayer) {
      const p = this.s.players[row.player];
      if (!p) continue;
      p.stats.capturedCount = row.capturedCount;
      p.stats.pistiCount = row.pistiCount;
      p.stats.rawPoints = row.rawPoints;
    }

    this.s.totals = {
      A: this.s.totals.A + out.totals.A,
      B: this.s.totals.B + out.totals.B,
    };

    const summary: RoundSummary = {
      round: this.s.roundNumber,
      perPlayer,
      teamPoints: out.totals,
      totals: this.s.totals,
      pistiPoints: out.pisti,
      majorityTeam: out.majorityTeam,
    };
    this.lastSummary = summary;

    this.pushLog(`— ${this.s.roundNumber}. tur bitti —`, 'round');
    this.pushLog(
      `Tur puanı → Takımımız (A): ${out.totals.A} | Rakipler (B): ${out.totals.B}`,
      'round',
    );
    if (out.majorityTeam) {
      this.pushLog(
        `Kart çoğunluğu bonusu (+${MAJORITY_BONUS}) → Takım ${out.majorityTeam}`,
        'round',
      );
    }
    this.emit({ type: 'roundEnd', summary, state: this.getState() });

    // Varsayılan oyun akışı: deste bitene kadar TEK el oynanır (gerçek pişti).
    // Çok turlu oyun istenirse `maxRounds` açıkça verilir.
    const maxRounds = this.opts.maxRounds ?? 1;
    const reachedLimit = this.s.roundNumber >= maxRounds;

    if (reachedLimit) {
      this.finishGame();
    } else {
      // Yeni tur: deste karıştırılıp yeniden dağıtılır
      this.startNextRound();
    }
    return summary;
  }

  /**
   * Yeni tur başlatır (deste yeniden karıştırılır, 4'er kart + masaya 4 kart).
   */
  startNextRound(): GameState {
    this.s.roundNumber += 1;
    this.s.table = [];
    this.s.moves = [];
    this.s.playedThisRound = [];
    this.s.lastCapturer = null;
    this.s.lastPlayer = 0;
    this.s.seenCards = [];
    this.s.capturedCards = { 0: [], 1: [], 2: [], 3: [] };
    this.s.pistiCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const p of this.s.players) {
      p.hand = [];
      p.stats = { capturedCount: 0, pistiCount: 0, rawPoints: 0 };
    }

    this.s.deck = shuffle(createDeck(), this.opts.rng);
    this.dealCards();
    this.dealTable();
    this.s.turn = 0;
    this.pushLog(`Yeni deste karıştırıldı. ${this.s.roundNumber}. tur başladı.`, 'round');
    this.emit({ type: 'roundStart', round: this.s.roundNumber, state: this.getState() });
    return this.getState();
  }

  /** Oyunu bitirir, kazananı belirler. */
  finishGame(): TeamId | null {
    this.s.finished = true;
    this.s.locked = true;
    const winner = determineWinner(this.s.totals);
    this.s.winner = winner;
    if (winner) {
      this.pushLog(
        `OYUN BİTTİ — Kazanan: Takım ${winner} (${this.teamLabel(winner)}) ${this.s.totals.A} - ${this.s.totals.B}`,
        'end',
      );
    } else {
      this.pushLog(
        `OYUN BİTTİ — Berabere! ${this.s.totals.A} - ${this.s.totals.B}`,
        'end',
      );
    }
    this.emit({ type: 'gameEnd', winner, totals: this.s.totals, state: this.getState() });
    return winner;
  }

  /** Oyunu tamamen sıfırlar (yeni oyun kurar ama başlatmaz). */
  resetGame(): GameState {
    this.lastSummary = null;
    this.s = this.createEmptyState();
    this.s.deck = shuffle(createDeck(), this.opts.rng);
    this.pushLog('Oyun sıfırlandı. Yeni oyun için "Başla"ya bas.', 'info');
    return this.getState();
  }

  // ──────────────────────────────── AI ────────────────────────────────

  /**
   * Sıradaki AI oyuncunun hamlesini hesaplar (state'i DEĞİŞTİRMEZ).
   * Karar `ai.ts`teki strateji fonksiyonlarından gelir.
   */
  decideAiMove(strategy: (view: AiView) => AiDecision): AiDecision | null {
    if (!this.s.started || this.s.finished || this.s.locked) return null;
    const player = this.s.players[this.s.turn];
    if (!player || player.kind !== 'ai') return null;
    if (player.hand.length === 0) return null;
    return strategy(this.aiView(player.id));
  }

  /** AI'ın görebildiği bilgi (gizli bilgi içermez — rakip elleri YOK) */
  aiView(player: PlayerId): AiView {
    const self = this.s.players[player];
    return {
      self: player,
      hand: self ? self.hand.slice() : [],
      table: this.s.table.slice(),
      top: topCard(this.s.table),
      deckLeft: this.s.deck.length,
      difficulty: self?.difficulty ?? 'normal',
      team: TEAM_OF[player],
      seenCards: this.s.seenCards.slice(),
      opponentHandSizes: this.s.players.map((p) => p.hand.length),
      totalCaptured: {
        A: this.teamCapturedCount('A'),
        B: this.teamCapturedCount('B'),
      },
      turn: this.s.turn,
    };
  }

  /** Takımın topladığı kart sayısı */
  teamCapturedCount(team: TeamId): number {
    let n = 0;
    for (const id of [0, 1, 2, 3] as PlayerId[]) {
      if (TEAM_OF[id] !== team) continue;
      n += this.s.capturedCards[id].length;
    }
    return n;
  }

  // ─────────────────────────────── GÖRÜNÜM ───────────────────────────────

  /** Salt-okunur durum kopyası (UI bunu kullanır) */
  getState(): GameState {
    return {
      started: this.s.started,
      finished: this.s.finished,
      round: {
        number: this.s.roundNumber,
        table: this.s.table.slice(),
        moves: this.s.moves.slice(),
        finished: this.s.finished,
      },
      players: this.s.players.map((p) => ({
        ...p,
        hand: p.hand.slice(),
        stats: { ...p.stats },
      })) as [Player, Player, Player, Player],
      deck: this.s.deck.slice(),
      turn: this.s.turn,
      playedThisRound: this.s.playedThisRound.slice(),
      log: this.s.log.slice(),
      locked: this.s.locked,
      winner: this.s.winner,
    };
  }

  /** UI için ek bilgiler (tur sonu özeti, skorlar) */
  getExtras(): {
    totals: TeamScores;
    summary: RoundSummary | null;
    captured: Record<PlayerId, Card[]>;
    lastMove: MoveRecord | null;
    lastCapture: MoveRecord | null;
    /** Oyun boyunca oyuncu bazında toplanan kart sayısı (tur sıfırlamasından etkilenmez) */
    totalCaptured: Record<PlayerId, number>;
  } {
    const lastMove = this.s.moves.length > 0 ? this.s.moves[this.s.moves.length - 1] ?? null : null;
    const captures = this.s.moves.filter((m) => m.captured);
    const lastCapture = captures.length > 0 ? captures[captures.length - 1] ?? null : null;
    return {
      totals: { ...this.s.totals },
      summary: this.lastSummary,
      captured: {
        0: this.s.capturedCards[0].slice(),
        1: this.s.capturedCards[1].slice(),
        2: this.s.capturedCards[2].slice(),
        3: this.s.capturedCards[3].slice(),
      },
      lastMove,
      lastCapture,
      totalCaptured: {
        0: this.s.players[0]?.stats.capturedCount ?? 0,
        1: this.s.players[1]?.stats.capturedCount ?? 0,
        2: this.s.players[2]?.stats.capturedCount ?? 0,
        3: this.s.players[3]?.stats.capturedCount ?? 0,
      },
    };
  }

  /** Kilit durumunu ayarla (animasyon sırasında girdi engeli) */
  setLocked(locked: boolean): void {
    this.s.locked = locked;
  }

  isLocked(): boolean {
    return this.s.locked;
  }

  /** Şu anki oyuncu AI mı? */
  isAiTurn(): boolean {
    const p = this.s.players[this.s.turn];
    return this.s.started && !this.s.finished && !!p && p.kind === 'ai';
  }

  /** Sırası kimde */
  currentTurn(): PlayerId {
    return this.s.turn;
  }

  /** Oyuncunun elindeki kartlardan oynanabilir olanlar (Pişti'de hepsi oynanabilir) */
  playableCards(player: PlayerId): Card[] {
    const p = this.s.players[player];
    if (!p || this.s.turn !== player) return [];
    return p.hand.slice();
  }

  /** Bir kart oynanabilir mi (sıra + elde olma) */
  canPlay(player: PlayerId, card: Card): boolean {
    if (!this.s.started || this.s.finished || this.s.locked) return false;
    if (this.s.turn !== player) return false;
    const p = this.s.players[player];
    if (!p) return false;
    return hasCard(p.hand, card);
  }

  /** Oyuncu adı */
  playerName(id: PlayerId): string {
    return this.s.players[id]?.name ?? `Oyuncu ${id}`;
  }

  /** Takım etiketi */
  teamLabel(team: TeamId): string {
    return team === 'A' ? 'Bizim Takım' : 'Rakipler';
  }

  // ─────────────────────────────── GÜNLÜK ───────────────────────────────

  private pushLog(text: string, kind: LogEntry['kind']): void {
    this.s.seq += 1;
    this.s.log.push({ seq: this.s.seq, text, kind });
    if (this.s.log.length > 300) this.s.log.shift();
  }

  private emit(ev: EngineEvent): void {
    this.opts.onEvent?.(ev);
  }
}

/** AI'ın gördüğü bilgi görünümü (gizli bilgi yok) */
export interface AiView {
  self: PlayerId;
  hand: Card[];
  table: Card[];
  top: Card | null;
  deckLeft: number;
  difficulty: Difficulty;
  team: TeamId;
  /** Oyunda görülmüş (oynanmış/açılmış) kartlar */
  seenCards: Card[];
  opponentHandSizes: number[];
  /** Takım bazında toplanan kart sayısı */
  totalCaptured: Record<TeamId, number>;
  turn: PlayerId;
}

/** Kısayol: hazır kurulmuş motor */
export function createEngine(opts: EngineOptions = {}): PistiEngine {
  const engine = new PistiEngine(opts);
  engine.createGame();
  return engine;
}

/** Vale kontrolü re-export (UI kolaylığı) */
export { isVale, canCapture };
