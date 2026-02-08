export class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', startTime: number = 0): void {
    if (!this.enabled || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = freq;
    osc.type = type;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime + startTime;
    osc.start(now);

    // Envelope
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.stop(now + duration);
  }

  playFlip(): void {
    this.playTone(800, 0.05, 'square');
    this.playTone(1200, 0.03, 'triangle', 0.01);
  }

  playDeal(): void {
    this.playTone(400, 0.1, 'sine');
  }

  playRoundWin(): void {
    this.playTone(440, 0.1, 'sine');
    this.playTone(554, 0.1, 'sine', 0.1);
    this.playTone(659, 0.2, 'sine', 0.2);
  }

  playWar(): void {
    this.playTone(100, 0.3, 'sawtooth');
    this.playTone(80, 0.3, 'sawtooth', 0.1);
  }

  playChip(): void {
    this.playTone(2000, 0.05, 'sine');
  }

  playGameWin(): void {
    [440, 440, 440, 349, 523, 440, 349, 523, 440].forEach((freq, i) => {
        const duration = (i === 3 || i === 4 || i === 6 || i === 7) ? 0.1 : 0.2;
        this.playTone(freq, duration, 'square', i * 0.2);
    });
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
