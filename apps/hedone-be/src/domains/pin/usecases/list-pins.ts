import type { PinRepository } from '../gateway/pin-repository.js';

export interface ListPinsOutput {
  pins: Array<{
    id: string;
    artistId: string;
    artist: { id: string; name: string };
    lat: number;
    lng: number;
    reportCount: number;
    updatedAt: string;
    expiresAt: string;
  }>;
}

const PIN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function listPinsUseCase(pinRepo: PinRepository) {
  return async function listPins(): Promise<ListPinsOutput> {
    await pinRepo.deleteExpired();
    const pins = await pinRepo.findActive();
    return {
      pins: pins.map((p) => ({
        id: p.id,
        artistId: p.artistId,
        artist: p.artist,
        lat: p.lat,
        lng: p.lng,
        reportCount: p._count?.pinReports ?? 0,
        updatedAt: p.updatedAt.toISOString(),
        expiresAt: p.expiresAt.toISOString(),
      })),
    };
  };
}
