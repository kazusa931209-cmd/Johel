import { describe, expect, it } from "vitest";
import { BoilerplateFilter } from "../filters/boilerplate.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new BoilerplateFilter().apply(createInitialContext(input)).text;
}

describe("BoilerplateFilter", () => {
  it("removes privacy / copyright lines", () => {
    const text = run(
      "Company Overview\nBIT platform\nPrivacy Policy\nCopyright © 2024 DeJob",
    );
    expect(text).toContain("Company Overview");
    expect(text).toContain("BIT platform");
    expect(text).not.toMatch(/Privacy Policy/i);
    expect(text).not.toMatch(/Copyright/i);
  });

  it("does not remove sentences that merely mention apply or contact", () => {
    const line =
      "Application processing and candidate contact happens within two weeks.";
    expect(run(line)).toContain(line);
  });
});
