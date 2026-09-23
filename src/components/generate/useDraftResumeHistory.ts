"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import {
  createDraftResumeHistoryState,
  pushDraftResumeHistoryState,
  redoDraftResumeHistoryState,
  resetDraftResumeHistoryState,
  type DraftResumeHistoryState,
  undoDraftResumeHistoryState,
} from "@/components/generate/draft-resume-history";

export type DraftResumeHistory = {
  canUndo: boolean;
  canRedo: boolean;
  push: (resume: GeneratedResume) => void;
  undo: () => GeneratedResume | null;
  redo: () => GeneratedResume | null;
  reset: (resume: GeneratedResume) => void;
};

export function useDraftResumeHistory(
  initialResume: GeneratedResume | null,
): DraftResumeHistory {
  const stateRef = useRef<DraftResumeHistoryState>(
    createDraftResumeHistoryState(initialResume),
  );
  const [index, setIndex] = useState(0);
  const [stackLength, setStackLength] = useState(stateRef.current.stack.length);

  const syncFromRef = useCallback(() => {
    setIndex(stateRef.current.index);
    setStackLength(stateRef.current.stack.length);
  }, []);

  const reset = useCallback(
    (resume: GeneratedResume) => {
      stateRef.current = resetDraftResumeHistoryState(resume);
      syncFromRef();
    },
    [syncFromRef],
  );

  const push = useCallback(
    (resume: GeneratedResume) => {
      stateRef.current = pushDraftResumeHistoryState(stateRef.current, resume);
      syncFromRef();
    },
    [syncFromRef],
  );

  const undo = useCallback((): GeneratedResume | null => {
    const result = undoDraftResumeHistoryState(stateRef.current);
    stateRef.current = result.state;
    syncFromRef();
    return result.resume;
  }, [syncFromRef]);

  const redo = useCallback((): GeneratedResume | null => {
    const result = redoDraftResumeHistoryState(stateRef.current);
    stateRef.current = result.state;
    syncFromRef();
    return result.resume;
  }, [syncFromRef]);

  return useMemo(
    () => ({
      canUndo: index > 0,
      canRedo: index < stackLength - 1,
      push,
      undo,
      redo,
      reset,
    }),
    [index, push, redo, reset, stackLength, undo],
  );
}
