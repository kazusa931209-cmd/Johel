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
import { loadGenerationProcess } from "@/lib/cached-settings";
import { getCurrentGeneration } from "@/lib/api";
import { GENERATION_FINALIZED_EVENT } from "@/lib/generation-finalized-events";
import { generationDetailToSession } from "@/lib/generation-persistence";
import { deriveProcessedStepFromSession } from "@/lib/generation-step-progress";
import {
  GENERATE_SESSION_CHANGED_EVENT,
  type GenerateSessionChangedDetail,
} from "@/lib/generate-session-events";

export type HeaderGenerationStatus = {
  generationId: string | null;
  generationPublicId: string | null;
  processedStep: string | null;
  doVerdict: boolean;
  doEvaluate: boolean;
  finalized: boolean;
};

const EMPTY_STATUS: HeaderGenerationStatus = {
  generationId: null,
  generationPublicId: null,
  processedStep: null,
  doVerdict: true,
  doEvaluate: true,
  finalized: false,
};

type GenerateStatusContextValue = {
  status: HeaderGenerationStatus;
};

const GenerateStatusContext = createContext<GenerateStatusContextValue | null>(
  null,
);

function statusFromSessionChangedDetail(
  detail: GenerateSessionChangedDetail["status"],
  doVerdict: boolean,
  doEvaluate: boolean,
): HeaderGenerationStatus | null {
  if (!detail) {
    return null;
  }
  return {
    generationId: detail.generationId,
    generationPublicId: detail.generationPublicId,
    processedStep: detail.processedStep,
    doVerdict,
    doEvaluate,
    finalized: detail.finalized,
  };
}

export function GenerateStatusProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [doVerdict, setDoVerdict] = useState(true);
  const [doEvaluate, setDoEvaluate] = useState(true);
  const [status, setStatus] = useState<HeaderGenerationStatus>(EMPTY_STATUS);

  useEffect(() => {
    let cancelled = false;
    void loadGenerationProcess().then((res) => {
      if (cancelled || !res.data) return;
      setDoVerdict(res.data.doVerdict);
      setDoEvaluate(res.data.doEvaluate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncFromServer = useCallback(async () => {
    const res = await getCurrentGeneration();
    if (!res.data) {
      setStatus((prev) => ({
        ...EMPTY_STATUS,
        doVerdict: prev.doVerdict,
        doEvaluate: prev.doEvaluate,
      }));
      return;
    }
    const session = generationDetailToSession(res.data);
    setStatus((prev) => ({
      generationId: session.generationId,
      generationPublicId: session.generationPublicId,
      processedStep: deriveProcessedStepFromSession(session),
      doVerdict: prev.doVerdict,
      doEvaluate: prev.doEvaluate,
      finalized: session.finalized,
    }));
  }, []);

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer, userId]);

  useEffect(() => {
    function onSessionChanged(event: Event) {
      const detail = (event as CustomEvent<GenerateSessionChangedDetail>)
        .detail;
      if (detail?.userId !== userId) {
        return;
      }
      const next = statusFromSessionChangedDetail(
        detail.status,
        doVerdict,
        doEvaluate,
      );
      if (next) {
        setStatus(next);
        return;
      }
      void syncFromServer();
    }

    function onFinalized(event: Event) {
      const detail = (event as CustomEvent<{ publicId?: string }>).detail;
      setStatus((prev) => {
        if (detail?.publicId !== prev.generationPublicId) {
          return prev;
        }
        return { ...prev, finalized: true };
      });
    }

    window.addEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
    window.addEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    return () => {
      window.removeEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
      window.removeEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    };
  }, [doEvaluate, doVerdict, syncFromServer, userId]);

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
