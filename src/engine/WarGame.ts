import { EventEmitter } from '../utils/EventEmitter';
import { Deck } from '../core/Deck';
import { Player } from '../core/Player';
import { Card } from '../core/Card';

export interface WarEvent {
  p1Hidden: Card[];
  p2Hidden: Card[];
  p1Up: Card;
  p2Up: Card;
  winner: Player | null;
}

export interface RoundResult {
  p1Card: Card;
  p2Card: Card;
  winner: Player | null;
  isWar: boolean;
  warEvents: WarEvent[];
  gameEnded: boolean;
  gameWinner: Player | null;
}

export class WarGame extends EventEmitter {
  deck: Deck;
  gameInProgress: boolean = false;
  roundCount: number = 0;

  public isAutoPlaying: boolean = false;

  constructor(public player1: Player, public player2: Player) {
    super();
    this.deck = new Deck();
  }

  start() {
    this.deck.initialize();
    const [hand1, hand2] = this.deck.deal();
    this.player1.setHand(hand1);
    this.player2.setHand(hand2);
    this.player1.resetRoundScore();
    this.player2.resetRoundScore();
    this.gameInProgress = true;
    this.roundCount = 0;
    this.isAutoPlaying = false;

    this.emit('game-start', {
      player1DeckSize: this.player1.cardCount,
      player2DeckSize: this.player2.cardCount
    });
  }

  playRound(): void {
    if (!this.gameInProgress) return;

    if (!this.player1.hasCards || !this.player2.hasCards) {
      const winner = this.checkGameEnd();
      this.emit('game-over', { winner });
      return;
    }

    this.roundCount++;
    const p1Card = this.player1.playCard()!;
    const p2Card = this.player2.playCard()!;

    const pile = [p1Card, p2Card];
    let result: RoundResult = {
      p1Card,
      p2Card,
      winner: null,
      isWar: false,
      warEvents: [],
      gameEnded: false,
      gameWinner: null
    };

    if (p1Card.value > p2Card.value) {
      result.winner = this.player1;
      this.player1.receiveCards(pile);
      this.player1.roundsWon++;
    } else if (p2Card.value > p1Card.value) {
      result.winner = this.player2;
      this.player2.receiveCards(pile);
      this.player2.roundsWon++;
    } else {
      result.isWar = true;
      this.resolveWar(pile, result);
    }

    if (!this.player1.hasCards || !this.player2.hasCards) {
      result.gameEnded = true;
      result.gameWinner = this.checkGameEnd();
    }

    this.emit('round-result', result);

    if (result.gameEnded) {
        this.isAutoPlaying = false;
        this.emit('game-over', { winner: result.gameWinner });
    }
  }

  private resolveWar(pile: Card[], result: RoundResult) {
    let warActive = true;

    while (warActive) {
      if (this.player1.cardCount < 4 || this.player2.cardCount < 4) {
        if (this.player1.cardCount < 4 && this.player2.cardCount >= 4) {
             result.gameEnded = true;
             result.gameWinner = this.player2;
        } else if (this.player2.cardCount < 4 && this.player1.cardCount >= 4) {
             result.gameEnded = true;
             result.gameWinner = this.player1;
        } else {
             // Tie or both lose. Default to player with more cards or player 1.
             result.gameEnded = true;
             result.gameWinner = this.player1.cardCount > this.player2.cardCount ? this.player1 : this.player2;
        }
        warActive = false;
        return;
      }

      const p1Hidden: Card[] = [];
      const p2Hidden: Card[] = [];

      for (let i = 0; i < 3; i++) {
        p1Hidden.push(this.player1.playCard()!);
        p2Hidden.push(this.player2.playCard()!);
      }

      const p1Up = this.player1.playCard()!;
      const p2Up = this.player2.playCard()!;

      pile.push(...p1Hidden, ...p2Hidden, p1Up, p2Up);

      const warEvent: WarEvent = {
        p1Hidden,
        p2Hidden,
        p1Up,
        p2Up,
        winner: null
      };

      if (p1Up.value > p2Up.value) {
        warEvent.winner = this.player1;
        this.player1.receiveCards(pile);
        this.player1.roundsWon++;
        warActive = false;
      } else if (p2Up.value > p1Up.value) {
        warEvent.winner = this.player2;
        this.player2.receiveCards(pile);
        this.player2.roundsWon++;
        warActive = false;
      } else {
        warEvent.winner = null;
      }

      result.warEvents.push(warEvent);
    }
  }

  checkGameEnd(): Player | null {
    if (this.player1.cardCount === 0) {
      this.gameInProgress = false;
      this.player2.wins++;
      return this.player2;
    } else if (this.player2.cardCount === 0) {
      this.gameInProgress = false;
      this.player1.wins++;
      return this.player1;
    }
    return null;
  }

  toggleAutoPlay() {
      this.isAutoPlaying = !this.isAutoPlaying;
      this.emit('autoplay-change', this.isAutoPlaying);
  }
}
