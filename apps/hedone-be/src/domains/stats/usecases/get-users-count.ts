import type { StatsRepository } from '../gateway/stats-repository.js';

export interface GetUsersCountOutput {
  total: number;
}

export function getUsersCountUseCase(statsRepo: StatsRepository) {
  return async function getUsersCount(): Promise<GetUsersCountOutput> {
    const total = await statsRepo.countUsers();
    return { total };
  };
}
