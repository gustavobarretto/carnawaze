import { notFound } from '../../../lib/errors.js';
import type { PinRepository } from '../gateway/pin-repository.js';

export interface GetPinCountInput {
  pinId: string;
}

export interface GetPinCountOutput {
  pinId: string;
  reportCount: number;
}

export function getPinCountUseCase(pinRepo: PinRepository) {
  return async function getPinCount(input: GetPinCountInput): Promise<GetPinCountOutput> {
    const count = await pinRepo.getReportCount(input.pinId);
    return { pinId: input.pinId, reportCount: count };
  };
}
