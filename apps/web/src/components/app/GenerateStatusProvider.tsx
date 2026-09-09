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
import { getGeneration } from "@/lib/api";
import { isGenerateStep } from "@/lib/generate-step-labels";
import { GENERATE_SESSION_CHANGED_EVENT } from "@/lib/generate-session-events";
import { loadGenerateSession } from "@/lib/generate-session";

export type HeaderGenerationStatus = {
  generationPublicId: string | null;
  activeStep: GenerateStep | null;
  historyStatus: "completed" | "in_progress" | null;
};

const EMPTY_STATUS: HeaderGenerationStatus = {
  generationPublicId: null,
  activeStep: null,
  historyStatus: null,
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

function readSessionStatus(userId: string): HeaderGenerationStatus {
  const session = loadGenerateSession(userId);
  if (!session?.generationPublicId) {
    return EMPTY_STATUS;
  }
  return {
    generationPublicId: session.generationPublicId,
    activeStep: session.activeStep,
    historyStatus: null,
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
  const [status, setStatus] = useState<HeaderGenerationStatus>(EMPTY_STATUS);

  const syncFromSession = useCallback(() => {
    setStatus(readSessionStatus(userId));
  }, [userId]);

  useEffect(() => {
    if (historyPublicId) {
      return;
    }
    syncFromSession();
  }, [historyPublicId, syncFromSession]);

  useEffect(() => {
    if (!historyPublicId) {
      return;
    }

    let cancelled = false;
    void getGeneration(historyPublicId).then((res) => {
      if (cancelled) return;
      if (!res.data) {
        setStatus({
          generationPublicId: historyPublicId,
          activeStep: null,
          historyStatus: null,
        });
        return;
      }
      const activeStep = isGenerateStep(res.data.activeStep)
        ? res.data.activeStep
        : null;
      setStatus({
        generationPublicId: res.data.publicId,
        activeStep,
        historyStatus: res.data.status,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [historyPublicId]);

  useEffect(() => {
    function onSessionChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== userId || historyPublicId) {
        return;
      }
      syncFromSession();
    }

    window.addEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener(GENERATE_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, [historyPublicId, syncFromSession, userId]);

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
