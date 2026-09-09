"use client";

import { useState } from "react";
import { AiUsageHistory } from "@/components/app/AiUsageHistory";
import { STUDIO_FAB_CLASS, STUDIO_FAB_CLUSTER_CLASS } from "@/components/app/studio-fab";
import { HistoryIcon } from "@/components/shared/icons";

export function StudioBottomFabCluster() {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <div className={STUDIO_FAB_CLUSTER_CLASS}>
        <button
          type="button"
          aria-label="AI usage history"
          className={STUDIO_FAB_CLASS}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          <HistoryIcon className="h-6 w-6" />
        </button>
      </div>

      <AiUsageHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        showFab={false}
      />
    </>
  );
}
