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
import { GENERATION_FINALIZED_EVENT } from "@/lib/generation-finalized-events";
import { deriveProcessedStepFromSession } from "@/lib/generation-step-progress";
import { GENERATE_SESSION_CHANGED_EVENT } from "@/lib/generate-session-events";
import { loadGenerateSession } from "@/lib/generate-session";

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

function readSessionStatus(
  userId: string,
  doVerdict: boolean,
  doEvaluate: boolean,
): HeaderGenerationStatus {
  const session = loadGenerateSession(userId);
  if (!session?.generationPublicId) {
    return { ...EMPTY_STATUS, doVerdict, doEvaluate };
  }
  return {
    generationId: session.generationId,
    generationPublicId: session.generationPublicId,
    processedStep: deriveProcessedStepFromSession(session),
    doVerdict,
    doEvaluate,
    finalized: session.finalized ?? false,
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

  const syncFromSession = useCallback(() => {
    setStatus(readSessionStatus(userId, doVerdict, doEvaluate));
  }, [doEvaluate, doVerdict, userId]);

  useEffect(() => {
    syncFromSession();
  }, [syncFromSession]);

  useEffect(() => {
    function onSessionChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== userId) {
        return;
      }
      syncFromSession();
    }

    function onFinalized(event: Event) {
      const detail = (event as CustomEvent<{ publicId?: string }>).detail;
      const session = loadGenerateSession(userId);
      if (detail?.publicId !== session?.generationPublicId) {
        return;
      }
      syncFromSession();
    }

    window.addEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
    window.addEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    return () => {
      window.removeEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
      window.removeEventListener(GENERATION_FINALIZED_EVENT, onFinalized);
    };
  }, [syncFromSession, userId]);

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
