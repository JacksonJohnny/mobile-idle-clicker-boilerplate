import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { SAVE_KEY, LEGACY_SAVE_KEYS } from '../config/gameConfig.js';
import { purgeGameStorageKeys, storageSetItem } from './storageAdapter.js';

describe('purgeGameStorageKeys', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('removes save, settings, and legacy keys only', () => {
    storageSetItem(SAVE_KEY, 'save');
    storageSetItem(`${SAVE_KEY}-settings`, 'settings');
    storageSetItem('unrelated-key', 'keep');
    for (const key of LEGACY_SAVE_KEYS) {
      storageSetItem(key, 'legacy');
    }

    purgeGameStorageKeys();

    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(localStorage.getItem(`${SAVE_KEY}-settings`)).toBeNull();
    expect(localStorage.getItem('unrelated-key')).toBe('keep');
    for (const key of LEGACY_SAVE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});
