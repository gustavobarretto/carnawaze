import { badRequest } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';
import type { EmailConfirmationRepository } from '../gateway/email-confirmation-repository.js';

export interface ConfirmEmailInput {
  token: string;
}

export interface ConfirmEmailOutput {
  ok: boolean;
}

export function confirmEmailUseCase(
  userRepo: UserRepository,
  emailConfirmationRepo: EmailConfirmationRepository
) {
  return async function confirmEmail(input: ConfirmEmailInput): Promise<ConfirmEmailOutput> {
    const found = await emailConfirmationRepo.findByToken(input.token);
    if (!found) throw badRequest('INVALID_OR_EXPIRED_TOKEN', 'Invalid or expired confirmation token');

    await userRepo.update(found.userId, { emailConfirmedAt: new Date() });
    await emailConfirmationRepo.deleteByUserId(found.userId);
    return { ok: true };
  };
}
