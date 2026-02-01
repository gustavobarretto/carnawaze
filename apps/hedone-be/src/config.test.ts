import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig } from './config.js';

describe('config', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  it('loads config with valid env', () => {
    process.env.DATABASE_URL = 'file:./test.sqlite';
    process.env.JWT_SECRET = 'a'.repeat(32);
    const config = loadConfig();
    expect(config.DATABASE_URL).toBe('file:./test.sqlite');
    expect(config.JWT_SECRET.length).toBe(32);
    expect(config.PORT).toBe(3001);
  });
});
