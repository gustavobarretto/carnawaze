import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./e2e.sqlite';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'a'.repeat(32);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./e2e/global-setup.ts'],
    include: ['src/**/*.e2e.test.ts', 'e2e/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
