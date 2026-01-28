import { VALUES, SUIT_SYMBOLS } from './constants.js';

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }

  get value() {
    return VALUES[this.rank];
  }

  get color() {
    return (this.suit === 'hearts' || this.suit === 'diamonds') ? 'red' : 'black';
  }

  get symbol() {
    return SUIT_SYMBOLS[this.suit];
  }

  toString() {
    return `${this.rank} of ${this.suit}`;
  }

  getSVG() {
    const color = this.color === 'red' ? '#e74c3c' : '#2c3e50';

    // Simple ASCII-like SVG representation for now, can be enhanced
    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" rx="15" ry="15" fill="white" stroke="#ccc" stroke-width="2"/>
        <text x="20" y="50" font-family="Arial" font-size="40" fill="${color}" text-anchor="middle">${this.rank}</text>
        <text x="20" y="90" font-family="Arial" font-size="30" fill="${color}" text-anchor="middle">${this.symbol}</text>

        <text x="100" y="170" font-family="Arial" font-size="80" fill="${color}" text-anchor="middle">${this.symbol}</text>

        <g transform="rotate(180, 100, 150)">
           <text x="20" y="50" font-family="Arial" font-size="40" fill="${color}" text-anchor="middle">${this.rank}</text>
           <text x="20" y="90" font-family="Arial" font-size="30" fill="${color}" text-anchor="middle">${this.symbol}</text>
        </g>
      </svg>
    `;
  }

  static getBackSVG() {
    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" rx="15" ry="15" fill="#2c3e50" stroke="#ccc" stroke-width="2"/>
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="#34495e" stroke="#ecf0f1" stroke-width="2" stroke-dasharray="10,5"/>
        <circle cx="100" cy="150" r="40" fill="#ecf0f1" opacity="0.1"/>
        <text x="100" y="165" font-family="Arial" font-size="40" fill="#ecf0f1" opacity="0.2" text-anchor="middle">WAR</text>
      </svg>
    `;
  }
}
