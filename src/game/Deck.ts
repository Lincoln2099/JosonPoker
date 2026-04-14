import { Card, SUITS, RANKS } from './Card';

export class Deck {
  cards: Card[];

  constructor() {
    this.cards = [];
    for (let d = 0; d < 2; d++) {
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
