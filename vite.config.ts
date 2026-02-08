/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext'
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
