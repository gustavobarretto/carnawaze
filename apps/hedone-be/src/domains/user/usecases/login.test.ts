import { describe, it, expect, vi } from 'vitest';
import { loginUseCase } from './login.js';
import * as bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

const mockUserRepo = {
  findByEmail: vi.fn(),
};

const signJwt = vi.fn(() => 'fake-token');

describe('loginUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    const login = loginUseCase(mockUserRepo as any, 'secret', signJwt);
    await expect(login({ email: 'a@b.com', password: 'pass' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('throws when password wrong', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      name: 'A',
      passwordHash: 'hash',
      role: 'user',
      emailConfirmedAt: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const login = loginUseCase(mockUserRepo as any, 'secret', signJwt);
    await expect(login({ email: 'a@b.com', password: 'wrong' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('returns user and token when credentials valid', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      name: 'A',
      passwordHash: 'hash',
      role: 'user',
      emailConfirmedAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const login = loginUseCase(mockUserRepo as any, 'secret', signJwt);
    const out = await login({ email: 'a@b.com', password: 'pass' });
    expect(out.user.email).toBe('a@b.com');
    expect(out.token).toBe('fake-token');
  });
});
