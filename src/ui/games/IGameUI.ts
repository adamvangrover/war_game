import { IGame } from '../../core/interfaces.js';

export interface IGameUI {
  init(game: IGame): void;
  teardown(): void;
  update?(): void;
}
