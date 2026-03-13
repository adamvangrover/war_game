import { IGameUI } from './IGameUI.js';
import { HighLowGame, HighLowGameState } from '../../games/HighLowGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';

export class HighLowUI implements IGameUI {
  private game!: HighLowGame;
  private listeners: { event: string, cb: any }[] = [];
  private highBtn!: HTMLButtonElement;
  private lowBtn!: HTMLButtonElement;

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private p1Slot: HTMLElement,
    private p1Score: HTMLElement,
    private p2Score: HTMLElement,
    private controlsContainer: HTMLElement,
    private showMessage: (msg: string) => void
  ) {
      let hBtn = document.getElementById('btn-higher') as HTMLButtonElement;
      if (!hBtn) {
          hBtn = document.createElement('button');
          hBtn.id = 'btn-higher';
          hBtn.textContent = 'Higher';
          hBtn.className = 'btn primary';
          this.controlsContainer.appendChild(hBtn);
      }
      this.highBtn = hBtn;

      let lBtn = document.getElementById('btn-lower') as HTMLButtonElement;
      if (!lBtn) {
          lBtn = document.createElement('button');
          lBtn.id = 'btn-lower';
          lBtn.textContent = 'Lower';
          lBtn.className = 'btn primary';
          this.controlsContainer.appendChild(lBtn);
      }
      this.lowBtn = lBtn;
  }

  init(game: HighLowGame): void {
    this.game = game;
    this.listeners = [];

    this.highBtn.style.display = 'inline-block';
    this.lowBtn.style.display = 'inline-block';

    this.highBtn.onclick = () => { this.audio.init(); this.game.guess('higher'); };
    this.lowBtn.onclick = () => { this.audio.init(); this.game.guess('lower'); };

    const onUpdate = (state: HighLowGameState) => {
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
        if (state.result === 'WIN') {
            this.audio.playGameWin();
            this.highBtn.style.display = 'none';
            this.lowBtn.style.display = 'none';
        } else if (state.result === 'LOSS') {
            this.audio.playBlackjackBust();
            this.highBtn.style.display = 'none';
            this.lowBtn.style.display = 'none';
        }
    };

    this.game.on('update', onUpdate);
    this.listeners.push({ event: 'update', cb: onUpdate });
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.highBtn.style.display = 'none';
    this.lowBtn.style.display = 'none';
    this.highBtn.onclick = null;
    this.lowBtn.onclick = null;
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

  private placeAt(element: HTMLElement, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    element.style.left = (rect.left - containerRect.left) + 'px';
    element.style.top = (rect.top - containerRect.top) + 'px';
  }
}
