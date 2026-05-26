import { Deck } from '../core/Deck.js';
import { Card } from '../core/Card.js';
import { VALUES } from '../core/constants.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { IGame } from '../core/interfaces.js';

export type VideoPokerState = 'READY' | 'DRAWN' | 'GAME_OVER';

export interface VideoPokerGameState {
  state: VideoPokerState;
  hand: Card[];
  held: boolean[];
  credits: number;
  bet: number;
  message: string;
  winAmount: number;
}

export class VideoPokerGame extends EventEmitter implements IGame {
  public deck: Deck;
  public state: VideoPokerState;
  public hand: Card[];
  public held: boolean[];
  public credits: number;
  public bet: number;
  public message: string;
  public winAmount: number;

  constructor() {
    super();
    this.deck = new Deck();
    this.state = 'READY';
    this.hand = [];
    this.held = [false, false, false, false, false];
    this.credits = 1000;
    this.bet = 5;
    this.message = 'Place bet and Deal';
    this.winAmount = 0;
  }

  start(): void {
    this.deck.initialize();
    this.state = 'READY';
    this.hand = [];
    this.held = [false, false, false, false, false];
    this.message = 'Place bet and Deal';
    this.winAmount = 0;
    this.emit('update', this.getState());
  }

  deal(): void {
    if (this.state !== 'READY' && this.state !== 'GAME_OVER') return;
    if (this.credits < this.bet) {
      this.message = 'Not enough credits!';
      this.emit('update', this.getState());
      return;
    }

    this.credits -= this.bet;
    this.deck.initialize();
    this.hand = [];
    this.held = [false, false, false, false, false];
    this.winAmount = 0;

    for (let i = 0; i < 5; i++) {
      this.hand.push(this.deck.draw()!);
    }

    this.state = 'DRAWN';
    this.message = 'Select cards to hold, then Draw';
    this.emit('deal', this.getState());
  }

  toggleHold(index: number): void {
    if (this.state !== 'DRAWN') return;
    if (index >= 0 && index < 5) {
      this.held[index] = !this.held[index];
      this.emit('update', this.getState());
    }
  }

  draw(): void {
    if (this.state !== 'DRAWN') return;

    for (let i = 0; i < 5; i++) {
      if (!this.held[i]) {
        this.hand[i] = this.deck.draw()!;
      }
    }

    this.evaluateHand();
    this.state = 'GAME_OVER';
    this.emit('game-over', this.getState());
  }

  evaluateHand(): void {
    const ranks = this.hand.map(c => c.rank);
    const suits = this.hand.map(c => c.suit);
    const values = this.hand.map(c => VALUES[c.rank]).sort((a, b) => a - b);

    const isFlush = suits.every(s => s === suits[0]);
    let isStraight = false;

    // Check for straight
    if (values[4] - values[0] === 4 && new Set(values).size === 5) {
        isStraight = true;
    } else if (values.join(',') === '2,3,4,5,14') {
        // A, 2, 3, 4, 5 straight
        isStraight = true;
    }

    const rankCounts: Record<string, number> = {};
    for (const r of ranks) {
        rankCounts[r] = (rankCounts[r] || 0) + 1;
    }
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    let multiplier = 0;
    let handName = '';

    if (isFlush && isStraight) {
        if (values.includes(14) && values.includes(13)) {
            multiplier = 800;
            handName = 'Royal Flush';
        } else {
            multiplier = 50;
            handName = 'Straight Flush';
        }
    } else if (counts[0] === 4) {
        multiplier = 25;
        handName = 'Four of a Kind';
    } else if (counts[0] === 3 && counts[1] === 2) {
        multiplier = 9;
        handName = 'Full House';
    } else if (isFlush) {
        multiplier = 6;
        handName = 'Flush';
    } else if (isStraight) {
        multiplier = 4;
        handName = 'Straight';
    } else if (counts[0] === 3) {
        multiplier = 3;
        handName = 'Three of a Kind';
    } else if (counts[0] === 2 && counts[1] === 2) {
        multiplier = 2;
        handName = 'Two Pair';
    } else if (counts[0] === 2) {
        // Jacks or Better check
        const pairs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2);
        const pairRank = pairs[0];
        if (['J', 'Q', 'K', 'A'].includes(pairRank)) {
            multiplier = 1;
            handName = 'Jacks or Better';
        } else {
            handName = 'High Card';
        }
    } else {
        handName = 'High Card';
    }

    this.winAmount = multiplier * this.bet;
    this.credits += this.winAmount;

    if (this.winAmount > 0) {
        this.message = `Winner! ${handName} pays ${this.winAmount}`;
    } else {
        this.message = 'Game Over';
    }
  }

  getState(): VideoPokerGameState {
    return {
      state: this.state,
      hand: this.hand,
      held: [...this.held],
      credits: this.credits,
      bet: this.bet,
      message: this.message,
      winAmount: this.winAmount
    };
  }
}
