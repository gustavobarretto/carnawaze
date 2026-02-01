import * as bcrypt from 'bcryptjs';
import { badRequest } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';
import type { EmailConfirmationRepository } from '../gateway/email-confirmation-repository.js';
import { randomToken } from '../../../lib/jwt.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 24;

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface CreateUserOutput {
  user: { id: string; email: string; name: string; role: string; emailConfirmedAt: string | null };
  token: string;
  confirmationToken?: string; // for dev: send in email link
}

export function createUserUseCase(
  userRepo: UserRepository,
  emailConfirmationRepo: EmailConfirmationRepository,
  jwtSecret: string,
  signJwt: (secret: string, payload: { sub: string; email: string; role: string }) => string
) {
  return async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw badRequest('EMAIL_IN_USE', 'Email already registered');

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    const token = signJwt(jwtSecret, { sub: user.id, email: user.email, role: user.role });
    const confirmationToken = randomToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await emailConfirmationRepo.create(user.id, confirmationToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailConfirmedAt: user.emailConfirmedAt?.toISOString() ?? null,
      },
      token,
      confirmationToken, // In production, send via email; for dev we return for testing
    };
  };
}
