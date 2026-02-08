import { EventEmitter } from '../utils/EventEmitter';
import { Deck } from '../core/Deck';
import { Card } from '../core/Card';
import { IGame } from '../core/interfaces';

export type BlackjackState = 'playing' | 'dealer-turn' | 'game-over';

export interface BlackjackResult {
  winner: 'player' | 'dealer' | 'push';
  message: string;
}

export class BlackjackGame extends EventEmitter implements IGame {
  deck: Deck;
  playerHand: Card[] = [];
  dealerHand: Card[] = [];
  state: BlackjackState = 'game-over';

  constructor() {
    super();
    this.deck = new Deck();
  }

  start() {
    this.deck.initialize();
    this.playerHand = [];
    this.dealerHand = [];
    this.state = 'playing';

    // Deal
    this.playerHand.push(this.deck.draw()!);
    this.dealerHand.push(this.deck.draw()!);
    this.playerHand.push(this.deck.draw()!);
    this.dealerHand.push(this.deck.draw()!);

    this.emit('deal', {
      playerHand: this.playerHand,
      dealerHand: [this.dealerHand[0], null] // Hide dealer 2nd card
    });

    // Check instant blackjack
    if (this.calculateScore(this.playerHand) === 21) {
        if (this.calculateScore(this.dealerHand) === 21) {
            this.endGame('push', 'Push! Both have Blackjack.');
        } else {
            this.endGame('player', 'Blackjack! You win!');
        }
    }
  }

  hit() {
    if (this.state !== 'playing') return;
    const card = this.deck.draw()!;
    this.playerHand.push(card);

    this.emit('update-hand', { playerHand: this.playerHand });

    const score = this.calculateScore(this.playerHand);
    if (score > 21) {
      this.endGame('dealer', 'Bust! You lose.');
    }
  }

  stand() {
    if (this.state !== 'playing') return;
    this.state = 'dealer-turn';
    this.dealerPlay();
  }

  private dealerPlay() {
    this.emit('dealer-reveal', { dealerHand: this.dealerHand });

    // Simple dealer AI: hit until 17
    const playStep = () => {
        const score = this.calculateScore(this.dealerHand);
        if (score < 17) {
            setTimeout(() => {
                const card = this.deck.draw()!;
                this.dealerHand.push(card);
                this.emit('dealer-hit', { dealerHand: this.dealerHand });
                playStep();
            }, 800);
        } else {
            this.resolveGame();
        }
    };

    setTimeout(playStep, 500);
  }

  private resolveGame() {
      const pScore = this.calculateScore(this.playerHand);
      const dScore = this.calculateScore(this.dealerHand);

      if (dScore > 21) {
          this.endGame('player', 'Dealer Busts! You Win!');
      } else if (dScore > pScore) {
          this.endGame('dealer', 'Dealer Wins.');
      } else if (pScore > dScore) {
          this.endGame('player', 'You Win!');
      } else {
          this.endGame('push', 'Push.');
      }
  }

  private endGame(winner: 'player' | 'dealer' | 'push', message: string) {
      this.state = 'game-over';
      this.emit('game-over', { winner, message, dealerHand: this.dealerHand });
  }

  calculateScore(hand: Card[]): number {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        const val = Math.min(card.value, 10); // J,Q,K are 10. A is 14 in War, but logic needs specific handling?
        // Wait, War card values are: A=14. In BJ, A is 11 or 1.
        // I need to map ranks properly.
        if (card.rank === 'A') {
            aces++;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.rank)) {
            score += 10;
        } else {
            score += parseInt(card.rank);
        }
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
  }
}
