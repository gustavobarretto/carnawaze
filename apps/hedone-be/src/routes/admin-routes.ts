import type { FastifyInstance } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { prismaUserRepository } from '../domains/user/gateway/prisma-user-repository.js';
import { authPreHandler } from './auth-plugin.js';
import { requireAdmin } from './auth-plugin.js';
import { createAdminUserBody } from './schemas.js';
import { AppError } from '../lib/errors.js';

/**
 * Admin-only route: create admin user.
 * Not exposed in Swagger (hidden from public API docs).
 */
export async function adminRoutes(
  fastify: FastifyInstance,
  opts: { jwtSecret: string }
) {
  const userRepo = prismaUserRepository;

  fastify.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler(opts.jwtSecret));

    scope.post(
      '/v1/admin/users',
      {
        config: { hideFromSwagger: true },
        schema: false,
      },
      async (request, reply) => {
        requireAdmin(request);
        const parsed = createAdminUserBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({
            status: 'BAD_REQUEST',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }
        const existing = await userRepo.findByEmail(parsed.data.email);
        if (existing) {
          return reply.code(400).send(
            new AppError('BAD_REQUEST', 'EMAIL_IN_USE', 'Email already registered').toJSON()
          );
        }
        const passwordHash = await bcrypt.hash(parsed.data.password, 10);
        const user = await userRepo.create({
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash,
        });
        await userRepo.update(user.id, { role: 'admin' });
        const updated = await userRepo.findById(user.id);
        return reply.code(201).send({
          user: updated
            ? {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
                emailConfirmedAt: updated.emailConfirmedAt?.toISOString() ?? null,
              }
            : null,
        });
      }
    );
  });
}
