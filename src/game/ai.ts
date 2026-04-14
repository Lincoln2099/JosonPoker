import { Card, shuffleArray } from './Card';
import { evalHand, cmpEval } from './evaluate';

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
  if (hand.some((c) => c.isJoker) && round < 3) {
    let bi: [number, number] | null = null;
    let be = null;
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i].isJoker || hand[j].isJoker) continue;
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

function aiPickConservative(hand: Card[], cc: Card, round: number): [number, number] {
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

function aiPickRandom(hand: Card[]): [number, number] {
  const indices: number[] = [];
  for (let i = 0; i < hand.length; i++) indices.push(i);
  shuffleArray(indices);
  return [indices[0], indices[1]].sort((a, b) => a - b) as [number, number];
}

function aiPickCalculated(hand: Card[], cc: Card, round: number): [number, number] {
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
): [number, number] {
  switch (style) {
    case '激进':
      return aiPickAggressive(hand, cc!, round);
    case '保守':
      return aiPickConservative(hand, cc!, round);
    case '随机':
      return aiPickRandom(hand);
    case '计算':
      return aiPickCalculated(hand, cc!, round);
    case '反向':
      return aiPickReverse(hand, cc!, round);
    case '简单':
      return aiPickSimple(hand);
    default:
      return aiPickSteady(hand, cc!);
  }
}
