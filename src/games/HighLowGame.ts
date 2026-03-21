import { Deck } from '../core/Deck.js';
import { Card } from '../core/Card.js';
import { WAR_VALUES } from '../core/constants.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { IGame } from '../core/interfaces.js';

export type HighLowState = 'READY' | 'PLAYING' | 'GAME_OVER';
export type HighLowResult = 'WIN' | 'LOSS' | null;

export interface HighLowGameState {
  state: HighLowState;
  currentCard: Card | null;
  nextCard: Card | null;
  score: number;
  pot: number;
  streak: number;
  message: string;
  result: HighLowResult;
}

export class HighLowGame extends EventEmitter implements IGame {
  public deck: Deck;
  public state: HighLowState;
  public currentCard: Card | null;
  public nextCard: Card | null;
  public score: number;
  public pot: number;
  public streak: number;
  public message: string;
  public result: HighLowResult;

  constructor() {
    super();
    this.deck = new Deck();
    this.state = 'READY';
    this.currentCard = null;
    this.nextCard = null;
    this.score = 0;
    this.pot = 0;
    this.streak = 0;
    this.message = '';
    this.result = null;
  }

  start(): void {
    this.deck.initialize();
    this.score = 0;
    this.pot = 0;
    this.streak = 0;
    this.currentCard = this.deck.draw()!;
    this.nextCard = null;
    this.state = 'PLAYING';
    this.message = 'Higher or Lower?';
    this.result = null;
    this.emit('update', this.getState());
  }

  cashOut(): void {
      if (this.state !== 'PLAYING' || this.pot === 0) return;
      this.score += this.pot;
      this.message = `Cashed out ${this.pot} points! Streak reset.`;
      this.pot = 0;
      this.streak = 0;
      this.emit('update', this.getState());
  }

  guess(choice: 'higher' | 'lower'): void {
    if (this.state !== 'PLAYING') return;

    this.nextCard = this.deck.draw()!;

    const v1 = WAR_VALUES[this.currentCard!.rank];
    const v2 = WAR_VALUES[this.nextCard.rank];

    let correct = false;
    if (choice === 'higher' && v2 >= v1) correct = true;
    else if (choice === 'lower' && v2 <= v1) correct = true;

    if (correct) {
        this.streak++;
        this.pot += 10 * this.streak; // Exponential pot growth based on streak
        this.message = `Correct! Streak: ${this.streak}. Pot: ${this.pot}`;
        this.currentCard = this.nextCard;
        this.nextCard = null;

        if (this.deck.length === 0) {
            this.state = 'GAME_OVER';
            this.result = 'WIN';
            this.score += this.pot;
            this.message = `Deck Cleared! Final Score: ${this.score}`;
        }
    } else {
        this.state = 'GAME_OVER';
        this.result = 'LOSS';
        this.pot = 0; // Lost the pot
        this.streak = 0;
        this.message = `Wrong! It was ${this.nextCard.rank}. Final Score: ${this.score}`;
    }

    this.emit('update', this.getState());
  }

  getState(): HighLowGameState {
    return {
      state: this.state,
      currentCard: this.currentCard,
      nextCard: this.nextCard,
      score: this.score,
      pot: this.pot,
      streak: this.streak,
      message: this.message,
      result: this.result
    };
  }
}
