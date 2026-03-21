import { IGameUI } from './IGameUI.js';
import { BlackjackGame, BlackjackGameState } from '../../games/BlackjackGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';
import { VisualEffects } from '../VisualEffects.js';

export class BlackjackUI implements IGameUI {
  private game!: BlackjackGame;
  private listeners: { event: string, cb: any }[] = [];
  private doubleBtn!: HTMLButtonElement;
  private splitBtn!: HTMLButtonElement;

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private vfx: VisualEffects,
    private p1Slot: HTMLElement,
    private p2Slot: HTMLElement,
    private p1Score: HTMLElement,
    private p2Score: HTMLElement,
    private hitBtn: HTMLButtonElement,
    private standBtn: HTMLButtonElement,
    private controlsContainer: HTMLElement,
    private showGameOver: (msg: string) => void
  ) {
      let dBtn = document.getElementById('btn-double') as HTMLButtonElement;
      if (!dBtn) {
          dBtn = document.createElement('button');
          dBtn.id = 'btn-double';
          dBtn.textContent = 'Double';
          dBtn.className = 'btn primary';
          this.controlsContainer.appendChild(dBtn);
      }
      this.doubleBtn = dBtn;

      let sBtn = document.getElementById('btn-split') as HTMLButtonElement;
      if (!sBtn) {
          sBtn = document.createElement('button');
          sBtn.id = 'btn-split';
          sBtn.textContent = 'Split';
          sBtn.className = 'btn primary';
          this.controlsContainer.appendChild(sBtn);
      }
      this.splitBtn = sBtn;
  }

  init(game: BlackjackGame): void {
    this.game = game;
    this.listeners = [];

    // Setup UI
    this.hitBtn.style.display = 'inline-block';
    this.standBtn.style.display = 'inline-block';
    this.doubleBtn.style.display = 'inline-block';
    this.splitBtn.style.display = 'inline-block';

    this.hitBtn.disabled = false;
    this.standBtn.disabled = false;
    this.doubleBtn.disabled = false;
    this.splitBtn.disabled = false;

    // Bind events
    this.hitBtn.onclick = () => { this.audio.init(); this.game.hit(); };
    this.standBtn.onclick = () => { this.audio.init(); this.game.stand(); };
    this.doubleBtn.onclick = () => { this.audio.init(); this.game.double(); };
    this.splitBtn.onclick = () => { this.audio.init(); this.game.split(); };

    const onDeal = (data: BlackjackGameState) => {
        this.renderHands(data.playerHands, data.dealerHand);
        this.updateScores();
        this.updateButtons();
    };
    const onUpdateHand = (data: BlackjackGameState) => {
        this.renderPlayerHands(data.playerHands, data.currentHandIndex);
        this.updateScores();
        this.updateButtons();
    };
    const onDealerReveal = (data: BlackjackGameState) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30, 'p2-slot');
        this.updateScores();
    };
    const onDealerHit = (data: BlackjackGameState) => {
        this.audio.playDeal();
        this.renderHand(data.dealerHand, this.p2Slot, 30, 'p2-slot');
        this.updateScores();
    };
    const onGameOver = (data: { message: string, dealerHand: (Card|null)[] }) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30, 'p2-slot');
        this.updateScores();
        if (data.message.includes('Bust!')) {
            this.audio.playBlackjackBust();
        } else if (data.message.includes('Win')) {
            this.audio.playGameWin();
            const rect = this.p1Slot.getBoundingClientRect();
            if (data.message.includes('Blackjack')) {
                this.vfx.createConfetti(rect.left + rect.width / 2, rect.top, 100);
            } else {
                this.vfx.createCoinShower(rect.left + rect.width / 2, rect.top, 30);
            }
        }
        this.showGameOver(data.message);
        this.hitBtn.disabled = true;
        this.standBtn.disabled = true;
        this.doubleBtn.disabled = true;
        this.splitBtn.disabled = true;
    };

    this.game.on('deal', onDeal);
    this.game.on('update-hand', onUpdateHand);
    this.game.on('dealer-reveal', onDealerReveal);
    this.game.on('dealer-hit', onDealerHit);
    this.game.on('game-over', onGameOver);

    this.listeners.push(
        { event: 'deal', cb: onDeal },
        { event: 'update-hand', cb: onUpdateHand },
        { event: 'dealer-reveal', cb: onDealerReveal },
        { event: 'dealer-hit', cb: onDealerHit },
        { event: 'game-over', cb: onGameOver }
    );
  }

  teardown(): void {
    this.listeners.forEach(l => this.game.off(l.event, l.cb));
    this.hitBtn.onclick = null;
    this.standBtn.onclick = null;
    this.doubleBtn.onclick = null;
    this.splitBtn.onclick = null;
    this.hitBtn.style.display = 'none';
    this.standBtn.style.display = 'none';
    this.doubleBtn.style.display = 'none';
    this.splitBtn.style.display = 'none';
  }

  updateButtons() {
      if (this.game.state !== 'playing') {
          this.doubleBtn.disabled = true;
          this.splitBtn.disabled = true;
          this.hitBtn.disabled = true;
          this.standBtn.disabled = true;
          return;
      }
      this.hitBtn.disabled = false;
      this.standBtn.disabled = false;
      this.doubleBtn.disabled = !this.game.canDouble();
      this.splitBtn.disabled = !this.game.canSplit();
  }

  renderHands(pHands: Card[][], dHand: (Card|null)[]) {
    this.renderPlayerHands(pHands, this.game.currentHandIndex);
    this.renderHand(dHand, this.p2Slot, 30, 'p2-slot');
    this.audio.playDeal();
  }

  updateScores() {
    const pScores = this.game.playerHands.map(h => this.game.calculateScore(h));
    this.p1Score.textContent = `Score: ${pScores.join(' / ')}`;
    if (this.game.state === 'playing') {
        this.p2Score.textContent = `Score: ?`;
    } else {
        const dScore = this.game.calculateScore(this.game.dealerHand as Card[]);
        this.p2Score.textContent = `Score: ${dScore}`;
    }
  }

  renderPlayerHands(hands: Card[][], currentIndex: number) {
      const existing = document.querySelectorAll(`.card[data-slot^="p1-slot"]`);
      existing.forEach(e => e.remove());

      const numHands = hands.length;
      const baseSpacing = 120; // horizontal spacing between hands

      hands.forEach((hand, hIndex) => {
          const slotId = `p1-slot-${hIndex}`;

          hand.forEach((card, index) => {
            const cardNode = this.createCardNode(card);
            cardNode.classList.add('flipped');
            cardNode.dataset.slot = slotId;

            if (hIndex === currentIndex) {
                cardNode.style.boxShadow = '0 0 10px 2px yellow';
            }

            this.container.appendChild(cardNode);

            const rect = this.p1Slot.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();

            const handOffsetX = (hIndex - (numHands - 1)/2) * baseSpacing;
            const cardOffsetX = (index - (hand.length-1)/2) * 30;

            cardNode.style.left = (rect.left - containerRect.left + handOffsetX + cardOffsetX + 30) + 'px';
            cardNode.style.top = (rect.top - containerRect.top) + 'px';
        });
      });
  }

  renderHand(hand: (Card|null)[], targetSlot: HTMLElement, offsetStep: number, slotId: string) {
    const existing = document.querySelectorAll(`.card[data-slot="${slotId}"]`);
    existing.forEach(e => e.remove());

    hand.forEach((card, index) => {
        let cardNode: HTMLElement;
        if (card) {
            cardNode = this.createCardNode(card);
            cardNode.classList.add('flipped');
        } else {
            const dummy = new Card('A', 'spades');
            cardNode = this.createCardNode(dummy);
        }

        cardNode.dataset.slot = slotId;
        this.container.appendChild(cardNode);

        // Positioning logic
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
