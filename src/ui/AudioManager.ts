export class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {}

  init(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', startTime: number = 0, vol: number = 0.1): void {
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
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.stop(now + duration + 0.1);
  }

  playFlip(): void {
    this.playTone(800, 0.05, 'square', 0, 0.05);
    this.playTone(400, 0.1, 'triangle', 0.02, 0.05);
  }

  playDeal(): void {
    this.playTone(300, 0.15, 'sine', 0, 0.08);
  }

  playRoundWin(): void {
    // Richer chord effect
    this.playTone(440, 0.3, 'sine', 0, 0.1); // A4
    this.playTone(440, 0.3, 'triangle', 0, 0.05);

    this.playTone(554, 0.3, 'sine', 0.1, 0.1); // C#5
    this.playTone(554, 0.3, 'triangle', 0.1, 0.05);

    this.playTone(659, 0.5, 'sine', 0.2, 0.1); // E5
    this.playTone(659, 0.5, 'triangle', 0.2, 0.05);
  }

  playShuffle(): void {
    // Simulate shuffle with fast repeating noise-like saw bursts
    for (let i = 0; i < 5; i++) {
        this.playTone(150 + Math.random() * 50, 0.05, 'sawtooth', i * 0.06, 0.05);
    }
  }

  playWar(): void {
    this.playTone(100, 0.4, 'sawtooth', 0, 0.2);
    this.playTone(80, 0.4, 'sawtooth', 0.1, 0.2);
  }

  playGameWin(): void {
    const frequencies = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const timings = [0, 0.15, 0.3, 0.45, 0.6, 0.9];
    const durations = [0.1, 0.1, 0.1, 0.1, 0.2, 0.6];

    frequencies.forEach((freq, i) => {
        this.playTone(freq, durations[i], 'square', timings[i], 0.1);
    });
  }

  playChip(): void {
      this.playTone(1200, 0.05, 'sine', 0, 0.05);
  }

  playBaccaratWin(): void {
      this.playTone(600, 0.2, 'triangle', 0, 0.1);
      this.playTone(800, 0.4, 'sine', 0.1, 0.1);
  }

  playBlackjackBust(): void {
      this.playTone(100, 0.3, 'sawtooth', 0, 0.1);
      this.playTone(80, 0.4, 'sawtooth', 0.1, 0.1);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
