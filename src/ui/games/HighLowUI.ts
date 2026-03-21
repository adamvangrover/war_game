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
  private cashOutBtn!: HTMLButtonElement;

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
      const getBtn = (id: string, text: string, cls: string = 'primary') => {
          let btn = document.getElementById(id) as HTMLButtonElement;
          if (!btn) {
              btn = document.createElement('button');
              btn.id = id;
              btn.textContent = text;
              btn.className = `btn ${cls}`;
              this.controlsContainer.appendChild(btn);
          }
          return btn;
      };

      this.highBtn = getBtn('btn-higher', 'Higher');
      this.lowBtn = getBtn('btn-lower', 'Lower');
      this.cashOutBtn = getBtn('btn-hl-cashout', 'Cash Out');
  }

  init(game: HighLowGame): void {
    this.game = game;
    this.listeners = [];

    this.highBtn.style.display = 'inline-block';
    this.lowBtn.style.display = 'inline-block';
    this.cashOutBtn.style.display = 'inline-block';
    this.cashOutBtn.disabled = true;

    this.highBtn.onclick = () => { this.audio.init(); this.game.guess('higher'); };
    this.lowBtn.onclick = () => { this.audio.init(); this.game.guess('lower'); };
    this.cashOutBtn.onclick = () => { this.audio.init(); this.game.cashOut(); };

    const onUpdate = (state: HighLowGameState) => {
        const existing = document.querySelectorAll('.card');
        existing.forEach(e => e.remove());

        if (state.currentCard) {
            const el = this.createCardNode(state.currentCard);
            el.classList.add('flipped');
            this.container?.appendChild(el);
            this.placeAt(el, this.p1Slot);
        }

        this.p1Score.textContent = `Score: ${state.score} | Pot: ${state.pot}`;
        this.p2Score.textContent = `Cards Left: ${game.deck.length} | Streak: ${state.streak}`;

        this.cashOutBtn.disabled = state.pot === 0;

        if (state.message) this.showMessage(state.message);
        if (state.result === 'WIN') {
            this.audio.playGameWin();
            this.highBtn.style.display = 'none';
            this.lowBtn.style.display = 'none';
            this.cashOutBtn.style.display = 'none';
        } else if (state.result === 'LOSS') {
            this.audio.playBlackjackBust();
            this.highBtn.style.display = 'none';
            this.lowBtn.style.display = 'none';
            this.cashOutBtn.style.display = 'none';
        }
    };

    this.game.on('update', onUpdate);
    this.listeners.push({ event: 'update', cb: onUpdate });
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.highBtn.style.display = 'none';
    this.lowBtn.style.display = 'none';
    this.cashOutBtn.style.display = 'none';

    this.highBtn.onclick = null;
    this.lowBtn.onclick = null;
    this.cashOutBtn.onclick = null;
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
