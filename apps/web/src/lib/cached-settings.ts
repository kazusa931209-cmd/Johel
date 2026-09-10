"use client";

import {
  getGenerationProcess,
  getMe,
  getPrompts,
  getSettings,
  type AiSettings,
  type GenerationProcessSettings,
  type PromptSettings,
  type User,
} from "@/lib/api";

type ApiResult<T> = Promise<{
  data?: T;
  error?: string;
  status: number;
}>;

function createCachedLoader<T>(fetcher: () => ApiResult<T>) {
  let cached: T | null = null;
  let inflight: ApiResult<T> | null = null;

  function load(): ApiResult<T> {
    if (cached) {
      return Promise.resolve({ data: cached, status: 200 });
    }
    if (!inflight) {
      inflight = fetcher().then((res) => {
        inflight = null;
        if (res.data) {
          cached = res.data;
        }
        return res;
      });
    }
    return inflight;
  }

  function set(value: T) {
    cached = value;
    inflight = null;
  }

  function clear() {
    cached = null;
    inflight = null;
  }

  return { load, set, clear };
}

const aiSettingsCache = createCachedLoader(() => getSettings());
const generationProcessCache = createCachedLoader(() => getGenerationProcess());
const promptsCache = createCachedLoader(() => getPrompts());
const meCache = createCachedLoader(() => getMe());

export const loadSettings = aiSettingsCache.load;
export const setSettingsCache = (value: AiSettings) => aiSettingsCache.set(value);
export const clearSettingsCache = () => aiSettingsCache.clear();

export const loadGenerationProcess = generationProcessCache.load;
export const setGenerationProcessCache = (value: GenerationProcessSettings) =>
  generationProcessCache.set(value);
export const clearGenerationProcessCache = () => generationProcessCache.clear();

export const loadPrompts = promptsCache.load;
export const setPromptsCache = (value: PromptSettings) => promptsCache.set(value);
export const clearPromptsCache = () => promptsCache.clear();

export const loadMe = meCache.load;
export const setMeCache = (value: User) => meCache.set(value);
export const clearMeCache = () => meCache.clear();

export function clearAllSettingsCaches() {
  aiSettingsCache.clear();
  generationProcessCache.clear();
  promptsCache.clear();
  meCache.clear();
}
