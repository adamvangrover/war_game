import { describe, it, expect, beforeEach } from 'vitest';
import { BlackjackGame } from '../src/engine/BlackjackGame';
import { Card } from '../src/core/Card';

describe('BlackjackGame', () => {
  let game: BlackjackGame;

  beforeEach(() => {
    game = new BlackjackGame();
  });

  it('should calculate score correctly', () => {
    const hand = [new Card('A', 'spades'), new Card('K', 'hearts')];
    expect(game.calculateScore(hand)).toBe(21);

    const hand2 = [new Card('A', 'spades'), new Card('5', 'hearts'), new Card('7', 'clubs')];
    // A(1)+5+7 = 13. Or A(11)+5+7=23 (bust). So 13.
    expect(game.calculateScore(hand2)).toBe(13);
  });

  it('should deal initial cards', () => {
    let dealData: any = null;
    game.on('deal', (data) => dealData = data);
    game.start();

    expect(game.playerHand.length).toBe(2);
    expect(game.dealerHand.length).toBe(2);
    expect(dealData).toBeDefined();
    // dealerHand in event should have one null
    expect(dealData.dealerHand[1]).toBeNull();
  });

  it('should handle hit', () => {
    // Disable shuffle to ensure predictable deal (no Blackjack)
    // Ordered deck: 2S, 3S, 4S, 5S... -> P: 2S,4S (6), D: 3S,5S (8)
    game.deck.shuffle = () => {};
    game.start();

    expect(game.state).toBe('playing');
    const initialCount = game.playerHand.length;
    game.hit();
    expect(game.playerHand.length).toBe(initialCount + 1);
  });

  it('should handle stand and dealer play', () => new Promise<void>(done => {
      game.start();
      game.on('game-over', (data) => {
          expect(data.winner).toBeDefined();
          done();
      });
      game.stand();
  }));
});
