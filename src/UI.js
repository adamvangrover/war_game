import { Card } from './Card.js';

export class UI {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;
    this.isAnimating = false;

    // Elements
    this.p1Deck = document.getElementById('p1-deck');
    this.p2Deck = document.getElementById('p2-deck');
    this.p1Slot = document.getElementById('p1-slot');
    this.p2Slot = document.getElementById('p2-slot');
    this.drawBtn = document.getElementById('draw-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.msgOverlay = document.getElementById('message-overlay');
    this.warBadge = document.getElementById('war-badge');

    // Score Elements
    this.p1Score = document.getElementById('p1-score');
    this.p2Score = document.getElementById('p2-score');
    this.p1Rounds = document.getElementById('p1-rounds');
    this.p2Rounds = document.getElementById('p2-rounds');

    this.container = document.getElementById('game-container');
  }

  init() {
    this.drawBtn.addEventListener('click', () => this.handleDraw());
    this.resetBtn.addEventListener('click', () => this.handleReset());
    this.updateScores();
  }

  handleReset() {
    this.game.start();
    this.updateScores();
    this.msgOverlay.classList.remove('visible');
    this.drawBtn.disabled = false;
    this.isAnimating = false;

    // Clear any existing cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(c => c.remove());
  }

  async handleDraw() {
    if (this.isAnimating) return;
    this.audio.init(); // Ensure audio context is started

    const result = this.game.playRound();
    if (!result) return;

    this.isAnimating = true;
    this.drawBtn.disabled = true;

    // Create Card Elements at Deck positions
    const p1CardNode = this.createCardNode(result.p1Card);
    const p2CardNode = this.createCardNode(result.p2Card);

    this.placeAt(p1CardNode, this.p1Deck);
    this.placeAt(p2CardNode, this.p2Deck);

    this.container.appendChild(p1CardNode);
    this.container.appendChild(p2CardNode);

    // Force reflow
    p1CardNode.offsetHeight;

    // Animate to slots
    this.audio.playDeal();
    await Promise.all([
      this.moveTo(p1CardNode, this.p1Slot),
      this.moveTo(p2CardNode, this.p2Slot)
    ]);

    // Flip
    this.audio.playFlip();
    p1CardNode.classList.add('flipped');
    p2CardNode.classList.add('flipped');

    await this.wait(800);

    const activeCards = [p1CardNode, p2CardNode];

    if (result.isWar) {
      await this.animateWar(result.warEvents, activeCards);
    }

    // Move to winner
    if (result.gameEnded) {
      this.showGameOver(result.gameWinner);
    } else {
      const winnerDeck = result.winner === this.game.player1 ? this.p1Deck : this.p2Deck;

      // If war ended, result.winner might be null in the main result,
      // but we need to track who won the pile.
      // Actually, if isWar is true, result.winner is null.
      // The last warEvent has the winner.

      let winnerPlayer = result.winner;
      if (result.isWar) {
          const lastEvent = result.warEvents[result.warEvents.length - 1];
          winnerPlayer = lastEvent.winner;
      }

      if (winnerPlayer) {
          const targetDeck = winnerPlayer === this.game.player1 ? this.p1Deck : this.p2Deck;
          this.audio.playRoundWin();
          await this.animateToDeck(activeCards, targetDeck);
      }
    }

    this.updateScores();

    if (!result.gameEnded) {
        this.isAnimating = false;
        this.drawBtn.disabled = false;
    }
  }

  async animateWar(warEvents, activeCards) {
    this.warBadge.classList.add('visible');
    this.audio.playWar();
    await this.wait(1000);
    this.warBadge.classList.remove('visible');

    for (const event of warEvents) {
       // Deal 3 face down
       for (let i = 0; i < 3; i++) {
           if (i >= event.p1Hidden.length) break; // In case fewer cards
           const c1 = this.createCardNode(event.p1Hidden[i]); // We can create them, but keep face down
           const c2 = this.createCardNode(event.p2Hidden[i]);

           this.placeAt(c1, this.p1Deck);
           this.placeAt(c2, this.p2Deck);
           this.container.appendChild(c1);
           this.container.appendChild(c2);

           activeCards.push(c1, c2);

           // Slight offset for pile
           const offset = (i + 1) * 10;

           this.moveTo(c1, this.p1Slot, offset, offset);
           this.moveTo(c2, this.p2Slot, offset, offset);

           this.audio.playDeal();
           await this.wait(200);
       }

       // Deal 1 face up
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

  async animateToDeck(cards, targetDeck) {
     const promises = cards.map(c => {
         // Add a class for scaling down/fading
         // But moveTo handles position.
         // We'll calculate target pos.
         return this.moveTo(c, targetDeck).then(() => {
             c.style.opacity = '0';
             setTimeout(() => c.remove(), 500);
         });
     });
     await Promise.all(promises);
  }

  showGameOver(winner) {
    this.msgOverlay.innerHTML = `<h1>Game Over!</h1><h2>${winner.name} Wins!</h2><p>Click Reset to play again.</p>`;
    this.msgOverlay.classList.add('visible');
    this.audio.playGameWin();
    this.drawBtn.disabled = true;
  }

  updateScores() {
    this.p1Score.textContent = `Wins: ${this.game.player1.wins} | Cards: ${this.game.player1.cardCount}`;
    this.p2Score.textContent = `Wins: ${this.game.player2.wins} | Cards: ${this.game.player2.cardCount}`;
    this.p1Rounds.textContent = `Rounds: ${this.game.player1.roundsWon}`;
    this.p2Rounds.textContent = `Rounds: ${this.game.player2.roundsWon}`;
  }

  // Helpers
  createCardNode(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-face card-back">${Card.getBackSVG()}</div>
      <div class="card-face card-front">${card.getSVG()}</div>
    `;
    return el;
  }

  placeAt(element, target) {
    const rect = target.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    element.style.left = (rect.left - containerRect.left) + 'px';
    element.style.top = (rect.top - containerRect.top) + 'px';
  }

  moveTo(element, target, offsetX = 0, offsetY = 0) {
    return new Promise(resolve => {
        const rect = target.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        element.style.left = (rect.left - containerRect.left + offsetX) + 'px';
        element.style.top = (rect.top - containerRect.top + offsetY) + 'px';

        // Wait for transition
        element.addEventListener('transitionend', () => resolve(), { once: true });

        // Fallback in case transition fails or is optimized out
        setTimeout(resolve, 650);
    });
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
