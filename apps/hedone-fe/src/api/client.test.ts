import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('auth.register calls POST /v1/users', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: {}, token: 't' }),
    } as Response);
    await api.auth.register({ email: 'a@b.com', name: 'A', password: 'pass123' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/users'),
      expect.objectContaining({ method: 'POST', body: expect.any(String) })
    );
  });

  it('auth.login calls POST /v1/auth/login', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: {}, token: 't' }),
    } as Response);
    await api.auth.login({ email: 'a@b.com', password: 'pass' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
