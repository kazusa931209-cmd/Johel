export const LOCALE_STORAGE_KEY = "johel-locale";

export type Locale = "en" | "ko";

export const DEFAULT_LOCALE: Locale = "en";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return value === "ko" ? "ko" : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

export function persistLocale(locale: Locale) {
  applyLocale(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }
}

export const LOCALE_BOOTSTRAP_SCRIPT = `(()=>{try{var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');document.documentElement.lang=l==='ko'?'ko':'en';}catch(e){document.documentElement.lang='en';}})();`;
