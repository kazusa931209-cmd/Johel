import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "@johel/resume";
import { buildResumeZipBuffer } from "../resume-export-zip";

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

describe("buildResumeZipBuffer", () => {
  it("packages DOCX and PDF under the export folder name", async () => {
    const label = {
      publicId: "GEN-20260911-006",
      jdCompanyName: "Acme Corp",
      jdJobRole: "Senior Backend Engineer",
    };
    const { buffer, fileName } = await buildResumeZipBuffer(sampleResume, label);
    expect(fileName).toBe(
      "20260911 - 06 - Acme Corp - Senior Backend Engineer.zip",
    );

    const zip = await JSZip.loadAsync(buffer);
    const folderPath = "20260911 - 06 - Acme Corp - Senior Backend Engineer";
    expect(zip.file(`${folderPath}/Jane Doe.docx`)).toBeTruthy();
    expect(zip.file(`${folderPath}/Jane Doe.pdf`)).toBeTruthy();
    const docx = await zip.file(`${folderPath}/Jane Doe.docx`)!.async("nodebuffer");
    const pdf = await zip.file(`${folderPath}/Jane Doe.pdf`)!.async("nodebuffer");
    expect(docx.length).toBeGreaterThan(100);
    expect(pdf.length).toBeGreaterThan(100);
  });
});
