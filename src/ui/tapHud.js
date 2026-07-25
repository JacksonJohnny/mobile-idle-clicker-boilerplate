import { COLORS, FONT_FAMILIES, UI_LAYOUT } from '../config/theme.js';
import { UI_TEXT } from '../config/uiText.js';

export function buildTapHud(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const tapCenterY = scene.tapCenterY;

  const background = scene.add.rectangle(width / 2, height / 2, width, height, COLORS.background, 0.2);

  scene.add
    .text(width / 2, 48, UI_TEXT.gameTitle, {
      fontFamily: FONT_FAMILIES.display,
      fontSize: '38px',
      color: COLORS.accentText,
      stroke: COLORS.titleStroke,
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  const coinsText = scene.add
    .text(width / 2, 134, '', {
      fontFamily: FONT_FAMILIES.body,
      fontSize: '44px',
      color: COLORS.whiteText,
      fontStyle: '800',
    })
    .setOrigin(0.5);

  const statsText = scene.add
    .text(width / 2, 202, '', {
      fontFamily: FONT_FAMILIES.body,
      fontSize: '22px',
      color: COLORS.statsText,
    })
    .setOrigin(0.5);

  const coreGlow = scene.add.circle(width / 2, tapCenterY, UI_LAYOUT.coreGlowRadius, COLORS.coreGlow, 0.18);
  const coreRing = scene.add
    .circle(width / 2, tapCenterY, UI_LAYOUT.coreRingRadius, COLORS.coreRing, 0.12)
    .setStrokeStyle(3, COLORS.coreRingBorder, 0.5);
  const coreButton = scene.add
    .circle(width / 2, tapCenterY, UI_LAYOUT.coreButtonRadius, COLORS.coreButton)
    .setInteractive({ useHandCursor: true });
  const coreInner = scene.add.circle(width / 2, tapCenterY, UI_LAYOUT.coreInnerRadius, COLORS.coreInner);

  const buttonLabel = scene.add
    .text(width / 2, tapCenterY, UI_TEXT.tapButton, {
      fontFamily: FONT_FAMILIES.display,
      fontSize: '46px',
      color: COLORS.coreLabel,
    })
    .setOrigin(0.5);

  return {
    background,
    coinsText,
    statsText,
    coreGlow,
    coreButton,
    buttonLabel,
    tapButtonVisuals: [coreRing, coreButton, coreInner, buttonLabel],
  };
}
