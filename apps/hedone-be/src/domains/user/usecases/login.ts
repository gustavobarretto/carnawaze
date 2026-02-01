import * as bcrypt from 'bcryptjs';
import { AppError, unauthorized } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';
import type { JwtPayload } from '../../../lib/jwt.js';

const __DEBUG = true; // debug: login use case

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: { id: string; email: string; name: string; role: string; emailConfirmedAt: string | null };
  token: string;
}

export function loginUseCase(
  userRepo: UserRepository,
  jwtSecret: string,
  signJwt: (secret: string, payload: { sub: string; email: string; role: string }) => string
) {
  return async function login(input: LoginInput): Promise<LoginOutput> {
    if (__DEBUG) console.log('[BE Login] input:', { email: input.email });
    const user = await userRepo.findByEmail(input.email);
    if (!user) throw unauthorized('Invalid email or password');
    if (__DEBUG) console.log('[BE Login] user do banco (antes de montar resposta):', { id: user.id, email: user.email, name: user.name, role: user.role });

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');

    if (!user.emailConfirmedAt) {
      throw new AppError('FORBIDDEN', 'EMAIL_NOT_CONFIRMED', 'Confirm your email to sign in. Check your inbox for the code.');
    }

    const token = signJwt(jwtSecret, { sub: user.id, email: user.email, role: user.role });
    const out = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailConfirmedAt: user.emailConfirmedAt?.toISOString() ?? null,
      },
      token,
    };
    if (__DEBUG) console.log('[BE Login] resposta enviada ao frontend:', JSON.stringify(out, null, 2));
    return out;
  };
}
