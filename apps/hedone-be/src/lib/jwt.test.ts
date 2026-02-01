import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt, type JwtPayload } from './jwt.js';

const secret = 'a'.repeat(32);

describe('jwt', () => {
  it('signs and verifies JWT', () => {
    const token = signJwt(secret, { sub: 'user-1', email: 'a@b.com', role: 'user' });
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);
    const payload = verifyJwt(secret, token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.role).toBe('user');
    expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('throws on invalid signature', () => {
    const token = signJwt(secret, { sub: 'x', email: 'x@x.com', role: 'user' });
    expect(() => verifyJwt(secret + 'x', token)).toThrow();
  });

  it('throws on invalid token', () => {
    expect(() => verifyJwt(secret, 'invalid')).toThrow();
  });
});
