import { UI_LAYOUT } from '../config/theme.js';

export function wasTapNotDrag(start, pointer, threshold = UI_LAYOUT.pointerDragThreshold) {
  if (!start) return true;
  return Math.hypot(pointer.x - start.x, pointer.y - start.y) <= threshold;
}
