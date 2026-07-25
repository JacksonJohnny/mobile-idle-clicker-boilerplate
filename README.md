# Mobile Idle Clicker Boilerplate

Mobile-first idle/clicker game boilerplate with **Phaser 4**, **Vite**, **Decimal.js**, and **Capacitor 8**.

Repository: [JacksonJohnny/mobile-idle-clicker-boilerplate](https://github.com/JacksonJohnny/mobile-idle-clicker-boilerplate)

Base resolution: `540×960`. Capacitor app id: `com.clickergame.app`.

Short fork/rebrand guide: [`BOILERPLATE.md`](BOILERPLATE.md). Portuguese README: [`README.pt.md`](README.pt.md).

## Stack

| Layer | Technology |
| --- | --- |
| Game runtime | Phaser `^4.2.1` |
| Bundler | Vite `^8.1.4` |
| Big numbers | decimal.js `^10.6.0` |
| Mobile | Capacitor `^8.4.2` (Android / iOS) |
| Tests | Vitest `^4.1.10` |

## Features

- Decimal.js economy with exponential costs and Cookie Clicker–style formatting.
- Manual tap + 20 chained idle generators + Auto Tap (orbiting cursors).
- **UPGRADE** tab: generic meta-upgrades (efficiency ×2, global, tap-%-of-idle, BASE MULTIPLIER 1…20); available list sorted by **ascending price**.
- **STORE** tab: buy **×1 / ×10 / ×25 / MAX** (no hold-to-buy); unlock order; progressive catalog with `???`; idle generators show **% of production**.
- Idle via **wall clock** + offline earnings (optional cap; default **uncapped**).
- Achievements with permanent idle % bonus (locked: `○ ???`).
- Prestige → **Ascension Tokens** (purple square) with **red** confirm and **5s** countdown.
- Tabs: UPGRADE → STORE → TAP → STATUS → PRESTIGE (+ settings); **full** nav labels (≥44px; overflow `…` only past 5 tabs).
- Versioned save (`SAVE_VERSION = 10`) with migrations and checksum.
- Web / Android / iOS builds; Vitest coverage for economy, prestige, achievements, save.

## Naming glossary (important for forks)

| Concept | Code / UI | Persistence |
| --- | --- | --- |
| Meta-upgrades (UPGRADE tab) | Catalog `META_UPGRADES`, UI `meta*` (`metaCamera`, `metaScroll`, `metaUpgradesView`) | Legacy field **`boosts`** — do not rename without a migration |
| Ascension Tokens | `ascensionTokens`, purple badge | `ascensionTokens` (was `stars` in v8) |
| Yellow ★ on STORE | Efficiency pips | Derived from purchased efficiency entries in `boosts` |

**Rule:** rename UI/scene freely; keep the save field `boosts` stable so old progress survives.

## Requirements

- Node.js 20+
- Android Studio (Android)
- macOS + Xcode (iOS)

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm test
npm run build
npm run test:coverage
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` / `preview` | Production build and preview |
| `npm test` / `test:watch` / `test:coverage` | Vitest |
| `npm run lint` / `format` / `format:check` | ESLint / Prettier |
| `npm run android` / `ios` | Build + sync + open IDE |
| `npm run cap:doctor` | Capacitor environment check |

## Structure

```text
src/
  config/          Resolution, loops, theme, copy, buy amounts, SAVE_*
  controllers/     ListScrollController
  data/            Generators, upgrades, metaUpgrades, achievements
  lib/             Formulas (clickerMath), session (clickerController), prestige, Auto Tap, save shape
  scenes/          ClickerScene (orchestrator)
    clicker/       Page builders, lists, overlays, nav, cameras, wall-clock
  services/        Save, migrations, settings, storage
  ui/              Phaser builders (no purchase rules) + feedback + tap HUD
```

Key files:

| Area | File |
| --- | --- |
| Economy (formulas) | [`src/lib/clickerMath.js`](src/lib/clickerMath.js) |
| Session / buy / save hydrate | [`src/lib/clickerController.js`](src/lib/clickerController.js) |
| Prestige | [`src/lib/prestige.js`](src/lib/prestige.js) |
| Auto Tap | [`src/lib/autoTapProgress.js`](src/lib/autoTapProgress.js) |
| Save shape | [`src/lib/saveState.js`](src/lib/saveState.js) |
| Scene | [`src/scenes/ClickerScene.js`](src/scenes/ClickerScene.js) + [`src/scenes/clicker/`](src/scenes/clicker/) |
| Page builders | [`src/scenes/clicker/createPages.js`](src/scenes/clicker/createPages.js) |
| Theme / copy | [`theme.js`](src/config/theme.js), [`uiText.js`](src/config/uiText.js) |
| Buy modes | [`src/config/buyAmounts.js`](src/config/buyAmounts.js) |
| Save | [`gameConfig.js`](src/config/gameConfig.js), [`saveStorage.js`](src/services/saveStorage.js), [`saveMigrations.js`](src/services/saveMigrations.js) |
| Catalogs | [`generators.js`](src/data/generators.js), [`upgrades.js`](src/data/upgrades.js), [`metaUpgrades.js`](src/data/metaUpgrades.js), [`achievements.js`](src/data/achievements.js) |
| Meta UI | [`src/ui/metaUpgradesView.js`](src/ui/metaUpgradesView.js), [`metaUpgradeCopy.js`](src/ui/metaUpgradeCopy.js) |

---

## Gameplay

### Economy

- Currency: `coins` (`Decimal`).
- Tap: `1` + upgrades `type: 'click'` (+ idle share via meta).
- Idle: generators `type: 'auto'` × meta × achievements × Ascension Tokens.
- Cost: `baseCost * growth^level` (floor).
- Meta-upgrades (one-time purchase; leave the list when bought; UI sorted by price, independent of STORE):
  - `generator` — own **5 / 25 / 50 / 100 / 200** → that generator’s production ×2 (bought on UPGRADE; **not** auto-granted from owned count on load)
  - `global` — own N total → global production ×M
  - `click_per_second` — N taps → tap +% of idle production
  - `base_multiplier` — lifetime coins (unique progressive unlocks in `baseMultiplierTiers.json`) → global production ×(1+%)
- Prestige: soft reset → Ascension Tokens (+1% idle each).
- Achievements: milestones → permanent idle %.

Default catalog: `tap-power` + `auto-tap`, generators `upgrade-1`…`upgrade-20`, `META_UPGRADES` (**130**: 100 efficiency + 5 global + 5 tap-% + 20 BASE MULTIPLIER). Chained unlock (`unlockAfter`); UI shows unlocked + next as `???`.

### Prestige (Ascension Tokens)

- Gain ≈ `floor(sqrt(coinsThisAscension / 1e6))` (minimum ~1M this run).
- Soft reset clears: coins, STORE levels, purchased meta-upgrades (`boosts`).
- Keeps: tokens, achievements, all-time stats.
- Yellow ★ on STORE = efficiency pips, **not** Ascension Tokens.
- Required confirm: countdown **5 → 1** on the top button (same size as CANCEL), then **red** + clickable `PRESTIGE`; CANCEL stays blue and free.
- Token / prestige counters use a safe integer (`toNonNegativeInt` in [`prestige.js`](src/lib/prestige.js)) — **do not** use `| 0` (overflows near ~2.1B and goes negative).

### Auto Tap

- +1 click / 10s per level (wave).
- Up to **63** cursors in **2 rings**; then recolors (power tier+1).
- Visual derived from the `auto-tap` `level` — no extra save field.

### Idle and offline

- Progress uses `Date.now` (wall-clock), not only the Phaser timer.
- Hide / `pagehide` / `beforeunload`: apply pending progress and save.
- Tab return: “Welcome back” modal only if **gain > 0** and away ≥ **1s**.
- Load: `hydrate` applies progress since `savedAt` in one step.
- Cap: `LOOP_CONFIG.maxOfflineSeconds` (`null` = uncapped).

### Interface

Tab order: **UPGRADE → STORE → TAP → STATUS → PRESTIGE** (+ settings).

| Tab | Content |
| --- | --- |
| UPGRADE | Available meta-upgrades, ascending price (`meta*` UI / cameras) |
| STORE | Generators in unlock order + buy bar ×1/×10/×25/MAX + % idle per generator |
| TAP | Center button + Auto Tap |
| STATUS | Stats, multipliers, achievements (`○ ???` if locked) |
| PRESTIGE | Tokens + soft reset (confirm with countdown) |

Horizontal swipe between pages; vertical scroll in lists. Bottom nav with full names (`UPGRADE`, `STORE`, …). “Click to start” overlay on a fresh save. List cameras hidden while a modal is open.

### STORE purchases

- Preference stored in settings (`buyAmount`).
- BUY applies the active mode; `MAX` = max affordable with current coins.
- Generators `type: 'auto'`: effect line includes idle share (`+8 coins / sec (80%)`); Lv.0 / zero idle / tap-power / auto-tap → no `%`.
- STORE/UPGRADE purchases trigger an immediate save (in addition to autosave).
- No hold-to-buy.

### Feedback

- Purchase (STORE / UPGRADE): Web Audio beep (if enabled); **no** floating effect text.
- Tap / Auto Tap: white floating `+N` on the button.
- Successful prestige: floating text with Ascension Tokens gained.
- Settings (sound, buy amount) live in a key separate from progress save.

---

## Configuration

```js
// src/config/gameConfig.js
GAME_CONFIG = { width: 540, height: 960, backgroundColor: '#111822' }
LOOP_CONFIG = {
  autoSaveDelayMs: 10000,
  maxOfflineSeconds: null, // null = uncapped offline
}
SAVE_KEY = 'clicker-phaser-save-v1' // NEVER rename — use SAVE_VERSION + migrations
SAVE_VERSION = 10
```

Optional env (`.env.example`): `VITE_SAVE_KEY`. Native app id: `capacitor.config.json` → `appId`.

---

## Save and migrations

**Status: publish-ready.** Old saves migrate up to `SAVE_VERSION = 10`.

### Persisted

`coins`, `totalCoinsEarned`, `coinsThisAscension`, `totalClicks`, `autoTapProgress`, `ascensionTokens`, `prestigeCount`, `unlockedAchievements`, upgrade levels, purchased meta (`boosts`), `savedAt`.

Hydrate merges **by `id`**: new catalog entries enter at zero; removed ids are ignored.

### Load pipeline

1. Read `SAVE_KEY` (+ `LEGACY_SAVE_KEYS` if needed).
2. Accept envelope `{ version, payload, checksum }` or legacy plain JSON.
3. Invalid checksum but valid JSON → attempt salvage.
4. `migrateSaveState` up to the current version.
5. Rewrite canonical format (includes cleanup of legacy `stars`).

Autosave every 10s + flush on blur / `pagehide` / `beforeunload`. Reset: `?resetSave=1`.

### History

| Version | Migration |
| --- | --- |
| **1** | Legacy save |
| **2** | Normalize shape |
| **3** | Milestones → efficiency; `first-surge` / etc. → globals |
| **4–5** | Ids `generator-N` ↔ `upgrade-N` + aliases |
| **6** | `totalCoinsEarned` + cps-tap aliases |
| **7** | Prestige/achievements (`stars`, …) |
| **8** | `stars` → `ascensionTokens` |
| **9** | Adds `ownedModifiers` (temporary system; removed in v10) |
| **10** | Removes `ownedModifiers` |

### Updating without wiping progress

1. Do not rename `SAVE_KEY` (or list the old key in `LEGACY_SAVE_KEYS`).
2. Bump `SAVE_VERSION`.
3. Add a step in `saveMigrations.js`.
4. Renamed ids → `UPGRADE_ID_ALIASES` / `BOOST_ID_ALIASES` in [`src/lib/saveState.js`](src/lib/saveState.js).
5. New catalog entries alone usually **do not** need a migration (merge by id).

### Conscious limitations

- Old globals (`first-surge` etc.) map onto current globals (smaller multipliers); progress is not discarded.
- Generic multipliers became `BASE MULTIPLIER 1…20` (no lore).

---

## Customization

1. Visual — `src/config/theme.js`
2. Copy — `src/config/uiText.js`
3. Resolution / loops / save — `src/config/gameConfig.js`
4. Buy modes — `src/config/buyAmounts.js`
5. Generators — `src/data/generators.js`
6. Click / Auto Tap — `src/data/upgrades.js` + `src/lib/autoTapProgress.js`
7. Meta-upgrades — `src/data/metaUpgrades.js` (save still uses `boosts`)
8. BASE MULTIPLIER tiers — `src/data/baseMultiplierTiers.json`
9. Prestige — `src/lib/prestige.js`
10. Achievements — `src/data/achievements.js`
11. Formulas — `src/lib/clickerMath.js`; session — `src/lib/clickerController.js`
12. Migrations — `src/services/saveMigrations.js`

Then: `npm test` && `npm run build`.

Natural extensions: missions via a suggested future file `src/lib/objectivesEngine.js` (not present yet).

---

## Android / iOS

```bash
# Android (first time)
npm run build && npm run cap:add:android
npm run android

# iOS (macOS; first time)
npm run build && npm run cap:add:ios
npm run ios
```

`npm run cap:doctor` checks the native environment.

## Web deploy

```bash
npm run build
npm run preview
```

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) lints, format-checks, tests, builds, and publishes to GitHub Pages on every push to `main`.

## License

ISC. See [LICENSE](LICENSE).
