import { describe, expect, it } from "vitest";
import { workflowContentFingerprintFromInput } from "../generation-fingerprint.js";

const baseInput = {
  profile: {
    id: "profile-1",
    firstName: "Jane",
    lastName: "Doe",
    birthDate: null,
    email: "jane@example.com",
    pn: null,
    residence: null,
    education: null,
    links: [{ key: "LinkedIn", link: "https://linkedin.com/in/jane" }],
  },
  companies: [
    {
      id: "company-1",
      alias: "Acme",
      name: "Acme",
      whatCompanyIs: "Software",
      domainAndStack: "Web APIs",
      startDate: "2020",
      endDate: "Present",
      roleContext: "Backend engineer",
      experiences: [
        {
          id: "experience-1",
          category: "Backend",
          problem: "Slow API responses",
          actions: "Built REST APIs with Node.js",
          outcome: "",
        },
      ],
    },
  ],
  workflow: {
    id: "workflow-1",
    name: "Senior Backend",
    description: "",
    language: "en",
  },
};

describe("workflowContentFingerprintFromInput", () => {
  it("returns the same fingerprint for identical PCE content", () => {
    const first = workflowContentFingerprintFromInput(baseInput);
    const second = workflowContentFingerprintFromInput({
      ...baseInput,
      profile: { ...baseInput.profile },
    });
    expect(first).toBe(second);
  });

  it("returns a different fingerprint when experience content changes", () => {
    const before = workflowContentFingerprintFromInput(baseInput);
    const after = workflowContentFingerprintFromInput({
      ...baseInput,
      companies: [
        {
          ...baseInput.companies[0],
          experiences: [
            {
              ...baseInput.companies[0].experiences[0],
              actions: "Built scalable REST APIs with Node.js",
            },
          ],
        },
      ],
    });
    expect(before).not.toBe(after);
  });

  it("returns a different fingerprint when company period changes", () => {
    const before = workflowContentFingerprintFromInput(baseInput);
    const after = workflowContentFingerprintFromInput({
      ...baseInput,
      companies: [
        {
          ...baseInput.companies[0],
          endDate: "2024",
        },
      ],
    });
    expect(before).not.toBe(after);
  });
});
