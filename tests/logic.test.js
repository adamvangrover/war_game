import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../src/Card.js';
import { Deck } from '../src/Deck.js';
import { Player } from '../src/Player.js';
import { Game } from '../src/Game.js';

describe('Deck', () => {
  it('should initialize with 52 cards', () => {
    const deck = new Deck();
    expect(deck.length).toBe(52);
  });

  it('should deal equal hands', () => {
    const deck = new Deck();
    const [hand1, hand2] = deck.deal();
    expect(hand1.length).toBe(26);
    expect(hand2.length).toBe(26);
  });
});

describe('Player', () => {
  it('should receive and play cards', () => {
    const player = new Player('Test');
    const cards = [new Card('2', 'hearts'), new Card('3', 'spades')];
    player.setHand(cards);
    expect(player.cardCount).toBe(2);

    const played = player.playCard();
    expect(played.rank).toBe('2');
    expect(player.cardCount).toBe(1);

    player.receiveCards([played]);
    expect(player.cardCount).toBe(2);
    // played card goes to bottom
    const next = player.playCard();
    expect(next.rank).toBe('3');
  });
});

describe('Game', () => {
  let p1, p2, game;

  beforeEach(() => {
    p1 = new Player('P1');
    p2 = new Player('P2');
    game = new Game(p1, p2);
  });

  it('should play a simple round where P1 wins', () => {
    // Manually set hands
    p1.setHand([new Card('A', 'spades')]); // Value 14
    p2.setHand([new Card('K', 'hearts')]); // Value 13
    game.gameInProgress = true;

    const result = game.playRound();
    expect(result.winner).toBe(p1);
    expect(p1.cardCount).toBe(2);
    expect(p2.cardCount).toBe(0);
  });

  it('should handle War', () => {
    // P1: 5 (active), then 3 hidden (2,3,4), then K (up)
    // P2: 5 (active), then 3 hidden (2,3,4), then Q (up)
    const p1Cards = [
        new Card('5', 'hearts'),
        new Card('2', 'clubs'), new Card('3', 'clubs'), new Card('4', 'clubs'),
        new Card('K', 'diamonds')
    ];
    const p2Cards = [
        new Card('5', 'spades'),
        new Card('2', 'hearts'), new Card('3', 'hearts'), new Card('4', 'hearts'),
        new Card('Q', 'diamonds')
    ];

    p1.setHand(p1Cards);
    p2.setHand(p2Cards);
    game.gameInProgress = true;

    const result = game.playRound();
    expect(result.isWar).toBe(true);
    expect(result.warEvents.length).toBe(1);
    expect(result.warEvents[0].winner).toBe(p1);

    // P1 should have all 10 cards
    expect(p1.cardCount).toBe(10);
    expect(p2.cardCount).toBe(0);
  });

  it('should end game if player does not have enough cards for War', () => {
      // P1 has 2 cards (5, 5). P2 has 10.
      // War triggers on first card. P1 has only 1 left, needs 4. P1 loses.

      const p1Cards = [new Card('5', 'hearts'), new Card('6', 'hearts')];
      const p2Cards = [new Card('5', 'spades'), new Card('7', 'spades'), new Card('8', 'spades'), new Card('9', 'spades'), new Card('10', 'spades')];

      p1.setHand(p1Cards);
      p2.setHand(p2Cards);
      game.gameInProgress = true;

      const result = game.playRound();
      expect(result.isWar).toBe(true);
      expect(result.gameEnded).toBe(true);
      expect(result.gameWinner).toBe(p2);
  });
});
