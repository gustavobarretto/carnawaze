import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt, type JwtPayload } from '../lib/jwt.js';
import { forbidden } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export function authPreHandler(jwtSecret: string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({
        status: 'UNAUTHORIZED',
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
      });
    }
    const token = authHeader.slice(7);
    try {
      request.user = verifyJwt(jwtSecret, token);
    } catch {
      return reply.code(401).send({
        status: 'UNAUTHORIZED',
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }
  };
}

export function requireAdmin(request: FastifyRequest) {
  if (!request.user || request.user.role !== 'admin') {
    throw forbidden('Admin access required');
  }
}
