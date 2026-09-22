"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import {
  GenerateNewButton,
  GenerateStepNavProvider,
  GenerateStepNavRunButton,
} from "@/components/generate/GenerateStepNav";
import { useGeneralResumeSession } from "@/components/generate/useGeneralResumeSession";
import {
  getAdjacentGenerateStep,
  getGenerateCurrentPanelTitle,
} from "@/lib/generate-steps";
import {
  normalizeResumeBuilderActiveStep,
  needsNewGeneralResumeConfirm,
  RESUME_BUILDER_STEPS,
} from "@/lib/resume-builder-steps";

export default function ResumeBuilderPage() {
  const t = useT();
  const { toast } = useToast();
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    combine,
    resume,
    job,
    resetSession,
  } = useGeneralResumeSession();

  const normalizedActiveStep = useMemo(
    () => normalizeResumeBuilderActiveStep(activeStep),
    [activeStep],
  );

  useEffect(() => {
    if (!sessionReady) return;
    if (normalizedActiveStep !== activeStep) {
      setActiveStep(normalizedActiveStep);
    }
  }, [activeStep, normalizedActiveStep, sessionReady, setActiveStep]);

  const previousStep = useMemo(
    () =>
      getAdjacentGenerateStep(
        RESUME_BUILDER_STEPS,
        normalizedActiveStep,
        "prev",
      ),
    [normalizedActiveStep],
  );

  const previousTitle = previousStep
    ? getGenerateCurrentPanelTitle(previousStep, t)
    : undefined;

  const { previousTitle: panelPreviousTitle, previousContent, previousHeaderRight } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps: RESUME_BUILDER_STEPS,
      doVerdict: false,
      job,
      combine,
      resume,
    });

  const runNewGeneration = useCallback(async () => {
    setResetting(true);
    const result = await resetSession();
    setResetting(false);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    setNewConfirmOpen(false);
  }, [resetSession, toast]);

  const requestNewGeneration = useCallback(() => {
    if (resetting) return;
    if (needsNewGeneralResumeConfirm(normalizedActiveStep)) {
      setNewConfirmOpen(true);
      return;
    }
    void runNewGeneration();
  }, [normalizedActiveStep, resetting, runNewGeneration]);

  if (!sessionReady) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("generate.loading")}
      </main>
    );
  }

  return (
    <GenerateStepNavProvider>
      <section className="-m-6 flex h-[calc(100dvh-3.5rem)] w-auto flex-col overflow-hidden">
        <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 items-start gap-3">
              <GenerateNewButton
                onClick={requestNewGeneration}
                disabled={resetting}
              />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t("resumeBuilder.title")}
                </h1>
              </div>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_3.5rem] items-center gap-3">
              <GenerateTimeline
                active={normalizedActiveStep}
                steps={RESUME_BUILDER_STEPS}
                onStepSelect={setActiveStep}
              />
              <GenerateStepNavRunButton />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 pt-6 pb-6">
          <GenerateStepLayout
            previousTitle={panelPreviousTitle ?? previousTitle}
            previous={previousContent}
            previousHeaderRight={previousHeaderRight}
            currentTitle={getGenerateCurrentPanelTitle(
              normalizedActiveStep,
              t,
            )}
          >
            {null}
          </GenerateStepLayout>
        </div>
      </section>

      {newConfirmOpen ? (
        <ConfirmDialog
          title={t("generate.newConfirm.title")}
          closeDisabled={resetting}
          confirmDisabled={resetting}
          onClose={() => setNewConfirmOpen(false)}
          onConfirm={() => void runNewGeneration()}
          confirmLabel={
            resetting ? t("generate.newConfirm.confirming") : t("generate.new")
          }
        >
          <p className="text-muted">{t("generate.newConfirm.body")}</p>
        </ConfirmDialog>
      ) : null}
    </GenerateStepNavProvider>
  );
}
