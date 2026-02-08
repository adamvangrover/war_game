import { describe, it, expect, beforeEach } from 'vitest';
import { HighLowGame } from '../src/games/HighLowGame';
import { Card } from '../src/core/Card';

describe('HighLowGame Logic', () => {
  let game: HighLowGame;

  beforeEach(() => {
    game = new HighLowGame();
  });

  it('should start with a card', () => {
    const state = game.start();
    expect(state.currentCard).toBeDefined();
    expect(state.score).toBe(0);
    expect(state.state).toBe('PLAYING');
  });

  it('should handle correct guess', () => {
    game.start();
    // Force cards
    // Current is 2. Next is 10. Guess Higher.
    game.currentCard = new Card('2', 'hearts');

    // Mock draw
    game.deck.draw = () => new Card('10', 'spades');

    const state = game.guess('higher');
    expect(state.score).toBe(1);
    expect(state.currentCard?.rank).toBe('10');
  });

  it('should handle wrong guess', () => {
    game.start();
    game.currentCard = new Card('10', 'hearts');
    game.deck.draw = () => new Card('2', 'spades');

    const state = game.guess('higher');
    expect(state.score).toBe(0);
    expect(state.result).toBe('LOSS');
    expect(state.state).toBe('GAME_OVER');
  });
});
