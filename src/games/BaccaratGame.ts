import { Deck } from '../core/Deck.js';
import { Card } from '../core/Card.js';
import { Player } from '../core/Player.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { IGame } from '../core/interfaces.js';

export type BaccaratState = 'READY' | 'PLAYING' | 'GAME_OVER';
export type BaccaratResult = 'PLAYER_WIN' | 'BANKER_WIN' | 'TIE' | null;
export type BetChoice = 'PLAYER' | 'BANKER' | 'TIE' | null;

export interface BaccaratGameState {
  state: BaccaratState;
  playerHand: Card[];
  bankerHand: Card[];
  playerScore: number;
  bankerScore: number;
  message: string;
  result: BaccaratResult;
  chips: number;
  currentBet: BetChoice;
}

export class BaccaratGame extends EventEmitter implements IGame {
  public deck: Deck;
  public player: Player;
  public banker: Player;
  public state: BaccaratState;
  public message: string;
  public result: BaccaratResult;
  public chips: number;
  public currentBet: BetChoice;

  constructor() {
    super();
    this.deck = new Deck();
    this.player = new Player('Player');
    this.banker = new Player('Banker');
    this.state = 'READY';
    this.message = '';
    this.result = null;
    this.chips = 1000;
    this.currentBet = null;
  }

  start(): void {
    this.deck.initialize();
    this.player.hand = [];
    this.banker.hand = [];
    this.state = 'READY';
    this.message = 'Place your bet';
    this.result = null;
    this.currentBet = null;
    this.emit('update', this.getState());
  }

  placeBet(choice: BetChoice): void {
      if (this.state !== 'READY' || this.currentBet !== null) return;
      this.currentBet = choice;
      this.message = `Bet placed on ${choice}. Dealing...`;
      this.emit('update', this.getState());

      setTimeout(() => this.deal(), 500);
  }

  playRound(): void {
      if (this.state !== 'READY' && this.state !== 'GAME_OVER') return;

      this.player.hand = [];
      this.banker.hand = [];
      this.state = 'READY';
      this.message = 'Place your bet';
      this.result = null;
      this.currentBet = null;
      this.emit('update', this.getState());
  }

  getCardValue(card: Card): number {
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
    if (card.rank === 'A') return 1;
    return parseInt(card.rank, 10);
  }

  getHandValue(hand: Card[]): number {
    const total = hand.reduce((sum, card) => sum + this.getCardValue(card), 0);
    return total % 10;
  }

  deal(): BaccaratGameState {
    if (!this.currentBet) return this.getState();

    if (this.deck.length < 6) {
      this.deck.initialize();
    }

    this.player.hand = [];
    this.banker.hand = [];
    this.state = 'PLAYING';

    this.player.hand = [this.deck.draw()!, this.deck.draw()!];
    this.banker.hand = [this.deck.draw()!, this.deck.draw()!];

    let pScore = this.getHandValue(this.player.hand);
    let bScore = this.getHandValue(this.banker.hand);

    if (pScore >= 8 || bScore >= 8) {
        this.resolveGame(pScore, bScore);
        const state = this.getState();
        this.emit('update', state);
        return state;
    }

    let p3: Card | null = null;
    if (pScore <= 5) {
        p3 = this.deck.draw()!;
        this.player.hand.push(p3);
        pScore = this.getHandValue(this.player.hand);
    }

    let bankerDraws = false;
    if (!p3) {
        if (bScore <= 5) bankerDraws = true;
    } else {
        const p3Val = this.getCardValue(p3);
        if (bScore <= 2) {
            bankerDraws = true;
        } else if (bScore === 3) {
            if (p3Val !== 8) bankerDraws = true;
        } else if (bScore === 4) {
            if ([2,3,4,5,6,7].includes(p3Val)) bankerDraws = true;
        } else if (bScore === 5) {
            if ([4,5,6,7].includes(p3Val)) bankerDraws = true;
        } else if (bScore === 6) {
            if ([6,7].includes(p3Val)) bankerDraws = true;
        }
    }

    if (bankerDraws) {
        this.banker.hand.push(this.deck.draw()!);
        bScore = this.getHandValue(this.banker.hand);
    }

    this.resolveGame(pScore, bScore);
    const state = this.getState();
    this.emit('update', state);
    return state;
  }

  resolveGame(pScore: number, bScore: number) {
      this.state = 'GAME_OVER';

      if (pScore > bScore) {
          this.result = 'PLAYER_WIN';
          this.message = 'Player Wins!';
      } else if (bScore > pScore) {
          this.result = 'BANKER_WIN';
          this.message = 'Banker Wins!';
      } else {
          this.result = 'TIE';
          this.message = 'Tie!';
      }

      if (this.currentBet) {
          const betAmount = 10; // Fixed bet amount for now
          if (
              (this.currentBet === 'PLAYER' && this.result === 'PLAYER_WIN') ||
              (this.currentBet === 'BANKER' && this.result === 'BANKER_WIN')
          ) {
              this.chips += betAmount;
              this.message += ` You won ${betAmount} chips!`;
          } else if (this.currentBet === 'TIE' && this.result === 'TIE') {
              this.chips += betAmount * 8;
              this.message += ` You won ${betAmount * 8} chips!`;
          } else if (this.result !== 'TIE' || this.currentBet === 'TIE') {
              this.chips -= betAmount;
              this.message += ` You lost ${betAmount} chips.`;
          } else if (this.result === 'TIE') {
               this.message += ' Bets returned.';
          }
      }
  }

  getState(): BaccaratGameState {
    return {
      state: this.state,
      playerHand: this.player.hand,
      bankerHand: this.banker.hand,
      playerScore: this.getHandValue(this.player.hand),
      bankerScore: this.getHandValue(this.banker.hand),
      message: this.message,
      result: this.result,
      chips: this.chips,
      currentBet: this.currentBet
    };
  }
}
