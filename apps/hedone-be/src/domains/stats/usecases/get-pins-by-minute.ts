import type { StatsRepository } from '../gateway/stats-repository.js';

export interface GetPinsByMinuteOutput {
  data: Array<{ minute: string; count: number }>;
}

export function getPinsByMinuteUseCase(statsRepo: StatsRepository) {
  return async function getPinsByMinute(): Promise<GetPinsByMinuteOutput> {
    const data = await statsRepo.countPinsByMinute();
    return { data };
  };
}
