import { Card } from './Card.js';

export class Player {
  public name: string;
  public hand: Card[];
  public wins: number;
  public roundsWon: number;

  constructor(name: string) {
    this.name = name;
    this.hand = [];
    this.wins = 0;
    this.roundsWon = 0;
  }

  setHand(cards: Card[]): void {
    this.hand = [...cards];
  }

  playCard(): Card | undefined {
    return this.hand.shift();
  }

  receiveCards(cards: Card[]): void {
    this.hand.push(...cards);
  }

  get cardCount(): number {
    return this.hand.length;
  }

  get hasCards(): boolean {
    return this.hand.length > 0;
  }

  resetRoundScore(): void {
    this.roundsWon = 0;
  }
}
