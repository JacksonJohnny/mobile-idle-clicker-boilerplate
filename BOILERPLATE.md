# Boilerplate Clicker

Reusable Phaser + Capacitor idle clicker foundation.

## Structure

- `src/config` — resolution, theme, UI text, buy amounts, `SAVE_KEY` / `SAVE_VERSION`
- `src/controllers` — `ListScrollController` (visual scrollbar + finger scroll)
- `src/data` — generators, click upgrades, `metaUpgrades.js`, `achievements.js`
- `src/lib` — formulas (`clickerMath`) + session (`clickerController`) + Auto Tap + `prestige.js` + `saveState.js`
- `src/services` — save I/O + versioned migrations, settings, storage adapter
- `src/ui` — Phaser builders (no buy rules) + `feedback` + `tapHud` + `metaUpgradeCopy` + `achievementLines` + token badge
- `src/scenes` — `ClickerScene` + `scenes/clicker/*` helpers (page builders, lists, overlays, wall-clock)

## Naming glossary

| Concept | Code / UI | Persist / save |
| --- | --- | --- |
| Meta-upgrades (UPGRADE tab) | Catalog `META_UPGRADES`, UI `meta*` (`metaCamera`, `metaScroll`, `metaUpgradesView`) | Field **`boosts`** (legacy key — do not rename without a migration) |
| Ascension Tokens | `ascensionTokens`, purple badge | `ascensionTokens` (migrated from `stars` in v8) |
| Efficiency pips on STORE | Yellow ★ next to generator name | Derived from purchased efficiency meta (in `boosts`) |

Keep save field `boosts` stable so forks and old saves stay compatible. Rename UI/scene identifiers freely; bump `SAVE_VERSION` only if you change the JSON shape.

## Rebrand in 15 minutes

0. Capacitor identity first: set `appId` and `appName` in `capacitor.config.json` (keep `webDir: "dist"`).
1. Theme + copy: `src/config/theme.js` + `src/config/uiText.js` (also drives `document.title`).
2. Generators: `src/data/generators.js` (stable ids `upgrade-1` … `upgrade-20`).
3. Click / Auto Tap: `src/data/upgrades.js` + `src/lib/autoTapProgress.js` (`AUTO_TAP_MAX_SLOTS` is economy; orbit radii are visual).
4. Meta-upgrades: `src/data/metaUpgrades.js` (save still uses `boosts`).
5. Prestige curve / Ascension Tokens: `src/lib/prestige.js`.
6. Loops / resolution / save key: `src/config/gameConfig.js`.
7. Optional env: copy `.env.example` → `.env` (`VITE_SAVE_KEY`).
8. Run `npm test` and `npm run build`.

### Changing save format without wiping players

1. Do **not** rename `SAVE_KEY` (or add the old key to `LEGACY_SAVE_KEYS`).
2. Bump `SAVE_VERSION` in `gameConfig.js`.
3. Add `{ from, to, migrate }` in `src/services/saveMigrations.js`.
4. If you rename an id, add it to `UPGRADE_ID_ALIASES` / `BOOST_ID_ALIASES` in `src/lib/saveState.js`.

## Core systems included

- Wall-clock idle + offline catch-up (`savedAt`, `maxOfflineSeconds`; `null` = uncapped; resume modal only if **gain > 0** and away ≥ **1s**)
- Decimal.js economy + Cookie Clicker–style formatting
- Versioned save + checksum + soft salvage (`saveGameState` returns boolean on write failure)
- Progressive catalog (`???` for next locked)
- STORE buy modes ×1 / ×10 / ×25 / MAX (no hold-to-buy); unlock order
- Auto Tap rings, color tiers, per-cursor floating gains (`AUTO_TAP_MAX_SLOTS = 63`)
- Meta-upgrades (efficiency / global / tap-%-of-idle / base multiplier); UPGRADE list sorted by price asc
- Achievements → permanent idle % (locked rows show `○ ???`)
- Prestige → Ascension Tokens (+1% idle each); confirm: same-size buttons, countdown then red PRESTIGE, CANCEL blue; counters via `toNonNegativeInt` (never `| 0` — int32 wrap recovered on load)
- STATUS tab (stats, multipliers, achievements)
- STORE idle share % on auto generators
- Bottom nav with full tab labels + ≥44px hit targets; overflow `…` only when tabs grow past 5
- Sound settings; purchase SFX via `src/ui/feedback.js`

## Suggested expansion points

- Missions / seasonal events: suggested future file `src/lib/objectivesEngine.js` (does not exist yet — add when you need it)
- Permanent charms / milk-style layers beyond achievements (if your genre needs them)

See [README.md](README.md) for full gameplay and save docs. Portuguese: [README.pt.md](README.pt.md).
