import { prisma } from '../../../lib/prisma.js';
import type { StatsRepository } from './stats-repository.js';

export const prismaStatsRepository: StatsRepository = {
  async countUsers() {
    return prisma.user.count();
  },

  async countPinsByMinute() {
    const rows = await prisma.$queryRaw<
      Array<{ minute: string; count: bigint }>
    >`
      SELECT strftime('%Y-%m-%d %H:%M', created_at) as minute, COUNT(*) as count
      FROM PinReport
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY minute
      ORDER BY minute DESC
      LIMIT 60
    `;
    return rows.map((r) => ({ minute: r.minute, count: Number(r.count) }));
  },
};
