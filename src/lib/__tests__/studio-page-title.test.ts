import { describe, expect, it } from "vitest";
import { getStudioPageTitleKey } from "../studio-page-title";

describe("getStudioPageTitleKey", () => {
  it("maps static routes", () => {
    expect(getStudioPageTitleKey("/")).toBe("generate.title");
    expect(getStudioPageTitleKey("/resume-builder")).toBe("resumeBuilder.title");
    expect(getStudioPageTitleKey("/profiles")).toBe("crud.profiles.title");
  });

  it("maps dynamic form routes", () => {
    expect(getStudioPageTitleKey("/profiles/new")).toBe(
      "crud.profiles.form.addTitle",
    );
    expect(getStudioPageTitleKey("/profiles/abc/edit")).toBe(
      "crud.profiles.form.editTitle",
    );
  });
});
