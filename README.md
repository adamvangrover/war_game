# Simple Card Games - War

This repository contains a modernized, modular implementation of the classic card game "War" using HTML5, CSS3, and JavaScript (ES6+).

## Play Now
Open `index.html` in a modern web browser, or serve it locally for the best experience.

## Features

*   **Modern Tech Stack:** Written in ES6+ JavaScript modules.
*   **Visual Overhaul:**
    *   Responsive design with a green felt table theme.
    *   CSS 3D transforms for realistic card flips.
    *   SVG-based card graphics (no external images required).
    *   Smooth animations for dealing and winning cards.
*   **Audio:** Sound effects for shuffling, drawing, flipping, and winning (using Web Audio API).
*   **Robust Logic:**
    *   Handles standard "War" rules and chained Wars.
    *   Edge case handling (e.g., running out of cards during a war).
*   **Quality Assurance:**
    *   Comprehensive unit tests using Vitest.

## How to Play

1.  **Objective:** Win all the cards in the deck.
2.  **Draw:** Click "Draw Cards" (or press Spacebar) to flip the top card of your deck.
3.  **Battle:**
    *   Higher rank wins the round and takes both cards.
    *   Ranks: 2 (lowest) to Ace (highest).
4.  **War:**
    *   If cards are of equal rank, "War" is declared.
    *   Three cards are placed face down, and one card face up.
    *   Compare the face-up cards. Winner takes all (10 cards!).
    *   If tied again, War continues!
5.  **Winning:** The game ends when one player holds all 52 cards.

## Development

### Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the development server:
```bash
npx vite
```
Then open the provided URL (usually `http://localhost:5173`).

### Testing

Run the test suite to verify game logic:
```bash
npm test
```

## Project Structure

*   `src/`: Source code
    *   `Game.js`: Core game rules and state machine.
    *   `Deck.js`: Deck management (shuffle, deal).
    *   `Player.js`: Player state.
    *   `Card.js`: Card rendering and data.
    *   `UI.js`: DOM manipulation and animations.
    *   `AudioManager.js`: Sound synthesis.
    *   `styles.css`: Visual styling and animations.
*   `tests/`: Unit tests (Vitest).

## Credits

Original concept by adamvangrover.
Upgraded by Jules (AI Assistant).

## License

MIT License
