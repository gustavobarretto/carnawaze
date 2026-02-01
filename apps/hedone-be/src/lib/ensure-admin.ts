import * as bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

/** Default admin for local development only. This module is never called in production (see server.ts). */
const ADMIN_EMAIL = 'admin@carnawaze.local';
const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = 'Admin';

export async function ensureAdminUser(): Promise<void> {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hash,
      role: 'admin',
      emailConfirmedAt: new Date(),
    },
    update: {
      name: ADMIN_NAME,
      role: 'admin',
      emailConfirmedAt: new Date(),
    },
  });
  console.log(`[dev] Admin user ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}
