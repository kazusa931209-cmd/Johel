"use client";

import { useState } from "react";
import { AiUsageHistory } from "@/components/app/AiUsageHistory";
import { QuickAddExperience } from "@/components/app/QuickAddExperience";
import { useDrawerPosition } from "@/components/app/DrawerPositionProvider";
import { useT } from "@/components/app/LocaleProvider";
import { studioFabClusterClass } from "@/lib/drawer-position";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";
import { HistoryIcon, PlusIcon } from "@/components/shared/icons";

export function StudioBottomFabCluster() {
  const t = useT();
  const { drawerPosition } = useDrawerPosition();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <div className={studioFabClusterClass(drawerPosition)}>
        <button
          type="button"
          aria-label={t("quickAddExperience.fabAria")}
          className={STUDIO_FAB_CLASS}
          onClick={() => setQuickAddOpen(true)}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label={t("aiUsage.fabAria")}
          className={STUDIO_FAB_CLASS}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          <HistoryIcon className="h-6 w-6" />
        </button>
      </div>

      <QuickAddExperience open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      <AiUsageHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        showFab={false}
      />
    </>
  );
}
