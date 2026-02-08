import { VALUES, SUIT_SYMBOLS, Rank, Suit } from './constants';

const SUIT_PATHS: Record<Suit, string> = {
  'hearts': 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  'diamonds': 'M12 2L2 12l10 10 10-10L12 2z',
  'clubs': 'M19.33 13.9C19.8 12.2 19 10.3 17.5 9.4c-.6-.4-1.3-.5-1.9-.3.6-1.5.3-3.2-1-4.4C13.5 3.3 11.9 3 10.5 3.8 9.1 3 7.5 3.3 6.4 4.7c-1.3 1.2-1.6 2.9-1 4.4-.6-.2-1.3-.1-1.9.3-1.5.9-2.3 2.8-1.8 4.5.4 1.7 1.9 2.8 3.6 2.8.5 0 1 0 1.5-.2 0 .5.1 1.1.2 1.6l-1.9 2H19l-1.9-2c.1-.5.2-1.1.2-1.6.5.2 1 .2 1.5.2 1.7 0 3.2-1.1 3.6-2.8z',
  'spades': 'M12 2c-4 4-8 8.5-8 12.5 0 2.5 2 4.5 4.5 4.5 1.5 0 2.8-.8 3.5-2 .7 1.2 2 2 3.5 2 2.5 0 4.5-2 4.5-4.5C20 10.5 16 6 12 2z M13.5 21h-3l-1 2h5l-1-2z'
};

export class Card {
  constructor(public readonly rank: Rank, public readonly suit: Suit) {}

  get value(): number {
    return VALUES[this.rank];
  }

  get color(): 'red' | 'black' {
    return (this.suit === 'hearts' || this.suit === 'diamonds') ? 'red' : 'black';
  }

  get symbol(): string {
    return SUIT_SYMBOLS[this.suit];
  }

  toString(): string {
    return `${this.rank} of ${this.suit}`;
  }

  getSVG(): string {
    const color = this.color === 'red' ? '#e74c3c' : '#2c3e50';
    const path = SUIT_PATHS[this.suit];

    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" rx="15" ry="15" fill="white" stroke="#ccc" stroke-width="2"/>

        <!-- Top Left -->
        <text x="25" y="45" font-family="Arial" font-weight="bold" font-size="35" fill="${color}" text-anchor="middle">${this.rank}</text>
        <path d="${path}" fill="${color}" transform="translate(12, 55) scale(1)"/>

        <!-- Center -->
        <path d="${path}" fill="${color}" transform="translate(50, 100) scale(4)"/>

        <!-- Bottom Right (Rotated) -->
        <g transform="rotate(180, 100, 150)">
           <text x="25" y="45" font-family="Arial" font-weight="bold" font-size="35" fill="${color}" text-anchor="middle">${this.rank}</text>
           <path d="${path}" fill="${color}" transform="translate(12, 55) scale(1)"/>
        </g>
      </svg>
    `;
  }

  static getBackSVG(): string {
    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="pattern-checkers" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect class="checker" x="0" y="0" width="10" height="10" fill="#34495e"></rect>
                <rect class="checker" x="10" y="10" width="10" height="10" fill="#34495e"></rect>
            </pattern>
        </defs>
        <rect width="200" height="300" rx="15" ry="15" fill="#2c3e50" stroke="#ccc" stroke-width="2"/>
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="url(#pattern-checkers)" stroke="#ecf0f1" stroke-width="2"/>
        <circle cx="100" cy="150" r="50" fill="#2c3e50" stroke="#ecf0f1" stroke-width="2"/>
        <text x="100" y="160" font-family="Arial" font-size="20" fill="#ecf0f1" text-anchor="middle">GAMES</text>
      </svg>
    `;
  }
}
