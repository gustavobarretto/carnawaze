import { badRequest, notFound } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';
import type { EmailConfirmationRepository } from '../gateway/email-confirmation-repository.js';
import { randomAlphanumericCode } from '../../../lib/jwt.js';
import { sendConfirmationEmail } from '../../../lib/email.js';
import type { Config } from '../../../config.js';

const CONFIRMATION_EXPIRY_MINUTES = 10;

export interface ResendConfirmationInput {
  email: string;
}

export interface ResendConfirmationOutput {
  ok: boolean;
}

export function resendConfirmationUseCase(
  config: Config,
  userRepo: UserRepository,
  emailConfirmationRepo: EmailConfirmationRepository
) {
  return async function resendConfirmation(
    input: ResendConfirmationInput
  ): Promise<ResendConfirmationOutput> {
    const user = await userRepo.findByEmail(input.email);
    if (!user) throw notFound('User not found');
    if (user.emailConfirmedAt) throw badRequest('ALREADY_CONFIRMED', 'Email is already confirmed');

    const code = randomAlphanumericCode(6);
    const expiresAt = new Date(Date.now() + CONFIRMATION_EXPIRY_MINUTES * 60 * 1000);
    await emailConfirmationRepo.create(user.id, code, expiresAt);
    await sendConfirmationEmail(config, input.email, code);

    return { ok: true };
  };
}
