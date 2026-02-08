import { Deck } from '../core/Deck.js';
import { WAR_VALUES } from '../core/constants.js';
import { Player } from '../core/Player.js';
import { Card } from '../core/Card.js';

export interface WarResult {
  p1Card: Card | undefined;
  p2Card: Card | undefined;
  winner: Player | null;
  isWar: boolean;
  warEvents: WarEvent[];
  gameEnded: boolean;
  gameWinner: Player | null;
}

export interface WarEvent {
  p1Hidden: (Card | undefined)[];
  p2Hidden: (Card | undefined)[];
  p1Up: Card | undefined;
  p2Up: Card | undefined;
  winner: Player | null;
}

export class WarGame {
  public player1: Player;
  public player2: Player;
  public deck: Deck;
  public gameInProgress: boolean;
  public roundCount: number;

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;
    this.deck = new Deck();
    this.gameInProgress = false;
    this.roundCount = 0;
  }

  getCardValue(card: Card): number {
    return WAR_VALUES[card.rank];
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

    return {
      player1DeckSize: this.player1.cardCount,
      player2DeckSize: this.player2.cardCount
    };
  }

  playRound(): WarResult | null {
    if (!this.gameInProgress) return null;

    if (!this.player1.hasCards || !this.player2.hasCards) {
      this.checkGameEnd();
      return {
          gameEnded: true,
          winner: this.getGameWinner(),
          p1Card: undefined,
          p2Card: undefined,
          isWar: false,
          warEvents: [],
          gameWinner: this.getGameWinner()
      };
    }

    this.roundCount++;
    const p1Card = this.player1.playCard()!;
    const p2Card = this.player2.playCard()!;

    const pile: Card[] = [p1Card, p2Card];
    let result: WarResult = {
      p1Card,
      p2Card,
      winner: null,
      isWar: false,
      warEvents: [],
      gameEnded: false,
      gameWinner: null
    };

    const v1 = this.getCardValue(p1Card);
    const v2 = this.getCardValue(p2Card);

    if (v1 > v2) {
      result.winner = this.player1;
      this.player1.receiveCards(pile);
      this.player1.roundsWon++;
    } else if (v2 > v1) {
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

    return result;
  }

  resolveWar(pile: Card[], result: WarResult): void {
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
             result.gameEnded = true;
             result.gameWinner = this.player1.cardCount > this.player2.cardCount ? this.player1 : this.player2;
        }
        warActive = false;
        return;
      }

      const p1Hidden: (Card | undefined)[] = [];
      const p2Hidden: (Card | undefined)[] = [];

      for (let i = 0; i < 3; i++) {
        p1Hidden.push(this.player1.playCard());
        p2Hidden.push(this.player2.playCard());
      }

      const p1Up = this.player1.playCard();
      const p2Up = this.player2.playCard();

      if (p1Up && p2Up) {
          // Add hidden cards if they exist (they should)
          p1Hidden.forEach(c => c && pile.push(c));
          p2Hidden.forEach(c => c && pile.push(c));
          pile.push(p1Up, p2Up);

          const warEvent: WarEvent = {
            p1Hidden,
            p2Hidden,
            p1Up,
            p2Up,
            winner: null
          };

          const v1 = this.getCardValue(p1Up);
          const v2 = this.getCardValue(p2Up);

          if (v1 > v2) {
            warEvent.winner = this.player1;
            this.player1.receiveCards(pile);
            this.player1.roundsWon++;
            warActive = false;
          } else if (v2 > v1) {
            warEvent.winner = this.player2;
            this.player2.receiveCards(pile);
            this.player2.roundsWon++;
            warActive = false;
          } else {
            warEvent.winner = null;
          }
          result.warEvents.push(warEvent);
      } else {
          warActive = false; // Should not happen given check above
      }
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

  getGameWinner(): Player | null {
      if (this.player1.cardCount === 0) return this.player2;
      if (this.player2.cardCount === 0) return this.player1;
      return null;
  }
}
