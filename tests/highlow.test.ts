import { describe, it, expect, beforeEach } from 'vitest';
import { HighLowGame } from '../src/games/HighLowGame';
import { Card } from '../src/core/Card';

describe('HighLowGame Logic', () => {
  let game: HighLowGame;

  beforeEach(() => {
    game = new HighLowGame();
  });

  it('should start with a card', () => {
    game.start();
    const state = game.getState();
    expect(state.currentCard).toBeDefined();
    expect(state.score).toBe(0);
    expect(state.state).toBe('PLAYING');
  });

  it('should handle correct guess', () => {
    game.start();
    game.currentCard = new Card('2', 'hearts');
    (game.deck as any).draw = () => new Card('10', 'spades');

    game.guess('higher');
    const state = game.getState();
    expect(state.streak).toBe(1); // Score is only updated on cashout now, pot and streak increase
    expect(state.pot).toBeGreaterThan(0);
    expect(state.currentCard?.rank).toBe('10');
  });

  it('should handle wrong guess', () => {
    game.start();
    game.currentCard = new Card('10', 'hearts');
    (game.deck as any).draw = () => new Card('2', 'spades');

    game.guess('higher');
    const state = game.getState();
    expect(state.score).toBe(0);
    expect(state.result).toBe('LOSS');
    expect(state.state).toBe('GAME_OVER');
  });
});
