"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import { getGeneration, getGenerationProcess } from "@/lib/api";
import { isGenerateStep } from "@/lib/generate-step-labels";
import { GENERATION_FINALIZED_EVENT } from "@/lib/generation-finalized-events";
import {
  deriveLifecycleStatusFromRecord,
  deriveLifecycleStatusFromSession,
  type GenerationLifecycleStatus,
} from "@/lib/generation-lifecycle-status";
import { GENERATE_SESSION_CHANGED_EVENT } from "@/lib/generate-session-events";
import { loadGenerateSession } from "@/lib/generate-session";

export type HeaderGenerationStatus = {
  generationPublicId: string | null;
  activeStep: GenerateStep | null;
  lifecycleStatus: GenerationLifecycleStatus | null;
  isHistoryView: boolean;
};

const EMPTY_STATUS: HeaderGenerationStatus = {
  generationPublicId: null,
  activeStep: null,
  lifecycleStatus: null,
  isHistoryView: false,
};

type GenerateStatusContextValue = {
  status: HeaderGenerationStatus;
};

const GenerateStatusContext = createContext<GenerateStatusContextValue | null>(
  null,
);

function parseHistoryPublicId(pathname: string): string | null {
  const match = pathname.match(/^\/history\/([^/]+)$/);
  return match?.[1] ?? null;
}

function readSessionStatus(
  userId: string,
  doEvaluate: boolean,
): HeaderGenerationStatus {
  const session = loadGenerateSession(userId);
  if (!session?.generationPublicId) {
    return EMPTY_STATUS;
  }
  return {
    generationPublicId: session.generationPublicId,
    activeStep: session.activeStep,
    lifecycleStatus: deriveLifecycleStatusFromSession(session, doEvaluate),
    isHistoryView: false,
  };
}

export function GenerateStatusProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const historyPublicId = useMemo(
    () => parseHistoryPublicId(pathname),
    [pathname],
  );
  const [doEvaluate, setDoEvaluate] = useState(true);
  const [status, setStatus] = useState<HeaderGenerationStatus>(EMPTY_STATUS);

  useEffect(() => {
    let cancelled = false;
    void getGenerationProcess().then((res) => {
      if (cancelled || !res.data) return;
      setDoEvaluate(res.data.doEvaluate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncFromSession = useCallback(() => {
    setStatus(readSessionStatus(userId, doEvaluate));
  }, [doEvaluate, userId]);

  const loadHistoryStatus = useCallback(async (publicId: string) => {
    const res = await getGeneration(publicId);
    if (!res.data) {
      setStatus({
        generationPublicId: publicId,
        activeStep: null,
        lifecycleStatus: null,
        isHistoryView: true,
      });
      return;
    }
    const activeStep = isGenerateStep(res.data.activeStep)
      ? res.data.activeStep
      : null;
    setStatus({
      generationPublicId: res.data.publicId,
      activeStep,
      lifecycleStatus: deriveLifecycleStatusFromRecord({
        status: res.data.status,
        evaluationMarkdown: res.data.evaluationMarkdown,
        doEvaluate: res.data.doEvaluate,
        resume: res.data.resume,
      }),
      isHistoryView: true,
    });
  }, []);

  useEffect(() => {
    if (historyPublicId) {
      return;
    }
    syncFromSession();
  }, [doEvaluate, historyPublicId, syncFromSession]);

  useEffect(() => {
    if (!historyPublicId) {
      return;
    }

    let cancelled = false;
    void loadHistoryStatus(historyPublicId).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [historyPublicId, loadHistoryStatus]);

  useEffect(() => {
    function onSessionChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== userId || historyPublicId) {
        return;
      }
      syncFromSession();
    }

    function onFinalized(event: Event) {
      const detail = (event as CustomEvent<{ publicId?: string }>).detail;
      if (!historyPublicId || detail?.publicId !== historyPublicId) {
        return;
      }
      void loadHistoryStatus(historyPublicId);
    }

    window.addEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
    window.addEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    return () => {
      window.removeEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
      window.removeEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    };
  }, [historyPublicId, loadHistoryStatus, syncFromSession, userId]);

  const value = useMemo(() => ({ status }), [status]);

  return (
    <GenerateStatusContext.Provider value={value}>
      {children}
    </GenerateStatusContext.Provider>
  );
}

export function useGenerateStatus() {
  const ctx = useContext(GenerateStatusContext);
  if (!ctx) {
    throw new Error(
      "useGenerateStatus must be used within GenerateStatusProvider",
    );
  }
  return ctx;
}
