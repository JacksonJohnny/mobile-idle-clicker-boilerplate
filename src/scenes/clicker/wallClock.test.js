import { describe, expect, it } from 'vitest';
import { shouldShowOfflineReturn } from './wallClock.js';

describe('shouldShowOfflineReturn', () => {
  it('requires gain > 0 and elapsed >= 1', () => {
    expect(shouldShowOfflineReturn({ gain: 1, elapsedSeconds: 1 })).toBe(true);
    expect(shouldShowOfflineReturn({ gain: 5, elapsedSeconds: 0.5 })).toBe(false);
    expect(shouldShowOfflineReturn({ gain: 0, elapsedSeconds: 10 })).toBe(false);
    expect(shouldShowOfflineReturn({ gain: { gt: (n) => n < 2 }, elapsedSeconds: 2 })).toBe(true);
  });
});
