import { AudioManager } from './ui/AudioManager';
import { UI } from './ui/UI';
import './ui/styles.css';

document.addEventListener('DOMContentLoaded', () => {
  const audio = new AudioManager();
  const ui = new UI(audio);

  ui.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  }
});
