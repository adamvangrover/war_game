import { WarGame } from '../games/WarGame.js';
import { BlackjackGame } from '../games/BlackjackGame.js';
import { BaccaratGame } from '../games/BaccaratGame.js';
import { HighLowGame } from '../games/HighLowGame.js';
import { UI } from '../ui/UI.js';
import { AudioManager } from '../core/AudioManager.js';
import { Player } from '../core/Player.js';

export type GameType = 'war' | 'blackjack' | 'baccarat' | 'highlow';

export class GameController {
  public audio: AudioManager;
  public ui: UI;
  public activeGame: WarGame | BlackjackGame | BaccaratGame | HighLowGame | null;
  public gameType: GameType | null;

  constructor() {
    this.audio = new AudioManager();
    this.ui = new UI(null, this.audio);
    this.activeGame = null;
    this.gameType = null;
  }

  init(): void {
    this.ui.init();

    document.getElementById('btn-war')?.addEventListener('click', () => this.startGame('war'));
    document.getElementById('btn-blackjack')?.addEventListener('click', () => this.startGame('blackjack'));
    document.getElementById('btn-baccarat')?.addEventListener('click', () => this.startGame('baccarat'));
    document.getElementById('btn-highlow')?.addEventListener('click', () => this.startGame('highlow'));

    document.getElementById('btn-back-menu')?.addEventListener('click', () => this.showMenu());
    document.getElementById('btn-settings-open')?.addEventListener('click', () => this.toggleSettings(true));
    document.getElementById('btn-settings-close')?.addEventListener('click', () => this.toggleSettings(false));

    document.getElementById('btn-rules')?.addEventListener('click', () => this.showRules(true));
    document.getElementById('btn-rules-close')?.addEventListener('click', () => this.showRules(false));

    document.getElementById('setting-sound')?.addEventListener('change', (e) => {
        this.audio.enabled = (e.target as HTMLInputElement).checked;
    });
    document.getElementById('setting-speed')?.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        this.ui.speedModifier = val === 'slow' ? 2.0 : val === 'fast' ? 0.5 : 1.0;
    });

    // Controls
    document.getElementById('draw-btn')?.addEventListener('click', () => this.handleAction('draw'));
    document.getElementById('reset-btn')?.addEventListener('click', () => this.handleAction('reset'));
    document.getElementById('autoplay-btn')?.addEventListener('click', () => this.handleAction('autoplay'));

    document.getElementById('btn-hit')?.addEventListener('click', () => this.handleAction('hit'));
    document.getElementById('btn-stand')?.addEventListener('click', () => this.handleAction('stand'));
    document.getElementById('btn-deal')?.addEventListener('click', () => this.handleAction('deal'));

    document.getElementById('btn-bac-deal')?.addEventListener('click', () => this.handleAction('bac-deal'));

    document.getElementById('btn-higher')?.addEventListener('click', () => this.handleAction('higher'));
    document.getElementById('btn-lower')?.addEventListener('click', () => this.handleAction('lower'));
    document.getElementById('btn-hl-start')?.addEventListener('click', () => this.handleAction('hl-start'));
  }

  showMenu(): void {
    document.getElementById('main-menu')?.classList.add('visible');
  }

  toggleSettings(show: boolean): void {
    const el = document.getElementById('settings-modal');
    if (el) show ? el.classList.add('visible') : el.classList.remove('visible');
  }

  showRules(show: boolean): void {
    const el = document.getElementById('rules-modal');
    const body = document.getElementById('rules-body');

    if (show && body && this.gameType) {
        let text = "";
        switch (this.gameType) {
            case 'war':
                text = "The deck is divided evenly. Each player reveals the top card. Higher value wins both. Tie leads to WAR: 3 cards face down, 1 face up. Higher face up card takes all.";
                break;
            case 'blackjack':
                text = "Try to get closer to 21 than the dealer without going over. Face cards are 10, Aces are 1 or 11. Dealer must hit on soft 17.";
                break;
            case 'baccarat':
                text = "Bet on Player or Banker (auto-simulated here). Hand closest to 9 wins. 10s and Face cards are 0. Aces are 1. If total > 9, drop the first digit (e.g., 15 becomes 5).";
                break;
            case 'highlow':
                text = "Guess if the next card drawn will be Higher or Lower than the current one. Aces are high. Get a streak to increase your score!";
                break;
        }
        body.textContent = text;
    }

    if (el) show ? el.classList.add('visible') : el.classList.remove('visible');
  }

  startGame(type: GameType): void {
    this.gameType = type;
    document.getElementById('main-menu')?.classList.remove('visible');
    this.ui.reset();

    if (type === 'war') {
      const game = new WarGame(new Player('Player 1'), new Player('Player 2'));
      this.activeGame = game;
      this.ui.setGameMode('war');
      this.ui.setGame(game);
      game.start();
      this.ui.updateScores();

    } else if (type === 'blackjack') {
      const game = new BlackjackGame();
      this.activeGame = game;
      this.ui.setGameMode('blackjack');
      this.ui.setGame(game);
      game.start();
      this.ui.updateBlackjackState(game.getState());

    } else if (type === 'baccarat') {
      const game = new BaccaratGame();
      this.activeGame = game;
      this.ui.setGameMode('baccarat');
      this.ui.setGame(game);
      game.start();
      this.ui.updateBaccaratState(game.getState());

    } else if (type === 'highlow') {
      const game = new HighLowGame();
      this.activeGame = game;
      this.ui.setGameMode('highlow');
      this.ui.setGame(game);
      this.ui.updateHighLowState(game.start());
    }
  }

  handleAction(action: string): void {
    if (!this.activeGame) return;
    this.audio.init();

    if (this.gameType === 'war') {
      const game = this.activeGame as WarGame;
      if (action === 'draw') this.ui.handleDraw();
      else if (action === 'reset') { game.start(); this.ui.handleReset(); }
      else if (action === 'autoplay') this.ui.toggleAutoPlay();

    } else if (this.gameType === 'blackjack') {
       const game = this.activeGame as BlackjackGame;
       if (action === 'hit') { this.audio.playFlip(); this.ui.updateBlackjackState(game.hit()); }
       else if (action === 'stand') this.ui.updateBlackjackState(game.stand());
       else if (action === 'deal') { game.start(); this.audio.playDeal(); this.ui.updateBlackjackState(game.deal()); }
       else if (action === 'reset') { game.start(); this.ui.updateBlackjackState(game.getState()); }

    } else if (this.gameType === 'baccarat') {
       const game = this.activeGame as BaccaratGame;
       if (action === 'bac-deal') {
           this.audio.playDeal();
           game.start();
           this.ui.updateBaccaratState(game.deal());
       } else if (action === 'reset') {
           this.ui.updateBaccaratState(game.start());
       }

    } else if (this.gameType === 'highlow') {
       const game = this.activeGame as HighLowGame;
       if (action === 'hl-start') this.ui.updateHighLowState(game.start());
       else if (action === 'higher') this.ui.updateHighLowState(game.guess('higher'));
       else if (action === 'lower') this.ui.updateHighLowState(game.guess('lower'));
       else if (action === 'reset') this.ui.updateHighLowState(game.start());
    }
  }
}
