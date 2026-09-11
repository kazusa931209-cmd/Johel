import { describe, expect, it } from "vitest";
import {
  formatGenerationInformation,
  parseGenerationCombineProfileId,
  parseGenerationJobJson,
} from "../generation-list-info.js";

describe("generation-list-info", () => {
  it("parses jd metadata from job json", () => {
    expect(
      parseGenerationJobJson(
        JSON.stringify({
          jdCompanyName: "Acme Corp",
          jdJobRole: "Backend Engineer",
        }),
      ),
    ).toEqual({
      jdCompanyName: "Acme Corp",
      jdJobRole: "Backend Engineer",
    });
  });

  it("parses combine profile id", () => {
    expect(
      parseGenerationCombineProfileId(
        JSON.stringify({ profileId: "prof-1", companies: [] }),
      ),
    ).toBe("prof-1");
  });

  it("formats information for history list", () => {
    expect(
      formatGenerationInformation({
        profileName: "Jane Doe",
        jdCompanyName: "Acme Corp",
        jdJobRole: "Backend Engineer",
      }),
    ).toBe("Jane Doe · Acme Corp · Backend Engineer");
  });
});
