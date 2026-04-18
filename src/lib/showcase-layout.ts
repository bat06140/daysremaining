export const PANEL_MIN_RATIO = 0.24;

export function clampPanelRatio(ratio: number): number {
  return Math.min(1 - PANEL_MIN_RATIO, Math.max(PANEL_MIN_RATIO, ratio));
}

export function getPanelRatioFromPointer(pointer: number, size: number): number {
  if (size <= 0) {
    return 0.5;
  }

  return clampPanelRatio(pointer / size);
}
