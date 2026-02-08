import { describe, it, expect, beforeEach } from 'vitest';
import { BlackjackGame } from '../src/games/BlackjackGame';
import { Card } from '../src/core/Card';

describe('BlackjackGame', () => {
  let game: BlackjackGame;

  beforeEach(() => {
    game = new BlackjackGame();
  });

  it('should calculate score correctly (Ace handling)', () => {
    // Blackjack (Ace + 10-value)
    const handBJ = [new Card('A', 'spades'), new Card('K', 'hearts')];
    expect(game.calculateScore(handBJ)).toBe(21);

    // Soft Ace (11 + 5 = 16)
    const handSoft = [new Card('A', 'spades'), new Card('5', 'hearts')];
    expect(game.calculateScore(handSoft)).toBe(16);

    // Hard Ace (1 + 5 + 9 = 15) - Ace becomes 1 to prevent bust
    const handHard = [new Card('A', 'spades'), new Card('5', 'hearts'), new Card('9', 'hearts')];
    expect(game.calculateScore(handHard)).toBe(15);
    
    // Multiple Aces
    const handAces = [new Card('A', 'spades'), new Card('A', 'hearts')];
    expect(game.calculateScore(handAces)).toBe(12); // 11 + 1
  });

  it('should deal initial cards', () => new Promise<void>(done => {
    game.on('deal', (data) => {
      expect(game.playerHand.length).toBe(2);
      expect(game.dealerHand.length).toBe(2);
      expect(data).toBeDefined();
      // Ensure the dealer's second card is sent as null (hidden) in the event
      expect(data.dealerHand[1]).toBeNull();
      done();
    });
    game.start();
  }));

  it('should handle hit', () => {
    // Disable shuffle to ensure predictable deal (avoiding instant Blackjack)
    // Ordered deck: 2, 3, 4, 5...
    game.deck.shuffle = () => {
      // Reverse deck so pop() draws 2, 3, 4, 5...
      (game.deck as any).cards.reverse();
    };
    game.start();

    expect(game.state).toBe('playing');
    const initialCount = game.playerHand.length;
    
    game.hit();
    
    expect(game.playerHand.length).toBe(initialCount + 1);
  });

  it('should handle stand and dealer play', () => new Promise<void>(done => {
      game.start();
      game.on('game-over', (data) => {
          // Dealer should have played and a winner declared
          expect(data.winner).toBeDefined();
          // Dealer hand should be fully revealed in game over data
          expect(data.dealerHand.every((c: any) => c !== null)).toBe(true);
          done();
      });
      game.stand();
  }));
});