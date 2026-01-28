import { Player } from './Player.js';
import { Game } from './Game.js';
import { AudioManager } from './AudioManager.js';
import { UI } from './UI.js';

document.addEventListener('DOMContentLoaded', () => {
  const p1 = new Player('Player 1');
  const p2 = new Player('Player 2');
  const game = new Game(p1, p2);
  const audio = new AudioManager();
  const ui = new UI(game, audio);

  game.start();
  ui.init();
});
