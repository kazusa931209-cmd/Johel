"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function parseListPage(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function buildListQueryString(
  current: URLSearchParams,
  patch: { page?: number; q?: string },
): string {
  const params = new URLSearchParams(current.toString());

  if (patch.page !== undefined) {
    if (patch.page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(patch.page));
    }
  }

  if (patch.q !== undefined) {
    const trimmed = patch.q.trim();
    if (!trimmed) {
      params.delete("q");
    } else {
      params.set("q", trimmed);
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useCrudListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseListPage(searchParams.get("page"));
  const q = searchParams.get("q") ?? "";

  const replaceParams = useCallback(
    (patch: { page?: number; q?: string }) => {
      const qs = buildListQueryString(searchParams, patch);
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      replaceParams({ page: Math.max(1, nextPage) });
    },
    [replaceParams],
  );

  const applySearch = useCallback(
    (nextQ: string) => {
      replaceParams({ page: 1, q: nextQ });
    },
    [replaceParams],
  );

  return { page, q, setPage, applySearch };
}
