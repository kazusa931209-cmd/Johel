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
import { getAiUsageSummary } from "@/lib/api";

type AiUsageContextValue = {
  tokenUsed: number;
  todayTokenUsed: number;
  refreshTokenUsed: () => Promise<void>;
  setTokenUsed: (value: number) => void;
};

const AiUsageContext = createContext<AiUsageContextValue | null>(null);

export function AiUsageProvider({ children }: { children: ReactNode }) {
  const [tokenUsed, setTokenUsed] = useState(0);
  const [todayTokenUsed, setTodayTokenUsed] = useState(0);

  const refreshTokenUsed = useCallback(async () => {
    const res = await getAiUsageSummary();
    if (res.data) {
      setTokenUsed(res.data.tokenUsed);
      setTodayTokenUsed(res.data.todayTokenUsed ?? 0);
    }
  }, []);

  useEffect(() => {
    void refreshTokenUsed();
  }, [refreshTokenUsed]);

  const value = useMemo(
    () => ({ tokenUsed, todayTokenUsed, refreshTokenUsed, setTokenUsed }),
    [tokenUsed, todayTokenUsed, refreshTokenUsed],
  );

  return (
    <AiUsageContext.Provider value={value}>{children}</AiUsageContext.Provider>
  );
}

export function useAiUsage() {
  const ctx = useContext(AiUsageContext);
  if (!ctx) {
    throw new Error("useAiUsage must be used within AiUsageProvider");
  }
  return ctx;
}
