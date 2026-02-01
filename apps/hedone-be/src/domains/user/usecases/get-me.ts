import { notFound } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';

const __DEBUG = true; // debug: getMe use case

export interface GetMeOutput {
  user: { id: string; email: string; name: string; role: string; emailConfirmedAt: string | null; createdAt: string; updatedAt: string };
}

export function getMeUseCase(userRepo: UserRepository) {
  return async function getMe(userId: string): Promise<GetMeOutput> {
    if (__DEBUG) console.log('[BE GetMe] userId (JWT sub):', userId);
    const user = await userRepo.findById(userId);
    if (!user) throw notFound('User not found');
    if (__DEBUG) console.log('[BE GetMe] user do banco:', { id: user.id, email: user.email, name: user.name, role: user.role });
    const out = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailConfirmedAt: user.emailConfirmedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
    if (__DEBUG) console.log('[BE GetMe] resposta enviada ao frontend:', JSON.stringify(out, null, 2));
    return out;
  };
}
