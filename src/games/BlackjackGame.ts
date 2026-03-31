import { Deck } from '../core/Deck.js';
import { BLACKJACK_VALUES } from '../core/constants.js';
import { Player } from '../core/Player.js';
import { Card } from '../core/Card.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { IGame } from '../core/interfaces.js';

export type BlackjackState = 'READY' | 'playing' | 'DEALER_TURN' | 'GAME_OVER';
export type BlackjackResult = 'PLAYER_WIN' | 'DEALER_WIN' | 'PUSH' | null;

export interface HandResult {
  hand: Card[];
  value: number;
  result: BlackjackResult;
  message: string;
}

export interface BlackjackGameState {
  state: BlackjackState;
  playerHands: Card[][];
  currentHandIndex: number;
  dealerHand: (Card | null)[];
  playerValues: number[];
  dealerValue: number;
  message: string;
  results: HandResult[];
}

export class BlackjackGame extends EventEmitter implements IGame {
  public deck: Deck;
  public player: Player;
  public dealer: Player;
  public state: BlackjackState;
  public message: string;

  public playerHands: Card[][] = [];
  public currentHandIndex: number = 0;
  public results: HandResult[] = [];
  public hasDoubled: boolean[] = [];

  constructor() {
    super();
    this.deck = new Deck();
    this.player = new Player('Player');
    this.dealer = new Player('Dealer');
    this.state = 'READY';
    this.message = '';
    this.playerHands = [];
    this.currentHandIndex = 0;
    this.results = [];
    this.hasDoubled = [];
  }

  calculateScore(hand: Card[]): number {
    return this.getHandValue(hand);
  }

  get playerHand(): Card[] {
    return this.playerHands[this.currentHandIndex] || [];
  }

  get dealerHand(): (Card | null)[] {
    return this.dealer.hand;
  }

  start(): void {
    this.deck.initialize();
    this.playerHands = [];
    this.currentHandIndex = 0;
    this.dealer.hand = [];
    this.state = 'READY';
    this.message = '';
    this.results = [];
    this.hasDoubled = [];

    // Auto-deal on start
    this.deal();
  }

  deal(): BlackjackGameState {
    if (this.deck.length < 10) {
      this.deck.initialize();
    }

    this.playerHands = [[this.deck.draw()!, this.deck.draw()!]];
    this.currentHandIndex = 0;
    this.dealer.hand = [this.deck.draw()!, this.deck.draw()!];
    this.hasDoubled = [false];

    this.state = 'playing';

    const pScore = this.getHandValue(this.playerHands[0]);
    const dScore = this.getHandValue(this.dealer.hand);

    const state = this.getState();
    this.emit('deal', state); // Always emit deal so initial cards are shown

    if (pScore === 21) {
      this.endGame();
    }

    return state;
  }

  canSplit(): boolean {
    if (this.state !== 'playing' || this.playerHands.length >= 4) return false;
    const currentHand = this.playerHands[this.currentHandIndex];
    if (currentHand.length !== 2) return false;
    return BLACKJACK_VALUES[currentHand[0].rank] === BLACKJACK_VALUES[currentHand[1].rank] || currentHand[0].rank === currentHand[1].rank;
  }

  split(): BlackjackGameState {
    if (!this.canSplit()) return this.getState();

    const currentHand = this.playerHands[this.currentHandIndex];
    const card2 = currentHand.pop()!;

    currentHand.push(this.deck.draw()!);
    const newHand = [card2, this.deck.draw()!];

    this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);
    this.hasDoubled.splice(this.currentHandIndex + 1, 0, false);

    this.emit('update-hand', this.getState());

    const score = this.getHandValue(currentHand);
    if (score === 21) {
        this.stand();
    }

    return this.getState();
  }

  canDouble(): boolean {
    if (this.state !== 'playing') return false;
    const currentHand = this.playerHands[this.currentHandIndex];
    return currentHand.length === 2 && !this.hasDoubled[this.currentHandIndex];
  }

  double(): BlackjackGameState {
    if (!this.canDouble()) return this.getState();

    this.hasDoubled[this.currentHandIndex] = true;
    const card = this.deck.draw();
    if (card) this.playerHands[this.currentHandIndex].push(card);

    this.emit('update-hand', this.getState());

    this.stand();

    return this.getState();
  }

  hit(): BlackjackGameState {
    if (this.state !== 'playing') return this.getState();

    const card = this.deck.draw();
    if (card) this.playerHands[this.currentHandIndex].push(card);

    const score = this.getHandValue(this.playerHands[this.currentHandIndex]);

    // Emit update on hit regardless of outcome so UI shows the card
    this.emit('update-hand', this.getState());

    if (score > 21) {
      this.stand();
    } else if (score === 21) {
      this.stand();
    }

    return this.getState();
  }

  stand(): BlackjackGameState {
    if (this.state !== 'playing') return this.getState();

    if (this.currentHandIndex < this.playerHands.length - 1) {
        this.currentHandIndex++;
        this.emit('update-hand', this.getState());
        const score = this.getHandValue(this.playerHands[this.currentHandIndex]);
        if (score === 21) {
            this.stand();
        }
        return this.getState();
    }

    this.state = 'DEALER_TURN';
    this.emit('dealer-reveal', this.getState()); // Show hole card
    this.playDealer();
    return this.getState();
  }

  playDealer(): void {
    // Check if all hands busted, if so dealer doesn't need to play
    let allBust = true;
    for (const hand of this.playerHands) {
        if (this.getHandValue(hand) <= 21) {
            allBust = false;
            break;
        }
    }

    let score = this.getHandValue(this.dealer.hand as Card[]);

    if (!allBust) {
        while (score < 17) {
          const card = this.deck.draw();
          if (card) {
              this.dealer.hand.push(card);
              score = this.getHandValue(this.dealer.hand as Card[]);
              this.emit('dealer-hit', this.getState());
          } else {
              break;
          }
        }
    }

    this.endGame();
  }

  endGame(): void {
    this.state = 'GAME_OVER';
    const dealerScore = this.getHandValue(this.dealer.hand as Card[]);

    this.results = [];

    for (let i = 0; i < this.playerHands.length; i++) {
        const pScore = this.getHandValue(this.playerHands[i]);
        let res: BlackjackResult = null;
        let msg = '';

        if (pScore > 21) {
            res = 'DEALER_WIN';
            msg = 'Bust!';
        } else if (dealerScore > 21) {
            res = 'PLAYER_WIN';
            msg = 'Dealer Busts!';
        } else if (pScore === 21 && this.playerHands[i].length === 2 && !this.hasDoubled[i] && this.playerHands.length === 1) {
            if (dealerScore === 21 && this.dealer.hand.length === 2) {
                res = 'PUSH';
                msg = 'Push';
            } else {
                res = 'PLAYER_WIN';
                msg = 'Blackjack!';
            }
        } else if (dealerScore === 21 && this.dealer.hand.length === 2) {
             res = 'DEALER_WIN';
             msg = 'Dealer Blackjack!';
        } else if (pScore > dealerScore) {
            res = 'PLAYER_WIN';
            msg = 'You Win!';
        } else if (dealerScore > pScore) {
            res = 'DEALER_WIN';
            msg = 'Dealer Wins';
        } else {
            res = 'PUSH';
            msg = 'Push';
        }

        if (res === 'PLAYER_WIN') this.player.wins++;
        else if (res === 'DEALER_WIN') this.dealer.wins++;

        this.results.push({
            hand: this.playerHands[i],
            value: pScore,
            result: res,
            message: msg
        });
    }

    this.message = this.results.map((r, i) => `Hand ${i+1}: ${r.message}`).join(' | ');

    this.emit('game-over', {
        dealerHand: this.dealer.hand,
        results: this.results,
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
      playerHands: this.playerHands,
      currentHandIndex: this.currentHandIndex,
      dealerHand: this.state === 'playing' && this.dealer.hand.length > 0
          ? [this.dealer.hand[0], null]
          : this.dealer.hand,
      playerValues: this.playerHands.map(h => this.getHandValue(h)),
      dealerValue: this.state === 'playing' && this.dealer.hand.length > 0
          ? BLACKJACK_VALUES[this.dealer.hand[0]!.rank]
          : this.getHandValue(this.dealer.hand),
      message: this.message,
      results: this.results
    };
  }
}
