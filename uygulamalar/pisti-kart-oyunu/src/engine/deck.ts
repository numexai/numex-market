/**
 * Deste (deck) modülü — 52 kartlık standart iskambil destesi.
 * Kartlar benzersizdir; aynı suit+rank kombinasyonu iki kez üretilmez.
 */
import type { Card, Rank, Suit } from './types';

/** Geçerli suit'ler */
export const SUITS: readonly Suit[] = ['kupa', 'karo', 'sinek', 'maca'] as const;

/** Geçerli rank'ler: As(1) .. Papaz(13) */
export const RANKS: readonly Rank[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;

/** Suit'lerin Türkçe görünen adları */
export const SUIT_LABELS: Record<Suit, string> = {
  kupa: 'Kupa',
  karo: 'Karo',
  sinek: 'Sinek',
  maca: 'Maça',
};

/** Suit sembolleri (görsel) */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  kupa: '♥',
  karo: '♦',
  sinek: '♣',
  maca: '♠',
};

/** Kırmızı suit'ler */
export const RED_SUITS: readonly Suit[] = ['kupa', 'karo'] as const;

/** Rank'lerin kısa gösterimi */
export const RANK_SHORTS: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

/** Rank'lerin Türkçe uzun adı */
export const RANK_LABELS: Record<Rank, string> = {
  1: 'As',
  2: 'İkili',
  3: 'Üçlü',
  4: 'Dörtlü',
  5: 'Beşli',
  6: 'Altılı',
  7: 'Yedili',
  8: 'Sekizli',
  9: 'Dokuzlu',
  10: 'Onlu',
  11: 'Vale',
  12: 'Kız',
  13: 'Papaz',
};

/** Kart kimliği üret: "kupa-1" */
export function cardId(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`;
}

/** Kart nesnesi üret */
export function makeCard(suit: Suit, rank: Rank): Card {
  return {
    id: cardId(suit, rank),
    suit,
    rank,
    name: `${SUIT_LABELS[suit]} ${RANK_LABELS[rank]}`,
    short: RANK_SHORTS[rank],
  };
}

/**
 * 52 kartlık tam deste üretir.
 * Sıralama deterministiktir (kupa A..K, karo A..K, sinek A..K, maça A..K).
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(suit, rank));
    }
  }
  return deck;
}

/** Karta göre deterministik hash (aynı girdi → aynı sayı) */
export function cardSeed(card: Card): number {
  let h = 2166136261;
  const s = card.id;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Fisher–Yates karıştırma.
 * @param deck karıştırılacak deste (mutasyona uğratılmaz)
 * @param rng 0..1 arası üreten rastgelelik kaynağı (test için deterministik verilebilir)
 */
export function shuffle(deck: readonly Card[], rng: () => number = Math.random): Card[] {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** Destede toplam kart sayısı */
export const DECK_SIZE = SUITS.length * RANKS.length; // 52

/** Kartın kırmızı olup olmadığı */
export function isRed(card: Card): boolean {
  return RED_SUITS.includes(card.suit);
}

/** Dizide kart var mı (id ile) */
export function hasCard(cards: readonly Card[], card: Card): boolean {
  return cards.some((c) => c.id === card.id);
}

/** Kartları id'ye göre sıralı dizi döndür (deterministik gösterim) */
export function sortById(cards: readonly Card[]): Card[] {
  return cards.slice().sort((a, b) => a.id.localeCompare(b.id, 'tr'));
}
