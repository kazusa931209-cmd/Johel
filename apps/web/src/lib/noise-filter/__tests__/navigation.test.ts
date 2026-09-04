import { describe, expect, it } from "vitest";
import { NavigationFilter } from "../filters/navigation.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new NavigationFilter().apply(createInitialContext(input)).text;
}

describe("NavigationFilter", () => {
  it("removes standalone navigation labels", () => {
    const text = run("Home\nLogin\nSign Up\nGolang Engineer\nFind Jobs");
    expect(text).toContain("Golang Engineer");
    expect(text).not.toMatch(/^Home$/m);
    expect(text).not.toMatch(/^Login$/m);
    expect(text).not.toMatch(/^Find Jobs$/m);
  });

  it("preserves Job Description and Company Overview", () => {
    const text = run("Job Description\nDo things\nCompany Overview\nBIT");
    expect(text).toContain("Job Description");
    expect(text).toContain("Company Overview");
    expect(text).toContain("BIT");
  });

  it("removes standalone svg", () => {
    expect(run("svg\nBIT")).toBe("BIT");
  });
});
