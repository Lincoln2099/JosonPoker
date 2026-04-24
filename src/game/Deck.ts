import { Card, SUITS, RANKS } from './Card';

export class Deck {
  cards: Card[];
  /** 本次牌局使用的副数(1 副 = 54 张, 2 副 = 108 张) */
  numDecks: number;

  /**
   * 构造一副新牌堆。
   * @param numDecks 副数。3 人局用 1 副、4~8 人局用 2 副(由 GameEngine.createGame 决定)。
   */
  constructor(numDecks = 1) {
    this.numDecks = numDecks;
    this.cards = [];
    for (let d = 0; d < numDecks; d++) {
      for (const s of SUITS)
        for (const r of RANKS) this.cards.push(new Card(s, r, null, d));
      this.cards.push(new Card(null, null, 'small', d));
      this.cards.push(new Card(null, null, 'big', d));
    }
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(n: number): Card[] {
    return this.cards.splice(0, n);
  }
}

/** 根据玩家人数返回应使用的副数(3 人 = 1 副, 4~8 人 = 2 副)。 */
export function decksForPlayers(np: number): number {
  return np <= 3 ? 1 : 2;
}
