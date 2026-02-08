type Listener<T = any> = (event: T) => void;

export class EventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on<T = any>(event: string, callback: Listener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<T = any>(event: string, callback: Listener<T>): void {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit<T = any>(event: string, data?: T): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(cb => cb(data));
  }
}
