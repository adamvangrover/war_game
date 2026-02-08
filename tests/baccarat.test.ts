import { describe, it, expect, beforeEach } from 'vitest';
import { BaccaratGame } from '../src/games/BaccaratGame';
import { Card } from '../src/core/Card';

describe('BaccaratGame Logic', () => {
  let game: BaccaratGame;

  beforeEach(() => {
    game = new BaccaratGame();
  });

  it('should deal initial hands', () => {
    game.start();
    game.deal();
    // 2 cards each initially
    // Unless third card rule triggered immediately
    expect(game.player.hand.length).toBeGreaterThanOrEqual(2);
    expect(game.banker.hand.length).toBeGreaterThanOrEqual(2);
    expect(game.state).toBe('GAME_OVER'); // Our implementation resolves immediately
  });

  it('should calculate score correctly', () => {
    // 9 + 6 = 15 -> 5
    const hand = [new Card('9', 'hearts'), new Card('6', 'spades')];
    expect(game.getHandValue(hand)).toBe(5);

    // K + 5 = 5
    const hand2 = [new Card('K', 'hearts'), new Card('5', 'spades')];
    expect(game.getHandValue(hand2)).toBe(5);
  });
});
