"use client";

import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useDrawerPosition } from "@/components/app/DrawerPositionProvider";
import { useT } from "@/components/app/LocaleProvider";
import { studioOppositeFabClass } from "@/lib/drawer-position";
import { formatTokenUsed } from "@/lib/tokens";

export function StudioTokenMetricsFloater() {
  const t = useT();
  const { drawerPosition } = useDrawerPosition();
  const { tokenUsed, todayTokenUsed } = useAiUsage();

  return (
    <div className={studioOppositeFabClass(drawerPosition)}>
      <div
        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg opacity-100 backdrop-blur-sm transition-[opacity,backdrop-filter] duration-200 hover:opacity-0 hover:backdrop-blur-none"
        aria-label={t("nav.header.tokenMetrics.aria")}
      >
        <div
          className="px-4 py-2.5 text-right"
          title={t("nav.header.todayTokenUsageTitle")}
        >
          <p className="text-xs text-muted">{t("nav.header.tokenMetrics.today")}</p>
          <p className="text-sm font-medium tabular-nums">
            {formatTokenUsed(todayTokenUsed)}
          </p>
        </div>
        <div className="h-px bg-border/70 group-hover:bg-border" aria-hidden />
        <div
          className="px-4 py-2.5 text-right"
          title={t("nav.header.tokenUsageTitle")}
        >
          <p className="text-xs text-muted">{t("nav.header.tokenMetrics.total")}</p>
          <p className="text-sm font-medium tabular-nums">
            {formatTokenUsed(tokenUsed)}
          </p>
        </div>
      </div>
    </div>
  );
}
