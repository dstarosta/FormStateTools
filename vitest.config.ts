import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'threads',
    reporters: ['verbose'],
    setupFiles: ['./test.config.ts'],
  },
});
