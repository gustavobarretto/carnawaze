import { describe, it, expect, vi } from 'vitest';
import { createUserUseCase } from './create-user.js';

const mockUserRepo = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

const mockEmailRepo = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByUserId: vi.fn(),
};

const signJwt = vi.fn(() => 'fake-token');

describe('createUserUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when email already exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const createUser = createUserUseCase(
      mockUserRepo as any,
      mockEmailRepo as any,
      'secret',
      signJwt
    );
    await expect(createUser({ email: 'a@b.com', name: 'A', password: 'pass123' })).rejects.toMatchObject({
      code: 'EMAIL_IN_USE',
    });
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('creates user and returns user + token', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: 'user',
      emailConfirmedAt: null,
    });
    const createUser = createUserUseCase(
      mockUserRepo as any,
      mockEmailRepo as any,
      'secret',
      signJwt
    );
    const out = await createUser({ email: 'a@b.com', name: 'A', password: 'pass123' });
    expect(out.user.email).toBe('a@b.com');
    expect(out.token).toBe('fake-token');
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.com', name: 'A' })
    );
    expect(mockEmailRepo.create).toHaveBeenCalled();
  });
});
