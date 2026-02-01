import type { Artist } from '@prisma/client';

export interface ArtistRepository {
  create(name: string): Promise<Artist>;
  findById(id: string): Promise<Artist | null>;
  list(page: number, limit: number): Promise<{ items: Artist[]; total: number }>;
  search(query: string, limit: number): Promise<Artist[]>;
  delete(id: string): Promise<void>;
}
