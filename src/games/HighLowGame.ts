import { Deck } from '../core/Deck.js';
import { Card } from '../core/Card.js';
import { WAR_VALUES } from '../core/constants.js';

export type HighLowState = 'READY' | 'PLAYING' | 'GAME_OVER';
export type HighLowResult = 'WIN' | 'LOSS' | null;

export interface HighLowGameState {
  state: HighLowState;
  currentCard: Card | null;
  nextCard: Card | null;
  score: number;
  message: string;
  result: HighLowResult;
}

export class HighLowGame {
  public deck: Deck;
  public state: HighLowState;
  public currentCard: Card | null;
  public nextCard: Card | null;
  public score: number;
  public message: string;
  public result: HighLowResult;

  constructor() {
    this.deck = new Deck();
    this.state = 'READY';
    this.currentCard = null;
    this.nextCard = null;
    this.score = 0;
    this.message = '';
    this.result = null;
  }

  start(): HighLowGameState {
    this.deck.initialize();
    this.score = 0;
    this.currentCard = this.deck.draw()!;
    this.nextCard = null;
    this.state = 'PLAYING';
    this.message = 'Higher or Lower?';
    this.result = null;
    return this.getState();
  }

  guess(choice: 'higher' | 'lower'): HighLowGameState {
    if (this.state !== 'PLAYING') return this.getState();

    this.nextCard = this.deck.draw()!;

    const v1 = WAR_VALUES[this.currentCard!.rank];
    const v2 = WAR_VALUES[this.nextCard.rank];

    let correct = false;
    if (choice === 'higher' && v2 >= v1) correct = true;
    else if (choice === 'lower' && v2 <= v1) correct = true;

    if (correct) {
        this.score++;
        this.message = 'Correct! Next card?';
        this.currentCard = this.nextCard;
        this.nextCard = null;
        // Game continues until loss or deck empty?
        // Let's just keep going.
    } else {
        this.state = 'GAME_OVER';
        this.result = 'LOSS';
        this.message = `Wrong! It was ${this.nextCard.rank}. Final Score: ${this.score}`;
    }

    if (this.deck.cards.length === 0) {
        this.state = 'GAME_OVER';
        this.result = 'WIN';
        this.message = `Deck Cleared! Final Score: ${this.score}`;
    }

    return this.getState();
  }

  getState(): HighLowGameState {
    return {
      state: this.state,
      currentCard: this.currentCard,
      nextCard: this.nextCard, // Only shown briefly or on loss
      score: this.score,
      message: this.message,
      result: this.result
    };
  }
}
