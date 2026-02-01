import { prisma } from '../../../lib/prisma.js';
import type { EmailConfirmationRepository } from './email-confirmation-repository.js';

export const prismaEmailConfirmationRepository: EmailConfirmationRepository = {
  async create(userId, token, expiresAt) {
    await prisma.emailConfirmationToken.upsert({
      where: { userId },
      create: { userId, token, expiresAt },
      update: { token, expiresAt },
    });
  },

  async findByToken(token) {
    const row = await prisma.emailConfirmationToken.findUnique({
      where: { token },
    });
    if (!row || row.expiresAt < new Date()) return null;
    return { userId: row.userId };
  },

  async deleteByUserId(userId) {
    await prisma.emailConfirmationToken.deleteMany({ where: { userId } });
  },
};
