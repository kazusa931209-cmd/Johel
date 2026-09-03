"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  href: string;
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

export function BackButton({ href, "aria-label": ariaLabel }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-surface-muted"
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </button>
  );
}
