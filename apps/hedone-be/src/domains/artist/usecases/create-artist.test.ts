import { describe, it, expect, vi } from 'vitest';
import { createArtistUseCase } from './create-artist.js';

const mockRepo = {
  create: vi.fn(),
};

describe('createArtistUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when name is empty', async () => {
    const createArtist = createArtistUseCase(mockRepo as any);
    await expect(createArtist({ name: '' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(createArtist({ name: '   ' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('creates artist and returns it', async () => {
    mockRepo.create.mockResolvedValue({
      id: 'a1',
      name: 'Ivete Sangalo',
      createdAt: new Date('2025-01-01'),
    });
    const createArtist = createArtistUseCase(mockRepo as any);
    const out = await createArtist({ name: 'Ivete Sangalo' });
    expect(out.artist.name).toBe('Ivete Sangalo');
    expect(out.artist.id).toBe('a1');
    expect(mockRepo.create).toHaveBeenCalledWith('Ivete Sangalo');
  });
});
