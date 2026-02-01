import * as bcrypt from 'bcryptjs';
import { badRequest, notFound } from '../../../lib/errors.js';
import type { UserRepository } from '../gateway/user-repository.js';
import type { EmailConfirmationRepository } from '../gateway/email-confirmation-repository.js';
import { randomToken } from '../../../lib/jwt.js';

const TOKEN_EXPIRY_HOURS = 24;

export interface UpdateMeInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export interface UpdateMeOutput {
  user: { id: string; email: string; name: string; role: string; emailConfirmedAt: string | null };
  confirmationToken?: string; // if email changed
}

export function updateMeUseCase(
  userRepo: UserRepository,
  emailConfirmationRepo: EmailConfirmationRepository
) {
  return async function updateMe(userId: string, input: UpdateMeInput): Promise<UpdateMeOutput> {
    const user = await userRepo.findById(userId);
    if (!user) throw notFound('User not found');

    if (input.email && input.email !== user.email) {
      const existing = await userRepo.findByEmail(input.email);
      if (existing) throw badRequest('EMAIL_IN_USE', 'Email already in use');
      const confirmationToken = randomToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      const updateData: { email: string; emailConfirmedAt: null; name?: string } = {
        email: input.email,
        emailConfirmedAt: null,
      };
      if (input.name != null) updateData.name = input.name;
      await userRepo.update(userId, updateData);
      await emailConfirmationRepo.create(userId, confirmationToken, expiresAt);
      const updated = await userRepo.findById(userId);
      if (!updated) throw notFound('User not found');
      return {
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          emailConfirmedAt: null,
        },
        confirmationToken,
      };
    }

    const updateData: { name?: string; passwordHash?: string } = {};
    if (input.name != null) updateData.name = input.name;
    if (input.password != null) {
      if (!input.currentPassword) throw badRequest('VALIDATION_ERROR', 'Current password is required to change password');
      const match = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!match) throw badRequest('INVALID_PASSWORD', 'Current password is incorrect');
      updateData.passwordHash = await bcrypt.hash(input.password, 10);
    }
    const updated = await userRepo.update(userId, updateData);
    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        emailConfirmedAt: updated.emailConfirmedAt?.toISOString() ?? null,
      },
    };
  };
}
