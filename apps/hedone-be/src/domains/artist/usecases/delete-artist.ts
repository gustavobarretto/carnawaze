import { notFound } from '../../../lib/errors.js';
import type { ArtistRepository } from '../gateway/artist-repository.js';

export interface DeleteArtistInput {
  artistId: string;
}

export interface DeleteArtistOutput {
  ok: boolean;
}

export function deleteArtistUseCase(artistRepo: ArtistRepository) {
  return async function deleteArtist(input: DeleteArtistInput): Promise<DeleteArtistOutput> {
    const artist = await artistRepo.findById(input.artistId);
    if (!artist) throw notFound('Artist not found');
    await artistRepo.delete(input.artistId);
    return { ok: true };
  };
}
