import { prisma } from '../../../lib/prisma.js';
import type { PinRepository, PinReportRepository, PinWithArtist } from './pin-repository.js';

export const prismaPinReportRepository: PinReportRepository = {
  async create(data) {
    return prisma.pinReport.create({
      data: {
        pinId: data.pinId,
        userId: data.userId,
        artistId: data.artistId,
        lat: data.lat,
        lng: data.lng,
        type: data.type,
      },
    });
  },

  async findRecentByArtist(artistId, since) {
    const rows = await prisma.pinReport.findMany({
      where: { artistId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { lat: true, lng: true, type: true, createdAt: true },
    });
    return rows;
  },

  async hasUserConfirmedPin(userId, pinId) {
    const count = await prisma.pinReport.count({
      where: { userId, pinId, type: 'confirm' },
    });
    return count > 0;
  },
};

const pinInclude = { artist: { select: { id: true, name: true } }, _count: { select: { pinReports: true } } };

export const prismaPinRepository: PinRepository = {
  async findActive() {
    const now = new Date();
    const pins = await prisma.pin.findMany({
      where: { expiresAt: { gt: now } },
      include: pinInclude,
    }) as PinWithArtist[];
    return pins;
  },

  async findById(id) {
    return prisma.pin.findUnique({ where: { id } });
  },

  async findByArtistId(artistId) {
    return prisma.pin.findFirst({
      where: { artistId, expiresAt: { gt: new Date() } },
    });
  },

  async create(artistId, lat, lng, expiresAt) {
    return prisma.pin.create({
      data: { artistId, lat, lng, expiresAt },
    });
  },

  async updatePosition(id, lat, lng, expiresAt) {
    return prisma.pin.update({
      where: { id },
      data: { lat, lng, expiresAt },
    });
  },

  async delete(id) {
    await prisma.pin.delete({ where: { id } });
  },

  async deleteExpired() {
    const result = await prisma.pin.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return result.count;
  },

  async getReportCount(pinId) {
    return prisma.pinReport.count({ where: { pinId } });
  },
};
