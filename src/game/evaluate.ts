import { Card, SUITS, RANKS, shuffleArray } from './Card';

export interface EvalResult {
  type: number;
  key: number[];
  suit: number;
  name: string;
  hasJoker?: boolean;
}

export function evalRaw(cards: Card[]): EvalResult {
  const s = [...cards].sort((a, b) => b.rankValue - a.rankValue || b.suitValue - a.suitValue);
  const rv = s.map((c) => c.rankValue);
  const sv = s.map((c) => c.suitValue);
  const flush = s[0].suit === s[1].suit && s[1].suit === s[2].suit;
  let straight = false;
  let hi = 0;
  if (rv[0] - rv[1] === 1 && rv[1] - rv[2] === 1) {
    straight = true;
    hi = rv[0];
  } else if (rv[0] === 14 && rv[1] === 3 && rv[2] === 2) {
    straight = true;
    hi = 3;
  }
  const trips = rv[0] === rv[1] && rv[1] === rv[2];
  let pr = 0,
    kk = 0,
    ps = 0;
  if (!trips) {
    if (rv[0] === rv[1]) {
      pr = rv[0];
      kk = rv[2];
      ps = Math.max(sv[0], sv[1]);
    } else if (rv[1] === rv[2]) {
      pr = rv[1];
      kk = rv[0];
      ps = Math.max(sv[1], sv[2]);
    }
  }
  if (flush && straight) return { type: 6, key: [hi], suit: sv[0], name: '同花顺' };
  if (trips) return { type: 5, key: [rv[0]], suit: Math.max(...sv), name: '三条' };
  if (flush) return { type: 4, key: [...rv], suit: sv[0], name: '同花' };
  if (straight) return { type: 3, key: [hi], suit: Math.max(...sv), name: '顺子' };
  if (pr) return { type: 2, key: [pr, kk], suit: ps, name: '一对' };
  return { type: 1, key: [...rv], suit: sv[0], name: '高牌' };
}

export function cmpEval(a: EvalResult, b: EvalResult): number {
  if (a.type !== b.type) return a.type - b.type;
  for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
    const x = a.key[i] || 0;
    const y = b.key[i] || 0;
    if (x !== y) return x - y;
  }
  return a.suit - b.suit;
}

export function evalHand(cards: Card[]): EvalResult {
  const jokers = cards.filter((c) => c.isJoker);
  const real = cards.filter((c) => !c.isJoker);
  if (!jokers.length) return evalRaw(cards);
  let best: EvalResult | null = null;
  const mk = (s: (typeof SUITS)[number], r: (typeof RANKS)[number]) => new Card(s, r);
  if (jokers.length === 1) {
    for (const s of SUITS)
      for (const r of RANKS) {
        const e = evalRaw([...real, mk(s, r)]);
        if (!best || cmpEval(e, best) > 0) best = e;
      }
  } else {
    for (const s1 of SUITS)
      for (const r1 of RANKS)
        for (const s2 of SUITS)
          for (const r2 of RANKS) {
            const e = evalRaw([...real, mk(s1, r1), mk(s2, r2)]);
            if (!best || cmpEval(e, best) > 0) best = e;
          }
  }
  best!.hasJoker = true;
  return best!;
}

export interface EstimateRankState {
  knownCardIds: Set<string>;
}

export function estimateRank(
  playerCards: Card[],
  cc: Card | null,
  np: number,
  state: EstimateRankState,
): number {
  const playerCombo = cc ? [...playerCards, cc] : playerCards;
  const playerEv = evalHand(playerCombo);
  const knownIds = state.knownCardIds;
  const pool: Card[] = [];
  for (let d = 0; d < 2; d++)
    for (const s of SUITS)
      for (const r of RANKS) {
        const c = new Card(s, r, null, d);
        if (!knownIds.has(c.id)) pool.push(c);
      }
  for (let d = 0; d < 2; d++) {
    const sj = new Card(null, null, 'small', d);
    if (!knownIds.has(sj.id)) pool.push(sj);
    const bj = new Card(null, null, 'big', d);
    if (!knownIds.has(bj.id)) pool.push(bj);
  }
  let totalRank = 0;
  const sims = 60;
  for (let s = 0; s < sims; s++) {
    const shuffled = shuffleArray([...pool]);
    let betterCount = 0;
    let pi = 0;
    for (let opp = 1; opp < np; opp++) {
      const mc = [shuffled[pi++], shuffled[pi++]];
      const oppCombo = cc ? [...mc, cc] : mc;
      const oppEv = evalHand(oppCombo);
      if (cmpEval(oppEv, playerEv) > 0) betterCount++;
    }
    totalRank += betterCount + 1;
  }
  return Math.round(totalRank / sims);
}
