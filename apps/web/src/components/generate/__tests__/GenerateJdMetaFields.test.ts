import { describe, expect, it } from "vitest";
import { validateGenerateJdMetaFields } from "@/lib/jd-meta-validation";

describe("validateGenerateJdMetaFields", () => {
  const t = (key: string) => key;

  it("returns no errors when both fields are filled", () => {
    expect(validateGenerateJdMetaFields("Acme", "Engineer", t)).toEqual({});
  });

  it("returns errors when fields are empty", () => {
    expect(validateGenerateJdMetaFields(" ", "", t)).toEqual({
      jdCompanyName: "validation.jdCompanyNameRequired",
      jdJobRole: "validation.jdRoleRequired",
    });
  });
});
