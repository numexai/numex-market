/**
 * Pişti yapay zekâsı — üç zorluk seviyesi.
 *
 * AI, motorun `AiView`'i (yalnızca kendi eli + açık masa + görülmüş kartlar)
 * üzerinden karar verir. Rakip elleri GÖRÜNMEZ (hile yok).
 *
 * kolay  : rastgele geçerli kart oynar (ara sıra ucuz puanlıyı korur).
 * normal : kart alma fırsatını değerlendirir, pişti arar, puanlı kartları korur.
 * zor    : normal + oynanan kartları takip eder, karşı takımın elini tahmin eder,
 *          pişti riskini hesaplar (rakibe pişti verme), vale'yi stratejik kullanır.
 */
import { cardPoints, isPointCard } from './scoring';
import { isVale, sameRank } from './rules';
import type { AiView } from './engine';
import type { AiDecision, Card, PlayerId } from './types';

/** Bir kartın AI için "tehlike" değeri (yüksek = vermek istemez) */
function keepValue(card: Card, view: AiView): number {
  let v = cardPoints(card) * 3; // puanlı kart değerli
  if (isVale(card)) v += 6; // vale hem alır hem 1 puan
  if (card.suit === 'karo' && card.rank === 10) v += 4;
  if (card.suit === 'sinek' && card.rank === 2) v += 3;
  if (view.top && sameRank(card, view.top)) v -= 5; // hemen alabilen kart iyidir
  return v;
}

/** Rastgele seçim (deterministik değil, oyun akışı için yeterli) */
function randomOf<T>(arr: readonly T[]): T | null {
  if (arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] ?? null;
}

/** Kartın puan değeri (pişti potansiyeli) */
function potentialPoints(card: Card): number {
  let p = cardPoints(card);
  if (isVale(card)) p += 1;
  return p;
}

// ─────────────────────────────── KOLAY ───────────────────────────────

export function decideEasy(view: AiView): AiDecision {
  const hand = view.hand;
  if (hand.length === 0) throw new Error('AI elinde kart yok');
  // Rastgele geçerli kart. Küçük bir iyilik: %25 pişti fırsatı varsa değerlendir.
  const pistiCards = hand.filter(
    (c) => view.table.length === 1 && view.top !== null && sameRank(c, view.top) && !isVale(c),
  );
  if (pistiCards.length > 0 && Math.random() < 0.25) {
    const card = pistiCards[0];
    if (card !== undefined) return { card, reason: 'Şansına pişti gördü' };
  }
  const pick = randomOf(hand);
  if (!pick) throw new Error('AI kart seçemedi');
  return { card: pick, reason: 'Rastgele oynadı' };
}

// ─────────────────────────────── NORMAL ───────────────────────────────

export function decideNormal(view: AiView): AiDecision {
  const hand = view.hand;
  if (hand.length === 0) throw new Error('AI elinde kart yok');

  // 1) Pişti fırsatı (yerde tek kart + aynı değer + vale değil)
  const pistiCards = hand.filter(
    (c) => view.table.length === 1 && view.top !== null && sameRank(c, view.top) && !isVale(c),
  );
  const pisti = pistiCards[0];
  if (pisti) {
    return { card: pisti, reason: 'Pişti fırsatı yakaladı (+10)' };
  }

  // 2) Alma fırsatı: en çok puanı ALACAĞIMIZ hamle
  const tablePoints = view.table.reduce((s, c) => s + potentialPoints(c), 0);
  const topNormal = view.top;
  if (topNormal) {
    const captureCards = hand.filter((c) => sameRank(c, topNormal) || isVale(c));
    if (captureCards.length > 0 && view.table.length > 0) {
      // En az değerli kartı harcayarak almaya çalış
      const sorted = captureCards
        .slice()
        .sort((a, b) => keepValue(a, view) - keepValue(b, view));
      // Masada puan varsa veya masa kalabalıksa mutlaka al
      if (tablePoints > 0 || view.table.length >= 2) {
        const card = sorted[0];
        if (card) {
          return {
            card,
            reason: `Masadaki ${view.table.length} kartı (${tablePoints} puan) aldı`,
          };
        }
      } else if (view.deckLeft < 12) {
        // Oyun sonuna yaklaşıyoruz, kartları topla
        const card = sorted[0];
        if (card) return { card, reason: 'Deste azaldı, kartları topluyor' };
      }
    }
  }

  // 3) Alma yoksa: en değersiz kartı at, rakibe hediye verme
  // Vale'yi masaya boşa atma (puanlı kart), puanlı kartları da tut.
  const safe = hand.filter((c) => !isVale(c) && cardPoints(c) === 0);
  const pool = safe.length > 0 ? safe : hand;
  const sorted = pool.slice().sort((a, b) => keepValue(a, view) - keepValue(b, view));
  const card = sorted[0];
  if (!card) throw new Error('AI kart seçemedi');
  return { card, reason: 'Değersiz kartı attı (elini korudu)' };
}

// ─────────────────────────────── ZOR ───────────────────────────────

export function decideHard(view: AiView): AiDecision {
  const hand = view.hand;
  if (hand.length === 0) throw new Error('AI elinde kart yok');
  const top = view.top;

  // ── Görülen kartlardan rakip eli tahmini ──
  // Hiç görülmemiş (destede/rakipte olabilecek) kartların rank dağılımı.
  const seenByRank = new Map<number, number>();
  for (const c of view.seenCards) {
    seenByRank.set(c.rank, (seenByRank.get(c.rank) ?? 0) + 1);
  }
  // Bir rank için toplam 4 kart vardır; görülmeyenler rakipte olabilir.
  const unseenOf = (rank: number): number => 4 - (seenByRank.get(rank) ?? 0);
  // Rakip takımın topladığı kartlar da biliniyor (açık alan), ama basitçe görülmüş say.
  // Not: captured kartlar seenCards'a dahil edilmediyse yanlış olur; motor dahil ediyor.

  // ── 1) Pişti fırsatı ──
  const pistiCards = hand.filter(
    (c) => view.table.length === 1 && top !== null && sameRank(c, top) && !isVale(c),
  );
  // Pişti için yerdeki kartın aynısından kaç adet görülmemiş → riskli mi?
  const pistiCard = pistiCards[0];
  if (pistiCard) {
    // Masada tek kart = kesin pişti, kaçırma
    return { card: pistiCard, reason: 'Kesin pişti — kaçırılmaz (+10)' };
  }

  // ── 2) Alma fırsatı: puan getirisi / kart maliyeti analizi ──
  if (top && view.table.length > 0) {
    const tablePoints = view.table.reduce((s, c) => s + potentialPoints(c), 0);
    const captureCards = hand.filter((c) => sameRank(c, top) || isVale(c));
    if (captureCards.length > 0) {
      // En düşük "keepValue"lu kartla al
      const sorted = captureCards
        .slice()
        .sort((a, b) => keepValue(a, view) - keepValue(b, view));
      const best = sorted[0];
      if (best) {
        // Vale'yi ancak masa yeterince değerliyse harca
        if (isVale(best)) {
          const worthIt = tablePoints >= 2 || view.table.length >= 3 || view.deckLeft < 10;
          const alt = sorted.find((c) => !isVale(c));
          if (!worthIt && alt) {
            return { card: alt, reason: 'Vale harcamaya değmez, normal kartla aldı' };
          }
          return { card: best, reason: `Vale ile ${view.table.length} kartı topladı` };
        }
        // Normal kartla alma: masa boş/tek puansız ise ve kimse almıyorsa gereksiz olabilir
        if (view.table.length === 1 && tablePoints === 0 && view.deckLeft > 20) {
          // Tek puansız kart için alma; ama aynı rank kartını elde tutmak da ölü karttır
          // Yine de pişti riskine karşı almak makul → al
          return { card: best, reason: 'Tek kartı aldı (elini temizledi)' };
        }
        return {
          card: best,
          reason: `${view.table.length} kartı (${tablePoints} puan) aldı`,
        };
      }
    }
  }

  // ── 3) Alma yok: en güvenli atış ──
  // Rakibe pişti verme riski: masada tek kart varsa ve o rank'tan bizde de varsa
  // o kartı atmak masayı 2 kart yapar, rakip aynı rankla ALIR ama pişti OLMAZ.
  // Asıl risk: masayı TEK kartta bırakmak (bizim attığımız kart tek kalırsa ve
  // o rank'tan elimizde/rakipte çok varsa rakip pişti yapar).
  const scored = hand.map((card) => {
    let score = keepValue(card, view);
    // Masayı tek kart bırakıp o rank'tan çok kart kaldıysa riskli
    const unseen = unseenOf(card.rank);
    if (unseen >= 3) score += 6; // aynı rank'tan 3 kart daha dışarıda → pişti riski
    else if (unseen === 2) score += 2;
    // Zaten masada aynı rank varsa atmak masayı kalabalıklaştırır (iyi: rakip alırsa çok kart gider)
    if (top && sameRank(card, top)) score -= 4;
    // Rakip takım çok kart topladıysa agresif ol: puanlı kartları da at (masayı kirlet)
    if (view.totalCaptured.B > view.totalCaptured.A + 10) score -= 2;
    // Puanlı kartları sona sakla
    if (isPointCard(card)) score += 5;
    return { card, score };
  });

  scored.sort((a, b) => a.score - b.score);
  const chosen = scored[0]?.card;
  if (!chosen) throw new Error('AI kart seçemedi');
  return {
    card: chosen,
    reason: `En güvenli atış (pişti riskini hesapladı, görülmüş kart takibi)`,
  };
}

/** Zorluk seviyesine göre strateji fonksiyonu */
export function strategyFor(difficulty: AiView['difficulty']): (view: AiView) => AiDecision {
  switch (difficulty) {
    case 'kolay':
      return decideEasy;
    case 'normal':
      return decideNormal;
    case 'zor':
      return decideHard;
    default: {
      const never: never = difficulty;
      throw new Error(`Bilinmeyen zorluk: ${String(never)}`);
    }
  }
}

/**
 * Deterministik AI seçimi (testler için): verilen rng ile sabit karar.
 */
export function decideDeterministic(view: AiView, seed: number): AiDecision {
  const hand = view.hand;
  if (hand.length === 0) throw new Error('AI elinde kart yok');
  const idx = seed % hand.length;
  const card = hand[idx];
  if (!card) throw new Error('AI kart seçemedi');
  return { card, reason: 'Deterministik test seçimi' };
}

/** Rakip oyuncunun kimliği (partner/rakip ayrımı) */
export function isOpponent(me: PlayerId, other: PlayerId): boolean {
  const myTeam = me % 2 === 0 ? 'A' : 'B';
  const otherTeam = other % 2 === 0 ? 'A' : 'B';
  return myTeam !== otherTeam;
}
