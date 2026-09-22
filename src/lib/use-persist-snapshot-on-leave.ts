"use client";

import { useEffect, useRef } from "react";

export type PersistSnapshotOnLeaveOptions = {
  enabled: boolean;
  saveSnapshot: (finalized?: boolean) => Promise<{ error?: string } | void>;
  finalized?: boolean;
  saveKeepalive?: () => void;
};

/** Persists generation snapshot on SPA leave (unmount) and on tab close / refresh (`pagehide`). */
export function usePersistSnapshotOnLeave({
  enabled,
  saveSnapshot,
  finalized,
  saveKeepalive,
}: PersistSnapshotOnLeaveOptions) {
  const saveRef = useRef(saveSnapshot);
  saveRef.current = saveSnapshot;
  const finalizedRef = useRef(finalized);
  finalizedRef.current = finalized;
  const keepaliveRef = useRef(saveKeepalive);
  keepaliveRef.current = saveKeepalive;

  useEffect(() => {
    if (!enabled) return;

    const onPageHide = () => {
      keepaliveRef.current?.();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void saveRef.current(finalizedRef.current === true ? true : undefined);
    };
  }, [enabled]);
}
