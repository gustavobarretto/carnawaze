import { execSync } from 'child_process';
import { resolve } from 'path';

export default function globalSetup() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./e2e.sqlite';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'a'.repeat(32);
  const cwd = resolve(__dirname, '..');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    cwd,
  });
}
