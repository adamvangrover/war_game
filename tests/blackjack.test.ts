import { describe, it, expect, beforeEach } from 'vitest';
import { BlackjackGame } from '../src/games/BlackjackGame';
import { Card } from '../src/core/Card';

describe('BlackjackGame Logic', () => {
  let game: BlackjackGame;

  beforeEach(() => {
    game = new BlackjackGame();
    game.start();
  });

  it('should initialize correctly', () => {
    expect(game.state).toBe('READY');
    expect(game.player.hand.length).toBe(0);
  });

  it('should deal cards', () => {
    // Mock draw to ensure no instant blackjack
    // Deal 4 cards: P1, B1, P2, B2
    // We want P to have e.g. 2, 3 (Total 5)
    // Dealer e.g. 2, 3 (Total 5)
    const cards = [
        new Card('2', 'hearts'), new Card('2', 'spades'),
        new Card('3', 'hearts'), new Card('3', 'spades')
    ];
    // draw() pops from end. So reverse order of dealing.
    // deal() does: p hand = [draw, draw], d hand = [draw, draw]
    // wait, logic is: this.player.hand = [draw, draw];
    // So popped cards are: P1, P2.
    // Then D1, D2.
    // So deck stack (top to bottom): D2, D1, P2, P1.
    // array pop order: P1, P2, D1, D2.

    // Actually simpler:
    game.deck.draw = () => new Card('2', 'clubs'); // Always return 2

    game.deal();
    expect(game.player.hand.length).toBe(2);
    expect(game.dealer.hand.length).toBe(2);
    expect(game.state).toBe('PLAYER_TURN');
    expect(game.getHandValue(game.player.hand)).toBe(4);
  });

  it('should calculate hand values correctly', () => {
    const handWithAce = [new Card('A', 'spades'), new Card('K', 'hearts')];
    expect(game.getHandValue(handWithAce)).toBe(21);

    const handWithAceSoft = [new Card('A', 'spades'), new Card('5', 'hearts')];
    expect(game.getHandValue(handWithAceSoft)).toBe(16);

    const handWithAceHard = [new Card('A', 'spades'), new Card('5', 'hearts'), new Card('9', 'hearts')];
    expect(game.getHandValue(handWithAceHard)).toBe(15);
  });
});
