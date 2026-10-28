/**
 * Puanlama testleri — karo 10 (3), sinek 2 (2), as (1), vale (1),
 * pişti (10), kart çoğunluğu bonusu (+3) ve çift puan verilmemesi.
 */
import { describe, expect, it } from 'vitest';
import { makeCard } from '../src/engine/deck';
import {
  MAJORITY_BONUS,
  POINTS,
  calculateScores,
  cardPoints,
  cardsPoints,
  determineWinner,
  isPointCard,
  scoreBreakdownText,
} from '../src/engine/scoring';
import { PISTI_POINTS } from '../src/engine/rules';
import type { Card, PlayerId, TeamId } from '../src/engine/types';

const KARO_10 = makeCard('karo', 10);
const SINEK_2 = makeCard('sinek', 2);
const KUPA_AS = makeCard('kupa', 1);
const MACA_VALE = makeCard('maca', 11);
const DUMDUZ_5 = makeCard('sinek', 5);

describe('Kart puanı', () => {
  it('karo 10 = 3 puan', () => {
    expect(cardPoints(KARO_10)).toBe(3);
    expect(POINTS.KARO_10).toBe(3);
  });

  it('sinek 2 = 2 puan', () => {
    expect(cardPoints(SINEK_2)).toBe(2);
    expect(POINTS.SINEK_2).toBe(2);
  });

  it('her as = 1 puan (4 as ayrı ayrı)', () => {
    for (const suit of ['kupa', 'karo', 'sinek', 'maca'] as const) {
      expect(cardPoints(makeCard(suit, 1))).toBe(1);
    }
    expect(POINTS.AS).toBe(1);
  });

  it('her vale = 1 puan (4 vale ayrı ayrı)', () => {
    for (const suit of ['kupa', 'karo', 'sinek', 'maca'] as const) {
      expect(cardPoints(makeCard(suit, 11))).toBe(1);
    }
    expect(POINTS.VALE).toBe(1);
  });

  it('puanlı olmayan kartlar 0 puan', () => {
    expect(cardPoints(DUMDUZ_5)).toBe(0);
    expect(cardPoints(makeCard('karo', 9))).toBe(0);
    expect(cardPoints(makeCard('sinek', 3))).toBe(0);
  });

  it('karo 10 ile sinek 2 karıştırılmaz (farklı suit/rank)', () => {
    expect(cardPoints(makeCard('sinek', 10))).toBe(0); // sinek on puan değil
    expect(cardPoints(makeCard('karo', 2))).toBe(0); // karo ikili puan değil
  });

  it('isPointCard doğru işaretler', () => {
    expect(isPointCard(KARO_10)).toBe(true);
    expect(isPointCard(SINEK_2)).toBe(true);
    expect(isPointCard(KUPA_AS)).toBe(true);
    expect(isPointCard(MACA_VALE)).toBe(true);
    expect(isPointCard(DUMDUZ_5)).toBe(false);
  });

  it('kart listesi toplam puanı', () => {
    expect(cardsPoints([KARO_10, SINEK_2, KUPA_AS, MACA_VALE, DUMDUZ_5])).toBe(3 + 2 + 1 + 1 + 0);
    expect(cardsPoints([])).toBe(0);
  });

  it('tam destenin toplam puanı: 3 + 2 + 4×1 + 4×1 = 13', () => {
    const deck: Card[] = [];
    for (const suit of ['kupa', 'karo', 'sinek', 'maca'] as const) {
      for (let r = 1; r <= 13; r++) {
        deck.push(makeCard(suit, r as Card['rank']));
      }
    }
    expect(cardsPoints(deck)).toBe(13);
  });
});

describe('Takım puanı hesaplama', () => {
  const teams: Record<PlayerId, TeamId> = { 0: 'A', 1: 'B', 2: 'A', 3: 'B' };

  it('oyuncu kart puanları takımına yazılır', () => {
    const out = calculateScores({
      teams,
      capturedCards: {
        0: [KARO_10, KUPA_AS], // 4 puan → A
        1: [SINEK_2], // 2 puan → B
        2: [MACA_VALE], // 1 puan → A
        3: [DUMDUZ_5], // 0 → B
      },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    expect(out.raw.A).toBe(5);
    expect(out.raw.B).toBe(2);
  });

  it('pişti puanı 10 ve takımına yazılır', () => {
    expect(PISTI_POINTS).toBe(10);
    const out = calculateScores({
      teams,
      capturedCards: { 0: [], 1: [], 2: [], 3: [] },
      pistiCount: { 0: 1, 1: 0, 2: 1, 3: 0 },
    });
    expect(out.pisti.A).toBe(20); // iki pişti (0 ve 2)
    expect(out.pisti.B).toBe(0);
  });

  it('çift pişti ayrı ayrı sayılır (10×n)', () => {
    const out = calculateScores({
      teams,
      capturedCards: { 0: [], 1: [], 2: [], 3: [] },
      pistiCount: { 0: 3, 1: 0, 2: 0, 3: 0 },
    });
    expect(out.pisti.A).toBe(30);
  });

  it('kart çoğunluğu bonusu en çok kart toplayan takıma gider (+3)', () => {
    const out = calculateScores({
      teams,
      capturedCards: {
        0: [makeCard('sinek', 3), makeCard('sinek', 4), makeCard('sinek', 5)], // A: 3
        2: [makeCard('maca', 3), makeCard('maca', 4)], // A: 2 → A toplam 5
        1: [makeCard('kupa', 7), makeCard('kupa', 8)], // B: 2
        3: [makeCard('karo', 7)], // B: 1 → B toplam 3
      },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    expect(out.majorityTeam).toBe('A');
    expect(out.majorityPoints).toBe(MAJORITY_BONUS);
    expect(out.totals.A).toBe(MAJORITY_BONUS); // puanlı kart yok, sadece bonus
    expect(out.totals.B).toBe(0);
  });

  it('kart sayısı EŞİTSE bonus verilmez (çift puan yok)', () => {
    const out = calculateScores({
      teams,
      capturedCards: {
        0: [makeCard('sinek', 3), makeCard('sinek', 4)], // A: 2
        2: [makeCard('maca', 3)], // A: 3
        1: [makeCard('kupa', 7), makeCard('kupa', 8)], // B: 2
        3: [makeCard('karo', 7)], // B: 3
      },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    expect(out.majorityTeam).toBeNull();
    expect(out.majorityPoints).toBe(0);
    expect(out.totals.A).toBe(0);
    expect(out.totals.B).toBe(0);
  });

  it('sıfır kart varsa bonus verilmez (0-0 eşitlik)', () => {
    const out = calculateScores({
      teams,
      capturedCards: { 0: [], 1: [], 2: [], 3: [] },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    expect(out.majorityTeam).toBeNull();
    expect(out.totals).toEqual({ A: 0, B: 0 });
  });

  it('pişti + kart puanı + bonus birlikte doğru toplanır', () => {
    const out = calculateScores({
      teams,
      capturedCards: {
        0: [KARO_10, KUPA_AS], // 4 → A
        2: [makeCard('sinek', 6), makeCard('sinek', 7), makeCard('sinek', 8)], // 0 → A
        1: [SINEK_2], // 2 → B
        3: [], // 0 → B
      },
      pistiCount: { 0: 1, 1: 0, 2: 0, 3: 0 }, // A +10
    });
    // A: raw 4, pisti 10, çoğunluk (5 kart > 1 kart) +3 = 17
    expect(out.totals.A).toBe(4 + 10 + MAJORITY_BONUS);
    expect(out.totals.B).toBe(2);
  });

  it('perPlayer detayı doğru doldurulur', () => {
    const out = calculateScores({
      teams,
      capturedCards: { 0: [KARO_10], 1: [SINEK_2], 2: [KUPA_AS], 3: [] },
      pistiCount: { 0: 0, 1: 1, 2: 0, 3: 0 },
    });
    const p0 = out.perPlayer.find((r) => r.player === 0);
    const p1 = out.perPlayer.find((r) => r.player === 1);
    expect(p0?.capturedCount).toBe(1);
    expect(p0?.rawPoints).toBe(3);
    expect(p1?.pistiCount).toBe(1);
    expect(p1?.rawPoints).toBe(2);
    expect(out.perPlayer).toHaveLength(4);
  });

  it('kazanan belirleme: yüksek puan, eşitlikte berabere', () => {
    expect(determineWinner({ A: 20, B: 10 })).toBe('A');
    expect(determineWinner({ A: 5, B: 30 })).toBe('B');
    expect(determineWinner({ A: 15, B: 15 })).toBeNull();
  });

  it('puan dökümü insan-okur metin üretir', () => {
    const out = calculateScores({
      teams,
      capturedCards: { 0: [KARO_10], 1: [], 2: [], 3: [] },
      pistiCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    const text = scoreBreakdownText(out);
    expect(text).toContain('Kart puanı');
    expect(text).toContain('Pişti puanı');
    expect(text).toContain('TUR TOPLAMI');
  });
});
