"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyLocale,
  getStoredLocale,
  persistLocale,
  type Locale,
} from "@/lib/locale";
import { translate, translateLines, type TranslateParams } from "@/messages/translate";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
  tLines: (key: string) => string[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    applyLocale(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const tLines = useCallback(
    (key: string) => translateLines(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tLines }),
    [locale, setLocale, t, tLines],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
