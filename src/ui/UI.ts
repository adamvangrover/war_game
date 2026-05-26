import { WarGame } from '../games/WarGame.js';
import { BlackjackGame } from '../games/BlackjackGame.js';
import { BaccaratGame } from '../games/BaccaratGame.js';
import { HighLowGame } from '../games/HighLowGame.js';
import { VideoPokerGame } from '../games/VideoPokerGame.js';
import { AudioManager } from './AudioManager.js';
import { Menu } from './Menu.js';
import { Settings } from './Settings.js';
import { VisualEffects } from './VisualEffects.js';
import { IGameUI } from './games/IGameUI.js';
import { WarUI } from './games/WarUI.js';
import { BlackjackUI } from './games/BlackjackUI.js';
import { BaccaratUI } from './games/BaccaratUI.js';
import { HighLowUI } from './games/HighLowUI.js';
import { VideoPokerUI } from './games/VideoPokerUI.js';
import { Player } from '../core/Player.js';

export class UI {
  private menu: Menu;
  private settings: Settings;
  private activeGameUI: IGameUI | null = null;
  private activeGame: any | null = null;

  private container: HTMLElement;
  private p1Deck: HTMLElement;
  private p2Deck: HTMLElement;
  private p1Slot: HTMLElement;
  private p2Slot: HTMLElement;
  private p1Score: HTMLElement;
  private p2Score: HTMLElement;
  private p1Name: HTMLElement;
  private p2Name: HTMLElement;
  private msgOverlay: HTMLElement;
  private warBadge: HTMLElement;
  private centerMsg: HTMLElement;
  private controlsContainer: HTMLElement;

  private drawBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private hitBtn: HTMLButtonElement;
  private standBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;
  private autoPlayBtn: HTMLButtonElement;

  constructor(private audio: AudioManager, private vfx: VisualEffects) {
    this.menu = new Menu();
    this.settings = new Settings();

    this.container = document.getElementById('game-container')!;
    this.controlsContainer = document.getElementById('controls')!;
    this.p1Deck = document.getElementById('p1-deck')!;
    this.p2Deck = document.getElementById('p2-deck')!;
    this.p1Slot = document.getElementById('p1-slot')!;
    this.p2Slot = document.getElementById('p2-slot')!;
    this.p1Score = document.getElementById('p1-score')!;
    this.p2Score = document.getElementById('p2-score')!;
    this.p1Name = document.getElementById('p1-name')!;
    this.p2Name = document.getElementById('p2-name')!;
    this.msgOverlay = document.getElementById('message-overlay')!;
    this.warBadge = document.getElementById('war-badge')!;
    this.centerMsg = document.getElementById('center-message')!;

    const getBtn = (id: string, text: string, cls: string = 'primary') => {
        let btn = document.getElementById(id) as HTMLButtonElement;
        if (!btn) {
            btn = document.createElement('button');
            btn.id = id;
            btn.textContent = text;
            btn.className = `btn ${cls}`;
            btn.style.display = 'none';
            this.controlsContainer.appendChild(btn);
        }
        return btn;
    };

    this.drawBtn = getBtn('draw-btn', 'Draw');
    this.resetBtn = getBtn('reset-btn', 'New Game', 'secondary');
    this.hitBtn = getBtn('btn-hit', 'Hit');
    this.standBtn = getBtn('btn-stand', 'Stand', 'secondary');
    this.menuBtn = getBtn('btn-menu', 'Menu', 'secondary');
    this.autoPlayBtn = getBtn('autoplay-btn', 'Auto Play', 'secondary');

    this.menu.onWarSelect = () => this.startGame('war');
    this.menu.onBlackjackSelect = () => this.startGame('blackjack');
    this.menu.onBaccaratSelect = () => this.startGame('baccarat');
    this.menu.onHighLowSelect = () => this.startGame('highlow');
    this.menu.onVideoPokerSelect = () => this.startGame('videopoker');
    this.menu.onSettingsSelect = () => this.settings.show();

    this.menuBtn.addEventListener('click', () => this.showMenu());
    this.resetBtn.addEventListener('click', () => this.restartGame());
  }

  init(): void {
    this.showMenu();
    this.menuBtn.style.display = 'inline-block';
  }

  showMenu() {
    this.menu.show();
    this.container.classList.add('blurred');
    if (this.activeGame && this.activeGame.isAutoPlaying) {
        this.activeGame.isAutoPlaying = false;
    }
  }

  hideMenu() {
    this.menu.hide();
    this.container.classList.remove('blurred');
  }

  clearBoard() {
    if (this.activeGameUI) {
        this.activeGameUI.teardown();
        this.activeGameUI = null;
    }
    this.activeGame = null;

    const cards = document.querySelectorAll('.card');
    cards.forEach(c => c.remove());
    this.msgOverlay.classList.remove('visible');
    if(this.centerMsg) this.centerMsg.classList.remove('visible');
    
    this.p1Deck.style.visibility = 'visible';
    this.p2Deck.style.visibility = 'visible';
    this.drawBtn.style.display = 'none';
    this.hitBtn.style.display = 'none';
    this.standBtn.style.display = 'none';
    this.autoPlayBtn.style.display = 'none';
    
    // Hide extra dynamic buttons
    const doubleBtn = document.getElementById('btn-double');
    if (doubleBtn) doubleBtn.style.display = 'none';
    const splitBtn = document.getElementById('btn-split');
    if (splitBtn) splitBtn.style.display = 'none';

    const bacDeal = document.getElementById('btn-bac-deal');
    if (bacDeal) bacDeal.style.display = 'none';
    const bacPlayer = document.getElementById('btn-bac-player');
    if (bacPlayer) bacPlayer.style.display = 'none';
    const bacBanker = document.getElementById('btn-bac-banker');
    if (bacBanker) bacBanker.style.display = 'none';
    const bacTie = document.getElementById('btn-bac-tie');
    if (bacTie) bacTie.style.display = 'none';
    const bacChips = document.getElementById('bac-chips');
    if (bacChips) bacChips.style.display = 'none';

    const hlHigher = document.getElementById('btn-higher');
    if (hlHigher) hlHigher.style.display = 'none';
    const hlLower = document.getElementById('btn-lower');
    if (hlLower) hlLower.style.display = 'none';
    const hlCashout = document.getElementById('btn-hl-cashout');
    if (hlCashout) hlCashout.style.display = 'none';

    const vpDealDraw = document.getElementById('btn-vp-dealdraw');
    if (vpDealDraw) vpDealDraw.style.display = 'none';

    this.p1Name.textContent = 'Player 1';
    this.p2Name.textContent = 'Player 2';
  }

  startGame(type: 'war' | 'blackjack' | 'baccarat' | 'highlow' | 'videopoker') {
    this.hideMenu();
    this.clearBoard();
    this.resetBtn.style.display = 'inline-block';
    this.menuBtn.style.display = 'inline-block';

    // Play initial shuffle sound
    this.audio.init();
    if (this.settings.soundEnabled) {
        this.audio.playShuffle();
    }

    switch (type) {
        case 'war':
            this.activeGame = new WarGame(new Player('Player 1'), new Player('Player 2'));
            this.activeGameUI = new WarUI(
                this.container, this.audio, this.settings, this.vfx,
                this.p1Deck, this.p2Deck, this.p1Slot, this.p2Slot,
                this.p1Score, this.p2Score, this.warBadge,
                this.drawBtn, this.autoPlayBtn,
                (msg) => this.showGameOver(msg)
            );
            this.activeGameUI.init(this.activeGame);
            this.activeGame.start();
            break;

        case 'blackjack':
            this.activeGame = new BlackjackGame();
            this.p1Name.textContent = 'You';
            this.p2Name.textContent = 'Dealer';
            this.p1Deck.style.visibility = 'hidden';
            this.p2Deck.style.visibility = 'hidden';

            this.activeGameUI = new BlackjackUI(
                this.container, this.audio, this.settings, this.vfx,
                this.p1Slot, this.p2Slot, this.p1Score, this.p2Score,
                this.hitBtn, this.standBtn, this.controlsContainer,
                (msg) => this.showGameOver(msg)
            );
            this.activeGameUI.init(this.activeGame);
            this.activeGame.start();
            break;

        case 'baccarat':
            this.activeGame = new BaccaratGame();
            this.p1Name.textContent = 'Player';
            this.p2Name.textContent = 'Banker';
            this.p1Deck.style.visibility = 'hidden';
            this.p2Deck.style.visibility = 'hidden';

            this.activeGameUI = new BaccaratUI(
                this.container, this.audio, this.settings,
                this.p1Slot, this.p2Slot, this.p1Score, this.p2Score,
                this.controlsContainer,
                (msg) => this.showMessage(msg)
            );
            this.activeGameUI.init(this.activeGame);
            this.activeGame.start();
            break;

        case 'highlow':
            this.activeGame = new HighLowGame();
            this.p1Name.textContent = 'Current';
            this.p2Name.textContent = 'Deck';
            this.p1Deck.style.visibility = 'hidden';

            this.activeGameUI = new HighLowUI(
                this.container, this.audio, this.settings,
                this.p1Slot, this.p1Score, this.p2Score,
                this.controlsContainer,
                (msg) => this.showMessage(msg)
            );
            this.activeGameUI.init(this.activeGame);
            this.activeGame.start();
            break;

        case 'videopoker':
            this.activeGame = new VideoPokerGame();
            this.p1Name.textContent = 'Player';
            this.p2Name.textContent = 'Video Poker';
            this.p1Deck.style.visibility = 'hidden';
            this.p2Deck.style.visibility = 'hidden';

            this.activeGameUI = new VideoPokerUI(
                this.container, this.audio, this.settings, this.vfx,
                this.p1Slot, this.p1Score, this.p2Score,
                this.controlsContainer,
                (msg) => this.showMessage(msg)
            );
            this.activeGameUI.init(this.activeGame);
            this.activeGame.start();
            break;
    }
  }

  restartGame() {
    if (this.activeGame instanceof WarGame) this.startGame('war');
    else if (this.activeGame instanceof BlackjackGame) this.startGame('blackjack');
    else if (this.activeGame instanceof BaccaratGame) this.startGame('baccarat');
    else if (this.activeGame instanceof HighLowGame) this.startGame('highlow');
    else if (this.activeGame instanceof VideoPokerGame) this.startGame('videopoker');
  }

  private showGameOver(message: string) {
    this.msgOverlay.innerHTML = `
        <div class="modal-content" style="pointer-events: auto;">
          <h1>Game Over!</h1>
          <h2>${message}</h2>
          <button id="overlay-reset-btn" class="btn primary" style="margin-top: 20px;">Play Again</button>
        </div>
    `;
    this.msgOverlay.classList.add('visible');

    const btn = document.getElementById('overlay-reset-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            this.msgOverlay.classList.remove('visible');
            this.restartGame();
        });
    }

    if (this.settings.soundEnabled) {
        this.audio.playGameWin();
    }
  }

  private showMessage(msg: string) {
      if (!this.centerMsg) return;
      if (msg) {
          this.centerMsg.textContent = msg;
          this.centerMsg.classList.add('visible');
      } else {
          this.centerMsg.classList.remove('visible');
      }
  }
}
