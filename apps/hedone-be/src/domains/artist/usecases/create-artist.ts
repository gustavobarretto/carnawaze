import { badRequest } from '../../../lib/errors.js';
import type { ArtistRepository } from '../gateway/artist-repository.js';

export interface CreateArtistInput {
  name: string;
}

export interface CreateArtistOutput {
  artist: { id: string; name: string; createdAt: string };
}

export function createArtistUseCase(artistRepo: ArtistRepository) {
  return async function createArtist(input: CreateArtistInput): Promise<CreateArtistOutput> {
    const name = input.name?.trim();
    if (!name) throw badRequest('VALIDATION_ERROR', 'Name is required');
    const artist = await artistRepo.create(name);
    return {
      artist: { id: artist.id, name: artist.name, createdAt: artist.createdAt.toISOString() },
    };
  };
}
