import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['architecture/**/*.test.ts'],
    environment: 'node',
  },
});
