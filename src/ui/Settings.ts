export class Settings {
  private element: HTMLElement;
  public animationSpeed: number = 1.0;
  public soundEnabled: boolean = true;
  public onClose: () => void = () => {};

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'settings-menu';
    this.element.className = 'menu-overlay';
    this.element.style.display = 'none'; // Initially hidden so it doesn't intercept clicks
    this.element.innerHTML = `
      <div class="menu-content">
        <h2>Settings</h2>
        <div class="menu-buttons">
          <div class="setting-item">
            <label>Animation Speed</label>
            <input type="range" id="speed-slider" min="0.5" max="2" step="0.1" value="1">
          </div>
          <div class="setting-item">
            <label>Sound</label>
            <input type="checkbox" id="sound-toggle" checked>
          </div>
          <button id="btn-close-settings" class="btn secondary">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    const slider = this.element.querySelector('#speed-slider') as HTMLInputElement;
    const soundToggle = this.element.querySelector('#sound-toggle') as HTMLInputElement;
    const closeBtn = this.element.querySelector('#btn-close-settings') as HTMLButtonElement;

    slider.addEventListener('input', () => {
        this.animationSpeed = parseFloat(slider.value);
    });

    soundToggle.addEventListener('change', () => {
        this.soundEnabled = soundToggle.checked;
    });

    closeBtn.addEventListener('click', () => {
        this.hide();
        this.onClose();
    });
  }

  show() {
    this.element.style.display = 'flex';
    // Small timeout to allow display:flex to apply before adding class for opacity transition
    setTimeout(() => {
        this.element.classList.add('visible');
    }, 10);
  }

  hide() {
    this.element.classList.remove('visible');
    // Wait for transition to finish before hiding display
    setTimeout(() => {
        if (!this.element.classList.contains('visible')) {
            this.element.style.display = 'none';
        }
    }, 400); // 400ms matches the CSS transition time
  }
}
