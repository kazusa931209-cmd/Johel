import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import { buildResumeDocxBuffer } from "../../docx-builder/builder";

const sampleResume: GeneratedResume = {
  header: {
    name: "Jane Doe",
    title: "Backend Engineer",
    contact: { email: "jane@example.com" },
  },
  summary: "Backend engineer.",
  skills: [{ category: "Languages", items: ["TypeScript"] }],
  experiences: [
    {
      company: "Acme Corp",
      title: "Senior Engineer",
      bullets: ["Built APIs"],
    },
  ],
};

describe("buildResumeDocxBuffer", () => {
  it("produces a valid DOCX buffer", async () => {
    const buffer = await buildResumeDocxBuffer(sampleResume);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
  });
});
