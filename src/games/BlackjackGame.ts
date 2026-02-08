import { Deck } from '../core/Deck.js';
import { BLACKJACK_VALUES } from '../core/constants.js';
import { Player } from '../core/Player.js';
import { Card } from '../core/Card.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export type BlackjackState = 'READY' | 'playing' | 'DEALER_TURN' | 'GAME_OVER';
export type BlackjackResult = 'PLAYER_WIN' | 'DEALER_WIN' | 'PUSH' | null;

export interface BlackjackGameState {
  state: BlackjackState;
  playerHand: Card[];
  dealerHand: (Card | null)[];
  playerValue: number;
  dealerValue: number;
  message: string;
  result: BlackjackResult;
}

export class BlackjackGame extends EventEmitter {
  public deck: Deck;
  public player: Player;
  public dealer: Player;
  public state: BlackjackState;
  public message: string;
  public result: BlackjackResult;

  constructor() {
    super();
    this.deck = new Deck();
    this.player = new Player('Player');
    this.dealer = new Player('Dealer');
    this.state = 'READY';
    this.message = '';
    this.result = null;
  }

  calculateScore(hand: Card[]): number {
    return this.getHandValue(hand);
  }

  get playerHand(): Card[] {
    return this.player.hand;
  }

  get dealerHand(): (Card | null)[] {
    return this.dealer.hand;
  }

  start(): BlackjackGameState {
    this.deck.initialize();
    this.player.hand = [];
    this.dealer.hand = [];
    this.state = 'READY';
    this.message = '';
    this.result = null;

    // Auto-deal on start to match legacy behavior/tests
    return this.deal();
  }

  deal(): BlackjackGameState {
    if (this.deck.cards.length < 10) {
      this.deck.initialize(); // Auto reshuffle if low
    }

    this.player.hand = [this.deck.draw()!, this.deck.draw()!];
    this.dealer.hand = [this.deck.draw()!, this.deck.draw()!];

    this.state = 'playing';

    // Check for Blackjack immediately
    const pScore = this.getHandValue(this.player.hand);
    const dScore = this.getHandValue(this.dealer.hand);

    if (pScore === 21) {
      if (dScore === 21) {
        this.endGame('PUSH');
      } else {
        this.endGame('PLAYER_WIN', 'Blackjack!');
      }
    }

    const state = this.getState();
    this.emit('deal', state);
    return state;
  }

  hit(): BlackjackGameState {
    if (this.state !== 'playing') return this.getState();

    const card = this.deck.draw();
    if (card) this.player.hand.push(card);

    const score = this.getHandValue(this.player.hand);

    if (score > 21) {
      this.endGame('DEALER_WIN', 'Bust!');
    }
    // We do not auto-stand on 21 to allow user to see it.

    return this.getState();
  }

  stand(): BlackjackGameState {
    if (this.state !== 'playing') return this.getState();

    this.state = 'DEALER_TURN';
    this.playDealer();
    return this.getState();
  }

  playDealer(): void {
    let score = this.getHandValue(this.dealer.hand as Card[]);

    // Hit on soft 17 is standard in some casinos, strict 17 in others.
    // Here we implement: Dealer must draw to 16 and stand on all 17s.
    while (score < 17) {
      const card = this.deck.draw();
      if (card) {
          this.dealer.hand.push(card);
          score = this.getHandValue(this.dealer.hand as Card[]);
      } else {
          break; // Deck empty
      }
    }

    const pScore = this.getHandValue(this.player.hand);

    if (score > 21) {
      this.endGame('PLAYER_WIN', 'Dealer Busts!');
    } else if (score > pScore) {
      this.endGame('DEALER_WIN', 'Dealer Wins');
    } else if (score < pScore) {
      this.endGame('PLAYER_WIN', 'You Win!');
    } else {
      this.endGame('PUSH', 'Push');
    }
  }

  endGame(result: BlackjackResult, msg?: string): void {
    this.state = 'GAME_OVER';
    this.result = result;
    this.message = msg || (result === 'PUSH' ? 'Push' : result === 'PLAYER_WIN' ? 'You Win' : 'Dealer Wins');

    if (result === 'PLAYER_WIN') this.player.wins++;
    else if (result === 'DEALER_WIN') this.dealer.wins++;

    this.emit('game-over', {
        winner: result === 'PLAYER_WIN' ? this.player : (result === 'DEALER_WIN' ? this.dealer : null),
        dealerHand: this.dealer.hand,
        result,
        message: this.message
    });
  }

  getHandValue(hand: (Card | null)[]): number {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (!card) continue;
      const v = BLACKJACK_VALUES[card.rank];
      value += v;
      if (card.rank === 'A') aces++;
    }

    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  getState(): BlackjackGameState {
    return {
      state: this.state,
      playerHand: this.player.hand,
      // Hide first dealer card if player turn
      dealerHand: this.state === 'playing' && this.dealer.hand.length > 0
          ? [this.dealer.hand[0], null]
          : this.dealer.hand,
      playerValue: this.getHandValue(this.player.hand),
      dealerValue: this.state === 'playing' && this.dealer.hand.length > 0
          ? BLACKJACK_VALUES[this.dealer.hand[0]!.rank]
          : this.getHandValue(this.dealer.hand),
      message: this.message,
      result: this.result
    };
  }
}
