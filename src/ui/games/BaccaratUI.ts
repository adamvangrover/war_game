import { IGameUI } from './IGameUI.js';
import { BaccaratGame, BaccaratGameState } from '../../games/BaccaratGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';

export class BaccaratUI implements IGameUI {
  private game!: BaccaratGame;
  private listeners: { event: string, cb: any }[] = [];
  private dealBtn: HTMLButtonElement;

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private p1Slot: HTMLElement,
    private p2Slot: HTMLElement,
    private p1Score: HTMLElement,
    private p2Score: HTMLElement,
    private controlsContainer: HTMLElement,
    private showMessage: (msg: string) => void
  ) {
      let btn = document.getElementById('btn-bac-deal') as HTMLButtonElement;
      if (!btn) {
          btn = document.createElement('button');
          btn.id = 'btn-bac-deal';
          btn.textContent = 'Deal';
          btn.className = 'btn primary';
          this.controlsContainer.appendChild(btn);
      }
      this.dealBtn = btn;
  }

  init(game: BaccaratGame): void {
    this.game = game;
    this.listeners = [];

    this.dealBtn.style.display = 'inline-block';

    this.dealBtn.onclick = () => {
        this.audio.init();
        this.game.playRound();
    };

    const onUpdate = (state: BaccaratGameState) => {
        this.renderHand(state.playerHand, this.p1Slot, 30);
        this.renderHand(state.bankerHand, this.p2Slot, 30);
        this.p1Score.textContent = `Score: ${state.playerScore}`;
        this.p2Score.textContent = `Score: ${state.bankerScore}`;

        if (state.message) {
            this.showMessage(state.message);
        }

        if (state.result) {
            if (state.result.includes('WIN')) {
                this.audio.playBaccaratWin();
            } else {
                this.audio.playChip();
            }
        }
    };

    this.game.on('update', onUpdate);
    this.listeners.push({ event: 'update', cb: onUpdate });
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.dealBtn.style.display = 'none';
    this.dealBtn.onclick = null;
  }

  renderHand(hand: Card[], targetSlot: HTMLElement, offsetStep: number) {
    const slotId = targetSlot.id;
    const existing = document.querySelectorAll(`.card[data-slot="${slotId}"]`);
    existing.forEach(e => e.remove());

    hand.forEach((card, index) => {
        const cardNode = this.createCardNode(card);
        cardNode.classList.add('flipped');
        cardNode.dataset.slot = slotId;
        this.container.appendChild(cardNode);

        const rect = targetSlot.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const offsetX = (index - (hand.length-1)/2) * offsetStep;

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
}
