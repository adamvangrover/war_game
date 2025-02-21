```markdown
# Simple Card Games - War

This repository contains a simple implementation of the card game "War" using HTML, CSS, and JavaScript.  The game features round scores, game scores, and handles the "War" scenario.

## How to Play

1.  Clone the repository to your local machine.
2.  Open the `index.html` file in your web browser.
3.  Click the "Draw Cards" button to start a new round.
4.  The game will compare the cards drawn by each player.
5.  The player with the higher card wins the round and collects both cards.
6.  If the cards are equal, a "War" occurs.  Each player puts three cards face down, and then one card face up. The player with the higher face-up card wins the war and collects all the cards.  Wars can chain if the face-up cards are also equal.
7.  The game continues until one player has all the cards or runs out of cards during a war.
8.  The player who collects all the cards wins the game.
9.  Click "New Game" to start a fresh game.

## Features

*   **Card Display:**  Cards are graphically displayed on a canvas.
*   **Round Scoring:** Tracks the number of rounds won by each player.
*   **Game Scoring:** Tracks the number of games won by each player.
*   **War Handling:** Implements the "War" rule, including chained wars.
*   **Game Over:**  Detects game over conditions and declares the winner.
*   **New Game:** Resets the game state for a new match.
*   **Clear messages**: Provides clear messages to the player about the current game state and results of each round.
*   **Responsive**: The game is designed to be responsive.

## Technologies Used

*   HTML
*   CSS
*   JavaScript
*   Canvas API

## Project Structure

```
simple-card-games-war/
├── index.html       # Main HTML file
└── README.md      # This file
```

## Future Enhancements

*   **Improved Card Graphics:**  Enhance the visual appearance of the cards.
*   **Sound Effects:** Add sound effects for card drawing, wins, and wars.
*   **Multiplayer Support:** Implement multiplayer functionality.
*   **Animation**: Add smooth animations for card dealing and flipping.
*   **More Card Games**: Expand the project to include other card games.

## Credits

This project was developed by adamvangrover.

## License

MIT License

Copyright (c) 2025 adamvangrover

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

