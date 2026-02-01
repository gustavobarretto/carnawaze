import { notFound } from '../../../lib/errors.js';
import type { PinRepository } from '../gateway/pin-repository.js';
import type { PinReportRepository } from '../gateway/pin-repository.js';
import { computeWeightedPosition } from './compute-weighted-position.js';

const PIN_EXPIRY_MS = 60 * 60 * 1000;
const REPORT_WINDOW_MS = 60 * 60 * 1000;

export interface ReportIncorrectInput {
  userId: string;
  artistId: string;
  lat: number;
  lng: number;
}

export interface ReportIncorrectOutput {
  pin: {
    id: string;
    artistId: string;
    lat: number;
    lng: number;
    reportCount: number;
    updatedAt: string;
    expiresAt: string;
  };
}

export function reportIncorrectUseCase(
  pinRepo: PinRepository,
  pinReportRepo: PinReportRepository
) {
  return async function reportIncorrect(input: ReportIncorrectInput): Promise<ReportIncorrectOutput> {
    const pin = await pinRepo.findByArtistId(input.artistId);
    if (!pin) throw notFound('No pin found for this artist');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PIN_EXPIRY_MS);
    const since = new Date(now.getTime() - REPORT_WINDOW_MS);

    await pinReportRepo.create({
      pinId: pin.id,
      userId: input.userId,
      artistId: input.artistId,
      lat: input.lat,
      lng: input.lng,
      type: 'incorrect',
    });

    const reports = await pinReportRepo.findRecentByArtist(input.artistId, since);
    const { lat, lng } = computeWeightedPosition(reports, now);
    const updated = await pinRepo.updatePosition(pin.id, lat, lng, expiresAt);
    const reportCount = await pinRepo.getReportCount(updated.id);

    return {
      pin: {
        id: updated.id,
        artistId: updated.artistId,
        lat: updated.lat,
        lng: updated.lng,
        reportCount,
        updatedAt: updated.updatedAt.toISOString(),
        expiresAt: updated.expiresAt.toISOString(),
      },
    };
  };
}
