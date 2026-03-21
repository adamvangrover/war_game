import { IGameUI } from './IGameUI.js';
import { WarGame, WarResult, WarEvent } from '../../games/WarGame.js';
import { Card } from '../../core/Card.js';
import { Player } from '../../core/Player.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';
import { VisualEffects } from '../VisualEffects.js';

export class WarUI implements IGameUI {
  private game!: WarGame;
  private isAnimating: boolean = false;
  private listeners: { event: string, cb: any }[] = [];

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private vfx: VisualEffects,
    private p1Deck: HTMLElement,
    private p2Deck: HTMLElement,
    private p1Slot: HTMLElement,
    private p2Slot: HTMLElement,
    private p1Score: HTMLElement,
    private p2Score: HTMLElement,
    private warBadge: HTMLElement,
    private drawBtn: HTMLButtonElement,
    private autoPlayBtn: HTMLButtonElement,
    private showGameOver: (msg: string) => void
  ) {}

  init(game: WarGame): void {
    this.game = game;
    this.isAnimating = false;
    this.listeners = [];

    // Setup UI elements
    this.drawBtn.style.display = 'inline-block';
    this.drawBtn.disabled = false;
    this.autoPlayBtn.style.display = 'inline-block';
    this.p1Deck.style.visibility = 'visible';
    this.p2Deck.style.visibility = 'visible';

    // Bind events
    this.drawBtn.onclick = () => {
        if (!this.isAnimating) {
            this.audio.init();
            this.game.playRound();
        }
    };

    this.autoPlayBtn.onclick = () => {
        this.game.toggleAutoPlay();
    };

    const onStart = () => this.updateScores();
    const onRoundResult = (result: WarResult) => this.onRoundResult(result);
    const onGameOver = (data: { winner: Player | null }) => this.showGameOver(data.winner ? `${data.winner.name} Wins!` : 'Tie!');
    const onAutoPlayChange = (active: boolean) => {
        this.autoPlayBtn.textContent = active ? 'Stop Auto' : 'Auto Play';
        this.autoPlayBtn.classList.toggle('active', active);
        if (active && !this.isAnimating) this.game.playRound();
    };

    this.game.on('game-start', onStart);
    this.game.on('round-result', onRoundResult);
    this.game.on('game-over', onGameOver);
    this.game.on('autoplay-change', onAutoPlayChange);

    this.listeners.push(
        { event: 'game-start', cb: onStart },
        { event: 'round-result', cb: onRoundResult },
        { event: 'game-over', cb: onGameOver },
        { event: 'autoplay-change', cb: onAutoPlayChange }
    );
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.drawBtn.onclick = null;
    this.autoPlayBtn.onclick = null;
    this.drawBtn.style.display = 'none';
    this.autoPlayBtn.style.display = 'none';
    this.isAnimating = false;
  }

  updateScores() {
    this.p1Score.textContent = `Wins: ${this.game.player1.wins} | Cards: ${this.game.player1.cardCount}`;
    this.p2Score.textContent = `Wins: ${this.game.player2.wins} | Cards: ${this.game.player2.cardCount}`;
  }

  async onRoundResult(result: WarResult) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.drawBtn.disabled = true;

    const p1CardNode = this.createCardNode(result.p1Card);
    const p2CardNode = this.createCardNode(result.p2Card);

    this.placeAt(p1CardNode, this.p1Deck);
    this.placeAt(p2CardNode, this.p2Deck);
    this.container.appendChild(p1CardNode);
    this.container.appendChild(p2CardNode);
    // force reflow
    void p1CardNode.offsetHeight;

    this.audio.playDeal();
    await Promise.all([
      this.moveTo(p1CardNode, this.p1Slot),
      this.moveTo(p2CardNode, this.p2Slot)
    ]);

    this.audio.playFlip();
    p1CardNode.classList.add('flipped');
    p2CardNode.classList.add('flipped');

    await this.wait(600);

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
            const targetDeck = roundWinner === this.game.player1 ? this.p1Deck : this.p2Deck;
            this.audio.playRoundWin();

            if (roundWinner === this.game.player1 && !this.game.isAutoPlaying) {
                const rect = targetDeck.getBoundingClientRect();
                this.vfx.createCoinShower(rect.left + rect.width / 2, rect.top, 20);
            }

            await this.animateToDeck(activeCards, targetDeck);
        }
    }

    this.updateScores();

    if (!result.gameEnded) {
        this.isAnimating = false;
        this.drawBtn.disabled = false;
        if (this.game.isAutoPlaying) {
            await this.wait(300);
            this.game.playRound();
        }
    }
  }

  createCardNode(card: Card | undefined): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card';
    if (card) {
        el.innerHTML = `
        <div class="card-face card-back">${Card.getBackSVG()}</div>
        <div class="card-face card-front">${card.getSVG()}</div>
        `;
    } else {
        // Fallback or hidden
        el.innerHTML = `<div class="card-face card-back">${Card.getBackSVG()}</div>`;
    }
    return el;
  }

  private async animateWar(warEvents: WarEvent[], activeCards: HTMLElement[]) {
    this.warBadge.classList.add('visible');
    this.vfx.screenShake();
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
        await this.wait(150);
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
      await this.wait(200);

      this.audio.playFlip();
      up1.classList.add('flipped');
      up2.classList.add('flipped');

      await this.wait(800);
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

      element.addEventListener('transitionend', () => resolve(), { once: true });
      setTimeout(resolve, duration);
    });
  }

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms / this.settings.animationSpeed));
  }
}
