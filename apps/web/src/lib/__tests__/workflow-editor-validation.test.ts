import { describe, expect, it } from "vitest";
import { en } from "@/messages/en";
import { translate } from "@/messages/translate";
import { validateWorkflowEditorContent } from "@/lib/workflow";

const t = (key: string) => translate("en", key);

describe("validateWorkflowEditorContent", () => {
  it("requires profile and at least one complete company entry", () => {
    expect(
      validateWorkflowEditorContent({ profileId: "", companies: [] }, t),
    ).toEqual({
      profileId: en.validation.profileRequired,
      companies: en.validation.companiesMinOne,
    });
  });

  it("accepts a valid workflow editor payload", () => {
    expect(
      validateWorkflowEditorContent(
        {
          profileId: "profile-1",
          companies: [
            {
              companyId: "company-1",
              startDate: "2020",
              endDate: "Present",
              roleContext: "Backend engineer",
              experienceIds: ["experience-1"],
            },
          ],
        },
        t,
      ),
    ).toEqual({});
  });
});
