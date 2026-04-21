import { aiPick } from './ai';
import { AI_ROSTER, HUMAN_CHAR_IDX, MULTS, shuffleArray, type Card } from './Card';
import { Deck } from './Deck';
import { evalHand } from './evaluate';
import { calcPayouts, type RoundResult } from './payout';

export interface PlayerState {
  name: string;
  isHuman: boolean;
  hand: Card[];
  score: number;
  roundScores: number[];
  style: string | null;
  emoji: string;
  /** 1..8，对应 char-{idx}-*.png 头像。 */
  charIdx: number;
}

export interface GameState {
  np: number;
  ante: number;
  loserRank: number;
  deck: Deck;
  comm: Card[];
  players: PlayerState[];
  round: number;
  phase: GamePhase;
  selectedIndices: number[];
  lastResults: RoundResult[] | null;
  newCards: Card[];
}

export type GamePhase =
  | 'round-splash'
  | 'flip-reveal'
  | 'select'
  | 'thinking'
  | 'result'
  | 'dealing';

export type Screen = 'loading' | 'menu' | 'chicken' | 'game' | 'gameover';

/** Fork deck so draw() does not mutate the source state's deck. */
function forkDeck(source: Deck): Deck {
  const d = Object.create(Deck.prototype) as Deck;
  d.cards = [...source.cards];
  return d;
}

function clonePlayer(p: PlayerState): PlayerState {
  return {
    ...p,
    hand: [...p.hand],
    roundScores: [...p.roundScores],
  };
}

export function createGame(np: number, ante: number, loserRank: number): GameState {
  const deck = new Deck();
  const comm = deck.draw(4);
  const aiPool = shuffleArray([...AI_ROSTER]);
  const players: PlayerState[] = [];

  for (let i = 0; i < np; i++) {
    if (i === 0) {
      players.push({
        name: '你',
        isHuman: true,
        hand: deck.draw(5),
        score: 0,
        roundScores: [],
        style: null,
        emoji: '😊',
        charIdx: HUMAN_CHAR_IDX,
      });
    } else {
      const ai = aiPool[i - 1]!;
      players.push({
        name: ai.name,
        isHuman: false,
        hand: deck.draw(5),
        score: 0,
        roundScores: [],
        style: ai.style,
        emoji: ai.emoji,
        charIdx: ai.charIdx,
      });
    }
  }

  return {
    np,
    ante,
    loserRank,
    deck,
    comm,
    players,
    round: 0,
    phase: 'round-splash',
    selectedIndices: [],
    lastResults: null,
    newCards: [],
  };
}

export function executeRound(state: GameState): { state: GameState; results: RoundResult[] } {
  const r = state.round;
  const last = r === 4;
  const mult = MULTS[r]!;

  const results: RoundResult[] = [];

  for (let i = 0; i < state.np; i++) {
    const p = state.players[i]!;
    let played: Card[];
    let combo: Card[];

    if (last) {
      played = [...p.hand];
      combo = [...p.hand];
    } else {
      const cc = state.comm[r]!;
      if (p.isHuman) {
        const idxs = [...state.selectedIndices].sort((a, b) => a - b);
        played = idxs.map((idx) => p.hand[idx] as Card);
        combo = [...played, cc];
      } else {
        const style = p.style ?? '稳健';
        const pair = aiPick(p.hand, cc, style, r, state.comm, state.np, p.score, state.loserRank);
        played = [p.hand[pair[0]!] as Card, p.hand[pair[1]!] as Card];
        combo = [...played, cc];
      }
    }

    results.push({
      pi: i,
      ev: evalHand(combo),
      played,
      combo,
      rank: 0,
      delta: 0,
    });
  }

  calcPayouts(results, state.np, state.loserRank, mult, state.ante);

  const players = state.players.map(clonePlayer);
  for (const x of results) {
    const pl = players[x.pi]!;
    pl.score += x.delta;
    pl.roundScores.push(x.delta);
    if (!last) {
      pl.hand = pl.hand.filter((c) => !x.played.includes(c));
    }
  }

  const nextState: GameState = {
    ...state,
    deck: state.deck,
    players,
    lastResults: results,
    newCards: [],
  };

  return { state: nextState, results };
}

/**
 * 与 `poker.html` 的 `dealPendingCards` / `needsDeal` 一致：仅在前三轮结束后补牌，
 * 保证决胜轮（round === 4）每人手中剩余 3 张，`evalHand` 按 3 张评估。
 */
export function dealNewCards(state: GameState): GameState {
  const players = state.players.map(clonePlayer);

  if (state.round >= 3) {
    return {
      ...state,
      players,
      newCards: [],
    };
  }

  const deck = forkDeck(state.deck);
  let humanDraw: Card[] = [];

  for (let i = 0; i < state.np; i++) {
    const drawn = deck.draw(2);
    players[i]!.hand.push(...drawn);
    if (i === 0) humanDraw = drawn;
  }

  return {
    ...state,
    deck,
    players,
    newCards: humanDraw,
  };
}
