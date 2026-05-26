import { describe, it, expect, beforeEach } from 'vitest';
import { VideoPokerGame } from '../src/games/VideoPokerGame';
import { Card } from '../src/core/Card';

describe('VideoPokerGame Logic', () => {
  let game: VideoPokerGame;

  beforeEach(() => {
    game = new VideoPokerGame();
  });

  it('should start with READY state', () => {
    game.start();
    const state = game.getState();
    expect(state.state).toBe('READY');
    expect(state.hand.length).toBe(0);
    expect(state.credits).toBe(1000);
  });

  it('should deal 5 cards', () => {
    game.start();
    game.deal();
    const state = game.getState();
    expect(state.state).toBe('DRAWN');
    expect(state.hand.length).toBe(5);
    expect(state.credits).toBe(995); // 1000 - 5 bet
  });

  it('should allow toggling hold', () => {
    game.start();
    game.deal();
    game.toggleHold(0);
    expect(game.getState().held[0]).toBe(true);
    game.toggleHold(0);
    expect(game.getState().held[0]).toBe(false);
  });

  it('should evaluate Jacks or Better correctly', () => {
    game.start();
    game.deal();
    game.hand = [
      new Card('J', 'hearts'),
      new Card('J', 'spades'),
      new Card('2', 'clubs'),
      new Card('4', 'diamonds'),
      new Card('7', 'hearts')
    ];
    game.evaluateHand();
    expect(game.winAmount).toBe(5); // 1x multiplier for 5 bet
    expect(game.message).toContain('Jacks or Better pays 5');
  });

  it('should evaluate Royal Flush correctly', () => {
    game.start();
    game.deal();
    game.hand = [
      new Card('10', 'hearts'),
      new Card('J', 'hearts'),
      new Card('Q', 'hearts'),
      new Card('K', 'hearts'),
      new Card('A', 'hearts')
    ];
    game.evaluateHand();
    expect(game.winAmount).toBe(4000); // 800x multiplier
    expect(game.message).toContain('Royal Flush pays 4000');
  });

  it('should evaluate lower pairs as High Card', () => {
    game.start();
    game.deal();
    game.hand = [
      new Card('10', 'hearts'),
      new Card('10', 'spades'),
      new Card('2', 'clubs'),
      new Card('4', 'diamonds'),
      new Card('7', 'hearts')
    ];
    game.evaluateHand();
    expect(game.winAmount).toBe(0);
    expect(game.message).toBe('Game Over');
  });
});
