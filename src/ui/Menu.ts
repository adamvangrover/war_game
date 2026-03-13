export class Menu {
  private element: HTMLElement;
  public onWarSelect: () => void = () => {};
  public onBlackjackSelect: () => void = () => {};
  public onBaccaratSelect: () => void = () => {};
  public onHighLowSelect: () => void = () => {};
  public onSettingsSelect: () => void = () => {};

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'main-menu-overlay';
    this.element.className = 'menu-overlay';
    this.element.innerHTML = `
      <div class="menu-content">
        <h1>Game Suite</h1>
        <div class="menu-buttons">
          <button id="btn-war" class="btn primary">Play War</button>
          <button id="btn-blackjack" class="btn primary">Play Blackjack</button>
          <button id="btn-baccarat" class="btn primary">Play Baccarat</button>
          <button id="btn-highlow" class="btn primary">Play High Low</button>
          <button id="btn-settings" class="btn secondary">Settings</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.element.querySelector('#btn-war')!.addEventListener('click', () => this.onWarSelect());
    this.element.querySelector('#btn-blackjack')!.addEventListener('click', () => this.onBlackjackSelect());
    this.element.querySelector('#btn-baccarat')!.addEventListener('click', () => this.onBaccaratSelect());
    this.element.querySelector('#btn-highlow')!.addEventListener('click', () => this.onHighLowSelect());
    this.element.querySelector('#btn-settings')!.addEventListener('click', () => this.onSettingsSelect());
  }

  show() {
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }
}
