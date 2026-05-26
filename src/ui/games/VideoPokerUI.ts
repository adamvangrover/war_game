import { IGameUI } from './IGameUI.js';
import { VideoPokerGame, VideoPokerGameState } from '../../games/VideoPokerGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';
import { VisualEffects } from '../VisualEffects.js';

export class VideoPokerUI implements IGameUI {
  private game!: VideoPokerGame;
  private listeners: { event: string, cb: any }[] = [];

  private dealDrawBtn!: HTMLButtonElement;
  private cardNodes: HTMLElement[] = [];

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private vfx: VisualEffects,
    private handSlot: HTMLElement,
    private creditsScore: HTMLElement,
    private betScore: HTMLElement,
    private controlsContainer: HTMLElement,
    private showMessage: (msg: string) => void
  ) {
      let bBtn = document.getElementById('btn-vp-dealdraw') as HTMLButtonElement;
      if (!bBtn) {
          bBtn = document.createElement('button');
          bBtn.id = 'btn-vp-dealdraw';
          bBtn.className = 'btn primary';
          this.controlsContainer.appendChild(bBtn);
      }
      this.dealDrawBtn = bBtn;
  }

  init(game: VideoPokerGame): void {
    this.game = game;
    this.listeners = [];

    this.dealDrawBtn.style.display = 'inline-block';

    this.dealDrawBtn.onclick = () => {
        this.audio.init();
        if (this.game.state === 'READY' || this.game.state === 'GAME_OVER') {
            this.game.deal();
        } else if (this.game.state === 'DRAWN') {
            this.game.draw();
        }
    };

    const onUpdate = (state: VideoPokerGameState) => {
        this.renderState(state);
    };

    const onDeal = (state: VideoPokerGameState) => {
        this.audio.playDeal();
        this.renderCards(state.hand, state.held);
        this.renderState(state);
    };

    const onGameOver = (state: VideoPokerGameState) => {
        this.renderCards(state.hand, state.held);
        this.renderState(state);

        if (state.winAmount > 0) {
            if (state.winAmount >= 50) {
                this.audio.playJackpotWin();
            } else {
                this.audio.playGameWin();
            }
            const rect = this.handSlot.getBoundingClientRect();

            if (state.message.includes('Flush') || state.message.includes('Four')) {
                 this.vfx.createConfetti(rect.left + rect.width / 2, rect.top, 100);
            } else {
                 this.vfx.createCoinShower(rect.left + rect.width / 2, rect.top, Math.min(50, state.winAmount * 2));
            }
        } else {
            // Optional: Bust sound
        }
    };

    this.game.on('update', onUpdate);
    this.game.on('deal', onDeal);
    this.game.on('game-over', onGameOver);

    this.listeners.push(
        { event: 'update', cb: onUpdate },
        { event: 'deal', cb: onDeal },
        { event: 'game-over', cb: onGameOver }
    );

    // Initial Render
    this.renderState(this.game.getState());
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.dealDrawBtn.style.display = 'none';
    this.dealDrawBtn.onclick = null;
    this.cardNodes.forEach(c => c.remove());
    this.cardNodes = [];
  }

  renderState(state: VideoPokerGameState) {
      if (state.state === 'READY' || state.state === 'GAME_OVER') {
          this.dealDrawBtn.textContent = 'Deal';
      } else {
          this.dealDrawBtn.textContent = 'Draw';
      }

      this.creditsScore.textContent = `Credits: ${state.credits}`;
      this.betScore.textContent = `Bet: ${state.bet}`;
      this.showMessage(state.message);

      // Update held visual state
      this.cardNodes.forEach((node, i) => {
          if (state.held[i]) {
              node.classList.add('held');
          } else {
              node.classList.remove('held');
          }
      });
  }

  renderCards(hand: Card[], held: boolean[]) {
      this.cardNodes.forEach(c => c.remove());
      this.cardNodes = [];

      if (!hand || hand.length === 0) return;

      const baseSpacing = 110;

      hand.forEach((card, i) => {
          const cardNode = this.createCardNode(card);
          cardNode.classList.add('flipped');
          if (held[i]) cardNode.classList.add('held');

          cardNode.dataset.index = i.toString();

          // Click handler for hold
          cardNode.addEventListener('click', () => {
              if (this.game.state === 'DRAWN') {
                  this.audio.playFlip(); // feedback
                  this.game.toggleHold(i);
              }
          });

          this.container.appendChild(cardNode);
          this.cardNodes.push(cardNode);

          const rect = this.handSlot.getBoundingClientRect();
          const containerRect = this.container.getBoundingClientRect();

          const cardOffsetX = (i - (hand.length-1)/2) * baseSpacing;

          cardNode.style.left = (rect.left - containerRect.left + cardOffsetX + 45) + 'px'; // +45 for half width roughly
          cardNode.style.top = (rect.top - containerRect.top) + 'px';
      });
  }

  createCardNode(card: Card): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card vp-card';
    el.innerHTML = `
      <div class="card-face card-back">${Card.getBackSVG()}</div>
      <div class="card-face card-front">${card.getSVG()}</div>
    `;
    return el;
  }
}
