"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CombineTotalTenureHeader } from "@/components/generate/CombineTotalTenureHeader";
import { GenerateCombineStep } from "@/components/generate/GenerateCombineStep";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import {
  GeneralResumeUserInstructionPanel,
  formatGeneralResumeUserInstructionCount,
  type GeneralResumeUserInstructionFlushResult,
} from "@/components/generate/GeneralResumeUserInstructionPanel";
import {
  GenerateNewButton,
  GenerateStepNavProvider,
  GenerateStepNavRunButton,
} from "@/components/generate/GenerateStepNav";
import { useGeneralResumeSession } from "@/components/generate/useGeneralResumeSession";
import { loadGenerationProcess } from "@/lib/cached-settings";
import { EMPTY_JOB_STATE } from "@/lib/generate-session";
import type { ResumeLanguage } from "@/lib/api";
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
  const [resumeLanguage, setResumeLanguage] = useState<ResumeLanguage>("en");
  const userInstructionFlushRef = useRef<
    (() => GeneralResumeUserInstructionFlushResult | null) | null
  >(null);

  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    combine,
    setCombine,
    resume,
    job,
    generationId,
    saveSnapshot,
    resetSession,
  } = useGeneralResumeSession();

  const normalizedActiveStep = useMemo(
    () => normalizeResumeBuilderActiveStep(activeStep),
    [activeStep],
  );

  const isCombineStep = normalizedActiveStep === "Combine";

  useEffect(() => {
    let cancelled = false;
    void loadGenerationProcess().then((res) => {
      if (cancelled || !res.data?.resumeLanguage) return;
      setResumeLanguage(res.data.resumeLanguage);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (normalizedActiveStep !== activeStep) {
      setActiveStep(normalizedActiveStep);
    }
  }, [activeStep, normalizedActiveStep, sessionReady, setActiveStep]);

  useEffect(() => {
    if (!sessionReady) return;
    if (combine.language === resumeLanguage) return;
    setCombine({ ...combine, language: resumeLanguage });
  }, [combine, resumeLanguage, sessionReady, setCombine]);

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

  const onSaveBeforeSuggest = useCallback(async () => {
    return saveSnapshot();
  }, [saveSnapshot]);

  const runFromCombine = useCallback(() => {
    setActiveStep("Generate");
  }, [setActiveStep]);

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

  const userInstructionCharCount = useMemo(
    () => formatGeneralResumeUserInstructionCount(combine.userInstruction.length),
    [combine.userInstruction.length],
  );

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
            <GenerateNewButton
              onClick={requestNewGeneration}
              disabled={resetting}
            />
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
            previousTitle={
              isCombineStep
                ? t("resumeBuilder.combine.userInstructionTitle")
                : panelPreviousTitle ?? previousTitle
            }
            previous={
              isCombineStep ? (
                <GeneralResumeUserInstructionPanel
                  userInstruction={combine.userInstruction}
                  onUserInstructionChange={(userInstruction) =>
                    setCombine({ ...combine, userInstruction })
                  }
                  onRegisterFlush={(flush) => {
                    userInstructionFlushRef.current = flush;
                  }}
                />
              ) : (
                previousContent
              )
            }
            previousHeaderRight={
              isCombineStep ? (
                <span className="text-xs tabular-nums text-muted">
                  {userInstructionCharCount}
                </span>
              ) : (
                previousHeaderRight
              )
            }
            previousFill={isCombineStep}
            currentTitle={getGenerateCurrentPanelTitle(
              normalizedActiveStep,
              t,
            )}
            currentHeaderRight={
              isCombineStep ? (
                <CombineTotalTenureHeader combine={combine} />
              ) : undefined
            }
          >
            {isCombineStep ? (
              <GenerateCombineStep
                variant="general"
                combine={combine}
                onCombineChange={setCombine}
                job={EMPTY_JOB_STATE}
                onJobChange={() => {}}
                doVerdict={false}
                generationId={generationId}
                onSaveBeforeSuggest={onSaveBeforeSuggest}
                onRunFromCombine={runFromCombine}
                flushUserInstruction={() =>
                  userInstructionFlushRef.current?.() ?? null
                }
              />
            ) : null}
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
