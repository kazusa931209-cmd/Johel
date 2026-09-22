export const SIDEBAR_STORAGE_KEY = "johel-sidebar";

export type SidebarState = "open" | "collapsed";

export function getStoredSidebar(): SidebarState {
  if (typeof window === "undefined") return "open";
  try {
    const value = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return value === "collapsed" ? "collapsed" : "open";
  } catch {
    return "open";
  }
}

export function persistSidebar(state: SidebarState) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, state);
  } catch {
    // ignore quota / private mode
  }
}
