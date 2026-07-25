import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createFeedbackService } from './feedback.js';

function mockScene() {
  const floatText = { destroy: vi.fn(), setOrigin: vi.fn().mockReturnThis() };
  return {
    scale: { width: 540 },
    add: {
      text: vi.fn(() => floatText),
    },
    tweens: { add: vi.fn() },
    cameras: { main: { shake: vi.fn() } },
    upgradeCamera: { ignore: vi.fn() },
    metaCamera: { ignore: vi.fn() },
    _floatText: floatText,
  };
}

describe('createFeedbackService', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContext() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
        this.createOscillator = () => ({
          type: '',
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn().mockReturnThis(),
          start: vi.fn(),
          stop: vi.fn(),
        });
        this.createGain = () => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn().mockReturnThis(),
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('playPurchase respects soundEnabled', () => {
    const settings = { soundEnabled: false };
    const feedback = createFeedbackService(mockScene(), settings);
    feedback.playPurchase();
    expect(globalThis.AudioContext).not.toHaveBeenCalled();

    settings.soundEnabled = true;
    feedback.playPurchase();
    expect(globalThis.AudioContext).toHaveBeenCalled();
  });

  it('spawnFloatingText creates text and a tween', () => {
    const scene = mockScene();
    const feedback = createFeedbackService(scene, { soundEnabled: true });
    feedback.spawnFloatingText('+1', '#fff', 100, 0);
    expect(scene.add.text).toHaveBeenCalled();
    expect(scene.tweens.add).toHaveBeenCalled();
  });

  it('shakeDeny calls shake(120, 0.004)', () => {
    const scene = mockScene();
    createFeedbackService(scene, { soundEnabled: true }).shakeDeny();
    expect(scene.cameras.main.shake).toHaveBeenCalledWith(120, 0.004);
  });
});
