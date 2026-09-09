import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import { buildResumePdfBuffer } from "../builder";

const baseResume: GeneratedResume = {
  header: { name: "John Doe" },
  experiences: [
    {
      title: "Senior Dev",
      company: "Acme",
      startDate: "2020-01",
      endDate: "2024-01",
      bullets: ["Built APIs"],
    },
  ],
};

describe("pdf encoding", () => {
  it("handles em dash, en dash, and bullet characters", async () => {
    const resume: GeneratedResume = {
      ...baseResume,
      experiences: [
        {
          title: "Senior Dev — Lead",
          company: "Acme Corp",
          startDate: "2020-01",
          endDate: "2024-01",
          bullets: ["Shipped feature • with bullet and en–dash range"],
        },
      ],
    };

    const buffer = await buildResumePdfBuffer(resume);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("drops characters outside WinAnsi for Helvetica", async () => {
    const resume: GeneratedResume = {
      header: { name: "café résumé" },
      experiences: [
        {
          title: "Dev",
          company: "Co",
          bullets: ["Built APIs with 日本語"],
        },
      ],
    };

    const buffer = await buildResumePdfBuffer(resume);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(100);
  });
});
