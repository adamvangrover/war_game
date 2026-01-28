export class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    this.wins = 0; // Total game wins
    this.roundsWon = 0; // Rounds won in current game
  }

  setHand(cards) {
    this.hand = [...cards];
  }

  playCard() {
    return this.hand.shift();
  }

  receiveCards(cards) {
    this.hand.push(...cards);
  }

  get cardCount() {
    return this.hand.length;
  }

  get hasCards() {
    return this.hand.length > 0;
  }

  resetRoundScore() {
    this.roundsWon = 0;
  }
}
