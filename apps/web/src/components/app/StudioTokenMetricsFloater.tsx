"use client";

import { useEffect, useRef, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useDrawerPosition } from "@/components/app/DrawerPositionProvider";
import { useT } from "@/components/app/LocaleProvider";
import { studioOppositeFabClass } from "@/lib/drawer-position";
import { formatTokenUsed } from "@/lib/tokens";

function isPointInsideRect(
  x: number,
  y: number,
  rect: DOMRect,
): boolean {
  return (
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );
}

export function StudioTokenMetricsFloater() {
  const t = useT();
  const { drawerPosition } = useDrawerPosition();
  const { tokenUsed, todayTokenUsed } = useAiUsage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [passThrough, setPassThrough] = useState(false);

  useEffect(() => {
    if (!passThrough) return;

    const onMove = (event: MouseEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      if (!isPointInsideRect(event.clientX, event.clientY, bounds)) {
        setPassThrough(false);
      }
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [passThrough]);

  return (
    <div
      ref={containerRef}
      className={`${studioOppositeFabClass(drawerPosition)} ${
        passThrough ? "pointer-events-none" : ""
      }`}
      onMouseEnter={() => setPassThrough(true)}
    >
      <div
        className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg transition-[opacity,backdrop-filter] duration-200 ${
          passThrough
            ? "opacity-0 backdrop-blur-none"
            : "opacity-100 backdrop-blur-sm"
        }`}
        aria-label={t("nav.header.tokenMetrics.aria")}
        aria-hidden={passThrough}
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
        <div className="h-px bg-border/70" aria-hidden />
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
