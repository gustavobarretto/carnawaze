import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carnawaze.local' },
    create: {
      email: 'admin@carnawaze.local',
      name: 'Admin',
      passwordHash: hash,
      role: 'admin',
      emailConfirmedAt: new Date(),
    },
    update: {},
  });
  console.log('Seeded admin:', admin.email, '(password: admin)');

  const existing = await prisma.artist.findFirst({ where: { name: 'Ivete Sangalo' } });
  if (!existing) {
    const artist = await prisma.artist.create({ data: { name: 'Ivete Sangalo' } });
    console.log('Seeded artist:', artist.name);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
