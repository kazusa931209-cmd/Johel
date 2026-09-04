import { describe, expect, it } from "vitest";
import { SectionFilter } from "../filters/section.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new SectionFilter().apply(createInitialContext(input)).text;
}

describe("SectionFilter", () => {
  it("trims footer after meaningful sections", () => {
    const text = run(
      [
        "Job Description",
        "Build APIs",
        "Company Overview",
        "BIT is a platform",
        "Contact Details",
        "email@x.com",
        "Privacy Policy",
      ].join("\n"),
    );
    expect(text).toContain("Company Overview");
    expect(text).toContain("BIT is a platform");
    expect(text).not.toContain("Contact Details");
    expect(text).not.toContain("email@x.com");
  });

  it("does not cut when no section headings were seen", () => {
    const input = "Some free text\nPrivacy Policy";
    expect(run(input)).toContain("Privacy Policy");
  });
});
