import { IGameUI } from './IGameUI.js';
import { BlackjackGame, BlackjackGameState } from '../../games/BlackjackGame.js';
import { Card } from '../../core/Card.js';
import { AudioManager } from '../AudioManager.js';
import { Settings } from '../Settings.js';

export class BlackjackUI implements IGameUI {
  private game!: BlackjackGame;
  private listeners: { event: string, cb: any }[] = [];

  constructor(
    private container: HTMLElement,
    private audio: AudioManager,
    private settings: Settings,
    private p1Slot: HTMLElement,
    private p2Slot: HTMLElement,
    private p1Score: HTMLElement,
    private p2Score: HTMLElement,
    private hitBtn: HTMLButtonElement,
    private standBtn: HTMLButtonElement,
    private showGameOver: (msg: string) => void
  ) {}

  init(game: BlackjackGame): void {
    this.game = game;
    this.listeners = [];

    // Setup UI
    this.hitBtn.style.display = 'inline-block';
    this.standBtn.style.display = 'inline-block';
    this.hitBtn.disabled = false;
    this.standBtn.disabled = false;

    // Bind events
    this.hitBtn.onclick = () => { this.audio.init(); this.game.hit(); };
    this.standBtn.onclick = () => { this.audio.init(); this.game.stand(); };

    const onDeal = (data: BlackjackGameState) => {
        this.renderHands(data.playerHand, data.dealerHand);
        this.updateScores();
    };
    const onUpdateHand = (data: BlackjackGameState) => {
        this.renderHand(data.playerHand, this.p1Slot, 30);
        this.updateScores();
    };
    const onDealerReveal = (data: BlackjackGameState) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateScores();
    };
    const onDealerHit = (data: BlackjackGameState) => {
        this.audio.playDeal();
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateScores();
    };
    const onGameOver = (data: { message: string, dealerHand: (Card|null)[] }) => {
        this.renderHand(data.dealerHand, this.p2Slot, 30);
        this.updateScores();
        if (data.message.includes('Bust')) {
            this.audio.playBlackjackBust();
        } else if (data.message.includes('Win')) {
            this.audio.playGameWin();
        }
        this.showGameOver(data.message);
        this.hitBtn.disabled = true;
        this.standBtn.disabled = true;
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
    this.hitBtn.style.display = 'none';
    this.standBtn.style.display = 'none';
  }

  renderHands(pHand: Card[], dHand: (Card|null)[]) {
    this.renderHand(pHand, this.p1Slot, 30);
    this.renderHand(dHand, this.p2Slot, 30);
    this.audio.playDeal();
  }

  updateScores() {
    const pScore = this.game.calculateScore(this.game.playerHand);
    this.p1Score.textContent = `Score: ${pScore}`;
    if (this.game.state === 'playing') {
        this.p2Score.textContent = `Score: ?`;
    } else {
        const dScore = this.game.calculateScore(this.game.dealerHand as Card[]);
        this.p2Score.textContent = `Score: ${dScore}`;
    }
  }

  renderHand(hand: (Card|null)[], targetSlot: HTMLElement, offsetStep: number) {
    const slotId = targetSlot.id;
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
