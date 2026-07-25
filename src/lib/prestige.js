import Decimal from 'decimal.js';

/**
 * Non-negative integer for counters (tokens, prestige count).
 * Avoid `| 0` — that truncates to signed int32 and wraps past ~2.1e9.
 *
 * @param {unknown} value
 * @param {{ recoverInt32Wrap?: boolean }} [options] When true, reinterpret
 *   legacy signed-int32 negatives (from `| 0`) as unsigned 32-bit.
 */
export function toNonNegativeInt(value, { recoverInt32Wrap = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }

  if (n < 0) {
    if (recoverInt32Wrap && Number.isInteger(n) && n >= -2147483648) {
      return n >>> 0;
    }
    return 0;
  }

  return Math.min(Math.floor(n), Number.MAX_SAFE_INTEGER);
}

/** Ascension Tokens gained from coins earned this ascension (soft, readable curve). */
export function calculateAscensionTokenGain(coinsThisAscension) {
  const amount = coinsThisAscension instanceof Decimal ? coinsThisAscension : new Decimal(coinsThisAscension || 0);
  if (amount.lt(1e6)) {
    return 0;
  }
  // ~1 token at 1M, ~10 at 100M, ~100 at 10B
  const gained = Math.floor(amount.div(1e6).sqrt().toNumber());
  return toNonNegativeInt(gained);
}

/** Idle production multiplier from held Ascension Tokens (+1% each, additive). */
export function getAscensionTokenIdleMultiplier(tokens) {
  const safe = toNonNegativeInt(tokens);
  return 1 + safe * 0.01;
}
