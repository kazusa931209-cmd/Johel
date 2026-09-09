"use client";

import { useEffect, useState } from "react";
import {
  getPce,
  type CompanyDetail,
  type ExperienceDetail,
  type PceBundle,
  type ProfileDetail,
} from "@/lib/api";

let cached: PceBundle | null = null;
let inflight: Promise<{ data?: PceBundle; error?: string }> | null = null;

export function clearPceCache() {
  cached = null;
  inflight = null;
}

export async function loadPce(): Promise<{
  data?: PceBundle;
  error?: string;
}> {
  if (cached) {
    return { data: cached };
  }
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

    if (cached) {
      setState({
        profiles: cached.profiles,
        companies: cached.companies,
        experiences: cached.experiences,
        loading: false,
      });
      return;
    }

    void loadPce().then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        setState((current) => ({
          ...current,
          loading: false,
          error: res.error ?? "Failed to load profiles, companies, and experiences.",
        }));
        return;
      }
      setState({
        profiles: res.data.profiles,
        companies: res.data.companies,
        experiences: res.data.experiences,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
