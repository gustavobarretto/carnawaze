import { notFound } from '../../../lib/errors.js';
import type { PinRepository } from '../gateway/pin-repository.js';

export interface DeletePinInput {
  pinId: string;
}

export function deletePinUseCase(pinRepo: PinRepository) {
  return async function deletePin(input: DeletePinInput): Promise<{ ok: true }> {
    const pin = await pinRepo.findById(input.pinId);
    if (!pin) throw notFound('Pin not found');
    await pinRepo.delete(input.pinId);
    return { ok: true };
  };
}
