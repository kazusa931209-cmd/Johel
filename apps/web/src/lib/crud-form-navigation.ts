"use client";

import { useRouter } from "next/navigation";

export function useCrudFormNavigation(fallbackHref: string) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return { goBack };
}
