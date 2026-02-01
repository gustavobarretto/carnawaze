export interface StatsRepository {
  countUsers(): Promise<number>;
  countPinsByMinute(): Promise<Array<{ minute: string; count: number }>>;
}
