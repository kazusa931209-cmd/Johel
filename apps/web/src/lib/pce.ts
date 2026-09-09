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

let cached: PceBundle | null = null;
let inflight: Promise<{ data?: PceBundle; error?: string }> | null = null;
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
  if (typeof window !== "undefined") {
    localStorage.setItem(PCE_INVALIDATED_STORAGE_KEY, String(Date.now()));
  }
  notifyPceInvalidation();
}

async function fetchPce(): Promise<{
  data?: PceBundle;
  error?: string;
}> {
  if (!inflight) {
    inflight = getPce().then((res) => {
      inflight = null;
      if (res.data) {
        cached = res.data;
      }
      return res;
    });
  }
  return inflight;
}

export async function loadPce(): Promise<{
  data?: PceBundle;
  error?: string;
}> {
  if (cached) {
    return { data: cached };
  }
  return fetchPce();
}

export async function reloadPce(): Promise<{
  data?: PceBundle;
  error?: string;
}> {
  cached = null;
  inflight = null;
  return fetchPce();
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

    async function refresh() {
      const res = await loadPce();
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
      void refresh();
    });

    function onStorage(event: StorageEvent) {
      if (event.key !== PCE_INVALIDATED_STORAGE_KEY) return;
      cached = null;
      inflight = null;
      void refresh();
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
