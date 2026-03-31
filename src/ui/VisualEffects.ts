export class VisualEffects {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isActive: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fx-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createConfetti(x: number, y: number, count: number = 50) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y));
    }
    if (!this.isActive) {
      this.isActive = true;
      this.loop();
    }
  }

  createCoinShower(x: number, y: number, count: number = 30) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new CoinParticle(x, y));
    }
    if (!this.isActive) {
      this.isActive = true;
      this.loop();
    }
  }

  createFloatingText(text: string, x: number, y: number) {
    this.particles.push(new FloatingTextParticle(text, x, y));
    if (!this.isActive) {
      this.isActive = true;
      this.loop();
    }
  }

  screenShake() {
    const body = document.body;
    body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    setTimeout(() => {
        body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        setTimeout(() => {
            body.style.transform = 'none';
        }, 50);
    }, 50);
  }

  loop() {
    if (this.particles.length === 0) {
      this.isActive = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 10 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 5; // Upward bias
    this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.size = Math.random() * 10 + 5;
    this.life = 100;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.5; // Gravity
    this.life -= 1;
    this.rotation += this.rotationSpeed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life / 100;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }

  isDead(): boolean {
    return this.life <= 0 || this.y > window.innerHeight + 100;
  }
}

class FloatingTextParticle extends Particle {
  text: string;

  constructor(text: string, x: number, y: number) {
    super(x, y);
    this.text = text;
    this.vy = -Math.random() * 2 - 1; // Float upwards
    this.vx = (Math.random() - 0.5) * 1;
    this.life = 100;
    this.rotationSpeed = 0;
    this.rotation = 0;
    this.color = '#f1c40f'; // Gold text
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1.5; // Fade out slightly faster
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, this.life / 100);
    ctx.textAlign = 'center';

    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}

class CoinParticle extends Particle {
  constructor(x: number, y: number) {
    super(x, y);
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2;
    this.color = Math.random() > 0.5 ? '#f1c40f' : '#f39c12'; // Gold variations
    this.size = Math.random() * 15 + 10; // Larger than confetti
    this.life = 150;
    this.rotationSpeed = (Math.random() - 0.5) * 20;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 3D rotation effect for coin flip
    const scaleY = Math.abs(Math.cos((this.rotation * Math.PI) / 180));
    ctx.scale(1, scaleY);

    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d35400';
    ctx.stroke();

    // Inner detail
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();

    ctx.restore();
  }
}
