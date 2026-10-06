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

  it("reads Korean from storage", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "ko");
    expect(getStoredLocale()).toBe("ko");
  });

  it("falls back to English for unknown values", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    expect(getStoredLocale()).toBe("en");
  });

  it("persists locale and sets document lang", () => {
    persistLocale("ko");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ko");
    expect(document.documentElement.lang).toBe("ko");
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

  it("returns Korean strings when locale is ko", () => {
    expect(translate("ko", "nav.sidebar.jdResumeBuilder")).toBe(
      "JD-이력서 빌더",
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
    expect(translate("ko", "nonexistent.key.path")).toBe("nonexistent.key.path");
    expect(translate("en", "nonexistent.key.path")).toBe("nonexistent.key.path");
  });
});
