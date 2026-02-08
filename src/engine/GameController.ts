import { IGame } from '../core/interfaces';
import { EventEmitter } from '../utils/EventEmitter';

export class GameController extends EventEmitter {
  public currentGame: IGame | null = null;

  constructor() {
    super();
  }

  setGame(game: IGame) {
    if (this.currentGame) {
        // cleanup if needed
    }
    this.currentGame = game;
    this.emit('game-changed', game);
  }
}
