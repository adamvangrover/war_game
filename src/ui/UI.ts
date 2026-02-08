import { GameController } from '../engine/GameController';
import { WarGame, RoundResult, WarEvent } from '../engine/WarGame';
import { BlackjackGame, BlackjackResult } from '../engine/BlackjackGame';
import { AudioManager } from './AudioManager';
import { Card } from '../core/Card';
import { Player } from '../core/Player';
import { Menu } from './Menu';
import { Settings } from './Settings';

export class UI {
  private p1Deck: HTMLElement;
  private p2Deck: HTMLElement;
  private p1Slot: HTMLElement;
  private p2Slot: HTMLElement;

  // Controls
  private controlsContainer: HTMLElement;
  private drawBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private hitBtn: HTMLButtonElement;
  private standBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;
  private autoPlayBtn: HTMLButtonElement | null = null;

  private msgOverlay: HTMLElement;
  private warBadge: HTMLElement;
  private p1Score: HTMLElement;
  private p2Score: HTMLElement;
  private p1Rounds: HTMLElement;
  private p2Rounds: HTMLElement;
  private container: HTMLElement;

  private isAnimating: boolean = false;
  private gameController: GameController;
  private menu: Menu;
  private settings: Settings;

  // State tracking for cleanup
  private activeListeners: { event: string, cb: any }[] = [];

  constructor(private audio: AudioManager) {
    this.gameController = new GameController();
    this.menu = new Menu();
    this.settings = new Settings();

    this.p1Deck = document.getElementById('p1-deck')!;
    this.p2Deck = document.getElementById('p2-deck')!;
    this.p1Slot = document.getElementById('p1-slot')!;
    this.p2Slot = document.getElementById('p2-slot')!;
    this.container = document.getElementById('game-container')!;
    this.controlsContainer = document.getElementById('controls')!;

    // Existing controls
    this.drawBtn = document.getElementById('draw-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

    // Create new controls if missing (or we can add them to index.html later)
    this.hitBtn = this.createButton('Hit', 'btn-hit', 'primary');
    this.standBtn = this.createButton('Stand', 'btn-stand', 'secondary');
    this.menuBtn = this.createButton('Menu', 'btn-menu', 'secondary');

    this.msgOverlay = document.getElementById('message-overlay')!;
    this.warBadge = document.getElementById('war-badge')!;
    this.p1Score = document.getElementById('p1-score')!;
    this.p2Score = document.getElementById('p2-score')!;
    this.p1Rounds = document.getElementById('p1-rounds')!;
    this.p2Rounds = document.getElementById('p2-rounds')!;

    // Menu wiring
    this.menu.onWarSelect = () => this.startWar();
    this.menu.onBlackjackSelect = () => this.startBlackjack();
    this.menu.onSettingsSelect = () => this.settings.show();

    // Settings wiring
    this.settings.onClose = () => {}; // Optional logic on close

    // Default wiring
    this.menuBtn.addEventListener('click', () => this.showMenu());
    this.resetBtn.addEventListener('click', () => this.restartGame());
  }

  createButton(text: string, id: string, className: string): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = text;
      btn.className = `btn ${className}`;
      btn.style.display = 'none'; // Hidden by default
      this.controlsContainer.appendChild(btn);
      return btn;
  }

  init(): void {
    this.showMenu();
    this.createAutoPlayButton();
  }

  showMenu() {
      this.menu.show();
      this.container.classList.add('blurred');
      if (this.gameController.currentGame instanceof WarGame) {
          (this.gameController.currentGame as WarGame).isAutoPlaying = false; // Stop auto play
      }
  }

  hideMenu() {
      this.menu.hide();
      this.container.classList.remove('blurred');
  }

  restartGame() {
      if (this.gameController.currentGame instanceof WarGame) {
          this.startWar();
      } else if (this.gameController.currentGame instanceof BlackjackGame) {
          this.startBlackjack();
      }
  }

  startWar() {
      this.hideMenu();
      this.clearBoard();

      const p1 = new Player('Player 1');
      const p2 = new Player('Player 2');
      const game = new WarGame(p1, p2);

      this.gameController.setGame(game);
      this.setupWarUI(game);
      game.start();
  }

  startBlackjack() {
      this.hideMenu();
      this.clearBoard();

      const game = new BlackjackGame();
      this.gameController.setGame(game);
      this.setupBlackjackUI(game);
      game.start();
  }

  clearBoard() {
      const cards = document.querySelectorAll('.card');
      cards.forEach(c => c.remove());
      this.msgOverlay.classList.remove('visible');
      this.isAnimating = false;
      this.activeListeners.forEach(l => {
          // Ideally we off() from the old game, but we create new instances so it's fine.
      });
      this.activeListeners = [];

      // Reset UI visibility
      this.drawBtn.style.display = 'none';
      this.resetBtn.style.display = 'inline-block';
      this.hitBtn.style.display = 'none';
      this.standBtn.style.display = 'none';
      if (this.autoPlayBtn) this.autoPlayBtn.style.display = 'none';
      this.menuBtn.style.display = 'inline-block';
  }

  // --- WAR UI ---

  setupWarUI(game: WarGame) {
      this.drawBtn.style.display = 'inline-block';
      if (this.autoPlayBtn) this.autoPlayBtn.style.display = 'inline-block';

      // Update info text
      document.querySelector('#p2-zone h3')!.textContent = 'Player 2';
      document.querySelector('#p1-zone h3')!.textContent = 'Player 1';

      // Event Listeners
      this.drawBtn.onclick = () => {
          if (!this.isAnimating) {
              this.audio.init();
              game.playRound();
          }
      };

      game.on('game-start', () => {
          this.updateWarScores(game);
      });

      game.on('round-result', (result: RoundResult) => this.onWarRoundResult(game, result));
      game.on('game-over', (data: { winner: Player | null }) => this.showGameOver(data.winner ? `${data.winner.name} Wins!` : 'Tie!'));
      game.on('autoplay-change', (active: boolean) => {
           if (this.autoPlayBtn) {
              this.autoPlayBtn.textContent = active ? 'Stop Auto' : 'Auto Play';
              this.autoPlayBtn.classList.toggle('active', active);
           }
           if (active && !this.isAnimating) {
              game.playRound();
           }
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

    await this.wait(800 / this.settings.animationSpeed);

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
        await this.wait(500 / this.settings.animationSpeed);
        game.playRound();
      }
    }
  }

  updateWarScores(game: WarGame) {
      this.p1Score.textContent = `Wins: ${game.player1.wins} | Cards: ${game.player1.cardCount}`;
      this.p2Score.textContent = `Wins: ${game.player2.wins} | Cards: ${game.player2.cardCount}`;
      this.p1Rounds.textContent = `Rounds: ${game.player1.roundsWon}`;
      this.p2Rounds.textContent = `Rounds: ${game.player2.roundsWon}`;
  }

  // --- BLACKJACK UI ---

  setupBlackjackUI(game: BlackjackGame) {
      this.hitBtn.style.display = 'inline-block';
      this.standBtn.style.display = 'inline-block';

      document.querySelector('#p2-zone h3')!.textContent = 'Dealer';
      document.querySelector('#p1-zone h3')!.textContent = 'Player';

      this.hitBtn.onclick = () => {
          this.audio.init();
          game.hit();
      };

      this.standBtn.onclick = () => {
          this.audio.init();
          game.stand();
      };

      game.on('deal', (data) => {
          this.renderBlackjackHands(game, data.playerHand, data.dealerHand);
          this.updateBlackjackScores(game);
      });

      game.on('update-hand', (data) => {
          this.renderBlackjackHands(game, data.playerHand, game.dealerHand); // Only player hand updates?
          // We need to keep dealer hand as is (with hole card if hidden)
          // In update-hand usually only player changes
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

      game.on('game-over', (data: { winner: string, message: string, dealerHand: Card[] }) => {
          this.renderHand(data.dealerHand, this.p2Slot, 30); // Ensure revealed
          this.updateBlackjackScores(game);
          this.showGameOver(data.message);
      });
  }

  renderBlackjackHands(game: BlackjackGame, pHand: Card[], dHand: (Card|null)[]) {
      this.renderHand(pHand, this.p1Slot, 30);
      this.renderHand(dHand, this.p2Slot, 30);
      this.audio.playDeal();
  }

  renderHand(hand: (Card|null)[], targetSlot: HTMLElement, offsetStep: number) {
      // Remove existing cards in this slot area?
      // This is tricky if we are appending to body.
      // Let's identify cards by player/dealer class or tag.
      // For simplicity, we can remove all cards and redraw all state, or track IDs.
      // Simpler: clear all '.card' elements associated with this slot?
      // Since 'placeAt' uses absolute positioning relative to container, we can just remove all cards and redraw.
      // But we shouldn't remove ALL cards if updating one hand.

      // Let's use a tagging system.
      const slotId = targetSlot.id;
      const existing = document.querySelectorAll(`.card[data-slot="${slotId}"]`);
      existing.forEach(e => e.remove());

      hand.forEach((card, index) => {
          let cardNode: HTMLElement;
          if (card) {
             cardNode = this.createCardNode(card);
             cardNode.classList.add('flipped');
          } else {
              // Face down card
              const dummy = new Card('A', 'spades'); // dummy
              cardNode = this.createCardNode(dummy); // Not flipped
          }

          cardNode.dataset.slot = slotId;
          this.container.appendChild(cardNode);

          // Position in slot
          this.placeAt(cardNode, targetSlot);
          // Apply offset
          const offsetX = (index - (hand.length-1)/2) * offsetStep;
          // Center the hand

          // Re-calculate position
          const rect = targetSlot.getBoundingClientRect();
          const containerRect = this.container.getBoundingClientRect();

          cardNode.style.left = (rect.left - containerRect.left + offsetX + 30) + 'px'; // +30 centers approx
          cardNode.style.top = (rect.top - containerRect.top) + 'px';
      });
  }

  updateBlackjackScores(game: BlackjackGame) {
      const pScore = game.calculateScore(game.playerHand);
      // Dealer score: if state is playing, we only know up card?
      // For UI simplicity let's show what we know.
      // If dealer hand has null, show score of up card?
      // Or just hide dealer score until reveal.

      this.p1Rounds.textContent = `Score: ${pScore}`;

      if (game.state === 'playing') {
           this.p2Rounds.textContent = `Score: ?`;
      } else {
           const dScore = game.calculateScore(game.dealerHand);
           this.p2Rounds.textContent = `Score: ${dScore}`;
      }

      // We can hide Wins/Cards stats for BJ or reuse them for chips?
      this.p1Score.textContent = "Player";
      this.p2Score.textContent = "Dealer";
  }

  // --- SHARED ---

  private createAutoPlayButton() {
    const controls = document.querySelector('.controls');
    if (controls) {
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
      controls?.appendChild(this.autoPlayBtn);
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
    this.drawBtn.disabled = true;
    this.hitBtn.disabled = true;
    this.standBtn.disabled = true;
  }

  private createCardNode(card: Card): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-face card-back">${Card.getBackSVG()}</div>
      <div class="card-face card-front">${card.getSVG()}</div>
    `;
    return el;
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

      // Update audio enabled based on settings
      this.audio.enabled = this.settings.soundEnabled;

      element.addEventListener('transitionend', () => resolve(), { once: true });
      setTimeout(resolve, duration);
    });
  }

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms / this.settings.animationSpeed));
  }
}
