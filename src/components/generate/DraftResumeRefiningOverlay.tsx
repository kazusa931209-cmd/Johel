"use client";

import { useT } from "@/components/app/LocaleProvider";

export function DraftResumeRefiningOverlay() {
  const t = useT();

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
        <p className="text-sm font-medium">
          {t("generate.generateStep.refining.title")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t("generate.generateStep.refining.description")}
        </p>
      </div>
    </div>
  );
}
