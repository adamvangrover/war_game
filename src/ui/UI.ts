import { WarGame, WarEvent } from '../games/WarGame.js';
import { BlackjackGame, BlackjackGameState } from '../games/BlackjackGame.js';
import { BaccaratGame, BaccaratGameState } from '../games/BaccaratGame.js';
import { HighLowGame, HighLowGameState } from '../games/HighLowGame.js';
import { AudioManager } from '../core/AudioManager.js';
import { Card } from '../core/Card.js';

export class UI {
  public game: WarGame | BlackjackGame | BaccaratGame | HighLowGame | null;
  public audio: AudioManager;
  public mode: 'war' | 'blackjack' | 'baccarat' | 'highlow';
  public isAnimating: boolean;
  public speedModifier: number;
  public autoPlay: boolean;
  public autoPlayInterval: number | null;

  // Elements (Cached)
  public container: HTMLElement | null;
  public p1Deck: HTMLElement | null;
  public p2Deck: HTMLElement | null;
  public p1Slot: HTMLElement | null;
  public p2Slot: HTMLElement | null;
  public p1Score: HTMLElement | null;
  public p2Score: HTMLElement | null;
  public p1Name: HTMLElement | null;
  public p2Name: HTMLElement | null;
  public centerMsg: HTMLElement | null;
  public warBadge: HTMLElement | null;
  public msgOverlay: HTMLElement | null;

  // Control Groups
  public controlsWar: HTMLElement | null;
  public controlsBJ: HTMLElement | null;
  public controlsBac: HTMLElement | null;
  public controlsHL: HTMLElement | null;

  constructor(game: any, audio: AudioManager) {
    this.game = game;
    this.audio = audio;
    this.mode = 'war';
    this.isAnimating = false;
    this.speedModifier = 1.0;
    this.autoPlay = false;
    this.autoPlayInterval = null;

    this.container = document.getElementById('game-container');
    this.p1Deck = document.getElementById('p1-deck');
    this.p2Deck = document.getElementById('p2-deck');
    this.p1Slot = document.getElementById('p1-slot');
    this.p2Slot = document.getElementById('p2-slot');
    this.p1Score = document.getElementById('p1-score');
    this.p2Score = document.getElementById('p2-score');
    this.p1Name = document.getElementById('p1-name');
    this.p2Name = document.getElementById('p2-name');
    this.centerMsg = document.getElementById('center-message');
    this.warBadge = document.getElementById('war-badge');
    this.msgOverlay = document.getElementById('message-overlay');

    this.controlsWar = document.getElementById('controls-war');
    this.controlsBJ = document.getElementById('controls-blackjack');
    this.controlsBac = document.getElementById('controls-baccarat');
    this.controlsHL = document.getElementById('controls-highlow');
  }

  init() {}

  setGame(game: any) { this.game = game; }

  setGameMode(mode: 'war' | 'blackjack' | 'baccarat' | 'highlow') {
    this.mode = mode;
    this.autoPlay = false;
    if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);

    this.reset();

    // Hide all controls first
    [this.controlsWar, this.controlsBJ, this.controlsBac, this.controlsHL].forEach(c => c?.classList.add('hidden'));

    const title = document.getElementById('game-title');
    if (this.p1Name) this.p1Name.textContent = 'Player 1';
    if (this.p2Name) this.p2Name.textContent = 'Player 2';
    if (this.p1Deck) this.p1Deck.style.visibility = 'visible';
    if (this.p2Deck) this.p2Deck.style.visibility = 'visible';

    if (mode === 'war') {
       this.controlsWar?.classList.remove('hidden');
       if (title) title.textContent = 'War';
    } else if (mode === 'blackjack') {
       this.controlsBJ?.classList.remove('hidden');
       if (title) title.textContent = 'Blackjack';
       if (this.p1Name) this.p1Name.textContent = 'You';
       if (this.p2Name) this.p2Name.textContent = 'Dealer';
       if (this.p1Deck) this.p1Deck.style.visibility = 'hidden';
       if (this.p2Deck) this.p2Deck.style.visibility = 'hidden';
    } else if (mode === 'baccarat') {
       this.controlsBac?.classList.remove('hidden');
       if (title) title.textContent = 'Baccarat';
       if (this.p1Name) this.p1Name.textContent = 'Player';
       if (this.p2Name) this.p2Name.textContent = 'Banker';
       if (this.p1Deck) this.p1Deck.style.visibility = 'hidden';
       if (this.p2Deck) this.p2Deck.style.visibility = 'hidden';
    } else if (mode === 'highlow') {
       this.controlsHL?.classList.remove('hidden');
       if (title) title.textContent = 'High-Low';
       if (this.p1Name) this.p1Name.textContent = 'Current';
       if (this.p2Name) this.p2Name.textContent = 'Deck';
       if (this.p1Deck) this.p1Deck.style.visibility = 'hidden';
       if (this.p2Deck) this.p2Deck.style.visibility = 'visible'; // Deck pile
    }
  }

  reset() {
    this.isAnimating = false;
    this.msgOverlay?.classList.remove('visible');
    this.centerMsg?.classList.remove('visible');
    document.querySelectorAll('.card').forEach(c => c.remove());
  }

  // --- WAR ---

  handleReset() {
    this.reset();
    this.updateScores();
  }

  toggleAutoPlay() {
      this.autoPlay = !this.autoPlay;
      const btn = document.getElementById('autoplay-btn');
      if (btn) btn.textContent = this.autoPlay ? 'Stop Auto' : 'Auto Play';

      if (this.autoPlay) {
          this.handleDraw(); // Start immediately
      }
  }

  async handleDraw() {
    if (this.mode !== 'war') return;
    if (this.isAnimating) return;

    const game = this.game as WarGame;
    const result = game.playRound();
    if (!result) return;

    this.isAnimating = true;
    const drawBtn = document.getElementById('draw-btn') as HTMLButtonElement;
    if (drawBtn) drawBtn.disabled = true;

    if (result.gameEnded && !result.p1Card) {
        if (result.gameWinner) this.showGameOver(result.gameWinner.name + ' Wins!');
        this.isAnimating = false;
        if (drawBtn) drawBtn.disabled = false;
        this.autoPlay = false;
        return;
    }

    const p1CardNode = this.createCardNode(result.p1Card!);
    const p2CardNode = this.createCardNode(result.p2Card!);

    if (this.p1Deck) this.placeAt(p1CardNode, this.p1Deck);
    if (this.p2Deck) this.placeAt(p2CardNode, this.p2Deck);

    this.container?.appendChild(p1CardNode);
    this.container?.appendChild(p2CardNode);
    p1CardNode.offsetHeight;

    this.audio.playDeal();
    await Promise.all([
      this.p1Slot && this.moveTo(p1CardNode, this.p1Slot),
      this.p2Slot && this.moveTo(p2CardNode, this.p2Slot)
    ]);

    this.audio.playFlip();
    p1CardNode.classList.add('flipped');
    p2CardNode.classList.add('flipped');

    await this.wait(800);

    const activeCards = [p1CardNode, p2CardNode];
    if (result.isWar) await this.animateWar(result.warEvents, activeCards);

    if (result.gameEnded && result.gameWinner) {
      this.showGameOver(result.gameWinner.name + ' Wins!');
    } else {
      let winnerPlayer = result.winner;
      if (result.isWar && result.warEvents.length > 0) {
          winnerPlayer = result.warEvents[result.warEvents.length - 1].winner;
      }
      if (winnerPlayer) {
          const targetDeck = winnerPlayer === game.player1 ? this.p1Deck : this.p2Deck;
          this.audio.playRoundWin();
          if (targetDeck) await this.animateToDeck(activeCards, targetDeck);
      }
    }

    this.updateScores();

    if (!result.gameEnded) {
        this.isAnimating = false;
        if (drawBtn) drawBtn.disabled = false;
        if (this.autoPlay) setTimeout(() => this.handleDraw(), 500 * this.speedModifier);
    }
  }

  async animateWar(warEvents: WarEvent[], activeCards: HTMLElement[]) {
    this.warBadge?.classList.add('visible');
    this.audio.playWar();
    await this.wait(1000);
    this.warBadge?.classList.remove('visible');

    for (const event of warEvents) {
        for (let i = 0; i < 3; i++) {
            if (i >= event.p1Hidden.length) break;
            const c1 = this.createCardNode(event.p1Hidden[i]);
            const c2 = this.createCardNode(event.p2Hidden[i]);
            if (this.p1Deck) this.placeAt(c1, this.p1Deck);
            if (this.p2Deck) this.placeAt(c2, this.p2Deck);
            this.container?.appendChild(c1);
            this.container?.appendChild(c2);
            activeCards.push(c1, c2);

            const offset = (i+1)*10;
            if (this.p1Slot) this.moveTo(c1, this.p1Slot, offset, offset);
            if (this.p2Slot) this.moveTo(c2, this.p2Slot, offset, offset);
            this.audio.playDeal();
            await this.wait(150);
        }
        const up1 = this.createCardNode(event.p1Up);
        const up2 = this.createCardNode(event.p2Up);
        if (this.p1Deck) this.placeAt(up1, this.p1Deck);
        if (this.p2Deck) this.placeAt(up2, this.p2Deck);
        this.container?.appendChild(up1);
        this.container?.appendChild(up2);
        activeCards.push(up1, up2);

        if (this.p1Slot) this.moveTo(up1, this.p1Slot, 50, 50);
        if (this.p2Slot) this.moveTo(up2, this.p2Slot, 50, 50);
        await this.wait(300);
        this.audio.playFlip();
        up1.classList.add('flipped');
        up2.classList.add('flipped');
        await this.wait(1000);
    }
  }

  async animateToDeck(cards: HTMLElement[], targetDeck: HTMLElement) {
      await Promise.all(cards.map(c => this.moveTo(c, targetDeck).then(() => {
          c.style.opacity = '0';
          setTimeout(() => c.remove(), 500);
      })));
  }

  // --- BLACKJACK ---

  updateBlackjackState(state: BlackjackGameState) {
    this.renderGenericHand(state.dealerHand, this.p2Slot, 30);
    this.renderGenericHand(state.playerHand, this.p1Slot, 30);

    if (this.p1Score) this.p1Score.textContent = `Score: ${state.playerValue}`;
    if (this.p2Score) this.p2Score.textContent = `Score: ${state.dealerValue}`;

    const hit = document.getElementById('btn-hit');
    const stand = document.getElementById('btn-stand');
    const deal = document.getElementById('btn-deal');

    if (state.state === 'READY' || state.state === 'GAME_OVER') {
        hit?.classList.add('hidden'); stand?.classList.add('hidden'); deal?.classList.remove('hidden');
    } else {
        hit?.classList.remove('hidden'); stand?.classList.remove('hidden'); deal?.classList.add('hidden');
    }

    this.showMessage(state.message);
    if (state.state === 'GAME_OVER' && state.result === 'PLAYER_WIN') this.audio.playRoundWin();
  }

  // --- BACCARAT ---

  updateBaccaratState(state: BaccaratGameState) {
    this.renderGenericHand(state.bankerHand, this.p2Slot, 30);
    this.renderGenericHand(state.playerHand, this.p1Slot, 30);

    if (this.p1Score) this.p1Score.textContent = `Score: ${state.playerScore}`;
    if (this.p2Score) this.p2Score.textContent = `Score: ${state.bankerScore}`;

    const deal = document.getElementById('btn-bac-deal');
    if (deal) deal.classList.toggle('hidden', state.state === 'PLAYING');

    this.showMessage(state.message);
    if (state.result === 'PLAYER_WIN' || state.result === 'TIE') this.audio.playRoundWin(); // Tie is good?
  }

  // --- HIGH LOW ---

  updateHighLowState(state: HighLowGameState) {
    // Current Card (Player slot)
    const existing = document.querySelectorAll('.card');
    existing.forEach(e => e.remove());

    if (this.p1Slot && state.currentCard) {
        const el = this.createCardNode(state.currentCard);
        el.classList.add('flipped');
        this.container?.appendChild(el);
        this.placeAt(el, this.p1Slot);
    }

    // If Result card exists (Loss/Next), show in Deck slot temporarily
    if (state.nextCard && this.p2Slot) {
        const el = this.createCardNode(state.nextCard);
        el.classList.add('flipped');
        this.container?.appendChild(el);
        this.placeAt(el, this.p2Slot);
    }

    if (this.p1Score) this.p1Score.textContent = `Score: ${state.score}`;
    if (this.p2Score) this.p2Score.textContent = `Cards Left: ${this.game?.deck.length}`;

    const higher = document.getElementById('btn-higher');
    const lower = document.getElementById('btn-lower');
    const start = document.getElementById('btn-hl-start');

    if (state.state === 'PLAYING') {
        higher?.classList.remove('hidden'); lower?.classList.remove('hidden'); start?.classList.add('hidden');
    } else {
        higher?.classList.add('hidden'); lower?.classList.add('hidden'); start?.classList.remove('hidden');
    }

    this.showMessage(state.message);
    if (state.result === 'WIN') this.audio.playGameWin();
  }

  // --- HELPERS ---

  renderGenericHand(cards: (Card | null)[], slot: HTMLElement | null, offsetStep: number) {
      // Lazy clear: could be optimized to diff
      const existing = document.querySelectorAll('.card');
      existing.forEach(e => {
          // simple check: if in War mode, handleDraw manages removal. In others, we clear.
          if (this.mode !== 'war') e.remove();
      });
      if (this.mode === 'war') return; // War handles its own DOM

      cards.forEach((card, i) => {
          const el = this.createCardNode(card || undefined);
          this.container?.appendChild(el);
          if (slot) this.placeAt(el, slot, (i * offsetStep) - 40, 0);
          if (card) setTimeout(() => el.classList.add('flipped'), 50);
      });
  }

  showMessage(msg: string) {
      if (!this.centerMsg) return;
      if (msg) {
          this.centerMsg.textContent = msg;
          this.centerMsg.classList.add('visible');
      } else {
          this.centerMsg.classList.remove('visible');
      }
  }

  updateScores() {
    if (this.mode === 'war') {
        const game = this.game as WarGame;
        if (this.p1Score) this.p1Score.textContent = `Wins: ${game.player1.wins} | Cards: ${game.player1.cardCount}`;
        if (this.p2Score) this.p2Score.textContent = `Wins: ${game.player2.wins} | Cards: ${game.player2.cardCount}`;
    }
  }

  showGameOver(msg: string) {
      const title = document.getElementById('msg-title');
      const body = document.getElementById('msg-body');
      if (title) title.textContent = "Game Over";
      if (body) body.textContent = msg;
      this.msgOverlay?.classList.add('visible');
      this.audio.playGameWin();

      const btn = document.getElementById('btn-play-again');
      if (btn) btn.onclick = () => {
          this.msgOverlay?.classList.remove('visible');
          // Reset current game
          if (this.mode === 'war') (this.game as WarGame).start();
          else if (this.mode === 'highlow') this.updateHighLowState((this.game as HighLowGame).start());
          // others auto reset on deal
          this.reset();
          if (this.mode === 'war') this.updateScores();
      };
  }

  createCardNode(card: Card | undefined) {
    const el = document.createElement('div');
    el.className = 'card';
    const svgs = card ? card.getSVG() : '';
    el.innerHTML = `<div class="card-face card-back">${Card.getBackSVG()}</div><div class="card-face card-front">${svgs}</div>`;
    return el;
  }

  placeAt(element: HTMLElement, target: HTMLElement, offsetX = 0, offsetY = 0) {
    const rect = target.getBoundingClientRect();
    const containerRect = this.container?.getBoundingClientRect();
    if (containerRect) {
        element.style.left = (rect.left - containerRect.left + offsetX) + 'px';
        element.style.top = (rect.top - containerRect.top + offsetY) + 'px';
    }
  }

  moveTo(element: HTMLElement, target: HTMLElement, offsetX = 0, offsetY = 0) {
    return new Promise<void>(resolve => {
        const rect = target.getBoundingClientRect();
        const containerRect = this.container?.getBoundingClientRect();
        if (containerRect) {
            element.style.left = (rect.left - containerRect.left + offsetX) + 'px';
            element.style.top = (rect.top - containerRect.top + offsetY) + 'px';
        }
        element.addEventListener('transitionend', () => resolve(), { once: true });
        setTimeout(resolve, 650);
    });
  }

  wait(ms: number) {
      return new Promise<void>(resolve => setTimeout(resolve, ms * this.speedModifier));
  }
}
