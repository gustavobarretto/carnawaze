import type { FastifyInstance } from 'fastify';
import { getUsersCountUseCase } from '../domains/stats/usecases/get-users-count.js';
import { getPinsByMinuteUseCase } from '../domains/stats/usecases/get-pins-by-minute.js';
import { prismaStatsRepository } from '../domains/stats/gateway/prisma-stats-repository.js';
import { authPreHandler } from './auth-plugin.js';
import { requireAdmin } from './auth-plugin.js';

export async function statsRoutes(
  fastify: FastifyInstance,
  opts: { jwtSecret: string }
) {
  const statsRepo = prismaStatsRepository;
  const getUsersCount = getUsersCountUseCase(statsRepo);
  const getPinsByMinute = getPinsByMinuteUseCase(statsRepo);

  fastify.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler(opts.jwtSecret));

    scope.get(
      '/v1/stats/users-count',
      {
        schema: {
          description: 'Get total users count (admin only)',
          response: { 200: { type: 'object', properties: { total: { type: 'integer' } } } },
        },
      },
      async (request, reply) => {
        requireAdmin(request);
        const out = await getUsersCount();
        return reply.send(out);
      }
    );

    scope.get(
      '/v1/stats/pins-by-minute',
      {
        schema: {
          description: 'Get pins count by minute (admin only)',
          response: {
            200: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { minute: { type: 'string' }, count: { type: 'integer' } },
                  },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        requireAdmin(request);
        const out = await getPinsByMinute();
        return reply.send(out);
      }
    );
  });
}
