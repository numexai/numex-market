/**
 * Deste testleri — 52 kart, benzersizlik, tüm kombinasyonlar, dağıtım korunumu.
 */
import { describe, expect, it } from 'vitest';
import {
  DECK_SIZE,
  RANKS,
  SUITS,
  createDeck,
  makeCard,
  shuffle,
  sortById,
  SUIT_SYMBOLS,
  RANK_SHORTS,
} from '../src/engine/deck';
import { HAND_SIZE, PistiEngine } from '../src/engine/engine';

/** Deterministik rng üreteci (mulberry32) */
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

describe('Deste', () => {
  it('tam olarak 52 kart üretir', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(deck).toHaveLength(DECK_SIZE);
  });

  it('tüm kartlar benzersizdir (aynı kart iki kez yok)', () => {
    const deck = createDeck();
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });

  it('tüm suit × rank kombinasyonları vardır', () => {
    const deck = createDeck();
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const found = deck.find((c) => c.suit === suit && c.rank === rank);
        expect(found, `${suit} ${rank} bulunamadı`).toBeDefined();
      }
    }
    expect(deck).toHaveLength(SUITS.length * RANKS.length);
  });

  it('kart kimliği suit-rank formatındadır ve tektir', () => {
    const card = makeCard('kupa', 1);
    expect(card.id).toBe('kupa-1');
    expect(card.name).toBe('Kupa As');
    expect(card.short).toBe('A');
    expect(SUIT_SYMBOLS.kupa).toBe('♥');
    expect(RANK_SHORTS[13]).toBe('K');
  });

  it('karıştırma kart kaybetmez ve aynı rng ile deterministiktir', () => {
    const deck = createDeck();
    const a = shuffle(deck, seededRng(42));
    const b = shuffle(deck, seededRng(42));
    expect(a).toHaveLength(52);
    expect(new Set(a.map((c) => c.id)).size).toBe(52);
    // aynı rng → aynı sıra
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    // orijinal deste mutasyona uğramaz (aynı sıra korunur)
    expect(deck.map((c) => c.id)).toEqual(createDeck().map((c) => c.id));
    // id'ye göre sıralama 52 kartı korur ve tekrar üretilebilir
    expect(sortById(a).map((c) => c.id)).toEqual(sortById(a).map((c) => c.id));
    expect(sortById(a)).toHaveLength(52);
  });

  it('dağıtım sonrası toplam kart sayısı 52 kalır (elde + masa + deste)', () => {
    const engine = new PistiEngine({ rng: seededRng(7) });
    engine.createGame();
    const state = engine.startGame();
    const handTotal = state.players.reduce((s, p) => s + p.hand.length, 0);
    const total = handTotal + state.round.table.length + state.deck.length;
    expect(handTotal).toBe(4 * HAND_SIZE);
    expect(state.round.table).toHaveLength(4);
    expect(total).toBe(52);
  });

  it('her oyuncuya başlangıçta 4 kart dağıtılır', () => {
    const engine = new PistiEngine({ rng: seededRng(11) });
    engine.createGame();
    const state = engine.startGame();
    for (const p of state.players) {
      expect(p.hand, `${p.name} eli`).toHaveLength(HAND_SIZE);
      expect(new Set(p.hand.map((c) => c.id)).size).toBe(HAND_SIZE);
    }
    expect(state.deck).toHaveLength(52 - 16 - 4);
  });
});

describe('Deterministik motor kurulumu', () => {
  it('createGame 52 kartlık deste kurar, startGame dağıtım yapar', () => {
    const engine = new PistiEngine({ rng: seededRng(3) });
    const beforeStart = engine.createGame();
    expect(beforeStart.started).toBe(false);
    expect(beforeStart.deck).toHaveLength(52);
    const afterStart = engine.startGame();
    expect(afterStart.started).toBe(true);
    expect(afterStart.deck.length).toBeLessThan(52);
  });

  it('oyuncu 0 insan, diğerleri AI (varsayılan)', () => {
    const engine = new PistiEngine({ rng: seededRng(5) });
    engine.createGame();
    const state = engine.startGame();
    const kinds = state.players.map((p) => p.kind);
    expect(kinds[0]).toBe('human');
    expect(kinds.slice(1)).toEqual(['ai', 'ai', 'ai']);
  });

  it('solo modda 4 oyuncu da AI olur', () => {
    const engine = new PistiEngine({ soloVsAi: true, rng: seededRng(5) });
    engine.createGame();
    const state = engine.startGame();
    expect(state.players.every((p) => p.kind === 'ai')).toBe(true);
  });

  it('takım eşleşmesi (0,2) vs (1,3)', () => {
    const engine = new PistiEngine({ rng: seededRng(9) });
    engine.createGame();
    const state = engine.startGame();
    expect(state.players[0].team).toBe('A');
    expect(state.players[2].team).toBe('A');
    expect(state.players[1].team).toBe('B');
    expect(state.players[3].team).toBe('B');
  });
});
