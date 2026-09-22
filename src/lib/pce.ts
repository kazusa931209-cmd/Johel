"use client";

import { useEffect, useState } from "react";
import {
  getPce,
  type CompanyDetail,
  type ExperienceDetail,
  type PceBundle,
  type ProfileDetail,
} from "@/lib/api";

const PCE_INVALIDATED_STORAGE_KEY = "johel:pce-invalidated";

type PceResult = { data?: PceBundle; error?: string };

let cached: PceBundle | null = null;
let inflight: Promise<PceResult> | null = null;
let fetchGeneration = 0;
const invalidationListeners = new Set<() => void>();

function notifyPceInvalidation() {
  for (const listener of invalidationListeners) {
    listener();
  }
}

export function subscribePceInvalidation(listener: () => void): () => void {
  invalidationListeners.add(listener);
  return () => {
    invalidationListeners.delete(listener);
  };
}

export function clearPceCache() {
  cached = null;
  inflight = null;
  fetchGeneration += 1;
  if (typeof window !== "undefined") {
    localStorage.setItem(PCE_INVALIDATED_STORAGE_KEY, String(Date.now()));
  }
  notifyPceInvalidation();
}

function requestPce(): Promise<PceResult> {
  const generation = fetchGeneration;
  const promise = getPce().then((res) => {
    if (inflight === promise) {
      inflight = null;
    }
    if (generation === fetchGeneration && res.data) {
      cached = res.data;
    }
    return res;
  });
  inflight = promise;
  return promise;
}

export async function loadPce(): Promise<PceResult> {
  if (cached) {
    return { data: cached };
  }
  if (inflight) {
    return inflight;
  }
  return requestPce();
}

export async function reloadPce(): Promise<PceResult> {
  cached = null;
  fetchGeneration += 1;
  inflight = null;
  return requestPce();
}

export type PceState = {
  profiles: ProfileDetail[];
  companies: CompanyDetail[];
  experiences: ExperienceDetail[];
  loading: boolean;
  error?: string;
};

export function usePce(): PceState {
  const [state, setState] = useState<PceState>(() =>
    cached
      ? {
          profiles: cached.profiles,
          companies: cached.companies,
          experiences: cached.experiences,
          loading: false,
        }
      : {
          profiles: [],
          companies: [],
          experiences: [],
          loading: true,
        },
  );

  useEffect(() => {
    let cancelled = false;

    async function refresh(force = false) {
      const res = force ? await reloadPce() : await loadPce();
      if (cancelled) return;
      if (res.error || !res.data) {
        setState((current) => ({
          ...current,
          loading: false,
          error:
            res.error ??
            "Failed to load profiles, companies, and experiences.",
        }));
        return;
      }
      setState({
        profiles: res.data.profiles,
        companies: res.data.companies,
        experiences: res.data.experiences,
        loading: false,
        error: undefined,
      });
    }

    void refresh();

    const unsubscribe = subscribePceInvalidation(() => {
      void refresh(true);
    });

    function onStorage(event: StorageEvent) {
      if (event.key !== PCE_INVALIDATED_STORAGE_KEY) return;
      cached = null;
      inflight = null;
      fetchGeneration += 1;
      void refresh(true);
    }

    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return state;
}
