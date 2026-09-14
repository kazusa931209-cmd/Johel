import { describe, expect, it } from "vitest";
import { extractJdMetaFromVerdictMarkdown } from "../extract-from-verdict.js";

describe("extractJdMetaFromVerdictMarkdown", () => {
  it("extracts title and company name from structured verdict markdown", () => {
    const markdown = `## Role
- Title: Senior Software Engineer
- Function: Backend

## Company & Contacts
- Company name: Acme Corp
- Description: SaaS platform
- Website: https://acme.example

## Final Verdict
- Strong backend focus`;

    expect(extractJdMetaFromVerdictMarkdown(markdown)).toEqual({
      jdCompanyName: "Acme Corp",
      jdJobRole: "Senior Software Engineer",
    });
  });

  it("treats Not found and Not specified as empty", () => {
    const markdown = `## Role
- Title: Not found

## Company & Contacts
- Company name: Not specified`;

    expect(extractJdMetaFromVerdictMarkdown(markdown)).toEqual({
      jdCompanyName: "",
      jdJobRole: "",
    });
  });

  it("returns empty meta for missing sections", () => {
    expect(extractJdMetaFromVerdictMarkdown("## JD analysis\nNo role here.")).toEqual({
      jdCompanyName: "",
      jdJobRole: "",
    });
  });

  it("returns empty meta for empty input", () => {
    expect(extractJdMetaFromVerdictMarkdown("")).toEqual({
      jdCompanyName: "",
      jdJobRole: "",
    });
  });

  it("tolerates Title without bullet under Role", () => {
    const markdown = `## Role
Title: Platform Engineer

## Company & Contacts
Company name: Globex`;

    expect(extractJdMetaFromVerdictMarkdown(markdown)).toEqual({
      jdCompanyName: "Globex",
      jdJobRole: "Platform Engineer",
    });
  });
});
