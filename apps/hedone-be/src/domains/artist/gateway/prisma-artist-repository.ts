import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import type { ArtistRepository } from './artist-repository.js';
import type { Artist } from '@prisma/client';

export const prismaArtistRepository: ArtistRepository = {
  async create(name) {
    return prisma.artist.create({ data: { name } });
  },

  async findById(id) {
    return prisma.artist.findUnique({ where: { id } });
  },

  async list(page, limit) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.artist.findMany({ orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.artist.count(),
    ]);
    return { items, total };
  },

  async search(query, limit): Promise<Artist[]> {
    const q = query.trim();
    if (!q) return prisma.artist.findMany({ orderBy: { name: 'asc' }, take: limit });
    // SQLite não suporta mode: 'insensitive' no Prisma; usar raw com LOWER() para busca parcial case-insensitive.
    const pattern = '%' + q.replace(/%/g, '\\%').replace(/_/g, '\\_') + '%';
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; created_at: string }>>(
      Prisma.sql`
        SELECT id, name, created_at FROM Artist
        WHERE LOWER(name) LIKE LOWER(${pattern})
        ORDER BY name ASC
        LIMIT ${limit}
      `
    );
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: new Date(r.created_at) }));
  },

  async delete(id) {
    await prisma.artist.delete({ where: { id } });
  },
};
