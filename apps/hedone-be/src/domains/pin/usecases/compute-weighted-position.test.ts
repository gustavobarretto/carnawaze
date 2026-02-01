import { describe, it, expect } from 'vitest';
import { computeWeightedPosition } from './compute-weighted-position.js';

describe('computeWeightedPosition', () => {
  it('returns center of single report', () => {
    const now = new Date();
    const result = computeWeightedPosition(
      [{ lat: -12.97, lng: -38.5, type: 'create', createdAt: now }],
      now
    );
    expect(result.lat).toBeCloseTo(-12.97);
    expect(result.lng).toBeCloseTo(-38.5);
  });

  it('weights newer reports higher', () => {
    const now = new Date();
    const old = new Date(now.getTime() - 60 * 60 * 1000);
    const result = computeWeightedPosition(
      [
        { lat: 0, lng: 0, type: 'create', createdAt: old },
        { lat: 10, lng: 10, type: 'confirm', createdAt: now },
      ],
      now
    );
    expect(result.lat).toBeGreaterThan(5);
    expect(result.lng).toBeGreaterThan(5);
  });

  it('handles empty array with fallback in caller', () => {
    const result = computeWeightedPosition([]);
    expect(result).toEqual({ lat: 0, lng: 0 });
  });
});
