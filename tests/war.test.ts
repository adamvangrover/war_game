import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../src/core/Card';
import { Deck } from '../src/core/Deck';
import { Player } from '../src/core/Player';
import { WarGame } from '../src/games/WarGame';

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
    expect(played?.rank).toBe('2');
    expect(player.cardCount).toBe(1);

    player.receiveCards([played!]);
    expect(player.cardCount).toBe(2);
    const next = player.playCard();
    expect(next?.rank).toBe('3');
  });
});

describe('WarGame', () => {
  let p1: Player, p2: Player, game: WarGame;

  beforeEach(() => {
    p1 = new Player('P1');
    p2 = new Player('P2');
    game = new WarGame(p1, p2);
  });

  it('should play a simple round where P1 wins', () => {
    p1.setHand([new Card('A', 'spades')]);
    p2.setHand([new Card('K', 'hearts')]);
    game.gameInProgress = true;

    const result = game.playRound();
    expect(result?.winner).toBe(p1);
    expect(p1.cardCount).toBe(2);
    expect(p2.cardCount).toBe(0);
  });

  it('should handle War', () => {
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
    expect(result?.isWar).toBe(true);
    expect(result?.warEvents.length).toBe(1);
    expect(result?.warEvents[0].winner).toBe(p1);
    expect(p1.cardCount).toBe(10);
    expect(p2.cardCount).toBe(0);
  });
});
