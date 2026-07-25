import { UI_TEXT } from '../config/uiText.js';

/**
 * Pure STATUS achievement row copy (no Phaser).
 * Locked rows stay spoiler-free as a single `○ ???` line.
 */
export function getAchievementListLines(achievement, isUnlocked) {
  if (isUnlocked) {
    const percent = Math.round(achievement.idleBonus * 100);
    return [
      {
        text: UI_TEXT.achievementUnlocked.replace('{name}', achievement.name).replace('{percent}', String(percent)),
        kind: 'unlocked-title',
      },
      {
        text: UI_TEXT.achievementUnlockedDesc.replace('{description}', achievement.description),
        kind: 'unlocked-desc',
      },
    ];
  }

  return [{ text: UI_TEXT.achievementLocked, kind: 'locked' }];
}
