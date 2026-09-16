import { describe, expect, it } from "vitest";
import { hydrateJobJdMetaFromVerdict } from "../hydrate-job-jd-meta.js";

describe("hydrateJobJdMetaFromVerdict", () => {
  it("fills empty jd fields from verdict markdown", () => {
    expect(
      hydrateJobJdMetaFromVerdict({
        acceptedMarkdown: `## Role
- Title: Platform Engineer

## Company & Contacts
- Company name: Acme Corp`,
        jdCompanyName: "",
        jdJobRole: "",
      }),
    ).toEqual({
      acceptedMarkdown: expect.any(String),
      jdCompanyName: "Acme Corp",
      jdJobRole: "Platform Engineer",
    });
  });

  it("does not overwrite existing jd fields", () => {
    expect(
      hydrateJobJdMetaFromVerdict({
        acceptedMarkdown: `## Role
- Title: Other Role

## Company & Contacts
- Company name: Other Co`,
        jdCompanyName: "Saved Co",
        jdJobRole: "Saved Role",
      }),
    ).toEqual({
      acceptedMarkdown: expect.any(String),
      jdCompanyName: "Saved Co",
      jdJobRole: "Saved Role",
    });
  });
});
