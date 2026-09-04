import { z } from "zod";

const contactSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

const headerSchema = z.object({
  name: z.string().trim().min(1),
  title: z.string().optional(),
  contact: contactSchema.optional(),
});

const skillGroupSchema = z.object({
  category: z.string().trim().min(1),
  items: z.array(z.string().trim().min(1)).min(1),
});

const experienceSchema = z.object({
  company: z.string().trim().min(1),
  title: z.string().trim().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(z.string().trim().min(1)).min(1),
});

const educationSchema = z.object({
  institution: z.string().trim().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string().trim().min(1)).optional(),
  bullets: z.array(z.string().trim().min(1)).optional(),
});

export const generatedResumeSchema = z.object({
  header: headerSchema,
  summary: z.string().optional(),
  skills: z.array(skillGroupSchema).optional(),
  experiences: z.array(experienceSchema).min(1),
  education: z.array(educationSchema).optional(),
  certifications: z.array(z.string().trim().min(1)).optional(),
  projects: z.array(projectSchema).optional(),
});

export type GeneratedResume = z.infer<typeof generatedResumeSchema>;
export type GeneratedResumeContact = z.infer<typeof contactSchema>;
export type GeneratedResumeExperience = z.infer<typeof experienceSchema>;
export type GeneratedResumeSkillGroup = z.infer<typeof skillGroupSchema>;
export type GeneratedResumeEducation = z.infer<typeof educationSchema>;
export type GeneratedResumeProject = z.infer<typeof projectSchema>;

export function parseGeneratedResume(
  value: unknown,
):
  | { success: true; data: GeneratedResume }
  | { success: false; error: string } {
  const parsed = generatedResumeSchema.safeParse(value);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { success: false, error: message || "Invalid resume JSON." };
  }
  return { success: true, data: parsed.data };
}

export function isNonEmptyResume(resume: GeneratedResume): boolean {
  return resume.experiences.length > 0 && resume.header.name.trim().length > 0;
}
