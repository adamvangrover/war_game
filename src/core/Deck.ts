import { Card } from './Card.js';
import { RANKS, SUITS } from './constants.js';

export class Deck {
  private _cards: Card[] = [];

  constructor() {
    this.initialize();
  }

  initialize(): void {
    this._cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this._cards.push(new Card(rank, suit));
      }
    }
    this.shuffle();
  }

  shuffle(): void {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }

  deal(): [Card[], Card[]] {
    const mid = Math.ceil(this._cards.length / 2);
    const hand1 = this._cards.slice(0, mid);
    const hand2 = this._cards.slice(mid);
    return [hand1, hand2];
  }

  draw(): Card | undefined {
    return this._cards.pop();
  }

  get length(): number {
    return this._cards.length;
  }

  get cards(): Card[] {
    return this._cards;
  }
}
