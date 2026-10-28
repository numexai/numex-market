/**
 * Pişti puanlama — gerçek pişti puan sistemi.
 * Saf fonksiyonlar; motor tarafından tur sonunda çağrılır.
 *
 * Puan tablosu:
 *   - Karo 10 (Düğü)  → 3 puan
 *   - Sinek 2 (Çift sinek / "Sinek ikili") → 2 puan
 *   - Her As          → 1 puan
 *   - Her Vale (J)    → 1 puan
 *   - Pişti           → 10 puan (her pişti ayrı)
 *   - Kart çoğunluğu  → en çok kart toplayan TAKIM'a +3 puan
 */
import type { Card, PlayerId, RoundSummary, TeamId, TeamScores } from './types';
import { PISTI_POINTS } from './rules';

/** Puan sabitleri */
export const POINTS = {
  KARO_10: 3,
  SINEK_2: 2,
  AS: 1,
  VALE: 1,
} as const;

/** Kart çoğunluğu bonusu (en çok kart toplayan takım) */
export const MAJORITY_BONUS = 3;

/** Tek bir kartın ham puanı (pişti hariç) */
export function cardPoints(card: Card): number {
  if (card.suit === 'karo' && card.rank === 10) return POINTS.KARO_10;
  if (card.suit === 'sinek' && card.rank === 2) return POINTS.SINEK_2;
  if (card.rank === 1) return POINTS.AS;
  if (card.rank === 11) return POINTS.VALE;
  return 0;
}

/**
 * Bir kart listesinin toplam ham puanı (pişti hariç, çoğunluk hariç).
 */
export function cardsPoints(cards: readonly Card[]): number {
  return cards.reduce((sum, c) => sum + cardPoints(c), 0);
}

/** Bir kartta puan var mı (görsel işaretleme için) */
export function isPointCard(card: Card): boolean {
  return cardPoints(card) > 0;
}

/**
 * Oyuncuların topladığı kartlardan oyuncu bazında ham puan.
 */
export function playerRawPoints(capturedCards: readonly Card[]): number {
  return cardsPoints(capturedCards);
}

/**
 * Takım puanlarını hesaplar:
 *  - oyuncuların ham puanı takımına yazılır
 *  - pişti puanı takımına yazılır
 *  - kart çoğunluğu bonusu: iki takımdan çok kart toplayana +3
 *    (EŞİTLİKTE BONUS VERİLMEZ)
 */
export interface ScoreInput {
  teams: Record<PlayerId, TeamId>;
  capturedCards: Record<PlayerId, readonly Card[]>;
  pistiCount: Record<PlayerId, number>;
}

export interface ScoreOutput {
  /** Takım başına ham kart puanı */
  raw: TeamScores;
  /** Takım başına pişti puanı */
  pisti: TeamScores;
  /** Kart çoğunluğu bonusu alan takım (yoksa null) */
  majorityTeam: TeamId | null;
  /** Bonus puanı (0 veya MAJORITY_BONUS) */
  majorityPoints: number;
  /** Toplam tur puanı */
  totals: TeamScores;
  /** Oyuncu bazında detay */
  perPlayer: RoundSummary['perPlayer'];
}

export function calculateScores(input: ScoreInput): ScoreOutput {
  const raw: TeamScores = { A: 0, B: 0 };
  const pisti: TeamScores = { A: 0, B: 0 };
  const capturedTotal: Record<TeamId, number> = { A: 0, B: 0 };
  const perPlayer: RoundSummary['perPlayer'] = [];

  const ids: PlayerId[] = [0, 1, 2, 3];
  for (const id of ids) {
    const team = input.teams[id];
    const cards = input.capturedCards[id] ?? [];
    const p = playerRawPoints(cards);
    raw[team] += p;
    pisti[team] += (input.pistiCount[id] ?? 0) * PISTI_POINTS;
    capturedTotal[team] += cards.length;
    perPlayer.push({
      player: id,
      name: '',
      capturedCount: cards.length,
      pistiCount: input.pistiCount[id] ?? 0,
      rawPoints: p,
    });
  }

  let majorityTeam: TeamId | null = null;
  let majorityPoints = 0;
  if (capturedTotal.A > capturedTotal.B) {
    majorityTeam = 'A';
    majorityPoints = MAJORITY_BONUS;
  } else if (capturedTotal.B > capturedTotal.A) {
    majorityTeam = 'B';
    majorityPoints = MAJORITY_BONUS;
  }

  const totals: TeamScores = {
    A: raw.A + pisti.A + (majorityTeam === 'A' ? majorityPoints : 0),
    B: raw.B + pisti.B + (majorityTeam === 'B' ? majorityPoints : 0),
  };

  return { raw, pisti, majorityTeam, majorityPoints, totals, perPlayer };
}

/**
 * Oyun sonu kazananı — yüksek puan kazanır, eşitlikte berabere (null).
 * @returns kazanan takım veya null (berabere)
 */
export function determineWinner(totals: TeamScores): TeamId | null {
  if (totals.A > totals.B) return 'A';
  if (totals.B > totals.A) return 'B';
  return null;
}

/**
 * Tur sonu puanlarını toplam skora ekler.
 */
export function addTotals(current: TeamScores, add: TeamScores): TeamScores {
  return { A: current.A + add.A, B: current.B + add.B };
}

/**
 * Oyun sonu raporu için insan-okur metin.
 */
export function scoreBreakdownText(out: ScoreOutput): string {
  const mb = out.majorityTeam === null
    ? 'Çoğunluk bonusu: eşitlik (verilmedi)'
    : `Çoğunluk bonusu: Takım ${out.majorityTeam} (+${out.majorityPoints})`;
  return [
    `Kart puanı  → A: ${out.raw.A} | B: ${out.raw.B}`,
    `Pişti puanı → A: ${out.pisti.A} | B: ${out.pisti.B}`,
    mb,
    `TUR TOPLAMI → A: ${out.totals.A} | B: ${out.totals.B}`,
  ].join('\n');
}
