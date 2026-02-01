import type { Pin, PinReport } from '@prisma/client';

export interface PinWithArtist extends Pin {
  artist: { id: string; name: string };
  _count?: { pinReports: number };
}

export interface PinReportRepository {
  create(data: { pinId: string | null; userId: string; artistId: string; lat: number; lng: number; type: string }): Promise<PinReport>;
  findRecentByArtist(artistId: string, since: Date): Promise<Array<{ lat: number; lng: number; type: string; createdAt: Date }>>;
  /** True if this user already has a 'confirm' report for this pin. */
  hasUserConfirmedPin(userId: string, pinId: string): Promise<boolean>;
  /** True if this user already contributed to this pin (create or confirm) — não pode confirmar de novo. */
  hasUserReportedPin(userId: string, pinId: string): Promise<boolean>;
}

export interface PinRepository {
  findActive(): Promise<PinWithArtist[]>;
  findById(id: string): Promise<Pin | null>;
  findByArtistId(artistId: string): Promise<Pin | null>;
  create(artistId: string, lat: number, lng: number, expiresAt: Date): Promise<Pin>;
  updatePosition(id: string, lat: number, lng: number, expiresAt: Date): Promise<Pin>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
  /** Conta apenas reports do tipo create e confirm (não inclui "incorrect"). */
  getReportCount(pinId: string): Promise<number>;
  getReportCounts(pinIds: string[]): Promise<Record<string, number>>;
}
