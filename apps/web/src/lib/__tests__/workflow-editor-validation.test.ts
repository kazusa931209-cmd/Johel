import { describe, expect, it } from "vitest";
import { validateWorkflowEditorContent } from "@/lib/workflow";

describe("validateWorkflowEditorContent", () => {
  it("requires profile and at least one complete company entry", () => {
    expect(validateWorkflowEditorContent({ profileId: "", companies: [] })).toEqual({
      profileId: "Select one profile.",
      companies: "Add at least one company entry.",
    });
  });

  it("accepts a valid workflow editor payload", () => {
    expect(
      validateWorkflowEditorContent({
        profileId: "profile-1",
        companies: [
          {
            companyId: "company-1",
            startDate: "2020",
            endDate: "Present",
            experienceIds: ["experience-1"],
          },
        ],
      }),
    ).toEqual({});
  });
});
