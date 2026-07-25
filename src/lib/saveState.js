import { CLICKER_GENERATORS } from '../data/generators.js';
import { toNonNegativeInt } from './prestige.js';

/**
 * Canonical store generator ids are `upgrade-N` (stable for saves).
 * `generator-N` was a brief rename — map it back so those saves keep levels.
 */
export const UPGRADE_ID_ALIASES = Object.fromEntries(
  CLICKER_GENERATORS.map((generator, index) => [`generator-${index + 1}`, generator.id]),
);

const EFFICIENCY_TIER_COUNT = 5;
const GENERATOR_ALIAS_COUNT = CLICKER_GENERATORS.length;

function buildEfficiencyAliases() {
  const aliases = {
    'first-surge': 'global-production-1',
    'power-grid': 'global-production-2',
    overdrive: 'global-production-3',
  };

  for (let n = 1; n <= GENERATOR_ALIAS_COUNT; n += 1) {
    for (let tier = 1; tier <= EFFICIENCY_TIER_COUNT; tier += 1) {
      aliases[`generator-${n}-efficiency-${tier}`] = `upgrade-${n}-efficiency-${tier}`;
    }
  }

  for (let tier = 1; tier <= 5; tier += 1) {
    aliases[`cps-tap-${tier}`] = `click-per-second-tap-${tier}`;
  }

  for (let n = 1; n <= 20; n += 1) {
    // legacy Portuguese id — do not use in new catalogs
    aliases[`geral-upgrade-${n}`] = `base-multiplier-${n}`;
  }

  return aliases;
}

export const BOOST_ID_ALIASES = buildEfficiencyAliases();

/** Pre-removal star thresholds: each reached tier gave ×2 to that generator. */
const LEGACY_MILESTONE_THRESHOLDS = [10, 25, 50, 100, 200];

const GENERATOR_IDS = new Set(CLICKER_GENERATORS.map((generator) => generator.id));

export function cloneSave(state) {
  return JSON.parse(JSON.stringify(state ?? {}));
}

function remapIds(entries, aliases) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return entry;
    }

    const id = aliases[entry.id] ?? entry.id;
    return id === entry.id ? entry : { ...entry, id };
  });
}

function dedupeBoosts(boosts) {
  const byId = new Map();

  for (const entry of boosts) {
    if (!entry?.id) {
      continue;
    }

    const previous = byId.get(entry.id);
    byId.set(entry.id, {
      id: entry.id,
      purchased: Boolean(previous?.purchased || entry.purchased),
    });
  }

  return [...byId.values()];
}

function dedupeUpgrades(upgrades) {
  const byId = new Map();

  for (const entry of upgrades) {
    if (!entry?.id) {
      continue;
    }

    const previous = byId.get(entry.id);
    const level = Math.max(
      Math.max(0, Math.floor(Number(previous?.level) || 0)),
      Math.max(0, Math.floor(Number(entry.level) || 0)),
    );
    byId.set(entry.id, { id: entry.id, level });
  }

  return [...byId.values()];
}

function markBoostPurchased(boosts, boostId) {
  const existing = boosts.find((entry) => entry.id === boostId);

  if (existing) {
    existing.purchased = true;
    return;
  }

  boosts.push({ id: boostId, purchased: true });
}

/**
 * Stars were automatic ×2 at 10/25/50/100/200 owned.
 * Grant the first N efficiency upgrades as purchased, where N = stars earned.
 */
export function compensateLegacyMilestoneStars(state) {
  const next = cloneSave(state);
  next.boosts = Array.isArray(next.boosts) ? next.boosts : [];
  next.upgrades = dedupeUpgrades(remapIds(next.upgrades, UPGRADE_ID_ALIASES).filter((entry) => entry?.id));

  for (const upgrade of next.upgrades ?? []) {
    if (!GENERATOR_IDS.has(upgrade.id)) {
      continue;
    }

    const level = Number.isFinite(Number(upgrade.level)) ? Math.max(0, Number(upgrade.level)) : 0;
    const stars = LEGACY_MILESTONE_THRESHOLDS.filter((threshold) => level >= threshold).length;
    const grants = Math.min(stars, EFFICIENCY_TIER_COUNT);

    for (let tier = 1; tier <= grants; tier += 1) {
      markBoostPurchased(next.boosts, `${upgrade.id}-efficiency-${tier}`);
    }
  }

  return next;
}

export function normalizeSaveState(state) {
  const next = cloneSave(state);

  if (next.coins === undefined || next.coins === null) {
    next.coins = '0';
  } else if (typeof next.coins !== 'string' && typeof next.coins !== 'number') {
    next.coins = '0';
  }

  next.totalClicks = Number.isFinite(Number(next.totalClicks)) ? Math.max(0, Number(next.totalClicks)) : 0;
  next.autoTapProgress = Number.isFinite(Number(next.autoTapProgress)) ? Math.max(0, Number(next.autoTapProgress)) : 0;
  next.upgrades = dedupeUpgrades(remapIds(next.upgrades, UPGRADE_ID_ALIASES).filter((entry) => entry?.id));
  next.boosts = dedupeBoosts(remapIds(next.boosts, BOOST_ID_ALIASES).filter((entry) => entry?.id));

  // Prestige currency rename: stars (v7) → ascensionTokens (v8+). Keep both paths safe.
  // Also recovers int32 wrap from legacy `| 0` (negative token counts in old saves).
  if (next.ascensionTokens !== undefined && next.ascensionTokens !== null) {
    next.ascensionTokens = toNonNegativeInt(next.ascensionTokens, { recoverInt32Wrap: true });
  } else if (next.stars !== undefined && next.stars !== null) {
    next.ascensionTokens = toNonNegativeInt(next.stars, { recoverInt32Wrap: true });
  } else {
    next.ascensionTokens = 0;
  }
  delete next.stars;

  next.prestigeCount = toNonNegativeInt(next.prestigeCount, { recoverInt32Wrap: true });

  if (!Array.isArray(next.unlockedAchievements)) {
    next.unlockedAchievements = [];
  } else {
    next.unlockedAchievements = next.unlockedAchievements.filter((id) => typeof id === 'string');
  }

  // Drop removed modifier system (SAVE_VERSION 10+).
  delete next.ownedModifiers;

  if (next.coinsThisAscension === undefined || next.coinsThisAscension === null) {
    next.coinsThisAscension = next.totalCoinsEarned ?? next.coins ?? '0';
  }

  if (next.totalCoinsEarned === undefined || next.totalCoinsEarned === null) {
    next.totalCoinsEarned = next.coins ?? '0';
  }

  if (next.savedAt !== undefined && next.savedAt !== null) {
    const savedAt = Number(next.savedAt);
    next.savedAt = Number.isFinite(savedAt) ? savedAt : next.savedAt;
  }

  return next;
}
