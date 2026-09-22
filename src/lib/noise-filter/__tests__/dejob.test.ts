import { describe, expect, it } from "vitest";
import { createInitialContext } from "../pipeline";
import { DeJobFilter } from "../plugins/dejob.filter";

function run(input: string) {
  return new DeJobFilter().apply(createInitialContext(input)).text;
}

describe("DeJobFilter", () => {
  it("removes exact DeJob chrome lines", () => {
    const text = run(
      [
        "DeJob",
        "About Us",
        "Join Us",
        "For Talents",
        "Post Resume",
        "Find Job",
        "Find Web3 Companies",
        "For Companies",
        "Golang Engineer",
      ].join("\n"),
    );
    expect(text).toContain("Golang Engineer");
    expect(text).not.toMatch(/^DeJob$/m);
    expect(text).not.toMatch(/^About Us$/m);
    expect(text).not.toMatch(/^Join Us$/m);
    expect(text).not.toMatch(/^For Talents$/m);
    expect(text).not.toMatch(/^Post Resume$/m);
    expect(text).not.toMatch(/^Find Job$/m);
    expect(text).not.toMatch(/^Find Web3 Companies$/m);
    expect(text).not.toMatch(/^For Companies$/m);
  });

  it("removes View more jobs of {Company} >", () => {
    const text = run("View more jobs of BIT >\nJob Description\nBuild APIs");
    expect(text).toContain("Job Description");
    expect(text).not.toMatch(/View more jobs of BIT/i);
  });

  it("removes tagline via regexp including Web3 variant", () => {
    expect(run("DeJob Blazes New Trials for Web 3.0\nBIT")).not.toMatch(
      /Blazes New Trials/i,
    );
    expect(run("DeJob Blazes New Trial for Web3\nBIT")).not.toMatch(
      /Blazes New Trial/i,
    );
    expect(run("DeJob Blazes New Trials for Web 3.0\nBIT")).toContain("BIT");
  });

  it("keeps mid-sentence about us in company prose", () => {
    const line =
      "Learn about us and our mission to build digital asset services.";
    expect(run(line)).toContain(line);
  });
});
