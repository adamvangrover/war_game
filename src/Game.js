import { Deck } from './Deck.js';

export class Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.deck = new Deck();
    this.gameInProgress = false;
    this.roundCount = 0;
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

  playRound() {
    if (!this.gameInProgress) return null;

    if (!this.player1.hasCards || !this.player2.hasCards) {
      this.checkGameEnd();
      return { gameEnded: true, winner: this.getGameWinner() };
    }

    this.roundCount++;
    const p1Card = this.player1.playCard();
    const p2Card = this.player2.playCard();

    const pile = [p1Card, p2Card];
    let result = {
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

    return result;
  }

  resolveWar(pile, result) {
    // Loop until war is resolved or someone runs out of cards
    let warActive = true;

    while (warActive) {
      // Check if players have enough cards for War (usually 3 down + 1 up = 4 cards needed?
      // Original code checks < 4. If you have 3 cards, you can't put 3 down and 1 up?
      // Actually standard war is often just: play until you can't.
      // If you don't have enough, you lose.

      // Let's assume we need at least 1 card to determine the winner (the face up card).
      // The "face down" cards can be fewer if they are running out, or we strictly enforce the count.
      // The original code enforced 4 cards. Let's stick to that for fidelity.

      if (this.player1.cardCount < 4 || this.player2.cardCount < 4) {
        // Someone loses
        if (this.player1.cardCount < 4 && this.player2.cardCount >= 4) {
             result.gameEnded = true;
             result.gameWinner = this.player2;
        } else if (this.player2.cardCount < 4 && this.player1.cardCount >= 4) {
             result.gameEnded = true;
             result.gameWinner = this.player1;
        } else {
             // Both run out? Draw? Or whoever has more?
             result.gameEnded = true;
             result.gameWinner = this.player1.cardCount > this.player2.cardCount ? this.player1 : this.player2;
        }
        warActive = false;
        return;
      }

      const p1Hidden = [];
      const p2Hidden = [];

      for (let i = 0; i < 3; i++) {
        p1Hidden.push(this.player1.playCard());
        p2Hidden.push(this.player2.playCard());
      }

      const p1Up = this.player1.playCard();
      const p2Up = this.player2.playCard();

      pile.push(...p1Hidden, ...p2Hidden, p1Up, p2Up);

      const warEvent = {
        p1Hidden,
        p2Hidden,
        p1Up,
        p2Up,
        winner: null
      };

      if (p1Up.value > p2Up.value) {
        warEvent.winner = this.player1;
        this.player1.receiveCards(pile);
        this.player1.roundsWon++; // Maybe war counts as a round win?
        warActive = false;
      } else if (p2Up.value > p1Up.value) {
        warEvent.winner = this.player2;
        this.player2.receiveCards(pile);
        this.player2.roundsWon++;
        warActive = false;
      } else {
        // Another war loop
        warEvent.winner = null;
      }

      result.warEvents.push(warEvent);
    }
  }

  checkGameEnd() {
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

  getGameWinner() {
      if (this.player1.cardCount === 0) return this.player2;
      if (this.player2.cardCount === 0) return this.player1;
      return null;
  }
}
