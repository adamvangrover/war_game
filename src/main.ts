import { AudioManager } from './ui/AudioManager';
import { VisualEffects } from './ui/VisualEffects';
import { UI } from './ui/UI';
import './ui/styles.css';

document.addEventListener('DOMContentLoaded', () => {
  const audio = new AudioManager();
  const vfx = new VisualEffects();
  const ui = new UI(audio, vfx);

  ui.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  }
});
