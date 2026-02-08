import { EventEmitter } from '../utils/EventEmitter';

export interface IGame extends EventEmitter {
  start(): void;
  // Common methods if any, usually games are very different.
}
