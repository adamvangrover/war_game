import { Card } from './Card.js';
import { RANKS, SUITS } from './constants.js';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initialize();
  }

  initialize(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(rank, suit));
      }
    }
    this.shuffle();
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): [Card[], Card[]] {
    const mid = Math.ceil(this.cards.length / 2);
    const hand1 = this.cards.slice(0, mid);
    const hand2 = this.cards.slice(mid);
    return [hand1, hand2];
  }

  draw(): Card | undefined {
    return this.cards.pop();
  }

  get length(): number {
    return this.cards.length;
  }
}