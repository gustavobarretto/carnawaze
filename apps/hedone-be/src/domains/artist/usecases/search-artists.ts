import type { ArtistRepository } from '../gateway/artist-repository.js';

export interface SearchArtistsInput {
  q: string;
  limit?: number;
}

export interface SearchArtistsOutput {
  artists: { id: string; name: string }[];
}

export function searchArtistsUseCase(artistRepo: ArtistRepository) {
  return async function searchArtists(input: SearchArtistsInput): Promise<SearchArtistsOutput> {
    const limit = Math.min(input.limit ?? 20, 50);
    const artists = await artistRepo.search(input.q, limit);
    return {
      artists: artists.map((a) => ({ id: a.id, name: a.name })),
    };
  };
}
