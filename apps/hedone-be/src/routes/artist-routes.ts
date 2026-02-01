import type { FastifyInstance } from 'fastify';
import { listArtistsUseCase } from '../domains/artist/usecases/list-artists.js';
import { searchArtistsUseCase } from '../domains/artist/usecases/search-artists.js';
import { createArtistUseCase } from '../domains/artist/usecases/create-artist.js';
import { deleteArtistUseCase } from '../domains/artist/usecases/delete-artist.js';
import { prismaArtistRepository } from '../domains/artist/gateway/prisma-artist-repository.js';
import { authPreHandler } from './auth-plugin.js';
import { requireAdmin } from './auth-plugin.js';
import { createArtistBody } from './schemas.js';
import { AppError } from '../lib/errors.js';

export async function artistRoutes(
  fastify: FastifyInstance,
  opts: { jwtSecret: string }
) {
  const artistRepo = prismaArtistRepository;
  const listArtists = listArtistsUseCase(artistRepo);
  const searchArtists = searchArtistsUseCase(artistRepo);
  const createArtist = createArtistUseCase(artistRepo);
  const deleteArtist = deleteArtistUseCase(artistRepo);

  fastify.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler(opts.jwtSecret));

    scope.get<{ Querystring: { q?: string; page?: string; limit?: string } }>(
      '/v1/artists',
      {
        schema: {
          description: 'Search artists by name (user: ?q=) or list with pagination (admin: ?page=&limit=)',
          querystring: {
            type: 'object',
            properties: { q: { type: 'string' }, page: { type: 'integer' }, limit: { type: 'integer' } },
          },
          response: {
            200: {
              type: 'object',
              properties: {
                artists: { type: 'array', items: { type: 'object', properties: { id: {}, name: {} } } },
                items: { type: 'array' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const qs = request.query as { q?: string; page?: string; limit?: string };
        const isAdmin = request.user?.role === 'admin';
        if (isAdmin && qs.q === undefined && (qs.page !== undefined || qs.limit !== undefined)) {
          const page = Math.max(1, parseInt(qs.page ?? '1', 10));
          const limit = Math.min(100, Math.max(1, parseInt(qs.limit ?? '20', 10)));
          const out = await listArtists({ page, limit });
          return reply.send(out);
        }
        const q = qs.q ?? '';
        const limit = Math.min(parseInt(qs.limit ?? '20', 10), 50);
        const out = await searchArtists({ q, limit });
        return reply.send(out);
      }
    );

    scope.post(
      '/v1/artists',
      {
        schema: {
          description: 'Create artist (admin only)',
          body: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          response: { 201: { type: 'object', properties: { artist: { type: 'object' } } } },
        },
      },
      async (request, reply) => {
        requireAdmin(request);
        const parsed = createArtistBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({
            status: 'BAD_REQUEST',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }
        try {
          const out = await createArtist(parsed.data);
          return reply.code(201).send(out);
        } catch (e) {
          if (e instanceof AppError) {
            return reply.code(400).send(e.toJSON());
          }
          throw e;
        }
      }
    );

    scope.delete<{ Params: { id: string } }>(
      '/v1/artists/:id',
      {
        schema: {
          description: 'Delete artist (admin only)',
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
        },
      },
      async (request, reply) => {
        requireAdmin(request);
        try {
          const out = await deleteArtist({ artistId: request.params.id });
          return reply.send(out);
        } catch (e) {
          if (e instanceof AppError) {
            return reply.code(404).send(e.toJSON());
          }
          throw e;
        }
      }
    );
  });
}
