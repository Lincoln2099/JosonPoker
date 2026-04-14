import { Card, shuffleArray } from './Card';
import { evalHand, cmpEval, estimateWinRate } from './evaluate';

function aiPickSteady(hand: Card[], cc: Card): [number, number] {
  let bi: [number, number] | null = null;
  let be = null;
  for (let i = 0; i < hand.length; i++)
    for (let j = i + 1; j < hand.length; j++) {
      const e = evalHand([hand[i], hand[j], cc]);
      if (!be || cmpEval(e, be) > 0) {
        be = e;
        bi = [i, j];
      }
    }
  return bi!;
}

function aiPickAggressive(hand: Card[], cc: Card, round: number): [number, number] {
  if (round < 3 && hand.some((c) => c.isJoker || c.rankValue === 14)) {
    let bi: [number, number] | null = null;
    let be = null;
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i].isJoker || hand[j].isJoker || hand[i].rankValue === 14 || hand[j].rankValue === 14) continue;
        const e = evalHand([hand[i], hand[j], cc]);
        if (!be || cmpEval(e, be) > 0) {
          be = e;
          bi = [i, j];
        }
      }
    if (bi) return bi;
  }
  return aiPickSteady(hand, cc);
}

function aiPickConservative(
  hand: Card[], cc: Card, round: number,
  allCommunity?: Card[], np?: number, playerScore?: number, loserRank?: number,
): [number, number] {
  const playerCount = np ?? 4;
  const isInDanger =
    playerScore !== undefined && loserRank !== undefined && loserRank > 1 && playerScore < 0;

  if (isInDanger && allCommunity && round >= 2) {
    let bestIdx: [number, number] | null = null;
    let bestRank = Infinity;
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++) {
        const rank = estimateWinRate(hand, [i, j], cc, allCommunity, playerCount, 30);
        if (rank < bestRank) {
          bestRank = rank;
          bestIdx = [i, j];
        }
      }
    if (bestIdx) return bestIdx;
  }

  if (round >= 3) return aiPickSteady(hand, cc);
  const pairs: { idx: [number, number]; ev: ReturnType<typeof evalHand> }[] = [];
  for (let i = 0; i < hand.length; i++)
    for (let j = i + 1; j < hand.length; j++) {
      if (hand[i].isJoker || hand[j].isJoker) continue;
      pairs.push({ idx: [i, j], ev: evalHand([hand[i], hand[j], cc]) });
    }
  if (!pairs.length) return aiPickSteady(hand, cc);
  pairs.sort((a, b) => cmpEval(a.ev, b.ev));
  const mid = Math.floor(pairs.length / 2);
  return pairs[mid].idx;
}

function aiPickRandom(hand: Card[], cc?: Card): [number, number] {
  if (cc && Math.random() < 0.1) {
    return aiPickSteady(hand, cc);
  }
  const indices: number[] = [];
  for (let i = 0; i < hand.length; i++) indices.push(i);
  shuffleArray(indices);
  return [indices[0], indices[1]].sort((a, b) => a - b) as [number, number];
}

function aiPickCalculated(
  hand: Card[], cc: Card, round: number,
  allCommunity?: Card[], np?: number,
): [number, number] {
  const playerCount = np ?? 4;

  if (allCommunity && allCommunity.length > 0) {
    let bestIdx: [number, number] | null = null;
    let bestRank = Infinity;
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++) {
        const rank = estimateWinRate(hand, [i, j], cc, allCommunity, playerCount, 50);
        if (rank < bestRank) {
          bestRank = rank;
          bestIdx = [i, j];
        }
      }
    if (bestIdx) return bestIdx;
  }

  if (round < 2) {
    let bi: [number, number] | null = null;
    let be = null;
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++) {
        const e = evalHand([hand[i], hand[j], cc]);
        if (!be || cmpEval(e, be) < 0) {
          be = e;
          bi = [i, j];
        }
      }
    return bi!;
  }
  return aiPickSteady(hand, cc);
}

function aiPickReverse(hand: Card[], cc: Card, round: number): [number, number] {
  if (round >= 3) return aiPickSteady(hand, cc);
  let bi: [number, number] | null = null;
  let be = null;
  for (let i = 0; i < hand.length; i++)
    for (let j = i + 1; j < hand.length; j++) {
      const e = evalHand([hand[i], hand[j], cc]);
      if (!be || cmpEval(e, be) < 0) {
        be = e;
        bi = [i, j];
      }
    }
  return bi!;
}

function aiPickSimple(hand: Card[]): [number, number] {
  const indexed = hand.map((c, i) => ({ i, v: c.isJoker ? 15 : c.rankValue }));
  indexed.sort((a, b) => b.v - a.v);
  return [indexed[0].i, indexed[1].i].sort((a, b) => a - b) as [number, number];
}

export function aiPick(
  hand: Card[],
  cc: Card | null,
  style: string,
  round: number,
  allCommunity?: Card[],
  np?: number,
  playerScore?: number,
  loserRank?: number,
): [number, number] {
  switch (style) {
    case '激进':
      return aiPickAggressive(hand, cc!, round);
    case '保守':
      return aiPickConservative(hand, cc!, round, allCommunity, np, playerScore, loserRank);
    case '随机':
      return aiPickRandom(hand, cc ?? undefined);
    case '计算':
      return aiPickCalculated(hand, cc!, round, allCommunity, np);
    case '反向':
      return aiPickReverse(hand, cc!, round);
    case '简单':
      return aiPickSimple(hand);
    default:
      return aiPickSteady(hand, cc!);
  }
}
