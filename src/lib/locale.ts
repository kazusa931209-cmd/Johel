export const LOCALE_STORAGE_KEY = "johel-locale";

export type Locale = "en" | "ja";

export const DEFAULT_LOCALE: Locale = "en";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (value === "ja") return "ja";
    if (value === "ko") {
      localStorage.setItem(LOCALE_STORAGE_KEY, DEFAULT_LOCALE);
      return DEFAULT_LOCALE;
    }
    return DEFAULT_LOCALE;
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

export const LOCALE_BOOTSTRAP_SCRIPT = `(()=>{try{var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');if(l==='ja'){document.documentElement.lang='ja';}else if(l==='ko'){localStorage.setItem('${LOCALE_STORAGE_KEY}','en');document.documentElement.lang='en';}else{document.documentElement.lang='en';}}catch(e){document.documentElement.lang='en';}})();`;
