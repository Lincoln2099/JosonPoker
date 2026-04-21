export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export type Suit = (typeof SUITS)[number];

export const SUIT_COLORS: Record<Suit, 'black' | 'red'> = {
  '♠': 'black',
  '♥': 'red',
  '♦': 'red',
  '♣': 'black',
};

export const SUIT_VALUES: Record<Suit, number> = { '♠': 4, '♥': 3, '♣': 2, '♦': 1 };

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_VALUES: Record<string, number> = {};
RANKS.forEach((r, i) => (RANK_VALUES[r] = i + 2));

export const MULTS = [1, 2, 4, 8, 16];
export const ROUND_CN = ['一', '二', '三', '四', '五'];
export const STEP_COLORS = ['#48c878', '#f0ca50', '#f0a048', '#e86060', '#d84040'];

export interface AIConfig {
  name: string;
  style: string;
  emoji: string;
  /** 1..8，对应 char-N-*.png 头像 */
  charIdx: number;
}

/**
 * 角色按头像观感命名（与 public/assets/avatars/char-{idx}-*.png 一一对应）。
 * char-1 留给玩家"你"，AI 从 char-2..8 中选取（按局玩家数随机洗牌）。
 */
export const AI_ROSTER: AIConfig[] = [
  { name: '教授', style: '稳健', emoji: '🎓', charIdx: 2 },
  { name: '大叔', style: '激进', emoji: '🔥', charIdx: 3 },
  { name: '千金', style: '保守', emoji: '👜', charIdx: 4 },
  { name: '黄毛', style: '随机', emoji: '⚡', charIdx: 5 },
  { name: '阿娇', style: '计算', emoji: '🌸', charIdx: 6 },
  { name: '小明', style: '简单', emoji: '🐣', charIdx: 7 },
  { name: '总监', style: '反向', emoji: '💼', charIdx: 8 },
];

/** 玩家"你"固定使用的头像编号。 */
export const HUMAN_CHAR_IDX = 1;

export const AI_REACT_HAPPY = ['😏', '😎', '🤭', '😼', '🥳', '✌️'];
export const AI_REACT_ANGRY = ['😤', '😠', '🤬', '💢', '😡'];
export const AI_REACT_NEUTRAL = ['😐', '🤔', '😶', '🫤'];

export type JokerType = 'big' | 'small';

export class Card {
  suit: Suit | null;
  rank: Rank | null;
  jokerType: JokerType | null;
  deckIdx: number;
  id: string;

  constructor(suit: Suit | null, rank: Rank | null, jokerType: JokerType | null = null, deckIdx = 0) {
    this.suit = suit;
    this.rank = rank;
    this.jokerType = jokerType;
    this.deckIdx = deckIdx;
    this.id = jokerType ? `${jokerType}_${deckIdx}` : `${rank}${suit}_${deckIdx}`;
  }

  get isJoker(): boolean {
    return !!this.jokerType;
  }

  get rankValue(): number {
    return RANK_VALUES[this.rank as string] || 0;
  }

  get suitValue(): number {
    return SUIT_VALUES[this.suit as Suit] || 0;
  }

  get color(): string {
    return this.isJoker
      ? this.jokerType === 'big'
        ? 'red'
        : 'black'
      : SUIT_COLORS[this.suit as Suit];
  }

  get displayRank(): string {
    return this.isJoker ? (this.jokerType === 'big' ? '大' : '小') : (this.rank as string);
  }
}

export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
