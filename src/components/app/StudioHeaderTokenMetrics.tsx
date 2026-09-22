"use client";

import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { formatTokenUsed } from "@/lib/tokens";

export function StudioHeaderTokenMetrics() {
  const t = useT();
  const { tokenUsed, todayTokenUsed } = useAiUsage();

  return (
    <div
      className="flex items-stretch gap-2"
      aria-label={t("nav.header.tokenMetrics.aria")}
    >
      <div
        className="flex min-w-32 items-center justify-center gap-2 rounded-md border border-border bg-background px-2 py-2"
        title={t("nav.header.todayTokenUsageTitle")}
      >
        <p className="text-xs leading-tight text-muted">
          {t("nav.header.tokenMetrics.today")}
        </p>
        <p className="text-sm font-medium leading-tight tabular-nums">
          {formatTokenUsed(todayTokenUsed)}
        </p>
      </div>
      <div
        className="flex min-w-32 items-center gap-2 justify-center rounded-md border border-border bg-background px-2 py-2"
        title={t("nav.header.tokenUsageTitle")}
      >
        <p className="text-xs leading-tight text-muted">
          {t("nav.header.tokenMetrics.total")}
        </p>
        <p className="text-sm font-medium leading-tight tabular-nums">
          {formatTokenUsed(tokenUsed)}
        </p>
      </div>
    </div>
  );
}
