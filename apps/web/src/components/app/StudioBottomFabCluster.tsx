"use client";

import { useState } from "react";
import { AiUsageHistory } from "@/components/app/AiUsageHistory";
import { QuickAddExperience } from "@/components/app/QuickAddExperience";
import { useT } from "@/components/app/LocaleProvider";
import { STUDIO_FAB_CLASS, STUDIO_FAB_CLUSTER_CLASS } from "@/components/app/studio-fab";
import { HistoryIcon, PlusIcon } from "@/components/shared/icons";

export function StudioBottomFabCluster() {
  const t = useT();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <div className={STUDIO_FAB_CLUSTER_CLASS}>
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
