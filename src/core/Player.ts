import { Card } from './Card.js';

export class Player {
  private _hand: Card[] = [];
  public wins: number = 0;
  public roundsWon: number = 0;

  constructor(public readonly name: string) {}

  setHand(cards: Card[]): void {
    this._hand = [...cards];
  }

  playCard(): Card | undefined {
    return this._hand.shift();
  }

  receiveCards(cards: Card[]): void {
    this._hand.push(...cards);
  }

  get cardCount(): number {
    return this._hand.length;
  }

  get hasCards(): boolean {
    return this._hand.length > 0;
  }

  resetRoundScore(): void {
    this.roundsWon = 0;
  }

  get hand(): Card[] {
    return this._hand;
  }

  set hand(cards: Card[]) {
    this._hand = cards;
  }
}
