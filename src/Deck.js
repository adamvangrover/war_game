import { Card } from './Card.js';
import { RANKS, SUITS } from './constants.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.initialize();
  }

  initialize() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(rank, suit));
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    const mid = Math.ceil(this.cards.length / 2);
    const hand1 = this.cards.slice(0, mid);
    const hand2 = this.cards.slice(mid);
    return [hand1, hand2];
  }

  get length() {
    return this.cards.length;
  }
}
