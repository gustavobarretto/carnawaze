import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { userRoutes } from './routes/user-routes.js';
import { artistRoutes } from './routes/artist-routes.js';
import { pinRoutes } from './routes/pin-routes.js';
import { statsRoutes } from './routes/stats-routes.js';
import { adminRoutes } from './routes/admin-routes.js';
import { AppError } from './lib/errors.js';
import type { Config } from './config.js';

export async function buildApp(config: Config) {
  const fastify = Fastify({ logger: config.NODE_ENV === 'development' });

  await fastify.register(cors, { origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',') });
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: { title: 'Carnawaze API', version: '1.0.0' },
      servers: [{ url: `http://localhost:${config.PORT}`, description: 'Local' }],
    },
    transform: ({ schema, url }) => {
      if ((schema as { config?: { hideFromSwagger?: boolean } })?.config?.hideFromSwagger) return { schema: undefined, url };
      return { schema, url };
    },
  });
  await fastify.register(swaggerUi, { routePrefix: '/docs' });

  fastify.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      const code = err.status === 'UNAUTHORIZED' ? 401 : err.status === 'FORBIDDEN' ? 403 : err.status === 'NOT_FOUND' ? 404 : 400;
      return reply.code(code).send(err.toJSON());
    }
    fastify.log.error(err);
    return reply.code(500).send({
      status: 'INTERNAL_ERROR',
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  await fastify.register(userRoutes, { jwtSecret: config.JWT_SECRET });
  await fastify.register(artistRoutes, { jwtSecret: config.JWT_SECRET });
  await fastify.register(pinRoutes, { jwtSecret: config.JWT_SECRET });
  await fastify.register(statsRoutes, { jwtSecret: config.JWT_SECRET });
  await fastify.register(adminRoutes, { jwtSecret: config.JWT_SECRET });

  return fastify;
}
