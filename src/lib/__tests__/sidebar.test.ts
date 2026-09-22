import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStoredSidebar,
  persistSidebar,
  SIDEBAR_STORAGE_KEY,
} from "../sidebar";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("sidebar storage", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to open when nothing is stored", () => {
    expect(getStoredSidebar()).toBe("open");
  });

  it("reads a collapsed preference", () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
    expect(getStoredSidebar()).toBe("collapsed");
  });

  it("persists open and collapsed", () => {
    persistSidebar("collapsed");
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("collapsed");
    persistSidebar("open");
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("open");
  });
});
