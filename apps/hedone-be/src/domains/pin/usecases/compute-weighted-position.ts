/**
 * Space-time weighted average: newer reports have higher weight.
 * weight = 2^(-ageMinutes / 30) so after 30 min half weight.
 * "incorrect" reports get negative weight (reduce position influence).
 */
const HALF_LIFE_MINUTES = 30;

export interface ReportPoint {
  lat: number;
  lng: number;
  type: string;
  createdAt: Date;
}

export function computeWeightedPosition(
  reports: ReportPoint[],
  now: Date = new Date()
): { lat: number; lng: number } {
  if (reports.length === 0) return { lat: 0, lng: 0 };
  let sumLat = 0;
  let sumLng = 0;
  let sumW = 0;
  for (const r of reports) {
    const ageMinutes = (now.getTime() - r.createdAt.getTime()) / (60 * 1000);
    const timeWeight = Math.pow(2, -ageMinutes / HALF_LIFE_MINUTES);
    const typeMultiplier = r.type === 'incorrect' ? -0.5 : 1;
    const w = timeWeight * typeMultiplier;
    sumLat += r.lat * w;
    sumLng += r.lng * w;
    sumW += w;
  }
  if (sumW <= 0) {
    const last = reports[0];
    return { lat: last.lat, lng: last.lng };
  }
  return {
    lat: sumLat / sumW,
    lng: sumLng / sumW,
  };
}
