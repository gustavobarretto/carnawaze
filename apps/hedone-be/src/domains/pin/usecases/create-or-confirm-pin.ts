import { badRequest, notFound } from '../../../lib/errors.js';
import type { ArtistRepository } from '../../artist/gateway/artist-repository.js';
import type { PinRepository } from '../gateway/pin-repository.js';
import type { PinReportRepository } from '../gateway/pin-repository.js';
import { computeWeightedPosition } from './compute-weighted-position.js';

const PIN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const REPORT_WINDOW_MS = 60 * 60 * 1000; // consider reports from last 1h for position

export type PinReportType = 'create' | 'confirm';

export interface CreateOrConfirmPinInput {
  userId: string;
  artistId: string;
  lat: number;
  lng: number;
  type: PinReportType;
}

export interface CreateOrConfirmPinOutput {
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

export function createOrConfirmPinUseCase(
  artistRepo: ArtistRepository,
  pinRepo: PinRepository,
  pinReportRepo: PinReportRepository
) {
  return async function createOrConfirmPin(input: CreateOrConfirmPinInput): Promise<CreateOrConfirmPinOutput> {
    const artist = await artistRepo.findById(input.artistId);
    if (!artist) throw notFound('Artist not found');
    if (input.lat < -90 || input.lat > 90 || input.lng < -180 || input.lng > 180) {
      throw badRequest('VALIDATION_ERROR', 'Invalid coordinates');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PIN_EXPIRY_MS);
    const since = new Date(now.getTime() - REPORT_WINDOW_MS);

    let pin = await pinRepo.findByArtistId(input.artistId);

    if (!pin) {
      if (input.type !== 'create') throw badRequest('VALIDATION_ERROR', 'No existing pin to confirm');
      pin = await pinRepo.create(input.artistId, input.lat, input.lng, expiresAt);
      await pinReportRepo.create({
        pinId: pin.id,
        userId: input.userId,
        artistId: input.artistId,
        lat: input.lat,
        lng: input.lng,
        type: input.type,
      });
      const reportCount = await pinRepo.getReportCount(pin.id);
      return {
        pin: {
          id: pin.id,
          artistId: pin.artistId,
          lat: pin.lat,
          lng: pin.lng,
          reportCount,
          updatedAt: pin.updatedAt.toISOString(),
          expiresAt: pin.expiresAt.toISOString(),
        },
      };
    }

    if (input.type === 'confirm') {
      const alreadyReported = await pinReportRepo.hasUserReportedPin(input.userId, pin.id);
      if (alreadyReported) {
        const reportCount = await pinRepo.getReportCount(pin.id);
        return {
          pin: {
            id: pin.id,
            artistId: pin.artistId,
            lat: pin.lat,
            lng: pin.lng,
            reportCount,
            updatedAt: pin.updatedAt.toISOString(),
            expiresAt: pin.expiresAt.toISOString(),
          },
        };
      }
    }

    await pinReportRepo.create({
      pinId: pin.id,
      userId: input.userId,
      artistId: input.artistId,
      lat: input.lat,
      lng: input.lng,
      type: input.type,
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
