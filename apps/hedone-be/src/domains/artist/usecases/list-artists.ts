import type { ArtistRepository } from '../gateway/artist-repository.js';

export interface ListArtistsInput {
  page: number;
  limit: number;
}

export interface ListArtistsOutput {
  items: { id: string; name: string; createdAt: string }[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function listArtistsUseCase(artistRepo: ArtistRepository) {
  return async function listArtists(input: ListArtistsInput): Promise<ListArtistsOutput> {
    const { items, total } = await artistRepo.list(input.page, input.limit);
    const totalPages = Math.ceil(total / input.limit) || 1;
    return {
      items: items.map((a) => ({ id: a.id, name: a.name, createdAt: a.createdAt.toISOString() })),
      page: input.page,
      limit: input.limit,
      total,
      totalPages,
    };
  };
}
