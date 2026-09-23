import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "@johel/resume";
import {
  createDraftResumeHistoryState,
  pushDraftResumeHistoryState,
  redoDraftResumeHistoryState,
  resetDraftResumeHistoryState,
  undoDraftResumeHistoryState,
} from "@/components/generate/draft-resume-history";

const resumeA: GeneratedResume = {
  header: { name: "Alice" },
  experiences: [
    {
      company: "Acme",
      title: "Engineer",
      bullets: ["Built things"],
    },
  ],
};

const resumeB: GeneratedResume = {
  ...resumeA,
  summary: "Updated summary",
};

describe("draft-resume-history", () => {
  it("supports push, undo, and redo", () => {
    let state = createDraftResumeHistoryState(resumeA);
    state = pushDraftResumeHistoryState(state, resumeB);

    const undone = undoDraftResumeHistoryState(state);
    expect(undone.resume?.summary).toBeUndefined();

    const redone = redoDraftResumeHistoryState(undone.state);
    expect(redone.resume?.summary).toBe("Updated summary");
  });

  it("reset replaces the stack", () => {
    let state = pushDraftResumeHistoryState(
      createDraftResumeHistoryState(resumeA),
      resumeB,
    );
    state = resetDraftResumeHistoryState(resumeA);
    expect(state.index).toBe(0);
    expect(state.stack).toHaveLength(1);
  });
});
