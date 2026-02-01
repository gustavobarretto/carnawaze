import { prisma } from '../../../lib/prisma.js';
import type { UserRepository } from './user-repository.js';

const __DEBUG_DB = true; // debug: retorno do banco

export const prismaUserRepository: UserRepository = {
  async create(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });
  },

  async findByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    if (__DEBUG_DB) console.log('[BE DB] findByEmail(', email, ') →', row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null);
    return row;
  },

  async findById(id) {
    const row = await prisma.user.findUnique({ where: { id } });
    if (__DEBUG_DB) console.log('[BE DB] findById(', id, ') →', row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null);
    return row;
  },

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },
};
