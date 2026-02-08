import { GameController } from '../engine/GameController.js';
import { WarGame, RoundResult, WarEvent } from '../games/WarGame.js';
import { BlackjackGame, BlackjackGameState } from '../games/BlackjackGame.js';
import { BaccaratGame, BaccaratGameState } from '../games/BaccaratGame.js';
import { HighLowGame, HighLowGameState } from '../games/HighLowGame.js';
import { AudioManager } from '../core/AudioManager.js';
import { Card } from '../core/Card.js';
import { Player } from '../core/Player.js';
import { Menu } from './Menu.js';
import { Settings } from './Settings.js';

export class UI {
  // Game State
  private gameController: GameController;
  private menu: Menu;
  private settings: Settings;
  private isAnimating: boolean = false;
  private activeListeners: { event: string, cb: any }[] = [];

  // Core DOM Elements
  private container: HTMLElement;
  private p1Deck: HTMLElement;
  private p2Deck: HTMLElement;
  private p1Slot: HTMLElement;
  private p2Slot: HTMLElement;
  private p1Score: HTMLElement;
  private p2Score: HTMLElement;
  private p1Name: HTMLElement | null; // From upgrade branch
  private p2Name: HTMLElement | null; // From upgrade branch
  private msgOverlay: HTMLElement;
  private warBadge: HTMLElement;
  private centerMsg: HTMLElement | null;

  // Control Containers (From upgrade branch)
  private controlsContainer: HTMLElement;
  private controlsWar: HTMLElement | null;
  private controlsBJ: HTMLElement | null;
  private controlsBac: HTMLElement | null;
  private controlsHL: HTMLElement | null;

  // Dynamic Buttons (From main branch)
  private drawBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private hitBtn: HTMLButtonElement;
  private standBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;
  private autoPlayBtn: HTMLButtonElement | null = null;

  constructor(private audio: AudioManager) {
    this.gameController = new GameController();
    this.menu = new Menu();
    this.settings = new Settings();

    // Cache Elements
    this.container = document.getElementById('game-container')!;
    this.controlsContainer = document.getElementById('controls')!;
    this.p1Deck = document.getElementById('p1-deck')!;
    this.p2Deck = document.getElementById('p2-deck')!;
    this.p1Slot = document.getElementById('p1-slot')!;
    this.p2Slot = document.getElementById('p2-slot')!;
    this.p1Score = document.getElementById('p1-score')!;
    this.p2Score = document.getElementById('p2-score')!;
    this.p1Name = document.getElementById('p1-name');
    this.p2Name = document.getElementById('p2-name');
    this.msgOverlay = document.getElementById('message-overlay')!;
    this.warBadge = document.getElementById('war-badge')!;
    this.centerMsg = document.getElementById('center-message');

    // Cache specific control groups if they exist in HTML
    this.controlsWar = document.getElementById('controls-war');
    this.controlsBJ = document.getElementById('controls-blackjack');
    this.controlsBac = document.getElementById('controls-baccarat');
    this.controlsHL = document.getElementById('controls-highlow');

    // Create/Cache Buttons
    this.drawBtn = (document.getElementById('draw-btn') as HTMLButtonElement) || this.createButton('Draw', 'draw-btn', 'primary');
    this.resetBtn = (document.getElementById('reset-btn') as HTMLButtonElement) || this.createButton('Reset', 'reset-btn', 'secondary');
    this.hitBtn = (document.getElementById('btn-hit') as HTMLButtonElement) || this.createButton('Hit', 'btn-hit', 'primary');
    this.standBtn = (document.getElementById('btn-stand') as HTMLButtonElement) || this.createButton('Stand', 'btn-stand', 'secondary');
    this.menuBtn = (document.getElementById('btn-menu') as HTMLButtonElement) || this.createButton('Menu', 'btn-menu', 'secondary');

    // Menu Wiring
    this.menu.onWarSelect = () => this.startWar();
    this.menu.onBlackjackSelect = () => this.startBlackjack();
    this.menu.onBaccaratSelect = () => this.startBaccarat();
    this.menu.onHighLowSelect = () => this.startHighLow();
    this.menu.onSettingsSelect = () => this.settings.show();

    // Default Listeners
    this.menuBtn.addEventListener('click', () => this.showMenu());
    this.resetBtn.addEventListener('click', () => this.restartGame());
  }

  createButton(text: string, id: string, className: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = text;
    btn.className = `btn ${className}`;
    btn.style.display = 'none';
    this.controlsContainer.appendChild(btn);
    return btn;
  }

  init(): void {
    this.showMenu();
    this.createAutoPlayButton();
  }

  // --- MODE MANAGEMENT ---

  setGameMode(mode: 'war' | 'blackjack' | 'baccarat' | 'highlow') {
    // Hide all specific control groups first
    [this.controlsWar, this.controlsBJ, this.controlsBac, this.controlsHL].forEach(c => c?.classList.add('hidden'));
    
    // Hide dynamic buttons by default
    [this.drawBtn, this.hitBtn, this.standBtn, this.autoPlayBtn].forEach(b => {
        if(b) b.style.display = 'none';
    });

    // Reset Names
    if (this.p1Name) this.p1Name.textContent = 'Player 1';
    if (this.p2Name) this.p2Name.textContent = 'Player 2';
    
    // Visiblity defaults
    this.p1Deck.style.visibility = 'visible';
    this.p2Deck.style.visibility = 'visible';

    // Per-mode setup
    switch (mode) {
        case 'war':
            this.controlsWar?.classList.remove('hidden');
            this.drawBtn.style.display = 'inline-block';
            if (this.autoPlayBtn) this.autoPlayBtn.style.display = 'inline-block';
            break;
        case 'blackjack':
            this.controlsBJ?.classList.remove('hidden');
            this.hitBtn.style.display = 'inline-block';
            this.standBtn.style.display = 'inline-block';
            if (this.p1Name) this.p1Name.textContent = 'You';
            if (this.p2Name) this.p2Name.textContent = 'Dealer';
            this.p1Deck.style.visibility = 'hidden';
            this.p2Deck.style.visibility = 'hidden';
            break;
        case 'baccarat':
            this.controlsBac?.classList.remove('hidden');
            if (this.p1Name) this.p1Name.textContent = 'Player';
            if (this.p2Name) this.p2Name.textContent = 'Banker';
            this.p1Deck.style.visibility = 'hidden';
            this.p2Deck.style.visibility = 'hidden';
            break;
        case 'highlow':
            this.controlsHL?.classList.remove('hidden');
            if (this.p1Name) this.p1Name.textContent = 'Current';
            if (this.p2Name) this.p2Name.textContent = 'Deck';
            this.p1Deck.style.visibility = 'hidden';
            break;
    }
  }

  showMenu() {
    this.menu.show();
    this.container.classList.add('blurred');
    if (this.gameController.currentGame instanceof WarGame) {
        (this.gameController.currentGame as WarGame).isAutoPlaying = false;
    }
  }

  hideMenu() {
    this.menu.hide();
    this.container.classList.remove('blurred');
  }

  clearBoard() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(c => c.remove());
    this.msgOverlay.classList.remove('visible');
    if(this.centerMsg) this.centerMsg.classList.remove('visible');
    this.isAnimating = false;
    this.activeListeners = []; 
    this.resetBtn.style.display = 'inline-block';
    this.menuBtn.style.display = 'inline-block';
  }

  restartGame() {
    if (this.gameController.currentGame instanceof WarGame) this.startWar();
    else if (this.gameController.currentGame instanceof BlackjackGame) this.startBlackjack();
    else if (this.gameController.currentGame instanceof BaccaratGame) this.startBaccarat();
    else if (this.gameController.currentGame instanceof HighLowGame) this.startHighLow();
  }

  // --- WAR IMPLEMENTATION ---

  startWar() {
    this.hideMenu();
    this.clearBoard();
    this.setGameMode('war');

    const p1 = new Player('Player 1');
    const p2 = new Player('Player 2');
    const game = new WarGame(p1, p2);

    this.gameController.setGame(game);
    this.setupWarUI(game);
    game.start();
  }

  setupWarUI(game: WarGame) {
    this.drawBtn.onclick = () => {
        if (!this.isAnimating) {
            this.audio.init();
            game.playRound();
        }
    };

    game.on('game-start', () => this.updateWarScores(game));
    game.on('round-result', (result: RoundResult) => this.onWarRoundResult(game, result));
    game.on('game-over', (data: { winner: Player | null }) => this.showGameOver(data.winner ? `${data.winner.name} Wins!` : 'Tie!'));
    game.on('autoplay-change', (active: boolean) => {
        if (this.autoPlayBtn) {
            this.autoPlayBtn.textContent = active ? 'Stop Auto' : 'Auto Play';
            this.autoPlayBtn.classList.toggle('active', active);
        }
        if (active && !this.isAnimating) game.playRound();
    });
  }

  async onWarRoundResult(game: WarGame, result: RoundResult) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.drawBtn.disabled = true;

    const p1CardNode = this.createCardNode(result.p1Card);
    const p2CardNode = this.createCardNode(result.p2Card);

    this.placeAt(p1CardNode, this.p1Deck);
    this.placeAt(p2CardNode, this.p2Deck);
    this.container.appendChild(p1CardNode);
    this.container.appendChild(p2CardNode);
    void p1CardNode.offsetHeight; // Force reflow

    this.audio.playDeal();
    await Promise.all([
      this.moveTo(p1CardNode, this.p1Slot),
      this.moveTo(p2CardNode, this.p2Slot)
    ]);

    this.audio.playFlip();
    p1CardNode.classList.add('flipped');
    p2CardNode.classList.add('flipped');

    await this.wait(800);

    const activeCards = [p1CardNode, p2CardNode];
    if (result.isWar) {
        await this.animateWar(result.warEvents, activeCards);
    }

    if (!result.gameEnded) {
        let roundWinner = result.winner;
        if (result.isWar && result.warEvents.length > 0) {
            roundWinner = result.warEvents[result.warEvents.length - 1].winner;
        }
        if (roundWinner) {
            const targetDeck = roundWinner === game.player1 ? this.p1Deck : this.p2Deck;
            this.audio.playRoundWin();
            await this.animateToDeck(activeCards, targetDeck);
        }
    }

    this.updateWarScores(game);

    if (!result.gameEnded) {
        this.isAnimating = false;
        this.drawBtn.disabled = false;
        if (game.isAutoPlaying) {
            await this.wait(500);
            game.playRound();
        }
    }
  }

  updateWarScores(game: WarGame) {
    this.p1Score.textContent = `Wins: ${game.player1.wins} | Cards: ${game.player1.cardCount}`;
    this.p2Score.textContent = `Wins: ${game.player2.wins} | Cards: ${game.player2.cardCount}`;
  }

  // --- BLACKJACK IMPLEMENTATION ---

  startBlackjack() {
    this.hideMenu();
    this.clearBoard();
    this.setGameMode('blackjack');

    const game = new BlackjackGame();
    this.gameController.setGame(game);
    this.setupBlackjackUI(game);
    game.start();
  }

  setupBlackjackUI(game: BlackjackGame) {
    this.hitBtn.onclick = () => { this.audio.init(); game.hit(); };
    this.standBtn.onclick = () => { this.audio.init(); game.stand(); };

    game.on('deal', (data) => {
        this.renderBlackjackHands(game, data.playerHand, data.dealerHand);
        this.updateBlackjackScores(game);
    });

    game.on('update-hand', (data) => {
        this.renderHand(data.playerHand, this.p1Slot, 30);
        this.updateBlackjackScores(game);
    });

    game.on('dealer-reveal', (data) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateBlackjackScores(game);
    });

    game.on('dealer-hit', (data) => {
        this.audio.playDeal();
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateBlackjackScores(game);
    });

    game.on('game-over', (data) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateBlackjackScores(game);
        this.showGameOver(data.message);
    });
  }

  renderBlackjackHands(game: BlackjackGame, pHand: Card[], dHand: (Card|null)[]) {
    this.renderHand(pHand, this.p1Slot, 30);
    this.renderHand(dHand, this.p2Slot, 30);
    this.audio.playDeal();
  }

  updateBlackjackScores(game: BlackjackGame) {
    const pScore = game.calculateScore(game.playerHand);
    this.p1Score.textContent = `Score: ${pScore}`;
    if (game.state === 'playing') {
        this.p2Score.textContent = `Score: ?`;
    } else {
        const dScore = game.calculateScore(game.dealerHand);
        this.p2Score.textContent = `Score: ${dScore}`;
    }
  }

  // --- BACCARAT IMPLEMENTATION ---

  startBaccarat() {
    this.hideMenu();
    this.clearBoard();
    this.setGameMode('baccarat');
    
    const game = new BaccaratGame();
    this.gameController.setGame(game);
    
    const dealBtn = document.getElementById('btn-bac-deal');
    if(dealBtn) dealBtn.onclick = () => game.playRound();

    game.on('update', (state: BaccaratGameState) => {
        this.renderHand(state.playerHand, this.p1Slot, 30);
        this.renderHand(state.bankerHand, this.p2Slot, 30);
        this.p1Score.textContent = `Score: ${state.playerScore}`;
        this.p2Score.textContent = `Score: ${state.bankerScore}`;
        if(state.message) this.showMessage(state.message);
    });
  }

  // --- HIGH LOW IMPLEMENTATION ---

  startHighLow() {
    this.hideMenu();
    this.clearBoard();
    this.setGameMode('highlow');

    const game = new HighLowGame();
    this.gameController.setGame(game);

    const highBtn = document.getElementById('btn-higher');
    const lowBtn = document.getElementById('btn-lower');
    if(highBtn) highBtn.onclick = () => game.guess('higher');
    if(lowBtn) lowBtn.onclick = () => game.guess('lower');

    game.on('update', (state: HighLowGameState) => {
        // Clear slots
        const existing = document.querySelectorAll('.card');
        existing.forEach(e => e.remove());

        if (state.currentCard) {
            const el = this.createCardNode(state.currentCard);
            el.classList.add('flipped');
            this.container?.appendChild(el);
            this.placeAt(el, this.p1Slot);
        }
        
        this.p1Score.textContent = `Score: ${state.score}`;
        this.p2Score.textContent = `Cards Left: ${game.deck.length}`;
        
        if (state.message) this.showMessage(state.message);
        if (state.result === 'WIN') this.audio.playGameWin();
    });

    game.start();
  }

  // --- COMMON HELPERS ---

  renderHand(hand: (Card|null)[], targetSlot: HTMLElement, offsetStep: number) {
    const slotId = targetSlot.id;
    // Clear existing cards for this specific slot
    const existing = document.querySelectorAll(`.card[data-slot="${slotId}"]`);
    existing.forEach(e => e.remove());

    hand.forEach((card, index) => {
        let cardNode: HTMLElement;
        if (card) {
            cardNode = this.createCardNode(card);
            cardNode.classList.add('flipped');
        } else {
            // Face down card
            const dummy = new Card('A', 'spades'); 
            cardNode = this.createCardNode(dummy); 
        }

        cardNode.dataset.slot = slotId;
        this.container.appendChild(cardNode);
        this.placeAt(cardNode, targetSlot);

        // Calculate offset to center the hand
        const offsetX = (index - (hand.length-1)/2) * offsetStep;
        const rect = targetSlot.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        // +30 to approx center card in slot width
        cardNode.style.left = (rect.left - containerRect.left + offsetX + 30) + 'px'; 
        cardNode.style.top = (rect.top - containerRect.top) + 'px';
    });
  }

  createCardNode(card: Card): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-face card-back">${Card.getBackSVG()}</div>
      <div class="card-face card-front">${card.getSVG()}</div>
    `;
    return el;
  }

  private createAutoPlayButton() {
    if (this.controlsContainer) {
      this.autoPlayBtn = document.createElement('button');
      this.autoPlayBtn.id = 'autoplay-btn';
      this.autoPlayBtn.textContent = 'Auto Play';
      this.autoPlayBtn.className = 'btn secondary';
      this.autoPlayBtn.style.display = 'none';
      this.autoPlayBtn.addEventListener('click', () => {
          if (this.gameController.currentGame instanceof WarGame) {
              (this.gameController.currentGame as WarGame).toggleAutoPlay();
          }
      });
      this.controlsContainer.appendChild(this.autoPlayBtn);
    }
  }

  private async animateWar(warEvents: WarEvent[], activeCards: HTMLElement[]) {
    this.warBadge.classList.add('visible');
    this.audio.playWar();
    await this.wait(1000);
    this.warBadge.classList.remove('visible');

    for (const event of warEvents) {
      for (let i = 0; i < 3; i++) {
        if (i >= event.p1Hidden.length) break;
        const c1 = this.createCardNode(event.p1Hidden[i]);
        const c2 = this.createCardNode(event.p2Hidden[i]);

        this.placeAt(c1, this.p1Deck);
        this.placeAt(c2, this.p2Deck);
        this.container.appendChild(c1);
        this.container.appendChild(c2);
        activeCards.push(c1, c2);

        const offset = (i + 1) * 10;
        this.moveTo(c1, this.p1Slot, offset, offset);
        this.moveTo(c2, this.p2Slot, offset, offset);

        this.audio.playDeal();
        await this.wait(200);
      }

      const up1 = this.createCardNode(event.p1Up);
      const up2 = this.createCardNode(event.p2Up);

      this.placeAt(up1, this.p1Deck);
      this.placeAt(up2, this.p2Deck);
      this.container.appendChild(up1);
      this.container.appendChild(up2);
      activeCards.push(up1, up2);

      this.moveTo(up1, this.p1Slot, 50, 50);
      this.moveTo(up2, this.p2Slot, 50, 50);
      await this.wait(300);

      this.audio.playFlip();
      up1.classList.add('flipped');
      up2.classList.add('flipped');

      await this.wait(1000);
    }
  }

  private async animateToDeck(cards: HTMLElement[], targetDeck: HTMLElement) {
    const promises = cards.map(c => {
      return this.moveTo(c, targetDeck).then(() => {
        c.style.opacity = '0';
        setTimeout(() => c.remove(), 500);
      });
    });
    await Promise.all(promises);
  }

  private showGameOver(message: string) {
    this.msgOverlay.innerHTML = `<h1>Game Over!</h1><h2>${message}</h2><p>Click reset (or New Game) to play again.</p>`;
    this.msgOverlay.classList.add('visible');
    if (this.settings.soundEnabled) {
        this.audio.playGameWin();
    }
    if(this.drawBtn) this.drawBtn.disabled = true;
    if(this.hitBtn) this.hitBtn.disabled = true;
    if(this.standBtn) this.standBtn.disabled = true;
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

  private placeAt(element: HTMLElement, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    element.style.left = (rect.left - containerRect.left) + 'px';
    element.style.top = (rect.top - containerRect.top) + 'px';
  }

  private moveTo(element: HTMLElement, target: HTMLElement, offsetX = 0, offsetY = 0) {
    return new Promise<void>(resolve => {
      const rect = target.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      const duration = 650 / this.settings.animationSpeed;

      element.style.transition = `transform ${duration}ms, left ${duration}ms, top ${duration}ms`;
      element.style.left = (rect.left - containerRect.left + offsetX) + 'px';
      element.style.top = (rect.top - containerRect.top + offsetY) + 'px';

      this.audio.enabled = this.settings.soundEnabled;

      element.addEventListener('transitionend', () => resolve(), { once: true });
      setTimeout(resolve, duration);
    });
  }

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms / this.settings.animationSpeed));
  }
}