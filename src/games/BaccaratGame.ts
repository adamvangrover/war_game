import { Deck } from '../core/Deck.js';
import { Card } from '../core/Card.js';
import { Player } from '../core/Player.js';

export type BaccaratState = 'READY' | 'PLAYING' | 'GAME_OVER';
export type BaccaratResult = 'PLAYER_WIN' | 'BANKER_WIN' | 'TIE' | null;

export interface BaccaratGameState {
  state: BaccaratState;
  playerHand: Card[];
  bankerHand: Card[];
  playerScore: number;
  bankerScore: number;
  message: string;
  result: BaccaratResult;
}

export class BaccaratGame {
  public deck: Deck;
  public player: Player;
  public banker: Player;
  public state: BaccaratState;
  public message: string;
  public result: BaccaratResult;

  constructor() {
    this.deck = new Deck();
    this.player = new Player('Player');
    this.banker = new Player('Banker');
    this.state = 'READY';
    this.message = '';
    this.result = null;
  }

  start(): BaccaratGameState {
    this.deck.initialize();
    this.player.hand = [];
    this.banker.hand = [];
    this.state = 'READY';
    this.message = 'Place your bet'; // In this simple version, we just deal
    this.result = null;
    return this.getState();
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
    if (this.deck.cards.length < 6) {
      this.deck.initialize();
    }

    this.state = 'PLAYING';

    // Initial Deal: Player, Banker, Player, Banker
    this.player.hand = [this.deck.draw()!, this.deck.draw()!];
    this.banker.hand = [this.deck.draw()!, this.deck.draw()!];

    let pScore = this.getHandValue(this.player.hand);
    let bScore = this.getHandValue(this.banker.hand);

    // Natural Win Check (8 or 9)
    if (pScore >= 8 || bScore >= 8) {
        this.resolveGame(pScore, bScore);
        return this.getState();
    }

    // Player Third Card Rule
    let p3: Card | null = null;
    if (pScore <= 5) {
        p3 = this.deck.draw()!;
        this.player.hand.push(p3);
        pScore = this.getHandValue(this.player.hand);
    }

    // Banker Third Card Rule
    let bankerDraws = false;
    if (bScore <= 2) {
        bankerDraws = true;
    } else if (bScore === 3) {
        if (!p3 || this.getCardValue(p3) !== 8) bankerDraws = true;
    } else if (bScore === 4) {
        if (p3 && [2,3,4,5,6,7].includes(this.getCardValue(p3))) bankerDraws = true;
        else if (!p3) bankerDraws = true; // Player stood (6/7), banker draws on 0-5. Logic overlap: if Player stands (6/7), Banker draws on 0-5. Here P stood implies p3 is null.
        // Wait, precise rule:
        // If Player stood (2 cards): Banker draws on 0-5, stands on 6-7.
        // If Player drew: complex table.
    } else if (bScore === 5) {
        if (p3 && [4,5,6,7].includes(this.getCardValue(p3))) bankerDraws = true;
    } else if (bScore === 6) {
        if (p3 && [6,7].includes(this.getCardValue(p3))) bankerDraws = true;
    }

    // Correction for Player Stand Scenario
    if (this.player.hand.length === 2) {
        if (bScore <= 5) bankerDraws = true;
        else bankerDraws = false;
    }

    if (bankerDraws) {
        this.banker.hand.push(this.deck.draw()!);
        bScore = this.getHandValue(this.banker.hand);
    }

    this.resolveGame(pScore, bScore);
    return this.getState();
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
  }

  getState(): BaccaratGameState {
    return {
      state: this.state,
      playerHand: this.player.hand,
      bankerHand: this.banker.hand,
      playerScore: this.getHandValue(this.player.hand),
      bankerScore: this.getHandValue(this.banker.hand),
      message: this.message,
      result: this.result
    };
  }
}
