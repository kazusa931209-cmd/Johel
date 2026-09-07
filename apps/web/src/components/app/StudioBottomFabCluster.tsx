"use client";

import { useState } from "react";
import { AiUsageHistory } from "@/components/app/AiUsageHistory";
import { QuickPceDrawer } from "@/components/app/QuickPce";
import { STUDIO_FAB_CLASS, STUDIO_FAB_CLUSTER_CLASS } from "@/components/app/studio-fab";
import { HistoryIcon, PlusIcon } from "@/components/shared/icons";

type ActivePanel = "none" | "history" | "quickPce";

export function StudioBottomFabCluster() {
  const [active, setActive] = useState<ActivePanel>("none");
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  function openHistory() {
    setSuggestionOpen(false);
    setActive((current) => (current === "history" ? "none" : "history"));
  }

  function openQuickPce() {
    setActive((current) => (current === "quickPce" ? "none" : "quickPce"));
  }

  function closeQuickPce() {
    setSuggestionOpen(false);
    setActive("none");
  }

  return (
    <>
      <div className={STUDIO_FAB_CLUSTER_CLASS}>
        <button
          type="button"
          aria-label="Quick PCE"
          className={STUDIO_FAB_CLASS}
          onClick={openQuickPce}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="AI usage history"
          className={STUDIO_FAB_CLASS}
          onClick={openHistory}
        >
          <HistoryIcon className="h-6 w-6" />
        </button>
      </div>

      <AiUsageHistory
        open={active === "history"}
        onOpenChange={(open) => setActive(open ? "history" : "none")}
        showFab={false}
      />

      <QuickPceDrawer
        open={active === "quickPce"}
        onClose={closeQuickPce}
        suggestionOpen={suggestionOpen}
        onSuggestionOpenChange={setSuggestionOpen}
      />
    </>
  );
}
