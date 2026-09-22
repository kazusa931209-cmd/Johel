import { describe, expect, it } from "vitest";
import {
  generatedResumeSchema,
  isNonEmptyResume,
  parseGeneratedResume,
} from "../generated-resume";

const validResume = {
  header: {
    name: "Jane Doe",
    title: "Backend Engineer",
    contact: {
      email: "jane@example.com",
      location: "Remote",
    },
  },
  summary: "Experienced backend engineer.",
  skills: [{ category: "Languages", items: ["TypeScript", "Go"] }],
  experiences: [
    {
      company: "Acme Corp",
      title: "Senior Engineer",
      startDate: "2020",
      endDate: "Present",
      bullets: ["Built APIs", "Led migrations"],
    },
  ],
  education: [
    {
      institution: "State University",
      degree: "B.S.",
      field: "Computer Science",
    },
  ],
  certifications: ["AWS Certified"],
  projects: [
    {
      name: "Payments Platform",
      technologies: ["Node.js"],
      bullets: ["Reduced latency by 30%"],
    },
  ],
};

describe("generatedResumeSchema", () => {
  it("accepts a valid resume", () => {
    const parsed = parseGeneratedResume(validResume);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(isNonEmptyResume(parsed.data)).toBe(true);
    }
  });

  it("rejects missing header name", () => {
    const parsed = generatedResumeSchema.safeParse({
      ...validResume,
      header: { name: "" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty experiences", () => {
    const parsed = generatedResumeSchema.safeParse({
      ...validResume,
      experiences: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects experience without bullets", () => {
    const parsed = generatedResumeSchema.safeParse({
      ...validResume,
      experiences: [{ company: "Acme", title: "Engineer", bullets: [] }],
    });
    expect(parsed.success).toBe(false);
  });
});
