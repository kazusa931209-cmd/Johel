import type { Locale } from "@/lib/locale";
import { en } from "./en";
import { ko } from "./ko";

type DeepStringify<T> = T extends readonly string[]
  ? readonly string[]
  : T extends object
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : string;

export type MessageTree = DeepStringify<typeof en>;

const catalogs: Record<Locale, MessageTree> = { en, ko };

function resolvePath(tree: unknown, parts: string[]): unknown {
  let current: unknown = tree;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export type TranslateParams = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: string,
  params?: TranslateParams,
): string {
  const enValue = resolvePath(en, key.split("."));
  const value = resolvePath(catalogs[locale], key.split(".")) ?? enValue;
  if (typeof value === "string") {
    if (!params) return value;
    return Object.entries(params).reduce(
      (text, [name, replacement]) =>
        text.replaceAll(`{${name}}`, String(replacement)),
      value,
    );
  }
  if (typeof enValue === "string") return enValue;
  return key;
}

export function translateLines(
  locale: Locale,
  key: string,
): string[] {
  const enValue = resolvePath(en, key.split("."));
  const value = resolvePath(catalogs[locale], key.split(".")) ?? enValue;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (Array.isArray(enValue)) {
    return enValue.filter((item): item is string => typeof item === "string");
  }
  return [];
}
