import { Hono } from "hono";
import { z } from "zod";
import { buildResumeDocxBuffer } from "@johel/resume/docx";
import { buildResumeDocxFileName, generatedResumeSchema, isNonEmptyResume } from "@johel/resume";
import { buildCombineGenerationFingerprint } from "../lib/resume/generation-fingerprint.js";
import { requireUser } from "../lib/session.js";

const DOCX_MEDIA_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const combineCompanySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  experienceIds: z.array(z.string().trim().min(1)).min(1),
});

const combineSchema = z.object({
  profileId: z.string().trim().min(1),
  language: z.enum(["en", "ja", "zh-TW", "zh-CN", "ko"]),
  emphasis: z.string().max(2000),
  companies: z.array(combineCompanySchema).min(1),
});

const docxPostSchema = z.object({
  resume: generatedResumeSchema,
  runLabel: z.string().trim().max(200).optional(),
});

const fingerprintPostSchema = z.object({
  combine: combineSchema,
});

export const resumeRoutes = new Hono();

resumeRoutes.post("/combine-fingerprint", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = fingerprintPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid combine snapshot." }, 400);
  }

  try {
    const fingerprint = await buildCombineGenerationFingerprint(
      user.id,
      parsed.data.combine,
    );
    return c.json({ fingerprint });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Combine fingerprint could not be built.";
    return c.json({ error: message }, 400);
  }
});

resumeRoutes.post("/docx", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = docxPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid resume data." }, 400);
  }

  const resume = parsed.data.resume;
  if (!isNonEmptyResume(resume)) {
    return c.json({ error: "Generated resume is empty." }, 400);
  }

  try {
    const buffer = await buildResumeDocxBuffer(resume);
    const fileName = buildResumeDocxFileName(
      resume,
      parsed.data.runLabel,
    );
    return c.body(buffer, 200, {
      "Content-Type": DOCX_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
  } catch {
    return c.json({ error: "DOCX generation failed." }, 500);
  }
});
