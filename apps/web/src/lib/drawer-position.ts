export const DRAWER_POSITION_STORAGE_KEY = "johel-drawer-position";

export type DrawerPosition = "left" | "right";

export const DEFAULT_DRAWER_POSITION: DrawerPosition = "right";

export function getStoredDrawerPosition(): DrawerPosition {
  if (typeof window === "undefined") return DEFAULT_DRAWER_POSITION;
  try {
    const value = localStorage.getItem(DRAWER_POSITION_STORAGE_KEY);
    return value === "left" ? "left" : DEFAULT_DRAWER_POSITION;
  } catch {
    return DEFAULT_DRAWER_POSITION;
  }
}

export function persistDrawerPosition(position: DrawerPosition) {
  try {
    localStorage.setItem(DRAWER_POSITION_STORAGE_KEY, position);
  } catch {
    // ignore quota / private mode
  }
}

export function studioFabClusterClass(position: DrawerPosition): string {
  const horizontal = position === "left" ? "left-12" : "right-12";
  return `fixed bottom-8 ${horizontal} z-40 flex flex-col gap-3`;
}
