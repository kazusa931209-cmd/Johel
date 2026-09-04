import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
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

describe("resumeToMarkdown", () => {
  it("renders header, summary, skills, and experiences", () => {
    const markdown = resumeToMarkdown(sampleResume);
    expect(markdown).toContain("# Jane Doe");
    expect(markdown).toContain("## Backend Engineer");
    expect(markdown).toContain("jane@example.com");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("Backend engineer with fintech experience.");
    expect(markdown).toContain("## Skills");
    expect(markdown).toContain("**Languages:** TypeScript, Go");
    expect(markdown).toContain("## Experience");
    expect(markdown).toContain("### Senior Engineer — Acme Corp");
    expect(markdown).toContain("- Built APIs");
    expect(markdown).toContain("### Engineer — Beta LLC");
  });

  it("renders optional sections", () => {
    const markdown = resumeToMarkdown(sampleResume);
    expect(markdown).toContain("## Education");
    expect(markdown).toContain("### State University");
    expect(markdown).toContain("## Certifications");
    expect(markdown).toContain("- AWS Certified Developer");
    expect(markdown).toContain("## Projects");
    expect(markdown).toContain("### Payments Platform");
  });

  it("omits empty optional sections", () => {
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
    expect(markdown).not.toContain("## Summary");
    expect(markdown).not.toContain("## Skills");
    expect(markdown).not.toContain("## Education");
    expect(markdown).not.toContain("## Certifications");
    expect(markdown).not.toContain("## Projects");
  });
});
