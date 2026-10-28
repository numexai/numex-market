/**
 * Pişti kuralları — saf (pure) fonksiyonlar.
 * Motor (engine.ts) bu fonksiyonları çağırır; UI hiçbirini doğrudan çağırmaz.
 *
 * Temel kural ayrımı:
 *  - KART ALMA (capture): atılan kart, yerdeki ÜST kartla AYNI DEĞERDE ise
 *    (veya atılan kart Vale ise) yerdeki TÜM kartlar alınır.
 *  - PİŞTİ (pisti): yerde TEK kart varken, o kartın üzerine AYNI DEĞERDE kart
 *    atılırsa +10 bonus. Vale ile yapılan tek-kart alma PİŞTİ SAYILMAZ
 *    (vale ile alınan tek kartlık masa pisti değildir).
 */
import type { Card } from './types';

/** Vale — her zaman kart alan özel kart */
export const VALE_RANK = 11;

/** Pişti bonus puanı */
export const PISTI_POINTS = 10;

/** Kartın vale olup olmadığı */
export function isVale(card: Card): boolean {
  return card.rank === VALE_RANK;
}

/** İki kartın aynı değerde olup olmadığı (renk fark etmez) */
export function sameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank;
}

/**
 * Yerdeki kartların ÜST kartı (en son oynanan). Masa boşsa null.
 */
export function topCard(table: readonly Card[]): Card | null {
  if (table.length === 0) return null;
  const top = table[table.length - 1];
  return top ?? null;
}

/**
 * Bu hamlede kart alınır mı?
 * @param played   oynanan kart
 * @param table    hamleden ÖNCEKİ masa
 */
export function canCapture(played: Card, table: readonly Card[]): boolean {
  const top = topCard(table);
  if (top === null) return false; // boş masadan kart alınmaz
  if (isVale(played)) return true; // vale her zaman alır
  return sameRank(played, top);
}

/**
 * Bu hamle pişti mi?
 * Kural: yerde TEK kart varken aynı değerde kart atılırsa pişti.
 * Vale ile yapılan pişti GEÇERSİZ (ele alınan tek kart vale ile alınmışsa pişti sayılmaz).
 */
export function detectPisti(played: Card, table: readonly Card[]): boolean {
  if (table.length !== 1) return false;
  if (isVale(played)) return false; // vale ile pişti olmaz
  const top = topCard(table);
  if (top === null) return false;
  return sameRank(played, top);
}

/**
 * Hamlenin sonucunu hesaplar: alınan kartlar ve pişti durumu.
 * @returns captured = alınan kartlar (boşsa alma yok), pisti = pişti mi
 */
export function resolveCapture(
  played: Card,
  table: readonly Card[],
): { captured: Card[]; pisti: boolean } {
  const pisti = detectPisti(played, table);
  if (!canCapture(played, table)) {
    return { captured: [], pisti: false };
  }
  // Alınan: yerdeki tüm kartlar + oynanan kart
  return { captured: [...table, played], pisti };
}

/**
 * Oynanan kart, oyuncunun elinde geçerli mi? (sıra kontrolü motorda yapılır)
 */
export function isPlayable(card: Card, hand: readonly Card[]): boolean {
  return hand.some((c) => c.id === card.id);
}

/**
 * Son elde (deste + eller bittiğinde) masada kalan kartlar
 * en son kart alan oyuncuya verilir; hiç kimse almadıysa
 * son kartı oynayan oyuncuya verilir.
 * @param lastCapturer son kart alan oyuncu
 * @param lastPlayer   son hamleyi yapan oyuncu
 * @param tableLeft    son elde yerde kalan kartlar
 */
export function resolveLastHand(
  lastCapturer: number | null,
  lastPlayer: number,
  tableLeft: readonly Card[],
): number {
  if (tableLeft.length === 0) return -1;
  return lastCapturer !== null ? lastCapturer : lastPlayer;
}
