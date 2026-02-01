import { loadConfig } from './config.js';
import { buildApp } from './app.js';
import { ensureAdminUser } from './lib/ensure-admin.js';
import { seedCarnivalArtists } from './lib/seed-artists.js';

async function main() {
  const config = loadConfig();
  if (config.NODE_ENV === 'development') {
    await ensureAdminUser();
    await seedCarnivalArtists();
  }
  const app = await buildApp(config);
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  console.log(`Carnawaze BE listening on http://localhost:${config.PORT}`);
  console.log(`Swagger: http://localhost:${config.PORT}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
