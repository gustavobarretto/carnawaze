import type { FastifyInstance } from 'fastify';
import { listPinsUseCase } from '../domains/pin/usecases/list-pins.js';
import { createOrConfirmPinUseCase } from '../domains/pin/usecases/create-or-confirm-pin.js';
import { reportIncorrectUseCase } from '../domains/pin/usecases/report-incorrect.js';
import { getPinCountUseCase } from '../domains/pin/usecases/get-pin-count.js';
import { deletePinUseCase } from '../domains/pin/usecases/delete-pin.js';
import { prismaPinRepository } from '../domains/pin/gateway/prisma-pin-repository.js';
import { prismaPinReportRepository } from '../domains/pin/gateway/prisma-pin-repository.js';
import { prismaArtistRepository } from '../domains/artist/gateway/prisma-artist-repository.js';
import { authPreHandler, requireAdmin } from './auth-plugin.js';
import { createOrConfirmPinBody, reportIncorrectBody } from './schemas.js';
import { AppError } from '../lib/errors.js';

export async function pinRoutes(
  fastify: FastifyInstance,
  opts: { jwtSecret: string }
) {
  const pinRepo = prismaPinRepository;
  const pinReportRepo = prismaPinReportRepository;
  const artistRepo = prismaArtistRepository;
  const listPins = listPinsUseCase(pinRepo);
  const createOrConfirmPin = createOrConfirmPinUseCase(artistRepo, pinRepo, pinReportRepo);
  const reportIncorrect = reportIncorrectUseCase(pinRepo, pinReportRepo);
  const getPinCount = getPinCountUseCase(pinRepo);
  const deletePin = deletePinUseCase(pinRepo);

  fastify.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler(opts.jwtSecret));

    scope.get(
      '/v1/pins',
      {
        schema: {
          description: 'List active pins for map',
          response: {
            200: {
              type: 'object',
              properties: {
                pins: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {}, artistId: {}, artist: {}, lat: {}, lng: {},
                      reportCount: {}, updatedAt: {}, expiresAt: {},
                    },
                  },
                },
              },
            },
          },
        },
      },
      async (_request, reply) => {
        const out = await listPins();
        return reply.send(out);
      }
    );

    scope.post(
      '/v1/pins',
      {
        schema: {
          description: 'Create or confirm a pin for an artist',
          body: {
            type: 'object',
            required: ['artistId', 'lat', 'lng', 'type'],
            properties: {
              artistId: { type: 'string', format: 'uuid' },
              lat: { type: 'number' },
              lng: { type: 'number' },
              type: { type: 'string', enum: ['create', 'confirm'] },
            },
          },
          response: { 200: { type: 'object', properties: { pin: { type: 'object' } } } },
        },
      },
      async (request, reply) => {
        const parsed = createOrConfirmPinBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({
            status: 'BAD_REQUEST',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }
        try {
          const out = await createOrConfirmPin({
            userId: request.user!.sub,
            artistId: parsed.data.artistId,
            lat: parsed.data.lat,
            lng: parsed.data.lng,
            type: parsed.data.type,
          });
          return reply.send(out);
        } catch (e) {
          if (e instanceof AppError) {
            const code = e.status === 'NOT_FOUND' ? 404 : 400;
            return reply.code(code).send(e.toJSON());
          }
          throw e;
        }
      }
    );

    scope.post(
      '/v1/pins/report-incorrect',
      {
        schema: {
          description: 'Report that a pin position is incorrect',
          body: {
            type: 'object',
            required: ['artistId', 'lat', 'lng'],
            properties: {
              artistId: { type: 'string', format: 'uuid' },
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
          response: { 200: { type: 'object', properties: { pin: { type: 'object' } } } },
        },
      },
      async (request, reply) => {
        const parsed = reportIncorrectBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({
            status: 'BAD_REQUEST',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }
        try {
          const out = await reportIncorrect({
            userId: request.user!.sub,
            artistId: parsed.data.artistId,
            lat: parsed.data.lat,
            lng: parsed.data.lng,
          });
          return reply.send(out);
        } catch (e) {
          if (e instanceof AppError) {
            return reply.code(404).send(e.toJSON());
          }
          throw e;
        }
      }
    );

    scope.get<{ Params: { id: string } }>(
      '/v1/pins/:id/count',
      {
        schema: {
          description: 'Get report count for a pin',
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: { 200: { type: 'object', properties: { pinId: {}, reportCount: {} } } },
        },
      },
      async (request, reply) => {
        const out = await getPinCount({ pinId: request.params.id });
        return reply.send(out);
      }
    );

    scope.delete<{ Params: { id: string } }>(
      '/v1/pins/:id',
      {
        schema: {
          description: 'Delete a pin (admin only)',
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
        },
      },
      async (request, reply) => {
        requireAdmin(request);
        try {
          const out = await deletePin({ pinId: request.params.id });
          return reply.send(out);
        } catch (e) {
          if (e instanceof AppError) {
            return reply.code(e.status === 'NOT_FOUND' ? 404 : 400).send(e.toJSON());
          }
          throw e;
        }
      }
    );
  });
}
