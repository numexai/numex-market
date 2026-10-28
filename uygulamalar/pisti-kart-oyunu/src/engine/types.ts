/**
 * Pişti — çekirdek tip tanımları.
 * Motor (engine) ve UI bu tipler üzerinden konuşur; UI asla state'i doğrudan bozmaz.
 */

/** Kart rengi (suit) */
export type Suit = 'kupa' | 'karo' | 'sinek' | 'maca';

/** Kart değeri (rank) — 1 = As, 11 = Vale, 12 = Kız, 13 = Papaz */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** Tek bir oyun kartı — benzersiz kimliği vardır (ör. "kupa-1") */
export interface Card {
  /** Benzersiz kimlik: `${suit}-${rank}` */
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
  /** Kartın Türkçe görünen adı (ör. "Kupa As") */
  readonly name: string;
  /** Kartın kısaltılmış sembolü (ör. "A", "10", "J", "Q", "K") */
  readonly short: string;
}

/** Oyuncu kimliği (0..3) */
export type PlayerId = 0 | 1 | 2 | 3;

/** Takım kimliği */
export type TeamId = 'A' | 'B';

/** Oyuncu tipi: insan mı, AI mı */
export type PlayerKind = 'human' | 'ai';

/** AI zorluk seviyesi */
export type Difficulty = 'kolay' | 'normal' | 'zor';

/** Bir oyuncunun oyun boyunca biriken istatistikleri */
export interface PlayerStats {
  /** Toplanan toplam kart sayısı */
  capturedCount: number;
  /** Yapılan pişti sayısı */
  pistiCount: number;
  /** Toplanan kartların ham puanı (el içi puanlama, bkz. scoring.ts) */
  rawPoints: number;
}

/** Oyuncu durumu */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly team: TeamId;
  readonly kind: PlayerKind;
  difficulty: Difficulty;
  /** Eldeki kartlar */
  hand: Card[];
  stats: PlayerStats;
}

/** Masaya oynanmış tek bir hamle kaydı */
export interface MoveRecord {
  player: PlayerId;
  card: Card;
  /** Bu hamle kart aldı mı? */
  captured: boolean;
  /** Bu hamle pişti mi? */
  pisti: boolean;
  /** Alınan kartlar (capture varsa) */
  capturedCards: Card[];
}

/** Tur (round) durumu */
export interface RoundState {
  /** Tur numarası (1 tabanlı) */
  number: number;
  /** Yerdeki kartlar (üstteki = son eleman) */
  table: Card[];
  /** Turdaki hamleler sırayla */
  moves: MoveRecord[];
  /** Tur bitti mi */
  finished: boolean;
}

/** Oyunun genel durumu (tek doğruluk kaynağı — motor yönetir) */
export interface GameState {
  /** Oyun başlatıldı mı */
  started: boolean;
  /** Oyun bitti mi */
  finished: boolean;
  /** Mevcut tur */
  round: RoundState;
  /** Oyuncular (sıra: 0 = insan, 1 = partner, 2 = rakip1, 3 = rakip2) */
  players: [Player, Player, Player, Player];
  /** Destede kalan kartlar */
  deck: Card[];
  /** Sırası kimde */
  turn: PlayerId;
  /** Tur içinde kimler kart oynadı (aynı turda 4 oyuncu birer kez oynar) */
  playedThisRound: PlayerId[];
  /** Oyun günlüğü (en yeni sonda) */
  log: LogEntry[];
  /** Kilitli mi (animasyon sürerken girdi engeli) */
  locked: boolean;
  /** Kazanan takım (oyun bittiğinde) */
  winner: TeamId | null;
}

/** Günlük kaydı */
export interface LogEntry {
  /** Sıra numarası (monoton artan) */
  seq: number;
  text: string;
  /** Görsel vurgu türü */
  kind: 'info' | 'play' | 'capture' | 'pisti' | 'round' | 'end';
}

/** Takım skorları */
export interface TeamScores {
  A: number;
  B: number;
}

/** Tur sonu özeti */
export interface RoundSummary {
  round: number;
  /** Oyuncu bazında tur sonu bilgileri */
  perPlayer: {
    player: PlayerId;
    name: string;
    capturedCount: number;
    pistiCount: number;
    rawPoints: number;
  }[];
  /** Takım bazında tur puanı */
  teamPoints: TeamScores;
  /** Toplam skorlar (tur sonunda) */
  totals: TeamScores;
  /** Pişti'den gelen puanlar takım bazında */
  pistiPoints: TeamScores;
  /** Kart çoğunluğu bonusu verilen takım (yoksa null) */
  majorityTeam: TeamId | null;
}

/** AI hamle kararı — AI doğrudan state'i değiştirmez, sadece karar verir */
export interface AiDecision {
  card: Card;
  /** Karar gerekçesi (günlük/debug için) */
  reason: string;
}

/** Oyuncu aksiyonunun sonucu */
export interface PlayResult {
  ok: boolean;
  error?: string;
  move?: MoveRecord;
  /** Bu hamleyle tur bitti mi */
  roundEnded?: boolean;
  /** Bu hamleyle oyun bitti mi */
  gameEnded?: boolean;
  /** Tur sonu özeti (roundEnded ise) */
  summary?: RoundSummary;
}
