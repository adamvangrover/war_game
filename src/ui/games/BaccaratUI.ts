import { IGameUI } from './IGameUI.js';
import { BaccaratGame, BaccaratGameState } from '../../games/BaccaratGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';
import { VisualEffects } from '../VisualEffects.js';

export class BaccaratUI implements IGameUI {
  private game!: BaccaratGame;
  private listeners: { event: string, cb: any }[] = [];
  private dealBtn: HTMLButtonElement;
  private betPlayerBtn: HTMLButtonElement;
  private betBankerBtn: HTMLButtonElement;
  private betTieBtn: HTMLButtonElement;
  private chipsDisplay!: HTMLElement;

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private vfx: VisualEffects,
    private p1Slot: HTMLElement,
    private p2Slot: HTMLElement,
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

      this.dealBtn = getBtn('btn-bac-deal', 'Next Round');
      this.betPlayerBtn = getBtn('btn-bac-player', 'Bet Player');
      this.betBankerBtn = getBtn('btn-bac-banker', 'Bet Banker');
      this.betTieBtn = getBtn('btn-bac-tie', 'Bet Tie');

      let chipsEl = document.getElementById('bac-chips');
      if (!chipsEl) {
          chipsEl = document.createElement('div');
          chipsEl.id = 'bac-chips';
          chipsEl.style.position = 'absolute';
          chipsEl.style.top = '20px';
          chipsEl.style.left = '20px';
          chipsEl.style.color = 'gold';
          chipsEl.style.fontSize = '24px';
          chipsEl.style.fontWeight = 'bold';
          this.container.appendChild(chipsEl);
      }
      this.chipsDisplay = chipsEl;
  }

  init(game: BaccaratGame): void {
    this.game = game;
    this.listeners = [];

    this.dealBtn.style.display = 'none';
    this.betPlayerBtn.style.display = 'inline-block';
    this.betBankerBtn.style.display = 'inline-block';
    this.betTieBtn.style.display = 'inline-block';
    this.chipsDisplay.style.display = 'block';

    this.dealBtn.onclick = () => {
        this.audio.init();
        this.game.playRound();
    };
    this.betPlayerBtn.onclick = () => { this.audio.init(); this.game.placeBet('PLAYER'); };
    this.betBankerBtn.onclick = () => { this.audio.init(); this.game.placeBet('BANKER'); };
    this.betTieBtn.onclick = () => { this.audio.init(); this.game.placeBet('TIE'); };

    const onUpdate = (state: BaccaratGameState) => {
        this.renderHand(state.playerHand, this.p1Slot, 30);
        this.renderHand(state.bankerHand, this.p2Slot, 30);
        this.p1Score.textContent = `Score: ${state.playerScore}`;
        this.p2Score.textContent = `Score: ${state.bankerScore}`;
        this.chipsDisplay.textContent = `Chips: ${state.chips}`;

        if (state.state === 'READY') {
            this.betPlayerBtn.style.display = 'inline-block';
            this.betBankerBtn.style.display = 'inline-block';
            this.betTieBtn.style.display = 'inline-block';
            this.dealBtn.style.display = 'none';
        } else if (state.state === 'PLAYING') {
            this.betPlayerBtn.style.display = 'none';
            this.betBankerBtn.style.display = 'none';
            this.betTieBtn.style.display = 'none';
            this.dealBtn.style.display = 'none';
        } else if (state.state === 'GAME_OVER') {
            this.betPlayerBtn.style.display = 'none';
            this.betBankerBtn.style.display = 'none';
            this.betTieBtn.style.display = 'none';
            this.dealBtn.style.display = 'inline-block';
        }

        if (state.message) {
            this.showMessage(state.message);
        }

        if (state.result) {
            const rect = this.chipsDisplay.getBoundingClientRect();
            if (
                (state.currentBet === 'PLAYER' && state.result === 'PLAYER_WIN') ||
                (state.currentBet === 'BANKER' && state.result === 'BANKER_WIN')
            ) {
                this.audio.playBaccaratWin();
                this.vfx.createCoinShower(rect.left + rect.width / 2, rect.top, 20);
                this.vfx.createFloatingText("+$10", rect.left + rect.width / 2, rect.top - 20);
            } else if (state.currentBet === 'TIE' && state.result === 'TIE') {
                this.audio.playBaccaratWin();
                this.vfx.createCoinShower(rect.left + rect.width / 2, rect.top, 40);
                this.vfx.createFloatingText("+$80", rect.left + rect.width / 2, rect.top - 20);
            } else if (state.result !== 'TIE' || state.currentBet === 'TIE') {
                this.audio.playChip();
                this.vfx.createFloatingText("-$10", rect.left + rect.width / 2, rect.top - 20);
            } else {
                this.audio.playChip();
                this.vfx.createFloatingText("Push", rect.left + rect.width / 2, rect.top - 20);
            }
        }
    };

    this.game.on('update', onUpdate);
    this.listeners.push({ event: 'update', cb: onUpdate });
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.dealBtn.style.display = 'none';
    this.betPlayerBtn.style.display = 'none';
    this.betBankerBtn.style.display = 'none';
    this.betTieBtn.style.display = 'none';
    this.chipsDisplay.style.display = 'none';

    this.dealBtn.onclick = null;
    this.betPlayerBtn.onclick = null;
    this.betBankerBtn.onclick = null;
    this.betTieBtn.onclick = null;
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
