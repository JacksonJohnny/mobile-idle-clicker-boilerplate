import Phaser from 'phaser';
import { LOOP_CONFIG, SCENE_KEY } from '../config/gameConfig.js';
import { COLORS, UI_LAYOUT } from '../config/theme.js';
import { UI_TEXT } from '../config/uiText.js';
import { META_UPGRADES } from '../data/metaUpgrades.js';
import { CLICKER_GENERATORS } from '../data/generators.js';
import { CLICK_UPGRADES } from '../data/upgrades.js';
import { formatCoins, getAutoTapLevel } from '../lib/clickerMath.js';
import { createClickerController } from '../lib/clickerController.js';

import { loadGameState, saveGameState } from '../services/saveStorage.js';
import { loadSettings, saveSettings } from '../services/settingsStorage.js';
import { getNavHeight } from '../ui/bottomNavigation.js';
import { createAutoTapCursorLayer } from '../ui/autoTapCursors.js';
import { createFeedbackService } from '../ui/feedback.js';
import { wasTapNotDrag } from '../ui/pointer.js';
import { buildTapHud } from '../ui/tapHud.js';
import handCursorUrl from '../assets/hand-cursor.png';
import {
  destroyStartOverlay,
  showOfflineReturn as showOfflineReturnOverlay,
  showPrestigeConfirm,
  showStartOverlay as showStartOverlayUI,
} from './clicker/overlays.js';
import {
  applyWallClockProgress as applyWallClockProgressHelper,
  bindLifecyclePersistence,
  flushProgressAndSave as flushProgressAndSaveHelper,
} from './clicker/wallClock.js';
import {
  renderStoreRows,
  updateMetaListLayout as refreshMetaListLayout,
  updateStoreListLayout,
} from './clicker/listRender.js';
import {
  beginPageSwipe as beginPageSwipeHelper,
  setActivePage as setActivePageHelper,
  setupPageSwipe,
  PAGE,
} from './clicker/pageNavigation.js';
import { normalizeBuyAmount } from '../config/buyAmounts.js';
import {
  createMetaUpgradePage,
  createPrestigePage,
  createSettingsChrome,
  createStatusPage,
  createStorePage,
  setupListInteraction,
} from './clicker/createPages.js';

export class ClickerScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEY);
  }

  preload() {
    this.load.image('hand-cursor', handCursorUrl);
  }

  create() {
    this.engine = createClickerController([...CLICK_UPGRADES, ...CLICKER_GENERATORS], META_UPGRADES);
    const loadedState = loadGameState();
    const hasSave = !!loadedState;
    const offline = this.engine.hydrate(loadedState, {
      nowMs: Date.now(),
      maxOfflineSeconds: LOOP_CONFIG.maxOfflineSeconds ?? Number.POSITIVE_INFINITY,
    });
    this.state = this.engine.state;
    this.settings = loadSettings();
    this.feedback = createFeedbackService(this, this.settings);
    this.gameStarted = hasSave;

    const width = this.scale.width;
    const height = this.scale.height;

    this.activePage = PAGE.TAP;
    this.navHeight = getNavHeight();
    this.navTop = height - this.navHeight;
    this.tapCenterY = UI_LAYOUT.tapCenterY;
    this.gamePage = this.add.container(0, 0);
    this.settingsPage = this.add.container(0, 0);

    this.hudMaxWidth = width - 34;
    const tapHud = buildTapHud(this);
    this.coinsText = tapHud.coinsText;
    this.statsText = tapHud.statsText;
    this.coreGlow = tapHud.coreGlow;
    this.coreButton = tapHud.coreButton;
    this.buttonLabel = tapHud.buttonLabel;
    this.tapButtonVisuals = tapHud.tapButtonVisuals;

    this.autoTapCursors = createAutoTapCursorLayer(this, width / 2, this.tapCenterY);
    this.gamePage.add([this.coreGlow, ...this.tapButtonVisuals, this.autoTapCursors.layer]);

    this.coreButton.on('pointerdown', (pointer) => {
      this.corePointerDown = { x: pointer.x, y: pointer.y };
      this.beginPageSwipe(pointer);
    });

    this.coreButton.on('pointerup', (pointer) => {
      const tapped = wasTapNotDrag(this.corePointerDown, pointer);
      this.corePointerDown = null;

      if (!this.gameStarted || !tapped || this.activePage !== PAGE.TAP) {
        return;
      }

      const gain = this.engine.tap();
      this.tapButtonVisuals.forEach((object) => object.setScale(0.94));
      this.tweens.add({
        targets: this.tapButtonVisuals,
        scale: 1,
        duration: 120,
        ease: 'Back.Out',
      });
      this.feedback.spawnFloatingText(
        UI_TEXT.floatingGain.replace('{amount}', formatCoins(gain)),
        COLORS.whiteText,
        this.tapCenterY,
      );
      this.renderState();
    });

    createStorePage(this);
    createMetaUpgradePage(this);
    createStatusPage(this);
    createPrestigePage(this);
    createSettingsChrome(this);
    setupListInteraction(this);
    setupPageSwipe(this);
    this.setActivePage(PAGE.TAP);
    this.lastProgressAtMs = Date.now();

    this.time.addEvent({
      delay: LOOP_CONFIG.autoSaveDelayMs,
      loop: true,
      callback: () => {
        if (!this.gameStarted) {
          return;
        }

        this.persist();
      },
    });

    this.input.on('gameout', () => {
      this.flushProgressAndSave();
    });

    bindLifecyclePersistence(this);

    this.renderState();

    if (!this.gameStarted) {
      this.showStartOverlay();
    }

    if (offline.gain.gt(0)) {
      this.persist();
      this.showOfflineReturn(offline);
    }

    this.tweens.add({
      targets: [this.coreGlow],
      alpha: { from: 0.2, to: 0.42 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  setBuyAmount(amount) {
    this.settings.buyAmount = normalizeBuyAmount(amount);
    saveSettings(this.settings);
    this.buyAmountBar?.refresh(this.settings.buyAmount);
    this.renderState();
  }

  buyStoreUpgrade(upgrade) {
    if (!this.gameStarted || this.activePage !== PAGE.STORE) {
      return;
    }
    this.tryBuyUpgrade(upgrade.id, this.settings.buyAmount);
  }

  buyMetaUpgrade(meta) {
    if (!this.gameStarted || this.activePage !== PAGE.UPGRADE) {
      return;
    }

    const result = this.engine.tryBuyMetaUpgrade(meta.id);
    if (!result.ok) {
      this.feedback.shakeDeny();
      return;
    }

    this.feedback.playPurchase();
    this.renderState();
    this.persist();
  }

  requestPrestige() {
    if (!this.gameStarted || this.activePage !== PAGE.PRESTIGE || this.confirmDialog) {
      return;
    }
    const preview = this.engine.getPrestigePreview();
    if (preview.ascensionTokensGain <= 0) {
      this.feedback.shakeDeny();
      return;
    }
    showPrestigeConfirm(this, () => this.doPrestige());
  }

  doPrestige() {
    if (!this.gameStarted || this.activePage !== PAGE.PRESTIGE) {
      return;
    }
    const result = this.engine.tryPrestige();
    if (!result.ok) {
      this.feedback.shakeDeny();
      return;
    }
    this.feedback.playPurchase();
    this.feedback.spawnFloatingText(`+${result.tokensGained} ${UI_TEXT.ascensionTokens}`, COLORS.accentText, 520);
    this.renderState();
    this.persist();
  }

  tryBuyUpgrade(upgradeId, buyAmount = 1, options = {}) {
    if (!this.gameStarted) {
      return false;
    }

    const result = this.engine.tryBuyUpgrade(upgradeId, buyAmount);

    if (!result.ok) {
      if (options.shakeOnFailure !== false) {
        this.feedback.shakeDeny();
      }
      return false;
    }

    this.feedback.playPurchase();
    this.renderState();
    this.persist();
    return true;
  }

  toggleSetting(settingKey) {
    if (!this.gameStarted || this.activePage !== PAGE.SETTINGS) {
      return;
    }

    this.settings[settingKey] = !this.settings[settingKey];
    saveSettings(this.settings);
    this.renderSettings();
  }

  toggleSettingsPage() {
    if (!this.gameStarted || this.offlineReturn || this.confirmDialog) {
      return;
    }

    if (this.activePage === PAGE.SETTINGS) {
      this.setActivePage(this.previousMainPage ?? PAGE.TAP);
      return;
    }

    this.previousMainPage = this.activePage;
    this.setActivePage(PAGE.SETTINGS);
  }

  selectPage(index) {
    if (this.offlineReturn || this.confirmDialog) {
      return;
    }
    if (this.activePage === PAGE.SETTINGS && index !== PAGE.SETTINGS) {
      this.previousMainPage = index;
    }
    if (this.gameStarted) {
      this.setActivePage(index);
    }
  }

  refreshStatusList() {
    if (!this.statusView || !this.statusScroll) {
      return;
    }
    const listHeight = this.statusView.refresh(this.state, this.engine.getMultiplierBreakdown());
    this.statusScroll.items = this.statusView.items;
    this.statusScroll.updateMetrics(listHeight);
  }

  setActivePage(index) {
    setActivePageHelper(this, index);
  }

  beginPageSwipe(pointer) {
    beginPageSwipeHelper(this, pointer);
  }

  renderSettings() {
    this.settingItems.forEach((item) => {
      const enabled = this.settings[item.settingKey];
      item.toggle.setFillStyle(enabled ? COLORS.success : COLORS.toggleOff);
      item.toggle.setStrokeStyle(2, enabled ? COLORS.successBorder : COLORS.toggleOffBorder);
      item.valueText.setText(enabled ? UI_TEXT.on : UI_TEXT.off);
      item.valueText.setColor(enabled ? COLORS.successText : COLORS.toggleOffText);
    });
  }

  fitHudText(textObject) {
    if (!textObject || !this.hudMaxWidth) {
      return;
    }

    textObject.setScale(1);
    const width = textObject.width;
    if (width > this.hudMaxWidth) {
      textObject.setScale(this.hudMaxWidth / width);
    }
  }

  renderState() {
    this.coinsText.setText(
      UI_TEXT.hudCoins.replace('{coins}', formatCoins(this.state.coins, { rate: this.state.perSecond })),
    );
    this.statsText.setText(
      UI_TEXT.hudStats
        .replace('{perTap}', formatCoins(this.state.perClick))
        .replace('{perSecond}', formatCoins(this.state.perSecond)),
    );
    this.fitHudText(this.coinsText);
    this.fitHudText(this.statsText);
    this.renderSettings();
    updateStoreListLayout(this);
    renderStoreRows(this);
    refreshMetaListLayout(this);
    if (this.activePage === PAGE.STATUS) {
      this.refreshStatusList();
    }
    if (this.activePage === PAGE.PRESTIGE) {
      this.prestigeView?.refresh(this.state, this.engine.getPrestigePreview());
    }
  }

  updateMetaListLayout() {
    refreshMetaListLayout(this);
  }

  update() {
    const onTapPage = this.gameStarted && this.activePage === PAGE.TAP;
    this.autoTapCursors.layer.setVisible(onTapPage);

    // Tick / auto-tap waves first (may sync cursor count for playClicks).
    this.applyWallClockProgress();

    // Always reposition last so orbit layout matches the final cursor count.
    const cursorCount = onTapPage ? getAutoTapLevel(this.state) : 0;
    this.autoTapCursors.updateOrbit(cursorCount, this.time.now);
  }

  applyWallClockProgress(options = {}) {
    applyWallClockProgressHelper(this, options);
  }

  flushProgressAndSave() {
    flushProgressAndSaveHelper(this);
  }

  persist() {
    if (!saveGameState(this.engine.snapshot())) {
      this.saveFailed = true;
    }
  }

  showOfflineReturn(offline) {
    showOfflineReturnOverlay(this, offline);
  }

  showStartOverlay() {
    showStartOverlayUI(this, () => this.startGame());
  }

  startGame() {
    if (this.gameStarted) {
      return;
    }

    this.gameStarted = true;
    destroyStartOverlay(this);
    this.renderState();
    this.setActivePage(this.activePage);
  }
}
