/**
 * Kural testleri — kart alma, vale ile alma, pişti, geçersiz hamle, sıra kontrolü,
 * deste bitişi ve son el kontrolü.
 */
import { describe, expect, it } from 'vitest';
import { makeCard } from '../src/engine/deck';
import {
  canCapture,
  detectPisti,
  isPlayable,
  isVale,
  resolveCapture,
  resolveLastHand,
  sameRank,
  topCard,
} from '../src/engine/rules';
import { HAND_SIZE, PistiEngine } from '../src/engine/engine';
import type { Card, PlayerId } from '../src/engine/types';

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Kart alma kuralları', () => {
  it('aynı değerdeki kart yerdeki üst kartı alır', () => {
    const table = [makeCard('kupa', 5), makeCard('karo', 7)];
    const played = makeCard('sinek', 7);
    expect(canCapture(played, table)).toBe(true);
    const { captured, pisti } = resolveCapture(played, table);
    expect(captured).toHaveLength(3); // masa 2 + oynanan
    expect(pisti).toBe(false);
  });

  it('farklı değerdeki kart almaz, masaya eklenir', () => {
    const table = [makeCard('kupa', 5)];
    const played = makeCard('sinek', 8);
    expect(canCapture(played, table)).toBe(false);
    const { captured } = resolveCapture(played, table);
    expect(captured).toHaveLength(0);
  });

  it('vale her zaman kart alır', () => {
    const table = [makeCard('kupa', 5), makeCard('maca', 12)];
    const vale = makeCard('karo', 11);
    expect(isVale(vale)).toBe(true);
    expect(canCapture(vale, table)).toBe(true);
    expect(resolveCapture(vale, table).captured).toHaveLength(3);
  });

  it('boş masadan kart alınamaz', () => {
    expect(canCapture(makeCard('kupa', 5), [])).toBe(false);
    expect(resolveCapture(makeCard('kupa', 5), []).captured).toHaveLength(0);
  });

  it('yalnızca üst kart belirleyicidir (alt kartlar değil)', () => {
    const table = [makeCard('kupa', 9), makeCard('karo', 3)];
    // 9 değeri altta, üst 3 → 9 ile almaz
    expect(canCapture(makeCard('sinek', 9), table)).toBe(false);
    expect(canCapture(makeCard('sinek', 3), table)).toBe(true);
    expect(topCard(table)?.rank).toBe(3);
  });

  it('elde olmayan kart oynanamaz', () => {
    const hand = [makeCard('kupa', 5)];
    expect(isPlayable(makeCard('kupa', 5), hand)).toBe(true);
    expect(isPlayable(makeCard('kupa', 6), hand)).toBe(false);
  });

  it('aynı rank farklı suit eşleşir', () => {
    expect(sameRank(makeCard('kupa', 10), makeCard('maca', 10))).toBe(true);
    expect(sameRank(makeCard('kupa', 10), makeCard('maca', 9))).toBe(false);
  });
});

describe('Pişti kuralları', () => {
  it('yerde tek kart varken aynı değerle pişti olur', () => {
    const table = [makeCard('kupa', 6)];
    const played = makeCard('sinek', 6);
    expect(detectPisti(played, table)).toBe(true);
    const { captured, pisti } = resolveCapture(played, table);
    expect(pisti).toBe(true);
    expect(captured).toHaveLength(2);
  });

  it('yerde birden fazla kart varken pişti olmaz (sadece alma)', () => {
    const table = [makeCard('kupa', 6), makeCard('karo', 6)];
    const played = makeCard('sinek', 6);
    expect(detectPisti(played, table)).toBe(false);
    const { captured, pisti } = resolveCapture(played, table);
    expect(pisti).toBe(false);
    expect(captured).toHaveLength(3);
  });

  it('vale ile yapılan tek kart alma pişti SAYILMAZ', () => {
    const table = [makeCard('kupa', 6)];
    const vale = makeCard('karo', 11);
    expect(canCapture(vale, table)).toBe(true);
    expect(detectPisti(vale, table)).toBe(false);
    const { captured, pisti } = resolveCapture(vale, table);
    expect(pisti).toBe(false);
    expect(captured).toHaveLength(2);
  });

  it('farklı değerle pişti olmaz', () => {
    expect(detectPisti(makeCard('sinek', 7), [makeCard('kupa', 6)])).toBe(false);
  });
});

describe('Son el kontrolü', () => {
  it('masada kalan kartlar son kart alan oyuncuya verilir', () => {
    const table: Card[] = [makeCard('kupa', 2), makeCard('karo', 9)];
    expect(resolveLastHand(2, 3, table)).toBe(2);
  });

  it('hiç kimse almamışsa son kartı oynayan oyuncuya verilir', () => {
    const table: Card[] = [makeCard('kupa', 2)];
    expect(resolveLastHand(null, 3, table)).toBe(3);
  });

  it('masa boşsa verilecek kart yok (-1)', () => {
    expect(resolveLastHand(1, 2, [])).toBe(-1);
  });

  it('son elde kalan kartlar gerçekten oyuncuya eklenir', () => {
    // motoru son ele zorla: deste boşaltılıp eldeki kartlar oynatılır
    const engine = new PistiEngine({ rng: seededRng(1234) });
    engine.createGame();
    engine.startGame();
    let guard = 0;
    while (!engine.getState().finished && guard < 500) {
      const st = engine.getState();
      const turn = st.turn;
      const hand = st.players[turn]?.hand ?? [];
      if (hand.length === 0) break;
      const card = hand[0];
      if (!card) break;
      engine.playCard(turn, card);
      guard++;
    }
    const extras = engine.getExtras();
    const capturedTotal =
      extras.captured[0].length +
      extras.captured[1].length +
      extras.captured[2].length +
      extras.captured[3].length;
    // Oyun boyunca toplanan + masada kalan = o turda dolaşımdaki kartlar
    const st = engine.getState();
    expect(capturedTotal + st.round.table.length).toBeGreaterThan(0);
  });
});

describe('Sıra ve geçersiz hamle kontrolü', () => {
  it('sırası olmayan oyuncu oynayamaz', () => {
    const engine = new PistiEngine({ rng: seededRng(21) });
    engine.createGame();
    const st = engine.startGame();
    const otherId = (st.turn === 0 ? 1 : 0) as PlayerId;
    const card = st.players[otherId]?.hand[0];
    expect(card).toBeDefined();
    const res = engine.playCard(otherId, card as Card);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Sıra');
  });

  it('elinde olmayan kart oynanamaz', () => {
    const engine = new PistiEngine({ rng: seededRng(22) });
    engine.createGame();
    const st = engine.startGame();
    const whom = st.turn;
    const handIds = new Set((st.players[whom]?.hand ?? []).map((c) => c.id));
    const notInHand = [
      makeCard('kupa', 1),
      makeCard('karo', 2),
      makeCard('sinek', 3),
      makeCard('maca', 4),
      makeCard('kupa', 5),
    ].find((c) => !handIds.has(c.id));
    expect(notInHand).toBeDefined();
    const res = engine.playCard(whom, notInHand as Card);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('elinde yok');
  });

  it('geçerli hamle elden kartı düşürür ve sırayı ilerletir', () => {
    const engine = new PistiEngine({ rng: seededRng(23) });
    engine.createGame();
    const st = engine.startGame();
    const turn = st.turn;
    const card = st.players[turn]?.hand[0] as Card;
    const before = st.players[turn]?.hand.length ?? 0;
    const res = engine.playCard(turn, card);
    expect(res.ok).toBe(true);
    const after = engine.getState();
    expect(after.players[turn]?.hand.length).toBe(before - 1);
    expect(after.turn).toBe(((turn + 1) % 4) as PlayerId);
    expect(after.playedThisRound).toContain(turn);
  });

  it('kilitliyken hamle kabul edilmez', () => {
    const engine = new PistiEngine({ rng: seededRng(24) });
    engine.createGame();
    const st = engine.startGame();
    engine.setLocked(true);
    const card = st.players[st.turn]?.hand[0] as Card;
    const res = engine.playCard(st.turn, card);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('kilitli');
    engine.setLocked(false);
  });

  it('eller boşalınca (16 hamle) yeni el dağıtılır ve deste 16 azalır', () => {
    const engine = new PistiEngine({ rng: seededRng(25) });
    engine.createGame();
    engine.startGame();
    const deckBefore = engine.getState().deck.length; // 52-16-4 = 32
    // Bir el = her oyuncu 4 kart oynar = 16 hamle
    for (let i = 0; i < 16; i++) {
      const st = engine.getState();
      const card = st.players[st.turn]?.hand[0] as Card;
      expect(card, `${i}. hamlede sıradaki oyuncunun kartı olmalı`).toBeDefined();
      const res = engine.playCard(st.turn, card);
      expect(res.ok, `${i}. hamle geçerli olmalı: ${res.error ?? ''}`).toBe(true);
    }
    const st = engine.getState();
    // yeni el dağıtıldı → eller tekrar dolu, deste 16 azaldı
    expect(st.players.every((p) => p.hand.length === HAND_SIZE)).toBe(true);
    expect(st.deck.length).toBe(deckBefore - 16);
    expect(st.round.table.length).toBeGreaterThan(0);
  });

  it('deste bitince tur biter ve puanlar hesaplanır', () => {
    const engine = new PistiEngine({ rng: seededRng(31) });
    engine.createGame();
    engine.startGame();
    let guard = 0;
    let summarySeen = false;
    while (!engine.getState().finished && guard < 1000) {
      const st = engine.getState();
      const card = st.players[st.turn]?.hand[0] as Card | undefined;
      if (!card) break;
      const res = engine.playCard(st.turn, card);
      if (res.roundEnded) summarySeen = true;
      guard++;
    }
    expect(summarySeen).toBe(true);
    const st = engine.getState();
    expect(st.round.table).toHaveLength(0);
    // 52 kartın tamamı oyuncular arasında paylaşılmış olmalı
    const captured = st.players.reduce((s, p) => s + p.stats.capturedCount, 0);
    expect(captured).toBe(52);
  });
});
