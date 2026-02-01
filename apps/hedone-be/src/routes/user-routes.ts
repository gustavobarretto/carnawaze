import type { FastifyInstance } from 'fastify';
import { createUserUseCase } from '../domains/user/usecases/create-user.js';
import { loginUseCase } from '../domains/user/usecases/login.js';
import { confirmEmailUseCase } from '../domains/user/usecases/confirm-email.js';
import { getMeUseCase } from '../domains/user/usecases/get-me.js';
import { updateMeUseCase } from '../domains/user/usecases/update-me.js';
import { prismaUserRepository } from '../domains/user/gateway/prisma-user-repository.js';
import { prismaEmailConfirmationRepository } from '../domains/user/gateway/prisma-email-confirmation-repository.js';
import { signJwt } from '../lib/jwt.js';
import { authPreHandler } from './auth-plugin.js';
import {
  createUserBody,
  confirmEmailBody,
  loginBody,
  updateMeBody,
} from './schemas.js';
import { AppError } from '../lib/errors.js';

export async function userRoutes(
  fastify: FastifyInstance,
  opts: { jwtSecret: string }
) {
  const userRepo = prismaUserRepository;
  const emailConfirmationRepo = prismaEmailConfirmationRepository;
  const createUser = createUserUseCase(userRepo, emailConfirmationRepo, opts.jwtSecret, signJwt);
  const login = loginUseCase(userRepo, opts.jwtSecret, signJwt);
  const confirmEmail = confirmEmailUseCase(userRepo, emailConfirmationRepo);
  const getMe = getMeUseCase(userRepo);
  const updateMe = updateMeUseCase(userRepo, emailConfirmationRepo);

  fastify.post(
    '/v1/users',
    {
      schema: {
        description: 'Register a new user',
        body: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            password: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: { type: 'object', properties: { id: {}, email: {}, name: {}, role: {}, emailConfirmedAt: {} } },
              token: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = createUserBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      try {
        const out = await createUser(parsed.data);
        return reply.code(201).send({ user: out.user, token: out.token });
      } catch (e) {
        if (e instanceof AppError) {
          return reply.code(400).send(e.toJSON());
        }
        throw e;
      }
    }
  );

  fastify.post(
    '/v1/auth/confirm-email',
    {
      schema: {
        description: 'Confirm email with token from link',
        body: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
      },
    },
    async (request, reply) => {
      const parsed = confirmEmailBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      try {
        await confirmEmail(parsed.data);
        return reply.send({ ok: true });
      } catch (e) {
        if (e instanceof AppError) {
          return reply.code(400).send(e.toJSON());
        }
        throw e;
      }
    }
  );

  fastify.post(
    '/v1/auth/login',
    {
      schema: {
        description: 'Login with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string' }, password: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  emailConfirmedAt: { type: ['string', 'null'] },
                },
              },
              token: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = loginBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      try {
        const out = await login(parsed.data);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[BE Route] POST /v1/auth/login body:', parsed.data.email, '→ response user:', out.user);
        }
        return reply.send(out);
      } catch (e) {
        if (e instanceof AppError) {
          return reply.code(401).send(e.toJSON());
        }
        throw e;
      }
    }
  );

  fastify.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler(opts.jwtSecret));

    scope.get(
      '/v1/users/me',
      {
        schema: {
          description: 'Get current user profile',
          response: {
            200: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    emailConfirmedAt: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const userId = request.user!.sub;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[BE Route] GET /v1/users/me request.user (JWT):', request.user);
        }
        const out = await getMe(userId);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[BE Route] GET /v1/users/me response:', out);
        }
        return reply.send(out);
      }
    );

    scope.patch(
      '/v1/users/me',
      {
        schema: {
          description: 'Update current user profile',
          body: {
            type: 'object',
            properties: { name: {}, email: {}, password: {} },
          },
          response: {
            200: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    emailConfirmedAt: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const parsed = updateMeBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({
            status: 'BAD_REQUEST',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }
        try {
          const out = await updateMe(request.user!.sub, parsed.data);
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
  });
}
