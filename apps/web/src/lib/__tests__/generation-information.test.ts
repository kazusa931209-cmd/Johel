import { describe, expect, it } from "vitest";
import { formatGenerationInformation } from "@/lib/generation-information";

describe("formatGenerationInformation", () => {
  it("joins profile, company, and role with separators", () => {
    expect(
      formatGenerationInformation({
        profileName: "Jane Doe",
        jdCompanyName: "Acme Corp",
        jdJobRole: "Senior Engineer",
      }),
    ).toBe("Jane Doe · Acme Corp · Senior Engineer");
  });

  it("returns em dash when all parts are empty", () => {
    expect(formatGenerationInformation({})).toBe("—");
  });
});
