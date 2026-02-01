export interface EmailConfirmationRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<{ userId: string } | null>;
  deleteByUserId(userId: string): Promise<void>;
}
