import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { SAVE_KEY } from '../config/gameConfig.js';
import { loadSettings, saveSettings } from './settingsStorage.js';

const SETTINGS_KEY = `${SAVE_KEY}-settings`;

describe('settingsStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual({ soundEnabled: true, buyAmount: 1 });
  });

  it('returns defaults for corrupt JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not-json');
    expect(loadSettings()).toEqual({ soundEnabled: true, buyAmount: 1 });
  });

  it('normalizes legacy buyAmount ×100 to 25', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ soundEnabled: true, buyAmount: 100 }));
    expect(loadSettings().buyAmount).toBe(25);
  });

  it('round-trips saved settings', () => {
    saveSettings({ soundEnabled: false, buyAmount: 10 });
    expect(loadSettings()).toEqual({ soundEnabled: false, buyAmount: 10 });
  });
});
