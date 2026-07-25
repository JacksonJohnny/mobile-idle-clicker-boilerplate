import { COLORS, FONT_FAMILIES, UI_LAYOUT } from '../config/theme.js';

export function buildSectionTitle(scene, label) {
  return scene.add
    .text(28, UI_LAYOUT.sectionTitleY, label, {
      fontFamily: FONT_FAMILIES.display,
      fontSize: '24px',
      color: COLORS.accentText,
    })
    .setOrigin(0, 0.5);
}
