import { describe, expect, it } from 'vitest';
import { calculateAscensionTokenGain, getAscensionTokenIdleMultiplier, toNonNegativeInt } from './prestige.js';

describe('prestige', () => {
  it('gains no tokens below 1M coins this ascension', () => {
    expect(calculateAscensionTokenGain(0)).toBe(0);
    expect(calculateAscensionTokenGain(999_999)).toBe(0);
  });

  it('uses a soft sqrt curve from 1M coins', () => {
    expect(calculateAscensionTokenGain(1_000_000)).toBe(1);
    expect(calculateAscensionTokenGain(100_000_000)).toBe(10);
    expect(calculateAscensionTokenGain(10_000_000_000)).toBe(100);
  });

  it('applies +1% idle per Ascension Token', () => {
    expect(getAscensionTokenIdleMultiplier(0)).toBe(1);
    expect(getAscensionTokenIdleMultiplier(1)).toBe(1.01);
    expect(getAscensionTokenIdleMultiplier(50)).toBe(1.5);
    expect(getAscensionTokenIdleMultiplier(-3)).toBe(1);
  });

  it('does not wrap large token counts through signed int32', () => {
    const huge = 3_258_494_147;
    expect(toNonNegativeInt(huge)).toBe(huge);
    expect(getAscensionTokenIdleMultiplier(huge)).toBe(1 + huge * 0.01);
    // Corrupted save after legacy `| 0` (matches reporter screenshot)
    expect(toNonNegativeInt(-1_036_473_149, { recoverInt32Wrap: true })).toBe(huge);
    expect(toNonNegativeInt(-1_036_473_149)).toBe(0);
  });
});
