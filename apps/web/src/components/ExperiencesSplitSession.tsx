"use client";

import { useEffect } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { ExperienceSplitDrawer } from "@/components/ExperienceSplitDrawer";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import type { ExperienceDetail } from "@/lib/api";
import { useExperienceSplitFlow } from "@/lib/use-experience-split-flow";

type ExperiencesSplitSessionProps = {
  experience: ExperienceDetail;
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
};

export function ExperiencesSplitSession({
  experience,
  open,
  onClose,
  onApplied,
}: ExperiencesSplitSessionProps) {
  const t = useT();
  const {
    suggesting,
    applying,
    result,
    adviseShapedResult,
    displayOperations,
    handleSuggest,
    handleApply,
    resetFlow,
  } = useExperienceSplitFlow({
    experienceId: experience.id,
    onApplySuccess: () => {
      onApplied();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      resetFlow();
    }
  }, [open, resetFlow]);

  return (
    <>
      <ExperienceSplitDrawer
        open={open}
        experience={experience}
        onClose={onClose}
        result={result}
        adviseShapedResult={adviseShapedResult}
        displayOperations={displayOperations}
        onSuggest={() => void handleSuggest()}
        onApply={() => void handleApply()}
        suggesting={suggesting}
        applying={applying}
      />

      {suggesting ? (
        <BusyOverlay
          title={t("crud.experiences.split.busy.title")}
          description={t("crud.experiences.split.busy.description")}
        />
      ) : applying ? (
        <BusyOverlay
          title={t("crud.experiences.split.applyingBusy.title")}
          description={t("crud.experiences.split.applyingBusy.description")}
        />
      ) : null}
    </>
  );
}
