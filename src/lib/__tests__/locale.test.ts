import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyLocale,
  DEFAULT_LOCALE,
  getStoredLocale,
  LOCALE_STORAGE_KEY,
  persistLocale,
} from "../locale";
import { translate } from "@/messages/translate";

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

describe("locale storage", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("document", {
      documentElement: { lang: "en" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to English when nothing is stored", () => {
    expect(getStoredLocale()).toBe(DEFAULT_LOCALE);
  });

  it("reads Japanese from storage", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "ja");
    expect(getStoredLocale()).toBe("ja");
  });

  it("migrates hidden Korean locale to English", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "ko");
    expect(getStoredLocale()).toBe("en");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("falls back to English for unknown values", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    expect(getStoredLocale()).toBe("en");
  });

  it("persists locale and sets document lang", () => {
    persistLocale("ja");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ja");
    expect(document.documentElement.lang).toBe("ja");
    applyLocale("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("translate", () => {
  it("returns English strings by default", () => {
    expect(translate("en", "nav.sidebar.jdResumeBuilder")).toBe(
      "JD-Resume Builder",
    );
    expect(translate("en", "resumeBuilder.title")).toBe("Resume Builder");
  });

  it("returns Japanese strings when locale is ja", () => {
    expect(translate("ja", "nav.sidebar.jdResumeBuilder")).toBe(
      "JD-履歴書ビルダー",
    );
  });

  it("interpolates parameters", () => {
    expect(translate("en", "nav.header.todayTokenUsed", { count: "42" })).toBe(
      "Today Token Used: 42",
    );
    expect(translate("en", "nav.header.tokenUsed", { count: "1,234" })).toBe(
      "Total Token Used: 1,234",
    );
  });

  it("falls back to English for missing keys", () => {
    expect(translate("ja", "nonexistent.key.path")).toBe("nonexistent.key.path");
    expect(translate("en", "nonexistent.key.path")).toBe("nonexistent.key.path");
  });
});
