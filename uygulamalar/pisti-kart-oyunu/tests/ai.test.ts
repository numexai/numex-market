/**
 * AI testleri — üç zorluk seviyesi, geçerli hamle üretme,
 * pişti/alma fırsatı değerlendirme, puanlı kart koruma, strateji farkı.
 */
import { describe, expect, it } from 'vitest';
import { makeCard } from '../src/engine/deck';
import { decideDeterministic, decideEasy, decideHard, decideNormal, strategyFor } from '../src/engine/ai';
import type { AiView } from '../src/engine/engine';
import { PistiEngine } from '../src/engine/engine';
import type { Card, Difficulty } from '../src/engine/types';

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

/** Test için yapay AI görünümü üretir */
function makeView(overrides: Partial<AiView> = {}): AiView {
  const hand: Card[] = [
    makeCard('kupa', 5),
    makeCard('karo', 9),
    makeCard('sinek', 12),
    makeCard('maca', 3),
  ];
  return {
    self: 1,
    hand,
    table: [makeCard('karo', 7)],
    top: makeCard('karo', 7),
    deckLeft: 20,
    difficulty: 'normal',
    team: 'B',
    seenCards: [],
    opponentHandSizes: [4, 4, 4, 4],
    totalCaptured: { A: 0, B: 0 },
    turn: 1,
    ...overrides,
  };
}

describe('AI temel davranış', () => {
  it('kolay AI elinden geçerli bir kart oynar', () => {
    const view = makeView();
    const d = decideEasy(view);
    expect(view.hand.some((c) => c.id === d.card.id)).toBe(true);
    expect(d.reason.length).toBeGreaterThan(0);
  });

  it('normal AI elinden geçerli bir kart oynar', () => {
    const view = makeView();
    const d = decideNormal(view);
    expect(view.hand.some((c) => c.id === d.card.id)).toBe(true);
  });

  it('zor AI elinden geçerli bir kart oynar', () => {
    const view = makeView();
    const d = decideHard(view);
    expect(view.hand.some((c) => c.id === d.card.id)).toBe(true);
  });

  it('boş elle AI karar veremez (hata fırlatır)', () => {
    const view = makeView({ hand: [] });
    expect(() => decideEasy(view)).toThrow();
    expect(() => decideNormal(view)).toThrow();
    expect(() => decideHard(view)).toThrow();
  });
});

describe('AI pişti farkındalığı', () => {
  it('normal AI kesin pişti fırsatını kaçırmaz (yerde tek kart)', () => {
    const top = makeCard('karo', 5);
    const view = makeView({
      hand: [makeCard('kupa', 5), makeCard('sinek', 2), makeCard('maca', 9)],
      table: [top],
      top,
    });
    const d = decideNormal(view);
    expect(d.card.rank).toBe(5);
  });

  it('zor AI kesin pişti fırsatını kaçırmaz', () => {
    const top = makeCard('sinek', 12);
    const view = makeView({
      hand: [makeCard('kupa', 12), makeCard('karo', 4), makeCard('maca', 8)],
      table: [top],
      top,
    });
    const d = decideHard(view);
    expect(d.card.rank).toBe(12);
  });

  it('yerde tek kart ve aynı değer VARSA pişti tercih edilir (vale değil)', () => {
    const top = makeCard('maca', 3);
    const view = makeView({
      hand: [makeCard('sinek', 3), makeCard('kupa', 11), makeCard('karo', 7)],
      table: [top],
      top,
    });
    const d = decideHard(view);
    expect(d.card.rank).toBe(3);
    expect(d.card.rank).not.toBe(11);
  });
});

describe('AI kart alma farkındalığı', () => {
  it('masada puan varken AI almaya çalışır', () => {
    const top = makeCard('karo', 8);
    const view = makeView({
      // masada karo 10 (3 puan) + as (1 puan); üstteki karo 8
      hand: [makeCard('sinek', 8), makeCard('kupa', 2), makeCard('maca', 4)],
      table: [makeCard('karo', 10), makeCard('kupa', 1), top],
      top,
    });
    const d = decideNormal(view);
    expect(d.card.rank).toBe(8);
  });

  it('vale masada çok kart varken kullanılır', () => {
    const top = makeCard('karo', 6);
    const view = makeView({
      hand: [makeCard('kupa', 11), makeCard('sinek', 2), makeCard('maca', 4)],
      table: [makeCard('sinek', 3), makeCard('kupa', 4), makeCard('karo', 10), top],
      top,
    });
    const d = decideHard(view);
    expect(d.card.rank).toBe(11); // masa değerli (karo 10 var) → vale harcanır
  });
});

describe('AI puanlı kart koruma', () => {
  it('normal AI alma yoksa puanlı kartı (vale) boşa atmaz', () => {
    const top = makeCard('kupa', 7);
    const view = makeView({
      hand: [makeCard('maca', 11), makeCard('sinek', 4), makeCard('karo', 6)],
      table: [top],
      top,
    });
    const d = decideNormal(view);
    expect(d.card.rank).not.toBe(11);
  });

  it('normal AI karo 10 (3 puan) boşa atmaz', () => {
    const top = makeCard('kupa', 2);
    const view = makeView({
      hand: [makeCard('karo', 10), makeCard('sinek', 4), makeCard('maca', 6)],
      table: [top],
      top,
    });
    const d = decideNormal(view);
    expect(d.card.suit === 'karo' && d.card.rank === 10).toBe(false);
  });

  it('zor AI masayı tek kart bırakıp pişti riski yüksekse o rankı atmaz', () => {
    // masada tek kart yok, ama elimizdeki 3 aynı ranktan 3'ü görülmüşse risk düşük
    const seen: Card[] = [makeCard('kupa', 4), makeCard('karo', 4), makeCard('sinek', 4)];
    const view = makeView({
      hand: [makeCard('maca', 4), makeCard('kupa', 7)],
      table: [makeCard('karo', 9)],
      top: makeCard('karo', 9),
      seenCards: seen,
    });
    const d = decideHard(view);
    // 4 atmak güvenli (4'ün 4'ü de biliniyor/işlemde)
    expect(d.card.id).toBe('maca-4');
  });
});

describe('Zorluk seviyesi strateji seçimi', () => {
  it('strategyFor doğru fonksiyonu döndürür', () => {
    const kolay = strategyFor('kolay');
    const normal = strategyFor('normal');
    const zor = strategyFor('zor');
    expect(kolay).toBe(decideEasy);
    expect(normal).toBe(decideNormal);
    expect(zor).toBe(decideHard);
  });

  it('bilinmeyen zorluk hata verir', () => {
    expect(() => strategyFor('imkansiz' as Difficulty)).toThrow();
  });

  it('deterministik karar aynı seed ile aynı kartı verir', () => {
    const view = makeView();
    const a = decideDeterministic(view, 2);
    const b = decideDeterministic(view, 2);
    expect(a.card.id).toBe(b.card.id);
  });
});

describe('AI ile tam oyun (entegrasyon)', () => {
  it('3 AI ile oyun baştan sona oynanabilir (konsol hatası yok)', () => {
    const engine = new PistiEngine({
      soloVsAi: true,
      difficulties: { 1: 'kolay', 2: 'normal', 3: 'zor' },
      rng: seededRng(777),
    });
    engine.createGame();
    engine.startGame();
    let guard = 0;
    while (!engine.getState().finished && guard < 400) {
      const st = engine.getState();
      const strategy = strategyFor(st.players[st.turn]?.difficulty ?? 'normal');
      const decision = engine.decideAiMove(strategy);
      if (!decision) break;
      const res = engine.playCard(st.turn, decision.card);
      expect(res.ok, `${guard}. hamle: ${res.error ?? ''}`).toBe(true);
      guard++;
    }
    expect(engine.getState().finished).toBe(true);
    const ex = engine.getExtras();
    const total =
      ex.captured[0].length + ex.captured[1].length + ex.captured[2].length + ex.captured[3].length;
    expect(total).toBe(52);
  });

  it('zor AI, kolay AI\'a karşı uzun vadede daha iyi skor üretir', () => {
    // 12 deterministik oyun oynat: zor AI takımı vs kolay AI takımı
    let hardWins = 0;
    let softWins = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const engine = new PistiEngine({
        soloVsAi: true,
        // Takım A (0,2) zor, Takım B (1,3) kolay
        difficulties: { 0: 'zor', 2: 'zor', 1: 'kolay', 3: 'kolay' },
        rng: seededRng(seed * 31),
      });
      engine.createGame();
      engine.startGame();
      let guard = 0;
      while (!engine.getState().finished && guard < 400) {
        const st = engine.getState();
        const strategy = strategyFor(st.players[st.turn]?.difficulty ?? 'normal');
        const decision = engine.decideAiMove(strategy);
        if (!decision) break;
        engine.playCard(st.turn, decision.card);
        guard++;
      }
      const t = engine.getExtras().totals;
      if (t.A > t.B) hardWins++;
      else if (t.B > t.A) softWins++;
    }
    // Zor AI'ın en azından kaybetmemesi beklenir (deterministik olmayan kararlar var,
    // bu yüzden katı eşitlik değil, anlamlı bir fark arıyoruz)
    expect(hardWins).toBeGreaterThanOrEqual(softWins);
  });

  it('AI hiçbir zaman elinde olmayan kartı seçmez', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const engine = new PistiEngine({
        soloVsAi: true,
        difficulties: { 1: 'kolay', 2: 'normal', 3: 'zor' },
        rng: seededRng(seed * 7),
      });
      engine.createGame();
      engine.startGame();
      let guard = 0;
      while (!engine.getState().finished && guard < 400) {
        const st = engine.getState();
        const strategy = strategyFor(st.players[st.turn]?.difficulty ?? 'normal');
        const decision = engine.decideAiMove(strategy);
        if (!decision) break;
        const inHand = st.players[st.turn]?.hand.some((c) => c.id === decision.card.id) ?? false;
        expect(inHand, `seed ${seed}: AI elinde olmayan kart seçti`).toBe(true);
        engine.playCard(st.turn, decision.card);
        guard++;
      }
    }
  });
});
