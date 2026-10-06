import { describe, expect, it } from "vitest";
import {
  formatGeneralResumeInformation,
  formatGenerationInformation,
  parseGenerationCombinePlatform,
  parseGenerationCombineProfileId,
  parseGenerationJobJson,
} from "../generation-list-info";

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

  it("parses combine platform", () => {
    expect(
      parseGenerationCombinePlatform(
        JSON.stringify({ platform: "LinkedIn" }),
      ),
    ).toBe("LinkedIn");
  });

  it("formats general resume information for history list", () => {
    expect(
      formatGeneralResumeInformation({
        platform: "LinkedIn",
        profileName: "Jane Doe",
      }),
    ).toBe("LinkedIn · Jane Doe");
  });
});
