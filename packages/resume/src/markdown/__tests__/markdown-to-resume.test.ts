import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import { markdownToResume } from "../markdown-to-resume";
import { resumeToMarkdown } from "../resume-to-markdown";

const sampleResume: GeneratedResume = {
  header: {
    name: "Jane Doe",
    title: "Backend Engineer",
    contact: {
      email: "jane@example.com",
      phone: "+1 555-0100",
      location: "Remote",
    },
  },
  summary: "Backend engineer with fintech experience.",
  skills: [
    { category: "Languages", items: ["TypeScript", "Go"] },
    { category: "Databases", items: ["PostgreSQL"] },
  ],
  experiences: [
    {
      company: "Acme Corp",
      title: "Senior Engineer",
      location: "Remote",
      startDate: "2020",
      endDate: "Present",
      bullets: ["Built APIs", "Improved reliability"],
    },
    {
      company: "Beta LLC",
      title: "Engineer",
      startDate: "2017",
      endDate: "2020",
      bullets: ["Maintained services"],
    },
  ],
  education: [
    {
      institution: "State University",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2013",
      endDate: "2017",
    },
  ],
  certifications: ["AWS Certified Developer"],
  projects: [
    {
      name: "Payments Platform",
      description: "Internal payments service",
      technologies: ["Node.js", "PostgreSQL"],
      bullets: ["Reduced latency"],
    },
  ],
};

describe("markdownToResume", () => {
  it("round-trips sample resume through resumeToMarkdown", () => {
    const markdown = resumeToMarkdown(sampleResume);
    const parsed = markdownToResume(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual(sampleResume);
  });

  it("round-trips minimal resume", () => {
    const minimal: GeneratedResume = {
      header: { name: "John Smith" },
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          bullets: ["Shipped features"],
        },
      ],
    };
    const markdown = resumeToMarkdown(minimal);
    const parsed = markdownToResume(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual(minimal);
  });

  it("rejects missing name heading", () => {
    const parsed = markdownToResume("## Experience\n\n### Engineer — Acme\n- Did work");
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error).toContain("Name");
  });

  it("rejects missing experience section content", () => {
    const parsed = markdownToResume("# Jane Doe\n\n## Experience");
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error).toContain("experience");
  });

  it("rejects malformed experience heading", () => {
    const parsed = markdownToResume(
      "# Jane Doe\n\n## Experience\n\n### Missing separator\n- Bullet",
    );
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error).toContain("experience");
  });
});
