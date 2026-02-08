import { Suit, Rank, SUIT_SYMBOLS, VALUES } from './constants.js';

const ICONS: Record<Suit, string> = {
  hearts: '<path d="M50 85 C20 55 10 40 10 25 A20 20 0 0 1 50 25 A20 20 0 0 1 90 25 C90 40 80 55 50 85 Z" />',
  diamonds: '<path d="M50 10 L90 50 L50 90 L10 50 Z" />',
  spades: '<path d="M50 15 C40 30 10 35 10 55 A15 15 0 0 0 45 65 L45 80 L55 80 L55 65 A15 15 0 0 0 90 55 C90 35 60 30 50 15 Z" />',
  clubs: '<path d="M50 10 A15 15 0 0 0 35 30 A15 15 0 0 0 10 45 A15 15 0 0 0 45 55 L45 80 L55 80 L55 55 A15 15 0 0 0 90 45 A15 15 0 0 0 65 30 A15 15 0 0 0 50 10 Z" />'
};

export class Card {
  // Adopted 'readonly' from main branch for immutability
  constructor(public readonly rank: Rank, public readonly suit: Suit) {}

  // Helper from main branch: Essential for game comparison logic
  get value(): number {
    return VALUES[this.rank];
  }

  // Visual color logic from upgrade branch (using specific Hex codes)
  get color(): string {
    return (this.suit === 'hearts' || this.suit === 'diamonds') ? '#e74c3c' : '#2c3e50';
  }

  // Helper from main branch
  toString(): string {
    return `${this.rank} of ${this.suit}`;
  }

  // Kept the superior SVG generation from the upgrade branch (handles Face cards)
  getSVG(): string {
    const fill = this.color;
    const suitIcon = ICONS[this.suit].replace('<path', `<path fill="${fill}"`);

    // Corner Rank & Suit
    const corner = `
      <g>
        <text x="18" y="32" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="${fill}" text-anchor="middle">${this.rank}</text>
        <g transform="translate(8, 40) scale(0.2)">
           ${suitIcon}
        </g>
      </g>
    `;

    // Center Graphic
    let center = '';
    if (['J', 'Q', 'K'].includes(this.rank)) {
       center = `
         <rect x="35" y="45" width="130" height="210" stroke="${fill}" stroke-width="2" fill="none" rx="5" />
         <text x="100" y="150" font-family="Times New Roman, serif" font-size="80" fill="${fill}" text-anchor="middle" opacity="0.2">${this.rank}</text>
         <g transform="translate(50, 100) scale(1)">
            ${suitIcon}
         </g>
       `;
       center += `
         <g transform="rotate(180, 100, 150)">
            <g transform="translate(50, 100) scale(1)">
                ${suitIcon}
            </g>
         </g>
       `;
    } else if (this.rank === 'A') {
       center = `
         <g transform="translate(50, 100) scale(1)">
            ${suitIcon}
         </g>
       `;
    } else {
       center = `
          <text x="100" y="160" font-family="Arial" font-weight="bold" font-size="60" fill="${fill}" text-anchor="middle" opacity="0.8">${this.rank}</text>
           <g transform="translate(75, 170) scale(0.5)">
            ${suitIcon}
           </g>
       `;
    }

    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" rx="15" ry="15" fill="white" stroke="#bdc3c7" stroke-width="1"/>
        ${corner}
        <g transform="rotate(180, 100, 150)">
           ${corner}
        </g>
        ${center}
      </svg>
    `;
  }

  // Kept the polished back pattern from the upgrade branch
  static getBackSVG(): string {
    const pattern = `
      <defs>
        <pattern id="BackPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#2c3e50"/>
          <circle cx="10" cy="10" r="2" fill="#34495e"/>
          <path d="M0,20 L20,0" stroke="#34495e" stroke-width="1"/>
          <path d="M0,0 L20,20" stroke="#34495e" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="200" height="300" rx="15" ry="15" fill="url(#BackPattern)" stroke="white" stroke-width="4"/>
      <rect x="15" y="15" width="170" height="270" rx="10" ry="10" fill="none" stroke="white" stroke-width="2"/>
    `;
    return `
      <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        ${pattern}
      </svg>
    `;
  }
}