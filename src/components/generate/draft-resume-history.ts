import type { GeneratedResume } from "@johel/resume";
import { hashResumeForCache } from "@/lib/generate-session";

export type DraftResumeHistoryState = {
  stack: GeneratedResume[];
  index: number;
};

export function createDraftResumeHistoryState(
  resume: GeneratedResume | null,
): DraftResumeHistoryState {
  return {
    stack: resume ? [resume] : [],
    index: 0,
  };
}

export function resetDraftResumeHistoryState(
  resume: GeneratedResume,
): DraftResumeHistoryState {
  return { stack: [resume], index: 0 };
}

export function pushDraftResumeHistoryState(
  state: DraftResumeHistoryState,
  resume: GeneratedResume,
): DraftResumeHistoryState {
  const current = state.stack[state.index];
  if (current && hashResumeForCache(current) === hashResumeForCache(resume)) {
    return state;
  }
  const truncated = state.stack.slice(0, state.index + 1);
  const stack = [...truncated, resume];
  return { stack, index: stack.length - 1 };
}

export function undoDraftResumeHistoryState(
  state: DraftResumeHistoryState,
): { state: DraftResumeHistoryState; resume: GeneratedResume | null } {
  if (state.index <= 0) {
    return { state, resume: null };
  }
  const index = state.index - 1;
  return {
    state: { ...state, index },
    resume: state.stack[index] ?? null,
  };
}

export function redoDraftResumeHistoryState(
  state: DraftResumeHistoryState,
): { state: DraftResumeHistoryState; resume: GeneratedResume | null } {
  if (state.index >= state.stack.length - 1) {
    return { state, resume: null };
  }
  const index = state.index + 1;
  return {
    state: { ...state, index },
    resume: state.stack[index] ?? null,
  };
}

export function canUndoDraftResumeHistory(state: DraftResumeHistoryState): boolean {
  return state.index > 0;
}

export function canRedoDraftResumeHistory(state: DraftResumeHistoryState): boolean {
  return state.index < state.stack.length - 1;
}
