import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "@johel/resume";
import { getCombineReferencedCompanies } from "@/lib/linked-experience-company-labels";

const companies = [
  { id: "a", name: "Alpha Inc", alias: "alpha" },
  { id: "b", name: "Beta LLC", alias: "beta" },
  { id: "c", name: "Gamma Corp", alias: "gamma" },
];

const resume: GeneratedResume = {
  header: { name: "Jane Doe" },
  experiences: [
    {
      company: "Gamma Corp",
      title: "Engineer",
      bullets: ["Did work"],
    },
    {
      company: "Alpha Inc",
      title: "Lead",
      bullets: ["Led team"],
    },
  ],
};

describe("getCombineReferencedCompanies", () => {
  it("orders companies by first appearance on the draft resume", () => {
    const entries = [
      { companyId: "a" },
      { companyId: "b" },
      { companyId: "c" },
    ];

    expect(
      getCombineReferencedCompanies(entries, companies, resume).map(
        (company) => company.id,
      ),
    ).toEqual(["c", "a", "b"]);
  });

  it("appends combine-only companies after resume-ordered ones", () => {
    const entries = [{ companyId: "a" }, { companyId: "b" }];

    expect(
      getCombineReferencedCompanies(entries, companies, resume).map(
        (company) => company.id,
      ),
    ).toEqual(["a", "b"]);
  });

  it("keeps combine entry order when no resume is provided", () => {
    const entries = [{ companyId: "c" }, { companyId: "a" }];

    expect(
      getCombineReferencedCompanies(entries, companies).map(
        (company) => company.id,
      ),
    ).toEqual(["c", "a"]);
  });
});
