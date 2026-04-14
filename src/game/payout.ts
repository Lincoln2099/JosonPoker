import type { Card } from './Card';
import { cmpEval } from './evaluate';
import type { EvalResult } from './evaluate';

export interface RoundResult {
  pi: number;
  ev: EvalResult;
  played: Card[];
  combo: Card[];
  rank: number;
  delta: number;
}

export function calcWeights(np: number, loserRank: number): (number | null)[] {
  const weights: (number | null)[] = [];
  for (let rank = 1; rank <= np; rank++) {
    if (rank === loserRank) weights.push(null);
    else weights.push(np - rank + 1);
  }
  return weights;
}

export function distributeEvenly(total: number, count: number): number[] {
  const base = Math.trunc(total / count);
  let rem = total - base * count;
  const arr = new Array(count).fill(base) as number[];
  for (let i = 0; i < Math.abs(rem); i++) arr[i] += rem > 0 ? 1 : -1;
  return arr;
}

export function calcPayouts(
  results: RoundResult[],
  np: number,
  loserRank: number,
  mult: number,
  ante: number,
): void {
  const weights = calcWeights(np, loserRank);
  const wTotal = weights.reduce<number>((s, w) => s + (w ?? 0), 0);
  const sorted = [...results].sort((a, b) => cmpEval(b.ev, a.ev));

  const groups: RoundResult[][] = [];
  let idx = 0;
  while (idx < sorted.length) {
    const group: RoundResult[] = [sorted[idx]];
    while (idx + 1 < sorted.length && cmpEval(sorted[idx + 1].ev, sorted[idx].ev) === 0) {
      idx++;
      group.push(sorted[idx]);
    }
    groups.push(group);
    idx++;
  }

  let pos = 1;
  let loserCovered = false;
  for (const group of groups) {
    const endPos = pos + group.length - 1;
    const coversLoser = loserRank >= pos && loserRank <= endPos;
    if (coversLoser) loserCovered = true;

    if (coversLoser && group.length === 1) {
      group[0].rank = loserRank;
      group[0].delta = -wTotal * mult * ante;
    } else if (coversLoser) {
      let net = 0;
      for (let p = pos; p <= endPos; p++) {
        if (p === loserRank) net -= wTotal * mult * ante;
        else net += (weights[p - 1] || 0) * mult * ante;
      }
      const shares = distributeEvenly(net, group.length);
      group.forEach((r, gi) => {
        r.rank = pos;
        r.delta = shares[gi];
      });
    } else {
      let total = 0;
      for (let p = pos; p <= endPos; p++) total += (weights[p - 1] || 0) * mult * ante;
      const shares = distributeEvenly(total, group.length);
      group.forEach((r, gi) => {
        r.rank = pos;
        r.delta = shares[gi];
      });
    }
    pos = endPos + 1;
  }

  if (!loserCovered) {
    results.forEach((r) => {
      r.delta = 0;
    });
  }

  sorted.forEach((sr) => {
    const orig = results.find((r) => r.pi === sr.pi)!;
    orig.rank = sr.rank;
    orig.delta = sr.delta;
  });
}
