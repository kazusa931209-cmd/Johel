export const GENERATE_PANEL_SPLIT_STORAGE_KEY =
  "johel-generate-panel-left-percent";

export const DEFAULT_GENERATE_PANEL_LEFT_PERCENT = 50;
export const MIN_GENERATE_PANEL_LEFT_PERCENT = 20;
export const MAX_GENERATE_PANEL_LEFT_PERCENT = 80;

export function clampGeneratePanelLeftPercent(percent: number): number {
  return Math.min(
    MAX_GENERATE_PANEL_LEFT_PERCENT,
    Math.max(MIN_GENERATE_PANEL_LEFT_PERCENT, percent),
  );
}

export function getStoredGeneratePanelLeftPercent(): number {
  if (typeof window === "undefined") return DEFAULT_GENERATE_PANEL_LEFT_PERCENT;
  try {
    const raw = localStorage.getItem(GENERATE_PANEL_SPLIT_STORAGE_KEY);
    if (raw == null) return DEFAULT_GENERATE_PANEL_LEFT_PERCENT;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_GENERATE_PANEL_LEFT_PERCENT;
    return clampGeneratePanelLeftPercent(parsed);
  } catch {
    return DEFAULT_GENERATE_PANEL_LEFT_PERCENT;
  }
}

export function persistGeneratePanelLeftPercent(percent: number) {
  try {
    localStorage.setItem(
      GENERATE_PANEL_SPLIT_STORAGE_KEY,
      String(clampGeneratePanelLeftPercent(percent)),
    );
  } catch {
    // ignore quota / private mode
  }
}
