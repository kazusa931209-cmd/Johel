import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import { buildResumePdfBuffer } from "../builder";
import { PDF_PAGE_HEIGHT, PDF_PAGE_WIDTH } from "../styles";

const sampleResume: GeneratedResume = {
  header: {
    name: "John Doe",
    title: "Engineer",
    contact: { email: "john@example.com" },
  },
  summary: "Experienced engineer.",
  skills: [{ category: "Languages", items: ["TypeScript", "Go"] }],
  experiences: [
    {
      title: "Senior Engineer",
      company: "Acme",
      startDate: "2020-01",
      endDate: "2024-01",
      bullets: ["Built APIs", "Led migrations"],
    },
  ],
  education: [
    {
      institution: "State University",
      degree: "BS",
      field: "Computer Science",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  certifications: ["AWS Certified"],
  projects: [
    {
      name: "Side Project",
      description: "Open source tool",
      technologies: ["Rust"],
      bullets: ["Published v1"],
    },
  ],
};

describe("pdf-builder", () => {
  it("builds a PDF buffer with header content", async () => {
    const buffer = await buildResumePdfBuffer(sampleResume);
    const header = buffer.subarray(0, 4).toString("utf8");
    expect(header).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(100);
  });

  it("uses A4 page size", async () => {
    const buffer = await buildResumePdfBuffer(sampleResume);
    const doc = await PDFDocument.load(buffer);
    const page = doc.getPages()[0];
    expect(page.getWidth()).toBeCloseTo(PDF_PAGE_WIDTH, 1);
    expect(page.getHeight()).toBeCloseTo(PDF_PAGE_HEIGHT, 1);
  });
});
