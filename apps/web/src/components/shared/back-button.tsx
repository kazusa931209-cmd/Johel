"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  href: string;
  fallbackHref?: string;
  preferHistoryBack?: boolean;
  "aria-label": string;
};

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function BackButton({
  href,
  fallbackHref,
  preferHistoryBack = false,
  "aria-label": ariaLabel,
}: BackButtonProps) {
  const router = useRouter();
  const fallback = fallbackHref ?? href;

  function onClick() {
    if (preferHistoryBack) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push(fallback);
      }
      return;
    }
    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border hover:bg-surface-muted"
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </button>
  );
}
