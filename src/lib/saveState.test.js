import { describe, expect, it } from 'vitest';
import { normalizeSaveState } from './saveState.js';

describe('normalizeSaveState', () => {
  it('fills missing fields with safe defaults', () => {
    const next = normalizeSaveState({});
    expect(next.coins).toBe('0');
    expect(next.totalClicks).toBe(0);
    expect(next.autoTapProgress).toBe(0);
    expect(next.upgrades).toEqual([]);
    expect(next.boosts).toEqual([]);
    expect(next.ascensionTokens).toBe(0);
    expect(next.prestigeCount).toBe(0);
    expect(next.unlockedAchievements).toEqual([]);
  });

  it('remaps generator-N aliases to upgrade-N', () => {
    const next = normalizeSaveState({
      upgrades: [{ id: 'generator-1', level: 3 }],
      boosts: [{ id: 'generator-1-efficiency-1', purchased: true }],
    });
    expect(next.upgrades).toEqual([{ id: 'upgrade-1', level: 3 }]);
    expect(next.boosts).toEqual([{ id: 'upgrade-1-efficiency-1', purchased: true }]);
  });

  it('clamps negative upgrade levels to 0', () => {
    const next = normalizeSaveState({
      upgrades: [{ id: 'upgrade-1', level: -5 }],
    });
    expect(next.upgrades[0].level).toBe(0);
  });

  it('recovers int32-wrapped negative ascensionTokens', () => {
    const next = normalizeSaveState({ ascensionTokens: -1036473149 });
    expect(next.ascensionTokens).toBe(3258494147);
  });

  it('drops ownedModifiers', () => {
    const next = normalizeSaveState({ ownedModifiers: ['x'], coins: '1' });
    expect(next.ownedModifiers).toBeUndefined();
  });

  it('maps stars to ascensionTokens', () => {
    const next = normalizeSaveState({ stars: 12 });
    expect(next.ascensionTokens).toBe(12);
    expect(next.stars).toBeUndefined();
  });
});
