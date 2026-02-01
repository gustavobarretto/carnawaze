import type { User, Prisma } from '@prisma/client';

export interface UserRepository {
  create(data: { email: string; name: string; passwordHash: string }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
