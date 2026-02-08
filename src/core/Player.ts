import { Card } from './Card.js';

export class Player {
  private hand: Card[] = [];
  public wins: number = 0;
  public roundsWon: number = 0;

  constructor(public readonly name: string) {}

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