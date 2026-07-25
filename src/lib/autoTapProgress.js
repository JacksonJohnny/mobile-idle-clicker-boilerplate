/** Arc spacing — below display width because the sprite has transparent side padding. */
export const AUTO_TAP_CURSOR_ARC = 34;
export const AUTO_TAP_ORBIT_RADIUS = 150;
export const AUTO_TAP_CURSOR_DISPLAY_H = 44;
export const AUTO_TAP_RING_GAP = AUTO_TAP_CURSOR_DISPLAY_H + 2;
/** Two rings fill first; further Auto Tap levels recolor instead of adding rings. */
export const AUTO_TAP_VISUAL_RING_COUNT = 2;
/** Economy cap for Auto Tap cursor slots (independent of visual ring math). */
export const AUTO_TAP_MAX_SLOTS = 63;

/** Tier 0 = base white; each full pass around the ring advances one tier (then wraps tint). */
export const AUTO_TAP_CURSOR_TINTS = [
  0xffffff, // white — 1x
  0x9bd3ff, // ice blue — 2x
  0x9df4a3, // mint — 3x
  0xffd166, // gold — 4x
  0xff9f43, // orange — 5x
  0xff6b6b, // ruby — 6x
  0xc792ff, // violet — 7x
  0x5ef2e0, // cyan — 8x
  0xff8fd6, // pink — 9x
  0xffe08a, // amber — 10x
];

export function getMaxAutoTapCursorSlots() {
  return AUTO_TAP_MAX_SLOTS;
}

/** Absolute color tier for a cursor slot (0 = white). Tint wraps; power keeps doubling. */
export function getAutoTapCursorTier(level, index, maxSlots = getMaxAutoTapCursorSlots()) {
  const safeLevel = Math.max(0, Math.floor(Number(level) || 0));
  const slots = Math.max(1, Math.floor(Number(maxSlots) || 0));
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));

  if (safeLevel <= slots) {
    return 0;
  }

  const extra = safeLevel - slots;
  const fullCycles = Math.floor(extra / slots);
  const partial = extra % slots;
  return fullCycles + (safeIndex < partial ? 1 : 0);
}

export function getAutoTapCursorTint(level, index, maxSlots = getMaxAutoTapCursorSlots()) {
  const tier = getAutoTapCursorTier(level, index, maxSlots);
  return AUTO_TAP_CURSOR_TINTS[tier % AUTO_TAP_CURSOR_TINTS.length];
}

/** White = 1x, blue = 2x, mint = 3x, … (tier + 1). */
export function getAutoTapCursorMultiplier(level, index, maxSlots = getMaxAutoTapCursorSlots()) {
  return getAutoTapCursorTier(level, index, maxSlots) + 1;
}
